import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, FileCheck
} from 'lucide-react';

const ImageDragDrop = ({ onAreaSelected, onImageUploaded, enableSelection = false }) => {
  const [file, setFile] = useState(null);  
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [endPos, setEndPos] = useState({ x: 0, y: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [imageInfo, setImageInfo] = useState(null);
  
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageCacheRef = useRef(null); 

  const COLORS = {
    primary: '#6b21a8',
    primaryDark: '#a300c8',
    success: '#10b981',
    danger: '#dc2626',
    dark: '#1e293b',
    light: '#f8fafc',
    secondary: '#64748b',
    white: '#ffffff'
  };

  const handleFileUpload = (selectedFile) => {
    if (!selectedFile.type.match('image.*')) {
      alert('Format file tidak didukung. Gunakan PNG/JPG/JPEG.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      alert('Ukuran file terlalu besar. Maksimal 10MB.');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const info = {
          filename: selectedFile.name,
          format: selectedFile.type.split('/')[1].toUpperCase(),
          original_width: img.width,
          original_height: img.height,
          size: selectedFile.size
        };

        imageCacheRef.current = img;
        
        setImageInfo(info);
        setPreview(e.target.result);
        setFile(selectedFile);
        
        onImageUploaded?.(selectedFile, info);
      };
      
      img.onerror = () => {
        alert('Gagal memuat gambar. File mungkin corrupt.');
      };
      
      img.src = e.target.result;
    };
    
    reader.readAsDataURL(selectedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileUpload(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.match('image.*')) {
      handleFileUpload(droppedFile);
    } else {
      alert('Hanya file gambar yang diperbolehkan!');
    }
  };

  const handleMouseDown = (e) => {
    if (!preview || !enableSelection) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setStartPos({ x, y });
    setEndPos({ x, y });
    setIsSelecting(true);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isSelecting || !preview) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setEndPos({ x, y });
  }, [isSelecting, preview]);

  const handleMouseUp = () => {
    if (isSelecting && preview) {
      setIsSelecting(false);
      
      const x1 = Math.min(startPos.x, endPos.x);
      const y1 = Math.min(startPos.y, endPos.y);
      const x2 = Math.max(startPos.x, endPos.x);
      const y2 = Math.max(startPos.y, endPos.y);
      
      const width = x2 - x1;
      const height = y2 - y1;
      
      const MIN_SIZE = 50;
      const MAX_SIZE = 500;
      
      if (width < MIN_SIZE || height < MIN_SIZE) {
        alert(`Area QR terlalu kecil. Minimal ${MIN_SIZE}x${MIN_SIZE} piksel.`);
        return;
      }
      
      if (width > MAX_SIZE || height > MAX_SIZE) {
        alert(`Area QR terlalu besar. Maksimal ${MAX_SIZE}x${MAX_SIZE} piksel.`);
        return;
      }
      
      const scaleX = imageInfo?.original_width / canvasRef.current.width;
      const scaleY = imageInfo?.original_height / canvasRef.current.height;
      
      const originalX1 = Math.round(x1 * scaleX);
      const originalY1 = Math.round(y1 * scaleY);
      const originalX2 = Math.round(x2 * scaleX);
      const originalY2 = Math.round(y2 * scaleY);
      
      const areaData = {
        preview: {
          x1: Math.round(x1),
          y1: Math.round(y1),
          x2: Math.round(x2),
          y2: Math.round(y2),
          width: Math.round(width),
          height: Math.round(height)
        },
        original: {
          x1: originalX1,
          y1: originalY1,
          x2: originalX2,
          y2: originalY2,
          width: originalX2 - originalX1,
          height: originalY2 - originalY1
        }
      };
      
      onAreaSelected?.(areaData);
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
  };

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  }, [handleMouseMove]);

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleMouseUp();
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageCacheRef.current;
    
    if (!canvas || !img) return;
    
    const ctx = canvas.getContext('2d');
    
    if (canvas.width !== img.width || canvas.height !== img.height) {
      canvas.width = img.width;
      canvas.height = img.height;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, img.width, img.height);
    
    if (isSelecting && enableSelection) {
      const x = Math.min(startPos.x, endPos.x);
      const y = Math.min(startPos.y, endPos.y);
      const width = Math.abs(endPos.x - startPos.x);
      const height = Math.abs(endPos.y - startPos.y);
      
      const MIN_SIZE = 50;
      const MAX_SIZE = 500;
      const isValid = width >= MIN_SIZE && height >= MIN_SIZE && 
                      width <= MAX_SIZE && height <= MAX_SIZE;
      
      const color = isValid ? '#10b981' : '#ef4444';
      
      ctx.fillStyle = isValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
      ctx.fillRect(x, y, width, height);
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
      
      ctx.fillStyle = color;
      ctx.font = 'bold 14px Arial';
      const statusText = isValid ? '✓' : '✗';
      ctx.fillText(`${statusText} ${Math.round(width)} x ${Math.round(height)}`, x + 10, y - 10);
    }
  }, [preview, isSelecting, startPos, endPos, enableSelection]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    return () => {
      imageCacheRef.current = null;
    };
  }, []);

  const resetUpload = () => {
    setPreview(null);
    setFile(null);
    setImageInfo(null);
    imageCacheRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-dragdrop" role="region" aria-label="Image upload and QR area selection">
      {!preview ? (
        <div
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Upload image. Click or drag and drop an image file."
          style={{
            border: `2px dashed ${isDragging ? COLORS.primary : '#cbd5e1'}`,
            borderRadius: '12px',
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragging ? `${COLORS.primary}10` : COLORS.light,
            transition: 'all 0.3s ease',
            minHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.primary}25`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-label="Choose image file"
          />
          
          <div className="mb-4">
            <div 
              className="d-inline-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: '90px',
                height: '90px',
                background: isDragging 
                  ? `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`
                  : `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                boxShadow: `0 8px 24px ${COLORS.primary}40`,
                transition: 'all 0.3s ease',
                transform: isDragging ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              <span style={{ fontSize: '42px', lineHeight: 1 }}>
                {isDragging ? <FileCheck color={COLORS.white} size={42} /> : <Upload color={COLORS.white} size={42}/>}
              </span>
            </div>
          </div>
          
          <p className="fw-bold mb-2" style={{fontSize: '1.5rem', color: COLORS.dark}}>
            {isDragging ? 'Lepaskan file di sini' : 'Seret file ke sini'}
          </p>
          <p className="text-muted mb-4" style={{fontSize: '0.95rem'}}>
            {isDragging ? 'File siap diunggah' : 'atau klik untuk memilih file'}
          </p>
          
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <span 
              className="px-3 py-2 fw-semibold"
              style={{
                background: 'white',
                color: COLORS.dark,
                border: `1px solid #e2e8f0`,
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}
            >
              PNG
            </span>
            <span 
              className="px-3 py-2 fw-semibold"
              style={{
                background: 'white',
                color: COLORS.dark,
                border: `1px solid #e2e8f0`,
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}
            >
              JPG
            </span>
            <span 
              className="px-3 py-2 fw-semibold"
              style={{
                background: 'white',
                color: COLORS.dark,
                border: `1px solid #e2e8f0`,
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}
            >
              JPEG
            </span>
            <span 
              className="px-3 py-2 fw-semibold"
              style={{
                background: 'white',
                color: COLORS.secondary,
                border: `1px solid #e2e8f0`,
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}
            >
              Max 10MB
            </span>
          </div>
        </div>
      ) : (
        <div className="canvas-container">
          <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded-3">
            <div className="small">
              <strong className="d-block">{imageInfo?.filename}</strong>
              <span className="text-muted">
                {imageInfo?.original_width} x {imageInfo?.original_height} px | {imageInfo?.format}
              </span>
            </div>
            <button 
              onClick={resetUpload} 
              className="btn btn-sm px-3 py-2 fw-semibold"
              style={{
                background: 'white',
                color: COLORS.danger,
                border: `2px solid ${COLORS.danger}`,
                borderRadius: '10px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = COLORS.danger;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = COLORS.danger;
              }}
              aria-label="Reset upload and choose different image"
            >
              ↺ Ganti File
            </button>
          </div>
          
          <div className="text-center position-relative">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              role="img"
              aria-label={`Image preview. ${enableSelection ? 'Click and drag to select QR code area.' : ''}`}
              tabIndex={enableSelection ? 0 : -1}
              style={{
                border: '2px solid #dee2e6',
                borderRadius: '8px',
                maxWidth: '100%',
                height: 'auto',
                cursor: enableSelection ? 'crosshair' : 'default',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                touchAction: 'none'
              }}
            />
          </div>
          
          {enableSelection && (
            <div 
              className="alert mt-3 small mb-0" 
              role="status" 
              aria-live="polite"
              style={{
                background: `${COLORS.primary}10`,
                border: `1px solid ${COLORS.primary}30`,
                borderRadius: '10px',
                color: COLORS.dark
              }}
            >
              <strong>Petunjuk:</strong> Klik dan drag pada gambar untuk memilih area QR Code. 
              Area minimal 50x50 pixel, maksimal 500x500 pixel.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageDragDrop;