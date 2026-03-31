import React, { useState } from 'react';
import { 
  Upload, Shield, CheckCircle, XCircle, AlertCircle, Loader2, 
  RefreshCw, FileCheck, Info, ArrowLeft, Database, 
  FileX, ShieldCheck, ShieldAlert, Award, User, Building2, 
  Calendar, Hash, Fingerprint, Ban
} from 'lucide-react';

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

  // ✅ Helper: Warna icon Bootstrap native (hex values)
  const ICON = {
    primary: '#0d6efd',
    success: '#198754',
    warning: '#ffc107',
    danger: '#dc3545',
    secondary: '#6c757d',
    white: '#ffffff'
  };

  // ✅ Helper: Tentukan status dengan warna Bootstrap sederhana
  const getStatusConfig = () => {
    if (!result) return null;
    
    const { valid, registered, revoked } = result;
    
    // 🚨 REVOKED - Merah Bootstrap
    if (revoked) {
      return {
        icon: Ban,
        iconColor: ICON.white,
        bgClass: 'bg-danger',
        textClass: 'text-white',
        borderClass: 'border-danger',
        badgeClass: 'bg-white text-danger', // ✅ FIX: Badge putih dengan teks merah
        title: 'SERTIFIKAT DICABUT',
        subtitle: 'Tidak berlaku lagi',
        description: result.message || 'Sertifikat ini telah dicabut oleh penerbit',
        isRevoked: true
      };
    }
    
    // ✅ VALID + REGISTERED - Hijau Bootstrap
    if (valid && registered) {
      return {
        icon: ShieldCheck,
        iconColor: ICON.white,
        bgClass: 'bg-success',
        textClass: 'text-white',
        borderClass: 'border-success',
        badgeClass: 'bg-success text-white',
        title: 'Sertifikat VALID',
        subtitle: 'Terverifikasi dalam sistem',
        description: result.message,
        isRevoked: false
      };
    }
    
    // ⚠️ VALID tapi TIDAK terdaftar - Kuning Bootstrap
    if (valid && !registered) {
      return {
        icon: ShieldAlert,
        iconColor: '#1f2937',
        bgClass: 'bg-warning',
        textClass: 'text-dark',
        borderClass: 'border-warning',
        badgeClass: 'bg-warning text-dark',
        title: 'Sertifikat ASLI',
        subtitle: 'Namun tidak terdaftar',
        description: result.message,
        isRevoked: false
      };
    }
    
    // ❌ TIDAK VALID - Merah Bootstrap
    return {
      icon: FileX,
      iconColor: ICON.white,
      bgClass: 'bg-danger',
      textClass: 'text-white',
      borderClass: 'border-danger',
      badgeClass: 'bg-danger text-white',
      title: 'Sertifikat TIDAK VALID',
      subtitle: 'Verifikasi gagal',
      description: result.message,
      isRevoked: false
    };
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="min-vh-100 bg-light py-4 py-md-5">
      <div className="container py-3 py-md-4">
        
        {/* Back Button */}
        <div className="mb-4">
          <button 
            onClick={handleBack}
            className="btn btn-link text-decoration-none text-secondary d-inline-flex align-items-center gap-2 p-0"
          >
            <ArrowLeft color={ICON.secondary} size={18} />
            <span className="small fw-medium">Kembali</span>
          </button>
        </div>

        {/* Header Section - Simple */}
        <div className="text-center mb-5">
          <div className="d-inline-flex align-items-center gap-2 bg-white px-4 py-2 rounded-pill shadow-sm mb-3 border">
            <Shield color={ICON.primary} size={18} />
            <span className="fw-bold text-dark small">Verifikasi Digital</span>
          </div>
          <h1 className="display-5 fw-bold text-dark mb-3">Verifikasi Sertifikat</h1>
          <p className="text-muted fs-6 mx-auto" style={{maxWidth: '600px'}}>
            Validasi keaslian sertifikat menggunakan <span className="fw-bold text-primary">EdDSA</span> dan <span className="fw-bold text-primary">OCR</span>
          </p>
        </div>

        {!result ? (
          /* Upload Section - Simple White Card */
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5">
              
              {/* Dropzone - Simple border */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
                className={`border-2 border-dashed rounded-3 p-5 text-center cursor-pointer ${
                  dragActive 
                    ? 'border-primary bg-light' 
                    : file 
                      ? 'border-success bg-light' 
                      : 'border-secondary-subtle hover:border-primary'
                }`}
                style={{minHeight: '240px'}}
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
                    file ? 'bg-success text-white' : 'bg-light text-primary border'
                  }`} style={{width: '80px', height: '80px'}}>
                    {file ? <FileCheck color={ICON.white} size={36} /> : <Upload color={ICON.primary} size={36} />}
                  </div>
                </div>
                
                {file ? (
                  <div>
                    <p className="text-dark fw-bold mb-1 fs-5">{file.name}</p>
                    <p className="text-muted small mb-3">{(file.size / 1024).toFixed(1)} KB</p>
                    <div className="d-flex justify-content-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); resetForm(); }} 
                        className="btn btn-sm btn-outline-danger"
                      >
                        <XCircle color={ICON.danger} size={14} className="me-1" /> Ganti
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-dark fw-bold mb-2 fs-4">Drop file di sini</p>
                    <p className="text-muted mb-4">atau klik untuk memilih file</p>
                    <div className="d-flex justify-content-center gap-2 flex-wrap">
                      <span className="badge bg-light text-dark border px-3 py-2">PNG</span>
                      <span className="badge bg-light text-dark border px-3 py-2">JPG</span>
                      <span className="badge bg-light text-muted border px-3 py-2">Max 10MB</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Alert - Simple */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-3 mt-4" role="alert">
                  <AlertCircle color={ICON.white} size={18} />
                  <span className="small fw-bold">{error}</span>
                  <button className="btn-close ms-auto" onClick={() => setError('')} aria-label="Close" />
                </div>
              )}

              {/* Verify Button - Simple */}
              <button
                onClick={handleVerify}
                disabled={!file || loading}
                className={`btn w-100 mt-4 py-3 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2 ${
                  !file || loading ? 'btn-secondary disabled' : 'btn-primary'
                }`}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <Shield color={ICON.white} size={20} />
                    <span>Verifikasi Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Result Section - Simple Colors */
          <div className="row g-4">
            
            {/* Status Card - Simple Bootstrap Colors */}
            <div className="col-lg-5">
              <div className={`card h-100 border-0 shadow-sm ${statusConfig?.bgClass}`}>
                <div className="card-body d-flex flex-column align-items-center justify-content-center p-4 p-md-5 text-center">
                  
                  {/* Status Icon */}
                  <div 
                    className={`rounded-circle d-flex align-items-center justify-content-center mb-4 shadow-sm ${statusConfig?.bgClass}`}
                    style={{width: '90px', height: '90px'}}
                  >
                    {statusConfig && <statusConfig.icon color={statusConfig.iconColor} size={45} />}
                  </div>
                  
                  {/* REVOKED Badge - ✅ FIX: White badge on red background */}
                  {statusConfig?.isRevoked && (
                    <span className="badge bg-white text-danger px-3 py-2 mb-3 fw-bold">
                      <Ban color={ICON.danger} size={14} className="me-1" />
                      DICABUT
                    </span>
                  )}
                  
                  <h2 className={`h3 fw-bold mb-1 ${statusConfig?.textClass}`}>
                    {statusConfig?.title}
                  </h2>
                  <p className={`fw-medium mb-3 ${statusConfig?.isRevoked ? 'text-white-50' : statusConfig?.bgClass === 'bg-warning' ? 'text-dark' : 'text-white-50'}`}>
                    {statusConfig?.subtitle}
                  </p>
                  
                  <span className={`badge px-4 py-2 fw-medium small ${statusConfig?.badgeClass}`}>
                    {statusConfig?.description}
                  </span>

                  {/* Verification Checks - ✅ FIX: Explicit bg-white + text-dark for revoked state */}
                  <div className="w-100 mt-4">
                    {[
                      { label: 'Integritas Data', val: result.integrity?.hash_match, icon: Fingerprint },
                      { label: 'Tanda Tangan Digital', val: result.integrity?.signature_valid, icon: Shield },
                      { label: 'Status Registrasi', val: result?.registered, icon: Database },
                      { label: 'Status Pencabutan', val: !result?.revoked, icon: Ban, isRevoked: true }
                    ].map((item, idx) => {
                      const isValid = item.isRevoked ? item.val : item.val;
                      const itemColor = isValid ? ICON.success : ICON.danger;
                      const itemBg = isValid ? BG_RGBA(ICON.success, 0.1) : BG_RGBA(ICON.danger, 0.1);
                      
                      return (
                        <div 
                          key={idx} 
                          className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-2 border"
                          style={{
                            // ✅ FIX: Selalu bg-white + text-dark, tidak inherit dari parent
                            backgroundColor: '#ffffff',
                            borderColor: itemColor,
                            color: '#212529'
                          }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: '32px', 
                                height: '32px',
                                backgroundColor: itemBg,
                                color: itemColor
                              }}
                            >
                              {/* ✅ FIX: Icon color explicit, tidak inherit */}
                              <item.icon color={itemColor} size={16} />
                            </div>
                            {/* ✅ FIX: Text color explicit */}
                            <span className="text-dark small fw-bold">{item.label}</span>
                          </div>
                          {isValid ? (
                            <span className="badge bg-success text-white px-3 py-2">
                              <CheckCircle color={ICON.white} size={14} className="me-1" /> Valid
                            </span>
                          ) : (
                            <span className="badge bg-danger text-white px-3 py-2">
                              <XCircle color={ICON.white} size={14} className="me-1" /> 
                              {item.isRevoked ? 'DICABUT' : 'Invalid'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Card - Simple White */}
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm h-100 bg-white">
                <div className="card-body p-4 p-md-5">
                  
                  {/* REVOKED Banner - ✅ FIX: Explicit colors */}
                  {result?.revoked && (
                    <div className="alert alert-danger border-0 rounded-3 mb-4 d-flex align-items-center gap-3">
                      <Ban color={ICON.white} size={24} />
                      <div>
                        <h4 className="fw-bold mb-1 text-white">Sertifikat Tidak Berlaku</h4>
                        <p className="mb-0 small" style={{color: 'rgba(255,255,255,0.9)'}}>
                          Sertifikat ini telah dicabut.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Card Header - Simple */}
                  <div className="d-flex align-items-center gap-3 mb-4 pb-4 border-bottom">
                    <div 
                      className={`rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm ${
                        result?.revoked ? 'bg-danger' : 'bg-primary'
                      }`}
                      style={{width: '48px', height: '48px'}}
                    >
                      {result?.revoked ? <Ban color={ICON.white} size={24} /> : <Award color={ICON.white} size={24} />}
                    </div>
                    <div>
                      <h3 className="h5 fw-bold text-dark mb-0">
                        {result?.revoked ? 'Detail Sertifikat (Dicabut)' : 'Detail Sertifikat'}
                      </h3>
                      <p className="text-muted small mb-0">
                        {result?.revoked 
                          ? 'Informasi untuk arsip - sertifikat tidak berlaku'
                          : result?.registered 
                            ? 'Informasi lengkap dari database' 
                            : 'Informasi terbatas'}
                      </p>
                    </div>
                  </div>

                  {/* Certificate Details - Simple Grid */}
                  {result.registered ? (
                    <div className="row g-3">
                      {[
                        { label: 'ID Sertifikat', value: result.certificate?.id, icon: Hash, mono: true },
                        { label: 'Nama Penerima', value: result.certificate?.recipient_name || result.certificate?.participant, icon: User },
                        { label: 'Judul Sertifikat', value: result.certificate?.title || result.certificate?.course_name, icon: Award },
                        { label: 'Institusi', value: result.certificate?.institution, icon: Building2 },
                        { 
                          label: 'Tanggal Terbit', 
                          value: result.certificate?.issued_date 
                            ? new Date(result.certificate.issued_date).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric'
                              })
                            : '-',
                          icon: Calendar 
                        }
                      ].map((data, i) => (
                        <div key={i} className="col-12 col-sm-6">
                          <div className="p-3 rounded-3 border bg-light h-100">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <data.icon color={ICON.primary} size={16} />
                              <p className="text-muted small fw-bold text-uppercase mb-0" style={{fontSize: '0.7rem'}}>
                                {data.label}
                              </p>
                            </div>
                            <p className={`fw-bold text-dark mb-0 ${data.mono ? 'font-monospace' : ''} ${result?.revoked ? 'text-decoration-line-through text-muted' : ''}`} 
                               style={{fontSize: data.mono ? '0.85rem' : '1rem'}}>
                              {data.value || <span className="text-muted fst-italic">-</span>}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Revoked Date - Only if revoked */}
                      {result?.revoked && result.certificate?.revoked_at && (
                        <div className="col-12">
                          <div className="p-3 rounded-3 border h-100" style={{backgroundColor: BG_RGBA('#dc3545', 0.1), borderColor: ICON.danger}}>
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <Ban color={ICON.danger} size={16} />
                              <p className="text-danger small fw-bold text-uppercase mb-0" style={{fontSize: '0.7rem'}}>
                                Tanggal Dicabut
                              </p>
                            </div>
                            <p className="fw-bold text-danger mb-0">
                              {new Date(result.certificate.revoked_at).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Not Registered - Simple */
                    <div className="text-center py-4">
                      <div className="bg-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                           style={{width: '64px', height: '64px'}}>
                        <Database color="#1f2937" size={32} />
                      </div>
                      <h4 className="h6 fw-bold text-dark mb-2">Sertifikat Tidak Terdaftar</h4>
                      <p className="text-muted small">
                        Signature valid, tetapi tidak ditemukan dalam database.
                      </p>
                    </div>
                  )}

                  {/* Reset Button - Simple */}
                  <button 
                    onClick={resetForm} 
                    className={`btn w-100 mt-4 py-3 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2 ${
                      result?.revoked ? 'btn-danger' : 'btn-dark'
                    }`}
                  >
                    <RefreshCw color={ICON.white} size={18} />
                    Verifikasi Sertifikat Lain
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer - Simple */}
        <div className="text-center mt-5 pt-4">
          <div className="d-inline-flex align-items-center gap-2 text-muted small">
            <Info color={ICON.primary} size={14} />
            <span>EdDSA (Ed25519) + SHA-512</span>
          </div>
          <p className="text-muted small mt-2 mb-0">
            © {new Date().getFullYear()} Sistem Sertifikat Digital
          </p>
        </div>

      </div>
    </div>
  );
};

// ✅ Helper: RGBA untuk Bootstrap 5.0.0-beta1 (karena bg-opacity-* tidak ada)
const BG_RGBA = (hex, opacity = 0.1) => {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default PublicVerify;