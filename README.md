Sistem ini merupakan aplikasi untuk mengelola dan memverifikasi sertifikat digital

Tech Stack
Backend: Python (FastAPI), 
Frontend: React.js, 
Database: MySQL (phpMyAdmin)

Persiapan Awal
Clone Repository
git clone https://github.com/username/certificate_system.git
cd certificate_system

Setup Backend
1. Buat Virtual Environment
python -m venv venv
2. Aktifkan Virtual Environment
venv\Scripts\activate
3. Install Dependencies
pip install -r requirements.txt

Setup Database (MySQL via phpMyAdmin)
- Gunakan MySQL di port: 3307/3306
- Buat database baru dengan nama: certificate_system

Pastikan konfigurasi database di project sesuai:
host: localhost
port: 3307 (sesuai MySQL di komputer) -> disini saya memakai 3307, jika mau mengubah di config.py
user: (sesuai MySQL di komputer)
password: (sesuai MySQL di komputer)
database: certificate_system

Reset & Inisialisasi Database
Jalankan perintah berikut untuk setup ulang database:
python -m app.reset_mysql
Masukkan data yang diperlukan

Menjalankan Backend
python -m uvicorn app.main:app --reload
Backend akan berjalan di http://127.0.0.1:8000

Menjalankan Frontend
Masuk ke folder frontend (jika terpisah):
cd frontend
npm install
npm start

Frontend akan berjalan di http://localhost:3000

Menjalankan Backend & Frontend Bersamaan
Buka 2 terminal:
Terminal 1 (Backend):
venv\Scripts\activate
python -m uvicorn app.main:app --reload

Terminal 2 (Frontend):
cd frontend
npm start

Catatan Penting
Pastikan MySQL berjalan di port 3307/3306
Gunakan phpMyAdmin untuk mengelola database
Pastikan virtual environment aktif sebelum menjalankan backend
Jika terjadi error dependency, ulangi install:
pip install -r requirements.txt
Selesai
