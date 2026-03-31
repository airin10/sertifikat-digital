import base64
import hashlib
import re
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Tuple
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from cryptography.exceptions import InvalidSignature


class EdDSACertificateManager:
    def __init__(self, key_dir: str = "./keys"):
        self.key_dir = Path(key_dir)
        self.key_dir.mkdir(exist_ok=True, parents=True)
        
        self.private_key_path = None
        self.public_key_path = None
        
        self._init_keys()
        
        print(f"EdDSACertificateManager initialized")
        print(f"Algorithm: Ed25519")
        print(f"Hash: SHA-512")

    def _init_keys(self) -> None:
        self.private_key_path = self.key_dir / "private_key.raw"
        self.public_key_path = self.key_dir / "public_key.raw"
        
        if self.private_key_path.exists():
            print(f"Loading existing keys...")
            try:
                self._load_existing_keys()
                return
            except Exception as e:
                print(f"Load failed: {e}")
        
        self._generate_new_keys()

    def _load_existing_keys(self) -> None:
        with open(self.private_key_path, "rb") as f:
            private_bytes = f.read()
        
        if len(private_bytes) != 32:
            raise ValueError(f"Invalid private key: {len(private_bytes)} bytes")
        
        self.private_key = ed25519.Ed25519PrivateKey.from_private_bytes(private_bytes)
        self.public_key = self.private_key.public_key()
        
        if self.public_key_path.exists():
            with open(self.public_key_path, "rb") as f:
                stored_public = f.read()
            
            current_public = self.public_key.public_bytes(
                encoding=serialization.Encoding.Raw,
                format=serialization.PublicFormat.Raw
            )
            
            if stored_public != current_public:
                raise ValueError("Public key mismatch")
        
        print(f"Loaded: 32-byte key pair")

    def _generate_new_keys(self) -> None:
        self.private_key = ed25519.Ed25519PrivateKey.generate()
        self.public_key = self.private_key.public_key()
        
        private_bytes = self.private_key.private_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PrivateFormat.Raw,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        with open(self.private_key_path, "wb") as f:
            f.write(private_bytes)
        
        try:
            os.chmod(self.private_key_path, 0o600)
        except:
            pass
        
        public_bytes = self.public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )
        
        with open(self.public_key_path, "wb") as f:
            f.write(public_bytes)
        
        print(f"Generated: New Ed25519 key pair")

    def sign_certificate(self, text_hash: str, cert_id: str) -> Dict:
        # Validasi format SHA-512
        if not re.match(r'^[a-f0-9]{128}$', text_hash.lower()):
            raise ValueError("Invalid SHA-512 hash format")
        
        if not cert_id or not isinstance(cert_id, str):
            raise ValueError("cert_id must be non-empty string")
        
        # Message yang di-sign: hash + cert_id binding
        message = f"text_hash={text_hash}|cert_id={cert_id}"
        
        # Sign dengan Ed25519
        signature = self.private_key.sign(message.encode('utf-8'))
        
        # Public key untuk distribusi
        public_key_bytes = self.public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )
        
        result = {
            "cert_id": cert_id,
            "text_hash": text_hash,
            "message": message,
            "signature": base64.b64encode(signature).decode('utf-8'),
            "public_key": base64.b64encode(public_key_bytes).decode('utf-8'),
            "algorithm": "Ed25519",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        print(f"🔏 Certificate Signed")
        print(f"   Cert ID: {cert_id}")
        print(f"   Hash: {text_hash[:32]}...")
        print(f"   Signature: {len(signature)} bytes")
        
        return result

    def verify_certificate(self, qr_data: Dict, current_text_hash: str) -> Dict:
        try:
            # Extract dari QR
            stored_hash = qr_data.get("h")
            stored_cert_id = qr_data.get("c")
            signature_b64 = qr_data.get("s")
            public_key_b64 = qr_data.get("p")
            
            if not all([stored_hash, stored_cert_id, signature_b64, public_key_b64]):
                return {
                    "valid": False,
                    "status": "INVALID_QR_FORMAT",
                    "message": "QR data incomplete"
                }
            
            # 1. Bandingkan hash
            hash_match = (stored_hash.lower() == current_text_hash.lower())
            
            # 2. Reconstruct message untuk verification
            message = f"text_hash={stored_hash}|cert_id={stored_cert_id}"
            
            # 3. Verify signature
            try:
                signature = base64.b64decode(signature_b64)
                public_key_bytes = base64.b64decode(public_key_b64)
                public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
                
                public_key.verify(signature, message.encode('utf-8'))
                sig_valid = True
            except InvalidSignature:
                sig_valid = False
            except Exception:
                sig_valid = False
            
            # 4. Determine status
            if hash_match and sig_valid:
                return {
                    "valid": True,
                    "status": "AUTHENTIC",
                    "message": "Sertifikat asli dan valid",
                    "cert_id": stored_cert_id,
                    "hash_match": True,
                    "signature_valid": True
                }
            elif not hash_match and sig_valid:
                return {
                    "valid": False,
                    "status": "TAMPERED",
                    "message": "Data sertifikat tidak cocok",
                    "hash_match": False,
                    "signature_valid": True
                }
            elif hash_match and not sig_valid:
                return {
                    "valid": False,
                    "status": "INVALID_SIGNATURE",
                    "message": "QR code tidak valid atau key salah",
                    "hash_match": True,
                    "signature_valid": False
                }
            else:
                return {
                    "valid": False,
                    "status": "COMPLETELY_INVALID",
                    "message": "Sertifikat dan QR tidak valid",
                    "hash_match": False,
                    "signature_valid": False
                }
                
        except Exception as e:
            return {
                "valid": False,
                "status": "ERROR",
                "message": f"Verification error: {str(e)}"
            }


crypto_manager = EdDSACertificateManager()
    # def get_public_key_info(self) -> Dict:
    #     """Info public key untuk distribusi"""
    #     public_key_bytes = self.public_key.public_bytes(
    #         encoding=serialization.Encoding.Raw,
    #         format=serialization.PublicFormat.Raw
    #     )
        
    #     return {
    #         "public_key_b64": base64.b64encode(public_key_bytes).decode('utf-8'),
    #         "public_key_hex": public_key_bytes.hex(),
    #         "algorithm": "Ed25519",
    #         "key_size_bytes": 32,
    #         "key_size_bits": 256,
    #         "curve": "edwards25519",
    #         "rfc8032_compliant": True
    #     }


# import base64
# import hashlib
# import re
# import json
# from datetime import datetime
# from pathlib import Path
# from cryptography.hazmat.primitives.asymmetric import ed25519
# from cryptography.hazmat.primitives import serialization
# from cryptography.exceptions import InvalidSignature
# from typing import Dict, Tuple, Optional

# class EdDSAManager:
#     """Manajer EdDSA dengan cert_id untuk uniqueness"""
#     def __init__(self, key_dir: str = "./keys"):
#         self.key_dir = Path(key_dir)
#         self.key_dir.mkdir(exist_ok=True, parents=True)
        
#         # Path didefinisikan di _init_keys saja
#         self.private_key = None
#         self.public_key = None
        
#         self._init_keys()  # Path di-set di sini
        
#         print(f"🔑 EdDSAManager initialized")
#         print(f"   Key directory: {self.key_dir.absolute()}")
#         print(f"   Private key: {self.private_key_path}")
#         print(f"   Public key: {self.public_key_path}")

#     # def __init__(self, key_dir: str = "./keys"):
#     #     self.key_dir = Path(key_dir)
#     #     self.key_dir.mkdir(exist_ok=True, parents=True)
        
#     #     self.private_key_path = self.key_dir / "private_key.pem"
#     #     self.public_key_path = self.key_dir / "public_key.pem"
        
#     #     self.private_key, self.public_key = self._init_keys()
        
#     #     print(f"🔑 EdDSAManager initialized")
#     #     print(f"   Key directory: {self.key_dir.absolute()}")
#     #     print(f"   Private key exists: {self.private_key_path.exists()}")
#     #     print(f"   Public key exists: {self.public_key_path.exists()}")

#     def _init_keys(self) -> Tuple[ed25519.Ed25519PrivateKey, ed25519.Ed25519PublicKey]:
#         """Inisialisasi key pair dengan RFC8032 Raw format"""
        
#         # Ganti extension ke .raw untuk jelas
#         self.private_key_path = self.key_dir / "private_key.raw"
#         self.public_key_path = self.key_dir / "public_key.raw"
        
#         if self.private_key_path.exists():
#             print(f"   Loading RFC8032 raw key...")
#             try:
#                 with open(self.private_key_path, "rb") as f:
#                     private_bytes = f.read()
                
#                 if len(private_bytes) != 32:
#                     raise ValueError(f"Invalid key length: {len(private_bytes)}, expected 32")
                
#                 private_key = ed25519.Ed25519PrivateKey.from_private_bytes(private_bytes)
#                 public_key = private_key.public_key()
                
#                 # Verifikasi public key match dengan file
#                 if self.public_key_path.exists():
#                     with open(self.public_key_path, "rb") as f:
#                         stored_public = f.read()
#                     current_public = public_key.public_bytes(
#                         encoding=serialization.Encoding.Raw,
#                         format=serialization.PublicFormat.Raw
#                     )
#                     if stored_public != current_public:
#                         print(f"   ⚠️ Public key mismatch, regenerating...")
#                         raise ValueError("Key mismatch")
                
#                 print(f"   ✓ Loaded: {len(private_bytes)} bytes seed (RFC8032)")
#                 return private_key, public_key
                
#             except Exception as e:
#                 print(f"   ⚠️ Failed to load: {e}")
#                 print(f"   Generating new key pair...")
        
#         # Generate baru
#         print(f"   Generating Ed25519 key pair...")
#         private_key = ed25519.Ed25519PrivateKey.generate()
#         public_key = private_key.public_key()
        
#         # Simpan dalam format RFC8032: Raw 32-byte
#         private_bytes = private_key.private_bytes(
#             encoding=serialization.Encoding.Raw,      # ✅ RFC8032
#             format=serialization.PrivateFormat.Raw,     # ✅ RFC8032
#             encryption_algorithm=serialization.NoEncryption()
#         )
        
#         with open(self.private_key_path, "wb") as f:
#             f.write(private_bytes)
        
#         # Set permission ketat (Unix)
#         import os
#         os.chmod(self.private_key_path, 0o600)
        
#         # Public key: Raw 32-byte
#         public_bytes = public_key.public_bytes(
#             encoding=serialization.Encoding.Raw,
#             format=serialization.PublicFormat.Raw
#         )
        
#         with open(self.public_key_path, "wb") as f:
#             f.write(public_bytes)
        
#         print(f"   ✓ Saved: {len(private_bytes)} bytes private, {len(public_bytes)} bytes public")
#         print(f"   ✓ Public key (hex): {public_bytes.hex()}")
        
#         return private_key, public_key
    

#     def hash_certificate_data(self, ocr_data: Dict) -> str:
#         """
#         Hash data sertifikat dengan SHA-512 (sesuai request Anda)
#         """
#         # Canonicalize data sertifikat
#         canonical = self._canonicalize_data(ocr_data)
        
#         # SHA-512 (64 bytes = 128 hex chars)
#         hash_bytes = hashlib.sha512(canonical.encode('utf-8')).digest()
#         return hash_bytes.hex()  # 128 character hex string

#     def _canonicalize_data(self, data: Dict) -> str:
#         """
#         Buat format kanonik untuk hashing - konsisten sorting
#         """
#         # Sort keys untuk konsistensi
#         sorted_items = sorted(data.items(), key=lambda x: x[0])
        
#         parts = []
#         for key, value in sorted_items:
#             # Normalisasi: lowercase, trim whitespace
#             clean_key = str(key).lower().strip()
#             clean_value = str(value).lower().strip()
#             parts.append(f"{clean_key}={clean_value}")
        
#         return "|".join(parts)

#     def sign_full_text(self, ocr_data: Dict, cert_id: str) -> Dict:
#         """
#         Sign dengan SHA-512 hash
#         """
#         # Generate hash SHA-512
#         text_hash = self.hash_certificate_data(ocr_data)
        
#         # Validasi: SHA-512 = 128 hex characters
#         if not text_hash or not re.match(r'^[a-f0-9]{128}$', text_hash.lower()):
#             raise ValueError("text_hash must be 128-character hex SHA-512")
        
#         # Message: hash + cert_id untuk uniqueness
#         message = f"text_hash={text_hash}|cert_id={cert_id}"
        
#         print(f"🔏 SIGNING (SHA-512)")
#         print(f"   Hash: {text_hash[:32]}...{text_hash[-32:]}")
#         print(f"   Cert ID: {cert_id}")
#         print(f"   Message: '{message[:60]}...'")
        
#         # Sign dengan Ed25519
#         signature = self.private_key.sign(message.encode('utf-8'))
        
#         # Public key untuk QR
#         public_key_bytes = self.public_key.public_bytes(
#             encoding=serialization.Encoding.Raw,
#             format=serialization.PublicFormat.Raw
#         )
        
#         return {
#             "mode": "full_text_sha512",
#             "text_hash": text_hash,  # 128 chars SHA-512
#             "cert_id": cert_id,
#             "message": message,
#             "signature": base64.b64encode(signature).decode('utf-8'),
#             "public_key": base64.b64encode(public_key_bytes).decode('utf-8'),
#             "algorithm": "Ed25519",
#             "hash_algorithm": "SHA-512",
#             "timestamp": datetime.utcnow().isoformat()
#         }

#     # def _init_keys(self) -> Tuple[ed25519.Ed25519PrivateKey, ed25519.Ed25519PublicKey]:
#     #     """Inisialisasi key pair"""
        
#     #     if self.private_key_path.exists():
#     #         print(f"   Loading existing private key...")
#     #         try:
#     #             with open(self.private_key_path, "rb") as f:
#     #                 private_key = serialization.load_pem_private_key(
#     #                     f.read(),
#     #                     password=None
#     #                 )
#     #             public_key = private_key.public_key()
#     #             print(f"   ✓ Key loaded successfully")
#     #             return private_key, public_key
#     #         except Exception as e:
#     #             print(f"   ⚠️ Failed to load key: {e}")
#     #             print(f"   Generating new key...")
        
#     #     # Generate new key
#     #     print(f"   Generating new Ed25519 key pair...")
#     #     private_key = ed25519.Ed25519PrivateKey.generate()
#     #     public_key = private_key.public_key()
        
#     #     # Save private key
#     #     with open(self.private_key_path, "wb") as f:
#     #         f.write(
#     #             private_key.private_bytes(
#     #                 encoding=serialization.Encoding.PEM,
#     #                 format=serialization.PrivateFormat.PKCS8,
#     #                 encryption_algorithm=serialization.NoEncryption()
#     #             )
#     #         )
#     #     print(f"   ✓ Private key saved")
        
#     #     # Save public key
#     #     with open(self.public_key_path, "wb") as f:
#     #         f.write(
#     #             public_key.public_bytes(
#     #                 encoding=serialization.Encoding.PEM,
#     #                 format=serialization.PublicFormat.SubjectPublicKeyInfo
#     #             )
#     #         )
#     #     print(f"   ✓ Public key saved")
        
#     #     return private_key, public_key

#     # ==================== SIGN dengan cert_id ====================
    
#     # def sign_full_text(self, text_hash: str, cert_id: str) -> Dict:
#     #     """
#     #     Sign dengan format: text_hash=xxx|cert_id=CERT-YYYYMMDD-XXXXXX
        
#     #     Args:
#     #         text_hash: SHA-256 hash dari OCR text (64 char hex)
#     #         cert_id: Unique certificate ID untuk memastikan uniqueness
        
#     #     Returns:
#     #         Dict dengan signature dan metadata
#     #     """
#     #     try:
#     #         # Tambahkan baris ini untuk proteksi:
#     #         if isinstance(cert_id, dict):
#     #             print(f"⚠️  WARNING: cert_id is dict, extracting 'id' or 'certificate_id'")
#     #             cert_id = cert_id.get('id') or cert_id.get('certificate_id')
#     #             if not cert_id:
#     #                 raise ValueError("Could not extract cert_id from dict")
            
#     #         # ✅ VALIDASI
#     #         if not text_hash or not re.match(r'^[a-f0-9]{64}$', text_hash.lower()):
#     #             raise ValueError("text_hash must be 64-character hex SHA-256")
            
#     #         if not cert_id or not isinstance(cert_id, str):
#     #             raise ValueError(f"cert_id must be string, got {type(cert_id)}: {cert_id}")
                
#     #         if not cert_id.startswith("CERT-"):
#     #             raise ValueError(f"cert_id harus format CERT-YYYYMMDD-XXXXXX, got: {cert_id}")
            
#     #         # ✅ MESSAGE: text_hash + cert_id (untuk uniqueness)
#     #         message = f"text_hash={text_hash}|cert_id={cert_id}"
            
#     #         print(f"🔏 SIGNING")
#     #         print(f"   Message: '{message}'")
#     #         print(f"   Length: {len(message)} bytes")
            
#     #         # Sign dengan Ed25519
#     #         signature = self.private_key.sign(message.encode('utf-8'))
#     #         print(f"   ✓ Signature created: {len(signature)} bytes")
            
#     #         # Public key dalam format raw (32 bytes untuk Ed25519)
#     #         public_key_bytes = self.public_key.public_bytes(
#     #             encoding=serialization.Encoding.Raw,
#     #             format=serialization.PublicFormat.Raw
#     #         )
            
#     #         return {
#     #             "mode": "full_text",
#     #             "message": message,
#     #             "text_hash": text_hash,
#     #             "cert_id": cert_id,
#     #             "signature": base64.b64encode(signature).decode('utf-8'),
#     #             "public_key": base64.b64encode(public_key_bytes).decode('utf-8'),
#     #             "algorithm": "Ed25519",
#     #             "timestamp": datetime.utcnow().isoformat()
#     #         }
            
#     #     except Exception as e:
#     #         print(f"❌ Error sign_full_text: {e}")
#     #         raise

#     # ==================== VERIFY ====================
    
#     def verify_full_text(self, text_hash: str, cert_id: str, 
#                         signature_b64: str, public_key_b64: str) -> Dict:
#         """
#         Verifikasi dengan reconstruct message dari text_hash + cert_id
#         """
#         try:
#             # ✅ Reconstruct message persis seperti saat sign
#             message = f"text_hash={text_hash}|cert_id={cert_id}"
            
#             print(f"🔍 VERIFYING")
#             print(f"   Reconstructed message: '{message}'")
            
#             # Decode signature
#             try:
#                 signature = base64.b64decode(signature_b64)
#                 print(f"   ✓ Signature decoded: {len(signature)} bytes")
#             except Exception as e:
#                 print(f"   ❌ Failed to decode signature: {e}")
#                 return {
#                     "valid": False,
#                     "message": "Invalid signature encoding",
#                     "error": str(e)
#                 }
            
#             # Decode public key
#             try:
#                 public_key_bytes = base64.b64decode(public_key_b64)
#                 public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
#                 print(f"   ✓ Public key reconstructed")
#             except Exception as e:
#                 print(f"   ❌ Failed to decode public key: {e}")
#                 return {
#                     "valid": False,
#                     "message": "Invalid public key encoding",
#                     "error": str(e)
#                 }
            
#             # Verify
#             try:
#                 public_key.verify(signature, message.encode('utf-8'))
#                 print(f"   ✅ Signature VALID")
#                 return {
#                     "valid": True,
#                     "message": "Signature valid - certificate authenticity confirmed",
#                     "verified_data": {
#                         "text_hash": text_hash,
#                         "cert_id": cert_id
#                     }
#                 }
#             except InvalidSignature:
#                 print(f"   ❌ InvalidSignature")
#                 return {
#                     "valid": False,
#                     "message": "Invalid signature - certificate may be tampered",
#                     "debug": {
#                         "expected_message": message,
#                         "signature_len": len(signature)
#                     }
#                 }
                
#         except Exception as e:
#             print(f"   ❌ Unexpected error: {e}")
#             import traceback
#             traceback.print_exc()
#             return {
#                 "valid": False,
#                 "message": f"Verification error: {str(e)}"
#             }

#     def verify_with_message(self, message: str, signature_b64: str, 
#                            public_key_b64: str) -> Dict:
#         """Verify dengan message yang sudah lengkap (dari database)"""
#         try:
#             print(f"🔍 Verifying with stored message: '{message}'")
            
#             signature = base64.b64decode(signature_b64)
#             public_key_bytes = base64.b64decode(public_key_b64)
#             public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
            
#             public_key.verify(signature, message.encode('utf-8'))
            
#             return {
#                 "valid": True,
#                 "message": "Signature valid"
#             }
            
#         except InvalidSignature as e:
#             print(f"   ❌ InvalidSignature: {e}")
#             return {
#                 "valid": False,
#                 "message": "Invalid signature"
#             }
#         except Exception as e:
#             print(f"   ❌ Error: {e}")
#             return {
#                 "valid": False,
#                 "message": f"Error: {str(e)}"
#             }

#     def get_public_key_info(self) -> Dict:
#         """Dapatkan public key untuk verifikasi publik"""
#         public_key_bytes = self.public_key.public_bytes(
#             encoding=serialization.Encoding.Raw,
#             format=serialization.PublicFormat.Raw
#         )
        
#         key_b64 = base64.b64encode(public_key_bytes).decode('utf-8')
#         print(f"🔑 Current Public Key: {key_b64[:20]}...")
        
#         return {
#             "public_key": key_b64,
#             "algorithm": "Ed25519",
#             "key_size_bits": 256,
#             "key_size_bytes": 32,
#             "encoding": "base64",
#             "curve": "edwards25519",
#             "rfc_compliance": "RFC 8032"
#         }

# # Global instance
# crypto_manager = EdDSAManager()

# # import base64
# # import hashlib
# # import re
# # import json
# # from datetime import datetime
# # from pathlib import Path
# # from cryptography.hazmat.primitives.asymmetric import ed25519
# # from cryptography.hazmat.primitives import serialization
# # from cryptography.exceptions import InvalidSignature
# # from typing import Dict, Tuple, Optional

# # class EdDSAManager:
# #     """Manajer EdDSA dengan 2 mode signing"""

# #     def __init__(self, key_dir: str = "./keys"):
# #         self.key_dir = Path(key_dir)
# #         self.key_dir.mkdir(exist_ok=True, parents=True)  # ✅ Pastikan direktori ada
        
# #         self.private_key_path = self.key_dir / "private_key.pem"
# #         self.public_key_path = self.key_dir / "public_key.pem"
        
# #         self.private_key, self.public_key = self._init_keys()
        
# #         # Debug
# #         print(f"🔑 EdDSAManager initialized")
# #         print(f"   Key directory: {self.key_dir.absolute()}")
# #         print(f"   Private key exists: {self.private_key_path.exists()}")
# #         print(f"   Public key exists: {self.public_key_path.exists()}")

# #     def _init_keys(self) -> Tuple[ed25519.Ed25519PrivateKey, ed25519.Ed25519PublicKey]:
# #         """Inisialisasi key pair - load existing atau generate baru"""
        
# #         if self.private_key_path.exists():
# #             print(f"   Loading existing private key...")
# #             try:
# #                 with open(self.private_key_path, "rb") as f:
# #                     private_key = serialization.load_pem_private_key(
# #                         f.read(),
# #                         password=None
# #                     )
# #                 public_key = private_key.public_key()
# #                 print(f"   ✓ Key loaded successfully")
# #                 return private_key, public_key
# #             except Exception as e:
# #                 print(f"   ⚠️ Failed to load key: {e}")
# #                 print(f"   Generating new key...")
        
# #         # Generate new key
# #         print(f"   Generating new Ed25519 key pair...")
# #         private_key = ed25519.Ed25519PrivateKey.generate()
# #         public_key = private_key.public_key()
        
# #         # Save private key
# #         with open(self.private_key_path, "wb") as f:
# #             f.write(
# #                 private_key.private_bytes(
# #                     encoding=serialization.Encoding.PEM,
# #                     format=serialization.PrivateFormat.PKCS8,
# #                     encryption_algorithm=serialization.NoEncryption()
# #                 )
# #             )
# #         print(f"   ✓ Private key saved to {self.private_key_path}")
        
# #         # Save public key
# #         with open(self.public_key_path, "wb") as f:
# #             f.write(
# #                 public_key.public_bytes(
# #                     encoding=serialization.Encoding.PEM,
# #                     format=serialization.PublicFormat.SubjectPublicKeyInfo
# #                 )
# #             )
# #         print(f"   ✓ Public key saved to {self.public_key_path}")
        
# #         return private_key, public_key

# #     # ==================== MODE 1: FULL-TEXT HASH ====================

# #     def sign_full_text(self, text_hash: str, metadata: Dict = None) -> Dict:
# #         try:
# #             # ✅ VALIDASI text_hash
# #             if not text_hash or not re.match(r'^[a-f0-9]{64}$', text_hash.lower()):
# #                 raise ValueError("text_hash must be 64-character hex SHA-256")
            
# #             # ✅ MESSAGE HANYA text_hash - tanpa metadata tambahan
# #             message = f"text_hash={text_hash}"
            
# #             print(f"🔏 SIGNING Message: '{message}'")
# #             print(f"   Message bytes: {message.encode('utf-8')}")
            
# #             # Sign dengan Ed25519
# #             signature = self.private_key.sign(message.encode('utf-8'))
# #             print(f"   Signature created: {len(signature)} bytes")
            
# #             # Public key dalam format raw bytes
# #             public_key_bytes = self.public_key.public_bytes(
# #                 encoding=serialization.Encoding.Raw,
# #                 format=serialization.PublicFormat.Raw
# #             )
            
# #             return {
# #                 "mode": "full_text",
# #                 "message": message,
# #                 "text_hash": text_hash,
# #                 "signature": base64.b64encode(signature).decode('utf-8'),
# #                 "public_key": base64.b64encode(public_key_bytes).decode('utf-8'),
# #                 "metadata": {},  # ✅ Kosong, tidak ada metadata
# #                 "timestamp": datetime.utcnow().isoformat()
# #             }
            
# #         except Exception as e:
# #             print(f"❌ Error sign_full_text: {e}")
# #             raise

# #     def verify_full_text(self, text_hash: str, signature_b64: str, 
# #                     public_key_b64: str, metadata: Dict = None) -> Dict:
# #         """Verifikasi dengan message yang hanya berisi text_hash"""
# #         try:
# #             # ✅ Reconstruct message - HANYA text_hash
# #             message = f"text_hash={text_hash}"
            
# #             print(f"🔍 VERIFYING Message: '{message}'")
            
# #             # Decode signature dan public key
# #             try:
# #                 signature = base64.b64decode(signature_b64)
# #                 print(f"   Signature decoded: {len(signature)} bytes")
# #             except Exception as e:
# #                 print(f"   ❌ Failed to decode signature: {e}")
# #                 raise
            
# #             try:
# #                 public_key_bytes = base64.b64decode(public_key_b64)
# #                 print(f"   Public key decoded: {len(public_key_bytes)} bytes")
# #             except Exception as e:
# #                 print(f"   ❌ Failed to decode public key: {e}")
# #                 raise
            
# #             # Reconstruct public key
# #             try:
# #                 public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
# #                 print(f"   Public key reconstructed successfully")
# #             except Exception as e:
# #                 print(f"   ❌ Failed to reconstruct public key: {e}")
# #                 raise
            
# #             # Verify signature
# #             try:
# #                 public_key.verify(signature, message.encode('utf-8'))
# #                 print(f"   ✅ Signature VALID")
# #                 return {
# #                     "valid": True,
# #                     "mode": "full_text",
# #                     "message": "Signature valid - text_hash integrity confirmed"
# #                 }
# #             except InvalidSignature as e:
# #                 print(f"   ❌ InvalidSignature: {e}")
# #                 return {
# #                     "valid": False,
# #                     "mode": "full_text",
# #                     "message": "Invalid signature",
# #                     "debug": {
# #                         "message": message,
# #                         "message_len": len(message),
# #                         "signature_len": len(signature),
# #                         "public_key_len": len(public_key_bytes)
# #                     }
# #                 }
                
# #         except Exception as e:
# #             print(f"   ❌ Unexpected error: {e}")
# #             import traceback
# #             traceback.print_exc()
# #             return {
# #                 "valid": False,
# #                 "mode": "full_text",
# #                 "message": f"Error: {str(e)}"
# #             }

# #     def verify_with_message(self, message: str, signature_b64: str, public_key_b64: str) -> Dict:
# #         """Verify dengan message yang sudah diketahui"""
# #         try:
# #             print(f"🔍 Verifying with stored message: '{message}'")
            
# #             signature = base64.b64decode(signature_b64)
# #             public_key_bytes = base64.b64decode(public_key_b64)
# #             public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
            
# #             public_key.verify(signature, message.encode('utf-8'))
            
# #             return {
# #                 "valid": True,
# #                 "mode": "full_text",
# #                 "message": "Signature valid"
# #             }
            
# #         except InvalidSignature as e:
# #             print(f"   ❌ InvalidSignature: {e}")
# #             return {
# #                 "valid": False,
# #                 "mode": "full_text",
# #                 "message": "Invalid signature"
# #             }
# #         except Exception as e:
# #             print(f"   ❌ Error: {e}")
# #             return {
# #                 "valid": False,
# #                 "mode": "full_text",
# #                 "message": f"Error: {str(e)}"
# #             }
    
# #     # crypto.py - sign_full_text method
# #     # def sign_full_text(self, text_hash: str, metadata: Dict = None) -> Dict:
# #     #     try:
# #     #         # ✅ VALIDASI
# #     #         if not text_hash or not re.match(r'^[a-f0-9]{64}$', text_hash.lower()):
# #     #             raise ValueError("text_hash must be 64-character hex SHA-256")
            
# #     #         # ✅ FILTER: Hanya gunakan filename dan issued_date, buang participant
# #     #         filtered_metadata = {}
# #     #         if metadata:
# #     #             # Ambil hanya field yang diperlukan untuk signature
# #     #             if 'filename' in metadata:
# #     #                 filtered_metadata['filename'] = metadata['filename']
# #     #             if 'issued_date' in metadata:
# #     #                 filtered_metadata['issued_date'] = metadata['issued_date']
# #     #             # participant SENGAJA dihapus dari signature
            
# #     #         # Message = hash + filtered_metadata
# #     #         message_parts = [f"text_hash={text_hash}"]
# #     #         if filtered_metadata:
# #     #             print(f"🔏 Signing with metadata: {filtered_metadata}")
# #     #             sorted_items = sorted(filtered_metadata.items(), key=lambda x: x[0])
# #     #             print(f"   Sorted metadata: {sorted_items}")
# #     #             for key, value in sorted_items:
# #     #                 clean_value = str(value).replace("|", "-").strip()
# #     #                 message_parts.append(f"{key}={clean_value}")
            
# #     #         message = "|".join(message_parts)
            
# #     #         print(f"🔏 SIGNING Message: '{message}'")
# #     #         print(f"   Message bytes: {message.encode('utf-8')}")
            
# #     #         # Sign
# #     #         signature = self.private_key.sign(message.encode('utf-8'))
# #     #         print(f"   Signature created: {len(signature)} bytes")
            
# #     #         # Public key
# #     #         public_key_bytes = self.public_key.public_bytes(
# #     #             encoding=serialization.Encoding.Raw,
# #     #             format=serialization.PublicFormat.Raw
# #     #         )
            
# #     #         return {
# #     #             "mode": "full_text",
# #     #             "message": message,
# #     #             "text_hash": text_hash,
# #     #             "signature": base64.b64encode(signature).decode('utf-8'),
# #     #             "public_key": base64.b64encode(public_key_bytes).decode('utf-8'),
# #     #             "metadata": filtered_metadata,  # Return filtered metadata
# #     #             "timestamp": datetime.utcnow().isoformat()
# #     #         }
            
# #     #     except Exception as e:
# #     #         print(f"❌ Error sign_full_text: {e}")
# #     #         raise

# #     # def verify_full_text(self, text_hash: str, signature_b64: str, 
# #     #                 public_key_b64: str, metadata: Dict = None) -> Dict:
# #     #     """Verifikasi mode full-text"""
# #     #     try:
# #     #         # ✅ FILTER metadata sama seperti saat sign
# #     #         filtered_metadata = {}
# #     #         if metadata:
# #     #             allowed_keys = ['filename', 'issued_date']
# #     #             for key in allowed_keys:
# #     #                 if key in metadata:
# #     #                     filtered_metadata[key] = metadata[key]
                
# #     #             # Sort untuk konsistensi
# #     #             for key in sorted(filtered_metadata.keys()):
# #     #                 value = filtered_metadata[key]
# #     #                 clean_value = str(value).replace("|", "-").strip()
# #     #                 message_parts.append(f"{key}={clean_value}")
            
# #     #         message = "|".join(message_parts)
        
# #     #         # Debug: bandingkan dengan expected
# #     #         print(f"🔍 VERIFYING:")
# #     #         print(f"   Reconstructed: '{message}'")
# #     #         print(f"   Expected from QR: 'text_hash={text_hash}|filename={metadata.get('filename', '')}|issued_date={metadata.get('issued_date', '')}'")
            
# #     #         # Decode
# #     #         try:
# #     #             signature = base64.b64decode(signature_b64)
# #     #             print(f"   Signature decoded: {len(signature)} bytes")
# #     #         except Exception as e:
# #     #             print(f"   ❌ Failed to decode signature: {e}")
# #     #             raise
            
# #     #         try:
# #     #             public_key_bytes = base64.b64decode(public_key_b64)
# #     #             print(f"   Public key decoded: {len(public_key_bytes)} bytes")
# #     #         except Exception as e:
# #     #             print(f"   ❌ Failed to decode public key: {e}")
# #     #             raise
            
# #     #         # Reconstruct public key
# #     #         try:
# #     #             public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
# #     #             print(f"   Public key reconstructed successfully")
# #     #         except Exception as e:
# #     #             print(f"   ❌ Failed to reconstruct public key: {e}")
# #     #             raise
            
# #     #         # Verify
# #     #         try:
# #     #             public_key.verify(signature, message.encode('utf-8'))
# #     #             print(f"   ✅ Signature VALID")
# #     #             return {
# #     #                 "valid": True,
# #     #                 "mode": "full_text",
# #     #                 "message": "Full-text hash signature valid"
# #     #             }
# #     #         except InvalidSignature as e:
# #     #             print(f"   ❌ InvalidSignature: {e}")
# #     #             # Debug: coba verify dengan cara lain
# #     #             return {
# #     #                 "valid": False,
# #     #                 "mode": "full_text",
# #     #                 "message": "Invalid signature",
# #     #                 "debug": {
# #     #                     "message": message,
# #     #                     "message_len": len(message),
# #     #                     "signature_len": len(signature),
# #     #                     "public_key_len": len(public_key_bytes)
# #     #                 }
# #     #             }
                
# #     #     except Exception as e:
# #     #         print(f"   ❌ Unexpected error: {e}")
# #     #         import traceback
# #     #         traceback.print_exc()
# #     #         return {
# #     #             "valid": False,
# #     #             "mode": "full_text",
# #     #             "message": f"Error: {str(e)}"
# #     #         }

# #     # ==================== MODE 2: STRUCTURED FIELDS ====================
    
# #     def sign_certificate(self, certificate_data: Dict) -> Dict:
# #         """
# #         Mode 2: Sign berdasarkan field terstruktur
# #         """
# #         try:
# #             # ✅ VALIDASI
# #             if not certificate_data:
# #                 raise ValueError("certificate_data cannot be empty")
            
# #             required_fields = ['certificate_id', 'recipient_name']
# #             for field in required_fields:
# #                 if field not in certificate_data:
# #                     raise ValueError(f"Missing required field: {field}")
            
# #             # Buat pesan kanonik
# #             sorted_fields = sorted(certificate_data.items(), key=lambda x: x[0])
# #             canonical_parts = []
# #             for key, value in sorted_fields:
# #                 clean_value = str(value).replace("|", "-").replace("\n", " ").strip()
# #                 canonical_parts.append(f"{key}={clean_value}")
            
# #             message = "|".join(canonical_parts)
            
# #             # Sign
# #             signature = self.private_key.sign(message.encode('utf-8'))
            
# #             # Public key
# #             public_key_bytes = self.public_key.public_bytes(
# #                 encoding=serialization.Encoding.Raw,
# #                 format=serialization.PublicFormat.Raw
# #             )
            
# #             return {
# #                 "mode": "structured",
# #                 "message": message,
# #                 "signature": base64.b64encode(signature).decode('utf-8'),
# #                 "public_key": base64.b64encode(public_key_bytes).decode('utf-8'),
# #                 "algorithm": "Ed25519",
# #                 "timestamp": datetime.utcnow().isoformat()
# #             }
            
# #         except Exception as e:
# #             print(f"❌ Error sign_certificate: {e}")
# #             raise

# #     def verify_certificate(self, message: str, signature_b64: str,  # ✅ RENAME
# #                           public_key_b64: str) -> Dict:
# #         """Verifikasi mode structured (alias: verify_signature)"""
# #         try:
# #             signature = base64.b64decode(signature_b64)
# #             public_key_bytes = base64.b64decode(public_key_b64)
            
# #             public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
# #             public_key.verify(signature, message.encode('utf-8'))
            
# #             return {
# #                 "valid": True,
# #                 "mode": "structured",
# #                 "message": "Certificate signature valid"
# #             }
            
# #         except InvalidSignature:
# #             return {
# #                 "valid": False,
# #                 "mode": "structured",
# #                 "message": "Invalid certificate signature"
# #             }
# #         except Exception as e:
# #             return {
# #                 "valid": False,
# #                 "mode": "structured",
# #                 "message": f"Error: {str(e)}"
# #             }
    
# #     # Backward compatibility alias
# #     verify_signature = verify_certificate  # ✅ Alias untuk kode lama

# #     # Di crypto.py, tambahkan di __init__ dan get_public_key_info
# #     def get_public_key_info(self) -> Dict:
# #         """Dapatkan public key"""
# #         public_key_bytes = self.public_key.public_bytes(
# #             encoding=serialization.Encoding.Raw,
# #             format=serialization.PublicFormat.Raw
# #         )
        
# #         # Debug: print key fingerprint
# #         key_b64 = base64.b64encode(public_key_bytes).decode('utf-8')
# #         print(f"🔑 Current Public Key: {key_b64[:20]}...")
        
# #         return {
# #             "public_key": key_b64,
# #             "algorithm": "Ed25519",
# #             "key_size_bits": 256,
# #             "key_size_bytes": 32,
# #             "encoding": "base64"
# #         }
    
# #     # def verify_with_message(self, message: str, signature_b64: str, public_key_b64: str) -> Dict:
# #     #     """Verify dengan message yang sudah diketahui (dari database)"""
# #     #     try:
# #     #         print(f"🔍 Verifying with stored message: '{message}'")
            
# #     #         signature = base64.b64decode(signature_b64)
# #     #         public_key_bytes = base64.b64decode(public_key_b64)
# #     #         public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
            
# #     #         public_key.verify(signature, message.encode('utf-8'))
            
# #     #         return {
# #     #             "valid": True,
# #     #             "mode": "full_text",
# #     #             "message": "Signature valid"
# #     #         }
            
# #     #     except InvalidSignature as e:
# #     #         print(f"   ❌ InvalidSignature: {e}")
# #     #         return {
# #     #             "valid": False,
# #     #             "mode": "full_text",
# #     #             "message": "Invalid signature"
# #     #         }
# #     #     except Exception as e:
# #     #         print(f"   ❌ Error: {e}")
# #     #         return {
# #     #             "valid": False,
# #     #             "mode": "full_text",
# #     #             "message": f"Error: {str(e)}"
# #     #         }
        
# #     # Di crypto.py, tambahkan method untuk validasi key consistency
# #     def verify_key_consistency(self):
# #         """Cek apakah key pair valid"""
# #         test_message = b"test"
# #         signature = self.private_key.sign(test_message)
# #         try:
# #             self.public_key.verify(signature, test_message)
# #             return True
# #         except:
# #             return False

# # # Global instance
# # crypto_manager = EdDSAManager()