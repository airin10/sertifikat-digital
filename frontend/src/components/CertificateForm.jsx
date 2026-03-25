// import React, { useState } from 'react';
// import ImageDragDrop from './ImageDragDrop';
// import { certificateApi } from '../services/api';

// const CertificateForm = () => {
//   // ==================== STATE ====================
//   const [step, setStep] = useState(1);
  
//   const [formData, setFormData] = useState({
//     recipient_name: '',
//     recipient_email: '',
//     institution: '',
//     course_name: '',
//     issued_date: new Date().toISOString().split('T')[0]
//   });
  
//   const [certificateImage, setCertificateImage] = useState(null);
//   const [templateImage, setTemplateImage] = useState(null);
//   const [selectedArea, setSelectedArea] = useState(null);
  
//   const [ocrPreview, setOcrPreview] = useState(null);
//   const [extracting, setExtracting] = useState(false);
  
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState('');

//   // ==================== HANDLERS ====================
  
//   const handleCertificateUpload = async (file, info) => {
//     setCertificateImage(file);
//     setOcrPreview(null);
    
//     setExtracting(true);
//     try {
//       const formData = new FormData();
//       formData.append('file', file);
      
//       const response = await certificateApi.extractText(formData);
//       if (response.data.success) {
//         setOcrPreview({
//           text: response.data.text,
//           hash: response.data.hash,
//           preview: response.data.preview,
//           is_mock: response.data.is_mock
//         });
//       }
//     } catch (err) {
//       console.error('OCR preview error:', err);
//     } finally {
//       setExtracting(false);
//     }
//   };

//   const handleTemplateUpload = (file, info) => {
//     setTemplateImage(file);
//   };

//   const handleAreaSelected = (area) => {
//     setSelectedArea(area);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!certificateImage || !templateImage) {
//       setError('Harap upload kedua gambar: sertifikat dan template!');
//       return;
//     }
//     if (!selectedArea) {
//       setError('Harap pilih area untuk QR Code pada template!');
//       return;
//     }
//     if (!formData.recipient_name || !formData.recipient_email) {
//       setError('Nama dan email penerima wajib diisi!');
//       return;
//     }

//     setLoading(true);
//     setError('');

//     try {
//       const formDataToSend = new FormData();
      
//       formDataToSend.append('recipient_name', formData.recipient_name);
//       formDataToSend.append('recipient_email', formData.recipient_email);
//       formDataToSend.append('institution', formData.institution || '');
//       formDataToSend.append('course_name', formData.course_name || '');
//       formDataToSend.append('issued_date', formData.issued_date);
      
//       formDataToSend.append('qr_x', selectedArea.original.x1);
//       formDataToSend.append('qr_y', selectedArea.original.y1);
//       formDataToSend.append('qr_size', Math.min(
//         selectedArea.original.width,
//         selectedArea.original.height
//       ));
      
//       formDataToSend.append('certificate_image', certificateImage);
//       formDataToSend.append('template_file', templateImage);

//       const response = await certificateApi.createCertificate(formDataToSend);
      
//       if (response.data.success) {
//         setResult(response.data);
//         setStep(3);
//       }
      
//     } catch (err) {
//       console.error('Error:', err);
//       setError(err.response?.data?.detail || err.message || 'Gagal membuat sertifikat');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleReset = () => {
//     setStep(1);
//     setResult(null);
//     setOcrPreview(null);
//     setSelectedArea(null);
//     setCertificateImage(null);
//     setTemplateImage(null);
//     setError('');
//     setFormData({
//       recipient_name: '',
//       recipient_email: '',
//       institution: '',
//       course_name: '',
//       issued_date: new Date().toISOString().split('T')[0]
//     });
//   };

//   // ==================== RENDER ====================
  
//   return (
//     <section className="pt-100 pb-100">
//       <div className="container">
//         <div className="row justify-content-center">
//           <div className="col-lg-10">
            
//             {/* Header */}
//             <div className="text-center mb-50">
//               <h2 className="mb-15 wow fadeInUp" data-wow-delay=".2s">Buat Sertifikat Digital</h2>
//               <p className="wow fadeInUp" data-wow-delay=".4s">
//                 Upload sertifikat & template, sistem akan auto-OCR dan sign dengan EdDSA
//               </p>
//             </div>

//             {/* Step Indicator */}
//             <div className="row justify-content-center mb-50">
//               <div className="col-lg-8">
//                 <div className="d-flex justify-content-center align-items-center">
//                   {[1, 2, 3].map((s, idx) => (
//                     <React.Fragment key={s}>
//                       <div className={`d-flex align-items-center justify-content-center rounded-circle fw-bold ${step >= s ? 'bg-primary text-white' : 'bg-light text-muted'}`} 
//                            style={{width: '50px', height: '50px', fontSize: '1.2rem'}}>
//                         {s}
//                       </div>
//                       {idx < 2 && (
//                         <div className={`flex-grow-1 mx-3 ${step > s ? 'bg-primary' : 'bg-light'}`} 
//                              style={{height: '4px', borderRadius: '2px', maxWidth: '100px'}}></div>
//                       )}
//                     </React.Fragment>
//                   ))}
//                 </div>
//                 <div className="d-flex justify-content-between mt-2 px-4" style={{maxWidth: '400px', margin: '0 auto'}}>
//                   <small className={step >= 1 ? 'text-primary fw-bold' : 'text-muted'}>Upload</small>
//                   <small className={step >= 2 ? 'text-primary fw-bold' : 'text-muted'}>Data</small>
//                   <small className={step >= 3 ? 'text-primary fw-bold' : 'text-muted'}>Hasil</small>
//                 </div>
//               </div>
//             </div>

//             {/* Main Card */}
//             <div className="card border-0 shadow-lg wow fadeInUp" data-wow-delay=".3s">
              
//               {/* STEP 1: Upload */}
//               {step === 1 && (
//                 <div className="card-body p-5">
//                   <h3 className="card-title mb-4">Step 1: Upload Gambar</h3>
                  
//                   <div className="row">
//                     {/* Certificate Image */}
//                     <div className="col-md-6 mb-4">
//                       <div className="p-4 bg-light rounded-3 border border-primary border-opacity-25 h-100">
//                         <h5 className="text-primary mb-3"><i className="lni lni-file"></i> Gambar Sertifikat (OCR)</h5>
//                         <p className="small text-muted mb-3">
//                           Gambar ini akan di-OCR untuk ekstrak teks dan hash
//                         </p>
//                         <ImageDragDrop 
//                           onImageUploaded={handleCertificateUpload}
//                           onAreaSelected={() => {}}
//                         />
                        
//                         {extracting && (
//                           <div className="mt-3 alert alert-info d-flex align-items-center">
//                             <div className="spinner-border spinner-border-sm me-2" role="status"></div>
//                             Extracting text...
//                           </div>
//                         )}
                        
//                         {ocrPreview && (
//                           <div className="mt-3 alert alert-light border">
//                             <small className="text-muted d-block mb-1">OCR Preview:</small>
//                             <p className="small text-dark mb-1 line-clamp-2">{ocrPreview.preview}</p>
//                             <small className="text-muted">
//                               Hash: {ocrPreview.hash.substring(0, 16)}...
//                             </small>
//                             {ocrPreview.is_mock && (
//                               <small className="d-block text-warning mt-1">⚠️ Mock OCR mode</small>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     {/* Template Image */}
//                     <div className="col-md-6 mb-4">
//                       <div className="p-4 bg-light rounded-3 border border-success border-opacity-25 h-100">
//                         <h5 className="text-success mb-3"><i className="lni lni-layout"></i> Template (QR)</h5>
//                         <p className="small text-muted mb-3">
//                           Pilih area untuk menempel QR Code
//                         </p>
//                         <ImageDragDrop 
//                           onImageUploaded={handleTemplateUpload}
//                           onAreaSelected={handleAreaSelected}
//                           enableSelection={true}
//                         />
                        
//                         {selectedArea && (
//                           <div className="mt-3 alert alert-success">
//                             <strong>✅ Area QR dipilih</strong>
//                             <p className="small mb-0">
//                               Posisi: ({selectedArea.original.x1}, {selectedArea.original.y1})<br/>
//                               Ukuran: {selectedArea.original.width} x {selectedArea.original.height} px
//                             </p>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   {error && (
//                     <div className="alert alert-danger mt-3">
//                       <i className="lni lni-warning me-2"></i>{error}
//                     </div>
//                   )}

//                   <div className="d-flex justify-content-end mt-4">
//                     <button
//                       onClick={() => setStep(2)}
//                       disabled={!certificateImage || !templateImage || !selectedArea}
//                       className="button button-lg radius-30"
//                     >
//                       Lanjutkan <i className="lni lni-chevron-right"></i>
//                     </button>
//                   </div>
//                 </div>
//               )}

//               {/* STEP 2: Data */}
//               {step === 2 && (
//                 <div className="card-body p-5">
//                   <div className="d-flex justify-content-between align-items-center mb-4">
//                     <h3 className="card-title mb-0">Step 2: Data Penerima</h3>
//                     <button 
//                       onClick={() => setStep(1)} 
//                       className="btn btn-link text-decoration-none"
//                     >
//                       <i className="lni lni-chevron-left"></i> Kembali
//                     </button>
//                   </div>

//                   <div className="row g-3">
//                     <div className="col-md-6">
//                       <label className="form-label fw-bold">Nama Penerima *</label>
//                       <div className="single-input">
//                         <input
//                           type="text"
//                           value={formData.recipient_name}
//                           onChange={(e) => setFormData({...formData, recipient_name: e.target.value})}
//                           className="form-input"
//                           placeholder="Nama lengkap"
//                         />
//                         <i className="lni lni-user"></i>
//                       </div>
//                     </div>
//                     <div className="col-md-6">
//                       <label className="form-label fw-bold">Email Penerima *</label>
//                       <div className="single-input">
//                         <input
//                           type="email"
//                           value={formData.recipient_email}
//                           onChange={(e) => setFormData({...formData, recipient_email: e.target.value})}
//                           className="form-input"
//                           placeholder="email@example.com"
//                         />
//                         <i className="lni lni-envelope"></i>
//                       </div>
//                     </div>
//                     <div className="col-md-6">
//                       <label className="form-label">Institusi</label>
//                       <div className="single-input">
//                         <input
//                           type="text"
//                           value={formData.institution}
//                           onChange={(e) => setFormData({...formData, institution: e.target.value})}
//                           className="form-input"
//                           placeholder="Universitas/Perusahaan"
//                         />
//                         <i className="lni lni-apartment"></i>
//                       </div>
//                     </div>
//                     <div className="col-md-6">
//                       <label className="form-label">Nama Kursus/Event</label>
//                       <div className="single-input">
//                         <input
//                           type="text"
//                           value={formData.course_name}
//                           onChange={(e) => setFormData({...formData, course_name: e.target.value})}
//                           className="form-input"
//                           placeholder="Nama kursus"
//                         />
//                         <i className="lni lni-book"></i>
//                       </div>
//                     </div>
//                     <div className="col-md-6">
//                       <label className="form-label fw-bold">Tanggal Diterbitkan *</label>
//                       <div className="single-input">
//                         <input
//                           type="date"
//                           value={formData.issued_date}
//                           onChange={(e) => setFormData({...formData, issued_date: e.target.value})}
//                           className="form-input"
//                         />
//                         <i className="lni lni-calendar"></i>
//                       </div>
//                     </div>
//                   </div>

//                   {error && (
//                     <div className="alert alert-danger mt-4">
//                       <i className="lni lni-warning me-2"></i>{error}
//                     </div>
//                   )}

//                   <div className="d-flex justify-content-between mt-4">
//                     <button 
//                       onClick={() => setStep(1)}
//                       className="button radius-30 button-outline"
//                     >
//                       <i className="lni lni-chevron-left"></i> Kembali
//                     </button>
//                     <button
//                       onClick={handleSubmit}
//                       disabled={loading}
//                       className="button button-lg radius-30"
//                     >
//                       {loading ? (
//                         <span>
//                           <span className="spinner-border spinner-border-sm me-2"></span>
//                           Processing...
//                         </span>
//                       ) : (
//                         <span> Buat & Sign Sertifikat</span>
//                       )}
//                     </button>
//                   </div>
//                 </div>
//               )}

//               {/* STEP 3: Result */}
//               {step === 3 && result && (
//                 <div className="card-body p-5 text-center">
//                   <div className="mb-4">
//                     <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success text-white mb-3" 
//                          style={{width: '80px', height: '80px', fontSize: '2.5rem'}}>
//                       🎉
//                     </div>
//                     <h2 className="text-success">Sertifikat Berhasil Dibuat!</h2>
//                     <p className="text-muted">ID: <code>{result.certificate_id}</code></p>
//                   </div>

//                   {/* OCR Result */}
//                   <div className="alert alert-info text-start mb-4">
//                     <h5 className="alert-heading"><i className="lni lni-text-format me-2"></i>Hasil OCR & Sign</h5>
//                     <hr/>
//                     <div className="row">
//                       <div className="col-md-6">
//                         <small className="text-muted d-block">Text Hash (SHA-256):</small>
//                         <code className="small text-break">{result.text_hash}</code>
//                       </div>
//                       {result.ocr_result && (
//                         <div className="col-md-6">
//                           <small className="text-muted d-block">Preview Teks:</small>
//                           <p className="small mb-0">{result.ocr_result.text_preview}</p>
//                           <small className="text-muted">{result.ocr_result.text_length} karakter</small>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Preview Image */}
//                   {result.files?.certificate_url && (
//                     <div className="mb-4">
//                       <h5 className="mb-3">Preview Sertifikat</h5>
//                       <div className="bg-light p-3 rounded-3 d-inline-block">
//                         <img
//                           src={`http://localhost:8000${result.files.certificate_url}`}
//                           alt="Sertifikat"
//                           className="img-fluid rounded-3 shadow"
//                           style={{maxHeight: '400px'}}
//                           onError={(e) => {
//                             e.target.onerror = null;
//                             e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY0NzQ4YiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdhbWJhciBsb2FkIGltYWdlPC90ZXh0Pjwvc3ZnPg==';
//                           }}
//                         />
//                       </div>
//                     </div>
//                   )}

//                   {/* Download Buttons */}
//                   <div className="d-flex justify-content-center gap-3 flex-wrap mb-4">
//                     {result.files?.certificate_url && (
//                       <a
//                         href={`http://localhost:8000${result.files.certificate_url}`}
//                         download={`sertifikat_${result.certificate_id}.png`}
//                         className="button radius-30"
//                         target="_blank"
//                         rel="noopener noreferrer"
//                       >
//                         <i className="lni lni-download me-2"></i>Download Sertifikat
//                       </a>
//                     )}
                    
//                     {result.files?.qr_url && (
//                       <a
//                         href={`http://localhost:8000${result.files.qr_url}`}
//                         download={`qr_${result.certificate_id}.png`}
//                         className="button radius-30 button-outline"
//                         target="_blank"
//                         rel="noopener noreferrer"
//                       >
//                         <i className="lni lni-qr-code me-2"></i>Download QR
//                       </a>
//                     )}
                    
//                     <button 
//                       onClick={handleReset}
//                       className="button radius-30 button-outline"
//                     >
//                       <i className="lni lni-plus me-2"></i>Buat Lagi
//                     </button>
//                   </div>

//                   <div className="alert alert-light text-start small">
//                     <p className="mb-1"><strong>Database ID:</strong> {result.database_id}</p>
//                     <p className="mb-0"><strong>Created:</strong> {new Date(result.created_at).toLocaleString()}</p>
//                   </div>
//                 </div>
//               )}
//             </div>

//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default CertificateForm;