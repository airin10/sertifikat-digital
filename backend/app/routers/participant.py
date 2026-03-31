from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.database import get_db
from app.models import User, Certificate, UserRole
from app.auth import get_current_participant, get_current_user

router = APIRouter(prefix="/api/participant", tags=["Participant"])

class CertificateListItem(BaseModel):
    id: int
    certificate_id: str
    title: str
    institution: str
    issued_date: str
    is_revoked: bool
    download_url: str
    
    class Config:
        from_attributes = True

class CertificateDetail(BaseModel):
    id: int
    certificate_id: str
    title: str
    description: str
    institution: str
    issued_date: str
    qr_payload: dict
    is_revoked: bool
    created_at: str
    download_url: str
    
    class Config:
        from_attributes = True

@router.get("/certificates", response_model=List[CertificateListItem])
def get_my_certificates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_participant)
):
    certificates = db.query(Certificate).filter(
        Certificate.participant_id == current_user.id
    ).order_by(Certificate.created_at.desc()).all()
    
    result = []
    for cert in certificates:
        result.append({
            "id": cert.id,
            "certificate_id": cert.certificate_id,
            "title": cert.title,
            "institution": cert.institution,
            "issued_date": cert.issued_date,
            "is_revoked": cert.is_revoked,
            "download_url": f"/static/certificates/{cert.certificate_id}_final.png"
        })
    
    return result

@router.get("/certificates/{certificate_id}", response_model=CertificateDetail)
def get_certificate_detail(
    certificate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_participant)
):
    cert = db.query(Certificate).filter(
        Certificate.certificate_id == certificate_id,
        Certificate.participant_id == current_user.id
    ).first()
    
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    return {
        "id": cert.id,
        "certificate_id": cert.certificate_id,
        "title": cert.title,
        "description": cert.description,
        "institution": cert.institution,
        "issued_date": cert.issued_date,
        "qr_payload": cert.qr_payload,
        "is_revoked": cert.is_revoked,
        "created_at": cert.created_at.isoformat(),
        "download_url": f"/static/certificates/{cert.certificate_id}_final.png"
    }

@router.get("/certificates/{certificate_id}/download")
def download_certificate(
    certificate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_participant)
):
    from fastapi.responses import FileResponse
    import os
    
    cert = db.query(Certificate).filter(
        Certificate.certificate_id == certificate_id,
        Certificate.participant_id == current_user.id
    ).first()
    
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    if cert.is_revoked:
        raise HTTPException(status_code=403, detail="This certificate has been revoked")
    
    if not os.path.exists(cert.final_certificate_path):
        raise HTTPException(status_code=404, detail="Certificate file not found")
    
    return FileResponse(
        cert.final_certificate_path,
        media_type="image/png",
        filename=f"{certificate_id}_certificate.png"
    )

@router.get("/profile")
def get_profile(
    current_user: User = Depends(get_current_participant)
):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }