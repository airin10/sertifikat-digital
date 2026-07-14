import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { participantApi } from '../../services/api';
import AppHeader from '../shared/AppHeader';  
import { 
  CheckCircle, XCircle, 
  Calendar, Building, Hash,
  ArrowLeft, Download  
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';  

const CertificateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const ICON = {
    primary: '#6b21a8',
    success: '#198754',
    danger: '#dc3545',
    secondary: '#495057',
    dark: '#212529',
    white: '#ffffff'
  };

  const BG = (hex, opacity = 0.1) => {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  useEffect(() => {
    fetchCertificateDetail();
  }, [id]);

  const fetchCertificateDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await participantApi.getCertificateDetail(id);
      setCertificate(response.data);
    } catch (error) {
      console.error('Failed to fetch certificate:', error);
      if (error.response?.status === 404) {
        setError('Sertifikat tidak ditemukan');
      } else if (error.response?.status === 403) {
        setError('Anda tidak memiliki akses ke sertifikat ini');
      } else {
        setError('Gagal memuat detail sertifikat. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError(''); 
      const response = await participantApi.downloadCertificate(id);
      
      const blob = new Blob([response.data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}_sertifikat.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Gagal mengunduh sertifikat:', error);
      setError('Gagal mengunduh sertifikat. Silakan coba lagi.');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Loading State
  if (loading) {
    return (
      <>
        <AppHeader /> 
            <div className="admin-header-spacer" />

        <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
          <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Memuat...</span>
          </div>
        </div>
      </>
    );
  }

  // Error State
  if (error && !certificate) {
    return (
      <>
        <AppHeader />  
            <div className="admin-header-spacer" />

        <div className="min-vh-100 bg-light d-flex flex-column align-items-center justify-content-center p-4">
          <div className="rounded-circle d-flex align-items-center justify-content-center mb-4" 
               style={{width: '80px', height: '80px', backgroundColor: BG('#dc3545')}}>
            <XCircle color={ICON.danger} size={40} />
          </div>
          <h2 className="h5 fw-bold text-dark mb-2">{error}</h2>
          <p className="text-muted mb-4 text-center">Sertifikat mungkin telah dihapus atau Anda tidak memiliki akses.</p>
          <Link to="/participant/mycertificate" className="btn btn-primary px-4">
            Kembali
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader /> 
            <div className="admin-header-spacer" />

      <div className="min-vh-100 bg-light">
        <main className="container py-4 py-md-5">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {error && certificate && (
                <div 
                  className="alert alert-danger alert-dismissible fade show d-flex align-items-center gap-3 mb-4" 
                  role="alert"
                  style={{borderRadius: '12px', border: '1px solid #dc354530', background: '#dc354510'}}
                >
                  <XCircle color={ICON.danger} size={20} />
                  <span className="fw-semibold" style={{color: ICON.danger}}>{error}</span>
                  <button type="button" className="btn-close ms-auto" onClick={() => setError('')} />
                </div>
              )}

              {/* Status Banner */}
              {certificate.is_revoked ? (
                <div className="alert alert-danger d-flex align-items-start gap-3 mb-4" role="alert">
                  <XCircle color={ICON.danger} size={24} className="mt-1 flex-shrink-0" />
                  <div>
                    <p className="fw-semibold mb-1">Sertifikat Telah Dicabut</p>
                    <p className="small mb-0">Sertifikat ini sudah tidak berlaku dan tidak dapat digunakan untuk proses verifikasi.</p>
                  </div>
                </div>
              ) : (
                <div className="alert alert-success d-flex align-items-start gap-3 mb-4" role="alert">
                  <CheckCircle color={ICON.success} size={24} className="mt-1 flex-shrink-0" />
                  <div>
                    <p className="fw-semibold mb-1">Sertifikat Valid</p>
                    <p className="small mb-0">Sertifikat ini aktif dan dapat diverifikasi melalui kode QR.</p>
                  </div>
                </div>
              )}

              <div className="row g-4">
                {/* Left: Certificate Image */}
                <div className="col-lg-7">
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-bottom py-3">
                      <h3 className="h6 fw-bold text-dark mb-0">{certificate.title}</h3>
                    </div>
                    <div className="card-body p-4">
                      <div className="bg-light rounded-3 overflow-hidden" style={{aspectRatio: '4/3'}}>
                        <img 
                          src={`${API_BASE_URL}${certificate.download_url}`} 
                          alt={certificate.title}
                          className="w-100 h-100"
                          style={{objectFit: 'contain'}}
                          onError={(e) => {
                            e.target.src = '/placeholder-certificate.png';
                          }}
                        />
                      </div>
                      
                      {/* Download Button */}
                      <button
                        onClick={handleDownload}
                        disabled={certificate.is_revoked || downloading}
                        className="btn w-100 d-flex align-items-center justify-content-center gap-2 mt-3"
                        style={{
                          background: (certificate.is_revoked || downloading)
                            ? '#9ca3af'
                            : 'linear-gradient(150deg, #6b21a8 0%, #a300c8 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '12px',
                          fontWeight: '600',
                          cursor: (certificate.is_revoked || downloading) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {downloading ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" />
                            <span>Mengunduh...</span>
                          </>
                        ) : (
                          <>
                            <Download color={ICON.white} size={18} />
                            <span>Unduh Sertifikat</span>
                          </>
                        )}
                      </button>
                      
                      {certificate.is_revoked && (
                        <p className="text-muted small text-center mt-2 mb-0">
                          Sertifikat yang telah dicabut tidak dapat diunduh
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Details */}
                <div className="col-lg-5">
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-bottom py-3">
                      <h4 className="h6 fw-bold text-dark mb-0">Informasi Sertifikat</h4>
                    </div>
                    <div className="card-body p-4">
                      <div className="d-flex flex-column gap-3">
                        
                        <div>
                          <p className="text-muted small mb-1 d-flex align-items-center gap-2">
                            <Hash color={ICON.secondary} size={14} /> ID Sertifikat
                          </p>
                          <p className="text-dark small font-monospace mb-0 text-break" style={{fontSize: '0.8rem'}}>
                            {certificate.certificate_id}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted small mb-1 d-flex align-items-center gap-2">
                            <Building color={ICON.secondary} size={14} /> Institusi
                          </p>
                          <p className="text-dark fw-medium mb-0">{certificate.institution || '-'}</p>
                        </div>

                        <div>
                          <p className="text-muted small mb-1 d-flex align-items-center gap-2">
                            <Calendar color={ICON.secondary} size={14} /> Tanggal Diterbitkan
                          </p>
                          <p className="text-dark fw-medium mb-0">{formatDate(certificate.issued_date)}</p>
                        </div>

                        {certificate.description && (
                          <div className="pt-3 border-top">
                            <p className="text-muted small mb-2">Deskripsi</p>
                            <p className="text-dark small mb-0">{certificate.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CertificateDetail;