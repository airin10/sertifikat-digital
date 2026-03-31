#!/usr/bin/env python3
import sys
import os
import getpass

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

import pymysql
from sqlalchemy import inspect, text

try:
    from app.config import (
        MYSQL_HOST, MYSQL_PORT, MYSQL_USER, 
        MYSQL_PASSWORD, MYSQL_DATABASE, DATABASE_URL
    )
    from app.database import engine, SessionLocal, Base
    from app.models import User, UserRole, Certificate, VerificationLog
    from app.auth import get_password_hash
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)


def print_header(title: str):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def print_success(message: str):
    print(f"{message}")


def print_error(message: str):
    print(f"{message}")


def print_info(message: str):
    print(f"{message}")


def print_warning(message: str):
    print(f"{message}")


def check_mysql_connection() -> bool:
    print_info("Mengecek koneksi MySQL...")
    try:
        conn_params = {
            'host': MYSQL_HOST,
            'user': MYSQL_USER,
            'port': int(MYSQL_PORT),
            'connect_timeout': 5
        }
        if MYSQL_PASSWORD:
            conn_params['password'] = MYSQL_PASSWORD
            
        conn = pymysql.connect(**conn_params)
        conn.close()
        print_success(f"Terhubung ke MySQL server ({MYSQL_HOST}:{MYSQL_PORT})")
        return True
    except pymysql.Error as e:
        print_error(f"Tidak bisa connect ke MySQL: {e}")
        print_info("\nCek konfigurasi di app/config.py:")
        print(f"  Host: {MYSQL_HOST}:{MYSQL_PORT}")
        print(f"  User: {MYSQL_USER}")
        print(f"  Password: {'(kosong - XAMPP default)' if not MYSQL_PASSWORD else '***'}")
        print(f"  Database: {MYSQL_DATABASE}")
        print("\nPastikan XAMPP MySQL sudah running (port 3307)")
        return False


def reset_database() -> bool:
    print_header("STEP 1: RESET DATABASE")
    
    try:
        conn_params = {
            'host': MYSQL_HOST,
            'user': MYSQL_USER,
            'port': int(MYSQL_PORT)
        }
        if MYSQL_PASSWORD:
            conn_params['password'] = MYSQL_PASSWORD
            
        conn = pymysql.connect(**conn_params)
        cursor = conn.cursor()
        
        cursor.execute(f"DROP DATABASE IF EXISTS `{MYSQL_DATABASE}`")
        print_success(f"Database '{MYSQL_DATABASE}' dihapus (jika ada)")
        
        cursor.execute(f"""
            CREATE DATABASE `{MYSQL_DATABASE}` 
            CHARACTER SET utf8mb4 
            COLLATE utf8mb4_unicode_ci
        """)
        print_success(f"Database '{MYSQL_DATABASE}' dibuat baru")
        
        cursor.close()
        conn.close()
        return True
        
    except pymysql.Error as e:
        print_error(f"MySQL Error: {e}")
        return False


def create_tables() -> bool:
    """Create semua tables via SQLAlchemy"""
    print_header("STEP 2: CREATE TABLES")
    
    try:
        print_info("Testing koneksi ke database...")
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print_success("Koneksi ke database OK")
        
        print_info("Membuat tables...")
        Base.metadata.create_all(bind=engine)
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print_success(f"{len(tables)} tables berhasil dibuat:")
        for table in tables:
            columns = inspector.get_columns(table)
            print(f"{table} ({len(columns)} columns)")
        
        return True
        
    except Exception as e:
        print_error(f"SQLAlchemy Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def create_first_admin() -> bool:
    print_header("STEP 3: CREATE ADMIN USER")
    
    db = SessionLocal()
    
    try:
        existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if existing_admin:
            print_warning(f"Admin sudah ada: {existing_admin.username}")
            response = input("\nBuat admin tambahan? (y/n): ").lower().strip()
            if response != 'y':
                print_info("Skip pembuatan admin")
                return True
        
        print("\nMasukkan data admin:")
        print("-" * 50)
        
        while True:
            username = input("Username: ").strip()
            if not username or len(username) < 3:
                print_error("Username minimal 3 karakter!")
                continue
            if db.query(User).filter(User.username == username).first():
                print_error("Username sudah digunakan!")
                continue
            break
        
        while True:
            email = input("Email: ").strip()
            if not email or '@' not in email:
                print_error("Email tidak valid!")
                continue
            if db.query(User).filter(User.email == email).first():
                print_error("Email sudah digunakan!")
                continue
            break
        
        while True:
            full_name = input("Nama Lengkap: ").strip()
            if not full_name:
                print_error("Nama tidak boleh kosong!")
                continue
            break
        
        while True:
            password = getpass.getpass("Password: ")
            if len(password) < 6:
                print_error("Password minimal 6 karakter!")
                continue
            
            confirm = getpass.getpass("Konfirmasi Password: ")
            if password != confirm:
                print_error("Password tidak cocok!")
                continue
            break
        
        admin = User(
            username=username,
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(password),
            role=UserRole.ADMIN,
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        
        print_success("Admin berhasil dibuat!")
        print(f"\nUsername: {username}")
        print(f"Email: {email}")
        print(f"Role: ADMIN")
        
        return True
        
    except Exception as e:
        print_error(f"Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def verify_setup() -> bool:
    """Verifikasi setup"""
    print_header("STEP 4: VERIFICATION")
    
    try:
        db = SessionLocal()
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print_info(f"Tables: {', '.join(sorted(tables))}")
        
        admin_count = db.query(User).filter(User.role == UserRole.ADMIN).count()
        print_info(f"Admin users: {admin_count}")
        
        db.close()
        
        print_success("Setup berhasil!")
        return True
        
    except Exception as e:
        print_error(f"Error: {e}")
        return False


def show_summary():
    """Tampilkan summary"""
    print_header("SETUP COMPLETE!")
    
    print(f"""
   Database '{MYSQL_DATABASE}' siap digunakan!

   Next Steps:
   cd backend
   python -m uvicorn app.main:app --reload

   Info:
   • MySQL: {MYSQL_HOST}:{MYSQL_PORT}
   • User: {MYSQL_USER}
   • Password: {'(kosong)' if not MYSQL_PASSWORD else '***'}
    """)


def main():
    """Main execution"""
    print_header("SERTIFIKAT DIGITAL - DATABASE SETUP")
    print(f"MySQL: {MYSQL_HOST}:{MYSQL_PORT}")
    print(f"Database: {MYSQL_DATABASE}")
    
    if not check_mysql_connection():
        sys.exit(1)
    
    print_warning("Semua data akan dihapus!")
    confirm = input("\nKetik 'yes' untuk lanjutkan: ").lower().strip()
    if confirm != 'yes':
        print_info("Dibatalkan")
        sys.exit(0)
    
    if not reset_database():
        sys.exit(1)
    
    if not create_tables():
        sys.exit(1)
    
    create_first_admin()
    verify_setup()
    show_summary()


if __name__ == "__main__":
    main()