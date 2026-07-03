# import base64
# import hashlib
# import re
# import os
# import time  # ✅ Ditambahkan untuk pengukuran waktu
# from datetime import datetime, timezone
# from pathlib import Path
# from typing import Dict
# from cryptography.hazmat.primitives.asymmetric import ed25519, rsa, dsa, ec, padding
# from cryptography.hazmat.primitives import serialization, hashes
# from cryptography.exceptions import InvalidSignature


# class MultiAlgorithmCryptoManager:
#     def __init__(self, key_dir: str = "./keys"):
#         self.key_dir = Path(key_dir)
#         self.key_dir.mkdir(exist_ok=True, parents=True)
        
#         # Inisialisasi kunci untuk setiap algoritma
#         self.keys = {}
#         self._init_all_keys()
        
#         print("MultiAlgorithmCryptoManager berjalan")

#     def _init_all_keys(self):
#         """Inisialisasi kunci untuk semua algoritma"""
#         algorithms = ['ed25519', 'rsa', 'dsa', 'ecdsa']
        
#         for algo in algorithms:
#             private_key_path = self.key_dir / f"{algo}_private_key.raw"
#             public_key_path = self.key_dir / f"{algo}_public_key.raw"
            
#             if private_key_path.exists():
#                 self._load_key(algo, private_key_path, public_key_path)
#             else:
#                 self._generate_key(algo, private_key_path, public_key_path)

#     def _load_key(self, algo: str, private_key_path: Path, public_key_path: Path):
#         """Load kunci yang sudah ada"""
#         with open(private_key_path, "rb") as f:
#             private_bytes = f.read()
        
#         if algo == 'ed25519':
#             private_key = ed25519.Ed25519PrivateKey.from_private_bytes(private_bytes)
#         elif algo == 'rsa':
#             private_key = serialization.load_pem_private_key(private_bytes, password=None)
#         elif algo == 'dsa':
#             private_key = serialization.load_pem_private_key(private_bytes, password=None)
#         elif algo == 'ecdsa':
#             private_key = serialization.load_pem_private_key(private_bytes, password=None)
        
#         self.keys[algo] = {
#             'private': private_key,
#             'public': private_key.public_key()
#         }
#         print(f"Loaded {algo} keys")

#     def _generate_key(self, algo: str, private_key_path: Path, public_key_path: Path):
#         """Generate kunci baru"""
#         # ✅ Ukur waktu key generation
#         start_time = time.perf_counter()
        
#         if algo == 'ed25519':
#             private_key = ed25519.Ed25519PrivateKey.generate()
#             private_bytes = private_key.private_bytes(
#                 encoding=serialization.Encoding.Raw,
#                 format=serialization.PrivateFormat.Raw,
#                 encryption_algorithm=serialization.NoEncryption()
#             )
#         elif algo == 'rsa':
#             private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
#             private_bytes = private_key.private_bytes(
#                 encoding=serialization.Encoding.PEM,
#                 format=serialization.PrivateFormat.PKCS8,
#                 encryption_algorithm=serialization.NoEncryption()
#             )
#         elif algo == 'dsa':
#             private_key = dsa.generate_private_key(key_size=2048)
#             private_bytes = private_key.private_bytes(
#                 encoding=serialization.Encoding.PEM,
#                 format=serialization.PrivateFormat.PKCS8,
#                 encryption_algorithm=serialization.NoEncryption()
#             )
#         elif algo == 'ecdsa':
#             private_key = ec.generate_private_key(ec.SECP256R1())
#             private_bytes = private_key.private_bytes(
#                 encoding=serialization.Encoding.PEM,
#                 format=serialization.PrivateFormat.PKCS8,
#                 encryption_algorithm=serialization.NoEncryption()
#             )
        
#         # ✅ Hitung waktu key generation
#         keygen_time = (time.perf_counter() - start_time) * 1000  # Konversi ke ms
        
#         with open(private_key_path, "wb") as f:
#             f.write(private_bytes)
        
#         public_key = private_key.public_key()
#         if algo == 'ed25519':
#             public_bytes = public_key.public_bytes(
#                 encoding=serialization.Encoding.Raw,
#                 format=serialization.PublicFormat.Raw
#             )
#         else:
#             public_bytes = public_key.public_bytes(
#                 encoding=serialization.Encoding.PEM,
#                 format=serialization.PublicFormat.SubjectPublicKeyInfo
#             )
        
#         with open(public_key_path, "wb") as f:
#             f.write(public_bytes)
        
#         self.keys[algo] = {
#             'private': private_key,
#             'public': public_key
#         }
#         print(f"Generated {algo} keys (Key Gen Time: {keygen_time:.4f} ms)")

#     def sign_certificate(self, text_hash: str, cert_id: str, algorithm: str = 'ed25519') -> Dict:
#         """Sign sertifikat dengan algoritma yang dipilih"""
#         if not re.match(r'^[a-f0-9]{128}$', text_hash.lower()):
#             raise ValueError("Invalid SHA-512 hash format")
        
#         if not cert_id or not isinstance(cert_id, str):
#             raise ValueError("cert_id must be non-empty string")
        
#         message = f"text_hash={text_hash}|cert_id={cert_id}"
#         message_bytes = message.encode('utf-8')
        
#         private_key = self.keys[algorithm]['private']
        
#         # ✅ Mulai pengukuran waktu signing
#         start_sign = time.perf_counter()
        
#         # Sign berdasarkan algoritma
#         if algorithm == 'ed25519':
#             signature = private_key.sign(message_bytes)
#         elif algorithm == 'rsa':
#             signature = private_key.sign(message_bytes, padding.PKCS1v15(), hashes.SHA256())
#         elif algorithm == 'dsa':
#             signature = private_key.sign(message_bytes, hashes.SHA256())
#         elif algorithm == 'ecdsa':
#             signature = private_key.sign(message_bytes, ec.ECDSA(hashes.SHA256()))
        
#         # ✅ Hitung waktu signing
#         sign_time = (time.perf_counter() - start_sign) * 1000  # Konversi ke ms
        
#         # Encode public key
#         public_key = self.keys[algorithm]['public']
#         if algorithm == 'ed25519':
#             public_key_bytes = public_key.public_bytes(
#                 encoding=serialization.Encoding.Raw,
#                 format=serialization.PublicFormat.Raw
#             )
#         else:
#             public_key_bytes = public_key.public_bytes(
#                 encoding=serialization.Encoding.PEM,
#                 format=serialization.PublicFormat.SubjectPublicKeyInfo
#             )
        
#         result = {
#             "cert_id": cert_id,
#             "text_hash": text_hash,
#             "message": message,
#             "signature": base64.b64encode(signature).decode('utf-8'),
#             "public_key": base64.b64encode(public_key_bytes).decode('utf-8'),
#             "algorithm": algorithm.upper(),
#             "timestamp": datetime.now(timezone.utc).isoformat()
#         }
        
#         print(f"\n{'='*60}")
#         print(f"Certificate Signed with {algorithm.upper()}")
#         print(f"{'='*60}")
#         print(f"Cert ID     : {cert_id}")
#         print(f"Hash        : {text_hash[:50]}...")
#         print(f"Signature   : {len(signature)} bytes")
#         print(f"⏱️ Signing Time: {sign_time:.4f} ms")
#         print(f"{'='*60}\n")
        
#         return result

#     def verify_certificate(self, qr_data: Dict, current_text_hash: str) -> Dict:
#         """Verify sertifikat (otomatis detect algoritma dari QR)"""
#         try:
#             stored_integrity = qr_data.get("h")
#             stored_hash = current_text_hash.lower()
#             stored_cert_id = qr_data.get("c")
#             signature_b64 = qr_data.get("s")
#             public_key_b64 = qr_data.get("p")
#             algorithm = qr_data.get("alg", "ed25519").lower()
            
#             if not all([stored_hash, stored_cert_id, signature_b64, public_key_b64]):
#                 return {"valid": False, "status": "INVALID_QR_FORMAT", "message": "QR data incomplete"}
            
#             hash_match = (stored_integrity.lower() == current_text_hash.lower())
#             message = f"text_hash={stored_hash}|cert_id={stored_cert_id}"
            
#             # ✅ Mulai pengukuran waktu verification
#             start_verify = time.perf_counter()
            
#             try:
#                 signature = base64.b64decode(signature_b64)
#                 public_key_bytes = base64.b64decode(public_key_b64)
                
#                 # Load public key berdasarkan algoritma
#                 if algorithm == 'ed25519':
#                     public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
#                     public_key.verify(signature, message.encode('utf-8'))
#                 elif algorithm == 'rsa':
#                     public_key = serialization.load_pem_public_key(public_key_bytes)
#                     public_key.verify(signature, message.encode('utf-8'), padding.PKCS1v15(), hashes.SHA256())
#                 elif algorithm == 'dsa':
#                     public_key = serialization.load_pem_public_key(public_key_bytes)
#                     public_key.verify(signature, message.encode('utf-8'), hashes.SHA256())
#                 elif algorithm == 'ecdsa':
#                     public_key = serialization.load_pem_public_key(public_key_bytes)
#                     public_key.verify(signature, message.encode('utf-8'), ec.ECDSA(hashes.SHA256()))
                
#                 sig_valid = True
#             except InvalidSignature:
#                 sig_valid = False
#             except Exception as err:
#                 print(f"Verification error: {err}")
#                 sig_valid = False
            
#             # ✅ Hitung waktu verification
#             verify_time = (time.perf_counter() - start_verify) * 1000  # Konversi ke ms
            
#             # Return result
#             if hash_match and sig_valid:
#                 result = {"valid": True, "status": "AUTHENTIC", "message": "Sertifikat asli dan valid", "hash_match": True, "signature_valid": True}
#             elif not hash_match and sig_valid:
#                 result = {"valid": False, "status": "TAMPERED", "message": "Data sertifikat tidak cocok", "hash_match": False, "signature_valid": True}
#             elif hash_match and not sig_valid:
#                 result = {"valid": False, "status": "INVALID_SIGNATURE", "message": "QR code tidak valid atau key salah", "hash_match": True, "signature_valid": False}
#             else:
#                 result = {"valid": False, "status": "COMPLETELY_INVALID", "message": "Sertifikat dan QR tidak valid", "hash_match": False, "signature_valid": False}
            
#             # ✅ Tampilkan hasil verification dengan waktu
#             print(f"\n{'='*60}")
#             print(f"Verification Result ({algorithm.upper()})")
#             print(f"{'='*60}")
#             print(f"Status      : {result['status']}")
#             print(f"Message     : {result['message']}")
#             print(f"Hash Match  : {'✅' if result['hash_match'] else '❌'} {result['hash_match']}")
#             print(f"Sig Valid   : {'✅' if result['signature_valid'] else '❌'} {result['signature_valid']}")
#             print(f"⏱️ Verify Time: {verify_time:.4f} ms")
#             print(f"{'='*60}\n")
            
#             return result
                
#         except Exception as e:
#             return {"valid": False, "status": "ERROR", "message": f"Verification error: {str(e)}"}


# crypto_manager = MultiAlgorithmCryptoManager()

import base64
import hashlib
import re
import os
from datetime import datetime, timezone
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
        
        print(f"EdDSACertificateManager berjalan")

    def _print_key_info(self) -> None:
        """Helper function untuk mencetak detail kunci ke console"""
        # Serialize ke raw bytes untuk mendapatkan hex dan ukuran yang benar
        private_bytes = self.private_key.private_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PrivateFormat.Raw,
            encryption_algorithm=serialization.NoEncryption()
        )
        public_bytes = self.public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )

        print("\n--- HASIL KEY GENERATION ED25519 ---")
        print(f"Ukuran Private Key: {len(private_bytes)} bytes")
        print(f"Private Key (Hex): {private_bytes.hex()}")
        print(f"\nUkuran Public Key: {len(public_bytes)} bytes")
        print(f"Public Key (Hex): {public_bytes.hex()}")
        print("------------------------------------\n")

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
        
        self._print_key_info()

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
        self._print_key_info()

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
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"Certificate Signed")
        print(f"Cert ID: {cert_id}")
        print(f"Hash: {text_hash}...")
        print(f"Signature: {len(signature)} bytes")
        print(f"Signature: {signature}")
        R = signature[:32]
        S = signature[32:]
        print(f"R: {(R.hex())}")
        print(f"S: {(S.hex())}")
        
        return result

    def verify_certificate(self, qr_data: Dict, current_text_hash: str) -> Dict:
        try:
            # stored_hash = qr_data.get("h")
            stored_integrity = qr_data.get("h")
            stored_hash = current_text_hash.lower()
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
            hash_match = (stored_integrity.lower() == current_text_hash.lower())
            
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
                print(f"Verification error: {e}")
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



