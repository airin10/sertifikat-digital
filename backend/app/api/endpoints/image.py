from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.app.services.image_handler import image_processor
import base64

router = APIRouter(prefix="/api/image", tags=["image"])

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...)
):
    """Upload gambar sertifikat dan return preview"""
    try:
        # Validasi tipe file
        if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            raise HTTPException(400, "Hanya file PNG/JPG yang diperbolehkan")
        
        # Baca file
        content = await file.read()
        
        # Validasi gambar
        validation = image_processor.validate_image(content)
        if not validation["valid"]:
            raise HTTPException(400, f"File tidak valid: {validation.get('error')}")
        
        # Generate preview
        preview = image_processor.get_image_preview(content)
        
        return {
            "success": True,
            "filename": file.filename,
            "preview": preview["image"],
            "preview_width": preview["width"],
            "preview_height": preview["height"],
            "original_width": preview["original_width"],
            "original_height": preview["original_height"],
            "file_size": validation["size"],
            "format": validation["format"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Upload gagal: {str(e)}")