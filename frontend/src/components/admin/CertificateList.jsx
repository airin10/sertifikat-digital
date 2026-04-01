import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  FileText, Trash2, Eye, ArrowLeft, Loader2, 
  Search, Filter, CheckCircle, XCircle 
} from 'lucide-react';

const CertificateList = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState(''); 

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
        throw new Error(`Kesalahan server : ${response.status}`);
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
    if (!window.confirm('Yakin ingin mencabut sertifikat ini?')) return;
    
    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/certificates/${certificateId}/revoke`, 
        {
          method: 'POST', 
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        fetchCertificates(); 
      } else {
        const err = await response.json();
        setError(err.detail || 'Gagal mencabut sertifikat');
      }
    } catch (error) {
      console.error('Gagal mencabut sertifikat:', error);
      setError('Gagal mencabut sertifikat');
    }
  };

  // Filter logic: Search + Status
  const filteredCerts = certificates.filter(cert => {
    // Filter by status
    let statusMatch = true;
    if (filter === 'active') statusMatch = !cert.is_revoked;
    if (filter === 'revoked') statusMatch = cert.is_revoked;
    
    // Filter by search query
    let searchMatch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      searchMatch = (
        cert.title?.toLowerCase().includes(query) ||
        cert.participant_name?.toLowerCase().includes(query) ||
        cert.certificate_id?.toLowerCase().includes(query) ||
        cert.institution?.toLowerCase().includes(query)
      );
    }
    
    return statusMatch && searchMatch;
  });

  // Stats
  const stats = {
    total: certificates.length,
    active: certificates.filter(c => !c.is_revoked).length,
    revoked: certificates.filter(c => c.is_revoked).length
  };

  return (
    <div className="min-vh-100 bg-light py-4 py-md-5">
      <div className="container py-3 py-md-4">
        
        {/* Back Button */}
        <div className="mb-4">
          <Link 
            to="/admin/dashboard" 
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>

        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <div>
            <h1 className="h4 fw-bold text-dark mb-1">Daftar Sertifikat</h1>
            <p className="text-muted small mb-0">
              Total: {stats.total} | 
              <span className="text-success"> Aktif: {stats.active}</span> | 
              <span className="text-danger"> Dicabut: {stats.revoked}</span>
            </p>
          </div>
          
          <Link 
            to="/admin/certificates/create"
            className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
          >
            <CheckCircle size={16} />
            Buat Sertifikat
          </Link>
        </div>

        {/* Search & Filter Section */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-3">
            <div className="row g-3 align-items-center">
              {/* Search Input */}
              <div className="col-md-6">
                <div className="position-relative">
                  <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
                  <input
                    type="text"
                    className="form-control ps-5"
                    placeholder="Cari berdasarkan judul, nama peserta, atau ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button 
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted p-0 me-3"
                      onClick={() => setSearchQuery('')}
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Filter Buttons */}
              <div className="col-md-6">
                <div className="d-flex gap-2">
                  <Filter size={18} className="text-muted mt-1" />
                  <div className="btn-group flex-grow-1" role="group">
                    {[
                      { key: 'all', label: 'Semua', count: stats.total },
                      { key: 'active', label: 'Aktif', count: stats.active },
                      { key: 'revoked', label: 'Dicabut', count: stats.revoked }
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`btn btn-sm position-relative ${
                          filter === f.key 
                            ? 'btn-primary' 
                            : 'btn-outline-secondary'
                        }`}
                      >
                        {f.label}
                        <span className={`badge ms-1 ${filter === f.key ? 'bg-white text-primary' : 'bg-secondary'}`}>
                          {f.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <span>{error}</span>
            <button 
              type="button"
              className="btn-close" 
              onClick={() => setError(null)}
            />
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-5">
            <Loader2 className="animate-spin text-primary mb-3" size={48} />
            <p className="text-muted">Memuat data sertifikat...</p>
          </div>
        ) : (
          /* Certificate Table */
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-4 py-3 text-muted small fw-semibold">ID Sertifikat</th>
                    <th className="px-4 py-3 text-muted small fw-semibold">Judul</th>
                    <th className="px-4 py-3 text-muted small fw-semibold">Peserta</th>
                    <th className="px-4 py-3 text-muted small fw-semibold">Institusi</th>
                    <th className="px-4 py-3 text-muted small fw-semibold">Tanggal</th>
                    <th className="px-4 py-3 text-muted small fw-semibold">Status</th>
                    <th className="px-4 py-3 text-muted small fw-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="border-top">
                  {filteredCerts.map((cert) => (
                    <tr key={cert.id || cert.certificate_id}>
                      <td className="px-4 py-3">
                        <code className="small text-primary bg-light px-2 py-1 rounded">
                          {cert.certificate_id}
                        </code>
                      </td>
                      <td className="px-4 py-3 fw-semibold text-dark">
                        {cert.title}
                      </td>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center" 
                               style={{width: '32px', height: '32px', fontSize: '0.75rem'}}>
                            {cert.participant_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className="small">{cert.participant_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted small">
                        {cert.institution || '-'}
                      </td>
                      <td className="px-4 py-3 text-muted small">
                        {cert.issued_date ? new Date(cert.issued_date).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {cert.is_revoked ? (
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">
                            <XCircle size={12} className="me-1" />
                            Dicabut
                          </span>
                        ) : (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success">
                            <CheckCircle size={12} className="me-1" />
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="d-flex justify-content-center gap-1">
                          <a 
                            href={`http://localhost:8000/static/certificates/${cert.certificate_id}_final.png`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-secondary"
                            title="Unduh"
                          >
                            <Eye size ={14} />
                          </a>
                          
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
                     style={{width: '80px', height: '80px'}}>
                  <FileText className="text-muted" size={32} />
                </div>
                <h5 className="text-muted mb-2">
                  {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada sertifikat'}
                </h5>
                <p className="text-muted small mb-3">
                  {searchQuery 
                    ? `Tidak ditemukan sertifikat dengan kata kunci "${searchQuery}"`
                    : 'Mulai buat sertifikat untuk peserta'}
                </p>
                {!searchQuery && (
                  <Link to="/admin/certificates/create" className="btn btn-primary">
                    Buat Sertifikat Pertama
                  </Link>
                )}
              </div>
            )}
            
            {/* Showing Results */}
            {filteredCerts.length > 0 && (
              <div className="card-footer bg-white border-top py-3">
                <small className="text-muted">
                  Menampilkan {filteredCerts.length} dari {certificates.length} sertifikat
                  {searchQuery && ` (filter: "${searchQuery}")`}
                </small>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default CertificateList;