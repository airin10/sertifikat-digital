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

# @app.get("/api/public-key")
# async def get_public_key():
#     """Get public key info untuk verifikasi"""
#     return crypto_manager.get_public_key_info()

# @app.post("/api/extract-text")
# async def extract_text(file: UploadFile = File(...)):
#     """Preview OCR sebelum sign - Simplified"""
#     try:
#         file_bytes = await file.read()
        
#         # ✅ SIMPLIFIED: Hanya extract text dan hash
#         raw_text, text_hash = ocr_manager.extract_text_and_hash(file_bytes)
        
#         if not raw_text:
#             return {"success": False, "message": "OCR gagal"}
        
#         return {
#             "success": True,
#             "text": raw_text,
#             "hash_sha512": text_hash,
#             "hash_preview": text_hash[:40] + "...",
#             "preview": raw_text[:500] + "..." if len(raw_text) > 500 else raw_text,
#             "is_mock": "[MOCK]" in raw_text
#         }
#     except Exception as e:
#         raise HTTPException(500, f"OCR error: {str(e)}")

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
    """
    Sign sertifikat dengan Ed25519 + SHA-512
    """
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
        
        # ✅ STEP 1: Decode QR
        decoded = qr_manager.decode_qr_from_image(file_bytes)
        if not decoded:
            return {
                "valid": False,
                "message": "QR Code tidak ditemukan dalam gambar",
                "step": "qr_decode"
            }
        
        try:
            qr_data = json.loads(decoded)
            print(f"✅ QR Decoded")
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
        
        print(f"✅ From QR:")
        print(f"   Hash: {text_hash[:20]}...")
        print(f"   Cert ID: {cert_id}")
        
        # ✅ STEP 2: Lookup database
        cert = db.query(Certificate).filter(
            Certificate.certificate_id == cert_id
        ).first()
        
        is_registered = cert is not None
        is_revoked = cert.is_revoked if cert else False
        
        if cert:
            recipient_name = cert.recipient_name
            print(f"✅ Found in DB: {cert_id}")
        else:
            recipient_name = "Unknown"
            print(f"⚠️ Not in database: {cert_id}")
        
        # ✅ STEP 3: OCR current image → Hash
        print(f"📸 OCR current image...")
        current_text, current_hash = ocr_manager.extract_text_and_hash(file_bytes)
        
        if not current_text:
            return {
                "valid": False,
                "message": "OCR gagal membaca sertifikat",
                "step": "ocr_failed"
            }
        
        print(f"✅ Current OCR: {len(current_text)} chars")
        print(f"✅ Current Hash: {current_hash[:20]}...")
        
        # ✅ STEP 4: Verify dengan crypto_manager
        verify_result = crypto_manager.verify_certificate(
            qr_data=qr_data,
            current_text_hash=current_hash
        )
        
        hash_match = verify_result.get("hash_match")
        signature_valid = verify_result.get("signature_valid")
        status = verify_result.get("status")
        
        print(f"🔐 Verification:")
        print(f"   Status: {status}")
        print(f"   Hash Match: {hash_match}")
        print(f"   Signature Valid: {signature_valid}")
        
        # ✅ STEP 5: Final result
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
        print(f"📊 RESULT: {'✅ VALID' if is_valid else '❌ INVALID'}")
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
        print(f"❌ Verify error: {e}")
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


# from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse, FileResponse
# from fastapi.staticfiles import StaticFiles
# from sqlalchemy.orm import Session
# import uvicorn
# import json
# import os
# from pathlib import Path
# from datetime import datetime
# import traceback 
# import base64
# import uuid

# # Import config & database
# from app.config import MYSQL_CONFIG, UPLOAD_DIR, PRIVATE_KEY_PATH, PUBLIC_KEY_PATH
# from app.database import get_db, engine, Base
# from app.models import Certificate

# # Import services
# from app.services.crypto import crypto_manager
# from app.services.qr_handler import qr_manager
# from app.services.image_handler import image_processor
# from app.services.ocr_handler import ocr_manager 

# from app.routers import auth, admin, participant, verify

# # Create tables
# Base.metadata.create_all(bind=engine)

# app = FastAPI(
#     title="Digital Certificate System",
#     description="Sistem Sertifikat Digital dengan EdDSA - Skripsi",
#     version="1.0.0"
# )

# # CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Static files
# app.mount("/static", StaticFiles(directory=str(UPLOAD_DIR)), name="static")

# # Include routers
# app.include_router(auth.router)
# app.include_router(admin.router)
# app.include_router(participant.router)
# app.include_router(verify.router)


# # ==========================================
# # HELPERS
# # ==========================================

# def save_file(file_bytes: bytes, directory: str, filename: str) -> str:
#     path = UPLOAD_DIR / directory / filename
#     with open(path, "wb") as f:
#         f.write(file_bytes)
#     return str(path)

# def generate_cert_id() -> str:
#     """Generate unique certificate ID: CERT-YYYYMMDD-XXXXXX"""
#     date_str = datetime.now().strftime('%Y%m%d')
#     random_str = uuid.uuid4().hex[:6].upper()
#     return f"CERT-{date_str}-{random_str}"

# # def generate_cert_id() -> str:
# #     return f"CERT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

# # ==========================================
# # ENDPOINTS
# # ==========================================

# @app.get("/")
# def root():
#     return {
#         "message": "Digital Certificate System API",
#         "version": "1.0.0",
#         "features": [
#             "EdDSA (Ed25519) Digital Signature",
#             "SHA-256 Hashing",
#             "OCR Text Extraction",
#             "QR Code Generation",
#             "Role-based Access Control (Admin, Participant, Verifier)"
#         ]
#     }

# @app.get("/health")
# def health_check():
#     return {"status": "healthy"}

# @app.get("/api/public-key")
# async def get_public_key():
#     return crypto_manager.get_public_key_info()

# @app.post("/api/extract-text")
# async def extract_text(file: UploadFile = File(...)):
#     """Preview OCR sebelum sign"""
#     try:
#         file_bytes = await file.read()
#         raw_text, text_hash = ocr_manager.extract_full_text(file_bytes)
        
#         if not raw_text:
#             return {"success": False, "message": "OCR gagal"}
        
#         return {
#             "success": True,
#             "text": raw_text,
#             "hash": text_hash,
#             "preview": raw_text[:500] + "..." if len(raw_text) > 500 else raw_text,
#             "is_mock": "[MOCK]" in raw_text
#         }
#     except Exception as e:
#         raise HTTPException(500, f"OCR error: {str(e)}")

# # ==========================================
# # SIGN - AUTO OCR dengan DATABASE
# # ==========================================


# @app.post("/api/sign")
# async def sign_certificate(
#     recipient_name: str = Form(...),
#     recipient_email: str = Form(...),
#     institution: str = Form(""),
#     course_name: str = Form(""),
#     issued_date: str = Form(...),
#     qr_x: int = Form(100),
#     qr_y: int = Form(100),
#     qr_size: int = Form(150),
#     certificate_image: UploadFile = File(...),
#     template_file: UploadFile = File(...),
#     db: Session = Depends(get_db)
# ):
#     """
#     Sign sertifikat dengan format: text_hash=xxx|cert_id=yyy
#     """
#     try:
#         print(f"\n{'='*50}")
#         print(f"📝 SIGNING CERTIFICATE for: {recipient_name}")
#         print(f"{'='*50}")
        
#         # Read files
#         cert_bytes = await certificate_image.read()
#         template_bytes = await template_file.read()
        
#         # STEP 1: OCR
#         raw_text, text_hash = ocr_manager.extract_full_text(cert_bytes)
#         if not raw_text:
#             raise HTTPException(400, "OCR gagal membaca teks")
        
#         print(f"✅ OCR Result:")
#         print(f"   Text length: {len(raw_text)} chars")
#         print(f"   Text hash: {text_hash}")
        
#         # STEP 2: Generate cert_id (UNIQUE per sertifikat)
#         cert_id = generate_cert_id()
#         print(f"✅ Generated cert_id: {cert_id}")
        
#         # STEP 3: Sign dengan text_hash + cert_id
#         sig_data = crypto_manager.sign_full_text(text_hash, cert_id)
#         print(f"✅ Signing complete:")
#         print(f"   Message: '{sig_data['message']}'")
#         print(f"   Signature: {sig_data['signature'][:30]}...")
        
#         # STEP 4: Generate QR Code
#         qr_payload = {
#             "v": 1,                          # Version
#             "mode": "full_text",             # Mode
#             "h": text_hash,                  # Hash dari OCR text
#             "cert_id": cert_id,                  # ✅ Certificate ID (singkat)
#             "s": sig_data["signature"],      # Signature (Base64)
#             "p": sig_data["public_key"]      # Public Key (Base64)
#         }
#         qr_json = json.dumps(qr_payload, separators=(',', ':'))
#         qr_bytes = qr_manager.generate_qr_code(qr_json)
#         print(f"✅ QR Code generated")
        
#         # STEP 5: Save files
#         qr_path = save_file(qr_bytes.getvalue(), "qrcodes", f"{cert_id}_qr.png")
        
#         final_bytes = image_processor.add_qr_to_image(
#             template_bytes, qr_bytes.getvalue(),
#             {"x": qr_x, "y": qr_y}, qr_size
#         )
#         final_path = save_file(final_bytes, "certificates", f"{cert_id}_certificate.png")
        
#         # STEP 6: Save to database
#         db_cert = Certificate(
#             certificate_id=cert_id,
#             recipient_name=recipient_name,
#             recipient_email=recipient_email,
#             institution=institution,
#             course_name=course_name,
#             issued_date=issued_date,
#             text_hash=text_hash,
#             raw_text=raw_text[:2000],
#             message=sig_data["message"],           # ✅ "text_hash=xxx|cert_id=yyy"
#             signature=sig_data["signature"],
#             public_key=sig_data["public_key"],
#             qr_payload=qr_payload,
#             qr_image_path=qr_path,
#             final_certificate_path=final_path,
#             template_path=save_file(template_bytes, "templates", template_file.filename),
#             qr_x=qr_x, qr_y=qr_y, qr_size=qr_size
#         )
        
#         db.add(db_cert)
#         db.commit()
#         db.refresh(db_cert)
        
#         print(f"✅ Saved to database:")
#         print(f"   DB ID: {db_cert.id}")
#         print(f"   Certificate ID: {cert_id}")
#         print(f"{'='*50}\n")
        
#         return {
#             "success": True,
#             "certificate_id": cert_id,
#             "database_id": db_cert.id,
#             "recipient": {
#                 "name": recipient_name,
#                 "email": recipient_email
#             },
#             "signature": {
#                 "message": sig_data["message"],
#                 "algorithm": "Ed25519",
#                 "format": "text_hash|cert_id"
#             },
#             "files": {
#                 "certificate_url": f"/static/certificates/{cert_id}_certificate.png",
#                 "qr_url": f"/static/qrcodes/{cert_id}_qr.png"
#             },
#             "created_at": db_cert.created_at.isoformat()
#         }
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"❌ Error: {e}")
#         traceback.print_exc()
#         raise HTTPException(500, f"Signing failed: {str(e)}")
    

# # @app.post("/api/sign")
# # async def sign_certificate(
# #     recipient_name: str = Form(...),
# #     recipient_email: str = Form(...),
# #     institution: str = Form(""),
# #     course_name: str = Form(""),
# #     issued_date: str = Form(...),
# #     qr_x: int = Form(100),
# #     qr_y: int = Form(100),
# #     qr_size: int = Form(150),
# #     certificate_image: UploadFile = File(...),
# #     template_file: UploadFile = File(...),
# #     db: Session = Depends(get_db)
# # ):
# #     """
# #     Sign sertifikat: Auto OCR → Hash → Sign → Save DB
# #     Message format: hanya text_hash, tanpa filename dan issued_date
# #     """
# #     try:
# #         print(f"📝 Signing for: {recipient_name}")
        
# #         # Read files
# #         cert_bytes = await certificate_image.read()
# #         template_bytes = await template_file.read()
        
# #         # STEP 1: OCR
# #         raw_text, text_hash = ocr_manager.extract_full_text(cert_bytes)
# #         if not raw_text:
# #             raise HTTPException(400, "OCR gagal membaca teks")
        
# #         print(f"   ✓ OCR: {len(raw_text)} chars, hash: {text_hash[:16]}...")
        
# #         # STEP 2: Sign - HANYA dengan text_hash, tanpa metadata
# #         sig_data = crypto_manager.sign_full_text(text_hash, metadata=None)
        
# #         # STEP 3: Generate QR - Simplified payload
# #         qr_payload = {
# #             "v": 1,
# #             "mode": "full_text",
# #             "h": text_hash,
# #             # ❌ HAPUS: "filename": certificate_image.filename,
# #             # ❌ HAPUS: "issued_date": issued_date,
# #             "s": sig_data["signature"],
# #             "p": sig_data["public_key"]
# #         }
# #         qr_json = json.dumps(qr_payload, separators=(',', ':'))
# #         qr_bytes = qr_manager.generate_qr_code(qr_json)
        
# #         # Save QR
# #         cert_id = generate_cert_id()
# #         qr_path = save_file(qr_bytes.getvalue(), "qrcodes", f"{cert_id}_qr.png")
        
# #         # STEP 4: Embed QR
# #         final_bytes = image_processor.add_qr_to_image(
# #             template_bytes, qr_bytes.getvalue(),
# #             {"x": qr_x, "y": qr_y}, qr_size
# #         )
# #         final_path = save_file(final_bytes, "certificates", f"{cert_id}_certificate.png")
        
# #         # STEP 5: SAVE TO DATABASE
# #         db_cert = Certificate(
# #             certificate_id=cert_id,
# #             recipient_name=recipient_name,
# #             recipient_email=recipient_email,
# #             institution=institution,
# #             course_name=course_name,
# #             issued_date=issued_date,  # Tetap simpan di DB untuk info, tapi tidak di sign
# #             text_hash=text_hash,
# #             raw_text=raw_text[:2000],
# #             message=sig_data["message"],  # ✅ "text_hash=..."
# #             signature=sig_data["signature"],
# #             public_key=sig_data["public_key"],
# #             qr_payload=qr_payload,  # ✅ Tanpa filename dan issued_date
# #             qr_image_path=qr_path,
# #             final_certificate_path=final_path,
# #             template_path=save_file(template_bytes, "templates", template_file.filename),
# #             qr_x=qr_x, qr_y=qr_y, qr_size=qr_size
# #         )
        
# #         db.add(db_cert)
# #         db.commit()
# #         db.refresh(db_cert)
        
# #         print(f"   ✓ Saved to DB: ID={db_cert.id}, cert_id={cert_id}")
        
# #         return {
# #             "success": True,
# #             "certificate_id": cert_id,
# #             "database_id": db_cert.id,
# #             "recipient": {
# #                 "name": recipient_name,
# #                 "email": recipient_email
# #             },
# #             "ocr_result": {
# #                 "text_length": len(raw_text),
# #                 "text_hash": text_hash,
# #                 "is_mock": "[MOCK]" in raw_text
# #             },
# #             "files": {
# #                 "certificate_url": f"/static/certificates/{cert_id}_certificate.png",
# #                 "qr_url": f"/static/qrcodes/{cert_id}_qr.png"
# #             },
# #             "created_at": db_cert.created_at.isoformat()
# #         }
        
# #     except HTTPException:
# #         raise
# #     except Exception as e:
# #         print(f"❌ Error: {e}")
# #         traceback.print_exc()
# #         raise HTTPException(500, f"Signing failed: {str(e)}")
    
# # @app.post("/api/sign")
# # async def sign_certificate(
# #     recipient_name: str = Form(...),
# #     recipient_email: str = Form(...),
# #     institution: str = Form(""),
# #     course_name: str = Form(""),
# #     issued_date: str = Form(...),
# #     qr_x: int = Form(100),
# #     qr_y: int = Form(100),
# #     qr_size: int = Form(150),
# #     certificate_image: UploadFile = File(...),
# #     template_file: UploadFile = File(...),
# #     db: Session = Depends(get_db)
# # ):
# #     """
# #     Sign sertifikat: Auto OCR → Hash → Sign → Save DB
# #     """
# #     try:
# #         print(f"📝 Signing for: {recipient_name}")
        
# #         # Read files
# #         cert_bytes = await certificate_image.read()
# #         template_bytes = await template_file.read()
        
# #         # STEP 1: OCR
# #         raw_text, text_hash = ocr_manager.extract_full_text(cert_bytes)
# #         if not raw_text:
# #             raise HTTPException(400, "OCR gagal membaca teks")
        
# #         print(f"   ✓ OCR: {len(raw_text)} chars, hash: {text_hash[:16]}...")
        
# #         # STEP 2: Sign
# #         metadata = {
# #             "filename": certificate_image.filename,
# #             "issued_date": issued_date
# #         }
# #         sig_data = crypto_manager.sign_full_text(text_hash, metadata)
        
# #         # STEP 3: Generate QR
# #         qr_payload = {
# #             "v": 1,
# #             "mode": "full_text",
# #             "h": text_hash,
# #             "filename": certificate_image.filename,  # ← GANTI dari "fn" ke "filename"
# #             "issued_date": issued_date,               # ← GANTI dari "d" ke "issued_date"
# #             "s": sig_data["signature"],
# #             "p": sig_data["public_key"]
# #         }
# #         qr_json = json.dumps(qr_payload, separators=(',', ':'))
# #         qr_bytes = qr_manager.generate_qr_code(qr_json)
        
# #         # Save QR
# #         cert_id = generate_cert_id()
# #         qr_path = save_file(qr_bytes.getvalue(), "qrcodes", f"{cert_id}_qr.png")
        
# #         # STEP 4: Embed QR
# #         final_bytes = image_processor.add_qr_to_image(
# #             template_bytes, qr_bytes.getvalue(),
# #             {"x": qr_x, "y": qr_y}, qr_size
# #         )
# #         final_path = save_file(final_bytes, "certificates", f"{cert_id}_certificate.png")
        
# #         # STEP 5: SAVE TO DATABASE
# #         db_cert = Certificate(
# #             certificate_id=cert_id,
# #             recipient_name=recipient_name,
# #             recipient_email=recipient_email,
# #             institution=institution,
# #             course_name=course_name,
# #             issued_date=issued_date,
# #             text_hash=text_hash,
# #             raw_text=raw_text[:2000],
# #             message=sig_data["message"],  # ✅ SIMPAN MESSAGE!
# #             signature=sig_data["signature"],
# #             public_key=sig_data["public_key"],
# #             qr_payload=qr_payload,
# #             qr_image_path=qr_path,
# #             final_certificate_path=final_path,
# #             template_path=save_file(template_bytes, "templates", template_file.filename),
# #             qr_x=qr_x, qr_y=qr_y, qr_size=qr_size
# #         )
        
# #         db.add(db_cert)
# #         db.commit()
# #         db.refresh(db_cert)
        
# #         print(f"   ✓ Saved to DB: ID={db_cert.id}, cert_id={cert_id}")
        
# #         return {
# #             "success": True,
# #             "certificate_id": cert_id,
# #             "database_id": db_cert.id,
# #             "recipient": {
# #                 "name": recipient_name,
# #                 "email": recipient_email
# #             },
# #             "ocr_result": {
# #                 "text_length": len(raw_text),
# #                 "text_hash": text_hash,
# #                 "is_mock": "[MOCK]" in raw_text
# #             },
# #             "files": {
# #                 "certificate_url": f"/static/certificates/{cert_id}_certificate.png",
# #                 "qr_url": f"/static/qrcodes/{cert_id}_qr.png"
# #             },
# #             "created_at": db_cert.created_at.isoformat()
# #         }
        
# #     except HTTPException:
# #         raise
# #     except Exception as e:
# #         print(f"❌ Error: {e}")
# #         traceback.print_exc()
# #         raise HTTPException(500, f"Signing failed: {str(e)}")

# # ==========================================
# # VERIFY dengan DATABASE
# # ==========================================

# @app.post("/api/verify")
# async def verify_certificate(
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db)
# ):
#     """Verify dengan cek DATABASE + OCR integrity"""
#     try:
#         file_bytes = await file.read()
#         print(f"🔍 Verifying file: {len(file_bytes)} bytes")
        
#         # STEP 1: Decode QR
#         decoded = qr_manager.decode_qr_from_image(file_bytes)
#         if not decoded:
#             return {
#                 "valid": False,
#                 "message": "QR Code tidak ditemukan dalam gambar",
#                 "step": "qr_decode"
#             }
        
#         try:
#             qr_data = json.loads(decoded)
#             print(f"   📋 QR Data: {json.dumps(qr_data, indent=2)}")
#         except json.JSONDecodeError:
#             return {
#                 "valid": False,
#                 "message": "Format QR tidak valid",
#                 "step": "qr_parse"
#             }
        
#         if qr_data.get("mode") != "full_text":
#             return {
#                 "valid": False,
#                 "message": f"Mode '{qr_data.get('mode')}' tidak didukung",
#                 "step": "mode_check"
#             }
        
#         text_hash = qr_data.get("h")
#         qr_signature = qr_data.get("s")
#         qr_public_key = qr_data.get("p")
#         qr_filename = qr_data.get("filename", "")
#         qr_issued_date = qr_data.get("issued_date", "")
        
#         print(f"   🔑 Text hash from QR: {text_hash[:20]}...")
#         print(f"   🔑 Signature from QR: {qr_signature[:30]}...")
#         print(f"   🔑 Public key from QR: {qr_public_key[:30]}...")
        
#         # STEP 2: CEK DATABASE (untuk metadata tambahan)
#         cert = db.query(Certificate).filter(
#             Certificate.text_hash == text_hash,
#             Certificate.is_revoked == False
#         ).first()
        
#         if not cert:
#             print(f"   ⚠️ Certificate not found in DB for hash: {text_hash[:20]}...")
#             # Tetap bisa verify tanpa DB jika QR lengkap
#             use_db = False
#         else:
#             print(f"   ✓ Found in DB: {cert.certificate_id}")
#             print(f"   📦 DB Message exists: {cert.message is not None}")
#             use_db = True
        
#         # STEP 3: OCR Integrity Check
#         curr_text, curr_hash = ocr_manager.extract_full_text(file_bytes)
#         hash_match = (curr_hash == text_hash)
        
#         print(f"   🔍 Current hash: {curr_hash[:20]}...")
#         print(f"   🔍 Hash match: {hash_match}")
        
#         if not hash_match:
#             return {
#                 "valid": False,
#                 "message": "Hash tidak cocok! Sertifikat telah dimodifikasi.",
#                 "step": "integrity_check",
#                 "hash_match": False,
#                 "registered": use_db
#             }
        
#         # STEP 4: Verify Signature
#         print(f"\n   🔐 SIGNATURE VERIFICATION:")
        
#         # STRATEGI: Coba semua kombinasi message dan public key
        
#         # Kandidat 1: Message dari DB (paling dipercaya)
#         candidates = []
        
#         if use_db and cert.message:
#             candidates.append({
#                 "source": "database",
#                 "message": cert.message,
#                 "public_key": cert.public_key,  # Public key dari DB
#                 "description": "DB message + DB public key"
#             })
            
#             # Cek juga dengan public key dari QR (jika berbeda)
#             if qr_public_key != cert.public_key:
#                 candidates.append({
#                     "source": "database_qr_key",
#                     "message": cert.message,
#                     "public_key": qr_public_key,
#                     "description": "DB message + QR public key"
#                 })
        
#         # Kandidat 2: Reconstruct dari QR data
#         metadata = {"filename": qr_filename, "issued_date": qr_issued_date}
#         message_parts = [f"text_hash={text_hash}"]
#         for key in sorted(metadata.keys()):
#             clean_value = str(metadata[key]).replace("|", "-").strip()
#             message_parts.append(f"{key}={clean_value}")
#         reconstructed_message = "|".join(message_parts)
        
#         candidates.append({
#             "source": "reconstructed",
#             "message": reconstructed_message,
#             "public_key": qr_public_key,
#             "description": "Reconstructed message + QR public key"
#         })
        
#         # Jika DB public key berbeda, coba juga
#         if use_db and cert.public_key != qr_public_key:
#             candidates.append({
#                 "source": "reconstructed_db_key",
#                 "message": reconstructed_message,
#                 "public_key": cert.public_key,
#                 "description": "Reconstructed message + DB public key"
#             })
        
#         print(f"   🧪 Testing {len(candidates)} verification candidates:")
        
#         sig_result = None
#         successful_candidate = None
        
#         for i, candidate in enumerate(candidates, 1):
#             print(f"\n      Candidate {i}: {candidate['description']}")
#             print(f"         Message: '{candidate['message']}'")
#             print(f"         Public Key: {candidate['public_key'][:30]}...")
            
#             result = crypto_manager.verify_with_message(
#                 candidate["message"],
#                 qr_signature,
#                 candidate["public_key"]
#             )
            
#             print(f"         Result: {result}")
            
#             if result.get("valid"):
#                 sig_result = result
#                 successful_candidate = candidate
#                 print(f"         ✅ SUCCESS!")
#                 break
#             else:
#                 print(f"         ❌ Failed")
        
#         # Jika semua gagal
#         if sig_result is None:
#             sig_result = {"valid": False, "message": "All verification candidates failed"}
        
#         is_valid = sig_result.get("valid", False) and hash_match
        
#         # Debug info
#         debug_info = {
#             "hash_match": hash_match,
#             "signature_valid": sig_result.get("valid"),
#             "tested_candidates": len(candidates),
#             "successful_candidate": successful_candidate["source"] if successful_candidate else None,
#             "db_message_used": use_db and cert.message is not None,
#             "reconstructed_message": reconstructed_message,
#             "db_public_key": cert.public_key[:30] + "..." if use_db else None,
#             "qr_public_key": qr_public_key[:30] + "...",
#             "keys_match": use_db and cert.public_key == qr_public_key if use_db else None
#         }
        
#         print(f"\n   🔍 FINAL RESULT: valid={is_valid}")
#         print(f"   📊 Debug: {json.dumps(debug_info, indent=2)}")

#         print(f"\n🔍 DEBUG COMPARISON:")
#         print(f"   QR Data keys: {list(qr_data.keys())}")
#         print(f"   DB Message:   {cert.message if use_db else 'N/A'}")
#         print(f"   Reconstructed: {reconstructed_message}")

#         # Cek apakah message sama
#         if use_db:
#             is_same = cert.message == reconstructed_message
#             print(f"   Messages identical: {is_same}")
#             if not is_same:
#                 print(f"   ⚠️  DIFFERENCE DETECTED!")
#                 print(f"       DB:  {repr(cert.message)}")
#                 print(f"       REC: {repr(reconstructed_message)}")
        
#         return {
#             "valid": is_valid,
#             "message": "Sertifikat VALID" if is_valid else "Sertifikat TIDAK VALID - Signature tidak cocok",
#             "step": "complete",
#             "debug": debug_info,
#             "certificate": {
#                 "id": cert.certificate_id if use_db else None,
#                 "recipient_name": cert.recipient_name if use_db else "Unknown",
#                 "recipient_email": cert.recipient_email if use_db else None,
#                 "institution": cert.institution if use_db else None,
#                 "course_name": cert.course_name if use_db else None,
#                 "issued_date": qr_issued_date,
#                 "registered": use_db
#             },
#             "integrity": {
#                 "hash_match": hash_match,
#                 "signature_valid": sig_result.get("valid"),
#                 "signature_message": sig_result.get("message")
#             }
#         }
        
#     except Exception as e:
#         print(f"❌ Verify error: {e}")
#         traceback.print_exc()
#         raise HTTPException(500, f"Verification failed: {str(e)}")
    
# @app.post("/api/test-verify")
# async def test_verify(
#     message: str = Form(...),
#     signature: str = Form(...),
#     public_key: str = Form(...)
# ):
#     """Test verify dengan message tertentu"""
#     result = crypto_manager.verify_with_message(message, signature, public_key)
#     return {
#         "message": message,
#         "signature": signature[:20] + "...",
#         "public_key": public_key[:20] + "...",
#         "result": result
#     }

# # ==========================================
# # LIST & DOWNLOAD
# # ==========================================

# @app.get("/api/certificates")
# async def list_certificates(
#     skip: int = 0,
#     limit: int = 100,
#     db: Session = Depends(get_db)
# ):
#     """List semua sertifikat dari database"""
#     certs = db.query(Certificate).offset(skip).limit(limit).all()
    
#     return {
#         "success": True,
#         "count": len(certs),
#         "certificates": [c.to_dict() for c in certs]
#     }

# @app.get("/api/certificates/{cert_id}/download")
# async def download_certificate(
#     cert_id: str,
#     db: Session = Depends(get_db)
# ):
#     """Download file sertifikat"""
#     cert = db.query(Certificate).filter(
#         Certificate.certificate_id == cert_id
#     ).first()
    
#     if not cert:
#         raise HTTPException(404, "Sertifikat tidak ditemukan")
    
#     if not os.path.exists(cert.final_certificate_path):
#         raise HTTPException(404, "File sertifikat tidak ditemukan di server")
    
#     return FileResponse(
#         cert.final_certificate_path,
#         media_type="image/png",
#         filename=f"{cert_id}_certificate.png"
#     )

# # ==========================================
# # MAIN
# # ==========================================

# if __name__ == "__main__":
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


# # from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
# # from fastapi.middleware.cors import CORSMiddleware
# # from fastapi.responses import JSONResponse, FileResponse
# # from fastapi.staticfiles import StaticFiles
# # from sqlalchemy.orm import Session
# # import uvicorn
# # import json
# # import os
# # from pathlib import Path
# # from datetime import datetime
# # import traceback 
# # import base64
# # import uuid

# # # Import config & database
# # from backend.app.config import MYSQL_CONFIG, UPLOAD_DIR, PRIVATE_KEY_PATH, PUBLIC_KEY_PATH
# # from backend.app.database import get_db, engine
# # from backend.app.models import Certificate

# # # Import services
# # from backend.app.services.crypto import crypto_manager
# # from backend.app.services.qr_handler import qr_manager
# # from backend.app.services.image_handler import image_processor
# # from backend.app.services.ocr_handler import ocr_manager 

# # app = FastAPI(
# #     title="Digital Certificate System API",
# #     description=f"MySQL: {MYSQL_CONFIG['host']}/{MYSQL_CONFIG['database']}",
# #     version="3.0.0"
# # )

# # # CORS - FIX: hapus spasi di akhir
# # app.add_middleware(
# #     CORSMiddleware,
# #     allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # ✅ FIX
# #     allow_credentials=True,
# #     allow_methods=["*"],
# #     allow_headers=["*"],
# # )

# # # Static files
# # app.mount("/static", StaticFiles(directory=str(UPLOAD_DIR)), name="static")

# # # ==========================================
# # # HELPERS
# # # ==========================================

# # def save_file(file_bytes: bytes, directory: str, filename: str) -> str:
# #     path = UPLOAD_DIR / directory / filename
# #     with open(path, "wb") as f:
# #         f.write(file_bytes)
# #     return str(path)

# # def generate_cert_id() -> str:
# #     return f"CERT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

# # # ==========================================
# # # ENDPOINTS
# # # ==========================================

# # @app.get("/")
# # async def root():
# #     return {
# #         "message": "Digital Certificate System API",
# #         "version": "3.0.0",
# #         "database": {
# #             "type": "MySQL",
# #             "host": MYSQL_CONFIG['host'],
# #             "database": MYSQL_CONFIG['database']
# #         },
# #         "endpoints": {
# #             "health": "/health",
# #             "public_key": "/api/public-key",
# #             "extract": "/api/extract-text",
# #             "sign": "/api/sign",
# #             "verify": "/api/verify",
# #             "list": "/api/certificates"
# #         }
# #     }

# # @app.get("/health")
# # async def health_check(db: Session = Depends(get_db)):
# #     try:
# #         count = db.query(Certificate).count()
# #         db_status = "connected"
# #     except Exception as e:
# #         db_status = f"error: {str(e)}"
# #         count = 0
    
# #     return {
# #         "status": "healthy",
# #         "database": db_status,
# #         "certificates_count": count,
# #         "ocr_available": ocr_manager.is_available
# #     }

# # @app.get("/api/public-key")
# # async def get_public_key():
# #     return crypto_manager.get_public_key_info()

# # @app.post("/api/extract-text")
# # async def extract_text(file: UploadFile = File(...)):
# #     """Preview OCR sebelum sign"""
# #     try:
# #         file_bytes = await file.read()
# #         raw_text, text_hash = ocr_manager.extract_full_text(file_bytes)
        
# #         if not raw_text:
# #             return {"success": False, "message": "OCR gagal"}
        
# #         return {
# #             "success": True,
# #             "text": raw_text,
# #             "hash": text_hash,
# #             "preview": raw_text[:500] + "..." if len(raw_text) > 500 else raw_text,
# #             "is_mock": "[MOCK]" in raw_text
# #         }
# #     except Exception as e:
# #         raise HTTPException(500, f"OCR error: {str(e)}")

# # # ==========================================
# # # SIGN - AUTO OCR dengan DATABASE
# # # ==========================================

# # @app.post("/api/sign")
# # async def sign_certificate(
# #     recipient_name: str = Form(...),
# #     recipient_email: str = Form(...),
# #     institution: str = Form(""),
# #     course_name: str = Form(""),
# #     issued_date: str = Form(...),
# #     qr_x: int = Form(100),
# #     qr_y: int = Form(100),
# #     qr_size: int = Form(150),
# #     certificate_image: UploadFile = File(...),
# #     template_file: UploadFile = File(...),
# #     db: Session = Depends(get_db)
# # ):
# #     """
# #     Sign sertifikat: Auto OCR → Hash → Sign → Save DB
# #     """
# #     try:
# #         print(f"📝 Signing for: {recipient_name}")
        
# #         # Read files
# #         cert_bytes = await certificate_image.read()
# #         template_bytes = await template_file.read()
        
# #         # STEP 1: OCR
# #         raw_text, text_hash = ocr_manager.extract_full_text(cert_bytes)
# #         if not raw_text:
# #             raise HTTPException(400, "OCR gagal membaca teks")
        
# #         print(f"   ✓ OCR: {len(raw_text)} chars, hash: {text_hash[:16]}...")
        
# #         # STEP 2: Sign
# #         metadata = {
# #             "filename": certificate_image.filename,
# #             "issued_date": issued_date
# #         }
# #         sig_data = crypto_manager.sign_full_text(text_hash, metadata)
        
# #         # STEP 3: Generate QR
# #         qr_payload = {
# #             "v": 1,
# #             "mode": "full_text",
# #             "h": text_hash,
# #             "filename": certificate_image.filename,  # ← GANTI dari "fn" ke "filename"
# #             "issued_date": issued_date,               # ← GANTI dari "d" ke "issued_date"
# #             "s": sig_data["signature"],
# #             "p": sig_data["public_key"]
# #         }
# #         qr_json = json.dumps(qr_payload, separators=(',', ':'))
# #         qr_bytes = qr_manager.generate_qr_code(qr_json)
        
# #         # Save QR
# #         cert_id = generate_cert_id()
# #         qr_path = save_file(qr_bytes.getvalue(), "qrcodes", f"{cert_id}_qr.png")
        
# #         # STEP 4: Embed QR
# #         final_bytes = image_processor.add_qr_to_image(
# #             template_bytes, qr_bytes.getvalue(),
# #             {"x": qr_x, "y": qr_y}, qr_size
# #         )
# #         final_path = save_file(final_bytes, "certificates", f"{cert_id}_certificate.png")
        
# #         # STEP 5: SAVE TO DATABASE
# #         # STEP 5: SAVE TO DATABASE
# #         db_cert = Certificate(
# #             certificate_id=cert_id,
# #             recipient_name=recipient_name,
# #             recipient_email=recipient_email,
# #             institution=institution,
# #             course_name=course_name,
# #             issued_date=issued_date,
# #             text_hash=text_hash,
# #             raw_text=raw_text[:2000],
# #             message=sig_data["message"],  # ✅ SIMPAN MESSAGE!
# #             signature=sig_data["signature"],
# #             public_key=sig_data["public_key"],
# #             qr_payload=qr_payload,
# #             qr_image_path=qr_path,
# #             final_certificate_path=final_path,
# #             template_path=save_file(template_bytes, "templates", template_file.filename),
# #             qr_x=qr_x, qr_y=qr_y, qr_size=qr_size
# #         )
        
# #         db.add(db_cert)
# #         db.commit()
# #         db.refresh(db_cert)
        
# #         print(f"   ✓ Saved to DB: ID={db_cert.id}, cert_id={cert_id}")
        
# #         return {
# #             "success": True,
# #             "certificate_id": cert_id,
# #             "database_id": db_cert.id,
# #             "recipient": {
# #                 "name": recipient_name,
# #                 "email": recipient_email
# #             },
# #             "ocr_result": {
# #                 "text_length": len(raw_text),
# #                 "text_hash": text_hash,
# #                 "is_mock": "[MOCK]" in raw_text
# #             },
# #             "files": {
# #                 "certificate_url": f"/static/certificates/{cert_id}_certificate.png",
# #                 "qr_url": f"/static/qrcodes/{cert_id}_qr.png"
# #             },
# #             "created_at": db_cert.created_at.isoformat()
# #         }
        
# #     except HTTPException:
# #         raise
# #     except Exception as e:
# #         print(f"❌ Error: {e}")
# #         traceback.print_exc()
# #         raise HTTPException(500, f"Signing failed: {str(e)}")

# # # ==========================================
# # # VERIFY dengan DATABASE
# # # ==========================================

# # @app.post("/api/verify")
# # async def verify_certificate(
# #     file: UploadFile = File(...),
# #     db: Session = Depends(get_db)
# # ):
# #     """Verify dengan cek DATABASE + OCR integrity"""
# #     try:
# #         file_bytes = await file.read()
# #         print(f"🔍 Verifying file: {len(file_bytes)} bytes")
        
# #         # STEP 1: Decode QR
# #         decoded = qr_manager.decode_qr_from_image(file_bytes)
# #         if not decoded:
# #             return {
# #                 "valid": False,
# #                 "message": "QR Code tidak ditemukan dalam gambar",
# #                 "step": "qr_decode"
# #             }
        
# #         try:
# #             qr_data = json.loads(decoded)
# #             print(f"   📋 QR Data: {json.dumps(qr_data, indent=2)}")
# #         except json.JSONDecodeError:
# #             return {
# #                 "valid": False,
# #                 "message": "Format QR tidak valid",
# #                 "step": "qr_parse"
# #             }
        
# #         if qr_data.get("mode") != "full_text":
# #             return {
# #                 "valid": False,
# #                 "message": f"Mode '{qr_data.get('mode')}' tidak didukung",
# #                 "step": "mode_check"
# #             }
        
# #         text_hash = qr_data.get("h")
# #         qr_signature = qr_data.get("s")
# #         qr_public_key = qr_data.get("p")
# #         qr_filename = qr_data.get("filename", "")
# #         qr_issued_date = qr_data.get("issued_date", "")
        
# #         print(f"   🔑 Text hash from QR: {text_hash[:20]}...")
# #         print(f"   🔑 Signature from QR: {qr_signature[:30]}...")
# #         print(f"   🔑 Public key from QR: {qr_public_key[:30]}...")
        
# #         # STEP 2: CEK DATABASE (untuk metadata tambahan)
# #         cert = db.query(Certificate).filter(
# #             Certificate.text_hash == text_hash,
# #             Certificate.is_revoked == False
# #         ).first()
        
# #         if not cert:
# #             print(f"   ⚠️ Certificate not found in DB for hash: {text_hash[:20]}...")
# #             # Tetap bisa verify tanpa DB jika QR lengkap
# #             use_db = False
# #         else:
# #             print(f"   ✓ Found in DB: {cert.certificate_id}")
# #             print(f"   📦 DB Message exists: {cert.message is not None}")
# #             use_db = True
        
# #         # STEP 3: OCR Integrity Check
# #         curr_text, curr_hash = ocr_manager.extract_full_text(file_bytes)
# #         hash_match = (curr_hash == text_hash)
        
# #         print(f"   🔍 Current hash: {curr_hash[:20]}...")
# #         print(f"   🔍 Hash match: {hash_match}")
        
# #         if not hash_match:
# #             return {
# #                 "valid": False,
# #                 "message": "Hash tidak cocok! Sertifikat telah dimodifikasi.",
# #                 "step": "integrity_check",
# #                 "hash_match": False,
# #                 "registered": use_db
# #             }
        
# #         # STEP 4: Verify Signature
# #         print(f"\n   🔐 SIGNATURE VERIFICATION:")
        
# #         # STRATEGI: Coba semua kombinasi message dan public key
        
# #         # Kandidat 1: Message dari DB (paling dipercaya)
# #         candidates = []
        
# #         if use_db and cert.message:
# #             candidates.append({
# #                 "source": "database",
# #                 "message": cert.message,
# #                 "public_key": cert.public_key,  # Public key dari DB
# #                 "description": "DB message + DB public key"
# #             })
            
# #             # Cek juga dengan public key dari QR (jika berbeda)
# #             if qr_public_key != cert.public_key:
# #                 candidates.append({
# #                     "source": "database_qr_key",
# #                     "message": cert.message,
# #                     "public_key": qr_public_key,
# #                     "description": "DB message + QR public key"
# #                 })
        
# #         # Kandidat 2: Reconstruct dari QR data
# #         metadata = {"filename": qr_filename, "issued_date": qr_issued_date}
# #         message_parts = [f"text_hash={text_hash}"]
# #         for key in sorted(metadata.keys()):
# #             clean_value = str(metadata[key]).replace("|", "-").strip()
# #             message_parts.append(f"{key}={clean_value}")
# #         reconstructed_message = "|".join(message_parts)
        
# #         candidates.append({
# #             "source": "reconstructed",
# #             "message": reconstructed_message,
# #             "public_key": qr_public_key,
# #             "description": "Reconstructed message + QR public key"
# #         })
        
# #         # Jika DB public key berbeda, coba juga
# #         if use_db and cert.public_key != qr_public_key:
# #             candidates.append({
# #                 "source": "reconstructed_db_key",
# #                 "message": reconstructed_message,
# #                 "public_key": cert.public_key,
# #                 "description": "Reconstructed message + DB public key"
# #             })
        
# #         print(f"   🧪 Testing {len(candidates)} verification candidates:")
        
# #         sig_result = None
# #         successful_candidate = None
        
# #         for i, candidate in enumerate(candidates, 1):
# #             print(f"\n      Candidate {i}: {candidate['description']}")
# #             print(f"         Message: '{candidate['message']}'")
# #             print(f"         Public Key: {candidate['public_key'][:30]}...")
            
# #             result = crypto_manager.verify_with_message(
# #                 candidate["message"],
# #                 qr_signature,
# #                 candidate["public_key"]
# #             )
            
# #             print(f"         Result: {result}")
            
# #             if result.get("valid"):
# #                 sig_result = result
# #                 successful_candidate = candidate
# #                 print(f"         ✅ SUCCESS!")
# #                 break
# #             else:
# #                 print(f"         ❌ Failed")
        
# #         # Jika semua gagal
# #         if sig_result is None:
# #             sig_result = {"valid": False, "message": "All verification candidates failed"}
        
# #         is_valid = sig_result.get("valid", False) and hash_match
        
# #         # Debug info
# #         debug_info = {
# #             "hash_match": hash_match,
# #             "signature_valid": sig_result.get("valid"),
# #             "tested_candidates": len(candidates),
# #             "successful_candidate": successful_candidate["source"] if successful_candidate else None,
# #             "db_message_used": use_db and cert.message is not None,
# #             "reconstructed_message": reconstructed_message,
# #             "db_public_key": cert.public_key[:30] + "..." if use_db else None,
# #             "qr_public_key": qr_public_key[:30] + "...",
# #             "keys_match": use_db and cert.public_key == qr_public_key if use_db else None
# #         }
        
# #         print(f"\n   🔍 FINAL RESULT: valid={is_valid}")
# #         print(f"   📊 Debug: {json.dumps(debug_info, indent=2)}")
        
# #         return {
# #             "valid": is_valid,
# #             "message": "Sertifikat VALID" if is_valid else "Sertifikat TIDAK VALID - Signature tidak cocok",
# #             "step": "complete",
# #             "debug": debug_info,
# #             "certificate": {
# #                 "id": cert.certificate_id if use_db else None,
# #                 "recipient_name": cert.recipient_name if use_db else "Unknown",
# #                 "recipient_email": cert.recipient_email if use_db else None,
# #                 "institution": cert.institution if use_db else None,
# #                 "course_name": cert.course_name if use_db else None,
# #                 "issued_date": qr_issued_date,
# #                 "registered": use_db
# #             },
# #             "integrity": {
# #                 "hash_match": hash_match,
# #                 "signature_valid": sig_result.get("valid"),
# #                 "signature_message": sig_result.get("message")
# #             }
# #         }
        
# #     except Exception as e:
# #         print(f"❌ Verify error: {e}")
# #         traceback.print_exc()
# #         raise HTTPException(500, f"Verification failed: {str(e)}")
    
# # @app.post("/api/test-verify")
# # async def test_verify(
# #     message: str = Form(...),
# #     signature: str = Form(...),
# #     public_key: str = Form(...)
# # ):
# #     """Test verify dengan message tertentu"""
# #     result = crypto_manager.verify_with_message(message, signature, public_key)
# #     return {
# #         "message": message,
# #         "signature": signature[:20] + "...",
# #         "public_key": public_key[:20] + "...",
# #         "result": result
# #     }

# # # ==========================================
# # # LIST & DOWNLOAD
# # # ==========================================

# # @app.get("/api/certificates")
# # async def list_certificates(
# #     skip: int = 0,
# #     limit: int = 100,
# #     db: Session = Depends(get_db)
# # ):
# #     """List semua sertifikat dari database"""
# #     certs = db.query(Certificate).offset(skip).limit(limit).all()
    
# #     return {
# #         "success": True,
# #         "count": len(certs),
# #         "certificates": [c.to_dict() for c in certs]
# #     }

# # @app.get("/api/certificates/{cert_id}/download")
# # async def download_certificate(
# #     cert_id: str,
# #     db: Session = Depends(get_db)
# # ):
# #     """Download file sertifikat"""
# #     cert = db.query(Certificate).filter(
# #         Certificate.certificate_id == cert_id
# #     ).first()
    
# #     if not cert:
# #         raise HTTPException(404, "Sertifikat tidak ditemukan")
    
# #     if not os.path.exists(cert.final_certificate_path):
# #         raise HTTPException(404, "File sertifikat tidak ditemukan di server")
    
# #     return FileResponse(
# #         cert.final_certificate_path,
# #         media_type="image/png",
# #         filename=f"{cert_id}_certificate.png"
# #     )

# # # ==========================================
# # # MAIN
# # # ==========================================

# # if __name__ == "__main__":
# #     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)