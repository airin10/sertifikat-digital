from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import uvicorn
import json
import os
import hashlib
import base64
from pathlib import Path
from datetime import datetime
import traceback 
import uuid

from app.config import MYSQL_CONFIG, UPLOAD_DIR, PRIVATE_KEY_PATH, PUBLIC_KEY_PATH
from app.database import get_db, engine, Base
from app.models import Certificate

from app.services.crypto import crypto_manager
from app.services.qr_handler import qr_manager
from app.services.image_handler import image_processor
from app.services.ocr_handler import ocr_manager 

from app.routers import auth, admin, participant, verify

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Digital Certificate System",
    description="Sistem Sertifikat Digital dengan EdDSA (Ed25519) + SHA-512 - Skripsi",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(UPLOAD_DIR)), name="static")

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(participant.router)
app.include_router(verify.router)


# ==========================================
# HELPERS
# ==========================================

def save_file(file_bytes: bytes, directory: str, filename: str) -> str:
    path = UPLOAD_DIR / directory / filename
    with open(path, "wb") as f:
        f.write(file_bytes)
    return str(path)

def generate_cert_id() -> str:
    """Generate unique certificate ID: CERT-YYYYMMDD-XXXXXX"""
    date_str = datetime.now().strftime('%Y%m%d')
    random_str = uuid.uuid4().hex[:6].upper()
    return f"CERT-{date_str}-{random_str}"

# ==========================================
# ENDPOINTS
# ==========================================

@app.get("/")
def root():
    return {
        "message": "Digital Certificate System API",
        "version": "1.0.0",
        "features": [
            "EdDSA (Ed25519) Digital Signature",
            "SHA-512 Hashing",
            "OCR Text Extraction",
            "QR Code Generation",
            "Role-based Access Control (Admin, Participant, Verifier)"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# ==========================================
# SIGN 
# ==========================================

@app.post("/api/sign")
async def sign_certificate(
    recipient_name: str = Form(...),
    recipient_email: str = Form(...),
    institution: str = Form(""),
    course_name: str = Form(""),
    issued_date: str = Form(...),
    qr_x: int = Form(100),
    qr_y: int = Form(100),
    qr_size: int = Form(150),
    certificate_image: UploadFile = File(...),
    template_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        print(f"\n{'='*60}")
        print(f"SIGNING CERTIFICATE for: {recipient_name}")
        print(f"{'='*60}")
        
        # Read files
        cert_bytes = await certificate_image.read()
        template_bytes = await template_file.read()
        
        # STEP 1: OCR → Text → Hash (SHA-512)
        raw_text, text_hash = ocr_manager.extract_text_and_hash(cert_bytes)
        
        if not raw_text:
            raise HTTPException(400, "OCR gagal membaca teks")
        
        print(f"OCR Result: {len(raw_text)} chars")
        print(f"SHA-512 Hash: {text_hash[:40]}...")
        
        # STEP 2: Generate cert_id
        cert_id = generate_cert_id()
        print(f"Generated cert_id: {cert_id}")
        
        # STEP 3: Sign dengan text_hash (string) dan cert_id
        sig_data = crypto_manager.sign_certificate(text_hash, cert_id)
        
        print(f"Signed: {sig_data['message'][:60]}...")
        
        # STEP 4: Generate QR Code 
        qr_payload = {
            "v": 1,                   
            "m": "ft",                 
            "h": text_hash,            
            "c": cert_id,              
            "s": sig_data["signature"], 
            "p": sig_data["public_key"], 
            "a": "Ed25519",           
            "t": datetime.utcnow().isoformat()  
        }
        
        qr_json = json.dumps(qr_payload, separators=(',', ':'))
        qr_bytes = qr_manager.generate_qr_code(qr_json)
        print(f"QR Code generated: {len(qr_json)} chars")
        
        # STEP 5: Save files
        qr_path = save_file(qr_bytes.getvalue(), "qrcodes", f"{cert_id}_qr.png")
        
        final_bytes = image_processor.add_qr_to_image(
            template_bytes, qr_bytes.getvalue(),
            {"x": qr_x, "y": qr_y}, qr_size
        )
        final_path = save_file(final_bytes, "certificates", f"{cert_id}_certificate.png")
        
        # STEP 6: Save to database
        db_cert = Certificate(
            certificate_id=cert_id,
            recipient_name=recipient_name,
            recipient_email=recipient_email,
            institution=institution,
            course_name=course_name,
            issued_date=issued_date,
            text_hash=text_hash,              
            raw_text=raw_text[:2000],           
            message=sig_data["message"],      
            signature=sig_data["signature"],
            public_key=sig_data["public_key"],
            qr_payload=qr_payload,
            qr_image_path=qr_path,
            final_certificate_path=final_path,
            template_path=save_file(template_bytes, "templates", template_file.filename),
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
            "recipient": {
                "name": recipient_name,
                "email": recipient_email
            },
            "signature": {
                "algorithm": "Ed25519",
                "hash_algorithm": "SHA-512",
                "hash_preview": text_hash[:40] + "..."
            },
            "files": {
                "certificate_url": f"/static/certificates/{cert_id}_certificate.png",
                "qr_url": f"/static/qrcodes/{cert_id}_qr.png"
            },
            "created_at": db_cert.created_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        raise HTTPException(500, f"Signing failed: {str(e)}")

# ==========================================
# VERIFY - Simplified
# ==========================================

@app.post("/api/verify")
async def verify_certificate(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Verify sertifikat - Simplified
    Hanya bandingkan hash OCR dengan hash di QR
    """
    try:
        file_bytes = await file.read()
        print(f"\n{'='*50}")
        print(f"🔍 VERIFYING CERTIFICATE")
        print(f"{'='*50}")
        
        # STEP 1: Decode QR
        decoded = qr_manager.decode_qr_from_image(file_bytes)
        if not decoded:
            return {
                "valid": False,
                "message": "QR Code tidak ditemukan dalam gambar",
                "step": "qr_decode"
            }
        
        try:
            qr_data = json.loads(decoded)
            print(f"QR Decoded")
        except json.JSONDecodeError:
            return {
                "valid": False,
                "message": "Format QR tidak valid",
                "step": "qr_parse"
            }
        
        # Extract data dari QR
        text_hash = qr_data.get("h")
        cert_id = qr_data.get("c")
        signature_b64 = qr_data.get("s")
        public_key_b64 = qr_data.get("p")
        
        if not all([text_hash, cert_id, signature_b64, public_key_b64]):
            missing = []
            if not text_hash: missing.append("h (hash)")
            if not cert_id: missing.append("c (cert_id)")
            if not signature_b64: missing.append("s (signature)")
            if not public_key_b64: missing.append("p (public_key)")
            return {
                "valid": False,
                "message": f"Data QR tidak lengkap: {', '.join(missing)}",
                "step": "qr_validation"
            }
        
        print(f"From QR:")
        print(f"Hash: {text_hash[:20]}...")
        print(f"Cert ID: {cert_id}")
        
        # STEP 2: Lookup database
        cert = db.query(Certificate).filter(
            Certificate.certificate_id == cert_id
        ).first()
        
        is_registered = cert is not None
        is_revoked = cert.is_revoked if cert else False
        
        if cert:
            recipient_name = cert.recipient_name
            print(f"Found in DB: {cert_id}")
        else:
            recipient_name = "Unknown"
            print(f"Not in database: {cert_id}")
        
        # STEP 3: OCR current image → Hash
        print(f"📸 OCR current image...")
        current_text, current_hash = ocr_manager.extract_text_and_hash(file_bytes)
        
        if not current_text:
            return {
                "valid": False,
                "message": "OCR gagal membaca sertifikat",
                "step": "ocr_failed"
            }
        
        print(f"Current OCR: {len(current_text)} chars")
        print(f"Current Hash: {current_hash[:20]}...")
        
        # STEP 4: Verify dengan crypto_manager
        verify_result = crypto_manager.verify_certificate(
            qr_data=qr_data,
            current_text_hash=current_hash
        )
        
        hash_match = verify_result.get("hash_match")
        signature_valid = verify_result.get("signature_valid")
        status = verify_result.get("status")
        
        print(f"Verification:")
        print(f"Status: {status}")
        print(f"Hash Match: {hash_match}")
        print(f"Signature Valid: {signature_valid}")
        
        # STEP 5: Final result
        is_valid = verify_result.get("valid", False) and not is_revoked
        
        # Log verification
        from app.models import VerificationLog
        log = VerificationLog(
            certificate_id=cert_id,
            text_hash=text_hash,
            verification_result=is_valid,
            details={
                "hash_match": hash_match,
                "signature_valid": signature_valid,
                "is_registered": is_registered,
                "is_revoked": is_revoked,
                "status": status
            }
        )
        db.add(log)
        db.commit()
        
        # Determine message
        if is_revoked:
            message = "Sertifikat telah dicabut (REVOKED)"
        elif not hash_match:
            message = "Hash tidak cocok! Sertifikat telah dimodifikasi."
        elif not signature_valid:
            message = "Signature tidak valid! Sertifikat palsu."
        else:
            message = "Sertifikat VALID dan terdaftar"
        
        print(f"{'='*50}")
        print(f"RESULT: {'VALID' if is_valid else 'INVALID'}")
        print(f"   {message}")
        print(f"{'='*50}\n")
        
        return {
            "valid": is_valid,
            "message": message,
            "certificate": {
                "id": cert_id,
                "recipient_name": recipient_name,
                "institution": cert.institution if cert else None,
                "course_name": cert.course_name if cert else None,
                "issued_date": cert.issued_date if cert else None,
                "registered": is_registered,
                "revoked": is_revoked
            } if is_registered else None,
            "integrity": {
                "hash_match": hash_match,
                "signature_valid": signature_valid,
                "stored_hash": text_hash[:20] + "...",
                "current_hash": current_hash[:20] + "..."
            },
            "verification_steps": {
                "qr_decode": True,
                "database_lookup": is_registered,
                "ocr_extract": True,
                "hash_compare": hash_match,
                "signature_verify": signature_valid,
                "revocation_check": not is_revoked
            }
        }
        
    except Exception as e:
        print(f"Verify error: {e}")
        traceback.print_exc()
        raise HTTPException(500, f"Verification failed: {str(e)}")

# ==========================================
# LIST & DOWNLOAD
# ==========================================

@app.get("/api/certificates")
async def list_certificates(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List semua sertifikat dari database"""
    certs = db.query(Certificate).offset(skip).limit(limit).all()
    
    return {
        "success": True,
        "count": len(certs),
        "certificates": [c.to_dict() for c in certs]
    }

@app.get("/api/certificates/{cert_id}/download")
async def download_certificate(
    cert_id: str,
    db: Session = Depends(get_db)
):
    """Download file sertifikat"""
    cert = db.query(Certificate).filter(
        Certificate.certificate_id == cert_id
    ).first()
    
    if not cert:
        raise HTTPException(404, "Sertifikat tidak ditemukan")
    
    if not os.path.exists(cert.final_certificate_path):
        raise HTTPException(404, "File sertifikat tidak ditemukan di server")
    
    return FileResponse(
        cert.final_certificate_path,
        media_type="image/png",
        filename=f"{cert_id}_certificate.png"
    )

# ==========================================
# MAIN
# ==========================================

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
