import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FileText, Download, LogOut, User, Eye, 
  AlertCircle, CheckCircle, Calendar, Building, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { participantApi } from '../../services/api';

const ParticipantDashboard = () => {
  const { user, logout } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await participantApi.getMyCertificates();
      setCertificates(response.data);
    } catch (error) {
      console.error('Gagal memuat sertifikat:', error);
      setError('Gagal memuat sertifikat. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (certificateId) => {
    try {
      setDownloadingId(certificateId);
      const response = await participantApi.downloadCertificate(certificateId);
      
      const blob = new Blob([response.data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${certificateId}_sertifikat.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Gagal mengunduh sertifikat:', error);
      alert('Gagal mengunduh sertifikat. Periksa koneksi Anda atau coba lagi nanti.');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  // ✅ Helper: Warna icon yang KONTRAS dan selalu terlihat
  const ICON = {
    primary: '#0d6efd',      // Biru Bootstrap
    success: '#198754',      // Hijau Bootstrap
    danger: '#dc3545',       // Merah Bootstrap
    secondary: '#495057',    // Abu GELAP (bukan #6c757d yang terlalu terang)
    dark: '#212529',         // Hitam Bootstrap
    white: '#ffffff'
  };

  // ✅ Helper: Background rgba untuk opacity
  const BG = (hex, opacity = 0.1) => {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return (
    <div className="min-vh-100 bg-light">
      
      {/* Header */}
      <header className="bg-white border-bottom shadow-sm sticky-top">
        <div className="container px-4 py-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <button 
              onClick={handleBack}
              className="btn btn-link text-decoration-none p-0 d-lg-none"
              style={{color: ICON.secondary}}
            >
              <ArrowLeft color={ICON.secondary} size={20} />
            </button>
            <div className="bg-success rounded-3 d-flex align-items-center justify-content-center shadow-sm" 
                 style={{width: '40px', height: '40px'}}>
              <User color={ICON.white} size={20} />
            </div>
            <div>
              <h1 className="h6 fw-bold text-dark mb-0">Sertifikat Saya</h1>
              <p className="text-muted small mb-0">Selamat datang, {user?.full_name}</p>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            <span className="badge d-none d-sm-flex align-items-center gap-2 px-3 py-2" 
                  style={{backgroundColor: BG('#198754'), color: ICON.success, border: '1px solid rgba(25,135,84,0.25)'}}>
              <User color={ICON.success} size={14} /> Peserta
            </span>
            <button
              onClick={logout}
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2"
            >
              <LogOut color={ICON.danger} size={16} />
              <span className="d-none d-sm-inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-4 py-md-5">
        
        {/* Stats Overview */}
        <div className="row g-4 mb-5">
          <div className="col-12 col-sm-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted small mb-1">Total Sertifikat</p>
                    <p className="h4 fw-bold text-dark mb-0">{certificates.length}</p>
                  </div>
                  <div className="rounded-3 d-flex align-items-center justify-content-center" 
                       style={{width: '48px', height: '48px', backgroundColor: BG('#0d6efd')}}>
                    <FileText color={ICON.primary} size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-12 col-sm-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted small mb-1">Aktif</p>
                    <p className="h4 fw-bold text-success mb-0">
                      {certificates.filter(c => !c.is_revoked).length}
                    </p>
                  </div>
                  <div className="rounded-3 d-flex align-items-center justify-content-center" 
                       style={{width: '48px', height: '48px', backgroundColor: BG('#198754')}}>
                    <CheckCircle color={ICON.success} size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-12 col-sm-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted small mb-1">Dicabut</p>
                    <p className="h4 fw-bold text-danger mb-0">
                      {certificates.filter(c => c.is_revoked).length}
                    </p>
                  </div>
                  <div className="rounded-3 d-flex align-items-center justify-content-center" 
                       style={{width: '48px', height: '48px', backgroundColor: BG('#dc3545')}}>
                    <AlertCircle color={ICON.danger} size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Certificates Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Memuat...</span>
            </div>
            <p className="text-muted">Memuat sertifikat...</p>
          </div>
        ) : error ? (
          <div className="text-center py-5">
            <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                 style={{width: '64px', height: '64px', backgroundColor: BG('#dc3545')}}>
              <AlertCircle color={ICON.danger} size={32} />
            </div>
            <h3 className="h5 fw-bold text-dark mb-2">Terjadi Kesalahan</h3>
            <p className="text-muted mb-4">{error}</p>
            <button 
              onClick={fetchCertificates}
              className="btn btn-primary px-4"
            >
              Coba Lagi
            </button>
          </div>
        ) : certificates.length === 0 ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center p-5">
              <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4" 
                   style={{width: '80px', height: '80px'}}>
                <FileText color={ICON.secondary} size={40} />
              </div>
              <h3 className="h5 fw-bold text-dark mb-2">Belum Ada Sertifikat</h3>
              <p className="text-muted mb-4">
                Anda belum memiliki sertifikat yang terdaftar dalam sistem. 
                Silakan hubungi administrator untuk informasi lebih lanjut.
              </p>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {certificates.map((cert) => (
              <div className="col-12 col-md-6 col-lg-4" key={cert.id}>
                <div className={`card h-100 border-0 shadow-sm ${
                  cert.is_revoked ? 'opacity-75' : ''
                }`} style={{borderLeft: `4px solid ${cert.is_revoked ? ICON.danger : ICON.primary}`}}>
                  <div className="card-body p-4">
                    
                    {/* Card Header */}
                    <div className="d-flex align-items-start justify-content-between mb-3">
                      <div className="rounded-3 d-flex align-items-center justify-content-center" 
                           style={{width: '48px', height: '48px', backgroundColor: cert.is_revoked ? BG('#dc3545') : BG('#0d6efd')}}>
                        <FileText color={cert.is_revoked ? ICON.danger : ICON.primary} size={24} />
                      </div>
                      
                      {cert.is_revoked ? (
                        <span className="badge px-3 py-2" 
                              style={{backgroundColor: BG('#dc3545'), color: ICON.danger, border: '1px solid rgba(220,53,69,0.25)'}}>
                          <AlertCircle color={ICON.danger} size={12} className="me-1" /> Dicabut
                        </span>
                      ) : (
                        <span className="badge px-3 py-2" 
                              style={{backgroundColor: BG('#198754'), color: ICON.success, border: '1px solid rgba(25,135,84,0.25)'}}>
                          <CheckCircle color={ICON.success} size={12} className="me-1" /> Aktif
                        </span>
                      )}
                    </div>
                    
                    {/* Title */}
                    <h3 className="h6 fw-bold text-dark mb-3" style={{minHeight: '48px'}}>
                      {cert.title}
                    </h3>
                    
                    {/* Details */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                        <Building color={ICON.secondary} size={14} />
                        <span className="text-dark">{cert.institution || '-'}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2 text-muted small">
                        <Calendar color={ICON.secondary} size={14} />
                        <span className="text-dark">{formatDate(cert.issued_date)}</span>
                      </div>
                    </div>
                    
                    {/* Certificate ID */}
                    <div className="p-3 bg-light rounded-3 mb-4">
                      <p className="text-muted small mb-1">ID Sertifikat</p>
                      <p className="text-dark small font-monospace mb-0 text-break">
                        {cert.certificate_id}
                      </p>
                    </div>
                    
                    {/* Actions - ✅ FIXED: Eye icon visibility */}
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => downloadCertificate(cert.certificate_id)}
                        disabled={cert.is_revoked || downloadingId === cert.certificate_id}
                        className={`btn flex-grow-1 d-flex align-items-center justify-content-center gap-2 ${
                          cert.is_revoked 
                            ? 'btn-secondary disabled' 
                            : downloadingId === cert.certificate_id
                              ? 'btn-primary disabled'
                              : 'btn-primary'
                        }`}
                      >
                        {downloadingId === cert.certificate_id ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" />
                            <small>Mengunduh...</small>
                          </>
                        ) : (
                          <>
                            <Download color={ICON.white} size={16} />
                            <small>Unduh</small>
                          </>
                        )}
                      </button>
                      
                      {/* ✅ FIX: Eye button dengan warna yang KONTRAS */}
                      <Link
                        to={`/participant/certificates/${cert.certificate_id}`}
                        className="btn btn-outline-primary view-btn"
                        title="Lihat detail sertifikat"
                        style={{
                          borderColor: ICON.primary,
                          color: ICON.primary,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = ICON.primary;
                          e.currentTarget.style.color = ICON.white;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = ICON.primary;
                        }}
                      >
                        <Eye color={ICON.primary} size={16} 
                             style={{transition: 'color 0.2s ease'}}
                             onMouseEnter={(e) => e.currentTarget.setAttribute('color', ICON.white)}
                             onMouseLeave={(e) => e.currentTarget.setAttribute('color', ICON.primary)}
                        />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ParticipantDashboard;