#!/usr/bin/env python3
"""
Script untuk membuat 5 participant.
Jalankan: python seed_participants.py
"""

import sys
import os

# Tambahkan parent directory ke path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

from app.database import SessionLocal, engine
from app.models import User, UserRole, Base
from app.auth import get_password_hash
from datetime import datetime

def seed_participants():
    print("=" * 60)
    print("CertiChain - Seed 5 Participants")
    print("=" * 60)
    
    # Buat tabel jika belum ada
    print("\n📦 Memastikan tabel sudah dibuat...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Cek apakah sudah ada participant
        existing_count = db.query(User).filter(User.role == UserRole.PARTICIPANT).count()
        print(f"\n📊 Participant yang sudah ada: {existing_count}")
        
        # Data 5 Participant
        participants_data = [
            {
                "username": "ahmad_hidayat",
                "email": "ahmad.hidayat@email.com",
                "password": "participant123",
                "full_name": "Ahmad Hidayat",
            },
            {
                "username": "siti_nurhaliza",
                "email": "siti.nurhaliza@email.com",
                "password": "participant123",
                "full_name": "Siti Nurhaliza",
            },
            {
                "username": "budi_santoso",
                "email": "budi.santoso@email.com",
                "password": "participant123",
                "full_name": "Budi Santoso",
            },
            {
                "username": "dewi_kartika",
                "email": "dewi.kartika@email.com",
                "password": "participant123",
                "full_name": "Dewi Kartika",
            },
            {
                "username": "eko_prasetyo",
                "email": "eko.prasetyo@email.com",
                "password": "participant123",
                "full_name": "Eko Prasetyo",
            }
        ]
        
        print("\n📝 Membuat 5 participant...")
        print("-" * 60)
        
        created_count = 0
        skipped_count = 0
        
        for i, p_data in enumerate(participants_data, 1):
            # Cek apakah username sudah ada
            existing = db.query(User).filter(User.username == p_data["username"]).first()
            
            if existing:
                print(f"  {i}. ⚠️  SKIP: {p_data['username']} sudah ada (ID: {existing.id})")
                skipped_count += 1
                continue
            
            # Cek apakah email sudah ada
            existing_email = db.query(User).filter(User.email == p_data["email"]).first()
            if existing_email:
                print(f"  {i}. ⚠️  SKIP: Email {p_data['email']} sudah digunakan")
                skipped_count += 1
                continue
            
            # Hash password
            hashed_password = get_password_hash(p_data["password"])
            
            # Create participant
            participant = User(
                username=p_data["username"],
                email=p_data["email"],
                full_name=p_data["full_name"],
                hashed_password=hashed_password,
                role=UserRole.PARTICIPANT,
                is_active=True,
                created_at=datetime.utcnow()
            )
            
            db.add(participant)
            db.commit()  # Commit satu per satu untuk dapat ID
            db.refresh(participant)
            
            created_count += 1
            print(f"  {i}. ✅ CREATED: {p_data['full_name']} (ID: {participant.id}, Username: {p_data['username']})")
        
        print("-" * 60)
        print(f"\n📊 RINGKASAN:")
        print(f"   Dibuat baru: {created_count}")
        print(f"   Dilewati: {skipped_count}")
        print(f"   Total: {created_count + skipped_count}")
        
        # Tampilkan semua participant
        all_participants = db.query(User).filter(User.role == UserRole.PARTICIPANT).all()
        print(f"\n📋 SEMUA PARTICIPANT DI DATABASE ({len(all_participants)} total):")
        print("-" * 80)
        print(f"{'ID':<5} {'Username':<20} {'Nama Lengkap':<25} {'Email':<30} {'Status'}")
        print("-" * 80)
        
        for p in all_participants:
            status = "Aktif" if p.is_active else "Nonaktif"
            print(f"{p.id:<5} {p.username:<20} {p.full_name:<25} {p.email:<30} {status}")
        
        print("-" * 80)
        print("\n🔑 PASSWORD LOGIN UNTUK SEMUA PARTICIPANT: participant123")
        print("\n📝 CARA LOGIN:")
        print("   1. Buka http://localhost:5173/login")
        print("   2. Pilih 'Login sebagai Participant'")
        print("   3. Masukkan username dan password di atas")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_participants()