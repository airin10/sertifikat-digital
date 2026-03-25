// import React, { useEffect, useState } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import { adminApi } from '../../services/api'; // ✅ Gunakan adminApi, bukan participantApi
// import { 
//   ArrowLeft, Download, FileText, CheckCircle, XCircle, 
//   Calendar, Building, User, Hash, QrCode, Trash2, Edit, Shield
// } from 'lucide-react';

// const AdminCertificateDetail = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [certificate, setCertificate] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [downloading, setDownloading] = useState(false);
//   const [revoking, setRevoking] = useState(false);

//   useEffect(() => {
//     fetchCertificateDetail();
//   }, [id]);

//   const fetchCertificateDetail = async () => {
//     try {
//       setLoading(true);
//       // ✅ Gunakan endpoint admin
//       const response = await adminApi.getCertificateDetail(id);
//       setCertificate(response.data);
//     } catch (error) {
//       console.error('Failed to fetch certificate:', error);
//       if (error.response?.status === 404) {
//         setError('Sertifikat tidak ditemukan');
//       } else if (error.response?.status === 401) {
//         setError('Sesi tidak valid. Silakan login kembali.');
//       } else {
//         setError('Gagal memuat detail sertifikat');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDownload = async () => {
//     try {
//       setDownloading(true);
//       const response = await adminApi.downloadCertificate(id);
      
//       const blob = new Blob([response.data], { type: 'image/png' });
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `${id}_certificate.png`;
//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);
//     } catch (error) {
//       alert('Gagal mengunduh sertifikat');
//     } finally {
//       setDownloading(false);
//     }
//   };

//   const handleRevoke = async () => {
//     if (!window.confirm('Yakin ingin mencabut sertifikat ini? Tindakan ini tidak dapat dibatalkan.')) return;
    
//     try {
//       setRevoking(true);
//       await adminApi.revokeCertificate(id);
//       alert('Sertifikat berhasil dicabut');
//       fetchCertificateDetail(); // Refresh data
//     } catch (error) {
//       console.error('Failed to revoke:', error);
//       alert('Gagal mencabut sertifikat');
//     } finally {
//       setRevoking(false);
//     }
//   };

//   // ✅ Helper: Format tanggal
//   const formatDate = (dateString) => {
//     if (!dateString) return '-';
//     return new Date(dateString).toLocaleDateString('id-ID', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   // ✅ Helper: Background rgba untuk badge
//   const BG = (hex, opacity = 0.1) => {
//     const r = parseInt(hex.slice(1,3), 16);
//     const g = parseInt(hex.slice(3,5), 16);
//     const b = parseInt(hex.slice(5,7), 16);
//     return `rgba(${r}, ${g}, ${b}, ${opacity})`;
//   };

//   const ICON = {
//     primary: '#0d6efd',
//     secondary: '#6c757d',
//     success: '#198754',
//     danger: '#dc3545',
//     white: '#ffffff'
//   };

//   if (loading) {
//     return (
//       <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
//         <div className="spinner-border text-primary" role="status">
//           <span className="visually-hidden">Loading...</span>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-vh-100 bg-light d-flex flex-column align-items-center justify-content-center p-4">
//         <div className="bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-4" 
//              style={{width: '80px', height: '80px'}}>
//           <XCircle color={ICON.danger} size={40} />
//         </div>
//         <h2 className="h5 fw-bold text-dark mb-2">{error}</h2>
//         <p className="text-muted mb-4 text-center">Sertifikat mungkin telah dihapus atau Anda tidak memiliki akses.</p>
//         <Link to="/admin/dashboard" className="btn btn-primary px-4">
//           Kembali ke Dashboard
//         </Link>
//       </div>
//     );
//   }

//   return (
//     <div className="min-vh-100 bg-light">
      
//       {/* Header */}
//       <header className="bg-white border-bottom shadow-sm sticky-top">
//         <div className="container px-4 py-3">
//           <button 
//             onClick={() => navigate('/admin/certificates')}
//             className="btn btn-link text-decoration-none text-muted p-0 d-flex align-items-center gap-2"
//           >
//             <ArrowLeft color={ICON.secondary} size={18} />
//             <span>Kembali ke Daftar Sertifikat</span>
//           </button>
//         </div>
//       </header>

//       <main className="container py-4 py-md-5">
//         <div className="row justify-content-center">
//           <div className="col-lg-10">
            
//             {/* Status Banner */}
//             {certificate.is_revoked ? (
//               <div className="alert alert-danger d-flex align-items-start gap-3 mb-4" role="alert">
//                 <XCircle color={ICON.danger} size={24} className="mt-1 flex-shrink-0" />
//                 <div>
//                   <p className="fw-semibold mb-1">Sertifikat Telah Dicabut</p>
//                   <p className="small mb-0">Sertifikat ini tidak lagi valid dan tidak dapat digunakan untuk verifikasi.</p>
//                 </div>
//               </div>
//             ) : (
//               <div className="alert alert-success d-flex align-items-start gap-3 mb-4" role="alert">
//                 <CheckCircle color={ICON.success} size={24} className="mt-1 flex-shrink-0" />
//                 <div>
//                   <p className="fw-semibold mb-1">Sertifikat Valid</p>
//                   <p className="small mb-0">Sertifikat ini aktif dan dapat diverifikasi melalui QR code.</p>
//                 </div>
//               </div>
//             )}

//             <div className="row g-4">
//               {/* Left: Certificate Image */}
//               <div className="col-lg-7">
//                 <div className="card border-0 shadow-sm">
//                   <div className="card-header bg-white border-bottom py-3">
//                     <h3 className="h6 fw-bold text-dark mb-0">{certificate.title}</h3>
//                   </div>
//                   <div className="card-body p-4">
//                     <div className="bg-light rounded-3 overflow-hidden" style={{aspectRatio: '4/3'}}>
//                       <img 
//                         src={`http://localhost:8000${certificate.download_url}`}
//                         alt={certificate.title}
//                         className="w-100 h-100 object-fit-contain"
//                         style={{objectFit: 'contain'}}
//                         onError={(e) => {
//                           e.target.src = '/placeholder-certificate.png';
//                         }}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Right: Details & Actions */}
//               <div className="col-lg-5">
//                 <div className="d-flex flex-column gap-4">
                  
//                   {/* Action Buttons */}
//                   <div className="card border-0 shadow-sm">
//                     <div className="card-body p-4">
//                       <div className="d-grid gap-2">
//                         <button
//                           onClick={handleDownload}
//                           disabled={certificate.is_revoked || downloading}
//                           className={`btn d-flex align-items-center justify-content-center gap-2 ${
//                             certificate.is_revoked ? 'btn-secondary disabled' : 'btn-primary'
//                           }`}
//                         >
//                           {downloading ? (
//                             <><span className="spinner-border spinner-border-sm" role="status" /> Mengunduh...</>
//                           ) : (
//                             <><Download color="white" size={18} /> Download Sertifikat</>
//                           )}
//                         </button>
                        
//                         {!certificate.is_revoked && (
//                           <button
//                             onClick={handleRevoke}
//                             disabled={revoking}
//                             className="btn btn-outline-danger d-flex align-items-center justify-content-center gap-2"
//                           >
//                             {revoking ? (
//                               <><span className="spinner-border spinner-border-sm" role="status" /> Mencabut...</>
//                             ) : (
//                               <><Trash2 color={ICON.danger} size={18} /> Cabut Sertifikat</>
//                             )}
//                           </button>
//                         )}
//                       </div>
//                       {certificate.is_revoked && (
//                         <p className="text-muted small text-center mt-3 mb-0">
//                           Sertifikat yang dicabut tidak dapat diunduh
//                         </p>
//                       )}
//                     </div>
//                   </div>

//                   {/* Info Card */}
//                   <div className="card border-0 shadow-sm">
//                     <div className="card-header bg-white border-bottom py-3">
//                       <h4 className="h6 fw-bold text-dark mb-0">Informasi Sertifikat</h4>
//                     </div>
//                     <div className="card-body p-4">
//                       <div className="d-flex flex-column gap-3">
                        
//                         <div>
//                           <p className="text-muted small mb-1 d-flex align-items-center gap-2">
//                             <Hash color={ICON.secondary} size={14} /> Certificate ID
//                           </p>
//                           <p className="text-dark small font-monospace mb-0 text-break" style={{fontSize: '0.8rem'}}>
//                             {certificate.certificate_id}
//                           </p>
//                         </div>

//                         <div>
//                           <p className="text-muted small mb-1 d-flex align-items-center gap-2">
//                             <Building color={ICON.secondary} size={14} /> Institusi
//                           </p>
//                           <p className="text-dark fw-medium mb-0">{certificate.institution || '-'}</p>
//                         </div>

//                         <div>
//                           <p className="text-muted small mb-1 d-flex align-items-center gap-2">
//                             <Calendar color={ICON.secondary} size={14} /> Tanggal Diterbitkan
//                           </p>
//                           <p className="text-dark fw-medium mb-0">{formatDate(certificate.issued_date)}</p>
//                         </div>

//                         <div>
//                           <p className="text-muted small mb-1 d-flex align-items-center gap-2">
//                             <User color={ICON.secondary} size={14} /> Diterbitkan Untuk
//                           </p>
//                           <p className="text-dark fw-medium mb-0">{certificate.qr_payload?.participant || certificate.participant_name || '-'}</p>
//                         </div>

//                         {certificate.description && (
//                           <div className="pt-3 border-top">
//                             <p className="text-muted small mb-2">Deskripsi</p>
//                             <p className="text-dark small mb-0">{certificate.description}</p>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   {/* QR Verification Card */}
//                   <div className="card border-0 shadow-sm">
//                     <div className="card-body p-4">
//                       <div className="d-flex align-items-center gap-2 mb-3">
//                         <QrCode color={ICON.primary} size={20} />
//                         <h4 className="h6 fw-bold text-dark mb-0">Verifikasi QR</h4>
//                       </div>
//                       <p className="text-muted small mb-3">
//                         Sertifikat ini memiliki QR code yang dapat diverifikasi untuk memastikan keasliannya.
//                       </p>
//                       <Link
//                         to="/verify"
//                         className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
//                       >
//                         <Shield color={ICON.primary} size={16} /> Verifikasi Sertifikat Ini
//                       </Link>
//                     </div>
//                   </div>

//                   {/* Metadata for Admin */}
//                   <div className="card border-0 shadow-sm bg-light">
//                     <div className="card-body p-4">
//                       <h4 className="h6 fw-bold text-dark mb-3">Metadata (Admin)</h4>
//                       <div className="d-flex flex-column gap-2">
//                         <div className="d-flex justify-content-between">
//                           <span className="text-muted small">Status</span>
//                           <span className={`badge px-3 py-2 small ${
//                             certificate.is_revoked ? 'text-danger' : 'text-success'
//                           }`} style={{
//                             backgroundColor: certificate.is_revoked ? BG('#dc3545') : BG('#198754'),
//                             border: `1px solid ${certificate.is_revoked ? BG('#dc3545', 0.25) : BG('#198754', 0.25)}`
//                           }}>
//                             {certificate.is_revoked ? 'Dicabut' : 'Aktif'}
//                           </span>
//                         </div>
//                         <div className="d-flex justify-content-between">
//                           <span className="text-muted small">Dibuat</span>
//                           <span className="text-dark small">{formatDate(certificate.created_at)}</span>
//                         </div>
//                         <div className="d-flex justify-content-between">
//                           <span className="text-muted small">Terakhir Diupdate</span>
//                           <span className="text-dark small">{formatDate(certificate.updated_at)}</span>
//                         </div>
//                         <div className="d-flex justify-content-between">
//                           <span className="text-muted small">Hash</span>
//                           <span className="text-dark small font-monospace" style={{fontSize: '0.7rem'}}>
//                             {certificate.hash?.substring(0, 16)}...
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default AdminCertificateDetail;