// import React from 'react';
// import { Link } from 'react-router-dom';
// import { CheckCircle, Shield, Zap, FileText, ArrowRight, QrCode } from 'lucide-react';
// import AppHeader from '../shared/AppHeader';

// const PublicHome = () => {
//   const features = [
//     {
//       icon: Shield,
//       title: 'Aman & Terverifikasi',
//       description: 'Setiap sertifikat dilindungi dengan teknologi blockchain dan tanda tangan digital untuk memastikan keaslian.'
//     },
//     {
//       icon: Zap,
//       title: 'Verifikasi Instan',
//       description: 'Cek keaslian sertifikat dalam hitungan detik cukup dengan scan kode QR atau input ID sertifikat.'
//     },
//     {
//       icon: FileText,
//       title: 'Manajemen Mudah',
//       description: 'Kelola, unduh, dan bagikan sertifikat Anda kapan saja dari dashboard pribadi yang intuitif.'
//     }
//   ];

//   const steps = [
//     { step: '1', title: 'Unggah Sertifikat', desc: 'Admin mengunggah template sertifikat peserta' },
//     { step: '2', title: 'Generasi QR', desc: 'Sistem membuat kode QR unik dengan hash digital' },
//     { step: '3', title: 'Distribusi', desc: 'Sertifikat dikirim ke peserta via email/dashboard' },
//     { step: '4', title: 'Verifikasi Publik', desc: 'Siapapun dapat memverifikasi keaslian sertifikat' }
//   ];

//   return (
//     <div className="min-vh-100 bg-white">
//       {/* Header */}
//       <AppHeader />
//       <div className="app-header-spacer" />

//       {/* Hero Section */}
//       <section className="public-hero">
//         <div className="container px-4 py-5 py-md-6">
//           <div className="row align-items-center g-4">
//             <div className="col-lg-6">
//               <div className="public-hero-badge">
//                 <CheckCircle size={16} />
//                 <span>Platform Sertifikat Digital Terpercaya</span>
//               </div>
//               <h1 className="public-hero-title">
//                 Verifikasi Sertifikat <br />
//                 <span className="text-gradient">Lebih Aman & Cepat</span>
//               </h1>
//               <p className="public-hero-subtitle">
//                 Platform manajemen sertifikat digital dengan teknologi blockchain. 
//                 Cegah pemalsuan, mudahkan verifikasi, dan kelola sertifikat Anda dengan percaya diri.
//               </p>
//               <div className="public-hero-actions">
//                 <Link to="/login" className="btn btn-primary btn-lg">
//                   Masuk Sekarang
//                   <ArrowRight size={18} />
//                 </Link>
//                 <Link to="/register" className="btn btn-outline-secondary btn-lg">
//                   Daftar Gratis
//                 </Link>
//               </div>
//               <div className="public-hero-stats">
//                 <div className="stat-item">
//                   <span className="stat-value">10.000+</span>
//                   <span className="stat-label">Sertifikat Diterbitkan</span>
//                 </div>
//                 <div className="stat-item">
//                   <span className="stat-value">99.9%</span>
//                   <span className="stat-label">Tingkat Keaslian</span>
//                 </div>
//               </div>
//             </div>
//             <div className="col-lg-6">
//               <div className="public-hero-visual">
//                 <div className="certificate-preview">
//                   <div className="certificate-header">
//                     <div className="certificate-logo">
//                       <CheckCircle size={20} color="#fff" />
//                     </div>
//                     <span>SERTIFIKAT DIGITAL</span>
//                   </div>
//                   <div className="certificate-body">
//                     <p className="certificate-title">Sertifikat Kompetensi</p>
//                     <p className="certificate-name">Nama Peserta</p>
//                     <p className="certificate-desc">Telah menyelesaikan program pelatihan...</p>
//                     <div className="certificate-qr">
//                       <QrCode size={48} />
//                       <span class="qr-label">Scan untuk verifikasi</span>
//                     </div>
//                   </div>
//                   <div className="certificate-footer">
//                     <span className="certificate-id">ID: CERT-2024-XXXX</span>
//                     <span className="certificate-status active">✓ Terverifikasi</span>
//                   </div>
//                 </div>
//                 <div className="certificate-glow" />
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="public-section bg-light">
//         <div className="container px-4 py-5 py-md-6">
//           <div className="text-center mb-5">
//             <h2 className="section-title">Mengapa Memilih Kami?</h2>
//             <p className="section-subtitle">Fitur unggulan untuk keamanan dan kemudahan manajemen sertifikat Anda</p>
//           </div>
          
//           <div className="row g-4">
//             {features.map((feature, index) => (
//               <div className="col-md-4" key={index}>
//                 <div className="feature-card">
//                   <div className="feature-icon">
//                     <feature.icon size={24} />
//                   </div>
//                   <h3 className="feature-title">{feature.title}</h3>
//                   <p className="feature-desc">{feature.description}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* How It Works Section */}
//       <section className="public-section">
//         <div className="container px-4 py-5 py-md-6">
//           <div className="text-center mb-5">
//             <h2 className="section-title">Cara Kerja</h2>
//             <p className="section-subtitle">Proses sederhana dari pembuatan hingga verifikasi sertifikat</p>
//           </div>
          
//           <div className="row g-4 justify-content-center">
//             {steps.map((item, index) => (
//               <div className="col-6 col-md-3" key={index}>
//                 <div className="step-card">
//                   <div className="step-number">{item.step}</div>
//                   <h4 className="step-title">{item.title}</h4>
//                   <p className="step-desc">{item.desc}</p>
//                 </div>
//                 {index < steps.length - 1 && (
//                   <div className="step-connector d-none d-md-block">→</div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="public-cta">
//         <div className="container px-4 py-5 py-md-6">
//           <div className="cta-card">
//             <h2 className="cta-title">Siap Mengamankan Sertifikat Anda?</h2>
//             <p className="cta-subtitle">
//               Bergabung dengan ribuan institusi dan peserta yang telah mempercayakan 
//               manajemen sertifikat mereka pada platform kami.
//             </p>
//             <div className="cta-actions">
//               <Link to="/register" className="btn btn-primary btn-lg">
//                 Mulai Gratis Sekarang
//               </Link>
//               <Link to="/verify" className="btn btn-outline-light btn-lg">
//                 Verifikasi Sertifikat
//               </Link>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="public-footer">
//         <div className="container px-4 py-4">
//           <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
//             <div className="d-flex align-items-center gap-2">
//               <CheckCircle size={18} color="#6f42c1" />
//               <span className="fw-semibold">Sertifikat Digital</span>
//             </div>
//             <p className="text-muted small mb-0">
//               © {new Date().getFullYear()} Mikroskil. All rights reserved.
//             </p>
//             <div className="d-flex gap-3">
//               <Link to="/verify" className="text-muted small text-decoration-none hover-primary">
//                 Verifikasi
//               </Link>
//               <Link to="/login" className="text-muted small text-decoration-none hover-primary">
//                 Login
//               </Link>
//               <a href="#" className="text-muted small text-decoration-none hover-primary">
//                 Bantuan
//               </a>
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default PublicHome;