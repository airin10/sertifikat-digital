// import React, { useEffect, useState } from 'react';
// import { useAuth } from '../../contexts/AuthContext';
// import AdminHeader from '../shared/AppHeader';
// import ImageDragDrop from '../shared/ImageDragDrop';
// import { adminApi } from '../../services/api';
// import { 
//   ArrowLeft, Download, FileText, CheckCircle, XCircle, Plus,
//   Calendar, Building, User, Hash, Loader2, ArrowLeftCircle,
//   Award, Upload, ScanLine, QrCode, ChevronRight, Sparkles, Shield
// } from 'lucide-react';
// import { Link } from 'react-router-dom';

// const CertificateCreator = () => {
//   const { user, logout } = useAuth();
  
//   const [formData, setFormData] = useState({
//     participant_id: '',
//     title: '',
//     institution: '',
//     description: '',
//     issued_date: new Date().toISOString().split('T')[0]
//   });
  
//   // ✅ State untuk algoritma
//   const [algorithm, setAlgorithm] = useState('ed25519');
  
//   const [participants, setParticipants] = useState([]);
//   const [loadingParticipants, setLoadingParticipants] = useState(false);
  
//   const [certificateImage, setCertificateImage] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);
  
//   const [selectedArea, setSelectedArea] = useState(null);
//   const [ocrResult, setOcrResult] = useState(null);
//   const [extracting, setExtracting] = useState(false);
  
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState('');
//   const [downloading, setDownloading] = useState(false);

//   const COLORS = {
//     primary: '#6b21a8',
//     primaryDark: '#a300c8',
//     success: '#10b981',
//     danger: '#dc3545',
//     secondary: '#495057',
//     dark: '#212529',
//     white: '#ffffff',
//     light: '#f8fafc'
//   };

//   const ICON = {
//     primary: COLORS.primary,
//     danger: COLORS.danger,
//     secondary: COLORS.secondary,
//     dark: COLORS.dark,
//     white: COLORS.white
//   };

//   // ✅ Helper function untuk menampilkan nama algoritma yang lebih user-friendly
//   const getAlgorithmDisplayName = (algo) => {
//     const algoNames = {
//       'ed25519': 'EdDSA (Ed25519)',
//       'rsa': 'RSA (2048-bit)',
//       'dsa': 'DSA (2048-bit)',
//       'ecdsa': 'ECDSA (P-256)'
//     };
//     return algoNames[algo] || algo.toUpperCase();
//   };

//   useEffect(() => {
//     fetchParticipants();
//   }, []);

//   const fetchParticipants = async () => {
//     try {
//       setLoadingParticipants(true);
//       const response = await adminApi.getParticipants();
//       setParticipants(response.data);
//     } catch (err) {
//       console.error('Gagal memuat daftar peserta:', err);
//       setError('Gagal memuat daftar peserta');
//     } finally {
//       setLoadingParticipants(false);
//     }
//   };

//   const handleImageUpload = async (file, info) => {
//     setCertificateImage(file);
//     setImagePreview(info?.preview || null);
//     setOcrResult(null);
//     setSelectedArea(null);
    
//     if (file) {
//       setExtracting(true);
//       try {
//         const formData = new FormData();
//         formData.append('image', file);
//         const response = await adminApi.previewOcr(formData);
//         setOcrResult({
//           text: response.data.text,
//           hash: response.data.hash,
//           preview: response.data.text,
//           is_mock: response.data.is_mock || false
//         });
//       } catch (err) {
//         console.error('OCR preview error:', err);
//         setOcrResult({
//           text: 'Teks berhasil diekstrak',
//           hash: 'mock_hash_' + Math.random().toString(36).substring(7),
//           preview: 'Teks diekstrak dari sertifikat...',
//           is_mock: true
//         });
//       } finally {
//         setExtracting(false);
//       }
//     }
//   };

//   const handleAreaSelected = (area) => setSelectedArea(area);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!certificateImage) { setError('Silakan unggah gambar sertifikat!'); return; }
//     if (!selectedArea) { setError('Silakan pilih area untuk kode QR!'); return; }
//     if (!formData.participant_id) { setError('Silakan pilih peserta!'); return; }
//     if (!formData.title || !formData.issued_date) { setError('Silakan isi judul dan tanggal!'); return; }

//     setLoading(true);
//     setError('');

//     try {
//       const formDataToSend = new FormData();
//       formDataToSend.append('participant_id', formData.participant_id);
//       formDataToSend.append('title', formData.title);
//       formDataToSend.append('description', formData.description);
//       formDataToSend.append('institution', formData.institution);
//       formDataToSend.append('issued_date', formData.issued_date);
//       formDataToSend.append('qr_x', Math.round(selectedArea.original.x1));
//       formDataToSend.append('qr_y', Math.round(selectedArea.original.y1));
//       formDataToSend.append('qr_size', Math.round(Math.min(selectedArea.original.width, selectedArea.original.height)));
//       formDataToSend.append('algorithm', algorithm); // ✅ Kirim algoritma ke backend
//       formDataToSend.append('certificate_image', certificateImage);

//       const response = await adminApi.createCertificateSingle(formDataToSend);
//       if (response.data.success) setResult(response.data);
//     } catch (err) {
//       console.error('Error:', err);
//       setError(err.response?.data?.detail || err.message || 'Gagal membuat sertifikat. Silakan coba lagi');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleReset = () => {
//     setResult(null); 
//     setOcrResult(null); 
//     setSelectedArea(null);
//     setCertificateImage(null); 
//     setImagePreview(null); 
//     setError(''); 
//     setDownloading(false);
//     setAlgorithm('ed25519'); // ✅ Reset ke default
//     setFormData({
//       participant_id: '', 
//       title: '', 
//       institution: '', 
//       description: '',
//       issued_date: new Date().toISOString().split('T')[0]
//     });
//   };

//   const handleDownload = async () => {
//     if (!result?.files?.certificate_url) {
//       alert('URL sertifikat tidak ditemukan!');
//       return;
//     }

//     setDownloading(true);
    
//     try {
//       const token = user?.token || localStorage.getItem('token');
//       const url = `http://localhost:8000${result.files.certificate_url}`;
      
//       const response = await fetch(url, {
//         method: 'GET',
//         headers: token ? { 'Authorization': `Bearer ${token}` } : {},
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const blob = await response.blob();
      
//       const blobUrl = window.URL.createObjectURL(blob);
      
//       const link = document.createElement('a');
//       link.href = blobUrl;
//       link.download = `${result.certificate_id}.png`;
//       document.body.appendChild(link);
//       link.click();
      
//       setTimeout(() => {
//         document.body.removeChild(link);
//         window.URL.revokeObjectURL(blobUrl);
//       }, 100);
      
//     } catch (error) {
//       console.error('Gagal mengunduh sertifikat:', error);
      
//       try {
//         const fallbackUrl = `http://localhost:8000${result.files.certificate_url}`;
//         window.open(fallbackUrl, '_blank');
//       } catch (fallbackError) {
//         alert('Gagal mengunduh sertifikat. Silakan coba lagi.');
//       }
//     } finally {
//       setDownloading(false);
//     }
//   };

//   const getSelectedParticipant = () => participants.find(p => p.user_id?.toString() === formData.participant_id);

//   const formatDate = (dateString) => {
//     if (!dateString) return '-';
//     return new Date(dateString).toLocaleDateString('id-ID', {
//       weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
//     });
//   };

//   // ========== SUCCESS VIEW ==========
//   if (result) {
//     const participant = getSelectedParticipant();
//     return (
//       <div className="min-vh-100 bg-light">
//         <AdminHeader user={user} logout={logout} />
//         <div className="admin-header-spacer" />

//         {/* ========== SUCCESS HEADER ========== */}
//         <div 
//           style={{
//             background: `linear-gradient(150deg, #6b21a8, #a300c8)`,
//             padding: '2.5rem 0 4rem',
//             position: 'relative',
//             overflow: 'hidden'
//           }}
//         >
//           <div 
//             style={{
//               position: 'absolute',
//               top: 0, left: 0, right: 0, bottom: 0,
//               backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
//                                radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
//               pointerEvents: 'none'
//             }}
//           />
          
//           <div className="container position-relative">
//             <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
              
//               {/* Title Section - Kiri */}
//               <div className="d-flex align-items-center gap-3">
//                 <div className="d-flex align-items-center justify-content-center flex-shrink-0">
//                   <CheckCircle color="white" size={45} />
//                 </div>
//                 <div>
//                   <h1 className="h3 fw-bold text-white mb-1">
//                     Sertifikat Berhasil Dibuat!
//                   </h1>
//                   <p className="text-white-50 mb-0" style={{fontSize: '0.95rem'}}>
//                     Sertifikat telah ditandatangani secara digital dengan <strong>{getAlgorithmDisplayName(algorithm)}</strong> dan siap diunduh
//                   </p>
//                 </div>
//               </div>

//               <button
//                 onClick={handleReset}
//                 className="btn d-flex align-items-center justify-content-center gap-2 px-4 py-2 fw-semibold flex-shrink-0"
//                 style={{
//                   background: 'white',
//                   color: COLORS.primary,
//                   border: `2px solid ${COLORS.primary}`,
//                   borderRadius: '12px',
//                   transition: 'all 0.3s ease',
//                   whiteSpace: 'nowrap'
//                 }}
//                 onMouseEnter={(e) => {
//                   e.currentTarget.style.background = COLORS.primary;
//                   e.currentTarget.style.color = 'white';
//                   e.currentTarget.style.transform = 'translateY(-2px)';
//                   e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
//                 }}
//                 onMouseLeave={(e) => {
//                   e.currentTarget.style.background = 'white';
//                   e.currentTarget.style.color = COLORS.primary;
//                   e.currentTarget.style.transform = 'translateY(0)';
//                   e.currentTarget.style.boxShadow = 'none';
//                 }}
//               >
//                 <Plus size={18} /> Buat Sertifikat Lain
//               </button>
//             </div>
//           </div>
//         </div>
        
//         <main className="container" style={{marginTop: '-2rem', position: 'relative', zIndex: 10}}>
//           <div className="row justify-content-center">
//             <div className="col-lg-10">
//               <div className="row g-4">
//                 <div className="col-lg-7">
//                   <div className="card border-0 shadow-sm" style={{borderRadius: '16px', overflow: 'hidden'}}>
//                     <div 
//                       className="card-header border-bottom py-3"
//                       style={{
//                         background: `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
//                         color: 'white',
//                         border: 'none'
//                       }}
//                     >
//                       <h3 className="h6 fw-bold mb-0 d-flex align-items-center gap-2 text-white">
//                          {formData.title}
//                       </h3>
//                     </div>
//                     <div className="card-body p-4">
//                       {/* Preview Image */}
//                       <div 
//                         className="bg-light rounded-3 overflow-hidden position-relative mb-3" 
//                         style={{
//                           aspectRatio: '4/3',
//                           border: `2px solid ${COLORS.light}`
//                         }}
//                       >
//                         <img 
//                           src={`http://localhost:8000${result.files.certificate_url}`} 
//                           alt={formData.title}
//                           className="w-100 h-100" 
//                           style={{objectFit: 'contain'}}
//                           onError={(e) => { e.target.src = '/placeholder-certificate.png'; }} 
//                         />
                        
//                         {/* Downloading */}
//                         {downloading && (
//                           <div 
//                             className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
//                             style={{
//                               background: 'rgba(0,0,0,0.6)',
//                               backdropFilter: 'blur(4px)'
//                             }}
//                           >
//                             <div className="text-center text-white">
//                               <div className="spinner-border mb-2" role="status" style={{width: '3rem', height: '3rem'}}>
//                                 <span className="visually-hidden">Mengunduh...</span>
//                               </div>
//                               <p className="mb-0 fw-semibold">Sedang mengunduh...</p>
//                             </div>
//                           </div>
//                         )}
//                       </div>

//                       {/* Download Button */}
//                       <button 
//                         onClick={handleDownload} 
//                         disabled={downloading}
//                         className="btn w-100 d-flex align-items-center justify-content-center gap-2 py-3 fw-semibold"
//                         style={{
//                           background: downloading
//                             ? '#9ca3af'
//                             : `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
//                           color: 'white',
//                           borderRadius: '12px',
//                           border: 'none',
//                           fontSize: '1rem',
//                           boxShadow: downloading ? 'none' : `0 8px 24px ${COLORS.primary}40`,
//                           transition: 'all 0.3s ease',
//                           cursor: downloading ? 'not-allowed' : 'pointer'
//                         }}
//                         onMouseEnter={(e) => {
//                           if (!downloading) {
//                             e.currentTarget.style.transform = 'translateY(-2px)';
//                             e.currentTarget.style.boxShadow = `0 12px 32px ${COLORS.primary}50`;
//                           }
//                         }}
//                         onMouseLeave={(e) => {
//                           e.currentTarget.style.transform = 'translateY(0)';
//                           e.currentTarget.style.boxShadow = downloading ? 'none' : `0 8px 24px ${COLORS.primary}40`;
//                         }}
//                       >
//                         {downloading ? (
//                           <>
//                             <span className="spinner-border spinner-border-sm" role="status" />
//                             <span>Mengunduh Sertifikat...</span>
//                           </>
//                         ) : (
//                           <>
//                             <Download color={ICON.white} size={20} />
//                             <span>Unduh Sertifikat</span>
//                           </>
//                         )}
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="col-lg-5">
//                   <div className="card border-0 shadow-sm" style={{borderRadius: '16px', overflow: 'hidden'}}>
//                     <div className="card-header bg-white border-bottom py-3">
//                       <h4 className="h6 fw-bold text-dark mb-0">Informasi Sertifikat</h4>
//                     </div>
//                     <div className="card-body p-4">
//                       <div className="d-flex flex-column gap-3">
//                         <div>
//                           <p className="text-muted small mb-1 d-flex align-items-center gap-2">
//                             <Hash color={ICON.primary} size={14} /> ID Sertifikat
//                           </p>
//                           <p className="text-dark small font-monospace mb-0 text-break" style={{fontSize: '0.8rem'}}>{result.certificate_id}</p>
//                         </div>
//                         {participant && (
//                           <div>
//                             <p className="text-muted small mb-1 d-flex align-items-center gap-2">
//                               <User color={ICON.primary} size={14} /> Peserta
//                             </p>
//                             <p className="text-dark fw-medium mb-0">{participant.full_name}</p>
//                           </div>
//                         )}
//                         <div>
//                           <p className="text-muted small mb-1 d-flex align-items-center gap-2">
//                             <Building color={ICON.primary} size={14} /> Institusi
//                           </p>
//                           <p className="text-dark fw-medium mb-0">{formData.institution || '-'}</p>
//                         </div>
//                         <div>
//                           <p className="text-muted small mb-1 d-flex align-items-center gap-2">
//                             <Calendar color={ICON.primary} size={14} /> Tanggal Diterbitkan
//                           </p>
//                           <p className="text-dark fw-medium mb-0">{formatDate(formData.issued_date)}</p>
//                         </div>
//                         {formData.description && (
//                           <div>
//                             <p className="text-muted small mb-1 d-flex align-items-center gap-2">
//                               <FileText size={14} color={COLORS.primary} /> Deskripsi
//                             </p>
//                             <p className="text-dark fw-medium mb-0">{formData.description}</p>
//                           </div>
//                         )}
                        
//                         {/* ✅ BAGIAN BARU: Detail Kriptografi dengan Algoritma */}
//                         <div>
//                           <div 
//                             className="p-3 rounded-3"
//                             style={{
//                               background: `linear-gradient(135deg, ${COLORS.primary}08 0%, ${COLORS.primaryDark}08 100%)`,
//                               border: `2px solid ${COLORS.primary}30`
//                             }}
//                           >
//                             <div className="d-flex align-items-center gap-2 mb-3">
//                               <Shield size={16} color={COLORS.primary} />
//                               <p className="fw-bold mb-0" style={{color: COLORS.primary, fontSize: '0.9rem'}}>
//                                 Detail Kriptografi
//                               </p>
//                             </div>
                            
//                             <div className="d-flex flex-column gap-2">
//                               <div className="d-flex justify-content-between align-items-center">
//                                 <span className="text-muted small">Algoritma:</span>
//                                 <span 
//                                   className="badge px-2 py-1 fw-semibold"
//                                   style={{
//                                     background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
//                                     color: 'white',
//                                     fontSize: '0.75rem',
//                                     borderRadius: '6px'
//                                   }}
//                                 >
//                                   {getAlgorithmDisplayName(algorithm)}
//                                 </span>
//                               </div>
                              
//                               <div className="d-flex justify-content-between align-items-center">
//                                 <span className="text-muted small">Hash Function:</span>
//                                 <span className="font-monospace fw-bold small" style={{color: COLORS.primary}}>
//                                   {result.hash_algorithm || 'SHA-512'}
//                                 </span>
//                               </div>
                              
//                               <div className="d-flex justify-content-between align-items-center">
//                                 <span className="text-muted small">Signature:</span>
//                                 <span className="font-monospace fw-bold small" style={{color: COLORS.primary}}>
//                                   {result.signature_algorithm || algorithm.toUpperCase()}
//                                 </span>
//                               </div>
                              
//                               <div className="d-flex justify-content-between align-items-center">
//                                 <span className="text-muted small">Posisi QR:</span>
//                                 <span className="font-monospace small">
//                                   ({result.qr_position?.x}, {result.qr_position?.y})
//                                 </span>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div className="admin-header-spacer" />
//           </div>
//         </main>
//       </div>
//     );
//   }

//   // ========== MAIN FORM VIEW ==========
//   return (
//     <div className="min-vh-100 bg-light">
//       <AdminHeader user={user} logout={logout} />
//       <div className="admin-header-spacer" />

//       {/* ========== HEADER SECTION ========== */}
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
//                   Buat Sertifikat Digital
//                 </h1>
//               </div>
//               <p className="text-white-50 mb-0" style={{fontSize: '0.95rem'}}>
//                 Unggah sertifikat, sistem akan otomatis mengekstrak informasi dan menambahkan QR Code autentikasi
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ========== MAIN CONTENT ========== */}
//       <div className="container" style={{marginTop: '-4rem', position: 'relative', zIndex: 10}}>
//         <form onSubmit={handleSubmit}>
//           <div className="row g-4">
//             <div className="col-lg-7">
//               <div className="card border-0 shadow-sm h-100 upload-car" style={{borderRadius: '16px', overflow: 'hidden'}}>
//                 <div className="card-header bg-white border-bottom py-3">
//                   <h5 className="card-title mb-0 d-flex align-items-center gap-2 text-dark fw-semibold">
//                     <Upload size={18} /> Unggah Sertifikat & Pilih Area QR
//                   </h5>
//                 </div>
//                 <div className="card-body p-4">
//                   {/* ✅ Dropdown Algoritma */}
//                   <div className="mb-3">
//                     <label className="form-label fw-medium small d-flex align-items-center gap-1">
//                       <Sparkles size={14} color={COLORS.primary} /> Algoritma Digital Signature
//                     </label>
//                     <select 
//                       className="form-select" 
//                       value={algorithm} 
//                       onChange={(e) => setAlgorithm(e.target.value)}
//                       style={{borderRadius: '10px'}}
//                     >
//                       <option value="ed25519">EdDSA (Ed25519) - Direkomendasikan</option>
//                       <option value="rsa">RSA (2048-bit)</option>
//                       <option value="dsa">DSA (2048-bit)</option>
//                       <option value="ecdsa">ECDSA (P-256)</option>
//                     </select>
//                     <small className="text-muted d-block mt-1" style={{fontSize: '0.75rem'}}>
//                       Pilih algoritma yang akan digunakan untuk menandatangani sertifikat
//                     </small>
//                   </div>

//                   <ImageDragDrop onImageUploaded={handleImageUpload} onAreaSelected={handleAreaSelected} enableSelection={true} showPreview={true} />
                  
//                   {extracting && (
//                     <div 
//                       className="d-flex align-items-center gap-2 mt-3 p-3 rounded-3"
//                       style={{
//                         background: `${COLORS.primary}10`,
//                         border: `1px solid ${COLORS.primary}30`
//                       }}
//                     >
//                       <Loader2 className="animate-spin" color={COLORS.primary} size={18} />
//                       <small className="fw-semibold" style={{color: COLORS.primary}}>Mengekstrak teks dengan OCR...</small>
//                     </div>
//                   )}
                  
//                   {ocrResult && (
//                     <div 
//                       className="mt-3 p-3 rounded-3"
//                       style={{
//                         background: `${COLORS.primary}10`,
//                         border: `1px solid ${COLORS.primary}30`
//                       }}
//                     >
//                       <div className="d-flex align-items-center gap-2 mb-2">
//                         <CheckCircle size={16} color={COLORS.primary} />
//                         <small className="fw-semibold">Teks berhasil diekstrak</small>
//                         {ocrResult.is_mock && <span className="badge bg-warning text-dark ms-auto" style={{fontSize: '0.7rem'}}>Simulasi</span>}
//                       </div>
//                       <small className="text-muted d-block">Hash: <code className="text-muted d-block">{ocrResult.hash}</code></small>
//                     </div>
//                   )}
                  
//                   {selectedArea && (
//                     <div 
//                       className="mt-3 p-3 rounded-3"
//                       style={{
//                         background: `${COLORS.primary}10`,
//                         border: `1px solid ${COLORS.primary}30`
//                       }}
//                     >
//                       <div className="d-flex align-items-center gap-2 mb-1">
//                         <QrCode size={14} color={COLORS.primary} />
//                         <small className="fw-semibold text-dark">Area QR dipilih</small>
//                       </div>
//                       <small className="text-muted d-block" style={{fontSize: '0.8rem'}}>
//                         {Math.round(selectedArea.original.width)}×{Math.round(selectedArea.original.height)}px at ({Math.round(selectedArea.original.x1)}, {Math.round(selectedArea.original.y1)})
//                       </small>
//                     </div>
//                   )}
                  
//                   <p className="text-center text-muted small mt-4 mb-0">
//                     <strong>Tips:</strong> Gunakan gambar sertifikat dengan kualitas yang baik dan pilih area QR Code pada bagian yang tidak menutupi informasi penting
//                   </p>
//                 </div>
//               </div>
//             </div>
//             <div className="col-lg-5">
//               <div className="card border-0 shadow-sm h-100" style={{borderRadius: '16px', overflow: 'hidden'}}>
//                 <div 
//                   className="card-header bg-white border-bottom py-3"
//                   style={{background: COLORS.light}}
//                 >
//                   <h5 className="card-title mb-0 d-flex align-items-center gap-2 text-dark fw-semibold">
//                     <FileText size={18} color={COLORS.primary} /> Detail Sertifikat
//                   </h5>
//                 </div>
//                 <div className="card-body p-4">
//                   <div className="mb-3">
//                     <label className="form-label fw-medium small d-flex align-items-center gap-1">
//                       <User size={14} color={COLORS.primary} /> Pilih Peserta <span className="text-danger">*</span>
//                     </label>
//                     {loadingParticipants ? (
//                       <div className="input-group input-group-sm">
//                         <span className="input-group-text bg-light"><Loader2 className="animate-spin" size={14} color={COLORS.primary} /></span>
//                         <input type="text" className="form-control" value="Memuat..." readOnly disabled />
//                       </div>
//                     ) : participants.length === 0 ? (
//                       <div className="alert alert-warning py-2 small mb-0" role="alert">
//                         <strong>Belum ada data peserta</strong><br/><small>Buat peserta terlebih dahulu di menu Kelola Peserta</small>
//                       </div>
//                     ) : (
//                       <select value={formData.participant_id} onChange={(e) => setFormData({...formData, participant_id: e.target.value})} className="form-select" required style={{borderRadius: '10px'}}>
//                         <option value="">-- Pilih Peserta --</option>
//                         {participants.map((p) => (<option key={p.user_id} value={p.user_id}>{p.full_name} • {p.username}</option>))}
//                       </select>
//                     )}
//                   </div>
//                   <div className="mb-3">
//                     <label className="form-label fw-medium small d-flex align-items-center gap-1">
//                       <FileText size={14} color={COLORS.primary} /> Judul Sertifikat <span className="text-danger">*</span>
//                     </label>
//                     <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="form-control" placeholder="Contoh: Sertifikat Kompetensi Web Development" required style={{borderRadius: '10px'}} />
//                   </div>
//                   <div className="mb-3">
//                     <label className="form-label fw-medium small d-flex align-items-center gap-1">
//                       <Building size={14} color={COLORS.primary} /> Institusi
//                     </label>
//                     <input type="text" value={formData.institution} onChange={(e) => setFormData({...formData, institution: e.target.value})} className="form-control" placeholder="Universitas / Perusahaan" style={{borderRadius: '10px'}} />
//                   </div>
//                   <div className="mb-3">
//                     <label className="form-label fw-medium small d-flex align-items-center gap-1">
//                       <FileText size={14} color={COLORS.primary} /> Deskripsi
//                     </label>
//                     <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="form-control" placeholder="Deskripsi singkat sertifikat" style={{borderRadius: '10px'}} />
//                   </div>
//                   <div className="mb-3">
//                     <label className="form-label fw-medium small d-flex align-items-center gap-1">
//                       <Calendar size={14} color={COLORS.primary} /> Tanggal Diterbitkan <span className="text-danger">*</span>
//                     </label>
//                     <input type="date" value={formData.issued_date} onChange={(e) => setFormData({...formData, issued_date: e.target.value})} className="form-control" required style={{borderRadius: '10px'}} />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//           {error && (
//             <div 
//               className="alert alert-danger d-flex align-items-start gap-2 mt-4" 
//               role="alert"
//               style={{
//                 borderRadius: '12px',
//                 border: `1px solid ${COLORS.danger}30`
//               }}
//             >
//               <XCircle color={ICON.danger} size={18} className="mt-1" /><span className="small">{error}</span>
//             </div>
//           )}
//           <div className="pt-4 mt-2">
//             <button 
//               type="submit" 
//               disabled={loading || !certificateImage || !selectedArea || !formData.participant_id || extracting}
//               className="btn btn-lg w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
//               style={{
//                 background: (loading || !certificateImage || !selectedArea || !formData.participant_id || extracting)
//                   ? '#9ca3af'
//                   : `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
//                 color: 'white',
//                 borderRadius: '12px',
//                 border: 'none',
//                 padding: '14px 0',
//                 fontSize: '1.05rem',
//                 boxShadow: (loading || !certificateImage || !selectedArea || !formData.participant_id || extracting)
//                   ? 'none'
//                   : `0 8px 20px ${COLORS.primary}40`,
//                 transition: 'all 0.3s ease'
//               }}
//             >
//               {loading ? (<><span className="spinner-border spinner-border-sm" role="status" /> Sedang memproses...</>) : (<><CheckCircle size={20} /> Buat Sertifikat</>)}
//             </button>
//           </div>
//         </form>
//       </div>
//       <div className="admin-header-spacer" />
//     </div>
//   );
// };

// export default CertificateCreator;

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminHeader from '../shared/AppHeader';
import ImageDragDrop from '../shared/ImageDragDrop';
import { adminApi } from '../../services/api';
import { 
  ArrowLeft, Download, FileText, CheckCircle, XCircle, Plus,
  Calendar, Building, User, Hash, Loader2, ArrowLeftCircle,
  Award, Upload, ScanLine, QrCode, ChevronRight, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CertificateCreator = () => {
  const { user, logout } = useAuth();
  
  const [formData, setFormData] = useState({
    participant_id: '',
    title: '',
    institution: '',
    description: '',
    issued_date: new Date().toISOString().split('T')[0]
  });
  
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  
  const [certificateImage, setCertificateImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [selectedArea, setSelectedArea] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [extracting, setExtracting] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const COLORS = {
    primary: '#6b21a8',
    primaryDark: '#a300c8',
    success: '#10b981',
    danger: '#dc3545',
    secondary: '#495057',
    dark: '#212529',
    white: '#ffffff',
    light: '#f8fafc'
  };

  const ICON = {
    primary: COLORS.primary,
    danger: COLORS.danger,
    secondary: COLORS.secondary,
    dark: COLORS.dark,
    white: COLORS.white
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      setLoadingParticipants(true);
      const response = await adminApi.getParticipants();
      setParticipants(response.data);
    } catch (err) {
      console.error('Gagal memuat daftar peserta:', err);
      setError('Gagal memuat daftar peserta');
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleImageUpload = async (file, info) => {
    setCertificateImage(file);
    setImagePreview(info?.preview || null);
    setOcrResult(null);
    setSelectedArea(null);
    
    if (file) {
      setExtracting(true);
      try {
        const formData = new FormData();
        formData.append('image', file);
        const response = await adminApi.previewOcr(formData);
        setOcrResult({
          text: response.data.text,
          hash: response.data.hash,
          preview: response.data.text,
          is_mock: response.data.is_mock || false
        });
      } catch (err) {
        console.error('OCR preview error:', err);
        setOcrResult({
          text: 'Teks berhasil diekstrak',
          hash: 'mock_hash_' + Math.random().toString(36).substring(7),
          preview: 'Teks diekstrak dari sertifikat...',
          is_mock: true
        });
      } finally {
        setExtracting(false);
      }
    }
  };

  const handleAreaSelected = (area) => setSelectedArea(area);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!certificateImage) { setError('Silakan unggah gambar sertifikat!'); return; }
    if (!selectedArea) { setError('Silakan pilih area untuk kode QR!'); return; }
    if (!formData.participant_id) { setError('Silakan pilih peserta!'); return; }
    if (!formData.title || !formData.issued_date) { setError('Silakan isi judul dan tanggal!'); return; }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('participant_id', formData.participant_id);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('institution', formData.institution);
      formDataToSend.append('issued_date', formData.issued_date);
      formDataToSend.append('qr_x', Math.round(selectedArea.original.x1));
      formDataToSend.append('qr_y', Math.round(selectedArea.original.y1));
      formDataToSend.append('qr_size', Math.round(Math.min(selectedArea.original.width, selectedArea.original.height)));
      formDataToSend.append('certificate_image', certificateImage);

      const response = await adminApi.createCertificateSingle(formDataToSend);
      if (response.data.success) setResult(response.data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.detail || err.message || 'Gagal membuat sertifikat. Silakan coba lagi');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null); setOcrResult(null); setSelectedArea(null);
    setCertificateImage(null); setImagePreview(null); setError(''); setDownloading(false);
    setFormData({
      participant_id: '', title: '', institution: '', description: '',
      issued_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleDownload = async () => {
    if (!result?.files?.certificate_url) {
      alert('URL sertifikat tidak ditemukan!');
      return;
    }

    setDownloading(true);
    
    try {
      const token = user?.token || localStorage.getItem('token');
      const url = `http://localhost:8000${result.files.certificate_url}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${result.certificate_id}.png`;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
    } catch (error) {
      console.error('Gagal mengunduh sertifikat:', error);
      
      try {
        const fallbackUrl = `http://localhost:8000${result.files.certificate_url}`;
        window.open(fallbackUrl, '_blank');
      } catch (fallbackError) {
        alert('Gagal mengunduh sertifikat. Silakan coba lagi.');
      }
    } finally {
      setDownloading(false);
    }
  };

  const getSelectedParticipant = () => participants.find(p => p.user_id?.toString() === formData.participant_id);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  // ========== SUCCESS VIEW ==========
  if (result) {
    const participant = getSelectedParticipant();
    return (
      <div className="min-vh-100 bg-light">
        <AdminHeader user={user} logout={logout} />
            <div className="admin-header-spacer" />

        
        {/* ========== SUCCESS HEADER ========== */}
        <div 
          style={{
            background: `linear-gradient(150deg, #6b21a8, #a300c8)`,
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
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
              
              {/* Title Section - Kiri */}
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center flex-shrink-0">
                  <CheckCircle color="white" size={45} />
                </div>
                <div>
                  <h1 className="h3 fw-bold text-white mb-1">
                    Sertifikat Berhasil Dibuat!
                  </h1>
                  <p className="text-white-50 mb-0" style={{fontSize: '0.95rem'}}>
                    Sertifikat telah ditandatangani secara digital dan siap diunduh
                  </p>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="btn d-flex align-items-center justify-content-center gap-2 px-4 py-2 fw-semibold flex-shrink-0"
                style={{
                  background: 'white',
                  color: COLORS.primary,
                  border: `2px solid ${COLORS.primary}`,
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = COLORS.primary;
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = COLORS.primary;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Plus size={18} /> Buat Sertifikat Lain
              </button>
            </div>
          </div>
        </div>
        
        <main className="container" style={{marginTop: '-2rem', position: 'relative', zIndex: 10}}>
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="row g-4">
                <div className="col-lg-7">
                  <div className="card border-0 shadow-sm" style={{borderRadius: '16px', overflow: 'hidden'}}>
                    <div 
                      className="card-header border-bottom py-3"
                      style={{
                        background: `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      <h3 className="h6 fw-bold mb-0 d-flex align-items-center gap-2 text-white">
                         {formData.title}
                      </h3>
                    </div>
                    <div className="card-body p-4">
                      {/* Preview Image */}
                      <div 
                        className="bg-light rounded-3 overflow-hidden position-relative mb-3" 
                        style={{
                          aspectRatio: '4/3',
                          border: `2px solid ${COLORS.light}`
                        }}
                      >
                        <img 
                          src={`http://localhost:8000${result.files.certificate_url}`} 
                          alt={formData.title}
                          className="w-100 h-100" 
                          style={{objectFit: 'contain'}}
                          onError={(e) => { e.target.src = '/placeholder-certificate.png'; }} 
                        />
                        
                        {/* Downloading */}
                        {downloading && (
                          <div 
                            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                            style={{
                              background: 'rgba(0,0,0,0.6)',
                              backdropFilter: 'blur(4px)'
                            }}
                          >
                            <div className="text-center text-white">
                              <div className="spinner-border mb-2" role="status" style={{width: '3rem', height: '3rem'}}>
                                <span className="visually-hidden">Mengunduh...</span>
                              </div>
                              <p className="mb-0 fw-semibold">Sedang mengunduh...</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Download Button */}
                      <button 
                        onClick={handleDownload} 
                        disabled={downloading}
                        className="btn w-100 d-flex align-items-center justify-content-center gap-2 py-3 fw-semibold"
                        style={{
                          background: downloading
                            ? '#9ca3af'
                            : `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                          color: 'white',
                          borderRadius: '12px',
                          border: 'none',
                          fontSize: '1rem',
                          boxShadow: downloading ? 'none' : `0 8px 24px ${COLORS.primary}40`,
                          transition: 'all 0.3s ease',
                          cursor: downloading ? 'not-allowed' : 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          if (!downloading) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = `0 12px 32px ${COLORS.primary}50`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = downloading ? 'none' : `0 8px 24px ${COLORS.primary}40`;
                        }}
                      >
                        {downloading ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" />
                            <span>Mengunduh Sertifikat...</span>
                          </>
                        ) : (
                          <>
                            <Download color={ICON.white} size={20} />
                            <span>Unduh Sertifikat</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-lg-5">
                  <div className="card border-0 shadow-sm" style={{borderRadius: '16px', overflow: 'hidden'}}>
                    <div className="card-header bg-white border-bottom py-3">
                      <h4 className="h6 fw-bold text-dark mb-0">Informasi Sertifikat</h4>
                    </div>
                    <div className="card-body p-4">
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <p className="text-muted small mb-1 d-flex align-items-center gap-2">
                            <Hash color={ICON.primary} size={14} /> ID Sertifikat
                          </p>
                          <p className="text-dark small font-monospace mb-0 text-break" style={{fontSize: '0.8rem'}}>{result.certificate_id}</p>
                        </div>
                        {participant && (
                          <div>
                            <p className="text-muted small mb-1 d-flex align-items-center gap-2">
                              <User color={ICON.primary} size={14} /> Peserta
                            </p>
                            <p className="text-dark fw-medium mb-0">{participant.full_name}</p>
                            {/* <p className="text-muted small mb-0">@{participant.username}</p> */}
                          </div>
                        )}
                        <div>
                          <p className="text-muted small mb-1 d-flex align-items-center gap-2">
                            <Building color={ICON.primary} size={14} /> Institusi
                          </p>
                          <p className="text-dark fw-medium mb-0">{formData.institution || '-'}</p>
                        </div>
                        <div>
                          <p className="text-muted small mb-1 d-flex align-items-center gap-2">
                            <Calendar color={ICON.primary} size={14} /> Tanggal Diterbitkan
                          </p>
                          <p className="text-dark fw-medium mb-0">{formatDate(formData.issued_date)}</p>
                        </div>
                        {formData.description && (
                          <div>
                            <p className="text-muted small mb-1 d-flex align-items-center gap-2">
                            <FileText size={14} color={COLORS.primary} /> Deskripsi
                            </p>
                            <p className="text-dark fw-medium mb-0">{formData.description}</p>
                          </div>
                        )}
                        <div>
                          <div 
                            className="p-3 rounded-3"
                            style={{background: COLORS.light, border: `1px solid #e2e8f0`}}
                          >
                            <p className="small mb-1"><span className="text-muted">Hash:</span> <span className="font-monospace" style={{color: COLORS.primary}}>{result.hash_algorithm}</span></p>
                            <p className="small mb-1"><span className="text-muted">Signature:</span> <span className="font-monospace" style={{color: COLORS.primary}}>{result.signature_algorithm}</span></p>
                            <p className="small mb-0"><span className="text-muted">Posisi QR:</span> <span className="font-monospace">({result.qr_position?.x}, {result.qr_position?.y})</span></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="admin-header-spacer" />
          </div>
        </main>
      </div>
    );
  }

  // ========== MAIN FORM VIEW ==========
  return (
    <div className="min-vh-100 bg-light">
      <AdminHeader user={user} logout={logout} />
        <div className="admin-header-spacer" />

      
      {/* ========== HEADER SECTION ========== */}
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
                  Buat Sertifikat Digital
                </h1>
              </div>
              <p className="text-white-50 mb-0" style={{fontSize: '0.95rem'}}>
                Unggah sertifikat, sistem akan otomatis mengekstrak informasi dan menambahkan QR Code autentikasi
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <div className="container" style={{marginTop: '-4rem', position: 'relative', zIndex: 10}}>
        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm h-100 upload-car" style={{borderRadius: '16px', overflow: 'hidden'}}>
                <div className="card-header bg-white border-bottom py-3">
                  <h5 className="card-title mb-0 d-flex align-items-center gap-2 text-dark fw-semibold">
                    <Upload size={18} /> Unggah Sertifikat & Pilih Area QR
                  </h5>
                </div>
                <div className="card-body p-4">
                  <ImageDragDrop onImageUploaded={handleImageUpload} onAreaSelected={handleAreaSelected} enableSelection={true} showPreview={true} />
                  {extracting && (
                    <div 
                      className="d-flex align-items-center gap-2 mt-3 p-3 rounded-3"
                      style={{
                        background: `${COLORS.primary}10`,
                        border: `1px solid ${COLORS.primary}30`
                      }}
                    >
                      <Loader2 className="animate-spin" color={COLORS.primary} size={18} />
                      <small className="fw-semibold" style={{color: COLORS.primary}}>Mengekstrak teks dengan OCR...</small>
                    </div>
                  )}
                  {ocrResult && (
                    <div 
                      className="mt-3 p-3 rounded-3"
                      style={{
                        background: `${COLORS.primary}10`,
                        border: `1px solid ${COLORS.primary}30`
                      }}
                    >
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <CheckCircle size={16} color={COLORS.primary} />
                        <small className="fw-semibold">Teks berhasil diekstrak</small>
                        {ocrResult.is_mock && <span className="badge bg-warning text-dark ms-auto" style={{fontSize: '0.7rem'}}>Simulasi</span>}
                      </div>
                      <small className="text-muted d-block">Hash: <code className="text-muted d-block">{ocrResult.hash}</code></small>
                    </div>
                  )}
                  {selectedArea && (
                    <div 
                      className="mt-3 p-3 rounded-3"
                      style={{
                        background: `${COLORS.primary}10`,
                        border: `1px solid ${COLORS.primary}30`
                      }}
                    >
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <QrCode size={14} color={COLORS.primary} />
                        <small className="fw-semibold text-dark">Area QR dipilih</small>
                      </div>
                      <small className="text-muted d-block" style={{fontSize: '0.8rem'}}>
                        {Math.round(selectedArea.original.width)}×{Math.round(selectedArea.original.height)}px at ({Math.round(selectedArea.original.x1)}, {Math.round(selectedArea.original.y1)})
                      </small>
                    </div>
                  )}
                  <p className="text-center text-muted small mt-4 mb-0">
                    <strong>Tips:</strong> Gunakan gambar sertifikat dengan kualitas yang baik dan pilih area QR Code pada bagian yang tidak menutupi informasi penting
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm h-100" style={{borderRadius: '16px', overflow: 'hidden'}}>
                <div 
                  className="card-header bg-white border-bottom py-3"
                  style={{background: COLORS.light}}
                >
                  <h5 className="card-title mb-0 d-flex align-items-center gap-2 text-dark fw-semibold">
                    <FileText size={18} color={COLORS.primary} /> Detail Sertifikat
                  </h5>
                </div>
                <div className="card-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-medium small d-flex align-items-center gap-1">
                      <User size={14} color={COLORS.primary} /> Pilih Peserta <span className="text-danger">*</span>
                    </label>
                    {loadingParticipants ? (
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-light"><Loader2 className="animate-spin" size={14} color={COLORS.primary} /></span>
                        <input type="text" className="form-control" value="Memuat..." readOnly disabled />
                      </div>
                    ) : participants.length === 0 ? (
                      <div className="alert alert-warning py-2 small mb-0" role="alert">
                        <strong>Belum ada data peserta</strong><br/><small>Buat peserta terlebih dahulu di menu Kelola Peserta</small>
                      </div>
                    ) : (
                      <select value={formData.participant_id} onChange={(e) => setFormData({...formData, participant_id: e.target.value})} className="form-select" required style={{borderRadius: '10px'}}>
                        <option value="">-- Pilih Peserta --</option>
                        {participants.map((p) => (<option key={p.user_id} value={p.user_id}>{p.full_name} • {p.username}</option>))}
                      </select>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium small d-flex align-items-center gap-1">
                      <FileText size={14} color={COLORS.primary} /> Judul Sertifikat <span className="text-danger">*</span>
                    </label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="form-control" placeholder="Contoh: Sertifikat Kompetensi Web Development" required style={{borderRadius: '10px'}} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium small d-flex align-items-center gap-1">
                      <Building size={14} color={COLORS.primary} /> Institusi
                    </label>
                    <input type="text" value={formData.institution} onChange={(e) => setFormData({...formData, institution: e.target.value})} className="form-control" placeholder="Universitas / Perusahaan" style={{borderRadius: '10px'}} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium small d-flex align-items-center gap-1">
                      <FileText size={14} color={COLORS.primary} /> Deskripsi
                    </label>
                    <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="form-control" placeholder="Deskripsi singkat sertifikat" style={{borderRadius: '10px'}} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium small d-flex align-items-center gap-1">
                      <Calendar size={14} color={COLORS.primary} /> Tanggal Diterbitkan <span className="text-danger">*</span>
                    </label>
                    <input type="date" value={formData.issued_date} onChange={(e) => setFormData({...formData, issued_date: e.target.value})} className="form-control" required style={{borderRadius: '10px'}} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {error && (
            <div 
              className="alert alert-danger d-flex align-items-start gap-2 mt-4" 
              role="alert"
              style={{
                borderRadius: '12px',
                border: `1px solid ${COLORS.danger}30`
              }}
            >
              <XCircle color={ICON.danger} size={18} className="mt-1" /><span className="small">{error}</span>
            </div>
          )}
          <div className="pt-4 mt-2">
            <button 
              type="submit" 
              disabled={loading || !certificateImage || !selectedArea || !formData.participant_id || extracting}
              className="btn btn-lg w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
              style={{
                background: (loading || !certificateImage || !selectedArea || !formData.participant_id || extracting)
                  ? '#9ca3af'
                  : `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                color: 'white',
                borderRadius: '12px',
                border: 'none',
                padding: '14px 0',
                fontSize: '1.05rem',
                boxShadow: (loading || !certificateImage || !selectedArea || !formData.participant_id || extracting)
                  ? 'none'
                  : `0 8px 20px ${COLORS.primary}40`,
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? (<><span className="spinner-border spinner-border-sm" role="status" /> Sedang memproses...</>) : (<><CheckCircle size={20} /> Buat Sertifikat</>)}
            </button>
          </div>
        </form>
      </div>
        <div className="admin-header-spacer" />

    </div>
  );
};

export default CertificateCreator;














// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../../contexts/AuthContext';
// import ImageDragDrop from '../shared/ImageDragDrop';
// import { adminApi } from '../../services/api';
// import { 
//   Upload, ArrowLeft, CheckCircle, Loader2, User, 
//   Building, BookOpen, Calendar, Image as ImageIcon, FileText
// } from 'lucide-react';
// import { Link } from 'react-router-dom';

// const CertificateCreator = () => {
//   const { user } = useAuth();
  
//   // Form state - semua dalam satu form
//   const [formData, setFormData] = useState({
//     participant_id: '',
//     title: '',
//     institution: '',
//     course_name: '',
//     issued_date: new Date().toISOString().split('T')[0]
//   });
  
//   const [participants, setParticipants] = useState([]);
//   const [loadingParticipants, setLoadingParticipants] = useState(false);
  
//   const [certificateImage, setCertificateImage] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);
  
//   const [selectedArea, setSelectedArea] = useState(null);
//   const [ocrResult, setOcrResult] = useState(null);
//   const [extracting, setExtracting] = useState(false);
  
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     fetchParticipants();
//   }, []);

//   const fetchParticipants = async () => {
//     try {
//       setLoadingParticipants(true);
//       const response = await adminApi.getParticipants();
//       setParticipants(response.data);
//     } catch (err) {
//       console.error('Gagal memuat daftar peserta:', err);
//       setError('Gagal memuat daftar peserta');
//     } finally {
//       setLoadingParticipants(false);
//     }
//   };

//   const handleImageUpload = async (file, info) => {
//     setCertificateImage(file);
//     setImagePreview(info?.preview || null);
//     setOcrResult(null);
//     setSelectedArea(null);
    
//     // Auto OCR setelah upload
//     if (file) {
//       setExtracting(true);
//       try {
//         const formData = new FormData();
//         formData.append('image', file);
        
//         const response = await adminApi.previewOcr(formData);
//         setOcrResult({
//           text: response.data.text,
//           hash: response.data.hash,
//           preview: response.data.text.substring(0, 200) + '...',
//           is_mock: response.data.is_mock || false
//         });
//       } catch (err) {
//         console.error('OCR preview error:', err);
//         setOcrResult({
//           text: 'Teks berhasil diekstrak',
//           hash: 'mock_hash_' + Math.random().toString(36).substring(7),
//           preview: 'Teks diekstrak dari sertifikat...',
//           is_mock: true
//         });
//       } finally {
//         setExtracting(false);
//       }
//     }
//   };

//   const handleAreaSelected = (area) => {
//     setSelectedArea(area);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // Validasi
//     if (!certificateImage) {
//       setError('Silakan unggah gambar sertifikat!');
//       return;
//     }
//     if (!selectedArea) {
//       setError('Silakan pilih area untuk kode QR!');
//       return;
//     }
//     if (!formData.participant_id) {
//       setError('Silakan pilih peserta!');
//       return;
//     }
//     if (!formData.title || !formData.issued_date) {
//       setError('Silakan isi judul dan tanggal!');
//       return;
//     }

//     setLoading(true);
//     setError('');

//     try {
//       const formDataToSend = new FormData();
//       formDataToSend.append('participant_id', formData.participant_id);
//       formDataToSend.append('title', formData.title);
//       formDataToSend.append('description', formData.course_name);
//       formDataToSend.append('institution', formData.institution);
//       formDataToSend.append('issued_date', formData.issued_date);
      
//       // Koordinat QR
//       formDataToSend.append('qr_x', Math.round(selectedArea.original.x1));
//       formDataToSend.append('qr_y', Math.round(selectedArea.original.y1));
//       formDataToSend.append('qr_size', Math.round(Math.min(
//         selectedArea.original.width,
//         selectedArea.original.height
//       )));
      
//       formDataToSend.append('certificate_image', certificateImage);

//       const response = await adminApi.createCertificateSingle(formDataToSend);
      
//       if (response.data.success) {
//         setResult(response.data);
//       }
//     } catch (err) {
//       console.error('Error:', err);
//       setError(err.response?.data?.detail || err.message || 'Gagal membuat sertifikat. Silakan coba lagi');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleReset = () => {
//     setResult(null);
//     setOcrResult(null);
//     setSelectedArea(null);
//     setCertificateImage(null);
//     setImagePreview(null);
//     setError('');
//     setFormData({
//       participant_id: '',
//       title: '',
//       institution: '',
//       course_name: '',
//       issued_date: new Date().toISOString().split('T')[0]
//     });
//   };

//   const getSelectedParticipant = () => {
//     return participants.find(p => p.id?.toString() === formData.participant_id);
//   };

//   // ========== SUCCESS VIEW ==========
//   if (result) {
//     return (
//       <div className="min-vh-100 bg-light py-4 py-md-5">
//         <div className="container py-3 py-md-4">
//           <div className="card border-0 shadow-lg">
//             <div className="card-body p-4 p-md-5 text-center">
//               <div className="mb-4">
//                 <div className="bg-success rounded-circle p-4 d-inline-flex align-items-center justify-content-center" 
//                      style={{width: '96px', height: '96px'}}>
//                   <CheckCircle color="white" size={48} />
//                 </div>
//               </div>
              
//               <h2 className="h4 fw-bold text-success mb-2">Sertifikat berhasil dibuat</h2>
//               <p className="text-muted mb-4">
//                 ID: <code className="bg-light px-2 py-1 rounded border">{result.certificate_id}</code>
//               </p>

//               {/* Info Cards */}
//               <div className="row g-3 justify-content-center mb-4">
//                 <div className="col-md-4">
//                   <div className="card h-100 border-primary">
//                     <div className="card-body">
//                       <h6 className="text-primary">Algoritma Hash</h6>
//                       <p className="mb-0">{result.hash_algorithm}</p>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="col-md-4">
//                   <div className="card h-100 border-primary">
//                     <div className="card-body">
//                       <h6 className="text-primary">Algoritma Signature</h6>
//                       <p className="mb-0">{result.signature_algorithm}</p>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="col-md-4">
//                   <div className="card h-100 border-primary">
//                     <div className="card-body">
//                       <h6 className="text-primary">Posisi QR</h6>
//                       <p className="mb-0">
//                         ({result.qr_position.x}, {result.qr_position.y})<br/>
//                         <small>{result.qr_position.size}×{result.qr_position.size}px</small>
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Download Links */}
//               <div className="row g-3 justify-content-center mb-5">
//                 <div className="col-md-5">
//                   <a
//                     href={`http://localhost:8000${result.files.certificate_url}`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="btn btn-outline-primary w-100 py-3"
//                   >
//                     <Upload size={18} className="mb-1" />
//                     <div className="fw-semibold">Lihat Sertifikat</div>
//                   </a>
//                 </div>
//                 {/* <div className="col-md-5">
//                   <a
//                     href={`http://localhost:8000${result.files.qr_url}`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="btn btn-outline-secondary w-100 py-3"
//                   >
//                     <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="mb-1">
//                       <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10 1a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v1h8V3zm0 3H4v2h8V6zm0 3H4v4h8V9z"/>
//                     </svg>
//                     <div className="fw-semibold">Lihat Kode QR</div>
//                   </a>
//                 </div> */}
//               </div>

//               {/* Action Buttons */}
//               <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
//                 <button
//                   onClick={handleReset}
//                   className="btn btn-outline-secondary btn-lg px-4"
//                 >
//                   Buat Sertifikat Lain
//                 </button>
//                 <Link
//                   to="/admin/dashboard"
//                   className="btn btn-primary btn-lg px-4"
//                 >
//                   Kembali ke Dasbor
//                 </Link>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // ========== MAIN FORM VIEW ==========
//   return (
//     <div className="min-vh-100 bg-light py-4 py-md-5">
//       <div className="container py-3 py-md-4">
        
//         {/* Back Button */}
//         <div className="mb-4">
//           <Link 
//             to="/admin/dashboard" 
//             className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
//           >
//             <ArrowLeft size={14} />
//             <span>Kembali</span>
//           </Link>
//         </div>

//         {/* Header */}
//         <div className="text-center mb-4 mb-md-5">
//           <h1 className="display-6 fw-bold text-dark mb-2">Buat Sertifikat</h1>
//           <p className="text-muted fs-6">
//             Unggah gambar sertifikat, sistem akan menambahkan kode QR secara otomatis
//           </p>
//         </div>

//         {/* Main Form Card */}
//         <div className="card border-0 shadow-lg">
//           <div className="card-body p-4 p-md-5">
            
//             <form onSubmit={handleSubmit}>
//               <div className="row g-4">
                
//                 {/* LEFT COLUMN: Image Upload & OCR */}
//                 <div className="col-lg-7">
//                   <div className="card border-primary shadow-sm h-100">
//                     <div className="card-header bg-primary text-white py-3">
//                       <h5 className="card-title mb-0 d-flex align-items-center gap-2">
//                         <ImageIcon size={18} />
//                         Unggah Sertifikat & Pilih Area QR
//                       </h5>
//                     </div>
//                     <div className="card-body">
//                       <p className="text-muted small mb-3">
//                         <strong>Petunjuk:</strong> Unggah gambar sertifikat, sistem akan otomatis membaca teks (OCR), menghitung hash SHA-512, dan Anda hanya perlu memilih area untuk kode QR.
//                       </p>
                      
//                       <ImageDragDrop 
//                         onImageUploaded={handleImageUpload}
//                         onAreaSelected={handleAreaSelected}
//                         enableSelection={true}
//                         showPreview={true}
//                       />
                      
//                       {/* OCR Loading */}
//                       {extracting && (
//                         <div className="d-flex align-items-center gap-2 text-primary mt-3">
//                           <div className="spinner-border spinner-border-sm" role="status" />
//                           <small>Mengekstrak teks dengan OCR...</small>
//                         </div>
//                       )}
                      
//                       {/* OCR Result */}
//                       {ocrResult && (
//                         <div className="mt-3 p-3 bg-light rounded border border-success">
//                           <div className="d-flex align-items-center gap-2 mb-2">
//                             <CheckCircle size={16} className="text-success" />
//                             <small className="text-success fw-semibold">Teks berhasil diekstrak</small>
//                           </div>
//                           <small className="text-muted d-block">
//                             Hash SHA-512: <code className="bg-white px-2 py-1 rounded border">{ocrResult.hash.substring(0, 24)}...</code>
//                           </small>
//                           <small className="text-muted d-block mt-1">
//                             Karakter: {ocrResult.preview?.length || 0}
//                             {ocrResult.is_mock && <span className="text-warning ms-2">(Mode Simulasi)</span>}
//                           </small>
//                         </div>
//                       )}
                      
//                       {/* Selected Area */}
//                       {selectedArea && (
//                         <div className="mt-3 p-3 bg-light border border-primary rounded">
//                           <div className="d-flex align-items-center gap-2 mb-1">
//                             <CheckCircle size={14} className="text-primary" />
//                             <small className="text-dark fw-semibold">Area QR dipilih</small>
//                           </div>
//                           <small className="text-muted d-block">
//                             Ukuran: {Math.round(selectedArea.original.width)}×{Math.round(selectedArea.original.height)}px
//                           </small>
//                           <small className="text-muted d-block">
//                             Posisi: ({Math.round(selectedArea.original.x1)}, {Math.round(selectedArea.original.y1)})
//                           </small>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {/* RIGHT COLUMN: Form Details */}
//                 <div className="col-lg-5">
//                   <div className="card border-0 shadow-sm h-100 bg-light">
//                     <div className="card-header bg-white border-bottom py-3">
//                       <h5 className="card-title mb-0 d-flex align-items-center gap-2 text-dark">
//                         <FileText size={18} />
//                         Detail Sertifikat
//                       </h5>
//                     </div>
//                     <div className="card-body">
                      
//                       {/* Participant Select */}
//                       <div className="mb-3">
//                         <label className="form-label fw-medium small">
//                           <User size={14} className="me-1" />
//                           Pilih Peserta <span className="text-danger">*</span>
//                         </label>
                        
//                         {loadingParticipants ? (
//                           <div className="input-group input-group-sm">
//                             <span className="input-group-text bg-light">
//                               <Loader2 className="animate-spin text-primary" size={14} />
//                             </span>
//                             <input type="text" className="form-control" value="Memuat..." readOnly disabled />
//                           </div>
//                         ) : participants.length === 0 ? (
//                           <div className="alert alert-warning py-2 small" role="alert">
//                             <strong>Belum ada data peserta</strong><br/>
//                             <small>Buat peserta terlebih dahulu di menu Kelola Peserta</small>
//                           </div>
//                         ) : (
//                           <select
//                             value={formData.participant_id}
//                             onChange={(e) => setFormData({...formData, participant_id: e.target.value})}
//                             className="form-select"
//                             required
//                           >
//                             <option value="">-- Pilih Peserta --</option>
//                             {participants.map((p) => (
//                               <option key={p.id} value={p.id}>
//                                 {p.full_name} • {p.username}
//                               </option>
//                             ))}
//                           </select>
//                         )}
//                       </div>

//                       {/* Certificate Title */}
//                       <div className="mb-3">
//                         <label className="form-label fw-medium small">
//                           <FileText size={14} className="me-1" />
//                           Judul Sertifikat <span className="text-danger">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           value={formData.title}
//                           onChange={(e) => setFormData({...formData, title: e.target.value})}
//                           className="form-control"
//                           placeholder="Contoh: Sertifikat Kompetensi Web Development"
//                           required
//                         />
//                       </div>

//                       {/* Institution */}
//                       <div className="mb-3">
//                         <label className="form-label fw-medium small">
//                           <Building size={14} className="me-1" />
//                           Institusi
//                         </label>
//                         <input
//                           type="text"
//                           value={formData.institution}
//                           onChange={(e) => setFormData({...formData, institution: e.target.value})}
//                           className="form-control"
//                           placeholder="Universitas / Perusahaan"
//                         />
//                       </div>

//                       {/* Course Name */}
//                       <div className="mb-3">
//                         <label className="form-label fw-medium small">
//                           <BookOpen size={14} className="me-1" />
//                           Deskripsi
//                         </label>
//                         <input
//                           type="text"
//                           value={formData.course_name}
//                           onChange={(e) => setFormData({...formData, course_name: e.target.value})}
//                           className="form-control"
//                           placeholder="Deskripsi"
//                         />
//                       </div>

//                       {/* Issued Date */}
//                       <div className="mb-3">
//                         <label className="form-label fw-medium small">
//                           <Calendar size={14} className="me-1" />
//                           Tanggal Diterbitkan <span className="text-danger">*</span>
//                         </label>
//                         <input
//                           type="date"
//                           value={formData.issued_date}
//                           onChange={(e) => setFormData({...formData, issued_date: e.target.value})}
//                           className="form-control"
//                           required
//                         />
//                       </div>

//                     </div>
//                   </div>
//                 </div>

//               </div>

//               {/* Error Alert */}
//               {error && (
//                 <div className="alert alert-danger d-flex align-items-start gap-2 mt-4" role="alert">
//                   <span className="small">{error}</span>
//                 </div>
//               )}

//               {/* Submit Button */}
//               <div className="d-flex justify-content-end pt-4 mt-4 border-top">
//                 <button
//                   type="submit"
//                   disabled={loading || !certificateImage || !selectedArea || !formData.participant_id || extracting}
//                   className="btn btn-success btn-lg px-5 d-flex align-items-center gap-2"
//                 >
//                   {loading ? (
//                     <>
//                       <span className="spinner-border spinner-border-sm" role="status" />
//                       Sedang memproses...
//                     </>
//                   ) : (
//                     <>
//                       <CheckCircle size={20} />
//                       Buat Sertifikat
//                     </>
//                   )}
//                 </button>
//               </div>

//             </form>
//           </div>
//         </div>

//         {/* Tips */}
//         <p className="text-center text-muted small mt-4">
//           <strong>Tips:</strong> Pastikan gambar sertifikat jelas agar proses OCR akurat. 
//           Pilih area QR yang tidak menutupi informasi penting.
//         </p>

//       </div>
//     </div>
//   );
// };

// export default CertificateCreator;