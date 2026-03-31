from PIL import Image, ImageDraw
from io import BytesIO
import base64
import os
from typing import Dict, Union, Optional

class ImageProcessor:
    def __init__(self):
        self.upload_folder = "uploads/temp"
        os.makedirs(self.upload_folder, exist_ok=True)
    
    def validate_image(self, image_bytes: bytes) -> Dict:
        try:
            img = Image.open(BytesIO(image_bytes))
            return {
                "valid": True,
                "format": img.format,
                "mode": img.mode,
                "width": img.width,
                "height": img.height,
                "size": len(image_bytes)
            }
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    def get_image_preview(self, image_bytes: bytes, max_width: int = 800) -> Dict:
        """Generate preview image untuk canvas"""
        img = Image.open(BytesIO(image_bytes))
        
        # Simpan dimensi asli SEBELUM resize
        original_width = img.width
        original_height = img.height
        
        # Resize proporsional jika terlalu besar
        if img.width > max_width:
            ratio = max_width / img.width
            new_width = max_width
            new_height = int(img.height * ratio)
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Convert ke RGB untuk preview 
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            "image": img_base64,
            "width": img.width,
            "height": img.height,
            "original_width": original_width,    
            "original_height": original_height   
        }
    
    def _paste_qr_to_template(self, template: Image.Image, qr_image: Image.Image, 
                           position: Dict, qr_size: int) -> Image.Image:
        # Resize QR
        qr_resized = qr_image.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
        
        # VALIDASI BOUNDS
        x = position.get('x', 0)
        y = position.get('y', 0)
        
        template_width, template_height = template.size
        
        # Cek apakah QR keluar dari template
        if x < 0 or y < 0:
            raise ValueError(f"Position cannot be negative: x={x}, y={y}")
        
        if x + qr_size > template_width or y + qr_size > template_height:
            raise ValueError(
                f"QR size {qr_size} at position ({x},{y}) exceeds "
                f"template bounds ({template_width}x{template_height})"
            )
        
        # Handle transparansi dengan benar
        if qr_resized.mode == 'RGBA':
            # Gunakan alpha channel sebagai mask
            template.paste(qr_resized, (x, y), qr_resized)
        else:
            template.paste(qr_resized, (x, y))
        
        return template
    
    def add_qr_to_image(self, template_bytes: bytes, qr_bytes: bytes, 
                       position: Dict, qr_size: int) -> bytes:
        try:
            template = Image.open(BytesIO(template_bytes))
            qr_image = Image.open(BytesIO(qr_bytes))
            
            # Pastikan template RGB/RGBA
            if template.mode not in ('RGB', 'RGBA'):
                template = template.convert('RGB')
            
            # Paste dengan validasi
            result = self._paste_qr_to_template(template, qr_image, position, qr_size)
            
            # Convert ke bytes
            output = BytesIO()
            result.save(output, format="PNG")
            output.seek(0)
            
            return output.getvalue()
            
        except Exception as e:
            print(f"Error in add_qr_to_image: {e}")
            raise e
    
    def add_qr_and_get_base64(self, template_bytes: bytes, qr_bytes: bytes, 
                             position: Dict, qr_size: int) -> Optional[str]:
        try:
            image_bytes = self.add_qr_to_image(template_bytes, qr_bytes, position, qr_size)
            return base64.b64encode(image_bytes).decode()
            
        except Exception as e:
            print(f"Error in add_qr_and_get_base64: {e}")
            return None
    
    def image_to_base64(self, image_bytes: Union[bytes, BytesIO]) -> str:
        if isinstance(image_bytes, BytesIO):
            image_bytes = image_bytes.getvalue()
        elif not isinstance(image_bytes, bytes):
            raise TypeError(f"Expected bytes or BytesIO, got {type(image_bytes)}")
        
        return base64.b64encode(image_bytes).decode()

image_processor = ImageProcessor()