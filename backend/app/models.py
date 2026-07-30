''' SKEMA DATABASE '''
# isi database yang mau diinput

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, ForeignKey, Enum, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    PARTICIPANT = "participant"

# Menyimpan data pengguna(admin dan peserta)
class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.PARTICIPANT, index=True)
    full_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    certificates = relationship("Certificate", back_populates="participant", foreign_keys="Certificate.user_id")
    
# Menyimpan semua data sertifikat
class Certificate(Base):
    __tablename__ = "certificates"
    
    # id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String(50), primary_key=True, unique=True, index=True, nullable=False)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="RESTRICT"))
    
    # Certificate Data
    title = Column(String(200), nullable=False)
    description = Column(Text)
    institution = Column(String(100))
    issued_date = Column(String(20))
    
    # OCR & Hash
    text_hash = Column(String(128), index=True)
    raw_text = Column(Text)
    
    # Crypto
    message = Column(Text, nullable=False)
    signature = Column(Text, nullable=False)
    public_key = Column(Text, nullable=False)
    
    # QR & Files
    qr_payload = Column(JSON)
    qr_image_path = Column(String(255))
    final_certificate_path = Column(String(255))
    
    # QR Position
    qr_x = Column(Integer, default=100)
    qr_y = Column(Integer, default=100)
    qr_size = Column(Integer, default=150)
    
    # Status
    is_revoked = Column(Boolean, default=False, index=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    participant = relationship("User", back_populates="certificates", foreign_keys=[user_id])
    verification_logs = relationship("VerificationLog", back_populates="certificate")

# merekam setiap kali seseorang memverifikasi sertifikat (berhasil atau gagal)
class VerificationLog(Base):
    __tablename__ = "verification_logs"
    
    verification_id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String(50), ForeignKey("certificates.certificate_id"), nullable=False, index=True)
    text_hash = Column(String(128))
    verification_result = Column(Boolean)
    verified_at = Column(DateTime(timezone=True), server_default=func.now())
    details = Column(JSON)
    certificate = relationship("Certificate", back_populates="verification_logs")
    