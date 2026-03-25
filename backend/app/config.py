# config.py
import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent

# Database config (Flask-style)
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',           # Ganti sesuai password MySQL kamu
    'database': 'certificate_system',
    'port': 3307,
    'charset': 'utf8mb4'
}

# Construct DATABASE_URL untuk SQLAlchemy
DATABASE_URL = f"mysql+pymysql://{MYSQL_CONFIG['user']}:{MYSQL_CONFIG['password']}@{MYSQL_CONFIG['host']}:{MYSQL_CONFIG['port']}/{MYSQL_CONFIG['database']}?charset={MYSQL_CONFIG['charset']}"

# Other configs
SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
UPLOAD_DIR = BASE_DIR / "uploads"
PRIVATE_KEY_PATH = BASE_DIR / "keys" / "private_key.pem"
PUBLIC_KEY_PATH = BASE_DIR / "keys" / "public_key.pem"

# Ensure directories exist
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "templates").mkdir(exist_ok=True)
(UPLOAD_DIR / "certificates").mkdir(exist_ok=True)
(UPLOAD_DIR / "qrcodes").mkdir(exist_ok=True)