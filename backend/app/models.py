from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    PARTICIPANT = "participant"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.PARTICIPANT)
    full_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    certificates = relationship("Certificate", back_populates="participant", foreign_keys="Certificate.participant_id")
    created_certificates = relationship("Certificate", back_populates="creator", foreign_keys="Certificate.created_by")

class Certificate(Base):
    __tablename__ = "certificates"
    
    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String(50), unique=True, index=True, nullable=False)
    
    # Foreign Keys
    participant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Certificate Data
    title = Column(String(200), nullable=False)
    description = Column(Text)
    institution = Column(String(100))
    issued_date = Column(String(20))
    expiry_date = Column(String(20), nullable=True)
    
    # OCR & Hash
    text_hash = Column(String(64), index=True)
    raw_text = Column(Text)
    
    # Crypto
    message = Column(Text)
    signature = Column(Text)
    public_key = Column(Text)
    
    # QR & Files
    qr_payload = Column(JSON)
    qr_image_path = Column(String(255))
    certificate_image_path = Column(String(255))
    template_path = Column(String(255))
    
    # QR Position
    qr_x = Column(Integer, default=100)
    qr_y = Column(Integer, default=100)
    qr_size = Column(Integer, default=150)
    
    # Status
    is_revoked = Column(Boolean, default=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_reason = Column(String(255), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    participant = relationship("User", back_populates="certificates", foreign_keys=[participant_id])
    creator = relationship("User", back_populates="created_certificates", foreign_keys=[created_by])

class VerificationLog(Base):
    __tablename__ = "verification_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String(50), index=True)
    text_hash = Column(String(64))
    verification_result = Column(Boolean)
    ip_address = Column(String(45))
    user_agent = Column(String(255))
    verified_at = Column(DateTime(timezone=True), server_default=func.now())
    details = Column(JSON)

# from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON
# from sqlalchemy.sql import func
# from app.database import Base

# class Certificate(Base):
#     __tablename__ = "certificates"
    
#     id = Column(Integer, primary_key=True, index=True)
#     certificate_id = Column(String(50), unique=True, index=True)
    
#     # Data penerima
#     recipient_name = Column(String(100), nullable=False)
#     recipient_email = Column(String(100), nullable=False, index=True)
#     institution = Column(String(100))
#     course_name = Column(String(100))
#     issued_date = Column(String(20))
    
#     # OCR & Hash
#     text_hash = Column(String(64), index=True)
#     raw_text = Column(Text)
    
#     # Crypto - TAMBAHKAN message
#     message = Column(Text)  # ✅ Simpan message yang di-sign!
#     signature = Column(Text)
#     public_key = Column(Text)
    
#     # QR Code
#     qr_payload = Column(JSON)
#     qr_image_path = Column(String(255))
    
#     # File paths
#     template_path = Column(String(255))
#     final_certificate_path = Column(String(255))
    
#     # QR Position
#     qr_x = Column(Integer, default=100)
#     qr_y = Column(Integer, default=100)
#     qr_size = Column(Integer, default=150)
    
#     # Metadata
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     is_revoked = Column(Boolean, default=False)
#     revoked_at = Column(DateTime(timezone=True), nullable=True)

#     def to_dict(self):
#         return {
#             'id': self.id,
#             'certificate_id': self.certificate_id,
#             'recipient_name': self.recipient_name,
#             'recipient_email': self.recipient_email,
#             'institution': self.institution,
#             'course_name': self.course_name,
#             'issued_date': self.issued_date,
#             'text_hash': self.text_hash,
#             'created_at': self.created_at.isoformat() if self.created_at else None,
#             'is_revoked': self.is_revoked
#         }