import React, { useState, useRef, useEffect } from 'react';

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

  const handleFileUpload = (selectedFile) => {
    if (!selectedFile.type.match('image.*')) {
      alert('❌ Hanya file gambar yang diperbolehkan!');
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
        
        setImageInfo(info);
        setPreview(e.target.result);
        setFile(selectedFile);
        
        onImageUploaded?.(selectedFile, info);
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
      alert('❌ Hanya file gambar yang diperbolehkan!');
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

  const handleMouseMove = (e) => {
    if (!isSelecting || !preview) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setEndPos({ x, y });
    drawCanvas();
  };

  const handleMouseUp = () => {
    if (isSelecting && preview) {
      setIsSelecting(false);
      
      const x1 = Math.min(startPos.x, endPos.x);
      const y1 = Math.min(startPos.y, endPos.y);
      const x2 = Math.max(startPos.x, endPos.x);
      const y2 = Math.max(startPos.y, endPos.y);
      
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
          width: Math.round(x2 - x1),
          height: Math.round(y2 - y1)
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

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !preview) return;
    
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = preview;
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0, img.width, img.height);
      
      if (isSelecting && enableSelection) {
        const x = Math.min(startPos.x, endPos.x);
        const y = Math.min(startPos.y, endPos.y);
        const width = Math.abs(endPos.x - startPos.x);
        const height = Math.abs(endPos.y - startPos.y);
        
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.strokeRect(x, y, width, height);
        
        ctx.fillStyle = 'rgba(255, 68, 68, 0.1)';
        ctx.fillRect(x, y, width, height);
        
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${Math.round(width)} x ${Math.round(height)}`, x + 10, y - 10);
      }
    };
  };

  useEffect(() => {
    drawCanvas();
  }, [preview, isSelecting, startPos, endPos]);

  const resetUpload = () => {
    setPreview(null);
    setFile(null);
    setImageInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-dragdrop">
      {!preview ? (
        <div
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '3px dashed #dee2e6',
            borderRadius: '12px',
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragging ? '#e3f2fd' : '#f8f9fa',
            transition: 'all 0.3s',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          <div style={{ fontSize: '48px', color: isDragging ? '#0d6efd' : '#6c757d', marginBottom: '16px' }}>
            {isDragging ? '📂' : '🖼️'}
          </div>
          
          <h5 style={{ marginBottom: '8px', color: isDragging ? '#0d6efd' : '#212529' }}>
            {isDragging ? 'Lepaskan file di sini' : 'Klik atau drag gambar'}
          </h5>
          
          <p className="small text-muted mb-3">
            Format: PNG, JPG, JPEG (Max 10MB)
          </p>
          
          <button type="button" className="button radius-30 button-sm">
            Pilih File
          </button>
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
            <button onClick={resetUpload} className="button radius-30 button-sm button-outline">
              ↺ Ganti
            </button>
          </div>
          
          <div className="text-center position-relative">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{
                border: '2px solid #dee2e6',
                borderRadius: '8px',
                maxWidth: '100%',
                height: 'auto',
                cursor: enableSelection ? (isSelecting ? 'crosshair' : 'crosshair') : 'default',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
          </div>
          
          {enableSelection && (
            <div className="alert alert-info mt-3 small mb-0">
              <i className="lni lni-information me-2"></i>
              <strong>Petunjuk:</strong> Klik dan drag pada gambar untuk memilih area QR Code
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageDragDrop;