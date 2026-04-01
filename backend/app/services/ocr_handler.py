import re
import hashlib
import uuid
from typing import Dict, Optional, Tuple, List, Any
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import io
import warnings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
warnings.filterwarnings('ignore')

class OCRManager:
    def __init__(self, languages: List[str] = ['en', 'id']):
        self.languages = languages
        self.reader = None
        self._easyocr_available = False
        self._init_reader()
        
    def _init_reader(self):
        try:
            import easyocr
            logger.info("Loading EasyOCR model...")
            self.reader = easyocr.Reader(
                self.languages,
                gpu=False,
                verbose=False,
                model_storage_directory='./models',
                download_enabled=True
            )
            self._easyocr_available = True
            logger.info("EasyOCR ready!")
        except ImportError:
            logger.error("EasyOCR not installed. Run: pip install easyocr")
            self.reader = None
        except Exception as e:
            logger.error(f"EasyOCR init error: {e}")
            self.reader = None

    @property
    def is_available(self) -> bool:
        return self._easyocr_available and self.reader is not None

    def _pil_to_numpy(self, image: Image.Image) -> np.ndarray:
        if image.mode != 'RGB':
            image = image.convert('RGB')
        return np.array(image)

    def preprocess_image(self, image: Image.Image) -> Image.Image:
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2.0)
        
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(2.0)
        
        return image

    def extract_text_and_hash(self, image_bytes: bytes) -> Tuple[str, str]:
        if not self.is_available:
            logger.warning("EasyOCR not available, using mock")
            return self._fallback_mock()
        
        try:
            image = Image.open(io.BytesIO(image_bytes))
            logger.info(f"Processing image: {image.size}")
            
            image = self.preprocess_image(image)
            img_array = self._pil_to_numpy(image)
            
            results = self.reader.readtext(img_array, detail=1)
            
            if not results:
                logger.warning("No text detected")
                return "", ""
            
            # Filter dan gabungkan teks
            texts = []
            for (bbox, text, conf) in results:
                if conf > 0.3 and text.strip():
                    texts.append(text.strip())
            
            if not texts:
                return "", ""
            
            raw_text = " ".join(texts)
            logger.info(f"Extracted {len(texts)} blocks, {len(raw_text)} chars")
            
            text_hash = hashlib.sha512(raw_text.encode('utf-8')).hexdigest()
            
            return raw_text, text_hash
            
        except Exception as e:
            logger.error(f"EasyOCR Error: {e}")
            return "", ""

    def extract_text(self, image_bytes: bytes) -> str:
        """Hanya return text tanpa hash"""
        text, _ = self.extract_text_and_hash(image_bytes)
        return text

    def _fallback_mock(self) -> Tuple[str, str]:
        """Mock dengan unique ID"""
        unique_id = str(uuid.uuid4())[:8]
        mock_text = f"[MOCK-{unique_id}] Sertifikat No: CERT-2024-{unique_id} Nama: Budi Santoso Institusi: Universitas Mikroskil"
        mock_hash = hashlib.sha512(mock_text.encode('utf-8')).hexdigest()
        logger.warning(f"Using MOCK with ID: {unique_id}")
        return mock_text, mock_hash

ocr_manager = OCRManager()
