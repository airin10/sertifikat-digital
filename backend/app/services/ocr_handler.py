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

# import re
# import hashlib
# import uuid
# from typing import Dict, Optional, Tuple, List, Any
# import numpy as np
# from PIL import Image, ImageEnhance, ImageFilter
# import io
# import warnings
# import logging


# # Setup logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# # Suppress warnings
# warnings.filterwarnings('ignore')

# class OCRManager:
#     """Manajer OCR menggunakan EasyOCR"""
    
#     def __init__(self, languages: List[str] = ['en', 'id']):
#         self.languages = languages
#         self.reader = None
#         self._easyocr_available = False
        
#         self._init_reader()
        
#     def _init_reader(self):
#         """Inisialisasi EasyOCR dengan error handling"""
#         try:
#             import easyocr
            
#             logger.info("📚 Loading EasyOCR model...")
#             self.reader = easyocr.Reader(
#                 self.languages,
#                 gpu=False,
#                 verbose=False,
#                 model_storage_directory='./models',
#                 download_enabled=True
#             )
#             self._easyocr_available = True
#             logger.info("✅ EasyOCR ready!")
            
#         except ImportError:
#             logger.error("❌ EasyOCR not installed. Run: pip install easyocr")
#             self.reader = None
#         except Exception as e:
#             logger.error(f"❌ EasyOCR init error: {e}")
#             self.reader = None

#     @property
#     def is_available(self) -> bool:
#         """Cek apakah EasyOCR tersedia"""
#         return self._easyocr_available and self.reader is not None

#     def _pil_to_numpy(self, image: Image.Image) -> np.ndarray:
#         """Convert PIL Image ke numpy array untuk EasyOCR"""
#         if image.mode != 'RGB':
#             image = image.convert('RGB')
#         return np.array(image)

#     def preprocess_image(self, image: Image.Image) -> Image.Image:
#         """Preprocessing untuk meningkatkan akurasi OCR"""
#         if image.mode != 'RGB':
#             image = image.convert('RGB')
        
#         # Enhance contrast
#         enhancer = ImageEnhance.Contrast(image)
#         image = enhancer.enhance(2.0)
        
#         # Enhance sharpness
#         enhancer = ImageEnhance.Sharpness(image)
#         image = enhancer.enhance(2.0)
        
#         return image

#     def extract_full_text_with_dict(self, image_bytes: bytes) -> Tuple[str, Dict]:
#         """
#         Mode 1: Ekstrak SEMUA teks dan return sebagai (text, dict)
#         Returns: (raw_text, ocr_dict)
#         """
#         if not self.is_available:
#             logger.warning("EasyOCR not available, using mock")
#             return self._fallback_mock()
        
#         try:
#             # Load image
#             image = Image.open(io.BytesIO(image_bytes))
#             original_size = image.size
#             logger.info(f"Processing image: {original_size}")
            
#             image = self.preprocess_image(image)
            
#             # Convert ke numpy array
#             img_array = self._pil_to_numpy(image)
            
#             # OCR dengan EasyOCR
#             results = self.reader.readtext(img_array, detail=1)
            
#             if not results:
#                 logger.warning("No text detected in image")
#                 return "", {}
            
#             # Gabungkan semua teks dengan confidence > 0.3
#             texts = []
#             confidences = []
#             detections = []
            
#             for (bbox, text, conf) in results:
#                 if conf > 0.3 and text.strip():
#                     texts.append(text.strip())
#                     confidences.append(conf)
#                     detections.append({
#                         "text": text,
#                         "confidence": round(conf, 3),
#                         "bbox": bbox
#                     })
            
#             if not texts:
#                 logger.warning("All detections below confidence threshold")
#                 return "", {}
            
#             raw_text = " ".join(texts)
#             avg_confidence = sum(confidences) / len(confidences)
            
#             logger.info(f"✅ Extracted {len(texts)} text blocks, avg confidence: {avg_confidence:.2f}")
            
#             # Return dict dengan struktur yang bisa dipakai crypto_manager
#             ocr_dict = {
#                 "raw_text": raw_text,
#                 "detections": detections,
#                 "avg_confidence": avg_confidence,
#                 "total_blocks": len(texts)
#             }
            
#             return raw_text, ocr_dict
            
#         except Exception as e:
#             logger.error(f"EasyOCR Error: {e}")
#             return "", {}

#     # ✅ METHOD LAMA tetap ada untuk backward compatibility
#     # def extract_full_text(self, image_bytes: bytes) -> Tuple[str, str]:
#     #     """
#     #     Mode 1: Ekstrak SEMUA teks dan hash menggunakan SHA-256 (legacy)
#     #     Returns: (raw_text, sha256_hash)
        
#     #     ⚠️ DEPRECATED: Gunakan extract_full_text_with_dict untuk SHA-512
#     #     """
#     #     raw_text, ocr_dict = self.extract_full_text_with_dict(image_bytes)
        
#     #     if not raw_text:
#     #         return "", ""
        
#     #     # Legacy SHA-256 hash (untuk backward compatibility)
#     #     text_hash = hashlib.sha256(raw_text.encode('utf-8')).hexdigest()
        
#     #     return raw_text, text_hash

#     def extract_raw_text(self, image_bytes: bytes) -> str:
#         """Ekstrak teks mentah tanpa processing intensif"""
#         raw_text, _ = self.extract_full_text_with_dict(image_bytes)
#         return raw_text

#     def extract_text(self, image_bytes: bytes) -> str:
#         """Alias untuk extract_raw_text (backward compatibility)"""
#         return self.extract_raw_text(image_bytes)
    
# ocr_manager = OCRManager()

    # def extract_structured(self, image_bytes: bytes) -> Dict[str, Any]:
    #     """
    #     ⚠️ FITUR BANTU: Parse field dari OCR untuk mode Structured
    #     User tetap bisa edit manual di frontend!
    #     """
    #     if not self.is_available:
    #         return {
    #             "success": False, 
    #             "error": "EasyOCR not available",
    #             "certificate_data": {},
    #             "raw_text": "",
    #             "detections": []
    #         }
        
    #     try:
    #         image = Image.open(io.BytesIO(image_bytes))
    #         img_array = self._pil_to_numpy(image)
            
    #         results = self.reader.readtext(img_array, detail=1)
            
    #         # Format hasil
    #         structured_data = []
    #         for (bbox, text, conf) in results:
    #             structured_data.append({
    #                 "text": text,
    #                 "confidence": round(conf, 3),
    #                 "bbox": bbox
    #             })
            
    #         # Parse field (opsional, bisa di-disable)
    #         raw_text = " ".join([item["text"] for item in structured_data])
    #         parsed_data = self.parse_certificate_data(raw_text)
            
    #         return {
    #             "success": True,
    #             "certificate_data": parsed_data,
    #             "raw_text": raw_text,
    #             "detections": structured_data,
    #             "is_complete": all([
    #                 parsed_data.get("certificate_id"),
    #                 parsed_data.get("recipient_name")
    #             ]),
    #             "total_blocks": len(structured_data),
    #             "note": "Parsed data is suggestion only - user can edit manually"
    #         }
            
    #     except Exception as e:
    #         logger.error(f"Structured extraction error: {e}")
    #         return {
    #             "success": False,
    #             "error": str(e),
    #             "certificate_data": {},
    #             "raw_text": "",
    #             "detections": []
    #         }

    # def parse_certificate_data(self, raw_text: str) -> Dict[str, str]:
    #     """Parse field dari teks - HANYA UNTUK FITUR BANTU"""
    #     data = {}
    #     if not raw_text:
    #         return data
            
    #     clean_text = re.sub(r'\s+', ' ', raw_text)
        
    #     # ID Sertifikat
    #     id_patterns = [
    #         r"(?:No\.?|ID|Nomor)\s*Sertifikat\s*[:.]?\s*([A-Z0-9\-]+)",
    #         r"(?:Certificate)\s*(?:No|Number|ID)\s*[:.]?\s*([A-Z0-9\-]+)",
    #         r"(?:ID|No)\s*[:.]?\s*([A-Z0-9\-]{5,})"
    #     ]
    #     for pattern in id_patterns:
    #         match = re.search(pattern, clean_text, re.IGNORECASE)
    #         if match:
    #             data["certificate_id"] = match.group(1).strip()
    #             break
        
    #     # Nama
    #     name_patterns = [
    #         r"(?:Nama|Name|Diberikan\s+kepada|Presented\s+to)\s*[:.]?\s*([A-Z][a-zA-Z\s\.]+)(?=\n|$|Instansi|Institution|Universitas)",
    #         r"(?:Nama\s+Lengkap|Full\s+Name)\s*[:.]?\s*([^\n]+)"
    #     ]
    #     for pattern in name_patterns:
    #         match = re.search(pattern, clean_text, re.IGNORECASE)
    #         if match:
    #             name = re.sub(r'[^\w\s\.]', '', match.group(1).strip())
    #             if len(name) > 2:
    #                 data["recipient_name"] = name
    #                 break
        
    #     # Institusi
    #     inst_patterns = [
    #         r"(?:Instansi|Institution|Universitas|University|Sekolah|School|Kampus)\s*[:.]?\s*([^\n]+)",
    #         r"(?:Diterbitkan\s+oleh|Issued\s+by)\s*[:.]?\s*([^\n]+)"
    #     ]
    #     for pattern in inst_patterns:
    #         match = re.search(pattern, clean_text, re.IGNORECASE)
    #         if match:
    #             data["institution"] = match.group(1).strip()
    #             break
        
    #     return data

    # def _fallback_mock(self) -> Tuple[str, Dict]:
    #     """Mock data untuk testing - UNIQUE per session"""
    #     unique_id = str(uuid.uuid4())[:8]
    #     mock_text = f"[MOCK-{unique_id}] Sertifikat Penghargaan No: CERT-2024-{unique_id} Nama: Budi Santoso Institusi: Universitas Mikroskil"
        
    #     ocr_dict = {
    #         "raw_text": mock_text,
    #         "detections": [{"text": mock_text, "confidence": 0.95, "bbox": []}],
    #         "avg_confidence": 0.95,
    #         "total_blocks": 1,
    #         "is_mock": True
    #     }
        
    #     logger.warning(f"Using MOCK data with unique ID: {unique_id}")
    #     return mock_text, ocr_dict


# import re
# import hashlib
# import uuid
# from typing import Dict, Optional, Tuple, List, Any
# import numpy as np
# from PIL import Image, ImageEnhance, ImageFilter
# import io
# import warnings
# import logging

# # Setup logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# # Suppress warnings
# warnings.filterwarnings('ignore')

# class OCRManager:
#     """Manajer OCR menggunakan EasyOCR"""
    
#     def __init__(self, languages: List[str] = ['en', 'id']):
#         self.languages = languages
#         self.reader = None
#         self._easyocr_available = False
        
#         self._init_reader()
        
#     def _init_reader(self):
#         """Inisialisasi EasyOCR dengan error handling"""
#         try:
#             import easyocr
            
#             logger.info("📚 Loading EasyOCR model...")
#             self.reader = easyocr.Reader(
#                 self.languages,
#                 gpu=False,
#                 verbose=False,
#                 model_storage_directory='./models',
#                 download_enabled=True
#             )
#             self._easyocr_available = True
#             logger.info("✅ EasyOCR ready!")
            
#         except ImportError:
#             logger.error("❌ EasyOCR not installed. Run: pip install easyocr")
#             self.reader = None
#         except Exception as e:
#             logger.error(f"❌ EasyOCR init error: {e}")
#             self.reader = None

#     @property
#     def is_available(self) -> bool:
#         """Cek apakah EasyOCR tersedia"""
#         return self._easyocr_available and self.reader is not None

#     def _pil_to_numpy(self, image: Image.Image) -> np.ndarray:
#         """Convert PIL Image ke numpy array untuk EasyOCR"""
#         if image.mode != 'RGB':
#             image = image.convert('RGB')
#         return np.array(image)

#     def preprocess_image(self, image: Image.Image) -> Image.Image:
#         """Preprocessing untuk meningkatkan akurasi OCR"""
#         if image.mode != 'RGB':
#             image = image.convert('RGB')
        
#         # Enhance contrast
#         enhancer = ImageEnhance.Contrast(image)
#         image = enhancer.enhance(2.0)
        
#         # Enhance sharpness
#         enhancer = ImageEnhance.Sharpness(image)
#         image = enhancer.enhance(2.0)
        
#         return image

#     def extract_full_text(self, image_bytes: bytes) -> Tuple[str, str]:
#         """
#         Mode 1: Ekstrak SEMUA teks dan hash menggunakan EasyOCR
#         Returns: (raw_text, sha256_hash)
        
#         ⚠️ PENTING: Hash dari RAW TEXT (bukan cleaned), untuk konsistensi verify!
#         """
#         if not self.is_available:
#             logger.warning("EasyOCR not available, using mock")
#             return self._fallback_mock()
        
#         try:
#             # Load image
#             image = Image.open(io.BytesIO(image_bytes))
#             original_size = image.size
#             logger.info(f"Processing image: {original_size}")
            
#             image = self.preprocess_image(image)
            
#             # Convert ke numpy array
#             img_array = self._pil_to_numpy(image)
            
#             # OCR dengan EasyOCR
#             results = self.reader.readtext(img_array, detail=1)
            
#             if not results:
#                 logger.warning("No text detected in image")
#                 return "", ""
            
#             # Gabungkan semua teks dengan confidence > 0.3
#             texts = []
#             confidences = []
            
#             for (bbox, text, conf) in results:
#                 if conf > 0.3 and text.strip():
#                     texts.append(text.strip())
#                     confidences.append(conf)
            
#             if not texts:
#                 logger.warning("All detections below confidence threshold")
#                 return "", ""
            
#             # ✅ RAW TEXT (tidak di-normalize) untuk hashing
#             raw_text = " ".join(texts)
#             avg_confidence = sum(confidences) / len(confidences)
            
#             logger.info(f"✅ Extracted {len(texts)} text blocks, avg confidence: {avg_confidence:.2f}")
            
#             # ✅ Hash dari RAW TEXT, bukan cleaned!
#             text_hash = hashlib.sha256(raw_text.encode('utf-8')).hexdigest()
            
#             # Return raw_text untuk verify, cleaned_text untuk display (opsional)
#             return raw_text, text_hash
            
#         except Exception as e:
#             logger.error(f"EasyOCR Full-Text Error: {e}")
#             return "", ""

#     def _normalize_text(self, text: str) -> str:
#         """Normalisasi teks untuk display (bukan untuk hashing)"""
#         text = text.lower()
#         text = re.sub(r'\s+', ' ', text)
#         text = re.sub(r'[^\w\s\-\.]', '', text)
#         text = text.strip()
#         return text

#     def extract_raw_text(self, image_bytes: bytes) -> str:
#         """Ekstrak teks mentah tanpa processing intensif"""
#         if not self.is_available:
#             return ""
        
#         try:
#             image = Image.open(io.BytesIO(image_bytes))
#             image = self.preprocess_image(image)
#             img_array = self._pil_to_numpy(image)
            
#             results = self.reader.readtext(img_array, detail=0)
#             return " ".join(results) if results else ""
            
#         except Exception as e:
#             logger.error(f"EasyOCR Error: {e}")
#             return ""

#     def extract_text(self, image_bytes: bytes) -> str:
#         """Alias untuk extract_raw_text (backward compatibility)"""
#         return self.extract_raw_text(image_bytes)

#     def extract_structured(self, image_bytes: bytes) -> Dict[str, Any]:
#         """
#         ⚠️ FITUR BANTU: Parse field dari OCR untuk mode Structured
#         User tetap bisa edit manual di frontend!
#         """
#         if not self.is_available:
#             return {
#                 "success": False, 
#                 "error": "EasyOCR not available",
#                 "certificate_data": {},
#                 "raw_text": "",
#                 "detections": []
#             }
        
#         try:
#             image = Image.open(io.BytesIO(image_bytes))
#             img_array = self._pil_to_numpy(image)
            
#             results = self.reader.readtext(img_array, detail=1)
            
#             # Format hasil
#             structured_data = []
#             for (bbox, text, conf) in results:
#                 structured_data.append({
#                     "text": text,
#                     "confidence": round(conf, 3),
#                     "bbox": bbox
#                 })
            
#             # Parse field (opsional, bisa di-disable)
#             raw_text = " ".join([item["text"] for item in structured_data])
#             parsed_data = self.parse_certificate_data(raw_text)
            
#             return {
#                 "success": True,
#                 "certificate_data": parsed_data,  # ← User bisa edit ini!
#                 "raw_text": raw_text,
#                 "detections": structured_data,
#                 "is_complete": all([
#                     parsed_data.get("certificate_id"),
#                     parsed_data.get("recipient_name")
#                 ]),
#                 "total_blocks": len(structured_data),
#                 "note": "Parsed data is suggestion only - user can edit manually"
#             }
            
#         except Exception as e:
#             logger.error(f"Structured extraction error: {e}")
#             return {
#                 "success": False,
#                 "error": str(e),
#                 "certificate_data": {},
#                 "raw_text": "",
#                 "detections": []
#             }

#     def parse_certificate_data(self, raw_text: str) -> Dict[str, str]:
#         """Parse field dari teks - HANYA UNTUK FITUR BANTU"""
#         data = {}
#         if not raw_text:
#             return data
            
#         clean_text = re.sub(r'\s+', ' ', raw_text)
        
#         # ID Sertifikat
#         id_patterns = [
#             r"(?:No\.?|ID|Nomor)\s*Sertifikat\s*[:.]?\s*([A-Z0-9\-]+)",
#             r"(?:Certificate)\s*(?:No|Number|ID)\s*[:.]?\s*([A-Z0-9\-]+)",
#             r"(?:ID|No)\s*[:.]?\s*([A-Z0-9\-]{5,})"
#         ]
#         for pattern in id_patterns:
#             match = re.search(pattern, clean_text, re.IGNORECASE)
#             if match:
#                 data["certificate_id"] = match.group(1).strip()
#                 break
        
#         # Nama
#         name_patterns = [
#             r"(?:Nama|Name|Diberikan\s+kepada|Presented\s+to)\s*[:.]?\s*([A-Z][a-zA-Z\s\.]+)(?=\n|$|Instansi|Institution|Universitas)",
#             r"(?:Nama\s+Lengkap|Full\s+Name)\s*[:.]?\s*([^\n]+)"
#         ]
#         for pattern in name_patterns:
#             match = re.search(pattern, clean_text, re.IGNORECASE)
#             if match:
#                 name = re.sub(r'[^\w\s\.]', '', match.group(1).strip())
#                 if len(name) > 2:
#                     data["recipient_name"] = name
#                     break
        
#         # Institusi
#         inst_patterns = [
#             r"(?:Instansi|Institution|Universitas|University|Sekolah|School|Kampus)\s*[:.]?\s*([^\n]+)",
#             r"(?:Diterbitkan\s+oleh|Issued\s+by)\s*[:.]?\s*([^\n]+)"
#         ]
#         for pattern in inst_patterns:
#             match = re.search(pattern, clean_text, re.IGNORECASE)
#             if match:
#                 data["institution"] = match.group(1).strip()
#                 break
        
#         return data

#     def _fallback_mock(self) -> Tuple[str, str]:
#         """Mock data untuk testing - UNIQUE per session"""
#         # ✅ Generate unique text agar hash berbeda
#         unique_id = str(uuid.uuid4())[:8]
#         mock_text = f"[MOCK-{unique_id}] Sertifikat Penghargaan No: CERT-2024-{unique_id} Nama: Budi Santoso Institusi: Universitas Mikroskil"
#         mock_hash = hashlib.sha256(mock_text.encode('utf-8')).hexdigest()
#         logger.warning(f"Using MOCK data with unique ID: {unique_id}")
#         return mock_text, mock_hash

# # Global instance
# ocr_manager = OCRManager()