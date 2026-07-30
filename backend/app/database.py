# Menyimpan Alamat Database

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import DATABASE_URL

# membuat dan mengelola koneksi ke database
# Penghubung antara Python dan database
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,     #memastikan koneksi tidak basi sebelum digunakan
    pool_recycle=3600,      # Memaksa daabase memutus dan menyambung ulang koneksi setiap 1 jam untuk mencegah memory leak di MySQL
    echo=False              # Tidak mencetak semua query SQL ke terminal.  
)

# membuat sesi database baru setiap kali dibutuhkan.
# Mencegah database menyimpan data secara tidak sengaja sebelum memanggil db.commit().
# operasi database (CRUD)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Kelas induk untuk semua model tabel
Base = declarative_base()

# Memastikan sesi database selalu ditutup (db.close()) meskipun terjadi error di tengah proses
# Mencegah kebocoran memori (memory leak)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()