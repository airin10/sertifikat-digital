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
    try:
        file_bytes = await file.read()
        print(f"\n{'='*50}")
        print(f"🔍 VERIFYING CERTIFICATE")
        print(f"{'='*50}")
        
        def make_response(valid, registered, revoked, message, cert=None, 
                         hash_match=False, signature_valid=False, 
                         qr_decode=True, db_lookup=False, ocr_extract=True,
                         hash_compare=False, sig_verify=False, revoke_check=True,
                         stored_hash="N/A", current_hash="N/A"):
            return {
                "valid": valid,
                "registered": registered,
                "revoked": revoked,
                "message": message,
                "certificate": {
                    "id": cert.certificate_id if cert else None,
                    "recipient_name": cert.participant.full_name if cert and cert.participant else None,
                    "participant": cert.participant.full_name if cert and cert.participant else None,
                    "title": cert.title if cert else None,
                    "institution": cert.institution if cert else None,
                    "issued_date": cert.issued_date if cert else None,
                    "revoked_at": cert.revoked_at.isoformat() if cert and cert.revoked_at else None,
                    "registered": registered,
                    "revoked": revoked
                } if cert else None,
                "integrity": {
                    "hash_match": hash_match,
                    "signature_valid": signature_valid,
                    "is_registered": registered,
                    "stored_hash": stored_hash,
                    "current_hash": current_hash
                },
                "verification_steps": {
                    "qr_decode": qr_decode,
                    "database_lookup": db_lookup,
                    "ocr_extract": ocr_extract,
                    "hash_compare": hash_compare,
                    "signature_verify": sig_verify,
                    "revocation_check": revoke_check
                }
            }
        
        # STEP 1: Decode QR
        decoded = qr_manager.decode_qr_from_image(file_bytes)
        if not decoded:
            return make_response(
                valid=False, registered=False, revoked=False,
                message="QR Code tidak ditemukan dalam gambar",
                qr_decode=False, db_lookup=False, ocr_extract=False,
                hash_compare=False, sig_verify=False, revoke_check=False
            )
        
        try:
            qr_data = json.loads(decoded)
            print(f"QR Decoded")
        except json.JSONDecodeError:
            return make_response(
                valid=False, registered=False, revoked=False,
                message="Format QR tidak valid",
                qr_decode=True, db_lookup=False, ocr_extract=False,
                hash_compare=False, sig_verify=False, revoke_check=False
            )
        
        text_hash = qr_data.get("h")
        cert_id = qr_data.get("c")
        
        if not all([text_hash, cert_id]):
            missing = [k for k, v in [("h", text_hash), ("c", cert_id)] if not v]
            return make_response(
                valid=False, registered=False, revoked=False,
                message=f"Data QR tidak lengkap: {missing}",
                qr_decode=True, db_lookup=False, ocr_extract=False,
                hash_compare=False, sig_verify=False, revoke_check=False
            )
        
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
            recipient_name = cert.participant.full_name if cert.participant else "Unknown"
            print(f"Found in DB: {cert_id}")
            print(f"Recipient: {recipient_name}")
        else:
            recipient_name = "Unknown"
            print(f"Not in database: {cert_id}")
        
        # STEP 3: OCR current image
        print(f"OCR current image...")
        current_text, current_hash = ocr_manager.extract_text_and_hash(file_bytes)
        
        if not current_text:
            return make_response(
                valid=False, registered=is_registered, revoked=is_revoked,
                message="OCR gagal membaca sertifikat",
                cert=cert,
                qr_decode=True, db_lookup=is_registered, ocr_extract=False,
                hash_compare=False, sig_verify=False, revoke_check=not is_revoked,
                stored_hash=text_hash[:20] + "..."
            )
        
        print(f"Current OCR: {len(current_text)} chars")
        print(f"Current text: {current_text}")
        print(f"Current Hash: {current_hash}...")
        
        # STEP 4: Verify dengan crypto_manager (membandingkan hash OCR dengan hash QR)
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
        is_authentic = verify_result.get("valid", False)
        
        # STEP 6: Log verification 
        if cert:
            log = VerificationLog(
                certificate_id=cert.id,
                text_hash=text_hash,
                verification_result=is_valid,
                details={
                    "hash_match": hash_match,
                    "signature_valid": signature_valid,
                    "is_registered": is_registered,
                    "is_revoked": is_revoked,
                    "is_authentic": is_authentic,
                    "status": status,
                    "public_cert_id": cert_id
                }
            )
            db.add(log)
            db.commit()
        else:
            print("Warning: Certificate not found in DB, skipping log entry.")
        
        # STEP 7: Determine message
        if is_revoked:
            message = "Sertifikat telah dicabut"
        elif not hash_match:
            message = "Hash tidak cocok! Sertifikat telah dimodifikasi."
        elif not signature_valid:
            message = "Signature tidak valid! Sertifikat palsu."
        elif not is_registered:
            message = "Sertifikat VALID secara kriptografi, tetapi TIDAK TERDAFTAR di sistem"
        else:
            message = "Sertifikat VALID dan terdaftar"
        
        print(f"{'='*50}")
        print(f"RESULT: {'VALID' if is_authentic else 'INVALID'}")
        print(f"Registered: {is_registered}")
        print(f"   {message}")
        print(f"{'='*50}\n")
        
        return make_response(
            valid=is_authentic,
            registered=is_registered,
            revoked=is_revoked,
            message=message,
            cert=cert,
            hash_match=hash_match,
            signature_valid=signature_valid,
            qr_decode=True,
            db_lookup=is_registered,
            ocr_extract=True,
            hash_compare=hash_match,
            sig_verify=signature_valid,
            revoke_check=not is_revoked,
            stored_hash=text_hash[:20] + "...",
            current_hash=current_hash[:20] + "..."
        )
        
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Verification error: {str(e)}")


@router.get("/stats")
def get_public_stats(db: Session = Depends(get_db)):
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
    
#     try:
#         file_bytes = await file.read()
#         print(f"\n{'='*50}")
#         print(f"🔍 VERIFYING CERTIFICATE")
#         print(f"{'='*50}")
        
#         # STEP 1: Decode QR
#         decoded = qr_manager.decode_qr_from_image(file_bytes)
#         if not decoded:
#             return {
#                 "valid": False,
#                 "message": "QR Code tidak ditemukan",
#                 "step": "qr_decode"
#             }
        
#         try:
#             qr_data = json.loads(decoded)
#             print(f"QR Decoded")
#         except json.JSONDecodeError:
#             return {
#                 "valid": False,
#                 "message": "Format QR tidak valid",
#                 "step": "qr_parse"
#             }
        
#         text_hash = qr_data.get("h")
#         cert_id = qr_data.get("c")
        
#         if not all([text_hash, cert_id]):
#             missing = [k for k, v in [("h", text_hash), ("c", cert_id)] if not v]
#             return {
#                 "valid": False,
#                 "message": f"Data QR tidak lengkap: {missing}",
#                 "step": "qr_validation"
#             }
        
#         print(f"From QR:")
#         print(f"Hash: {text_hash[:20]}...")
#         print(f"Cert ID: {cert_id}")
        
#         # STEP 2: Lookup database
#         cert = db.query(Certificate).filter(
#             Certificate.certificate_id == cert_id
#         ).first()
        
#         is_registered = cert is not None
#         is_revoked = cert.is_revoked if cert else False
        
#         if cert:
#             recipient_name = cert.participant.full_name if cert.participant else "Unknown"
#             print(f"Found in DB: {cert_id}")
#             print(f"Recipient: {recipient_name}")
#         else:
#             recipient_name = "Unknown"
#             print(f"Not in database: {cert_id}")
        
#         # STEP 3: OCR current image → Hash
#         print(f"OCR current image...")
#         current_text, current_hash = ocr_manager.extract_text_and_hash(file_bytes)
        
#         if not current_text:
#             return {
#                 "valid": False,
#                 "message": "OCR gagal membaca sertifikat",
#                 "step": "ocr_failed"
#             }
        
#         print(f"Current OCR: {len(current_text)} chars")
#         print(f"Current text: {current_text}")
#         print(f"Current Hash: {current_hash}...")
        
#         # STEP 4: Verify dengan crypto_manager
#         verify_result = crypto_manager.verify_certificate(
#             qr_data=qr_data,
#             current_text_hash=current_hash
#         )
        
#         hash_match = verify_result.get("hash_match")
#         signature_valid = verify_result.get("signature_valid")
#         status = verify_result.get("status")
        
#         print(f"Verification:")
#         print(f"Status: {status}")
#         print(f"Hash Match: {hash_match}")
#         print(f"Signature Valid: {signature_valid}")
        
#         #STEP 5: Final result
#         is_valid = verify_result.get("valid", False) and not is_revoked

#         is_authentic = verify_result.get("valid", False)
        
#         # Log
#         if not cert:
#              print("Warning: Certificate not found in DB, skipping log entry to avoid FK error.")
#         else:
#             log = VerificationLog(
#                 certificate_id=cert.id,  # GUNAKAN cert.id (Integer), BUKAN cert_id (String)
#                 text_hash=text_hash,
#                 verification_result=is_valid,
#                 details={
#                     "hash_match": hash_match,
#                     "signature_valid": signature_valid,
#                     "is_registered": is_registered,
#                     "is_revoked": is_revoked,
#                     "is_authentic": is_authentic,
#                     "status": status,
#                     "public_cert_id": cert_id # Simpan string ID di dalam JSON details saja jika perlu
#                 }
#             )
#         db.add(log)
#         db.commit()
        
#         if is_revoked:
#             message = "Sertifikat telah dicabut"
#         elif not hash_match:
#             message = "Hash tidak cocok! Sertifikat telah dimodifikasi."
#         elif not signature_valid:
#             message = "Signature tidak valid! Sertifikat palsu."
#         elif not is_registered:
#             message = "Sertifikat VALID secara kriptografi, tetapi TIDAK TERDAFTAR di sistem"
#         else:
#             message = "Sertifikat VALID dan terdaftar"
        
#         print(f"{'='*50}")
#         print(f"RESULT: {'VALID' if is_authentic else 'INVALID'}")
#         print(f"Registered: {is_registered}")
#         print(f"   {message}")
#         print(f"{'='*50}\n")
        
#         return {
#             "valid": is_authentic,  
#             "registered": is_registered,  
#             "revoked": is_revoked,
#             "message": message,
#             "certificate": {
#                 "id": cert_id,
#                 "recipient_name": recipient_name if is_registered else None,
#                 "participant": recipient_name if is_registered else None,
#                 "title": cert.title if cert else None,
#                 "institution": cert.institution if cert else None,
#                 "issued_date": cert.issued_date if cert else None,
#                 "revoked_at": cert.revoked_at.isoformat() if cert and cert.revoked_at else None,
#                 "registered": is_registered,
#                 "revoked": is_revoked
#             } if is_registered else None,  
#             "integrity": {
#                 "hash_match": hash_match,
#                 "signature_valid": signature_valid,
#                 "is_registered": is_registered, 
#                 "stored_hash": text_hash[:20] + "...",
#                 "current_hash": current_hash[:20] + "..."
#             },
#             "verification_steps": {
#                 "qr_decode": True,
#                 "database_lookup": is_registered,
#                 "ocr_extract": True,
#                 "hash_compare": hash_match,
#                 "signature_verify": signature_valid,
#                 "revocation_check": not is_revoked
#             }
#         }
        
#     except Exception as e:
#         print(f"Error: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=f"Verification error: {str(e)}")

# @router.get("/stats")
# def get_public_stats(db: Session = Depends(get_db)):
#     total_verifications = db.query(VerificationLog).count()
#     successful_verifications = db.query(VerificationLog).filter(
#         VerificationLog.verification_result == True
#     ).count()
    
#     return {
#         "total_verifications": total_verifications,
#         "successful_verifications": successful_verifications,
#         "success_rate": round(successful_verifications / total_verifications * 100, 2) if total_verifications > 0 else 0
#     }
