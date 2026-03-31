// import React, { useState } from 'react';
// import { certificateApi } from '../services/api';

// const VerificationForm = () => {
//   const [file, setFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState('');

//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//     setResult(null);
//     setError('');
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

//       const response = await certificateApi.verifyCertificate(formData);
//       setResult(response.data);
      
//     } catch (err) {
//       console.error('Verification error:', err);
//       setError(err.response?.data?.detail || 'Verifikasi gagal');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <section className="pt-100 pb-100">
//       <div className="container">
//         <div className="row justify-content-center">
//           <div className="col-lg-8">
            
//             {/* Header */}
//             <div className="text-center mb-50">
//               <h2 className="mb-15 wow fadeInUp" data-wow-delay=".2s">Verifikasi Sertifikat</h2>
//               <p className="wow fadeInUp" data-wow-delay=".4s">
//                 Upload file sertifikat untuk memverifikasi keasliannya menggunakan EdDSA
//               </p>
//             </div>

//             {/* Main Card */}
//             <div className="card border-0 shadow-lg wow fadeInUp" data-wow-delay=".3s">
//               <div className="card-body p-5">
                
//                 {/* Upload Area */}
//                 <div 
//                   className="upload-area mb-4 text-center p-5"
//                   onClick={() => document.getElementById('certFile').click()}
//                 >
//                   <div className="w-20 h-20 bg-purple-100 rounded-circle d-flex align-items-center justify-content-center text-4xl mx-auto mb-3">
//                     📁
//                   </div>
//                   <h4 className="mb-2">{file ? file.name : 'Pilih File Sertifikat'}</h4>
//                   <p className="text-muted mb-3">
//                     {file ? 'Klik untuk ganti file' : 'Drag & drop atau klik untuk upload gambar sertifikat'}
//                   </p>
//                   <input 
//                     type="file" 
//                     id="certFile" 
//                     className="d-none" 
//                     accept="image/*" 
//                     onChange={handleFileChange}
//                   />
//                   {!file && (
//                     <button type="button" className="button radius-30">
//                       <i className="lni lni-upload me-2"></i>Pilih File
//                     </button>
//                   )}
//                 </div>

//                 {error && (
//                   <div className="alert alert-danger mb-4">
//                     <i className="lni lni-warning me-2"></i>{error}
//                   </div>
//                 )}

//                 <button
//                   onClick={handleVerify}
//                   disabled={loading || !file}
//                   className="button button-lg radius-30 w-100"
//                 >
//                   {loading ? (
//                     <span>
//                       <span className="spinner-border spinner-border-sm me-2"></span>
//                       Memverifikasi...
//                     </span>
//                   ) : (
//                     <span><i className="lni lni-search me-2"></i>Verifikasi Sekarang</span>
//                   )}
//                 </button>
//               </div>

//               {/* Result */}
//               {result && (
//                 <div className={`card-footer p-5 ${result.valid ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`}>
//                   <div className="text-center mb-4">
//                     <div className={`d-inline-flex align-items-center justify-content-center rounded-circle text-white mb-3 ${result.valid ? 'bg-success' : 'bg-danger'}`} 
//                          style={{width: '80px', height: '80px', fontSize: '2.5rem'}}>
//                       {result.valid ? '✅' : '❌'}
//                     </div>
//                     <h3 className={result.valid ? 'text-success' : 'text-danger'}>
//                       {result.valid ? 'Sertifikat VALID' : 'Sertifikat TIDAK VALID'}
//                     </h3>
//                     <p className="text-muted">{result.message}</p>
//                   </div>

//                   {result.certificate && (
//                     <div className="alert alert-light mb-3">
//                       <h5 className="mb-3"><i className="lni lni-certificate me-2"></i>Detail Sertifikat</h5>
//                       <div className="row small">
//                         <div className="col-sm-6 mb-2">
//                           <strong>Nama:</strong> {result.certificate.recipient_name}
//                         </div>
//                         <div className="col-sm-6 mb-2">
//                           <strong>Email:</strong> {result.certificate.recipient_email}
//                         </div>
//                         <div className="col-sm-6 mb-2">
//                           <strong>Institusi:</strong> {result.certificate.institution || '-'}
//                         </div>
//                         <div className="col-sm-6 mb-2">
//                           <strong>Tanggal:</strong> {result.certificate.issued_date}
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {result.integrity && (
//                     <div className="alert alert-info mb-0">
//                       <h5 className="mb-2"><i className="lni lni-shield me-2"></i>Integrity Check</h5>
//                       <ul className="list-unstyled small mb-0">
//                         <li>
//                           <i className={`lni ${result.integrity.hash_match ? 'lni-checkmark text-success' : 'lni-cross-circle text-danger'} me-2`}></i>
//                           Hash Match: {result.integrity.hash_match ? 'Valid' : 'Invalid'}
//                         </li>
//                         <li>
//                           <i className={`lni ${result.integrity.signature_valid ? 'lni-checkmark text-success' : 'lni-cross-circle text-danger'} me-2`}></i>
//                           Signature: {result.integrity.signature_valid ? 'Valid' : 'Invalid'} 
//                         </li>
//                       </ul>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>

//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default VerificationForm;