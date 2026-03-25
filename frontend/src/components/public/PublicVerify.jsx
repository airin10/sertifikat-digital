import React, { useState } from 'react';
import { Upload, Shield, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, FileCheck, Info, ArrowLeft } from 'lucide-react';

const PublicVerify = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Format file tidak didukung. Gunakan PNG atau JPG.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Ukuran file terlalu besar. Maksimal 10MB.');
      return;
    }
    setFile(selectedFile);
    setError('');
    setResult(null);
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Harap pilih file sertifikat!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/verify', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Verifikasi gagal terhubung ke server. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError('');
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  const getSignatureStatus = () => result?.integrity?.signature_valid || false;
  const isValid = result?.valid && result?.integrity?.hash_match && getSignatureStatus();

  return (
    <div className="min-vh-100 bg-light py-4 py-md-5">
      <div className="container py-3 py-md-4">
        
        {/* Back Button */}
        <div className="mb-4">
          <button 
            onClick={handleBack}
            className="btn btn-link text-decoration-none text-muted d-inline-flex align-items-center gap-2 p-0"
          >
            <ArrowLeft size={16} />
            <span className="small fw-medium">Kembali</span>
          </button>
        </div>

        {/* Header Section */}
        <div className="text-center mb-5">
          <span className="badge bg-primary px-4 py-2 mb-3">
            <Shield className="me-1" size={14} />
            Verification
          </span>
          <h1 className="display-5 fw-bold text-dark mb-3">Verifikasi Sertifikat Digital</h1>
          <p className="text-muted fs-6 mx-auto" style={{maxWidth: '650px'}}>
            Validasi keaslian sertifikat menggunakan tanda tangan digital <strong>EdDSA</strong> dan ekstraksi data <strong>OCR</strong>.
          </p>
        </div>

        {!result ? (
          /* Upload Section - WHITE BACKGROUND */
          <div className="card border-0 shadow-lg">
            <div className="card-body p-4 p-md-5">
              
              {/* Dropzone - White with colored border */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
                className={`border border-3 border-dashed rounded-4 p-5 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-primary bg-light' 
                    : file 
                      ? 'border-success bg-light' 
                      : 'border-secondary-subtle hover:border-primary'
                }`}
                style={{minHeight: '240px', backgroundColor: '#fff'}}
              >
                <input 
                  id="file-input" 
                  type="file" 
                  className="d-none" 
                  accept=".png,.jpg,.jpeg" 
                  onChange={handleFileSelect} 
                />
                
                <div className="mb-4">
                  <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                    file 
                      ? 'bg-success text-white' 
                      : 'bg-light text-primary border'
                  }`} style={{width: '80px', height: '80px'}}>
                    {file ? <FileCheck size={36} /> : <Upload size={36} />}
                  </div>
                </div>
                
                {file ? (
                  <div>
                    <p className="text-dark fw-bold mb-1 fs-6">{file.name}</p>
                    <p className="text-muted small mb-2">{(file.size / 1024).toFixed(1)} KB</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); resetForm(); }} 
                      className="btn btn-sm btn-outline-danger"
                    >
                      <XCircle size={14} className="me-1" /> Hapus File
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-dark fw-bold mb-2 fs-5">📁 Tarik file ke sini</p>
                    <p className="text-muted mb-4">Atau klik untuk memilih gambar sertifikat</p>
                    <div className="d-flex justify-content-center gap-2 flex-wrap">
                      <span className="badge bg-light text-dark border">PNG</span>
                      <span className="badge bg-light text-dark border">JPG</span>
                      <span className="badge bg-light text-muted border">Max 10MB</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 mt-4" role="alert">
                  <AlertCircle size={18} />
                  <span className="small">{error}</span>
                  <button className="btn-close ms-auto" onClick={() => setError('')} aria-label="Close" />
                </div>
              )}

              {/* Verify Button */}
              <button
                onClick={handleVerify}
                disabled={!file || loading}
                className={`btn w-100 mt-4 py-3 rounded-4 fw-bold d-flex align-items-center justify-content-center gap-2 ${
                  !file || loading ? 'btn-secondary disabled' : 'btn-primary shadow'
                }`}
              >
                {loading ? (
                  <><span className="spinner-border spinner-border-sm" role="status" /> Memproses...</>
                ) : (
                  <><Shield size={18} /> Verifikasi Sekarang</>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Result Section - WHITE BACKGROUND */
          <div className="row g-4">
            
            {/* Status Card - WHITE with colored border */}
            <div className="col-lg-5">
              <div className={`card h-100 text-center border-0 shadow-lg ${
                isValid ? 'border-success border-3' : 'border-danger border-3'
              }`} style={{backgroundColor: '#fff'}}>
                <div className="card-body d-flex flex-column align-items-center justify-content-center p-4 p-md-5">
                  
                  {/* Status Icon */}
                  <div className={`rounded-circle d-flex align-items-center justify-content-center mb-4 ${
                    isValid ? 'bg-success text-white' : 'bg-danger text-white'
                  }`} style={{width: '80px', height: '80px'}}>
                    {isValid ? <CheckCircle size={40} /> : <XCircle size={40} />}
                  </div>
                  
                  {/* ✅ FIX: Always use text-dark on white background */}
                  <h2 className="h4 fw-bold mb-2 text-dark">
                    {isValid ? '✅ Sertifikat VALID' : '❌ Sertifikat TIDAK VALID'}
                  </h2>
                  <p className="text-muted small mb-4 px-3">{result.message}</p>

                  {/* Verification Checks - White bg with colored border */}
                  <div className="w-100">
                    {[
                      { label: 'Integritas Data', val: result.integrity?.hash_match },
                      { label: 'Tanda Tangan', val: getSignatureStatus() },
                      { label: 'Status Sistem', val: result?.valid }
                    ].map((item, idx) => (
                      <div key={idx} className={`d-flex align-items-center justify-content-between p-3 rounded-3 mb-2 border ${
                        item.val ? 'border-success' : 'border-danger'
                      }`} style={{backgroundColor: '#fff'}}>
                        <div className="text-start">
                          <span className="text-dark small fw-bold d-block">{item.label}</span>
                          <span className="text-muted" style={{fontSize: '0.7rem'}}>
                            {item.val ? 'Terverifikasi' : 'Tidak valid'}
                          </span>
                        </div>
                        {item.val ? (
                          <span className="badge bg-success text-white px-3 py-2">
                            <CheckCircle size={14} className="me-1" /> Valid
                          </span>
                        ) : (
                          <span className="badge bg-danger text-white px-3 py-2">
                            <XCircle size={14} className="me-1" /> Invalid
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Card - White background */}
            <div className="col-lg-7">
              <div className="card border-0 shadow-lg h-100" style={{backgroundColor: '#fff'}}>
                <div className="card-body p-4 p-md-5">
                  
                  {/* Card Header */}
                  <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
                    <div className="bg-primary bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center text-primary" 
                         style={{width: '48px', height: '48px'}}>
                      <FileCheck size={24} />
                    </div>
                    <div>
                      <h3 className="h5 fw-bold text-dark mb-0">Detail Sertifikat</h3>
                      <small className="text-muted">Informasi sertifikat yang terverifikasi</small>
                    </div>
                  </div>

                  {/* Certificate Details Grid */}
                  <div className="row g-4">
                    {[
                      { label: 'ID Sertifikat', value: result.certificate?.id, mono: true, icon: '🔖' },
                      { label: 'Penerima', value: result.certificate?.participant, icon: '👤' },
                      { label: 'Judul', value: result.certificate?.title, icon: '📜' },
                      { label: 'Tanggal Terbit', value: result.certificate?.issued_date ? new Date(result.certificate.issued_date).toLocaleDateString('id-ID') : '-', icon: '📅' }
                    ].map((data, i) => (
                      <div key={i} className="col-12 col-sm-6">
                        <div className="p-3 bg-light rounded-3 border h-100">
                          <p className="text-muted small fw-bold text-uppercase mb-2 d-flex align-items-center gap-2">
                            <span>{data.icon}</span> {data.label}
                          </p>
                          <p className={`fw-semibold text-dark mb-0 ${data.mono ? 'font-monospace bg-white px-3 py-2 rounded-2 border d-inline-block w-100' : ''}`} 
                             style={{fontSize: data.mono ? '0.85rem' : '1rem'}}>
                            {data.value || <span className="text-muted fst-italic">-</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reset Button */}
                  <button 
                    onClick={resetForm} 
                    className="btn btn-dark w-100 mt-5 py-3 rounded-4 fw-bold d-flex align-items-center justify-content-center gap-2 shadow"
                  >
                    <RefreshCw size={18} /> Verifikasi Sertifikat Lain
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Hint */}
        <div className="text-center mt-5 pt-4 border-top">
          <p className="text-muted small mb-0 d-flex align-items-center justify-content-center gap-2">
            <Info size={14} className="text-primary" />
            <span>Pastikan file sertifikat adalah file asli yang belum dimodifikasi.</span>
          </p>
          <p className="text-muted small mt-2 mb-0">
            © {new Date().getFullYear()} CertiChain — Sistem Sertifikat Digital Terverifikasi
          </p>
        </div>

      </div>
    </div>
  );
};

export default PublicVerify;