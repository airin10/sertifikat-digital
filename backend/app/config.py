import os
from pathlib import Path

BASE_DIR = Path(__file__).parent

MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',          
    'database': 'certificate_system',
    'port': 3307,           
    'charset': 'utf8mb4'
}

DATABASE_URL = (
    f"mysql+pymysql://{MYSQL_CONFIG['user']}:{MYSQL_CONFIG['password']}"
    f"@{MYSQL_CONFIG['host']}:{MYSQL_CONFIG['port']}/{MYSQL_CONFIG['database']}"
    f"?charset={MYSQL_CONFIG['charset']}"
)

MYSQL_HOST = MYSQL_CONFIG['host']
MYSQL_PORT = str(MYSQL_CONFIG['port'])
MYSQL_USER = MYSQL_CONFIG['user']
MYSQL_PASSWORD = MYSQL_CONFIG['password']
MYSQL_DATABASE = MYSQL_CONFIG['database']

# ==============================================================================
# SECURITY CONFIGURATION
# ==============================================================================

SECRET_KEY = os.getenv("SECRET_KEY", "ganti-ini-dengan-key-yang-amat-sangat-rahasia-dan-panjang")
ALGORITHM = "HS512"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 hari

# ==============================================================================
# UPLOAD CONFIGURATION
# ==============================================================================

UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

# Sub-folders
CERTIFICATES_DIR = os.path.join(UPLOAD_DIR, "certificates")
QRCODES_DIR = os.path.join(UPLOAD_DIR, "qrcodes")
ORIGINALS_DIR = os.path.join(UPLOAD_DIR, "originals")
TEMPLATES_DIR = os.path.join(UPLOAD_DIR, "templates")

# Create folders if not exist
for folder in [UPLOAD_DIR, CERTIFICATES_DIR, QRCODES_DIR, ORIGINALS_DIR, TEMPLATES_DIR]:
    os.makedirs(folder, exist_ok=True)

# ==============================================================================
# EdDSA CONFIGURATION
# ==============================================================================

KEYS_DIR = os.path.join(BASE_DIR, "keys")
os.makedirs(KEYS_DIR, exist_ok=True)

PRIVATE_KEY_PATH = os.path.join(KEYS_DIR, "private_key.raw")
PUBLIC_KEY_PATH = os.path.join(KEYS_DIR, "public_key.raw")
