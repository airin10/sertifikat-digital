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
        
        print(f"Certificate Signed")
        print(f"Cert ID: {cert_id}")
        print(f"Hash: {text_hash[:32]}...")
        print(f"Signature: {len(signature)} bytes")
        
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



