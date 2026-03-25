import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ImageDragDrop from '../shared/ImageDragDrop';
import { adminApi } from '../../services/api';
import { Upload, ArrowLeft, CheckCircle, Loader2, User, Building, BookOpen, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const CertificateCreator = () => {
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    participant_id: '',
    title: '',
    institution: '',
    course_name: '',
    issued_date: new Date().toISOString().split('T')[0]
  });
  
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [certificateImage, setCertificateImage] = useState(null);
  const [templateImage, setTemplateImage] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [ocrPreview, setOcrPreview] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      setLoadingParticipants(true);
      const response = await adminApi.getParticipants();
      setParticipants(response.data);
    } catch (err) {
      console.error('Failed to fetch participants:', err);
      setError('Gagal memuat daftar participant. Silakan refresh halaman.');
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleCertificateUpload = async (file, info) => {
    setCertificateImage(file);
    setOcrPreview(null);
    setExtracting(true);
    try {
      setOcrPreview({
        text: 'Preview text extracted',
        hash: 'mock_hash_' + Math.random().toString(36).substring(7),
        preview: 'Text extracted from certificate...',
        is_mock: true
      });
    } catch (err) {
      console.error('OCR preview error:', err);
    } finally {
      setExtracting(false);
    }
  };

  const handleTemplateUpload = (file, info) => {
    setTemplateImage(file);
  };

  const handleAreaSelected = (area) => {
    setSelectedArea(area);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!certificateImage || !templateImage) {
      setError('Harap upload kedua gambar: sertifikat dan template!');
      return;
    }
    if (!selectedArea) {
      setError('Harap pilih area untuk QR Code pada template!');
      return;
    }
    if (!formData.participant_id) {
      setError('Harap pilih participant!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('participant_id', formData.participant_id);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.course_name);
      formDataToSend.append('institution', formData.institution);
      formDataToSend.append('issued_date', formData.issued_date);
      formDataToSend.append('qr_x', Math.round(selectedArea.original.x1));
      formDataToSend.append('qr_y', Math.round(selectedArea.original.y1));
      formDataToSend.append('qr_size', Math.round(Math.min(
        selectedArea.original.width,
        selectedArea.original.height
      )));
      formDataToSend.append('certificate_image', certificateImage);
      formDataToSend.append('template_file', templateImage);

      const response = await adminApi.createCertificate(formDataToSend);
      if (response.data.success) {
        setResult(response.data);
        setStep(3);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.detail || err.message || 'Gagal membuat sertifikat');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setResult(null);
    setOcrPreview(null);
    setSelectedArea(null);
    setCertificateImage(null);
    setTemplateImage(null);
    setError('');
    setFormData({
      participant_id: '',
      title: '',
      institution: '',
      course_name: '',
      issued_date: new Date().toISOString().split('T')[0]
    });
  };

  // const handleBack = () => {
  //   if (window.history.length > 1) {
  //     navigate(-1);
  //   } else {
  //     // Fallback: ke home page
  //     navigate('/');
  //   }
  // };

  const getSelectedParticipant = () => {
    return participants.find(p => p.id?.toString() === formData.participant_id);
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

        {/* Header Section */}
        <div className="text-center mb-4 mb-md-5">
          {/* <span className="badge bg-primary px-3 py-2 mb-3">
            <Upload size={14} className="me-1" />
            Certificate Creator
          </span> */}
          {/* <button 
            onClick={handleBack}
            className="btn btn-link text-decoration-none text-muted d-flex align-items-center gap-2 mb-4 p-0 hover-text-dark"
          >
            <ArrowLeft size={16} />
            <span className="small fw-medium">Kembali</span>
          </button> */}
          <h1 className="display-6 fw-bold text-dark mb-2">Buat Sertifikat Baru</h1>
          <p className="text-muted fs-6">Upload dan sign sertifikat dengan EdDSA secara aman dan terverifikasi</p>
        </div>

        {/* Step Progress Indicator */}
        <div className="d-flex justify-content-center mb-4 mb-md-5">
          <nav aria-label="Progress steps">
            <ol className="breadcrumb justify-content-center mb-0 p-3 bg-white rounded-3 shadow-sm border">
              {[
                { num: 1, label: 'Upload' },
                { num: 2, label: 'Detail' },
                { num: 3, label: 'Selesai' }
              ].map((s, idx) => (
                <React.Fragment key={s.num}>
                  <li className={`breadcrumb-item ${step >= s.num ? 'active' : ''}`}>
                    <span className={`d-flex align-items-center gap-2 ${step >= s.num ? 'text-primary fw-semibold' : 'text-muted'}`}>
                      <span className={`badge rounded-circle d-flex align-items-center justify-content-center ${
                        step > s.num ? 'bg-success' : step === s.num ? 'bg-primary' : 'bg-secondary'
                      }`} style={{width: '28px', height: '28px', fontSize: '0.75rem'}}>
                        {step > s.num ? <CheckCircle size={14} color="white" /> : s.num}
                      </span>
                      <span className="d-none d-md-inline small">{s.label}</span>
                    </span>
                  </li>
                  {idx < 2 && (
                    <li className="breadcrumb-item text-muted d-none d-md-block">
                      <span className={step > s.num ? 'text-primary' : ''}>→</span>
                    </li>
                  )}
                </React.Fragment>
              ))}
            </ol>
          </nav>
        </div>

        {/* Main Card */}
        <div className="card border-0 shadow-lg">
          <div className="card-body p-4 p-md-5">
            
            {/* ========== STEP 1: UPLOAD ========== */}
            {step === 1 && (
              <>
                <h2 className="h5 fw-semibold text-dark mb-4 d-flex align-items-center gap-2">
                  <span className="badge bg-primary rounded-pill px-3">1</span>
                  Pilih Participant & Upload Gambar
                </h2>
                
                {/* Participant Select */}
                <div className="mb-4">
                  <label className="form-label fw-medium">
                    Pilih Participant <span className="text-danger">*</span>
                  </label>
                  
                  {loadingParticipants ? (
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <Loader2 className="animate-spin text-primary" size={16} />
                      </span>
                      <input type="text" className="form-control" value="Memuat daftar participant..." readOnly disabled />
                    </div>
                  ) : participants.length === 0 ? (
                    <div className="alert alert-warning d-flex align-items-start gap-2" role="alert">
                      <span className="fs-5">⚠️</span>
                      <div>
                        <strong className="d-block">Tidak ada participant tersedia</strong>
                        <small className="text-muted">Silakan buat participant terlebih dahulu di menu <strong>Kelola Participant</strong>.</small>
                      </div>
                    </div>
                  ) : (
                    <div className="position-relative">
                      <User className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
                      <select
                        value={formData.participant_id}
                        onChange={(e) => setFormData({...formData, participant_id: e.target.value})}
                        className="form-select form-select-lg ps-5"
                        required
                      >
                        <option value="">-- Pilih Participant --</option>
                        {participants.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name} • {p.username} • {p.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <small className="text-muted">
                    Total participant: <strong className="text-dark">{participants.length}</strong>
                  </small>
                </div>

                {/* Certificate Title */}
                <div className="mb-4">
                  <label className="form-label fw-medium">
                    Judul Sertifikat <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="form-control form-control-lg"
                    placeholder="Contoh: Sertifikat Kompetensi Web Development"
                    required
                  />
                </div>

                {/* Image Upload Cards */}
                <div className="row g-4 mb-4">
                  {/* Certificate Image */}
                  <div className="col-md-6">
                    <div className="card h-100 border-primary shadow-sm">
                      <div className="card-header bg-primary text-white py-3">
                        <h5 className="card-title mb-0 d-flex align-items-center gap-2">
                          <Upload size={18} />
                          Gambar Sertifikat
                          <small className="text-white-50 fw-normal ms-auto">(OCR)</small>
                        </h5>
                      </div>
                      <div className="card-body">
                        <ImageDragDrop 
                          onImageUploaded={handleCertificateUpload}
                          onAreaSelected={() => {}}
                        />
                        {extracting && (
                          <div className="d-flex align-items-center gap-2 text-primary mt-3">
                            <div className="spinner-border spinner-border-sm" role="status" />
                            <small>Extracting text...</small>
                          </div>
                        )}
                        {ocrPreview && (
                          <div className="mt-3 p-3 bg-light rounded border">
                            <small className="text-muted d-block mb-1">
                              Hash: <code className="bg-white px-2 py-1 rounded border">{ocrPreview.hash.substring(0, 16)}...</code>
                            </small>
                            <p className="small text-dark mb-0">{ocrPreview.preview}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Template Image */}
                  <div className="col-md-6">
                    <div className="card h-100 border-success shadow-sm">
                      <div className="card-header bg-success text-white py-3">
                        <h5 className="card-title mb-0 d-flex align-items-center gap-2">
                          <Upload size={18} />
                          Template Sertifikat
                          <small className="text-white-50 fw-normal ms-auto">(QR Position)</small>
                        </h5>
                      </div>
                      <div className="card-body">
                        <ImageDragDrop 
                          onImageUploaded={handleTemplateUpload}
                          onAreaSelected={handleAreaSelected}
                          enableSelection={true}
                        />
                        {selectedArea && (
                          <div className="mt-3 p-3 bg-light border border-success rounded">
                            <p className="text-dark small mb-1 fw-semibold">
                              <CheckCircle size={14} className="me-1 text-success" />
                              Area dipilih: {Math.round(selectedArea.original.width)}×{Math.round(selectedArea.original.height)}px
                            </p>
                            <small className="text-muted d-block ms-4">
                              Position: ({Math.round(selectedArea.original.x1)}, {Math.round(selectedArea.original.y1)})
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="alert alert-danger d-flex align-items-start gap-2 mb-4" role="alert">
                    <span className="fs-5">❌</span>
                    <span className="small">{error}</span>
                  </div>
                )}

                {/* Next Button */}
                <div className="d-flex justify-content-end pt-3 border-top">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!certificateImage || !templateImage || !selectedArea || !formData.participant_id || loadingParticipants}
                    className="btn btn-primary btn-lg px-4 d-flex align-items-center gap-2"
                  >
                    Lanjutkan
                    <ArrowLeft size={18} style={{transform: 'rotate(180deg)'}} />
                  </button>
                </div>
              </>
            )}

            {/* ========== STEP 2: DETAILS ========== */}
            {step === 2 && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2 className="h5 fw-semibold text-dark d-flex align-items-center gap-2">
                    <span className="badge bg-primary rounded-pill px-3">2</span>
                    Detail Sertifikat
                  </h2>
                  <button 
                    onClick={() => setStep(1)}
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                  >
                    <ArrowLeft size={14} /> Kembali
                  </button>
                </div>

                {/* Selected Participant Card */}
                {getSelectedParticipant() && (
                  <div className="card bg-light border-primary mb-4">
                    <div className="card-body py-3">
                      <small className="text-primary fw-semibold text-uppercase">Participant Terpilih</small>
                      <div className="d-flex align-items-center gap-3 mt-2">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" 
                             style={{width: '48px', height: '48px', fontSize: '1.25rem'}}>
                          {getSelectedParticipant().full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="fw-semibold text-dark mb-0">{getSelectedParticipant().full_name}</p>
                          <small className="text-muted">@{getSelectedParticipant().username}</small>
                          <br />
                          <small className="text-muted">{getSelectedParticipant().email}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Institusi</label>
                    <div className="position-relative">
                      <Building className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
                      <input
                        type="text"
                        value={formData.institution}
                        onChange={(e) => setFormData({...formData, institution: e.target.value})}
                        className="form-control form-control-lg ps-5"
                        placeholder="Universitas / Perusahaan"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Nama Kursus/Event</label>
                    <div className="position-relative">
                      <BookOpen className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
                      <input
                        type="text"
                        value={formData.course_name}
                        onChange={(e) => setFormData({...formData, course_name: e.target.value})}
                        className="form-control form-control-lg ps-5"
                        placeholder="Nama kursus atau event"
                      />
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-medium">
                      Tanggal Diterbitkan <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                      <Calendar className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
                      <input
                        type="date"
                        value={formData.issued_date}
                        onChange={(e) => setFormData({...formData, issued_date: e.target.value})}
                        className="form-control form-control-lg ps-5"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="alert alert-danger d-flex align-items-start gap-2 mt-4" role="alert">
                    <span className="fs-5">❌</span>
                    <span className="small">{error}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="d-flex justify-content-between align-items-center mt-5 pt-4 border-top">
                  <button
                    onClick={() => setStep(1)}
                    className="btn btn-outline-secondary px-4"
                  >
                    ← Kembali
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn btn-success btn-lg px-4 d-flex align-items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Buat & Sign Sertifikat
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* ========== STEP 3: SUCCESS ========== */}
            {step === 3 && result && (
              <div className="text-center py-4">
                {/* Success Animation */}
                <div className="mb-4">
                  <div className="bg-success rounded-circle p-4 d-inline-flex align-items-center justify-content-center border border-success" 
                       style={{width: '96px', height: '96px'}}>
                    <CheckCircle color="white" size={48} />
                  </div>
                </div>
                
                <h2 className="h4 fw-bold text-success mb-2">Sertifikat Berhasil Dibuat!</h2>
                <p className="text-muted mb-4">
                  ID: <code className="bg-light px-2 py-1 rounded border text-dark">{result.certificate_id}</code>
                </p>

                {/* Result Links */}
                <div className="row g-3 justify-content-center mb-5">
                  <div className="col-md-5">
                    <a
                      href={`http://localhost:8000${result.files.certificate_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card text-decoration-none h-100 border-primary text-dark"
                    >
                      <div className="card-body py-4">
                        <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                             style={{width: '48px', height: '48px'}}>
                          <Upload color="white" size={20} />
                        </div>
                        <h6 className="card-title fw-semibold mb-1 text-dark">Lihat Sertifikat</h6>
                        <p className="card-text small text-muted mb-0">PNG dengan QR Code terintegrasi</p>
                      </div>
                    </a>
                  </div>
                  <div className="col-md-5">
                    <a
                      href={`http://localhost:8000${result.files.qr_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card text-decoration-none h-100 border-secondary text-dark"
                    >
                      <div className="card-body py-4">
                        <div className="bg-secondary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                             style={{width: '48px', height: '48px'}}>
                          <svg color="white" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10 1a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v1h8V3zm0 3H4v2h8V6zm0 3H4v4h8V9z"/>
                          </svg>
                        </div>
                        <h6 className="card-title fw-semibold mb-1 text-dark">Lihat QR Code</h6>
                        <p className="card-text small text-muted mb-0">Untuk verifikasi keaslian sertifikat</p>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                  <button
                    onClick={handleReset}
                    className="btn btn-outline-secondary btn-lg px-4"
                  >
                    Buat Sertifikat Lain
                  </button>
                  <Link
                    to="/admin/dashboard"
                    className="btn btn-primary btn-lg px-4"
                  >
                    Kembali ke Dashboard
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer Hint */}
        <p className="text-center text-muted small mt-4">
          💡 Tips: Pastikan gambar template memiliki resolusi yang cukup untuk akurasi penempatan QR Code
        </p>

      </div>
    </div>
  );
};

export default CertificateCreator;