# #!/usr/bin/env python3
# """
# Script untuk membuat admin pertama kali.
# Jalankan: python create_first_admin.py
# """

# from database import SessionLocal
# from models import User, UserRole
# from routers.auth import get_password_hash
# import getpass

# def create_first_admin():
#     print("=" * 50)
#     print("CertiChain - Create First Admin")
#     print("=" * 50)
    
#     db = SessionLocal()
    
#     try:
#         # Check if any admin exists
#         existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
#         if existing_admin:
#             print(f"\n⚠️  Admin sudah ada: {existing_admin.username}")
#             print("Script ini hanya untuk setup awal.")
#             return
        
#         print("\n📝 Masukkan data admin pertama:")
#         print("-" * 50)
        
#         username = input("Username: ").strip()
#         if not username:
#             print("❌ Username tidak boleh kosong!")
#             return
            
#         # Check if username exists
#         if db.query(User).filter(User.username == username).first():
#             print("❌ Username sudah digunakan!")
#             return
        
#         email = input("Email: ").strip()
#         if not email or '@' not in email:
#             print("❌ Email tidak valid!")
#             return
            
#         # Check if email exists
#         if db.query(User).filter(User.email == email).first():
#             print("❌ Email sudah digunakan!")
#             return
        
#         full_name = input("Nama Lengkap: ").strip()
#         if not full_name:
#             print("❌ Nama tidak boleh kosong!")
#             return
        
#         password = getpass.getpass("Password: ")
#         if len(password) < 6:
#             print("❌ Password minimal 6 karakter!")
#             return
            
#         confirm_password = getpass.getpass("Konfirmasi Password: ")
#         if password != confirm_password:
#             print("❌ Password tidak cocok!")
#             return
        
#         # Create admin
#         hashed_password = get_password_hash(password)
#         admin = User(
#             username=username,
#             email=email,
#             full_name=full_name,
#             hashed_password=hashed_password,
#             role=UserRole.ADMIN,
#             is_active=True
#         )
        
#         db.add(admin)
#         db.commit()
        
#         print("\n" + "=" * 50)
#         print("✅ Admin berhasil dibuat!")
#         print(f"   Username: {username}")
#         print(f"   Email: {email}")
#         print(f"   Role: ADMIN")
#         print("=" * 50)
#         print("\n🎉 Sekarang Anda bisa login di /login")
        
#     except Exception as e:
#         print(f"\n❌ Error: {e}")
#         db.rollback()
#     finally:
#         db.close()

# if __name__ == "__main__":
#     create_first_admin()