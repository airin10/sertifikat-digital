import qrcode
import json
from io import BytesIO
from PIL import Image
import base64
from typing import Optional
import cv2
import numpy as np

class QRCodeManager:
    """Manager untuk generate dan decode QR Code"""
    
    def __init__(self, size: int = 10, border: int = 4):
        self.size = size
        self.border = border
    
    def generate_qr_code(self, data: str) -> BytesIO:
        """Generate QR Code image dari string data"""
        qr = qrcode.QRCode(
            version=None,  # Auto-fit
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=self.size,
            border=self.border,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img_bytes = BytesIO()
        img.save(img_bytes, format="PNG")
        img_bytes.seek(0)
        
        return img_bytes
    
    # def generate_qr_base64(self, data: str) -> str:
    #     """Generate QR Code dan return sebagai base64 string"""
    #     img_bytes = self.generate_qr_code(data)
    #     return base64.b64encode(img_bytes.getvalue()).decode()
    
    def decode_qr_from_image(self, image_bytes: bytes) -> Optional[str]:
        """
        Decode QR Code dari image bytes dengan preprocessing.
        Fallback ke OpenCV jika pyzbar gagal.
        """
        try:
            # Try pyzbar dulu (lebih cepat)
            try:
                from pyzbar.pyzbar import decode
                result = self._decode_with_pyzbar(image_bytes)
                if result:
                    return result
            except ImportError:
                print("⚠️ pyzbar not available, trying OpenCV...")
            
            # Fallback ke OpenCV
            return self._decode_with_opencv(image_bytes)
            
        except Exception as e:
            print(f"❌ QR decode error: {e}")
            return None
    
    def _decode_with_pyzbar(self, image_bytes: bytes) -> Optional[str]:
        """Decode menggunakan pyzbar"""
        from pyzbar.pyzbar import decode
        from PIL import Image
        import io
        
        print(f"📸 Decoding with pyzbar, size: {len(image_bytes)} bytes")
        
        image = Image.open(io.BytesIO(image_bytes))
        decoded_objects = decode(image)
        
        if decoded_objects:
            qr_text = decoded_objects[0].data.decode('utf-8')
            print(f"✅ QR decoded (pyzbar): {qr_text[:100]}...")
            return qr_text
        
        return None
    
    def _decode_with_opencv(self, image_bytes: bytes) -> Optional[str]:
        """Decode menggunakan OpenCV QRCodeDetector dengan preprocessing"""
        print("📸 Decoding with OpenCV...")
        
        # Convert bytes ke numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            print("❌ Failed to decode image")
            return None
        
        # Preprocessing untuk improve detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Try multiple thresholds
        for thresh_val in [127, 100, 150, 80, 180]:
            _, thresh = cv2.threshold(gray, thresh_val, 255, cv2.THRESH_BINARY)
            
            detector = cv2.QRCodeDetector()
            data, bbox, _ = detector.detectAndDecode(thresh)
            
            if data:
                print(f"✅ QR decoded (OpenCV, thresh={thresh_val}): {data[:100]}...")
                return data
        
        print("❌ No QR found with OpenCV")
        return None

# Global instance
qr_manager = QRCodeManager(size=10, border=3)