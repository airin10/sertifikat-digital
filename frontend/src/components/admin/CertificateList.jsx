import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminHeader from '../shared/AppHeader';
import { adminApi } from '../../services/api';  
import { Link } from 'react-router-dom';
import { 
  FileText, Trash2, Eye, Loader2, 
  Search, Filter, CheckCircle, XCircle,
  Plus, AlertCircle
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000'; 

const CertificateList = () => {
  const { user, logout } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);  
  const [filter, setFilter] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [confirmRevoke, setConfirmRevoke] = useState({ show: false, certificateId: null });
  const [revoking, setRevoking] = useState(false);  

  useEffect(() => {
    fetchCertificates();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && confirmRevoke.show && !revoking) {
        setConfirmRevoke({ show: false, certificateId: null });
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [confirmRevoke.show, revoking]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminApi.getCertificates();
      const data = response.data;
      const certArray = Array.isArray(data) ? data : (data.certificates || []);
      setCertificates(certArray);
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.detail || err.message || 'Gagal memuat data sertifikat');
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const revokeCertificate = async (certificateId) => {
    setRevoking(true);
    
    try {
      await adminApi.revokeCertificate(certificateId);
      setSuccess('Sertifikat berhasil dicabut');
      await fetchCertificates();
      setConfirmRevoke({ show: false, certificateId: null });
      
    } catch (error) {
      console.error('Gagal mencabut sertifikat:', error);
      setError(error.response?.data?.detail || 'Gagal mencabut sertifikat');
    } finally {
      setRevoking(false);
    }
  };

  const filteredCerts = certificates.filter(cert => {
    let statusMatch = true;
    if (filter === 'active') statusMatch = !cert.is_revoked;
    if (filter === 'revoked') statusMatch = cert.is_revoked;
    
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

  const stats = {
    total: certificates.length,
    active: certificates.filter(c => !c.is_revoked).length,
    revoked: certificates.filter(c => c.is_revoked).length
  };

  const COLORS = {
    primary: '#6b21a8',
    primaryDark: '#a300c8',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    secondary: '#64748b',
    dark: '#1e293b',
    light: '#f8fafc'
  };

  return (
    <div className="min-vh-100 bg-light">
      <AdminHeader user={user} logout={logout} />
      <div className="admin-header-spacer" />

      
      {/* Header Section */}
      <div 
        style={{
          background: `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
          padding: '2.5rem 0 4rem',
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
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <div className="d-flex align-items-center gap-3 mb-2">
                <h1 className="h3 fw-bold text-white mb-0">Manajemen Sertifikat</h1>
              </div>
                <p className="text-white-50 mb-0">Mengelola semua sertifikat digital yang telah diterbitkan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container" style={{marginTop: '-2rem', position: 'relative', zIndex: 10}}>
        
        {/* Search & Filter */}
        <div className="card border-0 mb-4" style={{borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}}>
          <div className="card-body p-3">
            <div className="row g-3 align-items-center">
              <div className="col-md-6">
                <div className="position-relative">
                  <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
                  <input
                    type="text"
                    className="form-control ps-5"
                    placeholder="Cari berdasarkan judul, nama peserta, atau ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{borderRadius: '12px', border: `2px solid ${COLORS.light}`, transition: 'all 0.3s ease'}}
                    onFocus={(e) => {
                      e.target.style.borderColor = COLORS.primary;
                      e.target.style.boxShadow = `0 0 0 3px ${COLORS.primary}20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = COLORS.light;
                      e.target.style.boxShadow = 'none';
                    }}
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
              
              <div className="col-md-6">
                <div className="d-flex gap-2">
                  <Filter size={18} className="text-muted mt-1" />
                  <div className="btn-group flex-grow-1" role="group">
                    {[
                      { key: 'all', label: 'Semua', count: stats.total, color: COLORS.primary },
                      { key: 'active', label: 'Aktif', count: stats.active, color: COLORS.success },
                      { key: 'revoked', label: 'Dicabut', count: stats.revoked, color: COLORS.danger }
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`btn btn-sm btn-filter ${filter === f.key ? 'active' : ''}`}
                        style={{
                          background: filter === f.key ? f.color : 'white',
                          color: filter === f.key ? 'white' : COLORS.secondary,
                          border: `1px solid ${filter === f.key ? f.color : '#e2e8f0'}`,
                          transition: 'all 0.3s ease',
                          borderRadius: filter === f.key ? '8px' : '0',
                          fontWeight: filter === f.key ? '600' : '400'
                        }}
                      >
                        {f.label}
                        <span 
                          className="badge ms-1"
                          style={{
                            background: filter === f.key ? 'rgba(255,255,255,0.3)' : '#f1f5f9',
                            color: filter === f.key ? 'white' : COLORS.secondary
                          }}
                        >
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

        {success && (
          <div 
            className="alert alert-success alert-dismissible fade show d-flex align-items-center gap-3 mb-4" 
            role="alert"
            style={{borderRadius: '12px', border: `1px solid ${COLORS.success}30`, background: `${COLORS.success}10`}}
          >
            <CheckCircle color={COLORS.success} size={20} />
            <span className="fw-semibold" style={{color: COLORS.success}}>{success}</span>
            <button type="button" className="btn-close ms-auto" onClick={() => setSuccess(null)} />
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div 
            className="alert alert-danger alert-dismissible fade show d-flex align-items-start gap-3 mb-4" 
            role="alert"
            style={{borderRadius: '12px', border: `1px solid ${COLORS.danger}30`}}
          >
            <XCircle color={COLORS.danger} size={20} className="mt-1" />
            <div className="flex-grow-1"><span>{error}</span></div>
            <button type="button" className="btn-close" onClick={() => setError(null)} />
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="card border-0 text-center py-5" style={{borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}}>
            <Loader2 className="animate-spin mb-3" size={48} color={COLORS.primary} />
            <p className="text-muted mb-0">Memuat data sertifikat...</p>
          </div>
        ) : (
          <div className="card border-0" style={{borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden'}}>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{background: COLORS.light}}>
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
                        <code className="small px-2 py-1 rounded" style={{color: COLORS.primary, background: `${COLORS.primary}10`, fontSize: '0.8rem'}}>
                          {cert.certificate_id}
                        </code>
                      </td>
                      <td className="px-4 py-3 fw-semibold text-dark">{cert.title}</td>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="text-white rounded-circle d-flex align-items-center justify-content-center fw-semibold" 
                            style={{
                              width: '32px', height: '32px', fontSize: '0.75rem',
                              background: `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`
                            }}
                          >
                            {cert.participant_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className="small">{cert.participant_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted small">{cert.institution || '-'}</td>
                      <td className="px-4 py-3 text-muted small">
                        {cert.issued_date ? new Date(cert.issued_date).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {cert.is_revoked ? (
                          <span className="badge d-inline-flex align-items-center gap-1 px-2 py-1" style={{
                            background: `${COLORS.danger}15`, color: COLORS.danger,
                            border: `1px solid ${COLORS.danger}30`, fontSize: '0.75rem', fontWeight: '600'
                          }}>
                            <XCircle size={12} /> Dicabut
                          </span>
                        ) : (
                          <span className="badge d-inline-flex align-items-center gap-1 px-2 py-1" style={{
                            background: `${COLORS.success}15`, color: COLORS.success,
                            border: `1px solid ${COLORS.success}30`, fontSize: '0.75rem', fontWeight: '600'
                          }}>
                            <CheckCircle size={12} /> Aktif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="d-flex justify-content-center gap-1">
                          <a 
                            href={`${API_BASE_URL}/static/certificates/${cert.certificate_id}_final.png`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm"
                            title="Lihat Detail Sertifikat"
                            style={{
                              border: `1px solid ${COLORS.secondary}30`, color: COLORS.secondary,
                              borderRadius: '8px', transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = COLORS.primary;
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.borderColor = COLORS.primary;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = COLORS.secondary;
                              e.currentTarget.style.borderColor = `${COLORS.secondary}30`;
                            }}
                          >
                            <Eye size={14} />
                          </a>
                          
                          {!cert.is_revoked && (
                            <button 
                              onClick={() => setConfirmRevoke({ show: true, certificateId: cert.certificate_id })}
                              className="btn btn-sm"
                              title="Cabut Sertifikat"
                              style={{
                                border: `1px solid ${COLORS.danger}30`, color: COLORS.danger,
                                borderRadius: '8px', transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = COLORS.danger;
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.borderColor = COLORS.danger;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = COLORS.danger;
                                e.currentTarget.style.borderColor = `${COLORS.danger}30`;
                              }}
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
                <div className="d-inline-flex align-items-center justify-content-center mb-3" style={{
                  width: '64px', height: '64px', borderRadius: '16px', background: `${COLORS.primary}10`
                }}>
                  <FileText size={32} color={COLORS.primary} />
                </div>
                <h5 className="text-dark mb-2">
                  {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum terdapat sertifikat digital'}
                </h5>
                <p className="text-muted small mb-3">
                  {searchQuery 
                    ? `Tidak ditemukan sertifikat dengan kata kunci "${searchQuery}"`
                    : 'Mulai buat sertifikat untuk peserta'}
                </p>
                {!searchQuery && (
                  <Link 
                    to="/admin/certificates/create" 
                    className="btn d-inline-flex align-items-center gap-2"
                    style={{
                      background: `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                      color: 'white', borderRadius: '12px', padding: '10px 24px', fontWeight: '600'
                    }}
                  >
                    <Plus size={18} /> Buat Sertifikat
                  </Link>
                )}
              </div>
            )}
            
            {filteredCerts.length > 0 && (
              <div className="card-footer border-top py-3" style={{background: COLORS.light}}>
                <small className="text-muted">
                  Menampilkan <strong>{filteredCerts.length}</strong> dari <strong>{certificates.length}</strong> sertifikat
                  {searchQuery && ` (pencarian: "${searchQuery}")`}
                </small>
              </div>
            )}
          </div>
        )}
        <div className="admin-header-spacer" />
      </div>

      {confirmRevoke.show && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          style={{background: 'rgba(0,0,0,0.5)'}}
          onClick={() => !revoking && setConfirmRevoke({ show: false, certificateId: null })}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0" style={{
              borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden'
            }}>
              <div className="modal-header border-0 py-4" style={{
                background: `linear-gradient(135deg, ${COLORS.danger} 0%, #b91c1c 100%)`, color: 'white'
              }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center" style={{
                    width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)'
                  }}>
                    <AlertCircle size={22} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0 text-white">Konfirmasi Pencabutan Sertifikat</h5>
                    <p className="mb-0 small opacity-75">Sertifikat yang dicabut tidak akan lagi valid untuk verifikasi</p>
                  </div>
                </div>
              </div>

              <div className="modal-body p-4 text-center">
                {/* <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{
                  width: '64px', height: '64px', background: `${COLORS.danger}15`
                }}>
                  <Trash2 color={COLORS.danger} size={28} />
                </div> */}
                <p className="text-dark mb-1 fw-semibold">Apakah Anda yakin ingin mencabut sertifikat ini?</p>
              </div>

              <div className="btn py-3 px-4 justify-content-center">
                <button 
                  className="btn px-4 py-2 fw-semibold me-2"
                  onClick={() => setConfirmRevoke({ show: false, certificateId: null })}
                  disabled={revoking}
                  style={{
                    background: 'white', color: COLORS.secondary,
                    border: `2px solid #e2e8f0`, borderRadius: '10px'
                  }}
                >
                  Batal
                </button>
                <button 
                  className="btn px-4 py-2 fw-semibold"
                  onClick={() => revokeCertificate(confirmRevoke.certificateId)}
                  disabled={revoking}
                  style={{
                    background: revoking ? '#9ca3af' : `linear-gradient(135deg, ${COLORS.danger} 0%, #b91c1c 100%)`,
                    color: 'white', border: 'none', borderRadius: '10px',
                    boxShadow: revoking ? 'none' : `0 4px 12px ${COLORS.danger}40`,
                    cursor: revoking ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  {revoking ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Mencabut...</span>
                    </>
                  ) : (
                    <>
                      {/* <Trash2 size={16} /> */}
                      <span>Ya, Cabut Sertifikat</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        <div className="footer-spacer" />

    </div>
  );
};

export default CertificateList;

// import React, { useEffect, useState } from 'react';
// import { useAuth } from '../../contexts/AuthContext';
// import AdminHeader from '../shared/AppHeader';
// import { Link } from 'react-router-dom';
// import { 
//   FileText, Trash2, Eye, ArrowLeft, Loader2, 
//   Search, Filter, CheckCircle, XCircle,
//   Award, ShieldCheck, ShieldX, Plus, ChevronRight,
//   TrendingUp, Activity, AlertCircle
// } from 'lucide-react';

// const CertificateList = () => {
//   const { user, logout } = useAuth();
//   const [certificates, setCertificates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [filter, setFilter] = useState('all'); 
//   const [searchQuery, setSearchQuery] = useState(''); 
//   const [confirmRevoke, setConfirmRevoke] = useState({ show: false, certificateId: null }); // ✅ TAMBAHKAN INI

//   useEffect(() => {
//     fetchCertificates();
//   }, []);

//   const fetchCertificates = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const token = user?.token || localStorage.getItem('token');
      
//       if (!token) {
//         setError('Sesi habis. Silakan login kembali.');
//         return;
//       }
      
//       const response = await fetch('http://localhost:8000/api/admin/certificates', {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       if (response.status === 401) {
//         setError('Sesi tidak valid. Silakan login kembali.');
//         localStorage.removeItem('token');
//         return;
//       }
      
//       if (!response.ok) {
//         throw new Error(`Kesalahan server : ${response.status}`);
//       }
      
//       const data = await response.json();
//       const certArray = Array.isArray(data) ? data : (data.certificates || []);
//       setCertificates(certArray);
      
//     } catch (err) {
//       console.error('Fetch error:', err);
//       setError(err.message);
//       setCertificates([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ UBAH FUNGSI INI - HAPUS window.confirm
//   const revokeCertificate = async (certificateId) => {
//     try {
//       const response = await fetch(
//         `http://localhost:8000/api/admin/certificates/${certificateId}/revoke`, 
//         {
//           method: 'POST', 
//           headers: {
//             'Authorization': `Bearer ${user.token}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );
      
//       if (response.ok) {
//         fetchCertificates(); 
//       } else {
//         const err = await response.json();
//         setError(err.detail || 'Gagal mencabut sertifikat');
//       }
//     } catch (error) {
//       console.error('Gagal mencabut sertifikat:', error);
//       setError('Gagal mencabut sertifikat');
//     } finally {
//       setConfirmRevoke({ show: false, certificateId: null }); // ✅ Tutup modal setelah proses
//     }
//   };

//   const filteredCerts = certificates.filter(cert => {
//     let statusMatch = true;
//     if (filter === 'active') statusMatch = !cert.is_revoked;
//     if (filter === 'revoked') statusMatch = cert.is_revoked;
    
//     let searchMatch = true;
//     if (searchQuery.trim()) {
//       const query = searchQuery.toLowerCase();
//       searchMatch = (
//         cert.title?.toLowerCase().includes(query) ||
//         cert.participant_name?.toLowerCase().includes(query) ||
//         cert.certificate_id?.toLowerCase().includes(query) ||
//         cert.institution?.toLowerCase().includes(query)
//       );
//     }
    
//     return statusMatch && searchMatch;
//   });

//   const stats = {
//     total: certificates.length,
//     active: certificates.filter(c => !c.is_revoked).length,
//     revoked: certificates.filter(c => c.is_revoked).length
//   };

//   const COLORS = {
//     primary: '#6b21a8',
//     primaryDark: '#a300c8',
//     success: '#10b981',
//     danger: '#ef4444',
//     warning: '#f59e0b',
//     secondary: '#64748b',
//     dark: '#1e293b',
//     light: '#f8fafc'
//   };

//   return (
//     <div className="min-vh-100 bg-light">
//       <AdminHeader user={user} logout={logout} />
      
//       {/* ========== NEW HEADER SECTION ========== */}
//       <div 
//         style={{
//           background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
//           padding: '2.5rem 0 4rem',
//           position: 'relative',
//           overflow: 'hidden'
//         }}
//       >
//         {/* Background Pattern */}
//         <div 
//           style={{
//             position: 'absolute',
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
//                              radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
//             pointerEvents: 'none'
//           }}
//         />

//         <div className="container position-relative">
//           <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-2">
//             <div>
//               <div className="d-flex align-items-center gap-3 mb-2">
//                 <h1 className="h3 fw-bold text-white mb-0">
//                   Manajemen Sertifikat
//                 </h1>
//               </div>
//               <p className="text-white-50 mb-0">
//                 Kelola semua sertifikat digital yang telah diterbitkan
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ========== MAIN CONTENT ========== */}
//       <div className="container" style={{marginTop: '-2rem', position: 'relative', zIndex: 10}}>
        
//         {/* Search & Filter Section */}
//         <div 
//           className="card border-0 mb-4"
//           style={{
//             borderRadius: '16px',
//             boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
//           }}
//         >
//           <div className="card-body p-3">
//             <div className="row g-3 align-items-center">
//               {/* Search Input */}
//               <div className="col-md-6">
//                 <div className="position-relative">
//                   <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
//                   <input
//                     type="text"
//                     className="form-control ps-5"
//                     placeholder="Cari berdasarkan judul, nama peserta, atau ID..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     style={{
//                       borderRadius: '12px',
//                       border: `2px solid ${COLORS.light}`,
//                       transition: 'all 0.3s ease'
//                     }}
//                     onFocus={(e) => {
//                       e.target.style.borderColor = COLORS.primary;
//                       e.target.style.boxShadow = `0 0 0 3px ${COLORS.primary}20`;
//                     }}
//                     onBlur={(e) => {
//                       e.target.style.borderColor = COLORS.light;
//                       e.target.style.boxShadow = 'none';
//                     }}
//                   />
//                   {searchQuery && (
//                     <button 
//                       className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted p-0 me-3"
//                       onClick={() => setSearchQuery('')}
//                     >
//                       <XCircle size={18} />
//                     </button>
//                   )}
//                 </div>
//               </div>
              
//               {/* Filter Buttons */}
//               <div className="col-md-6">
//                 <div className="d-flex gap-2">
//                   <Filter size={18} className="text-muted mt-1" />
//                   <div className="btn-group flex-grow-1" role="group">
//                     {[
//                       { key: 'all', label: 'Semua', count: stats.total, color: COLORS.primary },
//                       { key: 'active', label: 'Aktif', count: stats.active, color: COLORS.success },
//                       { key: 'revoked', label: 'Dicabut', count: stats.revoked, color: COLORS.danger }
//                     ].map((f) => (
//                       <button
//                         key={f.key}
//                         onClick={() => setFilter(f.key)}
//                         className={`btn btn-sm btn-filter ${filter === f.key ? 'active' : ''}`}
//                         style={{
//                           background: filter === f.key ? f.color : 'white',
//                           color: filter === f.key ? 'white' : COLORS.secondary,
//                           border: `1px solid ${filter === f.key ? f.color : '#e2e8f0'}`,
//                           transition: 'all 0.3s ease',
//                           borderRadius: filter === f.key ? '8px' : '0',
//                           fontWeight: filter === f.key ? '600' : '400'
//                         }}
//                       >
//                         {f.label}
//                         <span 
//                           className="badge ms-1"
//                           style={{
//                             background: filter === f.key ? 'rgba(255,255,255,0.3)' : '#f1f5f9',
//                             color: filter === f.key ? 'white' : COLORS.secondary
//                           }}
//                         >
//                           {f.count}
//                         </span>
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Error Alert */}
//         {error && (
//           <div 
//             className="alert alert-danger alert-dismissible fade show d-flex align-items-start gap-3" 
//             role="alert"
//             style={{
//               borderRadius: '12px',
//               border: `1px solid ${COLORS.danger}30`
//             }}
//           >
//             <XCircle color={COLORS.danger} size={20} className="mt-1" />
//             <div className="flex-grow-1">
//               <span>{error}</span>
//             </div>
//             <button 
//               type="button"
//               className="btn-close" 
//               onClick={() => setError(null)}
//             />
//           </div>
//         )}

//         {/* Loading State */}
//         {loading ? (
//           <div 
//             className="card border-0 text-center py-5"
//             style={{
//               borderRadius: '16px',
//               boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
//             }}
//           >
//             <Loader2 className="animate-spin mb-3" size={48} color={COLORS.primary} />
//             <p className="text-muted mb-0">Memuat data sertifikat...</p>
//           </div>
//         ) : (
//           /* Certificate Table */
//           <div 
//             className="card border-0"
//             style={{
//               borderRadius: '16px',
//               boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
//               overflow: 'hidden'
//             }}
//           >
//             <div className="table-responsive">
//               <table className="table table-hover align-middle mb-0">
//                 <thead style={{background: COLORS.light}}>
//                   <tr>
//                     <th className="px-4 py-3 text-muted small fw-semibold">ID Sertifikat</th>
//                     <th className="px-4 py-3 text-muted small fw-semibold">Judul</th>
//                     <th className="px-4 py-3 text-muted small fw-semibold">Peserta</th>
//                     <th className="px-4 py-3 text-muted small fw-semibold">Institusi</th>
//                     <th className="px-4 py-3 text-muted small fw-semibold">Tanggal</th>
//                     <th className="px-4 py-3 text-muted small fw-semibold">Status</th>
//                     <th className="px-4 py-3 text-muted small fw-semibold text-center">Aksi</th>
//                   </tr>
//                 </thead>
//                 <tbody className="border-top">
//                   {filteredCerts.map((cert) => (
//                     <tr key={cert.id || cert.certificate_id}>
//                       <td className="px-4 py-3">
//                         <code 
//                           className="small px-2 py-1 rounded"
//                           style={{
//                             color: COLORS.primary,
//                             background: `${COLORS.primary}10`,
//                             fontSize: '0.8rem'
//                           }}
//                         >
//                           {cert.certificate_id}
//                         </code>
//                       </td>
//                       <td className="px-4 py-3 fw-semibold text-dark">
//                         {cert.title}
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="d-flex align-items-center gap-2">
//                           <div 
//                             className="text-white rounded-circle d-flex align-items-center justify-content-center fw-semibold" 
//                             style={{
//                               width: '32px',
//                               height: '32px',
//                               fontSize: '0.75rem',
//                               background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`
//                             }}
//                           >
//                             {cert.participant_name?.charAt(0).toUpperCase() || '?'}
//                           </div>
//                           <span className="small">{cert.participant_name}</span>
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 text-muted small">
//                         {cert.institution || '-'}
//                       </td>
//                       <td className="px-4 py-3 text-muted small">
//                         {cert.issued_date ? new Date(cert.issued_date).toLocaleDateString('id-ID') : '-'}
//                       </td>
//                       <td className="px-4 py-3">
//                         {cert.is_revoked ? (
//                           <span 
//                             className="badge d-inline-flex align-items-center gap-1 px-2 py-1"
//                             style={{
//                               background: `${COLORS.danger}15`,
//                               color: COLORS.danger,
//                               border: `1px solid ${COLORS.danger}30`,
//                               fontSize: '0.75rem',
//                               fontWeight: '600'
//                             }}
//                           >
//                             <XCircle size={12} />
//                             Dicabut
//                           </span>
//                         ) : (
//                           <span 
//                             className="badge d-inline-flex align-items-center gap-1 px-2 py-1"
//                             style={{
//                               background: `${COLORS.success}15`,
//                               color: COLORS.success,
//                               border: `1px solid ${COLORS.success}30`,
//                               fontSize: '0.75rem',
//                               fontWeight: '600'
//                             }}
//                           >
//                             <CheckCircle size={12} />
//                             Aktif
//                           </span>
//                         )}
//                       </td>
//                       <td className="px-4 py-3 text-center">
//                         <div className="d-flex justify-content-center gap-1">
//                           <a 
//                             href={`http://localhost:8000/static/certificates/${cert.certificate_id}_final.png`}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="btn btn-sm"
//                             title="Lihat Sertifikat"
//                             style={{
//                               border: `1px solid ${COLORS.secondary}30`,
//                               color: COLORS.secondary,
//                               borderRadius: '8px',
//                               transition: 'all 0.3s ease'
//                             }}
//                             onMouseEnter={(e) => {
//                               e.currentTarget.style.background = COLORS.primary;
//                               e.currentTarget.style.color = 'white';
//                               e.currentTarget.style.borderColor = COLORS.primary;
//                             }}
//                             onMouseLeave={(e) => {
//                               e.currentTarget.style.background = 'transparent';
//                               e.currentTarget.style.color = COLORS.secondary;
//                               e.currentTarget.style.borderColor = `${COLORS.secondary}30`;
//                             }}
//                           >
//                             <Eye size={14} />
//                           </a>
                          
//                           {/* ✅ UBAH onClick DI SINI - Buka modal, bukan langsung revoke */}
//                           {!cert.is_revoked && (
//                             <button 
//                               onClick={() => setConfirmRevoke({ show: true, certificateId: cert.certificate_id })}
//                               className="btn btn-sm"
//                               title="Cabut Sertifikat"
//                               style={{
//                                 border: `1px solid ${COLORS.danger}30`,
//                                 color: COLORS.danger,
//                                 borderRadius: '8px',
//                                 transition: 'all 0.3s ease'
//                               }}
//                               onMouseEnter={(e) => {
//                                 e.currentTarget.style.background = COLORS.danger;
//                                 e.currentTarget.style.color = 'white';
//                                 e.currentTarget.style.borderColor = COLORS.danger;
//                               }}
//                               onMouseLeave={(e) => {
//                                 e.currentTarget.style.background = 'transparent';
//                                 e.currentTarget.style.color = COLORS.danger;
//                                 e.currentTarget.style.borderColor = `${COLORS.danger}30`;
//                               }}
//                             >
//                               <Trash2 size={14} />
//                             </button>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
            
//             {/* Empty State */}
//             {filteredCerts.length === 0 && (
//               <div className="text-center py-5">
//                 <div 
//                   className="d-inline-flex align-items-center justify-content-center mb-3"
//                   style={{
//                     width: '64px',
//                     height: '64px',
//                     borderRadius: '16px',
//                     background: `${COLORS.primary}10`
//                   }}
//                 >
//                   <FileText className="text-muted" size={32} color={COLORS.primary} />
//                 </div>
//                 <h5 className="text-dark mb-2">
//                   {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada sertifikat'}
//                 </h5>
//                 <p className="text-muted small mb-3">
//                   {searchQuery 
//                     ? `Tidak ditemukan sertifikat dengan kata kunci "${searchQuery}"`
//                     : 'Mulai buat sertifikat untuk peserta'}
//                 </p>
//                 {!searchQuery && (
//                   <Link 
//                     to="/admin/certificates/create" 
//                     className="btn d-inline-flex align-items-center gap-2"
//                     style={{
//                       background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
//                       color: 'white',
//                       borderRadius: '12px',
//                       padding: '10px 24px',
//                       fontWeight: '600'
//                     }}
//                   >
//                     <Plus size={18} />
//                     Buat Sertifikat Pertama
//                   </Link>
//                 )}
//               </div>
//             )}
            
//             {/* Showing Results */}
//             {filteredCerts.length > 0 && (
//               <div 
//                 className="card-footer border-top py-3"
//                 style={{background: COLORS.light}}
//               >
//                 <small className="text-muted">
//                   Menampilkan <strong>{filteredCerts.length}</strong> dari <strong>{certificates.length}</strong> sertifikat
//                   {searchQuery && ` (filter: "${searchQuery}")`}
//                 </small>
//               </div>
//             )}
//           </div>
//         )}
//         <div className="footer-spacer" />
//       </div>

//       {/* ========== MODAL KONFIRMASI CABUT SERTIFIKAT ========== */}
//       {confirmRevoke.show && (
//         <div className="modal fade show d-block" tabIndex="-1" style={{background: 'rgba(0,0,0,0.5)'}}>
//           <div className="modal-dialog modal-dialog-centered">
//             <div 
//               className="modal-content border-0"
//               style={{
//                 borderRadius: '20px',
//                 boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
//                 overflow: 'hidden'
//               }}
//             >
//               {/* Header */}
//               <div 
//                 className="modal-header border-0 py-4"
//                 style={{
//                   background: `linear-gradient(135deg, ${COLORS.danger} 0%, #b91c1c 100%)`,
//                   color: 'white'
//                 }}
//               >
//                 <div className="d-flex align-items-center gap-3">
//                   <div 
//                     className="d-flex align-items-center justify-content-center"
//                     style={{
//                       width: '44px',
//                       height: '44px',
//                       borderRadius: '12px',
//                       background: 'rgba(255,255,255,0.2)'
//                     }}
//                   >
//                     <AlertCircle size={22} />
//                   </div>
//                   <div>
//                     <h5 className="modal-title fw-bold mb-0 text-white">Cabut Sertifikat</h5>
//                     <p className="mb-0 small opacity-75">Tindakan ini tidak dapat dibatalkan</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Body */}
//               <div className="modal-body p-4 text-center">
//                 <div 
//                   className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
//                   style={{
//                     width: '64px',
//                     height: '64px',
//                     background: `${COLORS.danger}15`
//                   }}
//                 >
//                   <Trash2 color={COLORS.danger} size={28} />
//                 </div>
//                 <p className="text-dark mb-1 fw-semibold">
//                   Apakah Anda yakin ingin mencabut sertifikat ini?
//                 </p>
//                 <p className="text-muted small mb-0">
//                   Sertifikat yang dicabut tidak akan lagi valid untuk verifikasi.
//                 </p>
//               </div>

//               {/* Footer */}
//               <div className="modal-footer border-top py-3 px-4 justify-content-center">
//                 <button 
//                   className="btn px-4 py-2 fw-semibold me-2"
//                   onClick={() => setConfirmRevoke({ show: false, certificateId: null })}
//                   style={{
//                     background: 'white',
//                     color: COLORS.secondary,
//                     border: `2px solid #e2e8f0`,
//                     borderRadius: '10px'
//                   }}
//                 >
//                   Batal
//                 </button>
//                 <button 
//                   className="btn px-4 py-2 fw-semibold"
//                   onClick={() => revokeCertificate(confirmRevoke.certificateId)}
//                   style={{
//                     background: `linear-gradient(135deg, ${COLORS.danger} 0%, #b91c1c 100%)`,
//                     color: 'white',
//                     border: 'none',
//                     borderRadius: '10px',
//                     boxShadow: `0 4px 12px ${COLORS.danger}40`
//                   }}
//                 >
//                   Ya, Cabut Sertifikat
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CertificateList;

// import React, { useEffect, useState } from 'react';
// import { useAuth } from '../../contexts/AuthContext';
// import { Link } from 'react-router-dom';
// import { 
//   FileText, Trash2, Eye, ArrowLeft, Loader2, 
//   Search, Filter, CheckCircle, XCircle 
// } from 'lucide-react';

// const CertificateList = () => {
//   const { user } = useAuth();
//   const [certificates, setCertificates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [filter, setFilter] = useState('all'); 
//   const [searchQuery, setSearchQuery] = useState(''); 

//   useEffect(() => {
//     fetchCertificates();
//   }, []);

//   const fetchCertificates = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const token = user?.token || localStorage.getItem('token');
      
//       if (!token) {
//         setError('Sesi habis. Silakan login kembali.');
//         return;
//       }
      
//       const response = await fetch('http://localhost:8000/api/admin/certificates', {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       if (response.status === 401) {
//         setError('Sesi tidak valid. Silakan login kembali.');
//         localStorage.removeItem('token');
//         return;
//       }
      
//       if (!response.ok) {
//         throw new Error(`Kesalahan server : ${response.status}`);
//       }
      
//       const data = await response.json();
//       const certArray = Array.isArray(data) ? data : (data.certificates || []);
//       setCertificates(certArray);
      
//     } catch (err) {
//       console.error('Fetch error:', err);
//       setError(err.message);
//       setCertificates([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const revokeCertificate = async (certificateId) => {
//     if (!window.confirm('Yakin ingin mencabut sertifikat ini?')) return;
    
//     try {
//       const response = await fetch(
//         `http://localhost:8000/api/admin/certificates/${certificateId}/revoke`, 
//         {
//           method: 'POST', 
//           headers: {
//             'Authorization': `Bearer ${user.token}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );
      
//       if (response.ok) {
//         fetchCertificates(); 
//       } else {
//         const err = await response.json();
//         setError(err.detail || 'Gagal mencabut sertifikat');
//       }
//     } catch (error) {
//       console.error('Gagal mencabut sertifikat:', error);
//       setError('Gagal mencabut sertifikat');
//     }
//   };

//   // Filter logic: Search + Status
//   const filteredCerts = certificates.filter(cert => {
//     // Filter by status
//     let statusMatch = true;
//     if (filter === 'active') statusMatch = !cert.is_revoked;
//     if (filter === 'revoked') statusMatch = cert.is_revoked;
    
//     // Filter by search query
//     let searchMatch = true;
//     if (searchQuery.trim()) {
//       const query = searchQuery.toLowerCase();
//       searchMatch = (
//         cert.title?.toLowerCase().includes(query) ||
//         cert.participant_name?.toLowerCase().includes(query) ||
//         cert.certificate_id?.toLowerCase().includes(query) ||
//         cert.institution?.toLowerCase().includes(query)
//       );
//     }
    
//     return statusMatch && searchMatch;
//   });

//   // Stats
//   const stats = {
//     total: certificates.length,
//     active: certificates.filter(c => !c.is_revoked).length,
//     revoked: certificates.filter(c => c.is_revoked).length
//   };

//   return (
//     // <div className="min-vh-100 bg-light py-4 py-md-5">
//       <div className="container py-3 py-md-4">
//         {/* Back Button */}
//         <div className="mb-4">
//           <Link 
//             to="/admin/dashboard" 
//             className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
//           >
//             <ArrowLeft size={14} />
//             <span>Kembali ke Dashboard</span>
//           </Link>
//         </div>

//         {/* Header */}
//         <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
//           <div>
//             <h1 className="h4 fw-bold text-dark mb-1">Daftar Sertifikat</h1>
//             <p className="text-muted small mb-0">
//               Total: {stats.total} | 
//               <span className="text-success"> Aktif: {stats.active}</span> | 
//               <span className="text-danger"> Dicabut: {stats.revoked}</span>
//             </p>
//           </div>
          
//           <Link 
//             to="/admin/certificates/create"
//             className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
//           >
//             <CheckCircle size={16} />
//             Buat Sertifikat
//           </Link>
//         </div>

//         {/* Search & Filter Section */}
//         <div className="card border-0 shadow-sm mb-4">
//           <div className="card-body p-3">
//             <div className="row g-3 align-items-center">
//               {/* Search Input */}
//               <div className="col-md-6">
//                 <div className="position-relative">
//                   <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
//                   <input
//                     type="text"
//                     className="form-control ps-5"
//                     placeholder="Cari berdasarkan judul, nama peserta, atau ID..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                   />
//                   {searchQuery && (
//                     <button 
//                       className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted p-0 me-3"
//                       onClick={() => setSearchQuery('')}
//                     >
//                       <XCircle size={18} />
//                     </button>
//                   )}
//                 </div>
//               </div>
              
//               {/* Filter Buttons */}
//               <div className="col-md-6">
//                 <div className="d-flex gap-2">
//                   <Filter size={18} className="text-muted mt-1" />
//                   <div className="btn-group flex-grow-1" role="group">
//                     {[
//                       { key: 'all', label: 'Semua', count: stats.total },
//                       { key: 'active', label: 'Aktif', count: stats.active },
//                       { key: 'revoked', label: 'Dicabut', count: stats.revoked }
//                     ].map((f) => (
//                       <button
//                         key={f.key}
//                         onClick={() => setFilter(f.key)}
//                         className={`btn btn-sm position-relative ${
//                           filter === f.key 
//                             ? 'btn-primary' 
//                             : 'btn-outline-secondary'
//                         }`}
//                       >
//                         {f.label}
//                         <span className={`badge ms-1 ${filter === f.key ? 'bg-white text-primaey' : 'bg-secondary'}`}>
//                           {f.count}
//                         </span>
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Error Alert */}
//         {error && (
//           <div className="alert alert-danger alert-dismissible fade show" role="alert">
//             <span>{error}</span>
//             <button 
//               type="button"
//               className="btn-close" 
//               onClick={() => setError(null)}
//             />
//           </div>
//         )}

//         {/* Loading State */}
//         {loading ? (
//           <div className="text-center py-5">
//             <Loader2 className="animate-spin text-primary mb-3" size={48} />
//             <p className="text-muted">Memuat data sertifikat...</p>
//           </div>
//         ) : (
//           /* Certificate Table */
//           <div className="card border-0 shadow-sm">
//             <div className="table-responsive">
//               <table className="table table-hover align-middle mb-0">
//                 <thead className="table-light">
//                   <tr>
//                     <th className="px-4 py-3 text-muted small fw-semibold">ID Sertifikat</th>
//                     <th className="px-4 py-3 text-muted small fw-semibold">Judul</th>
//                     <th className="px-4 py-3 text-muted small fw-semibold">Peserta</th>
//                     <th className="px-4 py-3 text-muted small fw-semibold">Institusi</th>
//                     <th className="px-4 py-3 text-muted small fw-semibold">Tanggal</th>
//                     <th className="px-4 py-3 text-muted small fw-semibold">Status</th>
//                     <th className="px-4 py-3 text-muted small fw-semibold text-center">Aksi</th>
//                   </tr>
//                 </thead>
//                 <tbody className="border-top">
//                   {filteredCerts.map((cert) => (
//                     <tr key={cert.id || cert.certificate_id}>
//                       <td className="px-4 py-3">
//                         <code className="small text-primary bg-light px-2 py-1 rounded">
//                           {cert.certificate_id}
//                         </code>
//                       </td>
//                       <td className="px-4 py-3 fw-semibold text-dark">
//                         {cert.title}
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="d-flex align-items-center gap-2">
//                           <div className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center" 
//                                style={{width: '32px', height: '32px', fontSize: '0.75rem'}}>
//                             {cert.participant_name?.charAt(0).toUpperCase() || '?'}
//                           </div>
//                           <span className="small">{cert.participant_name}</span>
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 text-muted small">
//                         {cert.institution || '-'}
//                       </td>
//                       <td className="px-4 py-3 text-muted small">
//                         {cert.issued_date ? new Date(cert.issued_date).toLocaleDateString('id-ID') : '-'}
//                       </td>
//                       <td className="px-4 py-3">
//                         {cert.is_revoked ? (
//                           <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">
//                             <XCircle size={12} className="me-1" />
//                             Dicabut
//                           </span>
//                         ) : (
//                           <span className="badge bg-success bg-opacity-10 text-success border border-success">
//                             <CheckCircle size={12} className="me-1" />
//                             Aktif
//                           </span>
//                         )}
//                       </td>
//                       <td className="px-4 py-3 text-center">
//                         <div className="d-flex justify-content-center gap-1">
//                           <a 
//                             href={`http://localhost:8000/static/certificates/${cert.certificate_id}_final.png`}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="btn btn-sm btn-outline-secondary"
//                             title="Unduh"
//                           >
//                             <Eye size ={14} />
//                           </a>
                          
//                           {!cert.is_revoked && (
//                             <button 
//                               onClick={() => revokeCertificate(cert.certificate_id)}
//                               className="btn btn-sm btn-outline-danger"
//                               title="Cabut Sertifikat"
//                             >
//                               <Trash2 size={14} />
//                             </button>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
            
//             {/* Empty State */}
//             {filteredCerts.length === 0 && (
//               <div className="text-center py-5">
//                 <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
//                      style={{width: '80px', height: '80px'}}>
//                   <FileText className="text-muted" size={32} />
//                 </div>
//                 <h5 className="text-muted mb-2">
//                   {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada sertifikat'}
//                 </h5>
//                 <p className="text-muted small mb-3">
//                   {searchQuery 
//                     ? `Tidak ditemukan sertifikat dengan kata kunci "${searchQuery}"`
//                     : 'Mulai buat sertifikat untuk peserta'}
//                 </p>
//                 {!searchQuery && (
//                   <Link to="/admin/certificates/create" className="btn btn-primary">
//                     Buat Sertifikat Pertama
//                   </Link>
//                 )}
//               </div>
//             )}
            
//             {/* Showing Results */}
//             {filteredCerts.length > 0 && (
//               <div className="card-footer bg-white border-top py-3">
//                 <small className="text-muted">
//                   Menampilkan {filteredCerts.length} dari {certificates.length} sertifikat
//                   {searchQuery && ` (filter: "${searchQuery}")`}
//                 </small>
//               </div>
//             )}
//           </div>
//         )}

//       </div>
//     // </div>
//   );
// };

// export default CertificateList;