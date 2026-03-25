import base64
import hashlib
import re
import json
from datetime import datetime
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from cryptography.exceptions import InvalidSignature
from typing import Dict, Tuple, Optional

class EdDSAManager:
    """Manajer EdDSA dengan cert_id untuk uniqueness"""

    def __init__(self, key_dir: str = "./keys"):
        self.key_dir = Path(key_dir)
        self.key_dir.mkdir(exist_ok=True, parents=True)
        
        self.private_key_path = self.key_dir / "private_key.pem"
        self.public_key_path = self.key_dir / "public_key.pem"
        
        self.private_key, self.public_key = self._init_keys()
        
        print(f"🔑 EdDSAManager initialized")
        print(f"   Key directory: {self.key_dir.absolute()}")
        print(f"   Private key exists: {self.private_key_path.exists()}")
        print(f"   Public key exists: {self.public_key_path.exists()}")

    def _init_keys(self) -> Tuple[ed25519.Ed25519PrivateKey, ed25519.Ed25519PublicKey]:
        """Inisialisasi key pair"""
        
        if self.private_key_path.exists():
            print(f"   Loading existing private key...")
            try:
                with open(self.private_key_path, "rb") as f:
                    private_key = serialization.load_pem_private_key(
                        f.read(),
                        password=None
                    )
                public_key = private_key.public_key()
                print(f"   ✓ Key loaded successfully")
                return private_key, public_key
            except Exception as e:
                print(f"   ⚠️ Failed to load key: {e}")
                print(f"   Generating new key...")
        
        # Generate new key
        print(f"   Generating new Ed25519 key pair...")
        private_key = ed25519.Ed25519PrivateKey.generate()
        public_key = private_key.public_key()
        
        # Save private key
        with open(self.private_key_path, "wb") as f:
            f.write(
                private_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.PKCS8,
                    encryption_algorithm=serialization.NoEncryption()
                )
            )
        print(f"   ✓ Private key saved")
        
        # Save public key
        with open(self.public_key_path, "wb") as f:
            f.write(
                public_key.public_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PublicFormat.SubjectPublicKeyInfo
                )
            )
        print(f"   ✓ Public key saved")
        
        return private_key, public_key

    # ==================== SIGN dengan cert_id ====================
    
    def sign_full_text(self, text_hash: str, cert_id: str) -> Dict:
        """
        Sign dengan format: text_hash=xxx|cert_id=CERT-YYYYMMDD-XXXXXX
        
        Args:
            text_hash: SHA-256 hash dari OCR text (64 char hex)
            cert_id: Unique certificate ID untuk memastikan uniqueness
        
        Returns:
            Dict dengan signature dan metadata
        """
        try:
            # Tambahkan baris ini untuk proteksi:
            if isinstance(cert_id, dict):
                print(f"⚠️  WARNING: cert_id is dict, extracting 'id' or 'certificate_id'")
                cert_id = cert_id.get('id') or cert_id.get('certificate_id')
                if not cert_id:
                    raise ValueError("Could not extract cert_id from dict")
            
            # ✅ VALIDASI
            if not text_hash or not re.match(r'^[a-f0-9]{64}$', text_hash.lower()):
                raise ValueError("text_hash must be 64-character hex SHA-256")
            
            if not cert_id or not isinstance(cert_id, str):
                raise ValueError(f"cert_id must be string, got {type(cert_id)}: {cert_id}")
                
            if not cert_id.startswith("CERT-"):
                raise ValueError(f"cert_id harus format CERT-YYYYMMDD-XXXXXX, got: {cert_id}")
            
            # ✅ MESSAGE: text_hash + cert_id (untuk uniqueness)
            message = f"text_hash={text_hash}|cert_id={cert_id}"
            
            print(f"🔏 SIGNING")
            print(f"   Message: '{message}'")
            print(f"   Length: {len(message)} bytes")
            
            # Sign dengan Ed25519
            signature = self.private_key.sign(message.encode('utf-8'))
            print(f"   ✓ Signature created: {len(signature)} bytes")
            
            # Public key dalam format raw (32 bytes untuk Ed25519)
            public_key_bytes = self.public_key.public_bytes(
                encoding=serialization.Encoding.Raw,
                format=serialization.PublicFormat.Raw
            )
            
            return {
                "mode": "full_text",
                "message": message,
                "text_hash": text_hash,
                "cert_id": cert_id,
                "signature": base64.b64encode(signature).decode('utf-8'),
                "public_key": base64.b64encode(public_key_bytes).decode('utf-8'),
                "algorithm": "Ed25519",
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"❌ Error sign_full_text: {e}")
            raise

    # ==================== VERIFY ====================
    
    def verify_full_text(self, text_hash: str, cert_id: str, 
                        signature_b64: str, public_key_b64: str) -> Dict:
        """
        Verifikasi dengan reconstruct message dari text_hash + cert_id
        """
        try:
            # ✅ Reconstruct message persis seperti saat sign
            message = f"text_hash={text_hash}|cert_id={cert_id}"
            
            print(f"🔍 VERIFYING")
            print(f"   Reconstructed message: '{message}'")
            
            # Decode signature
            try:
                signature = base64.b64decode(signature_b64)
                print(f"   ✓ Signature decoded: {len(signature)} bytes")
            except Exception as e:
                print(f"   ❌ Failed to decode signature: {e}")
                return {
                    "valid": False,
                    "message": "Invalid signature encoding",
                    "error": str(e)
                }
            
            # Decode public key
            try:
                public_key_bytes = base64.b64decode(public_key_b64)
                public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
                print(f"   ✓ Public key reconstructed")
            except Exception as e:
                print(f"   ❌ Failed to decode public key: {e}")
                return {
                    "valid": False,
                    "message": "Invalid public key encoding",
                    "error": str(e)
                }
            
            # Verify
            try:
                public_key.verify(signature, message.encode('utf-8'))
                print(f"   ✅ Signature VALID")
                return {
                    "valid": True,
                    "message": "Signature valid - certificate authenticity confirmed",
                    "verified_data": {
                        "text_hash": text_hash,
                        "cert_id": cert_id
                    }
                }
            except InvalidSignature:
                print(f"   ❌ InvalidSignature")
                return {
                    "valid": False,
                    "message": "Invalid signature - certificate may be tampered",
                    "debug": {
                        "expected_message": message,
                        "signature_len": len(signature)
                    }
                }
                
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}")
            import traceback
            traceback.print_exc()
            return {
                "valid": False,
                "message": f"Verification error: {str(e)}"
            }

    def verify_with_message(self, message: str, signature_b64: str, 
                           public_key_b64: str) -> Dict:
        """Verify dengan message yang sudah lengkap (dari database)"""
        try:
            print(f"🔍 Verifying with stored message: '{message}'")
            
            signature = base64.b64decode(signature_b64)
            public_key_bytes = base64.b64decode(public_key_b64)
            public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
            
            public_key.verify(signature, message.encode('utf-8'))
            
            return {
                "valid": True,
                "message": "Signature valid"
            }
            
        except InvalidSignature as e:
            print(f"   ❌ InvalidSignature: {e}")
            return {
                "valid": False,
                "message": "Invalid signature"
            }
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return {
                "valid": False,
                "message": f"Error: {str(e)}"
            }

    def get_public_key_info(self) -> Dict:
        """Dapatkan public key untuk verifikasi publik"""
        public_key_bytes = self.public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )
        
        key_b64 = base64.b64encode(public_key_bytes).decode('utf-8')
        print(f"🔑 Current Public Key: {key_b64[:20]}...")
        
        return {
            "public_key": key_b64,
            "algorithm": "Ed25519",
            "key_size_bits": 256,
            "key_size_bytes": 32,
            "encoding": "base64",
            "curve": "edwards25519",
            "rfc_compliance": "RFC 8032"
        }

# Global instance
crypto_manager = EdDSAManager()

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
#     """Manajer EdDSA dengan 2 mode signing"""

#     def __init__(self, key_dir: str = "./keys"):
#         self.key_dir = Path(key_dir)
#         self.key_dir.mkdir(exist_ok=True, parents=True)  # ✅ Pastikan direktori ada
        
#         self.private_key_path = self.key_dir / "private_key.pem"
#         self.public_key_path = self.key_dir / "public_key.pem"
        
#         self.private_key, self.public_key = self._init_keys()
        
#         # Debug
#         print(f"🔑 EdDSAManager initialized")
#         print(f"   Key directory: {self.key_dir.absolute()}")
#         print(f"   Private key exists: {self.private_key_path.exists()}")
#         print(f"   Public key exists: {self.public_key_path.exists()}")

#     def _init_keys(self) -> Tuple[ed25519.Ed25519PrivateKey, ed25519.Ed25519PublicKey]:
#         """Inisialisasi key pair - load existing atau generate baru"""
        
#         if self.private_key_path.exists():
#             print(f"   Loading existing private key...")
#             try:
#                 with open(self.private_key_path, "rb") as f:
#                     private_key = serialization.load_pem_private_key(
#                         f.read(),
#                         password=None
#                     )
#                 public_key = private_key.public_key()
#                 print(f"   ✓ Key loaded successfully")
#                 return private_key, public_key
#             except Exception as e:
#                 print(f"   ⚠️ Failed to load key: {e}")
#                 print(f"   Generating new key...")
        
#         # Generate new key
#         print(f"   Generating new Ed25519 key pair...")
#         private_key = ed25519.Ed25519PrivateKey.generate()
#         public_key = private_key.public_key()
        
#         # Save private key
#         with open(self.private_key_path, "wb") as f:
#             f.write(
#                 private_key.private_bytes(
#                     encoding=serialization.Encoding.PEM,
#                     format=serialization.PrivateFormat.PKCS8,
#                     encryption_algorithm=serialization.NoEncryption()
#                 )
#             )
#         print(f"   ✓ Private key saved to {self.private_key_path}")
        
#         # Save public key
#         with open(self.public_key_path, "wb") as f:
#             f.write(
#                 public_key.public_bytes(
#                     encoding=serialization.Encoding.PEM,
#                     format=serialization.PublicFormat.SubjectPublicKeyInfo
#                 )
#             )
#         print(f"   ✓ Public key saved to {self.public_key_path}")
        
#         return private_key, public_key

#     # ==================== MODE 1: FULL-TEXT HASH ====================

#     def sign_full_text(self, text_hash: str, metadata: Dict = None) -> Dict:
#         try:
#             # ✅ VALIDASI text_hash
#             if not text_hash or not re.match(r'^[a-f0-9]{64}$', text_hash.lower()):
#                 raise ValueError("text_hash must be 64-character hex SHA-256")
            
#             # ✅ MESSAGE HANYA text_hash - tanpa metadata tambahan
#             message = f"text_hash={text_hash}"
            
#             print(f"🔏 SIGNING Message: '{message}'")
#             print(f"   Message bytes: {message.encode('utf-8')}")
            
#             # Sign dengan Ed25519
#             signature = self.private_key.sign(message.encode('utf-8'))
#             print(f"   Signature created: {len(signature)} bytes")
            
#             # Public key dalam format raw bytes
#             public_key_bytes = self.public_key.public_bytes(
#                 encoding=serialization.Encoding.Raw,
#                 format=serialization.PublicFormat.Raw
#             )
            
#             return {
#                 "mode": "full_text",
#                 "message": message,
#                 "text_hash": text_hash,
#                 "signature": base64.b64encode(signature).decode('utf-8'),
#                 "public_key": base64.b64encode(public_key_bytes).decode('utf-8'),
#                 "metadata": {},  # ✅ Kosong, tidak ada metadata
#                 "timestamp": datetime.utcnow().isoformat()
#             }
            
#         except Exception as e:
#             print(f"❌ Error sign_full_text: {e}")
#             raise

#     def verify_full_text(self, text_hash: str, signature_b64: str, 
#                     public_key_b64: str, metadata: Dict = None) -> Dict:
#         """Verifikasi dengan message yang hanya berisi text_hash"""
#         try:
#             # ✅ Reconstruct message - HANYA text_hash
#             message = f"text_hash={text_hash}"
            
#             print(f"🔍 VERIFYING Message: '{message}'")
            
#             # Decode signature dan public key
#             try:
#                 signature = base64.b64decode(signature_b64)
#                 print(f"   Signature decoded: {len(signature)} bytes")
#             except Exception as e:
#                 print(f"   ❌ Failed to decode signature: {e}")
#                 raise
            
#             try:
#                 public_key_bytes = base64.b64decode(public_key_b64)
#                 print(f"   Public key decoded: {len(public_key_bytes)} bytes")
#             except Exception as e:
#                 print(f"   ❌ Failed to decode public key: {e}")
#                 raise
            
#             # Reconstruct public key
#             try:
#                 public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
#                 print(f"   Public key reconstructed successfully")
#             except Exception as e:
#                 print(f"   ❌ Failed to reconstruct public key: {e}")
#                 raise
            
#             # Verify signature
#             try:
#                 public_key.verify(signature, message.encode('utf-8'))
#                 print(f"   ✅ Signature VALID")
#                 return {
#                     "valid": True,
#                     "mode": "full_text",
#                     "message": "Signature valid - text_hash integrity confirmed"
#                 }
#             except InvalidSignature as e:
#                 print(f"   ❌ InvalidSignature: {e}")
#                 return {
#                     "valid": False,
#                     "mode": "full_text",
#                     "message": "Invalid signature",
#                     "debug": {
#                         "message": message,
#                         "message_len": len(message),
#                         "signature_len": len(signature),
#                         "public_key_len": len(public_key_bytes)
#                     }
#                 }
                
#         except Exception as e:
#             print(f"   ❌ Unexpected error: {e}")
#             import traceback
#             traceback.print_exc()
#             return {
#                 "valid": False,
#                 "mode": "full_text",
#                 "message": f"Error: {str(e)}"
#             }

#     def verify_with_message(self, message: str, signature_b64: str, public_key_b64: str) -> Dict:
#         """Verify dengan message yang sudah diketahui"""
#         try:
#             print(f"🔍 Verifying with stored message: '{message}'")
            
#             signature = base64.b64decode(signature_b64)
#             public_key_bytes = base64.b64decode(public_key_b64)
#             public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
            
#             public_key.verify(signature, message.encode('utf-8'))
            
#             return {
#                 "valid": True,
#                 "mode": "full_text",
#                 "message": "Signature valid"
#             }
            
#         except InvalidSignature as e:
#             print(f"   ❌ InvalidSignature: {e}")
#             return {
#                 "valid": False,
#                 "mode": "full_text",
#                 "message": "Invalid signature"
#             }
#         except Exception as e:
#             print(f"   ❌ Error: {e}")
#             return {
#                 "valid": False,
#                 "mode": "full_text",
#                 "message": f"Error: {str(e)}"
#             }
    
#     # crypto.py - sign_full_text method
#     # def sign_full_text(self, text_hash: str, metadata: Dict = None) -> Dict:
#     #     try:
#     #         # ✅ VALIDASI
#     #         if not text_hash or not re.match(r'^[a-f0-9]{64}$', text_hash.lower()):
#     #             raise ValueError("text_hash must be 64-character hex SHA-256")
            
#     #         # ✅ FILTER: Hanya gunakan filename dan issued_date, buang participant
#     #         filtered_metadata = {}
#     #         if metadata:
#     #             # Ambil hanya field yang diperlukan untuk signature
#     #             if 'filename' in metadata:
#     #                 filtered_metadata['filename'] = metadata['filename']
#     #             if 'issued_date' in metadata:
#     #                 filtered_metadata['issued_date'] = metadata['issued_date']
#     #             # participant SENGAJA dihapus dari signature
            
#     #         # Message = hash + filtered_metadata
#     #         message_parts = [f"text_hash={text_hash}"]
#     #         if filtered_metadata:
#     #             print(f"🔏 Signing with metadata: {filtered_metadata}")
#     #             sorted_items = sorted(filtered_metadata.items(), key=lambda x: x[0])
#     #             print(f"   Sorted metadata: {sorted_items}")
#     #             for key, value in sorted_items:
#     #                 clean_value = str(value).replace("|", "-").strip()
#     #                 message_parts.append(f"{key}={clean_value}")
            
#     #         message = "|".join(message_parts)
            
#     #         print(f"🔏 SIGNING Message: '{message}'")
#     #         print(f"   Message bytes: {message.encode('utf-8')}")
            
#     #         # Sign
#     #         signature = self.private_key.sign(message.encode('utf-8'))
#     #         print(f"   Signature created: {len(signature)} bytes")
            
#     #         # Public key
#     #         public_key_bytes = self.public_key.public_bytes(
#     #             encoding=serialization.Encoding.Raw,
#     #             format=serialization.PublicFormat.Raw
#     #         )
            
#     #         return {
#     #             "mode": "full_text",
#     #             "message": message,
#     #             "text_hash": text_hash,
#     #             "signature": base64.b64encode(signature).decode('utf-8'),
#     #             "public_key": base64.b64encode(public_key_bytes).decode('utf-8'),
#     #             "metadata": filtered_metadata,  # Return filtered metadata
#     #             "timestamp": datetime.utcnow().isoformat()
#     #         }
            
#     #     except Exception as e:
#     #         print(f"❌ Error sign_full_text: {e}")
#     #         raise

#     # def verify_full_text(self, text_hash: str, signature_b64: str, 
#     #                 public_key_b64: str, metadata: Dict = None) -> Dict:
#     #     """Verifikasi mode full-text"""
#     #     try:
#     #         # ✅ FILTER metadata sama seperti saat sign
#     #         filtered_metadata = {}
#     #         if metadata:
#     #             allowed_keys = ['filename', 'issued_date']
#     #             for key in allowed_keys:
#     #                 if key in metadata:
#     #                     filtered_metadata[key] = metadata[key]
                
#     #             # Sort untuk konsistensi
#     #             for key in sorted(filtered_metadata.keys()):
#     #                 value = filtered_metadata[key]
#     #                 clean_value = str(value).replace("|", "-").strip()
#     #                 message_parts.append(f"{key}={clean_value}")
            
#     #         message = "|".join(message_parts)
        
#     #         # Debug: bandingkan dengan expected
#     #         print(f"🔍 VERIFYING:")
#     #         print(f"   Reconstructed: '{message}'")
#     #         print(f"   Expected from QR: 'text_hash={text_hash}|filename={metadata.get('filename', '')}|issued_date={metadata.get('issued_date', '')}'")
            
#     #         # Decode
#     #         try:
#     #             signature = base64.b64decode(signature_b64)
#     #             print(f"   Signature decoded: {len(signature)} bytes")
#     #         except Exception as e:
#     #             print(f"   ❌ Failed to decode signature: {e}")
#     #             raise
            
#     #         try:
#     #             public_key_bytes = base64.b64decode(public_key_b64)
#     #             print(f"   Public key decoded: {len(public_key_bytes)} bytes")
#     #         except Exception as e:
#     #             print(f"   ❌ Failed to decode public key: {e}")
#     #             raise
            
#     #         # Reconstruct public key
#     #         try:
#     #             public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
#     #             print(f"   Public key reconstructed successfully")
#     #         except Exception as e:
#     #             print(f"   ❌ Failed to reconstruct public key: {e}")
#     #             raise
            
#     #         # Verify
#     #         try:
#     #             public_key.verify(signature, message.encode('utf-8'))
#     #             print(f"   ✅ Signature VALID")
#     #             return {
#     #                 "valid": True,
#     #                 "mode": "full_text",
#     #                 "message": "Full-text hash signature valid"
#     #             }
#     #         except InvalidSignature as e:
#     #             print(f"   ❌ InvalidSignature: {e}")
#     #             # Debug: coba verify dengan cara lain
#     #             return {
#     #                 "valid": False,
#     #                 "mode": "full_text",
#     #                 "message": "Invalid signature",
#     #                 "debug": {
#     #                     "message": message,
#     #                     "message_len": len(message),
#     #                     "signature_len": len(signature),
#     #                     "public_key_len": len(public_key_bytes)
#     #                 }
#     #             }
                
#     #     except Exception as e:
#     #         print(f"   ❌ Unexpected error: {e}")
#     #         import traceback
#     #         traceback.print_exc()
#     #         return {
#     #             "valid": False,
#     #             "mode": "full_text",
#     #             "message": f"Error: {str(e)}"
#     #         }

#     # ==================== MODE 2: STRUCTURED FIELDS ====================
    
#     def sign_certificate(self, certificate_data: Dict) -> Dict:
#         """
#         Mode 2: Sign berdasarkan field terstruktur
#         """
#         try:
#             # ✅ VALIDASI
#             if not certificate_data:
#                 raise ValueError("certificate_data cannot be empty")
            
#             required_fields = ['certificate_id', 'recipient_name']
#             for field in required_fields:
#                 if field not in certificate_data:
#                     raise ValueError(f"Missing required field: {field}")
            
#             # Buat pesan kanonik
#             sorted_fields = sorted(certificate_data.items(), key=lambda x: x[0])
#             canonical_parts = []
#             for key, value in sorted_fields:
#                 clean_value = str(value).replace("|", "-").replace("\n", " ").strip()
#                 canonical_parts.append(f"{key}={clean_value}")
            
#             message = "|".join(canonical_parts)
            
#             # Sign
#             signature = self.private_key.sign(message.encode('utf-8'))
            
#             # Public key
#             public_key_bytes = self.public_key.public_bytes(
#                 encoding=serialization.Encoding.Raw,
#                 format=serialization.PublicFormat.Raw
#             )
            
#             return {
#                 "mode": "structured",
#                 "message": message,
#                 "signature": base64.b64encode(signature).decode('utf-8'),
#                 "public_key": base64.b64encode(public_key_bytes).decode('utf-8'),
#                 "algorithm": "Ed25519",
#                 "timestamp": datetime.utcnow().isoformat()
#             }
            
#         except Exception as e:
#             print(f"❌ Error sign_certificate: {e}")
#             raise

#     def verify_certificate(self, message: str, signature_b64: str,  # ✅ RENAME
#                           public_key_b64: str) -> Dict:
#         """Verifikasi mode structured (alias: verify_signature)"""
#         try:
#             signature = base64.b64decode(signature_b64)
#             public_key_bytes = base64.b64decode(public_key_b64)
            
#             public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
#             public_key.verify(signature, message.encode('utf-8'))
            
#             return {
#                 "valid": True,
#                 "mode": "structured",
#                 "message": "Certificate signature valid"
#             }
            
#         except InvalidSignature:
#             return {
#                 "valid": False,
#                 "mode": "structured",
#                 "message": "Invalid certificate signature"
#             }
#         except Exception as e:
#             return {
#                 "valid": False,
#                 "mode": "structured",
#                 "message": f"Error: {str(e)}"
#             }
    
#     # Backward compatibility alias
#     verify_signature = verify_certificate  # ✅ Alias untuk kode lama

#     # Di crypto.py, tambahkan di __init__ dan get_public_key_info
#     def get_public_key_info(self) -> Dict:
#         """Dapatkan public key"""
#         public_key_bytes = self.public_key.public_bytes(
#             encoding=serialization.Encoding.Raw,
#             format=serialization.PublicFormat.Raw
#         )
        
#         # Debug: print key fingerprint
#         key_b64 = base64.b64encode(public_key_bytes).decode('utf-8')
#         print(f"🔑 Current Public Key: {key_b64[:20]}...")
        
#         return {
#             "public_key": key_b64,
#             "algorithm": "Ed25519",
#             "key_size_bits": 256,
#             "key_size_bytes": 32,
#             "encoding": "base64"
#         }
    
#     # def verify_with_message(self, message: str, signature_b64: str, public_key_b64: str) -> Dict:
#     #     """Verify dengan message yang sudah diketahui (dari database)"""
#     #     try:
#     #         print(f"🔍 Verifying with stored message: '{message}'")
            
#     #         signature = base64.b64decode(signature_b64)
#     #         public_key_bytes = base64.b64decode(public_key_b64)
#     #         public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
            
#     #         public_key.verify(signature, message.encode('utf-8'))
            
#     #         return {
#     #             "valid": True,
#     #             "mode": "full_text",
#     #             "message": "Signature valid"
#     #         }
            
#     #     except InvalidSignature as e:
#     #         print(f"   ❌ InvalidSignature: {e}")
#     #         return {
#     #             "valid": False,
#     #             "mode": "full_text",
#     #             "message": "Invalid signature"
#     #         }
#     #     except Exception as e:
#     #         print(f"   ❌ Error: {e}")
#     #         return {
#     #             "valid": False,
#     #             "mode": "full_text",
#     #             "message": f"Error: {str(e)}"
#     #         }
        
#     # Di crypto.py, tambahkan method untuk validasi key consistency
#     def verify_key_consistency(self):
#         """Cek apakah key pair valid"""
#         test_message = b"test"
#         signature = self.private_key.sign(test_message)
#         try:
#             self.public_key.verify(signature, test_message)
#             return True
#         except:
#             return False

# # Global instance
# crypto_manager = EdDSAManager()