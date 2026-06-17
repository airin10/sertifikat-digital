from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from pydantic import BaseModel, Field, validator
import json
import uuid
import os
from datetime import datetime, timezone

from app.database import get_db
from app.models import User, UserRole, Certificate
from app.auth_service import get_current_admin, get_password_hash  
from app.services.crypto import crypto_manager
from app.services.qr_handler import qr_manager
from app.services.ocr_handler import ocr_manager
from app.services.image_handler import image_processor
from app.config import UPLOAD_DIR, CERTIFICATES_DIR, QRCODES_DIR  

router = APIRouter(prefix="/api/admin", tags=["Admin"])


class ParticipantCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2, max_length=100)


class ParticipantUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[str] = Field(None, pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    is_active: Optional[bool] = None


class ParticipantResponse(BaseModel):
    user_id: int
    username: str
    email: str
    full_name: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ========== PARTICIPANT MANAGEMENT ==========

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
    if db.query(User).filter(User.username == request.username).first():
        raise HTTPException(status_code=400, detail="Username sudah digunakan")
    
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email sudah digunakan")
    
    participant = User(
        username=request.username,
        email=request.email,
        password=get_password_hash(request.password),
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
        User.user_id == participant_id,
        User.role == UserRole.PARTICIPANT
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Peserta tidak ditemukan")
    
    return participant


@router.put("/participants/{participant_id}", response_model=ParticipantResponse)
def update_participant(
    participant_id: int,
    request: ParticipantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    participant = db.query(User).filter(
        User.user_id == participant_id,
        User.role == UserRole.PARTICIPANT
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Peserta tidak ditemukan")
    
    if request.username and request.username != participant.username:
        if db.query(User).filter(User.username == request.username).first():
            raise HTTPException(status_code=400, detail="Username sudah digunakan")
    
    if request.email and request.email != participant.email:
        if db.query(User).filter(User.email == request.email).first():
            raise HTTPException(status_code=400, detail="Email sudah digunakan")
    
    for field, value in request.model_dump(exclude_unset=True).items():
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
        User.user_id == participant_id,
        User.role == UserRole.PARTICIPANT
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Peserta tidak ditemukan")
    
    if participant.certificates:
        raise HTTPException(
            status_code=400,
            detail="Peserta tidak dapat dihapus karena masih memiliki sertifikat."
        )
    
    db.delete(participant)
    db.commit()
    return {"message": "Peserta berhasil dihapus"}


# ========== CERTIFICATE MANAGEMENT ==========

class CertificateResponse(BaseModel):
    id: int
    certificate_id: str
    participant_name: str
    title: str
    institution: Optional[str]
    issued_date: Optional[str]
    is_revoked: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/certificates", response_model=List[CertificateResponse])
def list_certificates(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """List sertifikat dengan filter dan search"""
    query = db.query(Certificate).join(User, Certificate.participant_id == User.user_id)
    
    if status == "active":
        query = query.filter(Certificate.is_revoked == False)
    elif status == "revoked":
        query = query.filter(Certificate.is_revoked == True)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Certificate.title.ilike(search_filter),
                Certificate.certificate_id.ilike(search_filter),
                User.full_name.ilike(search_filter),
                Certificate.institution.ilike(search_filter)
            )
        )
    
    certificates = query.order_by(Certificate.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for cert in certificates:
        result.append({
            "id": cert.id,
            "certificate_id": cert.certificate_id,
            "title": cert.title,
            "participant_name": cert.participant.full_name if cert.participant else "Unknown",
            "institution": cert.institution,
            "issued_date": cert.issued_date,
            "is_revoked": cert.is_revoked,
            "created_at": cert.created_at
        })
    
    return result


@router.post("/certificates/{certificate_id}/revoke")
def revoke_certificate(
    certificate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Cabut sertifikat"""
    cert = db.query(Certificate).filter(
        Certificate.certificate_id == certificate_id
    ).first()
    
    if not cert:
        raise HTTPException(404, "Sertifikat tidak ditemukan")
    
    if cert.is_revoked:
        raise HTTPException(400, "Sertifikat sudah dicabut sebelumnya")
    
    cert.is_revoked = True
    cert.revoked_at = datetime.now(timezone.utc)
    
    db.commit()
    
    return {"message": "Sertifikat berhasil dicabut", "certificate_id": certificate_id}


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


@router.post("/certificates/single-upload")
async def create_certificate_single_upload(
    participant_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    institution: str = Form(""),
    issued_date: str = Form(...),
    qr_x: int = Form(...),
    qr_y: int = Form(...),
    qr_size: int = Form(...),
    certificate_image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Create certificate dengan OCR, signing, dan QR embedding.
    """
    try:
        print(f"\n{'='*60}")
        print(f"Signing for participant {participant_id}")
        print(f"{'='*60}")
        
        cert_bytes = await certificate_image.read()
        
        if len(cert_bytes) > 10 * 1024 * 1024:
            raise HTTPException(400, "Ukuran file maksimal 10MB")
        
        img_info = image_processor.validate_image(cert_bytes)
        if not img_info["valid"]:
            raise HTTPException(400, f"Invalid image: {img_info.get('error')}")
        
        print(f"Image validated: {img_info['width']}x{img_info['height']}")
        
        if len(title) < 3 or len(title) > 200:
            raise HTTPException(400, "Judul harus 3-200 karakter")
        
        if qr_x < 0 or qr_y < 0:
            raise HTTPException(400, "Posisi QR tidak boleh negatif")
        
        if qr_size < 50 or qr_size > 500:
            raise HTTPException(400, "Ukuran QR harus 50-500 pixel")
        
        # STEP 1: OCR → Text → Hash (SHA-512)
        raw_text, text_hash = ocr_manager.extract_text_and_hash(cert_bytes)
        
        if not raw_text:
            raise HTTPException(400, "OCR gagal membaca teks dari sertifikat")
        
        print(f"OCR Result: {len(raw_text)} chars")
        print(f"SHA-512 Hash: {text_hash}...")
        
        # STEP 2: Generate cert_id
        cert_id = f"CERT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        print(f"Generated cert_id: {cert_id}")
        
        # STEP 3: Sign dengan EdDSA
        sig_data = crypto_manager.sign_certificate(text_hash, cert_id)
        print(f"Signed: {sig_data['message'][:60]}...")
        
        # STEP 4: Generate QR Code
        qr_payload = {
            "h": text_hash,
            "c": cert_id,
            "s": sig_data["signature"],
            "p": sig_data["public_key"],
            "t": datetime.now(timezone.utc).isoformat()
        }
        
        qr_json = json.dumps(qr_payload, separators=(',', ':'))
        qr_bytes = qr_manager.generate_qr_code(qr_json)
        print(f"QR Code generated: {len(qr_json)} chars")
        
        # STEP 5: Embed QR
        img_width, img_height = img_info["width"], img_info["height"]
        if qr_x + qr_size > img_width or qr_y + qr_size > img_height:
            raise HTTPException(400, f"QR position ({qr_x},{qr_y}) size {qr_size} exceeds image bounds ({img_width}x{img_height})")
        
        final_bytes = image_processor.add_qr_to_image(
            cert_bytes,
            qr_bytes.getvalue(),
            {"x": qr_x, "y": qr_y},
            qr_size
        )
        print(f"QR embedded at ({qr_x}, {qr_y}) size {qr_size}")
        
        # STEP 6: Save files
        qr_filename = f"{cert_id}_qr.png"
        qr_path = os.path.join(QRCODES_DIR, qr_filename)  
        os.makedirs(os.path.dirname(qr_path), exist_ok=True)
        with open(qr_path, "wb") as f:
            f.write(qr_bytes.getvalue())
        
        final_filename = f"{cert_id}_final.png"
        final_path = os.path.join(CERTIFICATES_DIR, final_filename)  
        with open(final_path, "wb") as f:
            f.write(final_bytes)
        
        print(f"Files saved")
        
        # STEP 7: Save to database
        db_cert = Certificate(
            certificate_id=cert_id,
            participant_id=participant_id,
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
            final_certificate_path=final_path,
            qr_x=qr_x, qr_y=qr_y, qr_size=qr_size
        )
        
        db.add(db_cert)
        db.commit()
        db.refresh(db_cert)
        
        print(f"Saved to database: ID={db_cert.id}")
        print(f"{'='*60}\n")
        
        return {
            "success": True,
            "certificate_id": cert_id,
            "database_id": db_cert.id,
            "message": "Sertifikat berhasil dibuat",
            "hash_algorithm": "SHA-512",
            "signature_algorithm": "Ed25519",
            "files": {
                "certificate_url": f"/static/certificates/{final_filename}",
                "qr_url": f"/static/qrcodes/{qr_filename}"
            },
            "qr_position": {
                "x": qr_x,
                "y": qr_y,
                "size": qr_size
            },
            "created_at": db_cert.created_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, "Terjadi kesalahan internal server")  


@router.post("/utils/ocr-preview")
async def ocr_preview(image: UploadFile = File(...)):
    try:
        contents = await image.read()
        raw_text, text_hash = ocr_manager.extract_text_and_hash(contents)
        
        return {
            "success": bool(raw_text),
            "text": raw_text or "",
            "hash": text_hash or "",
            "preview": (raw_text[:200] + "...") if raw_text and len(raw_text) > 200 else (raw_text or "Tidak diteksi ada teks"),
            "is_mock": not ocr_manager.is_available
        }
    except Exception as e:
        raise HTTPException(500, f"OCR error: {str(e)}")
    
    
    
# from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
# from sqlalchemy.orm import Session
# from sqlalchemy import or_
# from typing import List, Optional
# from pydantic import BaseModel
# import json
# import uuid
# import os
# from datetime import datetime, timezone

# from app.database import get_db
# from app.models import User, UserRole, Certificate
# from app.auth_service import get_current_admin, get_current_user
# from app.services.crypto import crypto_manager
# from app.services.qr_handler import qr_manager
# from app.services.ocr_handler import ocr_manager
# from app.services.image_handler import image_processor
# from app.config import UPLOAD_DIR
# from app.routers.auth import get_password_hash

# router = APIRouter(prefix="/api/admin", tags=["Admin"])

# class ParticipantCreate(BaseModel):
#     username: str
#     email: str
#     password: str
#     full_name: str

# class ParticipantUpdate(BaseModel):
#     username: Optional[str] = None
#     email: Optional[str] = None
#     full_name: Optional[str] = None
#     is_active: Optional[bool] = None

# class ParticipantResponse(BaseModel):
#     user_id: int
#     username: str
#     email: str
#     full_name: str
#     is_active: bool
#     created_at: datetime
    
#     class Config:
#         from_attributes = True

# # ========== PARTICIPANT MANAGEMENT ==========

# @router.get("/participants", response_model=List[ParticipantResponse])
# def list_participants(
#     skip: int = 0,
#     limit: int = 100,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_admin)
# ):
#     participants = db.query(User).filter(User.role == UserRole.PARTICIPANT).offset(skip).limit(limit).all()
#     return participants

# @router.post("/participants", response_model=ParticipantResponse)
# def create_participant(
#     request: ParticipantCreate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_admin)
# ):
    
#     if db.query(User).filter(User.username == request.username).first():
#         raise HTTPException(status_code=400, detail="Username sudah digunakan")
    
#     participant = User(
#         username=request.username,
#         email=request.email,
#         password=get_password_hash(request.password),
#         full_name=request.full_name,
#         role=UserRole.PARTICIPANT
#     )
    
#     db.add(participant)
#     db.commit()
#     db.refresh(participant)
#     return participant

# @router.get("/participants/{participant_id}", response_model=ParticipantResponse)
# def get_participant(
#     participant_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_admin)
# ):
#     participant = db.query(User).filter(
#         User.user_id == participant_id,
#         User.role == UserRole.PARTICIPANT
#     ).first()
    
#     if not participant:
#         raise HTTPException(status_code=404, detail="Peserta tidak ditemukan")
    
#     return participant

# @router.put("/participants/{participant_id}", response_model=ParticipantResponse)
# def update_participant(
#     participant_id: int,
#     request: ParticipantUpdate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_admin)
# ):
#     participant = db.query(User).filter(
#         User.user_id == participant_id,
#         User.role == UserRole.PARTICIPANT
#     ).first()
    
#     if not participant:
#         raise HTTPException(status_code=404, detail="Peserta tidak ditemukan")
    
#     for field, value in request.dict(exclude_unset=True).items():
#         setattr(participant, field, value)
    
#     db.commit()
#     db.refresh(participant)
#     return participant

# @router.delete("/participants/{participant_id}")
# def delete_participant(
#     participant_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_admin)
# ):
#     participant = db.query(User).filter(
#         User.user_id == participant_id,
#         User.role == UserRole.PARTICIPANT
#     ).first()
    
#     if not participant:
#         raise HTTPException(status_code=404, detail="Peserta tidak ditemukan")
    
#     if participant.certificates:
#         raise HTTPException(
#             status_code=400,
#             detail="Peserta tidak dapat dihapus karena masih memiliki sertifikat."
#         )
    
#     db.delete(participant)
#     db.commit()
#     return {"message": "Peserta berhasil dihapus"}

# # ========== CERTIFICATE MANAGEMENT ==========

# class CertificateResponse(BaseModel):
#     id: int
#     certificate_id: str
#     participant_name: str
#     title: str
#     institution: Optional[str]
#     issued_date: Optional[str]
#     is_revoked: bool
#     created_at: datetime
    
#     class Config:
#         from_attributes = True

# @router.get("/certificates", response_model=List[CertificateResponse])
# def list_certificates(
#     skip: int = 0,
#     limit: int = 100,
#     search: Optional[str] = None,  
#     status: Optional[str] = None, 
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_admin)
# ):
#     """List sertifikat dengan filter dan search"""
#     query = db.query(Certificate).join(User, Certificate.participant_id == User.user_id)
    
#     # Filter by status
#     if status == "active":
#         query = query.filter(Certificate.is_revoked == False)
#     elif status == "revoked":
#         query = query.filter(Certificate.is_revoked == True)
    
#     # Search
#     if search:
#         search_filter = f"%{search}%"
#         query = query.filter(
#             or_(
#                 Certificate.title.ilike(search_filter),
#                 Certificate.certificate_id.ilike(search_filter),
#                 User.full_name.ilike(search_filter),
#                 Certificate.institution.ilike(search_filter)
#             )
#         )
    
#     certificates = query.order_by(Certificate.created_at.desc()).offset(skip).limit(limit).all()
    
#     # Format response
#     result = []
#     for cert in certificates:
#         result.append({
#             "id": cert.id,
#             "certificate_id": cert.certificate_id,
#             "title": cert.title,
#             "participant_name": cert.participant.full_name if cert.participant else "Unknown",
#             "institution": cert.institution,
#             "issued_date": cert.issued_date,
#             "is_revoked": cert.is_revoked,
#             "created_at": cert.created_at
#         })
    
#     return result


# @router.post("/certificates/{certificate_id}/revoke")
# def revoke_certificate(
#     certificate_id: str,
#     reason: Optional[str] = "Dibatalkan oleh admin",
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_admin)
# ):
#     """Cabut sertifikat"""
#     cert = db.query(Certificate).filter(
#         Certificate.certificate_id == certificate_id
#     ).first()
    
#     if not cert:
#         raise HTTPException(404, "Sertifikat tidak ditemukan")
    
#     if cert.is_revoked:
#         raise HTTPException(400, "Sertifikat sudah dicabut sebelumnya")
    
#     cert.is_revoked = True
#     cert.revoked_at = datetime.now(timezone.utc)
    
#     db.commit()
    
#     return {"message": "Sertifikat berhasil dicabut", "certificate_id": certificate_id}


# @router.get("/dashboard/stats")
# def get_dashboard_stats(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_admin)
# ):
#     """Dashboard statistics for admin"""
#     total_participants = db.query(User).filter(User.role == UserRole.PARTICIPANT).count()
#     total_certificates = db.query(Certificate).count()
#     active_certificates = db.query(Certificate).filter(Certificate.is_revoked == False).count()
#     revoked_certificates = db.query(Certificate).filter(Certificate.is_revoked == True).count()
    
#     recent_certificates = db.query(Certificate).order_by(Certificate.created_at.desc()).limit(5).all()
    
#     return {
#         "total_participants": total_participants,
#         "total_certificates": total_certificates,
#         "active_certificates": active_certificates,
#         "revoked_certificates": revoked_certificates,
#         "recent_certificates": [
#             {
#                 "id": c.certificate_id,
#                 "title": c.title,
#                 "participant": c.participant.full_name if c.participant else "Unknown",
#                 "created_at": c.created_at.isoformat()
#             }
#             for c in recent_certificates
#         ]
#     }

# @router.post("/certificates/single-upload")
# async def create_certificate_single_upload(
#     participant_id: int = Form(...),
#     title: str = Form(...),
#     description: str = Form(""),
#     institution: str = Form(""),
#     issued_date: str = Form(...),
#     qr_x: int = Form(...),
#     qr_y: int = Form(...),
#     qr_size: int = Form(...),
#     certificate_image: UploadFile = File(...),
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_admin)
# ):
#     """
#     - Upload 1 gambar
#     - OCR ekstrak teks
#     - Hash SHA-512
#     - Sign Ed25519
#     - Generate QR
#     - Tempel QR ke posisi yang dipilih di gambar yang sama
#     """
#     try:
#         print(f"\n{'='*60}")
#         print(f"Signing for participant {participant_id}")
#         print(f"{'='*60}")
        
#         # Read certificate image
#         cert_bytes = await certificate_image.read()
        
#         # Validate image
#         img_info = image_processor.validate_image(cert_bytes)
#         if not img_info["valid"]:
#             raise HTTPException(400, f"Invalid image: {img_info.get('error')}")
        
#         print(f"Image validated: {img_info['width']}x{img_info['height']}")
        
#         # STEP 1: OCR → Text → Hash (SHA-512)
#         raw_text, text_hash = ocr_manager.extract_text_and_hash(cert_bytes)
        
#         if not raw_text:
#             raise HTTPException(400, "OCR gagal membaca teks dari sertifikat")
        
#         print(f"OCR Result: {len(raw_text)} chars")
#         print(f"Current text: {raw_text}")
#         print(f"SHA-512 Hash: {text_hash}...")
        
#         # STEP 2: Generate cert_id
#         cert_id = f"CERT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
#         print(f"Generated cert_id: {cert_id}")
        
#         # STEP 3: Sign dengan EdDSA
#         sig_data = crypto_manager.sign_certificate(text_hash, cert_id)
#         print(f"Signed: {sig_data['message'][:60]}...")
        
#         # STEP 4: Generate QR Code
#         qr_payload = {
#             # "v": 1,                    
#             # "m": "ft",                
#             "h": text_hash,           
#             "c": cert_id,             
#             "s": sig_data["signature"],
#             "p": sig_data["public_key"], 
#             # "a": "Ed25519",          
#             "t": datetime.now(timezone.utc).isoformat()
#         }
        
#         qr_json = json.dumps(qr_payload, separators=(',', ':'))
#         qr_bytes = qr_manager.generate_qr_code(qr_json)
#         print(f"QR Code generated: {len(qr_json)} chars")
        
#         # STEP 5: Embed QR
#         img_width, img_height = img_info["width"], img_info["height"]
#         if qr_x + qr_size > img_width or qr_y + qr_size > img_height:
#             raise HTTPException(400, f"QR position ({qr_x},{qr_y}) size {qr_size} exceeds image bounds ({img_width}x{img_height})")
        
#         if qr_x < 0 or qr_y < 0:
#             raise HTTPException(400, "QR position cannot be negative")
        
#         final_bytes = image_processor.add_qr_to_image(
#             cert_bytes,          
#             qr_bytes.getvalue(),
#             {"x": qr_x, "y": qr_y},
#             qr_size
#         )
#         print(f"QR embedded at ({qr_x}, {qr_y}) size {qr_size}")
        
#         # STEP 6: Save files
#         # Simpan QR standalone
#         import os
#         qr_filename = f"{cert_id}_qr.png"
#         qr_path = os.path.join(UPLOAD_DIR, "qrcodes", qr_filename)
#         os.makedirs(os.path.dirname(qr_path), exist_ok=True)
#         with open(qr_path, "wb") as f:
#             f.write(qr_bytes.getvalue())
        
#         # Simpan sertifikat final (dengan QR)
#         final_filename = f"{cert_id}_final.png"
#         final_path = os.path.join(UPLOAD_DIR, "certificates", final_filename)
#         with open(final_path, "wb") as f:
#             f.write(final_bytes)
        
#         # Simpan original (ini nanti dibuang)
#         original_filename = f"{cert_id}_original.png"
#         original_path = os.path.join(UPLOAD_DIR, "originals", original_filename)
#         os.makedirs(os.path.dirname(original_path), exist_ok=True)
#         with open(original_path, "wb") as f:
#             f.write(cert_bytes)
        
#         print(f"Files saved")
        
#         # STEP 7: Save to database
#         db_cert = Certificate(
#             certificate_id=cert_id,
#             participant_id=participant_id,
#             # created_by=current_user.user_id,
#             title=title,
#             description=description,
#             institution=institution,
#             issued_date=issued_date,
#             text_hash=text_hash,              
#             raw_text=raw_text[:2000],        
#             message=sig_data["message"],     
#             signature=sig_data["signature"],
#             public_key=sig_data["public_key"],
#             qr_payload=qr_payload,
#             qr_image_path=qr_path,
#             final_certificate_path=final_path,
#             original_path=original_path,   #apa mau dibuang?    
#             qr_x=qr_x, qr_y=qr_y, qr_size=qr_size
#         )
        
#         db.add(db_cert)
#         db.commit()
#         db.refresh(db_cert)
        
#         print(f"Saved to database: ID={db_cert.id}")
#         print(f"{'='*60}\n")
        
#         return {
#             "success": True,
#             "certificate_id": cert_id,
#             "database_id": db_cert.id,
#             "message": "Sertifikat berhasil dibuat",
#             "hash_algorithm": "SHA-512",
#             "signature_algorithm": "Ed25519",
#             "files": {
#                 "certificate_url": f"/static/certificates/{final_filename}",
#                 "qr_url": f"/static/qrcodes/{qr_filename}",
#                 "original_url": f"/static/originals/{original_filename}" 
#             },
#             "qr_position": {
#                 "x": qr_x,
#                 "y": qr_y,
#                 "size": qr_size
#             },
#             "created_at": db_cert.created_at.isoformat()
#         }
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error: {e}")
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(500, f"Terjadi kesalahan: {str(e)}")
    
# @router.post("/utils/ocr-preview")
# async def ocr_preview(image: UploadFile = File(...)):
#     try:
#         contents = await image.read()
#         raw_text, text_hash = ocr_manager.extract_text_and_hash(contents)
        
#         return {
#             "success": bool(raw_text),
#             "text": raw_text or "",
#             "hash": text_hash or "",
#             "preview": (raw_text[:200] + "...") if raw_text and len(raw_text) > 200 else (raw_text or "Tidak diteksi ada teks"),
#             "is_mock": not ocr_manager.is_available
#         }
#     except Exception as e:
#         raise HTTPException(500, f"OCR error: {str(e)}")
    