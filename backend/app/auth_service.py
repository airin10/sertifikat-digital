# menangani autentikasi(siapa yang login) dan otorisasi (apa yang boleh dilakukan)

from datetime import datetime, timedelta, timezone
from typing import Optional
import hashlib

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.models import User, UserRole
from app.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def get_password_hash(password: str) -> str:
    """
    Hash password dengan SHA-256 + bcrypt (double-hash pattern).
    """
    # SHA-256 -> Mengubah password panjang menjadi hash tetap 64 karakter, mencegah masalah panjang input bcrypt (max 72 bytes)
    # Bcrypt -> Menambahkan salt otomatis dan work factor, tahan terhadap rainbow table attack dan brute force
    password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    return pwd_context.hash(password_hash)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifikasi password dengan double-hash pattern.
    """
    password_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    return pwd_context.verify(password_hash, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    
    now = datetime.now(timezone.utc)
    
    to_encode.update({"iat": now})
    
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    # Encode JWT
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# USER AUTHENTICATION
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Validasi JWT token dan return user object.
    Digunakan sebagai dependency di endpoint yang butuh autentikasi.
    """
    # 1. Extract token dari header
    token = credentials.credentials
    
    # 2. Decode token
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah kedaluwarsa",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Extract username dengan validasi tipe data
    username = payload.get("sub")
    if username is None or not isinstance(username, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 4. Cari user di database
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User tidak ditemukan",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 5. Check apakah user aktif
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun telah dinonaktifkan",
        )
    
    return user


# ROLE-BASED ACCESS CONTROL (RBAC)
def require_role(role: UserRole):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Akses ditolak. Dibutuhkan role: {role.value}"
            )
        return current_user
    return role_checker

get_current_admin = require_role(UserRole.ADMIN)

get_current_participant = require_role(UserRole.PARTICIPANT)
