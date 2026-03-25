#!/usr/bin/env python3
"""
Inisialisasi database - jalankan: python init_db.py
"""

from app.database import engine, Base
from app.models import Certificate

def init_database():
    print("=" * 50)
    print("Certificate System - Database Initialization")
    print("=" * 50)
    
    try:
        print("\n📦 Creating tables...")
        Base.metadata.create_all(bind=engine)
        
        print("\n✅ Success!")
        print("  - Table: certificates")
        print("\n🎉 Database ready!")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nCek:")
        print("1. MySQL running?")
        print("2. Database 'certificate_system' sudah dibuat?")
        print("3. User/password di config.py benar?")
        raise

if __name__ == "__main__":
    init_database()