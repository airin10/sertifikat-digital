from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json
import traceback

from app.database import get_db
from app.models import Certificate, VerificationLog
from app.services.qr_handler import qr_manager
from app.services.ocr_handler import ocr_manager
from app.services.crypto import crypto_manager

router = APIRouter(prefix="/api/verify", tags=["Public Verification"])

@router.post("")
async def verify_certificate(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    UC09: Memverifikasi Sertifikat
    Format message: text_hash=xxx|cert_id=yyy
    """
    
    try:
        file_bytes = await file.read()
        print(f"\n{'='*50}")
        print(f"🔍 VERIFYING CERTIFICATE")
        print(f"{'='*50}")
        
        # STEP 1: Decode QR
        decoded = qr_manager.decode_qr_from_image(file_bytes)
        if not decoded:
            print(f"❌ QR Code tidak ditemukan")
            return {
                "valid": False,
                "message": "QR Code tidak ditemukan dalam gambar",
                "certificate": None,
                "integrity": {"hash_match": False, "signature_valid": False},
                "verification_steps": {"qr_decode": False}
            }
        
        try:
            qr_data = json.loads(decoded)
            print(f"✅ QR Decoded: {json.dumps(qr_data, indent=2)}")
        except json.JSONDecodeError as e:
            print(f"❌ QR Parse error: {e}")
            return {
                "valid": False,
                "message": "Format QR tidak valid",
                "certificate": None,
                "integrity": {"hash_match": False, "signature_valid": False},
                "verification_steps": {"qr_decode": True, "qr_parse": False}
            }
        
        # Extract data dari QR
        text_hash = qr_data.get("h")
        cert_id = qr_data.get("cert_id")
        qr_signature = qr_data.get("s")
        qr_public_key = qr_data.get("p")
        
        if not all([text_hash, cert_id, qr_signature, qr_public_key]):
            missing = []
            if not text_hash: missing.append("h (text_hash)")
            if not cert_id: missing.append("cert_id")
            if not qr_signature: missing.append("s (signature)")
            if not qr_public_key: missing.append("p (public_key)")
            print(f"❌ Missing fields: {missing}")
            return {
                "valid": False,
                "message": f"Data QR tidak lengkap: {', '.join(missing)}",
                "step": "qr_validation"
            }
        
        print(f"✅ Extracted from QR:")
        print(f"   Text Hash: {text_hash[:20]}...")
        print(f"   Cert ID: {cert_id}")
        
        # STEP 2: Cari di database berdasarkan cert_id
        cert = db.query(Certificate).filter(
            Certificate.certificate_id == cert_id,
            Certificate.is_revoked == False
        ).first()
        
        is_registered = cert is not None
        is_revoked = cert.is_revoked if cert else False
        
        if cert:
            # ✅ FIX: Gunakan relasi participant untuk mendapatkan nama
            recipient_name = cert.participant.full_name if cert.participant else "Unknown"
            recipient_email = cert.participant.email if cert.participant else None
            
            print(f"✅ Found in database: {cert.certificate_id}")
            print(f"   Recipient: {recipient_name}")
            expected_message = f"text_hash={text_hash}|cert_id={cert_id}"
            db_message_match = (cert.message == expected_message)
            print(f"   Expected message: '{expected_message}'")
            print(f"   DB message: '{cert.message}'")
            print(f"   Message match: {db_message_match}")
        else:
            print(f"⚠️ Certificate not found in database: {cert_id}")
            recipient_name = "Unknown"
            recipient_email = None
        
        # STEP 3: OCR Integrity Check
        curr_text, curr_hash = ocr_manager.extract_full_text(file_bytes)
        hash_match = (curr_hash == text_hash)
        
        print(f"✅ OCR Integrity:")
        print(f"   Current hash: {curr_hash[:20]}...")
        print(f"   Hash match: {hash_match}")
        
        # STEP 4: Signature Verification
        print(f"🔐 Signature Verification:")
        signature_valid = False
        verification_source = "unknown"
        
        if cert and cert.message:
            # Strategy 1: Gunakan message dari DB (paling trusted)
            print(f"   Strategy 1: Using DB stored message")
            print(f"   DB Message: '{cert.message}'")
            sig_result = crypto_manager.verify_with_message(
                cert.message,
                qr_signature,
                cert.public_key
            )
            signature_valid = sig_result.get("valid", False)
            verification_source = "database"
        else:
            # Strategy 2: Reconstruct message dari QR data
            print(f"   Strategy 2: Reconstructing message from QR")
            sig_result = crypto_manager.verify_full_text(
                text_hash=text_hash,
                cert_id=cert_id,
                signature_b64=qr_signature,
                public_key_b64=qr_public_key
            )
            signature_valid = sig_result.get("valid", False)
            verification_source = "reconstructed"
        
        print(f"   Result: {'✅ VALID' if signature_valid else '❌ INVALID'}")
        print(f"   Source: {verification_source}")
        
        # STEP 5: Final Result
        is_valid = hash_match and signature_valid and not is_revoked
        
        # Log verification
        log = VerificationLog(
            certificate_id=cert_id,
            text_hash=text_hash,
            verification_result=is_valid,
            details={
                "hash_match": hash_match,
                "signature_valid": signature_valid,
                "is_registered": is_registered,
                "is_revoked": is_revoked,
                "verification_source": verification_source,
                "qr_version": qr_data.get("v"),
                "message_format": "text_hash|cert_id"
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
        print(f"📊 FINAL RESULT: {'✅ VALID' if is_valid else '❌ INVALID'}")
        print(f"   Message: {message}")
        print(f"{'='*50}\n")
        
        return {
            "valid": is_valid,
            "message": message,
            "certificate": {
                "id": cert_id,
                # ✅ FIX: Gunakan relasi participant
                "recipient_name": recipient_name,
                "recipient_email": recipient_email,
                "institution": cert.institution if cert else None,
                "course_name": cert.description if cert else None,  # atau cert.course_name jika ada field tersebut
                "issued_date": cert.issued_date if cert else None,
                "registered": is_registered,
                "revoked": is_revoked
            } if is_registered else None,
            "integrity": {
                "hash_match": hash_match,
                "signature_valid": signature_valid,
                "verification_source": verification_source,
                "message_format": "text_hash|cert_id"
            },
            "verification_steps": {
                "qr_decode": True,
                "qr_parse": True,
                "ocr_extract": True,
                "hash_compare": hash_match,
                "signature_verify": signature_valid,
                "database_lookup": is_registered,
                "revocation_check": not is_revoked
            }
        }
        
    except Exception as e:
        print(f"❌ Verify error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Verification error: {str(e)}")

@router.get("/stats")
def get_public_stats(db: Session = Depends(get_db)):
    """Public statistics"""
    total_verifications = db.query(VerificationLog).count()
    successful_verifications = db.query(VerificationLog).filter(
        VerificationLog.verification_result == True
    ).count()
    
    return {
        "total_verifications": total_verifications,
        "successful_verifications": successful_verifications,
        "success_rate": round(successful_verifications / total_verifications * 100, 2) if total_verifications > 0 else 0
    }

# from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
# from sqlalchemy.orm import Session
# from pydantic import BaseModel
# from typing import Optional
# import json
# import traceback

# from app.database import get_db
# from app.models import Certificate, VerificationLog
# from app.services.qr_handler import qr_manager
# from app.services.ocr_handler import ocr_manager
# from app.services.crypto import crypto_manager

# router = APIRouter(prefix="/api/verify", tags=["Public Verification"])

# @router.post("")
# async def verify_certificate(
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db)
# ):
#     """
#     UC09: Memverifikasi Sertifikat
#     Format message: text_hash=xxx|cert_id=yyy
#     """
    
#     try:
#         file_bytes = await file.read()
#         print(f"\n{'='*50}")
#         print(f"🔍 VERIFYING CERTIFICATE")
#         print(f"{'='*50}")
        
#         # STEP 1: Decode QR
#         decoded = qr_manager.decode_qr_from_image(file_bytes)
#         if not decoded:
#             print(f"❌ QR Code tidak ditemukan")
#             return {
#                 "valid": False,
#                 "message": "QR Code tidak ditemukan dalam gambar",
#                 "certificate": None,
#                 "integrity": {"hash_match": False, "signature_valid": False},
#                 "verification_steps": {"qr_decode": False}
#             }
        
#         try:
#             qr_data = json.loads(decoded)
#             print(f"✅ QR Decoded: {json.dumps(qr_data, indent=2)}")
#         except json.JSONDecodeError as e:
#             print(f"❌ QR Parse error: {e}")
#             return {
#                 "valid": False,
#                 "message": "Format QR tidak valid",
#                 "certificate": None,
#                 "integrity": {"hash_match": False, "signature_valid": False},
#                 "verification_steps": {"qr_decode": True, "qr_parse": False}
#             }
        
#         # Extract data dari QR
#         text_hash = qr_data.get("h")
#         cert_id = qr_data.get("cert_id")  # ✅ cert_id dari QR
#         qr_signature = qr_data.get("s")
#         qr_public_key = qr_data.get("p")
        
#         if not all([text_hash, cert_id, qr_signature, qr_public_key]):
#             return {
#                 "valid": False,
#                 "message": "Data QR tidak lengkap",
#                 "step": "qr_validation"
#             }
        
#         print(f"✅ Extracted from QR:")
#         print(f"   Text Hash: {text_hash[:20]}...")
#         print(f"   Cert ID: {cert_id}")
        
#         # STEP 2: Cari di database berdasarkan cert_id (lebih spesifik!)
#         cert = db.query(Certificate).filter(
#             Certificate.certificate_id == cert_id,
#             Certificate.is_revoked == False
#         ).first()
        
#         is_registered = cert is not None
#         is_revoked = cert.is_revoked if cert else False
        
#         if cert:
#             print(f"✅ Found in database: {cert.certificate_id}")
#             print(f"   Recipient: {cert.recipient_name}")
#             db_message_match = (cert.message == f"text_hash={text_hash}|cert_id={cert_id}")
#             print(f"   Message match: {db_message_match}")
#         else:
#             print(f"⚠️ Certificate not found in database: {cert_id}")
        
#         # STEP 3: OCR Integrity Check
#         curr_text, curr_hash = ocr_manager.extract_full_text(file_bytes)
#         hash_match = (curr_hash == text_hash)
        
#         print(f"✅ OCR Integrity:")
#         print(f"   Current hash: {curr_hash[:20]}...")
#         print(f"   Hash match: {hash_match}")
        
#         # STEP 4: Signature Verification
#         print(f"🔐 Signature Verification:")
#         signature_valid = False
        
#         if cert and cert.message:
#             # Strategy 1: Gunakan message dari DB (paling trusted)
#             print(f"   Strategy 1: Using DB stored message")
#             sig_result = crypto_manager.verify_with_message(
#                 cert.message,
#                 qr_signature,
#                 cert.public_key
#             )
#             signature_valid = sig_result.get("valid", False)
#             verification_source = "database"
#         else:
#             # Strategy 2: Reconstruct message dari QR data
#             print(f"   Strategy 2: Reconstructing message from QR")
#             sig_result = crypto_manager.verify_full_text(
#                 text_hash=text_hash,
#                 cert_id=cert_id,
#                 signature_b64=qr_signature,
#                 public_key_b64=qr_public_key
#             )
#             signature_valid = sig_result.get("valid", False)
#             verification_source = "reconstructed"
        
#         print(f"   Result: {'✅ VALID' if signature_valid else '❌ INVALID'}")
#         print(f"   Source: {verification_source}")
        
#         # STEP 5: Final Result
#         is_valid = hash_match and signature_valid and not is_revoked
        
#         # Log verification
#         log = VerificationLog(
#             certificate_id=cert_id,
#             text_hash=text_hash,
#             verification_result=is_valid,
#             details={
#                 "hash_match": hash_match,
#                 "signature_valid": signature_valid,
#                 "is_registered": is_registered,
#                 "is_revoked": is_revoked,
#                 "verification_source": verification_source,
#                 "qr_version": qr_data.get("v"),
#                 "message_format": "text_hash|cert_id"
#             }
#         )
#         db.add(log)
#         db.commit()
        
#         # Determine message
#         if is_revoked:
#             message = "Sertifikat telah dicabut (REVOKED)"
#         elif not hash_match:
#             message = "Hash tidak cocok! Sertifikat telah dimodifikasi."
#         elif not signature_valid:
#             message = "Signature tidak valid! Sertifikat palsu."
#         else:
#             message = "Sertifikat VALID dan terdaftar"
        
#         print(f"{'='*50}")
#         print(f"📊 FINAL RESULT: {'✅ VALID' if is_valid else '❌ INVALID'}")
#         print(f"   Message: {message}")
#         print(f"{'='*50}\n")
        
#         return {
#             "valid": is_valid,
#             "message": message,
#             "certificate": {
#                 "id": cert_id,
#                 "recipient_name": cert.recipient_name if cert else "Unknown",
#                 "recipient_email": cert.recipient_email if cert else None,
#                 "institution": cert.institution if cert else None,
#                 "course_name": cert.course_name if cert else None,
#                 "issued_date": cert.issued_date if cert else None,
#                 "registered": is_registered,
#                 "revoked": is_revoked
#             } if is_registered else None,
#             "integrity": {
#                 "hash_match": hash_match,
#                 "signature_valid": signature_valid,
#                 "verification_source": verification_source,
#                 "message_format": "text_hash|cert_id"
#             },
#             "verification_steps": {
#                 "qr_decode": True,
#                 "qr_parse": True,
#                 "ocr_extract": True,
#                 "hash_compare": hash_match,
#                 "signature_verify": signature_valid,
#                 "database_lookup": is_registered,
#                 "revocation_check": not is_revoked
#             }
#         }
        
#     except Exception as e:
#         print(f"❌ Verify error: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=f"Verification error: {str(e)}")

# @router.get("/stats")
# def get_public_stats(db: Session = Depends(get_db)):
#     """Public statistics"""
#     total_verifications = db.query(VerificationLog).count()
#     successful_verifications = db.query(VerificationLog).filter(
#         VerificationLog.verification_result == True
#     ).count()
    
#     return {
#         "total_verifications": total_verifications,
#         "successful_verifications": successful_verifications,
#         "success_rate": round(successful_verifications / total_verifications * 100, 2) if total_verifications > 0 else 0
#     }

# # from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
# # from sqlalchemy.orm import Session
# # from pydantic import BaseModel
# # from typing import Optional
# # import json
# # import traceback

# # from app.database import get_db
# # from app.models import Certificate, VerificationLog
# # from app.services.qr_handler import qr_manager
# # from app.services.ocr_handler import ocr_manager
# # from app.services.crypto import crypto_manager

# # router = APIRouter(prefix="/api/verify", tags=["Public Verification"])

# # class VerifyResponse(BaseModel):
# #     valid: bool
# #     message: str
# #     certificate: Optional[dict]
# #     integrity: dict
# #     verification_steps: dict

# # @router.post("")
# # async def verify_certificate(
# #     file: UploadFile = File(...),
# #     db: Session = Depends(get_db)
# # ):
# #     """
# #     UC09: Memverifikasi Sertifikat (PUBLIC ACCESS)
# #     Message format: hanya text_hash
# #     """
    
# #     try:
# #         file_bytes = await file.read()
        
# #         # STEP 1: Decode QR
# #         decoded = qr_manager.decode_qr_from_image(file_bytes)
# #         if not decoded:
# #             return {
# #                 "valid": False,
# #                 "message": "QR Code tidak ditemukan dalam gambar",
# #                 "certificate": None,
# #                 "integrity": {"hash_match": False, "signature_valid": False},
# #                 "verification_steps": {"qr_decode": False}
# #             }
        
# #         try:
# #             qr_data = json.loads(decoded)
# #         except json.JSONDecodeError:
# #             return {
# #                 "valid": False,
# #                 "message": "Format QR code tidak valid",
# #                 "certificate": None,
# #                 "integrity": {"hash_match": False, "signature_valid": False},
# #                 "verification_steps": {"qr_decode": True, "qr_parse": False}
# #             }
        
# #         text_hash = qr_data.get("h")
# #         qr_signature = qr_data.get("s")
# #         qr_public_key = qr_data.get("p")
        
# #         # STEP 2: Check Database
# #         cert = db.query(Certificate).filter(
# #             Certificate.text_hash == text_hash,
# #             Certificate.is_revoked == False
# #         ).first()
        
# #         is_registered = cert is not None
# #         is_revoked = cert.is_revoked if cert else False
        
# #         # STEP 3: OCR Integrity Check
# #         curr_text, curr_hash = ocr_manager.extract_full_text(file_bytes)
# #         hash_match = (curr_hash == text_hash)
        
# #         # STEP 4: Signature Verification - Simplified
# #         signature_valid = False
        
# #         if cert and cert.message:
# #             # Use stored message dari database
# #             sig_result = crypto_manager.verify_with_message(
# #                 cert.message,  # ✅ "text_hash=..."
# #                 qr_signature,
# #                 cert.public_key
# #             )
# #             signature_valid = sig_result.get("valid", False)
# #         else:
# #             # Reconstruct message sederhana: hanya text_hash
# #             message = f"text_hash={text_hash}"
# #             sig_result = crypto_manager.verify_with_message(
# #                 message,
# #                 qr_signature,
# #                 qr_public_key
# #             )
# #             signature_valid = sig_result.get("valid", False)
        
# #         # STEP 5: Log verification
# #         log = VerificationLog(
# #             certificate_id=qr_data.get("cert_id", "unknown"),
# #             text_hash=text_hash,
# #             verification_result=(hash_match and signature_valid and not is_revoked),
# #             details={
# #                 "hash_match": hash_match,
# #                 "signature_valid": signature_valid,
# #                 "is_registered": is_registered,
# #                 "is_revoked": is_revoked,
# #                 "message_format": "text_hash_only"  # ✅ Track format
# #             }
# #         )
# #         db.add(log)
# #         db.commit()
        
# #         # Determine final result
# #         is_valid = hash_match and signature_valid and not is_revoked
        
# #         if is_revoked:
# #             message = "Sertifikat telah dicabut (REVOKED)"
# #         elif not hash_match:
# #             message = "Hash tidak cocok! Sertifikat telah dimodifikasi."
# #         elif not signature_valid:
# #             message = "Signature tidak valid! Sertifikat palsu."
# #         else:
# #             message = "Sertifikat VALID dan terdaftar"
        
# #         return {
# #             "valid": is_valid,
# #             "message": message,
# #             "certificate": {
# #                 "id": qr_data.get("cert_id"),
# #                 "title": qr_data.get("title"),
# #                 "participant": qr_data.get("participant"),
# #                 "issued_date": cert.issued_date if cert else None,  # Ambil dari DB
# #                 "registered": is_registered,
# #                 "revoked": is_revoked
# #             } if is_registered else None,
# #             "integrity": {
# #                 "hash_match": hash_match,
# #                 "signature_valid": signature_valid,
# #                 "qr_decode": True,
# #                 "database_check": is_registered
# #             },
# #             "verification_steps": {
# #                 "qr_decode": True,
# #                 "qr_parse": True,
# #                 "ocr_extract": True,
# #                 "hash_compare": hash_match,
# #                 "signature_verify": signature_valid,
# #                 "database_lookup": is_registered,
# #                 "revocation_check": not is_revoked
# #             }
# #         }
        
# #     except Exception as e:
# #         traceback.print_exc()
# #         raise HTTPException(status_code=500, detail=f"Verification error: {str(e)}")
    
# # # @router.post("")
# # # async def verify_certificate(
# # #     file: UploadFile = File(...),
# # #     db: Session = Depends(get_db)
# # # ):
# # #     try:
# # #         file_bytes = await file.read()
        
# # #         # STEP 1: Decode QR
# # #         decoded = qr_manager.decode_qr_from_image(file_bytes)
# # #         if not decoded:
# # #             return {"valid": False, "message": "QR tidak ditemukan"}
        
# # #         qr_data = json.loads(decoded)
# # #         text_hash = qr_data.get("h")
# # #         qr_signature = qr_data.get("s")
# # #         qr_public_key = qr_data.get("p")
# # #         qr_date = qr_data.get("issued_date")
        
# # #         # STEP 2: Cari sertifikat dengan strategi multiple
# # #         cert = None
        
# # #         # Strategy 1: Cari by signature (paling akurat)
# # #         if qr_signature:
# # #             cert = db.query(Certificate).filter(
# # #                 Certificate.signature == qr_signature
# # #             ).first()
# # #             if cert:
# # #                 print(f"   ✅ Found by signature: {cert.certificate_id}")
        
# # #         # Strategy 2: Cari by hash + issued_date
# # #         if not cert and qr_date:
# # #             cert = db.query(Certificate).filter(
# # #                 Certificate.text_hash == text_hash,
# # #                 Certificate.issued_date == qr_date
# # #             ).first()
# # #             if cert:
# # #                 print(f"   ✅ Found by hash+date: {cert.certificate_id}")
        
# # #         # Strategy 3: Cari by hash saja (fallback)
# # #         if not cert:
# # #             cert = db.query(Certificate).filter(
# # #                 Certificate.text_hash == text_hash
# # #             ).first()
# # #             if cert:
# # #                 print(f"   ⚠️  Found by hash only (may be ambiguous): {cert.certificate_id}")
        
# # #         use_db = cert is not None
        
# # #         is_registered = cert is not None
# # #         is_revoked = cert.is_revoked if cert else False
        
# # #         # STEP 3: OCR Integrity Check
# # #         curr_text, curr_hash = ocr_manager.extract_full_text(file_bytes)
# # #         hash_match = (curr_hash == text_hash)
        
# # #         # STEP 4: Signature Verification
# # #         signature_valid = False
        
# # #         if cert and cert.message:
# # #             # Use stored message from database
# # #             sig_result = crypto_manager.verify_with_message(
# # #                 cert.message,
# # #                 qr_signature,
# # #                 cert.public_key
# # #             )
# # #             signature_valid = sig_result.get("valid", False)
# # #         else:
# # #             # Reconstruct message from QR data
# # #             metadata = {
# # #                 "filename": qr_data.get("filename", ""),
# # #                 "issued_date": qr_data.get("issued_date", "")
# # #             }
# # #             sig_result = crypto_manager.verify_full_text(
# # #                 text_hash,
# # #                 qr_signature,
# # #                 qr_public_key,
# # #                 metadata
# # #             )
# # #             signature_valid = sig_result.get("valid", False)
        
# # #         # STEP 5: Log verification (for analytics)
# # #         log = VerificationLog(
# # #             certificate_id=qr_data.get("cert_id", "unknown"),
# # #             text_hash=text_hash,
# # #             verification_result=(hash_match and signature_valid and not is_revoked),
# # #             details={
# # #                 "hash_match": hash_match,
# # #                 "signature_valid": signature_valid,
# # #                 "is_registered": is_registered,
# # #                 "is_revoked": is_revoked
# # #             }
# # #         )
# # #         db.add(log)
# # #         db.commit()
        
# # #         # Determine final result
# # #         is_valid = hash_match and signature_valid and not is_revoked
        
# # #         if is_revoked:
# # #             message = "Sertifikat telah dicabut (REVOKED)"
# # #         elif not hash_match:
# # #             message = "Hash tidak cocok! Sertifikat telah dimodifikasi."
# # #         elif not signature_valid:
# # #             message = "Signature tidak valid! Sertifikat palsu."
# # #         else:
# # #             message = "Sertifikat VALID dan terdaftar"
        
# # #         return {
# # #             "valid": is_valid,
# # #             "message": message,
# # #             "certificate": {
# # #                 "id": qr_data.get("cert_id"),
# # #                 "title": qr_data.get("title"),
# # #                 "participant": qr_data.get("participant"),
# # #                 "issued_date": qr_data.get("issued_date"),
# # #                 "registered": is_registered,
# # #                 "revoked": is_revoked
# # #             } if is_registered else None,
# # #             "integrity": {
# # #                 "hash_match": hash_match,
# # #                 "signature_valid": signature_valid,
# # #                 "qr_decode": True,
# # #                 "database_check": is_registered
# # #             },
# # #             "verification_steps": {
# # #                 "qr_decode": True,
# # #                 "qr_parse": True,
# # #                 "ocr_extract": True,
# # #                 "hash_compare": hash_match,
# # #                 "signature_verify": signature_valid,
# # #                 "database_lookup": is_registered,
# # #                 "revocation_check": not is_revoked
# # #             }
# # #         }
        
# # #     except Exception as e:
# # #         traceback.print_exc()
# # #         raise HTTPException(status_code=500, detail=f"Verification error: {str(e)}")

# # @router.get("/stats")
# # def get_public_stats(db: Session = Depends(get_db)):
# #     """Public statistics"""
# #     total_verifications = db.query(VerificationLog).count()
# #     successful_verifications = db.query(VerificationLog).filter(
# #         VerificationLog.verification_result == True
# #     ).count()
    
# #     return {
# #         "total_verifications": total_verifications,
# #         "successful_verifications": successful_verifications,
# #         "success_rate": round(successful_verifications / total_verifications * 100, 2) if total_verifications > 0 else 0
# #     }