import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FileText, Trash2, Eye, ArrowLeft, Loader2 } from 'lucide-react';

const CertificateList = () => {
  const { user, logout } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = user?.token || localStorage.getItem('token');
      
      if (!token) {
        setError('Sesi habis. Silakan login kembali.');
        return;
      }
      
      const response = await fetch('http://localhost:8000/api/admin/certificates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        setError('Sesi tidak valid. Silakan login kembali.');
        localStorage.removeItem('token');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      const certArray = Array.isArray(data) ? data : (data.certificates || []);
      setCertificates(certArray);
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const revokeCertificate = async (certificateId) => {
    // ✅ FIX: Hanya lanjut jika user klik "OK" (confirm returns true)
    if (!window.confirm('Yakin ingin mencabut sertifikat ini?')) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/admin/certificates/${certificateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        fetchCertificates();
      }
    } catch (error) {
      console.error('Failed to revoke certificate:', error);
      setError('Gagal mencabut sertifikat');
    }
  };

  const filteredCerts = certificates.filter(cert => {
    if (filter === 'active') return !cert.is_revoked;
    if (filter === 'revoked') return cert.is_revoked;
    return true;
  });

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/admin/dashboard';
    }
  };

  return (
    <div className="min-vh-100 bg-light py-4 py-md-5">
      <div className="container py-3 py-md-4">
        
        {/* Back Button */}
        <div className="mb-4">
          <button 
            onClick={handleBack}
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>Kembali</span>
          </button>
        </div>

        {/* Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
          <div>
            <h1 className="h4 fw-bold text-dark mb-1">Daftar Sertifikat</h1>
            <p className="text-muted small mb-0">Kelola semua sertifikat dalam sistem</p>
          </div>
          
          {/* Filter Buttons */}
          <div className="btn-group" role="group">
            {['all', 'active', 'revoked'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`btn btn-sm ${
                  filter === f 
                    ? 'btn-primary' 
                    : 'btn-outline-secondary'
                }`}
              >
                {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Dicabut'}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
            <span className="fw-bold">❌</span>
            <span className="small">{error}</span>
            <button 
              className="btn-close ms-auto" 
              onClick={() => setError(null)}
              aria-label="Close"
            />
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Memuat data sertifikat...</p>
          </div>
        ) : (
          /* Certificate Table */
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 py-3 text-muted small fw-semibold">ID</th>
                    <th className="px-4 py-3 text-muted small fw-semibold">Judul</th>
                    <th className="px-4 py-3 text-muted small fw-semibold">Participant</th>
                    <th className="px-4 py-3 text-muted small fw-semibold">Tanggal</th>
                    <th className="px-4 py-3 text-muted small fw-semibold">Status</th>
                    <th className="px-4 py-3 text-muted small fw-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="border-top">
                  {filteredCerts.map((cert) => (
                    <tr key={cert.id} className="align-middle">
                      <td className="px-4 py-3">
                        <code className="small text-dark bg-light px-2 py-1 rounded">
                          {cert.certificate_id?.substring(0, 12)}...
                        </code>
                      </td>
                      <td className="px-4 py-3 fw-semibold text-dark">
                        {cert.title}
                      </td>
                      <td className="px-4 py-3 text-muted small">
                        {cert.participant_name}
                      </td>
                      <td className="px-4 py-3 text-muted small">
                        {new Date(cert.issued_date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        {cert.is_revoked ? (
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle">
                            Dicabut
                          </span>
                        ) : (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle">
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="d-flex gap-1">
                          <button 
                            className="btn btn-sm btn-outline-secondary"
                            title="Lihat Detail"
                          >
                            <Eye size={14} />
                          </button>
                          {!cert.is_revoked && (
                            <button 
                              onClick={() => revokeCertificate(cert.certificate_id)}
                              className="btn btn-sm btn-outline-danger"
                              title="Cabut Sertifikat"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Empty State */}
            {filteredCerts.length === 0 && (
              <div className="text-center py-5">
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                     style={{width: '64px', height: '64px'}}>
                  <FileText className="text-muted" size={28} />
                </div>
                <p className="text-muted mb-0">
                  {error ? 'Terjadi kesalahan memuat data' : 'Tidak ada sertifikat'}
                </p>
                <small className="text-muted">
                  {filter !== 'all' && `Filter: ${filter === 'active' ? 'Aktif' : 'Dicabut'}`}
                </small>
              </div>
            )}
          </div>
        )}

        {/* Debug Info (Opsional - bisa dihapus di production) */}
        {process.env.NODE_ENV === 'development' && certificates.length > 0 && (
          <details className="mt-4">
            <summary className="text-muted small cursor-pointer">🔍 Debug Data</summary>
            <pre className="bg-dark text-light p-3 rounded mt-2 small" style={{maxHeight: '200px', overflow: 'auto'}}>
              {JSON.stringify(certificates.slice(0, 3), null, 2)}
            </pre>
          </details>
        )}

      </div>
    </div>
  );
};

export default CertificateList;