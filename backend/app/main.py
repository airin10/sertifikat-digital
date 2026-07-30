from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

from app.config import UPLOAD_DIR
from app.database import engine, Base
from app.routers import auth, admin, participant, verify

# memberitahu SQLAlchemy untuk secara otomatis membuat semua tabel di database MySQL berdasarkan model yang sudah Anda definisikan di models.py
Base.metadata.create_all(bind=engine)

# ==========================================
# APP CONFIGURATION
# ==========================================

app = FastAPI(
    title="Digital Certificate System",
    description="Sistem Sertifikat Digital dengan EdDSA (Ed25519) + SHA-512 - Skripsi",
    version="1.0.0"
)

# ==========================================
# CORS (Cross-Origin Resource Sharing)
# ==========================================

# Middleware ini memberi "izin" khusus agar Frontend React(yang berjalan di port 3000) 
# diizinkan berkomunikasi dengan Backend FastAPI (port 8000).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# STATIC FILES
# ==========================================

app.mount("/static", StaticFiles(directory=str(UPLOAD_DIR)), name="static")

# ==========================================
# ROUTERS
# ==========================================

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(participant.router)
app.include_router(verify.router)

# ==========================================
# ROOT ENDPOINT
# ==========================================

@app.get("/")
def root():
    return {
        "message": "Digital Certificate System API",
        "version": "1.0.0",
        "features": [
            "EdDSA (Ed25519) Digital Signature",
            "SHA-512 Hashing",
            "OCR Text Extraction",
            "QR Code Generation",
            "Role-based Access Control (Admin, Participant, Verifier)"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# ==========================================
# MAIN
# ==========================================

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)