import React, { useState } from 'react';
import { 
  Upload, Shield, CheckCircle, XCircle, AlertCircle, Loader2, 
  RefreshCw, FileCheck, Database, 
  FileX, ShieldCheck, ShieldAlert, Award, User, Building2, 
  Calendar, Hash, Fingerprint, Ban
} from 'lucide-react';
import AppHeader from '../shared/AppHeader';  
import { verifyApi } from '../../services/api';  

const API_BASE_URL = 'http://localhost:8000'; 

const PublicVerify = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const COLORS = {
    primary: '#6b21a8',
    primaryDark: '#a300c8',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#dc2626',
    secondary: '#6c757d',
    white: '#ffffff',
    light: '#f8fafc'
  };

  const BG_RGBA = (hex, opacity = 0.1) => {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

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
      setError('Format file tidak didukung');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Ukuran file maksimal 10MB');
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
      const response = await verifyApi.verifyCertificate(formData);
      setResult(response.data);
    } catch (err) {
      console.error('Verification error:', err);
      setError('Gagal terhubung ke server saat proses verifikasi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError('');
  };

  const getStatusConfig = () => {
    if (!result) return null;
    
    const { valid, registered, revoked } = result;
    
    if (revoked) {
      return {
        icon: Ban,
        iconColor: COLORS.danger,
        bgClass: 'bg-danger',
        textClass: 'text-white',
        borderClass: 'border-danger',
        badgeClass: 'bg-white text-danger', 
        title: 'Sertifikat Telah Dicabut',
        // subtitle: 'Status sertifikat dinyatakan tidak berlaku oleh admin',
        description: result.message || 'Sertifikat ini telah dicabut oleh admin',
        isRevoked: true
      };
    }
    
    if (valid && registered) {
      return {
        icon: ShieldCheck,
        iconColor: COLORS.white,
        bgClass: 'bg-success',
        textClass: 'text-white',
        borderClass: 'border-success',
        borderColor: COLORS.success,
        badgeClass: 'bg-success text-white',
        title: 'Sertifikat Valid',
        // subtitle: 'Data sertifikat sesuai dengan informasi yang tersimpan dalam sistem',
        description: result.message,
        isRevoked: false
      };
    }
    
    if (valid && !registered) {
      return {
        icon: ShieldAlert,
        iconColor: '#1f2937',
        bgClass: 'bg-warning',
        textClass: 'text-dark',
        borderClass: 'border-warning',
        badgeClass: 'bg-warning text-dark',
        title: 'Integritas Sertifikat Valid',
        // subtitle: 'Data sertifikat tidak ditemukan pada basis data sistem',
        description: result.message,
        isRevoked: false
      };
    }
    
    return {
      icon: FileX,
      iconColor: COLORS.white,
      bgClass: 'bg-danger',
      textClass: 'text-white',
      borderClass: 'border-danger',
      badgeClass: 'bg-danger text-white',
      title: 'Sertifikat Tidak Valid',
      // subtitle: 'Ketidaksesuaian ditemukan pada proses validasi',
      description: result.message,
      isRevoked: false
    };
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="min-vh-100 bg-light">
      <AppHeader />
      <div className="app-header-spacer" />
      
      <div 
        style={{
          background: `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
          padding: '2.5rem 0 3rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                             radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
            pointerEvents: 'none'
          }}
        />

        <div className="container position-relative">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
            <div>
              <div className="d-flex align-items-center gap-3 mb-2">
                <h1 className="h3 fw-bold text-white mb-0">
                  Verifikasi Keaslian Sertifikat Digital 
                </h1>
              </div>
              <p className="text-white-50 mb-0" style={{fontSize: '0.95rem'}}>
                Verifikasi keaslian sertifikat digital dilakukan melalui validasi tanda tangan digital berbasis algoritma EdDSA (Ed25519) serta ekstraksi informasi menggunakan Optical Character Recognition (OCR)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container" style={{marginTop: '-3rem', position: 'relative', zIndex: 10}}>
        
        {!result ? (
          /* Upload Section */
          <div 
            className="card border-0"
            style={{
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}
          >
            <div className="card-body p-4 p-md-5">
              
              {/* Dropzone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
                className="rounded-3 p-5 text-center"
                style={{
                  minHeight: '280px',
                  border: `2px dashed ${dragActive ? COLORS.primary : file ? COLORS.success : '#cbd5e1'}`,
                  background: dragActive ? `${COLORS.primary}10` : file ? `${COLORS.success}10` : COLORS.light,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <input 
                  id="file-input" 
                  type="file" 
                  className="d-none" 
                  accept=".png,.jpg,.jpeg" 
                  onChange={handleFileSelect} 
                />
                
                <div className="mb-4">
                  <div 
                    className="d-inline-flex align-items-center justify-content-center rounded-circle"
                    style={{
                      width: '90px',
                      height: '90px',
                      background: file ? `linear-gradient(135deg, ${COLORS.success} 0%, #059669 100%)` : `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                      boxShadow: `0 8px 24px ${file ? COLORS.success : COLORS.primary}40`
                    }}
                  >
                    {file ? <FileCheck color={COLORS.white} size={42} /> : <Upload color={COLORS.white} size={42} />}
                  </div>
                </div>
                
                {file ? (
                  <div>
                    <p className="fw-bold mb-2" style={{fontSize: '1.25rem', color: COLORS.dark}}>
                      {file.name}
                    </p>
                    <p className="text-muted mb-3" style={{fontSize: '0.9rem'}}>
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); resetForm(); }} 
                      className="btn px-4 py-2 fw-semibold"
                      style={{
                        background: 'white',
                        color: COLORS.danger,
                        border: `2px solid ${COLORS.danger}`,
                        borderRadius: '10px'
                      }}
                    >
                      <XCircle color={COLORS.danger} size={16} className="me-2" /> Ganti File
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="fw-bold mb-2" style={{fontSize: '1.5rem', color: COLORS.dark}}>
                      Seret file ke sini
                    </p>
                    <p className="text-muted mb-4" style={{fontSize: '0.95rem'}}>
                      atau klik untuk memilih file
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
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <div 
                  className="d-flex align-items-center gap-3 mt-4 p-3 rounded-3"
                  style={{
                    background: `${COLORS.danger}10`,
                    border: `1px solid ${COLORS.danger}30`
                  }}
                >
                  <AlertCircle color={COLORS.danger} size={20} />
                  <span className="fw-semibold" style={{color: COLORS.danger, fontSize: '0.9rem'}}>{error}</span>
                  <button 
                    className="btn-close ms-auto" 
                    onClick={() => setError('')} 
                    aria-label="Close" 
                  />
                </div>
              )}

              {/* Verify Button */}
              <button
                onClick={handleVerify}
                disabled={!file || loading}
                className="btn w-100 mt-4 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                style={{
                  background: (!file || loading) ? '#9ca3af' : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                  color: 'white',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '1.05rem',
                  boxShadow: (!file || loading) ? 'none' : `0 8px 24px ${COLORS.primary}40`,
                  transition: 'all 0.3s ease',
                  cursor: (!file || loading) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <Shield color={COLORS.white} size={20} />
                    <span>Mulai Verifikasi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Result Section */
          <div className="row g-4">
            
            {/* Status Card */}
            <div className="col-lg-5">
              <div 
                className="card h-100 border-0"
                style={{
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  overflow: 'hidden'
                }}
              >
                <div 
                  className={`card-body d-flex flex-column align-items-center justify-content-center p-4 p-md-5 text-center ${statusConfig?.bgClass}`}
                >
                  
                  {/* Status Icon */}
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center mb-4"
                    style={{
                      width: '100px',
                      height: '100px',
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    {statusConfig && <statusConfig.icon color={statusConfig.iconColor} size={50} />}
                  </div>
                  
                  {statusConfig?.isRevoked && (
                    <span 
                      className="badge px-4 py-2 mb-3 fw-bold"
                      style={{
                        background: 'white',
                        color: COLORS.danger,
                        fontSize: '0.85rem',
                        borderRadius: '8px'
                      }}
                    >
                      <Ban color={COLORS.danger} size={14} className="me-1" />
                      DICABUT
                    </span>
                  )}
                  
                  <h2 className={`h3 fw-bold mb-2 ${statusConfig?.textClass}`}>
                    {statusConfig?.title}
                  </h2>
                  {/* <p 
                    className={`fw-medium mb-3 ${
                      statusConfig?.isRevoked ? 'text-white-50' : 
                      statusConfig?.bgClass === 'bg-warning' ? 'text-dark' : 
                      'text-white-50'
                    }`}
                    style={{fontSize: '0.95rem'}}
                  >
                    {statusConfig?.subtitle}
                  </p> */}
                  
                  <span 
                    className={`badge px-4 py-2 fw-medium ${statusConfig?.badgeClass}`}
                    style={{
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }}
                  >
                    {statusConfig?.description}
                  </span>

                  {/* Verification Items */}
                  <div className="w-100 mt-4">
                    {[
                      { 
                        label: 'Integritas Data', 
                        val: result.integrity?.hash_match, 
                        icon: Fingerprint,
                        canDetermine: true  
                      },
                      { 
                        label: 'Tanda Tangan Digital', 
                        val: result.integrity?.signature_valid, 
                        icon: Shield,
                        canDetermine: true  
                      },
                      { 
                        label: 'Status Registrasi', 
                        val: result?.registered, 
                        icon: Database,
                        canDetermine: true  
                      },
                      { 
                        label: 'Status Pencabutan', 
                        val: result?.revoked === false, 
                        icon: Ban, 
                        isRevoked: true,
                        canDetermine: result?.registered === true
                      }
                    ].map((item, idx) => {
                      if (!item.canDetermine) {
                        return (
                          <div 
                            key={idx} 
                            className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-2"
                            style={{
                              backgroundColor: 'white',
                              border: `2px solid ${COLORS.secondary}`,
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center"
                                style={{
                                  width: '36px', 
                                  height: '36px',
                                  backgroundColor: BG_RGBA(COLORS.secondary, 0.1),
                                  color: COLORS.secondary
                                }}
                              >
                                <item.icon color={COLORS.secondary} size={18} />
                              </div>
                              <span className="fw-bold" style={{color: COLORS.dark, fontSize: '0.85rem'}}>
                                {item.label}
                              </span>
                            </div>
                            <span 
                              className="badge px-3 py-2"
                              style={{
                                background: COLORS.secondary,
                                color: 'white',
                                borderRadius: '8px',
                                fontSize: '0.75rem'
                              }}
                            >
                              N/A
                            </span>
                          </div>
                        );
                      }

                      const isValid = item.val;
                      const itemColor = isValid ? COLORS.success : COLORS.danger;
                      const itemBg = isValid ? BG_RGBA(COLORS.success, 0.1) : BG_RGBA(COLORS.danger, 0.1);
                      
                      return (
                        <div 
                          key={idx} 
                          className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-2"
                          style={{
                            backgroundColor: 'white',
                            border: `2px solid ${itemColor}`,
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: '36px', 
                                height: '36px',
                                backgroundColor: itemBg,
                                color: itemColor
                              }}
                            >
                              <item.icon color={itemColor} size={18} />
                            </div>
                            <span className="fw-bold" style={{color: COLORS.dark, fontSize: '0.85rem'}}>
                              {item.label}
                            </span>
                          </div>
                          {isValid ? (
                            <span 
                              className="badge px-3 py-2"
                              style={{
                                background: COLORS.success,
                                color: 'white',
                                borderRadius: '8px',
                                fontSize: '0.75rem'
                              }}
                            >
                              <CheckCircle color={COLORS.white} size={14} className="me-1" /> Valid
                            </span>
                          ) : (
                            <span 
                              className="badge px-3 py-2"
                              style={{
                                background: COLORS.danger,
                                color: 'white',
                                borderRadius: '8px',
                                fontSize: '0.75rem'
                              }}
                            >
                              <XCircle color={COLORS.white} size={14} className="me-1" /> 
                              {item.isRevoked ? 'Dicabut' : 'Tidak Valid'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Card */}
            <div className="col-lg-7">
              <div 
                className="card border-0 h-100"
                style={{
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                  background: 'white'
                }}
              >
                <div className="card-body p-4 p-md-5">
                  
                  {result?.revoked && (
                    <div 
                      className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.danger} 0%, #b91c1c 100%)`,
                        color: 'white'
                      }}
                    >
                      <Ban color={COLORS.white} size={28} />
                      <div>
                        <h4 className="fw-bold mb-1 text-white" style={{fontSize: '1.1rem'}}>
                          Sertifikat Tidak Berlaku
                        </h4>
                        <p className="mb-0" style={{fontSize: '0.85rem', opacity: 0.9}}>
                          Sertifikat ini telah dicabut oleh admin.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Card Header */}
                  <div className="d-flex align-items-center gap-3 mb-4 pb-4" style={{borderBottom: `2px solid ${COLORS.light}`}}>
                    <div>
                      <h3 className="h5 fw-bold mb-0" style={{color: COLORS.dark}}>
                        {result?.revoked ? 'Detail Sertifikat (Dicabut)' : 'Detail Sertifikat'}
                      </h3>
                    </div>
                  </div>

                  {/* Certificate Details */}
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
                          <div 
                            className="p-3 rounded-3 h-100"
                            style={{
                              background: COLORS.light,
                              border: `1px solid #e2e8f0`
                            }}
                          >
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <data.icon color={COLORS.primary} size={16} />
                              <p 
                                className="fw-bold text-uppercase mb-0"
                                style={{
                                  color: COLORS.secondary,
                                  fontSize: '0.7rem',
                                  letterSpacing: '0.5px'
                                }}
                              >
                                {data.label}
                              </p>
                            </div>
                            <p 
                              className={`fw-bold mb-0 ${data.mono ? 'font-monospace' : ''} ${
                                result?.revoked ? 'text-decoration-line-through' : ''
                              }`}
                              style={{
                                color: result?.revoked ? COLORS.secondary : COLORS.dark,
                                fontSize: data.mono ? '0.85rem' : '1rem'
                              }}
                            >
                              {data.value || <span className="fst-italic" style={{color: COLORS.secondary}}>-</span>}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Revoked Date */}
                      {result?.revoked && result.certificate?.revoked_at && (
                        <div className="col-12">
                          <div 
                            className="p-3 rounded-3"
                            style={{
                              backgroundColor: BG_RGBA(COLORS.danger, 0.1),
                              border: `2px solid ${COLORS.danger}`
                            }}
                          >
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <Ban color={COLORS.danger} size={16} />
                              <p 
                                className="fw-bold text-uppercase mb-0"
                                style={{
                                  color: COLORS.danger,
                                  fontSize: '0.7rem',
                                  letterSpacing: '0.5px'
                                }}
                              >
                                Tanggal Dicabut
                              </p>
                            </div>
                            <p className="fw-bold mb-0" style={{color: COLORS.danger, fontSize: '1rem'}}>
                              {new Date(result.certificate.revoked_at).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Not Registered */
                    <div className="text-center py-5">
                      <div 
                        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                        style={{
                          width: '80px',
                          height: '80px',
                          background: `linear-gradient(135deg, ${COLORS.warning} 0%, #d97706 100%)`,
                          boxShadow: `0 8px 24px ${COLORS.warning}40`
                        }}
                      >
                        <Database color={COLORS.white} size={36} />
                      </div>
                      <h4 className="h5 fw-bold mb-2" style={{color: COLORS.dark}}>
                        Sertifikat Tidak Terdaftar
                      </h4>
                      <p className="text-muted mb-0" style={{fontSize: '0.9rem'}}>
                        Sertifikat tidak ditemukan dalam basis data sistem. Hal ini dapat disebabkan oleh QR Code yang tidak terbaca dengan baik atau sertifikat belum pernah diregistrasikan ke dalam sistem.
                      </p>
                    </div>
                  )}

                  {/* Reset Button */}
                  <button 
                    onClick={resetForm} 
                    className="btn w-100 mt-4 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                    style={{
                      background: `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                      color: 'white',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '1rem',
                      boxShadow: `0 8px 24px ${result?.revoked ? COLORS.danger : COLORS.dark}40`
                    }}
                  >
                    <RefreshCw color={COLORS.white} size={18} />
                    Verifikasi Sertifikat Lain
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
         <div className="admin-header-spacer" />
      </div>
    </div>
  );
};

export default PublicVerify;

// import React, { useState } from 'react';
// import { 
//   Upload, Shield, CheckCircle, XCircle, AlertCircle, Loader2, 
//   RefreshCw, FileCheck, Database, 
//   FileX, ShieldCheck, ShieldAlert, Award, User, Building2, 
//   Calendar, Hash, Fingerprint, Ban
// } from 'lucide-react';
// import AdminHeader from '../shared/AppHeader'; 

// const PublicVerify = () => {
//   const [file, setFile] = useState(null);
//   const [dragActive, setDragActive] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState('');

//   const COLORS = {
//     primary: '#6b21a8',
//     primaryDark: '#a300c8',
//     success: '#10b981',
//     warning: '#f59e0b',
//     danger: '#dc2626',
//     secondary: '#6c757d',
//     white: '#ffffff',
//     light: '#f8fafc'
//   };

//   const BG_RGBA = (hex, opacity = 0.1) => {
//     const r = parseInt(hex.slice(1,3), 16);
//     const g = parseInt(hex.slice(3,5), 16);
//     const b = parseInt(hex.slice(5,7), 16);
//     return `rgba(${r}, ${g}, ${b}, ${opacity})`;
//   };

//   const handleDrag = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(e.type === 'dragenter' || e.type === 'dragover');
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(false);
//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       handleFile(e.dataTransfer.files[0]);
//     }
//   };

//   const handleFile = (selectedFile) => {
//     const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
//     if (!validTypes.includes(selectedFile.type)) {
//       setError('Format file tidak didukung. Gunakan PNG/JPG/JPEG.');
//       return;
//     }
//     if (selectedFile.size > 10 * 1024 * 1024) {
//       setError('Ukuran file terlalu besar. Maksimal 10MB.');
//       return;
//     }
//     setFile(selectedFile);
//     setError('');
//     setResult(null);
//   };

//   const handleFileSelect = (e) => {
//     if (e.target.files && e.target.files[0]) {
//       handleFile(e.target.files[0]);
//     }
//   };

//   const handleVerify = async (e) => {
//     e.preventDefault();
//     if (!file) {
//       setError('Harap pilih file sertifikat!');
//       return;
//     }

//     setLoading(true);
//     setError('');

//     try {
//       const formData = new FormData();
//       formData.append('file', file);

//       const response = await fetch('http://localhost:8000/api/verify', {
//         method: 'POST',
//         body: formData
//       });

//       const data = await response.json();
//       setResult(data);
//     } catch (err) {
//       setError('Gagal terhubung ke server saat proses verifikasi. Silakan coba lagi.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetForm = () => {
//     setFile(null);
//     setResult(null);
//     setError('');
//   };

//   const getStatusConfig = () => {
//     if (!result) return null;
    
//     const { valid, registered, revoked } = result;
    
//     if (revoked) {
//       return {
//         icon: Ban,
//         iconColor: COLORS.danger,
//         bgClass: 'bg-danger',
//         textClass: 'text-white',
//         borderClass: 'border-danger',
//         badgeClass: 'bg-white text-danger', 
//         title: 'Sertifikat DICABUT',
//         subtitle: 'Tidak berlaku lagi',
//         description: result.message || 'Sertifikat ini telah dicabut oleh penerbit',
//         isRevoked: true
//       };
//     }
    
//     if (valid && registered) {
//       return {
//         icon: ShieldCheck,
//         iconColor: COLORS.white,
//         bgClass: 'bg-success',
//         textClass: 'text-white',
//         borderClass: 'border-success',
//         borderColor: COLORS.success,
//         badgeClass: 'bg-success text-white',
//         title: 'Sertifikat VALID',
//         subtitle: 'Terverifikasi dalam sistem',
//         description: result.message,
//         isRevoked: false
//       };
//     }
    
//     if (valid && !registered) {
//       return {
//         icon: ShieldAlert,
//         iconColor: '#1f2937',
//         bgClass: 'bg-warning',
//         textClass: 'text-dark',
//         borderClass: 'border-warning',
//         badgeClass: 'bg-warning text-dark',
//         title: 'Sertifikat VALID',
//         subtitle: 'Namun tidak terdaftar',
//         description: result.message,
//         isRevoked: false
//       };
//     }
    
//     return {
//       icon: FileX,
//       iconColor: COLORS.white,
//       bgClass: 'bg-danger',
//       textClass: 'text-white',
//       borderClass: 'border-danger',
//       badgeClass: 'bg-danger text-white',
//       title: 'Sertifikat TIDAK VALID',
//       subtitle: 'Verifikasi gagal dilakukan',
//       description: result.message,
//       isRevoked: false
//     };
//   };

//   const statusConfig = getStatusConfig();

//   return (
//     <div className="min-vh-100 bg-light ">
//       <AdminHeader />
//       <div className="admin-header-spacer" />
//       <div 
//         style={{
//           background: `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
//           padding: '2.5rem 0 3rem',
//           position: 'relative',
//           overflow: 'hidden'
//         }}
//       >
//         <div 
//           style={{
//             position: 'absolute',
//             top: 0, left: 0, right: 0, bottom: 0,
//             backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
//                              radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
//             pointerEvents: 'none'
//           }}
//         />

//         <div className="container position-relative">
//           <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
//             <div>
//               <div className="d-flex align-items-center gap-3 mb-2">
//                 <h1 className="h3 fw-bold text-white mb-0">
//                   Verifikasi Sertifikat Digital
//                 </h1>
//               </div>
//               <p className="text-white-50 mb-0" style={{fontSize: '0.95rem'}}>
//                 Validasi keaslian sertifikat menggunakan teknologi <span className="fw-bold text-white">EdDSA (Ed25519)</span> dan <span className="fw-bold text-white">OCR</span>

//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ========== MAIN CONTENT ========== */}
//       <div className="container" style={{marginTop: '-3rem', position: 'relative', zIndex: 10}}>
        
//         {!result ? (
//           /* Upload Section */
//           <div 
//             className="card border-0"
//             style={{
//               borderRadius: '16px',
//               boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
//               overflow: 'hidden'
//             }}
//           >
//             <div className="card-body p-4 p-md-5">
              
//               {/* Dropzone */}
//               <div
//                 onDragEnter={handleDrag}
//                 onDragLeave={handleDrag}
//                 onDragOver={handleDrag}
//                 onDrop={handleDrop}
//                 onClick={() => document.getElementById('file-input').click()}
//                 className="rounded-3 p-5 text-center"
//                 style={{
//                   minHeight: '280px',
//                   border: `2px dashed ${dragActive ? COLORS.primary : file ? COLORS.success : '#cbd5e1'}`,
//                   background: dragActive ? `${COLORS.primary}10` : file ? `${COLORS.success}10` : COLORS.light,
//                   cursor: 'pointer',
//                   transition: 'all 0.3s ease'
//                 }}
//               >
//                 <input 
//                   id="file-input" 
//                   type="file" 
//                   className="d-none" 
//                   accept=".png,.jpg,.jpeg" 
//                   onChange={handleFileSelect} 
//                 />
                
//                 <div className="mb-4">
//                   <div 
//                     className="d-inline-flex align-items-center justify-content-center rounded-circle"
//                     style={{
//                       width: '90px',
//                       height: '90px',
//                       background: file ? `linear-gradient(135deg, ${COLORS.success} 0%, #059669 100%)` : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
//                       boxShadow: `0 8px 24px ${file ? COLORS.success : COLORS.primary}40`
//                     }}
//                   >
//                     {file ? <FileCheck color={COLORS.white} size={42} /> : <Upload color={COLORS.white} size={42} />}
//                   </div>
//                 </div>
                
//                 {file ? (
//                   <div>
//                     <p className="fw-bold mb-2" style={{fontSize: '1.25rem', color: COLORS.dark}}>
//                       {file.name}
//                     </p>
//                     <p className="text-muted mb-3" style={{fontSize: '0.9rem'}}>
//                       {(file.size / 1024).toFixed(1)} KB
//                     </p>
//                     <button 
//                       onClick={(e) => { e.stopPropagation(); resetForm(); }} 
//                       className="btn px-4 py-2 fw-semibold"
//                       style={{
//                         background: 'white',
//                         color: COLORS.danger,
//                         border: `2px solid ${COLORS.danger}`,
//                         borderRadius: '10px'
//                       }}
//                     >
//                       <XCircle color={COLORS.danger} size={16} className="me-2" /> Ganti File
//                     </button>
//                   </div>
//                 ) : (
//                   <div>
//                     <p className="fw-bold mb-2" style={{fontSize: '1.5rem', color: COLORS.dark}}>
//                       Seret file ke sini
//                     </p>
//                     <p className="text-muted mb-4" style={{fontSize: '0.95rem'}}>
//                       atau klik untuk memilih file
//                     </p>
//                     <div className="d-flex justify-content-center gap-2 flex-wrap">
//                       <span 
//                         className="px-3 py-2 fw-semibold"
//                         style={{
//                           background: 'white',
//                           color: COLORS.dark,
//                           border: `1px solid #e2e8f0`,
//                           borderRadius: '8px',
//                           fontSize: '0.85rem'
//                         }}
//                       >
//                         PNG
//                       </span>
//                       <span 
//                         className="px-3 py-2 fw-semibold"
//                         style={{
//                           background: 'white',
//                           color: COLORS.dark,
//                           border: `1px solid #e2e8f0`,
//                           borderRadius: '8px',
//                           fontSize: '0.85rem'
//                         }}
//                       >
//                         JPG
//                       </span>
//                       <span 
//                         className="px-3 py-2 fw-semibold"
//                         style={{
//                           background: 'white',
//                           color: COLORS.secondary,
//                           border: `1px solid #e2e8f0`,
//                           borderRadius: '8px',
//                           fontSize: '0.85rem'
//                         }}
//                       >
//                         Max 10MB
//                       </span>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Error Alert */}
//               {error && (
//                 <div 
//                   className="d-flex align-items-center gap-3 mt-4 p-3 rounded-3"
//                   style={{
//                     background: `${COLORS.danger}10`,
//                     border: `1px solid ${COLORS.danger}30`
//                   }}
//                 >
//                   <AlertCircle color={COLORS.danger} size={20} />
//                   <span className="fw-semibold" style={{color: COLORS.danger, fontSize: '0.9rem'}}>{error}</span>
//                   <button 
//                     className="btn-close ms-auto" 
//                     onClick={() => setError('')} 
//                     aria-label="Close" 
//                   />
//                 </div>
//               )}

//               {/* Verify Button */}
//               <button
//                 onClick={handleVerify}
//                 disabled={!file || loading}
//                 className="btn w-100 mt-4 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
//                 style={{
//                   background: (!file || loading) ? '#9ca3af' : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
//                   color: 'white',
//                   borderRadius: '12px',
//                   border: 'none',
//                   fontSize: '1.05rem',
//                   boxShadow: (!file || loading) ? 'none' : `0 8px 24px ${COLORS.primary}40`,
//                   transition: 'all 0.3s ease',
//                   cursor: (!file || loading) ? 'not-allowed' : 'pointer'
//                 }}
//               >
//                 {loading ? (
//                   <>
//                     <Loader2 className="animate-spin" size={20} />
//                     <span>Memverifikasi...</span>
//                   </>
//                 ) : (
//                   <>
//                     <Shield color={COLORS.white} size={20} />
//                     <span>Verifikasi Sekarang</span>
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         ) : (
//           /* Result Section */
//           <div className="row g-4">
            
//             {/* Status Card */}
//             <div className="col-lg-5">
//               <div 
//                 className="card h-100 border-0"
//                 style={{
//                   borderRadius: '16px',
//                   boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
//                   overflow: 'hidden'
//                 }}
//               >
//                 <div 
//                   className={`card-body d-flex flex-column align-items-center justify-content-center p-4 p-md-5 text-center ${statusConfig?.bgClass}`}
//                 >
                  
//                   {/* Status Icon */}
//                   <div 
//                     className="rounded-circle d-flex align-items-center justify-content-center mb-4"
//                     style={{
//                       width: '100px',
//                       height: '100px',
//                       background: 'rgba(255,255,255,0.2)',
//                       backdropFilter: 'blur(10px)',
//                       border: '2px solid rgba(255,255,255,0.3)'
//                     }}
//                   >
//                     {statusConfig && <statusConfig.icon color={statusConfig.iconColor} size={50} />}
//                   </div>
                  
//                   {statusConfig?.isRevoked && (
//                     <span 
//                       className="badge px-4 py-2 mb-3 fw-bold"
//                       style={{
//                         background: 'white',
//                         color: COLORS.danger,
//                         fontSize: '0.85rem',
//                         borderRadius: '8px'
//                       }}
//                     >
//                       <Ban color={COLORS.danger} size={14} className="me-1" />
//                       DICABUT
//                     </span>
//                   )}
                  
//                   <h2 className={`h3 fw-bold mb-2 ${statusConfig?.textClass}`}>
//                     {statusConfig?.title}
//                   </h2>
//                   <p 
//                     className={`fw-medium mb-3 ${
//                       statusConfig?.isRevoked ? 'text-white-50' : 
//                       statusConfig?.bgClass === 'bg-warning' ? 'text-dark' : 
//                       'text-white-50'
//                     }`}
//                     style={{fontSize: '0.95rem'}}
//                   >
//                     {statusConfig?.subtitle}
//                   </p>
                  
//                   <span 
//                     className={`badge px-4 py-2 fw-medium ${statusConfig?.badgeClass}`}
//                     style={{
//                       borderRadius: '8px',
//                       fontSize: '0.85rem'
//                     }}
//                   >
//                     {statusConfig?.description}
//                   </span>

//                   {/* Verification Items */}
//                   <div className="w-100 mt-4">
//                     {[
//                       { label: 'Integritas Data', val: result.integrity?.hash_match, icon: Fingerprint },
//                       { label: 'Tanda Tangan Digital', val: result.integrity?.signature_valid, icon: Shield },
//                       { label: 'Status Registrasi', val: result?.registered, icon: Database },
//                       { label: 'Status Pencabutan', val: result?.revoked === false, icon: Ban, isRevoked: true }
//                     ].map((item, idx) => {
//                       const isValid = item.isRevoked ? item.val : item.val;
//                       const itemColor = isValid ? COLORS.success : COLORS.danger;
//                       const itemBg = isValid ? BG_RGBA(COLORS.success, 0.1) : BG_RGBA(COLORS.danger, 0.1);
                      
//                       return (
//                         <div 
//                           key={idx} 
//                           className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-2"
//                           style={{
//                             backgroundColor: 'white',
//                             border: `2px solid ${itemColor}`,
//                             transition: 'all 0.3s ease'
//                           }}
//                         >
//                           <div className="d-flex align-items-center gap-3">
//                             <div 
//                               className="rounded-circle d-flex align-items-center justify-content-center"
//                               style={{
//                                 width: '36px', 
//                                 height: '36px',
//                                 backgroundColor: itemBg,
//                                 color: itemColor
//                               }}
//                             >
//                               <item.icon color={itemColor} size={18} />
//                             </div>
//                             <span className="fw-bold" style={{color: COLORS.dark, fontSize: '0.85rem'}}>
//                               {item.label}
//                             </span>
//                           </div>
//                           {isValid ? (
//                             <span 
//                               className="badge px-3 py-2"
//                               style={{
//                                 background: COLORS.success,
//                                 color: 'white',
//                                 borderRadius: '8px',
//                                 fontSize: '0.75rem'
//                               }}
//                             >
//                               <CheckCircle color={COLORS.white} size={14} className="me-1" /> Valid
//                             </span>
//                           ) : (
//                             <span 
//                               className="badge px-3 py-2"
//                               style={{
//                                 background: COLORS.danger,
//                                 color: 'white',
//                                 borderRadius: '8px',
//                                 fontSize: '0.75rem'
//                               }}
//                             >
//                               <XCircle color={COLORS.white} size={14} className="me-1" /> 
//                               {item.isRevoked ? 'Dicabut' : 'Tidak Valid'}
//                             </span>
//                           )}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Detail Card */}
//             <div className="col-lg-7">
//               <div 
//                 className="card border-0 h-100"
//                 style={{
//                   borderRadius: '16px',
//                   boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
//                   overflow: 'hidden',
//                   background: 'white'
//                 }}
//               >
//                 <div className="card-body p-4 p-md-5">
                  
//                   {result?.revoked && (
//                     <div 
//                       className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3"
//                       style={{
//                         background: `linear-gradient(135deg, ${COLORS.danger} 0%, #b91c1c 100%)`,
//                         color: 'white'
//                       }}
//                     >
//                       <Ban color={COLORS.white} size={28} />
//                       <div>
//                         <h4 className="fw-bold mb-1 text-white" style={{fontSize: '1.1rem'}}>
//                           Sertifikat Tidak Berlaku
//                         </h4>
//                         <p className="mb-0" style={{fontSize: '0.85rem', opacity: 0.9}}>
//                           Sertifikat ini telah dicabut oleh admin.
//                         </p>
//                       </div>
//                     </div>
//                   )}

//                   {/* Card Header */}
//                   <div className="d-flex align-items-center gap-3 mb-4 pb-4" style={{borderBottom: `2px solid ${COLORS.light}`}}>
//                     <div>
//                       <h3 className="h5 fw-bold mb-0" style={{color: COLORS.dark}}>
//                         {result?.revoked ? 'Detail Sertifikat (Dicabut)' : 'Detail Sertifikat'}
//                       </h3>
//                     </div>
//                   </div>

//                   {/* Certificate Details */}
//                   {result.registered ? (
//                     <div className="row g-3">
//                       {[
//                         { label: 'ID Sertifikat', value: result.certificate?.id, icon: Hash, mono: true },
//                         { label: 'Nama Penerima', value: result.certificate?.recipient_name || result.certificate?.participant, icon: User },
//                         { label: 'Judul Sertifikat', value: result.certificate?.title || result.certificate?.course_name, icon: Award },
//                         { label: 'Institusi', value: result.certificate?.institution, icon: Building2 },
//                         { 
//                           label: 'Tanggal Terbit', 
//                           value: result.certificate?.issued_date 
//                             ? new Date(result.certificate.issued_date).toLocaleDateString('id-ID', {
//                                 day: 'numeric', month: 'long', year: 'numeric'
//                               })
//                             : '-',
//                           icon: Calendar 
//                         }
//                       ].map((data, i) => (
//                         <div key={i} className="col-12 col-sm-6">
//                           <div 
//                             className="p-3 rounded-3 h-100"
//                             style={{
//                               background: COLORS.light,
//                               border: `1px solid #e2e8f0`
//                             }}
//                           >
//                             <div className="d-flex align-items-center gap-2 mb-2">
//                               <data.icon color={COLORS.primary} size={16} />
//                               <p 
//                                 className="fw-bold text-uppercase mb-0"
//                                 style={{
//                                   color: COLORS.secondary,
//                                   fontSize: '0.7rem',
//                                   letterSpacing: '0.5px'
//                                 }}
//                               >
//                                 {data.label}
//                               </p>
//                             </div>
//                             <p 
//                               className={`fw-bold mb-0 ${data.mono ? 'font-monospace' : ''} ${
//                                 result?.revoked ? 'text-decoration-line-through' : ''
//                               }`}
//                               style={{
//                                 color: result?.revoked ? COLORS.secondary : COLORS.dark,
//                                 fontSize: data.mono ? '0.85rem' : '1rem'
//                               }}
//                             >
//                               {data.value || <span className="fst-italic" style={{color: COLORS.secondary}}>-</span>}
//                             </p>
//                           </div>
//                         </div>
//                       ))}
                      
//                       {/* Revoked Date */}
//                       {result?.revoked && result.certificate?.revoked_at && (
//                         <div className="col-12">
//                           <div 
//                             className="p-3 rounded-3"
//                             style={{
//                               backgroundColor: BG_RGBA(COLORS.danger, 0.1),
//                               border: `2px solid ${COLORS.danger}`
//                             }}
//                           >
//                             <div className="d-flex align-items-center gap-2 mb-2">
//                               <Ban color={COLORS.danger} size={16} />
//                               <p 
//                                 className="fw-bold text-uppercase mb-0"
//                                 style={{
//                                   color: COLORS.danger,
//                                   fontSize: '0.7rem',
//                                   letterSpacing: '0.5px'
//                                 }}
//                               >
//                                 Tanggal Dicabut
//                               </p>
//                             </div>
//                             <p className="fw-bold mb-0" style={{color: COLORS.danger, fontSize: '1rem'}}>
//                               {new Date(result.certificate.revoked_at).toLocaleDateString('id-ID', {
//                                 day: 'numeric', month: 'long', year: 'numeric'
//                               })}
//                             </p>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   ) : (
//                     /* Not Registered */
//                     <div className="text-center py-5">
//                       <div 
//                         className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
//                         style={{
//                           width: '80px',
//                           height: '80px',
//                           background: `linear-gradient(135deg, ${COLORS.warning} 0%, #d97706 100%)`,
//                           boxShadow: `0 8px 24px ${COLORS.warning}40`
//                         }}
//                       >
//                         <Database color={COLORS.white} size={36} />
//                       </div>
//                       <h4 className="h5 fw-bold mb-2" style={{color: COLORS.dark}}>
//                         Sertifikat Tidak Terdaftar
//                       </h4>
//                       <p className="text-muted mb-0" style={{fontSize: '0.9rem'}}>
//                         Sistem tidak dapat menemukan QR Code valid pada sertifikat. Pastikan posisi QR Code terlihat jelas dan coba pindai kembali.
//                       </p>
//                     </div>
//                   )}

//                   {/* Reset Button */}
//                   <button 
//                     onClick={resetForm} 
//                     className="btn w-100 mt-4 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
//                     style={{
//                       background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%`,
//                       color: 'white',
//                       borderRadius: '12px',
//                       border: 'none',
//                       fontSize: '1rem',
//                       boxShadow: `0 8px 24px ${result?.revoked ? COLORS.danger : COLORS.dark}40`
//                     }}
//                   >
//                     <RefreshCw color={COLORS.white} size={18} />
//                     Verifikasi Sertifikat Lain
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       <div className="admin-header-spacer" />

//       </div>
//     </div>
//   );
// };

// export default PublicVerify;


// import React, { useState } from 'react';
// import { 
//   Upload, Shield, CheckCircle, XCircle, AlertCircle, Loader2, 
//   RefreshCw, FileCheck, Info, ArrowLeft, Database, 
//   FileX, ShieldCheck, ShieldAlert, Award, User, Building2, 
//   Calendar, Hash, Fingerprint, Ban
// } from 'lucide-react';

// const PublicVerify = () => {
//   const [file, setFile] = useState(null);
//   const [dragActive, setDragActive] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState('');

//   const handleDrag = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(e.type === 'dragenter' || e.type === 'dragover');
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(false);
//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       handleFile(e.dataTransfer.files[0]);
//     }
//   };

//   const handleFile = (selectedFile) => {
//     const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
//     if (!validTypes.includes(selectedFile.type)) {
//       setError('Format file tidak didukung. Gunakan PNG atau JPG.');
//       return;
//     }
//     if (selectedFile.size > 10 * 1024 * 1024) {
//       setError('Ukuran file terlalu besar. Maksimal 10MB.');
//       return;
//     }
//     setFile(selectedFile);
//     setError('');
//     setResult(null);
//   };

//   const handleFileSelect = (e) => {
//     if (e.target.files && e.target.files[0]) {
//       handleFile(e.target.files[0]);
//     }
//   };

//   const handleVerify = async (e) => {
//     e.preventDefault();
//     if (!file) {
//       setError('Harap pilih file sertifikat!');
//       return;
//     }

//     setLoading(true);
//     setError('');

//     try {
//       const formData = new FormData();
//       formData.append('file', file);

//       const response = await fetch('http://localhost:8000/api/verify', {
//         method: 'POST',
//         body: formData
//       });

//       const data = await response.json();
//       setResult(data);
//     } catch (err) {
//       setError('Gagal terhubung ke server saat proses verifikasi. Silakan coba lagi.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetForm = () => {
//     setFile(null);
//     setResult(null);
//     setError('');
//   };

//   const handleBack = () => {
//     if (window.history.length > 1) {
//       window.history.back();
//     } else {
//       window.location.href = '/';
//     }
//   };

//   // 🎨 COLOR PALETTE - Modern & Accessible
//   const COLOR = {
//     // Primary brand colors
//     primary: '#0d6efd',
//     primaryDark: '#0a58ca',
    
//     // Success states - Enhanced green palette
//     success: {
//       base: '#198754',
//       light: '#20c997',
//       dark: '#146c43',
//       gradient: 'linear-gradient(135deg, #198754 0%, #20c997 100%)',
//       bgSoft: 'rgba(25, 135, 84, 0.1)',
//       border: 'rgba(25, 135, 84, 0.3)',
//       icon: '#ffffff',
//       iconGlow: '0 0 20px rgba(32, 201, 151, 0.4)'
//     },
    
//     // Warning states
//     warning: {
//       base: '#ffc107',
//       dark: '#e0a800',
//       bgSoft: 'rgba(255, 193, 7, 0.15)',
//       border: 'rgba(255, 193, 7, 0.4)',
//       icon: '#1f2937',
//       text: '#1f2937'
//     },
    
//     // Danger/Revoked states
//     danger: {
//       base: '#dc3545',
//       light: '#e4606d',
//       dark: '#b02a37',
//       gradient: 'linear-gradient(135deg, #dc3545 0%, #bb2d3b 100%)',
//       bgSoft: 'rgba(220, 53, 69, 0.1)',
//       border: 'rgba(220, 53, 69, 0.3)',
//       icon: '#ffffff',
//       iconGlow: '0 0 20px rgba(235, 87, 87, 0.4)'
//     },
    
//     // Neutral
//     gray: {
//       100: '#f8f9fa',
//       200: '#e9ecef',
//       400: '#adb5bd',
//       600: '#6c757d',
//       800: '#343a40',
//       900: '#212529'
//     },
    
//     white: '#ffffff',
//     cardShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
//     cardShadowHover: '0 8px 30px rgba(0, 0, 0, 0.12)'
//   };

//   const getStatusConfig = () => {
//     if (!result) return null;
    
//     const { valid, registered, revoked } = result;
    
//     if (revoked) {
//       return {
//         icon: Ban,
//         bgGradient: COLOR.danger.gradient,
//         bgClass: 'bg-danger',
//         textClass: 'text-white',
//         borderClass: 'border-danger',
//         badgeClass: 'bg-white text-danger',
//         badgeBorder: 'border border-danger',
//         title: 'SERTIFIKAT DICABUT',
//         subtitle: 'Tidak berlaku lagi',
//         description: result.message || 'Sertifikat ini telah dicabut oleh penerbit',
//         iconColor: COLOR.danger.icon,
//         iconGlow: COLOR.danger.iconGlow,
//         isRevoked: true,
//         statusColor: COLOR.danger
//       };
//     }
    
//     if (valid && registered) {
//       return {
//         icon: ShieldCheck,
//         bgGradient: COLOR.success.gradient,
//         bgClass: 'bg-success',
//         textClass: 'text-white',
//         borderClass: 'border-success',
//         badgeClass: 'bg-white text-success',
//         badgeBorder: 'border border-success',
//         title: 'Sertifikat VALID',
//         subtitle: 'Terverifikasi dalam sistem',
//         description: result.message,
//         iconColor: COLOR.success.icon,
//         iconGlow: COLOR.success.iconGlow,
//         isRevoked: false,
//         statusColor: COLOR.success
//       };
//     }
    
//     if (valid && !registered) {
//       return {
//         icon: ShieldAlert,
//         bgGradient: `linear-gradient(135deg, ${COLOR.warning.base} 0%, ${COLOR.warning.dark} 100%)`,
//         bgClass: 'bg-warning',
//         textClass: 'text-dark',
//         borderClass: 'border-warning',
//         badgeClass: 'bg-dark text-warning',
//         badgeBorder: 'border border-warning',
//         title: 'Sertifikat Valid',
//         subtitle: 'Namun tidak terdaftar',
//         description: result.message,
//         iconColor: COLOR.warning.icon,
//         iconGlow: 'none',
//         isRevoked: false,
//         statusColor: COLOR.warning
//       };
//     }
    
//     return {
//       icon: FileX,
//       bgGradient: COLOR.danger.gradient,
//       bgClass: 'bg-danger',
//       textClass: 'text-white',
//       borderClass: 'border-danger',
//       badgeClass: 'bg-white text-danger',
//       badgeBorder: 'border border-danger',
//       title: 'Sertifikat TIDAK VALID',
//       subtitle: 'Verifikasi gagal dilakukan',
//       description: result.message,
//       iconColor: COLOR.danger.icon,
//       iconGlow: COLOR.danger.iconGlow,
//       isRevoked: false,
//       statusColor: COLOR.danger
//     };
//   };

//   const statusConfig = getStatusConfig();

//   // Helper component for status indicator chips
//   const StatusChip = ({ valid, label, isRevokedCheck = false }) => {
//     const isValid = isRevokedCheck ? !valid : valid;
//     const colors = isValid ? COLOR.success : COLOR.danger;
    
//     return (
//       <div 
//         className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-2 border"
//         style={{
//           backgroundColor: COLOR.white,
//           borderColor: colors.border,
//           boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
//           transition: 'transform 0.2s ease, box-shadow 0.2s ease'
//         }}
//         onMouseEnter={(e) => {
//           e.currentTarget.style.transform = 'translateY(-2px)';
//           e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
//         }}
//         onMouseLeave={(e) => {
//           e.currentTarget.style.transform = 'translateY(0)';
//           e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
//         }}
//       >
//         <div className="d-flex align-items-center gap-3">
//           <div 
//             className="rounded-circle d-flex align-items-center justify-content-center"
//             style={{
//               width: '36px', 
//               height: '36px',
//               backgroundColor: colors.bgSoft,
//               color: colors.base,
//               transition: 'all 0.2s ease'
//             }}
//           >
//             {isValid ? <CheckCircle size={18} /> : <XCircle size={18} />}
//           </div>
//           <span className="text-dark small fw-bold">{label}</span>
//         </div>
//         {isValid ? (
//           <span 
//             className="badge px-3 py-2 fw-medium d-flex align-items-center gap-1"
//             style={{
//               backgroundColor: colors.bgSoft,
//               color: colors.dark,
//               border: `1px solid ${colors.border}`
//             }}
//           >
//             <CheckCircle size={14} /> Valid
//           </span>
//         ) : (
//           <span 
//             className="badge px-3 py-2 fw-medium d-flex align-items-center gap-1"
//             style={{
//               backgroundColor: COLOR.danger.bgSoft,
//               color: COLOR.danger.dark,
//               border: `1px solid ${COLOR.danger.border}`
//             }}
//           >
//             <XCircle size={14} /> 
//             {isRevokedCheck ? 'DICABUT' : 'Tidak Valid'}
//           </span>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="min-vh-100 bg-light py-4 py-md-5" style={{background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)'}}>
//       <div className="container py-3 py-md-4">
        
//         {/* Back Button */}
//         <div className="mb-4">
//           <button 
//             onClick={handleBack}
//             className="btn btn-link text-decoration-none text-secondary d-inline-flex align-items-center gap-2 p-0 hover-primary transition-all"
//             style={{transition: 'color 0.2s ease'}}
//             onMouseEnter={(e) => e.currentTarget.style.color = COLOR.primary}
//             onMouseLeave={(e) => e.currentTarget.style.color = COLOR.gray[600]}
//           >
//             <ArrowLeft color={COLOR.gray[600]} size={18} />
//             <span className="small fw-medium">Kembali</span>
//           </button>
//         </div>

//         {/* Header Section */}
//         <div className="text-center mb-5">
//           <div 
//             className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill mb-3 border"
//             style={{
//               background: COLOR.white,
//               boxShadow: COLOR.cardShadow,
//               borderColor: COLOR.gray[200]
//             }}
//           >
//             <Shield color={COLOR.primary} size={18} />
//             <span className="fw-bold text-dark small">Verifikasi Digital</span>
//           </div>
//           <h1 className="display-5 fw-bold text-dark mb-3">Verifikasi Sertifikat</h1>
//           <p className="text-muted fs-6 mx-auto" style={{maxWidth: '600px'}}>
//             Validasi keaslian sertifikat menggunakan <span className="fw-bold" style={{color: COLOR.primary}}>EdDSA</span> dan <span className="fw-bold" style={{color: COLOR.primary}}>OCR</span>
//           </p>
//         </div>

//         {!result ? (
//           /* Upload Section */
//           <div 
//             className="card border-0 shadow-sm"
//             style={{
//               boxShadow: COLOR.cardShadow,
//               borderRadius: '1rem',
//               overflow: 'hidden'
//             }}
//           >
//             <div className="card-body p-4 p-md-5">
              
//               {/* Dropzone */}
//               <div
//                 onDragEnter={handleDrag}
//                 onDragLeave={handleDrag}
//                 onDragOver={handleDrag}
//                 onDrop={handleDrop}
//                 onClick={() => document.getElementById('file-input').click()}
//                 className={`border-2 border-dashed rounded-4 p-5 text-center cursor-pointer transition-all ${
//                   dragActive 
//                     ? 'border-primary bg-primary bg-opacity-10' 
//                     : file 
//                       ? 'border-success bg-success bg-opacity-10' 
//                       : 'border-secondary-subtle'
//                 }`}
//                 style={{
//                   minHeight: '240px',
//                   transition: 'all 0.3s ease',
//                   cursor: 'pointer'
//                 }}
//                 onMouseEnter={(e) => {
//                   if (!dragActive && !file) {
//                     e.currentTarget.style.borderColor = COLOR.primary;
//                     e.currentTarget.style.backgroundColor = 'rgba(13, 110, 253, 0.05)';
//                   }
//                 }}
//                 onMouseLeave={(e) => {
//                   if (!dragActive && !file) {
//                     e.currentTarget.style.borderColor = '';
//                     e.currentTarget.style.backgroundColor = '';
//                   }
//                 }}
//               >
//                 <input 
//                   id="file-input" 
//                   type="file" 
//                   className="d-none" 
//                   accept=".png,.jpg,.jpeg" 
//                   onChange={handleFileSelect} 
//                 />
                
//                 <div className="mb-4">
//                   <div 
//                     className={`rounded-circle d-inline-flex align-items-center justify-content-center transition-all ${
//                       file ? 'bg-success text-white' : 'text-primary border'
//                     }`} 
//                     style={{
//                       width: '80px', 
//                       height: '80px',
//                       backgroundColor: file ? COLOR.success.base : COLOR.gray[100],
//                       borderColor: file ? COLOR.success.border : COLOR.gray[200],
//                       boxShadow: file ? COLOR.success.iconGlow : 'none',
//                       transition: 'all 0.3s ease'
//                     }}
//                   >
//                     {file ? <FileCheck color={COLOR.white} size={36} /> : <Upload color={COLOR.primary} size={36} />}
//                   </div>
//                 </div>
                
//                 {file ? (
//                   <div>
//                     <p className="text-dark fw-bold mb-1 fs-5">{file.name}</p>
//                     <p className="text-muted small mb-3">{(file.size / 1024).toFixed(1)} KB</p>
//                     <div className="d-flex justify-content-center gap-2">
//                       <button 
//                         onClick={(e) => { e.stopPropagation(); resetForm(); }} 
//                         className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
//                       >
//                         <XCircle size={14} /> Ganti
//                       </button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div>
//                     <p className="text-dark fw-bold mb-2 fs-4">Seret file ke sini</p>
//                     <p className="text-muted mb-4">atau klik untuk memilih file</p>
//                     <div className="d-flex justify-content-center gap-2 flex-wrap">
//                       <span className="badge px-3 py-2" style={{background: COLOR.gray[100], color: COLOR.gray[800], border: `1px solid ${COLOR.gray[200]}`}}>PNG</span>
//                       <span className="badge px-3 py-2" style={{background: COLOR.gray[100], color: COLOR.gray[800], border: `1px solid ${COLOR.gray[200]}`}}>JPG</span>
//                       <span className="badge px-3 py-2" style={{background: COLOR.gray[100], color: COLOR.gray[600], border: `1px solid ${COLOR.gray[200]}`}}>Max 10MB</span>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Error Alert */}
//               {error && (
//                 <div 
//                   className="alert d-flex align-items-center gap-3 mt-4 border-0"
//                   role="alert"
//                   style={{
//                     backgroundColor: COLOR.danger.bgSoft,
//                     color: COLOR.danger.dark,
//                     border: `1px solid ${COLOR.danger.border}`,
//                     borderRadius: '0.75rem'
//                   }}
//                 >
//                   <AlertCircle color={COLOR.danger.base} size={18} />
//                   <span className="small fw-bold">{error}</span>
//                   <button 
//                     className="btn-close ms-auto" 
//                     onClick={() => setError('')} 
//                     aria-label="Close"
//                     style={{filter: 'none', opacity: 0.7}}
//                   />
//                 </div>
//               )}

//               {/* Verify Button */}
//               <button
//                 onClick={handleVerify}
//                 disabled={!file || loading}
//                 className={`btn w-100 mt-4 py-3 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2 transition-all ${
//                   !file || loading ? 'btn-secondary disabled' : ''
//                 }`}
//                 style={{
//                   backgroundColor: (!file || loading) ? COLOR.gray[400] : COLOR.primary,
//                   borderColor: (!file || loading) ? COLOR.gray[400] : COLOR.primary,
//                   boxShadow: (!file || loading) ? 'none' : `0 4px 14px rgba(13, 110, 253, 0.35)`,
//                   transition: 'all 0.2s ease'
//                 }}
//                 onMouseEnter={(e) => {
//                   if (file && !loading) {
//                     e.currentTarget.style.backgroundColor = COLOR.primaryDark;
//                     e.currentTarget.style.boxShadow = '0 6px 20px rgba(13, 110, 253, 0.5)';
//                   }
//                 }}
//                 onMouseLeave={(e) => {
//                   if (file && !loading) {
//                     e.currentTarget.style.backgroundColor = COLOR.primary;
//                     e.currentTarget.style.boxShadow = `0 4px 14px rgba(13, 110, 253, 0.35)`;
//                   }
//                 }}
//               >
//                 {loading ? (
//                   <>
//                     <span className="spinner-border spinner-border-sm" role="status" />
//                     <span>Memverifikasi...</span>
//                   </>
//                 ) : (
//                   <>
//                     <Shield color={COLOR.white} size={20} />
//                     <span>Verifikasi Sekarang</span>
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         ) : (
//           /* Result Section */
//           <div className="row g-4">
            
//             {/* Status Card - Enhanced with gradient & glow */}
//             <div className="col-lg-5">
//               <div 
//                 className="card h-100 border-0 shadow-sm"
//                 style={{
//                   background: statusConfig?.bgGradient,
//                   borderRadius: '1rem',
//                   boxShadow: statusConfig?.isRevoked 
//                     ? '0 8px 30px rgba(220, 53, 69, 0.3)' 
//                     : statusConfig?.bgClass === 'bg-warning'
//                       ? '0 8px 30px rgba(255, 193, 7, 0.25)'
//                       : '0 8px 30px rgba(25, 135, 84, 0.3)'
//                 }}
//               >
//                 <div className="card-body d-flex flex-column align-items-center justify-content-center p-4 p-md-5 text-center">
                  
//                   {/* Status Icon with Glow Effect */}
//                   <div 
//                     className="rounded-circle d-flex align-items-center justify-content-center mb-4"
//                     style={{
//                       width: '90px', 
//                       height: '90px',
//                       background: `rgba(255,255,255,0.15)`,
//                       backdropFilter: 'blur(10px)',
//                       border: '1px solid rgba(255,255,255,0.3)',
//                       boxShadow: statusConfig?.iconGlow,
//                       transition: 'transform 0.3s ease'
//                     }}
//                   >
//                     {statusConfig && <statusConfig.icon color={statusConfig.iconColor} size={45} style={{filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'}} />}
//                   </div>
                  
//                   {statusConfig?.isRevoked && (
//                     <span 
//                       className="badge px-3 py-2 mb-3 fw-bold d-flex align-items-center gap-1"
//                       style={{
//                         background: COLOR.white,
//                         color: COLOR.danger.base,
//                         border: `2px solid ${COLOR.danger.base}`,
//                         boxShadow: '0 2px 10px rgba(220, 53, 69, 0.2)'
//                       }}
//                     >
//                       <Ban color={COLOR.danger.base} size={14} />
//                       DICABUT
//                     </span>
//                   )}
                  
//                   <h2 className={`h3 fw-bold mb-1 ${statusConfig?.textClass}`} style={{textShadow: '0 2px 4px rgba(0,0,0,0.15)'}}>
//                     {statusConfig?.title}
//                   </h2>
//                   <p className={`fw-medium mb-3 ${statusConfig?.isRevoked ? 'text-white-50' : statusConfig?.bgClass === 'bg-warning' ? 'text-dark' : 'text-white-50'}`}>
//                     {statusConfig?.subtitle}
//                   </p>
                  
//                   <span 
//                     className={`badge px-4 py-2 fw-medium small ${statusConfig?.badgeClass}`}
//                     style={{
//                       border: statusConfig?.badgeBorder,
//                       boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
//                     }}
//                   >
//                     {statusConfig?.description}
//                   </span>

//                   {/* Status Indicators */}
//                   <div className="w-100 mt-4">
//                     <StatusChip valid={result.integrity?.hash_match} label="Integritas Data" />
//                     <StatusChip valid={result.integrity?.signature_valid} label="Tanda Tangan Digital" />
//                     <StatusChip valid={result?.registered} label="Status Registrasi" />
//                     <StatusChip valid={!result?.revoked} label="Status Pencabutan" isRevokedCheck={true} />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Detail Card */}
//             <div className="col-lg-7">
//               <div 
//                 className="card border-0 shadow-sm h-100"
//                 style={{
//                   borderRadius: '1rem',
//                   boxShadow: COLOR.cardShadow,
//                   background: COLOR.white
//                 }}
//               >
//                 <div className="card-body p-4 p-md-5">
                  
//                   {result?.revoked && (
//                     <div 
//                       className="alert border-0 rounded-3 mb-4 d-flex align-items-center gap-3"
//                       style={{
//                         background: COLOR.danger.gradient,
//                         boxShadow: '0 4px 20px rgba(220, 53, 69, 0.25)'
//                       }}
//                     >
//                       <Ban color={COLOR.white} size={24} style={{filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'}} />
//                       <div>
//                         <h4 className="fw-bold mb-1 text-white">Sertifikat Tidak Berlaku</h4>
//                         <p className="mb-0 small text-white-75">
//                           Sertifikat ini telah dicabut dan tidak dapat digunakan.
//                         </p>
//                       </div>
//                     </div>
//                   )}

//                   {/* Card Header */}
//                   <div className="d-flex align-items-center gap-3 mb-4 pb-4 border-bottom" style={{borderColor: COLOR.gray[200]}}>
//                     <div 
//                       className={`rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm ${
//                         result?.revoked ? 'bg-danger' : ''
//                       }`}
//                       style={{
//                         width: '48px', 
//                         height: '48px',
//                         background: result?.revoked ? COLOR.danger.gradient : `linear-gradient(135deg, ${COLOR.primary} 0%, ${COLOR.primaryDark} 100%)`,
//                         boxShadow: result?.revoked 
//                           ? '0 4px 14px rgba(220, 53, 69, 0.3)' 
//                           : '0 4px 14px rgba(13, 110, 253, 0.3)'
//                       }}
//                     >
//                       {result?.revoked ? <Ban color={COLOR.white} size={24} /> : <Award color={COLOR.white} size={24} />}
//                     </div>
//                     <div>
//                       <h3 className="h5 fw-bold text-dark mb-0">
//                         {result?.revoked ? 'Detail Sertifikat (Dicabut)' : 'Detail Sertifikat'}
//                       </h3>
//                     </div>
//                   </div>

//                   {/* Certificate Details */}
//                   {result.registered ? (
//                     <div className="row g-3">
//                       {[
//                         { label: 'ID Sertifikat', value: result.certificate?.id, icon: Hash, mono: true },
//                         { label: 'Nama Penerima', value: result.certificate?.recipient_name || result.certificate?.participant, icon: User },
//                         { label: 'Judul Sertifikat', value: result.certificate?.title || result.certificate?.course_name, icon: Award },
//                         { label: 'Institusi', value: result.certificate?.institution, icon: Building2 },
//                         { 
//                           label: 'Tanggal Terbit', 
//                           value: result.certificate?.issued_date 
//                             ? new Date(result.certificate.issued_date).toLocaleDateString('id-ID', {
//                                 day: 'numeric', month: 'long', year: 'numeric'
//                               })
//                             : '-',
//                           icon: Calendar 
//                         }
//                       ].map((data, i) => (
//                         <div key={i} className="col-12 col-sm-6">
//                           <div 
//                             className="p-3 rounded-3 border h-100 transition-all"
//                             style={{
//                               background: COLOR.gray[100],
//                               borderColor: COLOR.gray[200],
//                               transition: 'all 0.2s ease'
//                             }}
//                             onMouseEnter={(e) => {
//                               e.currentTarget.style.borderColor = COLOR.primary;
//                               e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 110, 253, 0.15)';
//                             }}
//                             onMouseLeave={(e) => {
//                               e.currentTarget.style.borderColor = COLOR.gray[200];
//                               e.currentTarget.style.boxShadow = 'none';
//                             }}
//                           >
//                             <div className="d-flex align-items-center gap-2 mb-2">
//                               <data.icon color={COLOR.primary} size={16} />
//                               <p className="text-muted small fw-bold text-uppercase mb-0" style={{fontSize: '0.7rem', letterSpacing: '0.5px'}}>
//                                 {data.label}
//                               </p>
//                             </div>
//                             <p className={`fw-bold text-dark mb-0 ${data.mono ? 'font-monospace' : ''} ${result?.revoked ? 'text-decoration-line-through text-muted' : ''}`} 
//                                style={{fontSize: data.mono ? '0.85rem' : '1rem', lineHeight: 1.4}}>
//                               {data.value || <span className="text-muted fst-italic">-</span>}
//                             </p>
//                           </div>
//                         </div>
//                       ))}
                      
//                       {/* Revoked Date */}
//                       {result?.revoked && result.certificate?.revoked_at && (
//                         <div className="col-12">
//                           <div 
//                             className="p-3 rounded-3 border h-100"
//                             style={{
//                               background: COLOR.danger.bgSoft, 
//                               borderColor: COLOR.danger.border
//                             }}
//                           >
//                             <div className="d-flex align-items-center gap-2 mb-2">
//                               <Ban color={COLOR.danger.base} size={16} />
//                               <p className="text-danger small fw-bold text-uppercase mb-0" style={{fontSize: '0.7rem', letterSpacing: '0.5px'}}>
//                                 Tanggal Dicabut
//                               </p>
//                             </div>
//                             <p className="fw-bold text-danger mb-0">
//                               {new Date(result.certificate.revoked_at).toLocaleDateString('id-ID', {
//                                 day: 'numeric', month: 'long', year: 'numeric'
//                               })}
//                             </p>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   ) : (
//                     /* Not Registered */
//                     <div className="text-center py-4">
//                       <div 
//                         className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
//                         style={{
//                           width: '64px', 
//                           height: '64px',
//                           background: COLOR.warning.bgSoft,
//                           border: `2px solid ${COLOR.warning.border}`
//                         }}
//                       >
//                         <Database color={COLOR.warning.icon} size={32} />
//                       </div>
//                       <h4 className="h6 fw-bold text-dark mb-2">Sertifikat Tidak Terdaftar</h4>
//                       <p className="text-muted small">
//                         Tanda tangan digital valid, tetapi tidak ditemukan dalam database.
//                       </p>
//                     </div>
//                   )}

//                   {/* Reset Button */}
//                   <button 
//                     onClick={resetForm} 
//                     className={`btn w-100 mt-4 py-3 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2 transition-all ${
//                       result?.revoked ? 'btn-danger' : 'btn-dark'
//                     }`}
//                     style={{
//                       boxShadow: result?.revoked 
//                         ? '0 4px 14px rgba(220, 53, 69, 0.3)' 
//                         : '0 4px 14px rgba(33, 37, 41, 0.25)',
//                       transition: 'all 0.2s ease'
//                     }}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.style.transform = 'translateY(-2px)';
//                       e.currentTarget.style.boxShadow = result?.revoked 
//                         ? '0 6px 20px rgba(220, 53, 69, 0.45)' 
//                         : '0 6px 20px rgba(33, 37, 41, 0.35)';
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.transform = 'translateY(0)';
//                       e.currentTarget.style.boxShadow = result?.revoked 
//                         ? '0 4px 14px rgba(220, 53, 69, 0.3)' 
//                         : '0 4px 14px rgba(33, 37, 41, 0.25)';
//                     }}
//                   >
//                     <RefreshCw color={COLOR.white} size={18} />
//                     Verifikasi Sertifikat Lain
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Footer */}
//         <div className="text-center mt-5 pt-4">
//           <p className="text-muted small mb-0">
//             © Mikroskil {new Date().getFullYear()}
//           </p>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default PublicVerify;