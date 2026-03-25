from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import json
import uuid
from datetime import datetime

from app.database import get_db
from app.models import User, UserRole, Certificate
from app.auth import get_current_admin, get_current_user
from app.services.crypto import crypto_manager
from app.services.qr_handler import qr_manager
from app.services.ocr_handler import ocr_manager
from app.services.image_handler import image_processor
from app.config import UPLOAD_DIR

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# ========== PARTICIPANT MANAGEMENT ==========

class ParticipantCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str

class ParticipantUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None

class ParticipantResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/participants", response_model=List[ParticipantResponse])
def list_participants(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    participants = db.query(User).filter(User.role == UserRole.PARTICIPANT).offset(skip).limit(limit).all()
    return participants

@router.post("/participants", response_model=ParticipantResponse)
def create_participant(
    request: ParticipantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    from auth import get_password_hash
    
    if db.query(User).filter(User.username == request.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    
    participant = User(
        username=request.username,
        email=request.email,
        hashed_password=get_password_hash(request.password),
        full_name=request.full_name,
        role=UserRole.PARTICIPANT
    )
    
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant

@router.get("/participants/{participant_id}", response_model=ParticipantResponse)
def get_participant(
    participant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    participant = db.query(User).filter(
        User.id == participant_id,
        User.role == UserRole.PARTICIPANT
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    return participant

@router.put("/participants/{participant_id}", response_model=ParticipantResponse)
def update_participant(
    participant_id: int,
    request: ParticipantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    participant = db.query(User).filter(
        User.id == participant_id,
        User.role == UserRole.PARTICIPANT
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    for field, value in request.dict(exclude_unset=True).items():
        setattr(participant, field, value)
    
    db.commit()
    db.refresh(participant)
    return participant

@router.delete("/participants/{participant_id}")
def delete_participant(
    participant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    participant = db.query(User).filter(
        User.id == participant_id,
        User.role == UserRole.PARTICIPANT
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    # Check if participant has certificates
    if participant.certificates:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete participant with existing certificates. Deactivate instead."
        )
    
    db.delete(participant)
    db.commit()
    return {"message": "Participant deleted successfully"}

# ========== CERTIFICATE MANAGEMENT ==========

class CertificateResponse(BaseModel):
    id: int
    certificate_id: str
    participant_id: int
    participant_name: str
    title: str
    institution: Optional[str]
    issued_date: Optional[str]
    is_revoked: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/certificates", response_model=List[CertificateResponse])
def list_all_certificates(
    skip: int = 0,
    limit: int = 100,
    participant_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    query = db.query(Certificate)
    
    if participant_id:
        query = query.filter(Certificate.participant_id == participant_id)
    
    certificates = query.offset(skip).limit(limit).all()
    
    result = []
    for cert in certificates:
        result.append({
            "id": cert.id,
            "certificate_id": cert.certificate_id,
            "participant_id": cert.participant_id,
            "participant_name": cert.participant.full_name if cert.participant else "Unknown",
            "title": cert.title,
            "institution": cert.institution,
            "issued_date": cert.issued_date,
            "is_revoked": cert.is_revoked,
            "created_at": cert.created_at
        })
    
    return result

@router.post("/certificates")
async def create_certificate(
    participant_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    institution: str = Form(""),
    issued_date: str = Form(...),
    qr_x: int = Form(100),
    qr_y: int = Form(100),
    qr_size: int = Form(150),
    certificate_image: UploadFile = File(...),
    template_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """UC02: Membuat QR Code + UC03: Generate Hash"""
    
    # Verify participant exists
    participant = db.query(User).filter(
        User.id == participant_id,
        User.role == UserRole.PARTICIPANT
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    # Read files
    cert_bytes = await certificate_image.read()
    template_bytes = await template_file.read()
    
    # STEP 1: OCR (Extract text)
    raw_text, text_hash = ocr_manager.extract_full_text(cert_bytes)
    if not raw_text:
        raise HTTPException(400, "OCR failed to extract text from certificate")
    
    print(f"✅ OCR Result: {len(raw_text)} chars, hash: {text_hash[:20]}...")
    
    # STEP 2: Generate cert_id DULU (sebelum sign!)
    cert_id = f"CERT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    print(f"✅ Generated cert_id: {cert_id}")
    
    # STEP 3: Sign dengan text_hash + cert_id (BUKAN metadata dict!)
    sig_data = crypto_manager.sign_full_text(text_hash, cert_id)  # ✅ FIXED: kirim cert_id string
    
    print(f"✅ Signed message: '{sig_data['message']}'")
    
    # STEP 4: Generate QR Code
    qr_payload = {
        "v": 1,
        "mode": "full_text",
        "h": text_hash,
        "cert_id": cert_id,  # ✅ cert_id yang sama
        "s": sig_data["signature"],
        "p": sig_data["public_key"]
    }
    qr_json = json.dumps(qr_payload, separators=(',', ':'))
    qr_bytes = qr_manager.generate_qr_code(qr_json)

    # STEP 4: Save files
    cert_id = qr_payload["cert_id"]
    
    import os
    qr_path = os.path.join(UPLOAD_DIR, "qrcodes", f"{cert_id}_qr.png")
    final_path = os.path.join(UPLOAD_DIR, "certificates", f"{cert_id}_final.png")
    template_path = os.path.join(UPLOAD_DIR, "templates", template_file.filename)
    
    os.makedirs(os.path.dirname(qr_path), exist_ok=True)
    
    with open(qr_path, "wb") as f:
        f.write(qr_bytes.getvalue())
    
    with open(template_path, "wb") as f:
        f.write(template_bytes)
    
    # STEP 5: Embed QR to template
    final_bytes = image_processor.add_qr_to_image(
        template_bytes, qr_bytes.getvalue(),
        {"x": qr_x, "y": qr_y}, qr_size
    )
    
    with open(final_path, "wb") as f:
        f.write(final_bytes)
    
    # STEP 6: Save to database
    db_cert = Certificate(
        certificate_id=cert_id,
        participant_id=participant_id,
        created_by=current_user.id,
        title=title,
        description=description,
        institution=institution,
        issued_date=issued_date,
        text_hash=text_hash,
        raw_text=raw_text[:2000],
        message=sig_data["message"],
        signature=sig_data["signature"],
        public_key=sig_data["public_key"],
        qr_payload=qr_payload,
        qr_image_path=qr_path,
        certificate_image_path=final_path,
        template_path=template_path,
        qr_x=qr_x, qr_y=qr_y, qr_size=qr_size
    )
    
    db.add(db_cert)
    db.commit()
    db.refresh(db_cert)
    
    return {
        "success": True,
        "certificate_id": cert_id,
        "message": "Certificate created successfully",
        "files": {
            "certificate_url": f"/static/certificates/{cert_id}_final.png",
            "qr_url": f"/static/qrcodes/{cert_id}_qr.png"
        }
    }
    

# @router.post("/certificates")
# async def create_certificate(
#     participant_id: int = Form(...),
#     title: str = Form(...),
#     description: str = Form(""),
#     institution: str = Form(""),
#     issued_date: str = Form(...),
#     qr_x: int = Form(100),
#     qr_y: int = Form(100),
#     qr_size: int = Form(150),
#     certificate_image: UploadFile = File(...),
#     template_file: UploadFile = File(...),
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_admin)
# ):
#     """UC02: Membuat QR Code + UC03: Generate Hash"""
    
#     # Verify participant exists
#     participant = db.query(User).filter(
#         User.id == participant_id,
#         User.role == UserRole.PARTICIPANT
#     ).first()
    
#     if not participant:
#         raise HTTPException(status_code=404, detail="Participant not found")
    
#     # Read files
#     cert_bytes = await certificate_image.read()
#     template_bytes = await template_file.read()
    
#     # STEP 1: OCR (Extract text)
#     raw_text, text_hash = ocr_manager.extract_full_text(cert_bytes)
#     if not raw_text:
#         raise HTTPException(400, "OCR failed to extract text from certificate")
    
#     # STEP 2: Generate Hash & Sign
#     metadata = {
#         "filename": certificate_image.filename,
#         "issued_date": issued_date,
#         "participant": participant.full_name
#     }
#     sig_data = crypto_manager.sign_full_text(text_hash, metadata)
    
#     # STEP 3: Generate QR Code
#     qr_payload = {
#         "v": 1,
#         "mode": "full_text",
#         "h": text_hash,
#         "cert_id": f"CERT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}",
#         "title": title,
#         "participant": participant.full_name,
#         "issued_date": issued_date,
#         "s": sig_data["signature"],
#         "p": sig_data["public_key"]
#     }
#     qr_json = json.dumps(qr_payload, separators=(',', ':'))
#     qr_bytes = qr_manager.generate_qr_code(qr_json)
    
#     # STEP 4: Save files
#     cert_id = qr_payload["cert_id"]
    
#     import os
#     qr_path = os.path.join(UPLOAD_DIR, "qrcodes", f"{cert_id}_qr.png")
#     final_path = os.path.join(UPLOAD_DIR, "certificates", f"{cert_id}_final.png")
#     template_path = os.path.join(UPLOAD_DIR, "templates", template_file.filename)
    
#     os.makedirs(os.path.dirname(qr_path), exist_ok=True)
    
#     with open(qr_path, "wb") as f:
#         f.write(qr_bytes.getvalue())
    
#     with open(template_path, "wb") as f:
#         f.write(template_bytes)
    
#     # STEP 5: Embed QR to template
#     final_bytes = image_processor.add_qr_to_image(
#         template_bytes, qr_bytes.getvalue(),
#         {"x": qr_x, "y": qr_y}, qr_size
#     )
    
#     with open(final_path, "wb") as f:
#         f.write(final_bytes)
    
#     # STEP 6: Save to database
#     db_cert = Certificate(
#         certificate_id=cert_id,
#         participant_id=participant_id,
#         created_by=current_user.id,
#         title=title,
#         description=description,
#         institution=institution,
#         issued_date=issued_date,
#         text_hash=text_hash,
#         raw_text=raw_text[:2000],
#         message=sig_data["message"],
#         signature=sig_data["signature"],
#         public_key=sig_data["public_key"],
#         qr_payload=qr_payload,
#         qr_image_path=qr_path,
#         certificate_image_path=final_path,
#         template_path=template_path,
#         qr_x=qr_x, qr_y=qr_y, qr_size=qr_size
#     )
    
#     db.add(db_cert)
#     db.commit()
#     db.refresh(db_cert)
    
#     return {
#         "success": True,
#         "certificate_id": cert_id,
#         "message": "Certificate created successfully",
#         "files": {
#             "certificate_url": f"/static/certificates/{cert_id}_final.png",
#             "qr_url": f"/static/qrcodes/{cert_id}_qr.png"
#         }
#     }

@router.delete("/certificates/{certificate_id}")
def delete_certificate(
    certificate_id: str,
    reason: str = "Deleted by admin",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """UC04: Menghapus Sertifikat (Soft Delete/Revoke)"""
    
    cert = db.query(Certificate).filter(Certificate.certificate_id == certificate_id).first()
    
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # Soft delete - mark as revoked
    cert.is_revoked = True
    cert.revoked_at = datetime.utcnow()
    cert.revoked_reason = reason
    
    db.commit()
    
    return {
        "message": "Certificate revoked successfully",
        "certificate_id": certificate_id,
        "revoked_at": cert.revoked_at
    }

@router.get("/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Dashboard statistics for admin"""
    
    total_participants = db.query(User).filter(User.role == UserRole.PARTICIPANT).count()
    total_certificates = db.query(Certificate).count()
    active_certificates = db.query(Certificate).filter(Certificate.is_revoked == False).count()
    revoked_certificates = db.query(Certificate).filter(Certificate.is_revoked == True).count()
    
    recent_certificates = db.query(Certificate).order_by(Certificate.created_at.desc()).limit(5).all()
    
    return {
        "total_participants": total_participants,
        "total_certificates": total_certificates,
        "active_certificates": active_certificates,
        "revoked_certificates": revoked_certificates,
        "recent_certificates": [
            {
                "id": c.certificate_id,
                "title": c.title,
                "participant": c.participant.full_name if c.participant else "Unknown",
                "created_at": c.created_at.isoformat()
            }
            for c in recent_certificates
        ]
    }