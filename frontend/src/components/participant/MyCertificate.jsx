import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AppHeader from '../shared/AppHeader';  
import { Download, AlertCircle, CheckCircle, Calendar, Building, Eye, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { participantApi } from '../../services/api';

const MyCertificate = () => {
  const { user, logout } = useAuth();  
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); 
  const [downloadingId, setDownloadingId] = useState(null);
  const [hoveredEye, setHoveredEye] = useState(null);  

  useEffect(() => {
    fetchCertificates();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await participantApi.getMyCertificates();
      setCertificates(response.data);
    } catch (error) {
      console.error('Gagal memuat sertifikat:', error);
      setError('Gagal memuat data sertifikat. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (certificateId) => {
    try {
      setDownloadingId(certificateId);
      setError('');
      const response = await participantApi.downloadCertificate(certificateId);
      
      const blob = new Blob([response.data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${certificateId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess(`Sertifikat ${certificateId} berhasil diunduh`);
    } catch (error) {
      console.error('Gagal mengunduh sertifikat:', error);
      setError('Gagal mengunduh sertifikat. Periksa koneksi Anda atau coba lagi nanti.');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
    <div className="min-vh-100 bg-light">
      <AppHeader />
      <div className="admin-header-spacer" />

      
      {/* Header Section */}
      <div 
        style={{
          background: `linear-gradient(150deg, #6b21a8 0%, #a300c8 100%)`,
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
          <div className="d-flex align-items-center gap-3 mb-4">
            <div>
              <h1 className="h3 fw-bold text-white mb-0">Daftar Sertifikat Digital</h1>
              <p className="text-white-50 mb-0" style={{fontSize: '0.95rem'}}>
                Daftar sertifikat digital yang telah diterbitkan dan terdaftar atas nama Anda
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-4">
              <div className="card stats-card h-100">  
                <div className="card-body p-3">
                  <div className="d-flex align-items-center gap-3">
                    <div>
                      <p className="text-muted small mb-0">Total Sertifikat</p>
                      <h3 className="h5 fw-bold text-dark mb-0">{certificates.length}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-12 col-sm-4">
              <div className="card stats-card h-100">  
                <div className="card-body p-3">
                  <div className="d-flex align-items-center gap-3">
                    <div>
                      <p className="text-muted small mb-0">Aktif</p>
                      <p className="h5 fw-bold text-success mb-0">
                        {certificates.filter(c => !c.is_revoked).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-12 col-sm-4">
              <div className="card stats-card h-100">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center gap-3">
                    <div>
                      <p className="text-muted small mb-0">Dicabut</p>
                      <p className="h5 fw-bold text-danger mb-0">
                        {certificates.filter(c => c.is_revoked).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container" style={{marginTop: '-4rem', position: 'relative', zIndex: 10}}>
        
        {success && (
          <div 
            className="alert alert-success alert-dismissible fade show d-flex align-items-center gap-3 mb-4" 
            role="alert"
            style={{borderRadius: '12px', border: '1px solid #10b98130', background: '#10b98110'}}
          >
            <CheckCircle color="#10b981" size={20} />
            <span className="fw-semibold" style={{color: '#10b981'}}>{success}</span>
            <button type="button" className="btn-close ms-auto" onClick={() => setSuccess('')} />
          </div>
        )}

        {/* Certificates Grid */}
        {loading ? (
          <div className="card border-0 text-center py-5" style={{borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}}>
            <div className="spinner-border mb-3" role="status" style={{color: '#6b21a8'}}>
              <span className="visually-hidden">Memuat...</span>
            </div>
            <p className="text-muted mb-0">Memuat data sertifikat...</p>
          </div>
        ) : error && !certificates.length ? (
          <div className="card border-0" style={{borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}}>
            <div className="card-body text-center py-5">
              <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '64px', height: '64px', background: '#dc262620'}}>
                <AlertCircle color="#dc2626" size={28} />
              </div>
              <h5 className="fw-bold text-dark mb-2">Terjadi Kesalahan</h5>
              <p className="text-muted mb-4">{error}</p>
              <button 
                onClick={fetchCertificates} 
                className="btn px-4"
                style={{background: 'linear-gradient(150deg, #6b21a8 0%, #a300c8 100%)', color: 'white', borderRadius: '10px'}}
              >
                Muat Ulang
              </button>
            </div>
          </div>
        ) : certificates.length === 0 ? (
          <div className="card border-0" style={{borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}}>
            <div className="card-body text-center py-5">
              <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '72px', height: '72px', background: '#6b21a820'}}>
                <Award color="#6b21a8" size={32} />
              </div>
              <h5 className="fw-bold text-dark mb-2">Belum Terdapat Sertifikat</h5>
              <p className="text-muted mb-0">Belum terdapat sertifikat digital yang terdaftar atas akun peserta ini</p>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div 
                className="alert alert-danger alert-dismissible fade show d-flex align-items-center gap-3 mb-4" 
                role="alert"
                style={{borderRadius: '12px', border: '1px solid #dc262630', background: '#dc262610'}}
              >
                <AlertCircle color="#dc2626" size={20} />
                <span className="fw-semibold" style={{color: '#dc2626'}}>{error}</span>
                <button type="button" className="btn-close ms-auto" onClick={() => setError('')} />
              </div>
            )}
            
            <div className="row g-4">
              {certificates.map((cert) => (
                <div className="col-12 col-md-6 col-lg-4" key={cert.id}>
                  <div 
                    className={`card h-100 border-0 ${cert.is_revoked ? 'opacity-75' : ''}`}
                    style={{
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!cert.is_revoked) {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                    }}
                  >
                    {/* Certificate Preview Header */}
                    <div 
                      className="position-relative" 
                      style={{
                        border: '1px solid #a300c8',
                        borderRadius: '16px',
                        height: '120px',
                        background: cert.is_revoked 
                          ? 'linear-gradient(160deg, #6c757d 0%, #495057 100%)'
                          : 'linear-gradient(160deg, #6b21a8, #a300c8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Award color="white" size={40} style={{opacity: 0.9}} />
                      
                      <span 
                        className={`badge position-absolute top-0 end-0 m-3 px-2 py-1 d-flex align-items-center gap-1 ${
                          cert.is_revoked ? 'bg-danger' : 'bg-success'
                        }`}
                        style={{borderRadius: '8px', fontSize: '0.75rem'}}
                      >
                        {cert.is_revoked ? (
                          <><AlertCircle size={10} /> Dicabut</>
                        ) : (
                          <><CheckCircle size={10} /> Aktif</>
                        )}
                      </span>
                    </div>
                    
                    <div className="card-body p-4">
                      <h6 className="fw-bold text-dark mb-3" style={{minHeight: '40px', lineHeight: '1.4'}}>
                        {cert.title}
                      </h6>
                      
                      <div className="mb-3">
                        <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                          <Building size={14} color="#6b21a8" />
                          <span>{cert.institution || '-'}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2 text-muted small">
                          <Calendar size={14} color="#6b21a8" />
                          <span>{formatDate(cert.issued_date)}</span>
                        </div>
                      </div>
                      
                      <div className="p-2 rounded-2 mb-3" style={{background: '#f8fafc', border: '1px solid #e2e8f0'}}>
                        <p className="text-muted mb-1" style={{fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                          ID Sertifikat
                        </p>
                        <p className="text-dark small font-monospace mb-0 text-break" style={{fontSize: '0.85rem'}}>
                          {cert.certificate_id}
                        </p>
                      </div>
                      
                      <div className="d-flex gap-2">
                        <button
                          onClick={() => downloadCertificate(cert.certificate_id)}
                          disabled={cert.is_revoked || downloadingId === cert.certificate_id}
                          className="btn flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                          style={{
                            background: (cert.is_revoked || downloadingId === cert.certificate_id)
                              ? '#9ca3af'
                              : 'linear-gradient(150deg, #6b21a8 0%, #a300c8 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: (cert.is_revoked || downloadingId === cert.certificate_id) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {downloadingId === cert.certificate_id ? (
                            <><span className="spinner-border spinner-border-sm" role="status" /><small>Mengunduh...</small></>
                          ) : (
                            <><Download size={16} /><small>Unduh Sertifikat</small></>
                          )}
                        </button>
                        
                        <Link
                          to={`/participant/certificates/${cert.certificate_id}`}
                          className="btn d-flex align-items-center justify-content-center"
                          title="Lihat detail sertifikat"
                          style={{
                            border: '2px solid #6b21a8',
                            background: hoveredEye === cert.id ? '#6b21a8' : '#ffffff',
                            color: hoveredEye === cert.id ? '#ffffff' : '#6b21a8',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={() => setHoveredEye(cert.id)}
                          onMouseLeave={() => setHoveredEye(null)}
                        >
                          <Eye size={16} color={hoveredEye === cert.id ? '#ffffff' : '#6b21a8'} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="admin-header-spacer" />
    </div>
  );
};

export default MyCertificate;

// import React, { useEffect, useState } from 'react';
// import { useAuth } from '../../contexts/AuthContext';
// import { Download, AlertCircle, CheckCircle, Calendar, Building, Eye, Award } from 'lucide-react';
// import { Link } from 'react-router-dom';
// import { participantApi } from '../../services/api';

// const MyCertificate = () => {
//   const { user } = useAuth();
//   const [certificates, setCertificates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [downloadingId, setDownloadingId] = useState(null);

//   useEffect(() => {
//     fetchCertificates();
//   }, []);

//   const fetchCertificates = async () => {
//     try {
//       setLoading(true);
//       const response = await participantApi.getMyCertificates();
//       setCertificates(response.data);
//     } catch (error) {
//       console.error('Gagal memuat sertifikat:', error);
//       setError('Gagal memuat data sertifikat. Silakan coba lagi.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const downloadCertificate = async (certificateId) => {
//     try {
//       setDownloadingId(certificateId);
//       const response = await participantApi.downloadCertificate(certificateId);
      
//       const blob = new Blob([response.data], { type: 'image/png' });
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `${certificateId}.png`;
//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);
//     } catch (error) {
//       console.error('Gagal mengunduh sertifikat:', error);
//       alert('Gagal mengunduh sertifikat. Periksa koneksi Anda atau coba lagi nanti.');
//     } finally {
//       setDownloadingId(null);
//     }
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return '-';
//     return new Date(dateString).toLocaleDateString('id-ID', {
//       year: 'numeric', month: 'long', day: 'numeric'
//     });
//   };

//   return (
//     <div className="min-vh-100 bg-light">
//       {/* ========== HEADER SECTION ========== */}
//       <div 
//         style={{
//           background: `linear-gradient(150deg, #6b21a8 0%, #a300c8 100%)`,
//           padding: '2.5rem 0 3rem',
//           position: 'relative',
//           overflow: 'hidden'
//         }}
//       >
//         {/* Background Pattern */}
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
//           {/* Title */}
//           <div className="d-flex align-items-center gap-3 mb-4">
//             <div>
//               <h1 className="h3 fw-bold text-white mb-0">
//                 Sertifikat Saya
//               </h1>
//               <p className="text-white-50 mb-0" style={{fontSize: '0.95rem'}}>
//                 Kelola dan unduh sertifikat digital Anda
//               </p>
//             </div>
//           </div>

//           {/* Stats Cards */}
//           <div className="row g-3 mb-4">
//             <div className="col-12 col-sm-4">
//               <div className="card stats-card h-100 h-100">
//                 <div className="card-body p-3">
//                   <div className="d-flex align-items-center gap-3">
//                     <div>
//                       <p className="text-muted small mb-0">Total Sertifikat</p>
//                       <h3 className="h5 fw-bold text-dark mb-0">{certificates.length}</h3>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
            
//             <div className="col-12 col-sm-4">
//           <div className="card stats-card h-100 h-100">
//             <div className="card-body p-3">
//               <div className="d-flex align-items-center gap-3">
//                 <div>
//                   <p className="text-muted small mb-0">Aktif</p>
//                   <p className="h5 fw-bold text-success mb-0">
//                     {certificates.filter(c => !c.is_revoked).length}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//             </div>
            
//             <div className="col-12 col-sm-4">
//           <div className="card stats-card h-100 h-100">
//             <div className="card-body p-3">
//               <div className="d-flex align-items-center gap-3">
//                 <div>
//                   <p className="text-muted small mb-0">Dicabut</p>
//                   <p className="h5 fw-bold text-danger mb-0">
//                     {certificates.filter(c => c.is_revoked).length}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ========== MAIN CONTENT ========== */}
//       <div className="container" style={{marginTop: '-4rem', position: 'relative', zIndex: 10}}>
//         {/* Certificates Grid */}
//         {loading ? (
//           <div 
//             className="card border-0 text-center py-5"
//             style={{
//               borderRadius: '16px',
//               boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
//             }}
//           >
//             <div className="spinner-border mb-3" role="status" style={{color: '#6b21a8'}}>
//               <span className="visually-hidden">Memuat...</span>
//             </div>
//             <p className="text-muted mb-0">Memuat data sertifikat...</p>
//           </div>
//         ) : error ? (
//           <div 
//             className="card border-0"
//             style={{
//               borderRadius: '16px',
//               boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
//             }}
//           >
//             <div className="card-body text-center py-5">
//               <div 
//                 className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
//                 style={{
//                   width: '64px',
//                   height: '64px',
//                   background: '#dc262620'
//                 }}
//               >
//                 <AlertCircle color="#dc2626" size={28} />
//               </div>
//               <h5 className="fw-bold text-dark mb-2">Terjadi Kesalahan</h5>
//               <p className="text-muted mb-4">{error}</p>
//               <button 
//                 onClick={fetchCertificates} 
//                 className="btn px-4"
//                 style={{
//                   background: 'linear-gradient(135deg, #6b21a8 0%, #a300c8 100%)',
//                   color: 'white',
//                   borderRadius: '10px'
//                 }}
//               >
//                 Muat Ulang
//               </button>
//             </div>
//           </div>
//         ) : certificates.length === 0 ? (
//           <div 
//             className="card border-0"
//             style={{
//               borderRadius: '16px',
//               boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
//             }}
//           >
//             <div className="card-body text-center py-5">
//               <div 
//                 className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
//                 style={{
//                   width: '72px',
//                   height: '72px',
//                   background: '#6b21a820'
//                 }}
//               >
//                 <Award color="#6b21a8" size={32} />
//               </div>
//               <h5 className="fw-bold text-dark mb-2">Belum Ada Sertifikat</h5>
//               <p className="text-muted mb-0">
//                 Anda belum memiliki sertifikat yang terdaftar dalam sistem.
//               </p>
//             </div>
//           </div>
//         ) : (
//           <div className="row g-4">
//             {certificates.map((cert) => (
//               <div className="col-12 col-md-6 col-lg-4" key={cert.id}>
//                 <div 
//                   className={`card h-100 border-0 ${cert.is_revoked ? 'opacity-75' : ''}`}
//                   style={{
//                     boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
//                     overflow: 'hidden',
//                     transition: 'all 0.3s ease'
//                   }}
//                   onMouseEnter={(e) => {
//                     if (!cert.is_revoked) {
//                       e.currentTarget.style.transform = 'translateY(-4px)';
//                       e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
//                     }
//                   }}
//                   onMouseLeave={(e) => {
//                     e.currentTarget.style.transform = 'translateY(0)';
//                     e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
//                   }}
//                 >
//                   {/* Certificate Preview Header */}
//                   <div 
//                     className="position-relative" 
//                     style={{
//                       border: '1px solid #a300c8',
//                       borderRadius: '16px',
//                       height: '120px',
//                       background: cert.is_revoked 
//                         ? 'linear-gradient(160deg, #6c757d 0%, #495057 100%)'
//                         : 'linear-gradient(160deg, #6b21a8, #a300c8)',
//                       display: 'flex',
//                       alignItems: 'center',
//                       justifyContent: 'center'
//                     }}
//                   >
//                     <Award color="white" size={40} style={{opacity: 0.9}} />
                    
//                     {/* Status Badge */}
//                     <span 
//                       className={`badge position-absolute top-0 end-0 m-3 px-2 py-1 d-flex align-items-center gap-1 ${
//                         cert.is_revoked ? 'bg-danger' : 'bg-success'
//                       }`}
//                       style={{borderRadius: '8px', fontSize: '0.75rem'}}
//                     >
//                       {cert.is_revoked ? (
//                         <><AlertCircle size={10} /> Dicabut</>
//                       ) : (
//                         <><CheckCircle size={10} /> Aktif</>
//                       )}
//                     </span>
//                   </div>
                  
//                   <div className="card-body p-4">
//                     <h6 className="fw-bold text-dark mb-3" style={{minHeight: '40px', lineHeight: '1.4'}}>
//                       {cert.title}
//                     </h6>
                    
//                     <div className="mb-3">
//                       <div className="d-flex align-items-center gap-2 text-muted small mb-2">
//                         <Building size={14} color="#6b21a8" />
//                         <span>{cert.institution || '-'}</span>
//                       </div>
//                       <div className="d-flex align-items-center gap-2 text-muted small">
//                         <Calendar size={14} color="#6b21a8" />
//                         <span>{formatDate(cert.issued_date)}</span>
//                       </div>
//                     </div>
                    
//                     <div 
//                       className="p-2 rounded-2 mb-3"
//                       style={{background: '#f8fafc', border: '1px solid #e2e8f0'}}
//                     >
//                       <p className="text-muted mb-1" style={{fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
//                         ID Sertifikat
//                       </p>
//                       <p className="text-dark small font-monospace mb-0 text-break" style={{fontSize: '0.85rem'}}>
//                         {cert.certificate_id}
//                       </p>
//                     </div>
                    
//                     <div className="d-flex gap-2">
//                       <button
//                         onClick={() => downloadCertificate(cert.certificate_id)}
//                         disabled={cert.is_revoked || downloadingId === cert.certificate_id}
//                         className="btn flex-grow-1 d-flex align-items-center justify-content-center gap-2"
//                         style={{
//                           background: (cert.is_revoked || downloadingId === cert.certificate_id)
//                             ? '#9ca3af'
//                             : 'linear-gradient(135deg, #6b21a8 0%, #a300c8 100%)',
//                           color: 'white',
//                           border: 'none',
//                           borderRadius: '10px',
//                           fontSize: '0.875rem',
//                           fontWeight: '600',
//                           cursor: (cert.is_revoked || downloadingId === cert.certificate_id) ? 'not-allowed' : 'pointer'
//                         }}
//                       >
//                         {downloadingId === cert.certificate_id ? (
//                           <><span className="spinner-border spinner-border-sm" role="status" /><small>Mengunduh...</small></>
//                         ) : (
//                           <><Download size={16} /><small>Unduh</small></>
//                         )}
//                       </button>
                      
//                       <Link
//                         to={`/participant/certificates/${cert.certificate_id}`}
//                         className="btn d-flex align-items-center justify-content-center"
//                         title="Lihat detail sertifikat"
//                         style={{
//                           border: '2px solid #6b21a8'
//                         }}
//                         onMouseEnter={(e) => {
//                           e.currentTarget.style.background = '#6b21a8';
//                           e.currentTarget.style.color = '#ffffff';
//                         }}
//                         onMouseLeave={(e) => {
//                           e.currentTarget.style.background = '#ffffff';
//                           e.currentTarget.style.color = '#6b21a8';
//                         }}
//                       >
//                         <Eye size={16} color={'#6b21a8'}/>
//                       </Link>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MyCertificate;

// import React, { useEffect, useState } from 'react';
// import { useAuth } from '../../contexts/AuthContext';
// import { FileText, Download, AlertCircle, CheckCircle, Calendar, Building, ArrowLeft, Eye } from 'lucide-react';
// import { Link } from 'react-router-dom';
// import { participantApi } from '../../services/api';

// const MyCertificate = () => {
//   const { user } = useAuth(); 
//   const [certificates, setCertificates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [downloadingId, setDownloadingId] = useState(null);

//   useEffect(() => {
//     fetchCertificates();
//   }, []);

//   const fetchCertificates = async () => {
//     try {
//       setLoading(true);
//       const response = await participantApi.getMyCertificates();
//       setCertificates(response.data);
//     } catch (error) {
//       console.error('Gagal memuat sertifikat:', error);
//       setError('Gagal memuat data sertifikat. Silakan coba lagi.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const downloadCertificate = async (certificateId) => {
//     try {
//       setDownloadingId(certificateId);
//       const response = await participantApi.downloadCertificate(certificateId);
      
//       const blob = new Blob([response.data], { type: 'image/png' });
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `${certificateId}_sertifikat.png`;
//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);
//     } catch (error) {
//       console.error('Gagal mengunduh sertifikat:', error);
//       alert('Gagal mengunduh sertifikat. Periksa koneksi Anda atau coba lagi nanti.');
//     } finally {
//       setDownloadingId(null);
//     }
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return '-';
//     return new Date(dateString).toLocaleDateString('id-ID', {
//       year: 'numeric', month: 'long', day: 'numeric'
//     });
//   };

//   const ICON = {
//     primary: '#0d6efd', success: '#198754', danger: '#dc3545',
//     secondary: '#495057', dark: '#212529', white: '#ffffff'
//   };

//   const BG = (hex, opacity = 0.1) => {
//     const r = parseInt(hex.slice(1,3), 16);
//     const g = parseInt(hex.slice(3,5), 16);
//     const b = parseInt(hex.slice(5,7), 16);
//     return `rgba(${r}, ${g}, ${b}, ${opacity})`;
//   };

//   return (
//     <div className="container py-4 py-md-5">
      
//       {/* Page Title (Opsional, untuk konteks halaman) */}
//       {/* <div className="d-flex align-items-center gap-3 mb-4">
//         <Link to="/" className="btn btn-outline-secondary btn-sm d-lg-none">
//           <ArrowLeft size={14} />
//         </Link>
//         <div>
//           <h1 className="h4 fw-bold text-dark mb-1">Sertifikat Saya</h1>
//           <p className="text-muted small mb-0">Kelola dan unduh sertifikat Anda</p>
//         </div>
//       </div> */}
      
//       {/* Stats Overview */}
//       <div className="row g-4 mb-5">
//         <div className="col-12 col-sm-4">
//           <div className="card border-0 shadow-sm h-100">
//             <div className="card-body p-4">
//               <div className="d-flex align-items-center justify-content-between">
//                 <div>
//                   <p className="text-muted small mb-1">Total Sertifikat</p>
//                   <p className="h4 fw-bold text-dark mb-0">{certificates.length}</p>
//                 </div>
//                 <div className="rounded-3 d-flex align-items-center justify-content-center" 
//                      style={{width: '48px', height: '48px', backgroundColor: BG('#0d6efd')}}>
//                   <FileText color={ICON.primary} size={24} />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
        
//         <div className="col-12 col-sm-4">
//           <div className="card border-0 shadow-sm h-100">
//             <div className="card-body p-4">
//               <div className="d-flex align-items-center justify-content-between">
//                 <div>
//                   <p className="text-muted small mb-1">Aktif</p>
//                   <p className="h4 fw-bold text-success mb-0">
//                     {certificates.filter(c => !c.is_revoked).length}
//                   </p>
//                 </div>
//                 <div className="rounded-3 d-flex align-items-center justify-content-center" 
//                      style={{width: '48px', height: '48px', backgroundColor: BG('#198754')}}>
//                   <CheckCircle color={ICON.success} size={24} />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
        
//         <div className="col-12 col-sm-4">
//           <div className="card border-0 shadow-sm h-100">
//             <div className="card-body p-4">
//               <div className="d-flex align-items-center justify-content-between">
//                 <div>
//                   <p className="text-muted small mb-1">Dicabut</p>
//                   <p className="h4 fw-bold text-danger mb-0">
//                     {certificates.filter(c => c.is_revoked).length}
//                   </p>
//                 </div>
//                 <div className="rounded-3 d-flex align-items-center justify-content-center" 
//                      style={{width: '48px', height: '48px', backgroundColor: BG('#dc3545')}}>
//                   <AlertCircle color={ICON.danger} size={24} />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Certificates Grid */}
//       {loading ? (
//         <div className="text-center py-5">
//           <div className="spinner-border text-primary mb-3" role="status">
//             <span className="visually-hidden">Memuat...</span>
//           </div>
//           <p className="text-muted">Memuat data sertifikat...</p>
//         </div>
//       ) : error ? (
//         <div className="text-center py-5">
//           <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
//                style={{width: '64px', height: '64px', backgroundColor: BG('#dc3545')}}>
//             <AlertCircle color={ICON.danger} size={32} />
//           </div>
//           <h3 className="h5 fw-bold text-dark mb-2">Terjadi Kesalahan</h3>
//           <p className="text-muted mb-4">{error}</p>
//           <button onClick={fetchCertificates} className="btn btn-primary px-4">Muat Ulang</button>
//         </div>
//       ) : certificates.length === 0 ? (
//         <div className="card border-0 shadow-sm">
//           <div className="card-body text-center p-5">
//             <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4" 
//                  style={{width: '80px', height: '80px'}}>
//               <FileText color={ICON.secondary} size={40} />
//             </div>
//             <h3 className="h5 fw-bold text-dark mb-2">Belum Ada Sertifikat</h3>
//             <p className="text-muted mb-4">
//               Anda belum memiliki sertifikat yang terdaftar dalam sistem. 
//               Silakan hubungi administrator untuk informasi lebih lanjut.
//             </p>
//           </div>
//         </div>
//       ) : (
//         <div className="row g-4">
//           {certificates.map((cert) => (
//             <div className="col-12 col-md-6 col-lg-4" key={cert.id}>
//               <div className={`card h-100 border-0 shadow-sm ${cert.is_revoked ? 'opacity-75' : ''}`} 
//                    style={{borderLeft: `4px solid ${cert.is_revoked ? ICON.danger : ICON.primary}`}}>
//                 <div className="card-body p-4">
                  
//                   <div className="d-flex align-items-start justify-content-between mb-3">
//                     <div className="rounded-3 d-flex align-items-center justify-content-center" 
//                          style={{width: '48px', height: '48px', backgroundColor: cert.is_revoked ? BG('#dc3545') : BG('#0d6efd')}}>
//                       <FileText color={cert.is_revoked ? ICON.danger : ICON.primary} size={24} />
//                     </div>
                    
//                     {cert.is_revoked ? (
//                       <span className="badge px-3 py-2" 
//                             style={{backgroundColor: BG('#dc3545'), color: ICON.danger, border: '1px solid rgba(220,53,69,0.25)'}}>
//                         <AlertCircle color={ICON.danger} size={12} className="me-1" /> Dicabut
//                       </span>
//                     ) : (
//                       <span className="badge px-3 py-2" 
//                             style={{backgroundColor: BG('#198754'), color: ICON.success, border: '1px solid rgba(25,135,84,0.25)'}}>
//                         <CheckCircle color={ICON.success} size={12} className="me-1" /> Aktif
//                       </span>
//                     )}
//                   </div>
                  
//                   <h3 className="h6 fw-bold text-dark mb-3" style={{minHeight: '48px'}}>{cert.title}</h3>
                  
//                   <div className="mb-3">
//                     <div className="d-flex align-items-center gap-2 text-muted small mb-2">
//                       <Building color={ICON.secondary} size={14} />
//                       <span className="text-dark">{cert.institution || '-'}</span>
//                     </div>
//                     <div className="d-flex align-items-center gap-2 text-muted small">
//                       <Calendar color={ICON.secondary} size={14} />
//                       <span className="text-dark">{formatDate(cert.issued_date)}</span>
//                     </div>
//                   </div>
                  
//                   <div className="p-3 bg-light rounded-3 mb-4">
//                     <p className="text-muted small mb-1">ID Sertifikat</p>
//                     <p className="text-dark small font-monospace mb-0 text-break">{cert.certificate_id}</p>
//                   </div>
                  
//                   <div className="d-flex gap-2">
//                     <button
//                       onClick={() => downloadCertificate(cert.certificate_id)}
//                       disabled={cert.is_revoked || downloadingId === cert.certificate_id}
//                       className={`btn flex-grow-1 d-flex align-items-center justify-content-center gap-2 ${
//                         cert.is_revoked 
//                           ? 'btn-secondary disabled' 
//                           : downloadingId === cert.certificate_id ? 'btn-primary disabled' : 'btn-primary'
//                       }`}
//                     >
//                       {downloadingId === cert.certificate_id ? (
//                         <><span className="spinner-border spinner-border-sm" role="status" /><small>Mengunduh...</small></>
//                       ) : (
//                         <><Download color={ICON.white} size={16} /><small>Unduh</small></>
//                       )}
//                     </button>
                    
//                     <Link
//                       to={`/participant/certificates/${cert.certificate_id}`}
//                       className="btn btn-outline-primary view-btn"
//                       title="Lihat detail sertifikat"
//                     >
//                       <Eye color={ICON.primary} size={16} />
//                     </Link>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
      
//       {/* Footer kecil di dalam konten */}
//       {/* <div className="text-center mt-5 pt-4 border-top">
//         <p className="text-muted small mb-0">© Mikroskil {new Date().getFullYear()}</p>
//       </div> */}
//     </div>
//   );
// };

// export default MyCertificate;