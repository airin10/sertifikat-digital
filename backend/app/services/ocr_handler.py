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
        """Preprocessing yang DETERMINISTIK untuk konsistensi OCR"""
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # STEP 1: Resize ke ukuran standar (max 2000px width)
        max_width = 2000
        if image.width > max_width:
            ratio = max_width / image.width
            new_size = (max_width, int(image.height * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
            logger.info(f"Resized to {new_size}")
        
        # STEP 2: Convert ke grayscale untuk konsistensi
        image = image.convert('L')
        
        # STEP 3: Enhance contrast (fixed value)
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.5)  # Turunkan dari 2.0 ke 1.5
        
        # STEP 4: Enhance sharpness (fixed value)
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.5)  # Turunkan dari 2.0 ke 1.5
        
        # STEP 5: Convert back to RGB untuk EasyOCR
        image = image.convert('RGB')
        
        return image

    def _sort_boxes_by_position(self, results: List) -> List:
        """
     Sort hasil OCR berdasarkan posisi: top-to-bottom, left-to-right
        Ini KRITIS untuk konsistensi hash!
        """
        def get_sort_key(item):
            bbox, text, conf = item
            # bbox = [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
            # Ambil y-rata-rata dan x-rata-rata
            y_avg = sum(point[1] for point in bbox) / 4
            x_avg = sum(point[0] for point in bbox) / 4
            return (y_avg, x_avg)
        
        return sorted(results, key=get_sort_key)

    def _normalize_text(self, text: str) -> str:
        """
     Normalisasi teks untuk konsistensi hash
        """
        # Lowercase
        text = text.lower()
        
        # Hapus karakter non-alphanumeric kecuali spasi
        text = re.sub(r'[^a-z0-9\s]', '', text)
        
        # Normalize whitespace (hapus spasi ganda, newline, tab)
        text = re.sub(r'\s+', ' ', text)
        
        # Trim
        text = text.strip()
        
        return text

    def extract_text_and_hash(self, image_bytes: bytes) -> Tuple[str, str]:
        if not self.is_available:
            logger.warning("EasyOCR not available, using mock")
            return self._fallback_mock()
        
        try:
            image = Image.open(io.BytesIO(image_bytes))
            logger.info(f"Processing image: {image.size}")
            
            # Preprocessing deterministik
            image = self.preprocess_image(image)
            img_array = self._pil_to_numpy(image)
            
            # OCR dengan parameter yang FIXED
            results = self.reader.readtext(
                img_array, 
                detail=1,
                text_threshold=0.7,      # Naikkan dari default
                low_text=0.4,            # Naikkan dari default
                link_threshold=0.5,      # Naikkan dari default
                canvas_size=1280,        # Fixed canvas size
                mag_ratio=2.0,           # Fixed magnification
            )
            
            if not results:
                logger.warning("No text detected")
                return "", ""
            
            # STEP 1: Filter dengan confidence threshold LEBIH TINGGI
            filtered_results = []
            for (bbox, text, conf) in results:
                if conf > 0.5 and text.strip():  # Naikkan dari 0.3 ke 0.5
                    filtered_results.append((bbox, text, conf))
            
            if not filtered_results:
                logger.warning("No text after filtering")
                return "", ""
            
            # STEP 2: Sort berdasarkan posisi (top-to-bottom, left-to-right)
            sorted_results = self._sort_boxes_by_position(filtered_results)
            
            # STEP 3: Gabungkan teks dengan normalisasi
            texts = []
            for (bbox, text, conf) in sorted_results:
                normalized = self._normalize_text(text)
                if normalized:
                    texts.append(normalized)
            
            if not texts:
                return "", ""
            
            # STEP 4: Gabungkan dengan spasi tunggal
            raw_text = " ".join(texts)
            
            # STEP 5: Final normalization
            raw_text = self._normalize_text(raw_text)
            
            logger.info(f"Extracted {len(texts)} blocks, {len(raw_text)} chars")
            logger.info(f"Text preview: {raw_text[:100]}...")
            
            # STEP 6: Hash dengan SHA-512
            text_hash = hashlib.sha512(raw_text.encode('utf-8')).hexdigest()
            
            return raw_text, text_hash
            
        except Exception as e:
            logger.error(f"EasyOCR Error: {e}")
            import traceback
            traceback.print_exc()
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

# import re
# import hashlib
# import uuid
# from typing import Dict, Optional, Tuple, List, Any
# import numpy as np
# from PIL import Image, ImageEnhance, ImageFilter
# import io
# import warnings
# import logging

# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)
# warnings.filterwarnings('ignore')

# class OCRManager:
#     def __init__(self, languages: List[str] = ['en', 'id']):
#         self.languages = languages
#         self.reader = None
#         self._easyocr_available = False
#         self._init_reader()
        
#     def _init_reader(self):
#         try:
#             import easyocr
#             logger.info("Loading EasyOCR model...")
#             self.reader = easyocr.Reader(
#                 self.languages,
#                 gpu=False,
#                 verbose=False,
#                 model_storage_directory='./models',
#                 download_enabled=True
#             )
#             self._easyocr_available = True
#             logger.info("EasyOCR ready!")
#         except ImportError:
#             logger.error("EasyOCR not installed. Run: pip install easyocr")
#             self.reader = None
#         except Exception as e:
#             logger.error(f"EasyOCR init error: {e}")
#             self.reader = None

#     @property
#     def is_available(self) -> bool:
#         return self._easyocr_available and self.reader is not None

#     def _pil_to_numpy(self, image: Image.Image) -> np.ndarray:
#         if image.mode != 'RGB':
#             image = image.convert('RGB')
#         return np.array(image)

#     def preprocess_image(self, image: Image.Image) -> Image.Image:
#         if image.mode != 'RGB':
#             image = image.convert('RGB')
        
#         enhancer = ImageEnhance.Contrast(image)
#         image = enhancer.enhance(2.0)
        
#         enhancer = ImageEnhance.Sharpness(image)
#         image = enhancer.enhance(2.0)
        
#         return image

#     def extract_text_and_hash(self, image_bytes: bytes) -> Tuple[str, str]:
#         if not self.is_available:
#             logger.warning("EasyOCR not available, using mock")
#             return self._fallback_mock()
        
#         try:
#             image = Image.open(io.BytesIO(image_bytes))
#             logger.info(f"Processing image: {image.size}")
            
#             image = self.preprocess_image(image)
#             img_array = self._pil_to_numpy(image)
            
#             results = self.reader.readtext(img_array, detail=1)
            
#             if not results:
#                 logger.warning("No text detected")
#                 return "", ""
            
#             # Filter dan gabungkan teks
#             texts = []
#             for (bbox, text, conf) in results:
#                 if conf > 0.3 and text.strip():
#                     texts.append(text.strip())
            
#             if not texts:
#                 return "", ""
            
#             raw_text = " ".join(texts)
#             logger.info(f"Extracted {len(texts)} blocks, {len(raw_text)} chars")
            
#             text_hash = hashlib.sha512(raw_text.encode('utf-8')).hexdigest()
            
#             return raw_text, text_hash
            
#         except Exception as e:
#             logger.error(f"EasyOCR Error: {e}")
#             return "", ""

#     def extract_text(self, image_bytes: bytes) -> str:
#         """Hanya return text tanpa hash"""
#         text, _ = self.extract_text_and_hash(image_bytes)
#         return text

#     def _fallback_mock(self) -> Tuple[str, str]:
#         """Mock dengan unique ID"""
#         unique_id = str(uuid.uuid4())[:8]
#         mock_text = f"[MOCK-{unique_id}] Sertifikat No: CERT-2024-{unique_id} Nama: Budi Santoso Institusi: Universitas Mikroskil"
#         mock_hash = hashlib.sha512(mock_text.encode('utf-8')).hexdigest()
#         logger.warning(f"Using MOCK with ID: {unique_id}")
#         return mock_text, mock_hash

# ocr_manager = OCRManager()
