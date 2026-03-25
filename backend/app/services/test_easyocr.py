# test_easyocr.py
from backend.app.services.ocr_handler import ocr_manager

print(f"EasyOCR Available: {ocr_manager.is_available}")

# Test dengan gambar
with open("sertifikat.jpg", "rb") as f:
    img_bytes = f.read()

# Test full text
text, hash_val = ocr_manager.extract_full_text(img_bytes)
print(f"\nExtracted text: {text[:100]}...")
print(f"Hash: {hash_val[:16]}...")

# Test structured
result = ocr_manager.extract_structured(img_bytes)
print(f"\nDetected fields: {result['certificate_data']}")
print(f"Complete: {result['is_complete']}")