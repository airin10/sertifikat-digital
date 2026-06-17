import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, FileText, QrCode, Award, PenTool, ArrowRight } from 'lucide-react';
import AppHeader from './AppHeader';
import { useAuth } from '../../contexts/AuthContext'; 

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();

  const COLORS = {
    primary: '#6b21a8',
    primaryDark: '#a300c8',
    dark: '#1e293b',
    light: '#f8fafc'
  };

  const features = [
    {
      icon: Shield,
      title: 'Aman & Terverifikasi',
      description: 'Dilindungi tanda tangan digital EdDSA untuk memastikan keaslian.',
      color: COLORS.primary
    },
    {
      icon: Zap,
      title: 'Verifikasi Instan',
      description: 'Cek keaslian sertifikat dalam hitungan detik.',
      color: COLORS.primary
    },
    {
      icon: FileText,
      title: 'Manajemen Mudah',
      description: 'Kelola dan unduh sertifikat kapan saja.',
      color: COLORS.primary
    }
  ];

  const steps = [
    { step: '1', icon: Award, title: 'Unggah Sertifikat', desc: 'Admin mengunggah sertifikat digital ke dalam sistem' },
    { step: '2', icon: PenTool, title: 'Pembangkitan Tanda Tangan', desc: 'Sistem menghasilkan digital signature menggunakan algoritma EdDSA' },
    { step: '3', icon: QrCode, title: 'Pembuatan QR Code', desc: 'QR Code dibuat sebagai media penyimpanan informasi autentikasi' },
    { step: '4', icon: Shield, title: 'Verifikasi', desc: 'Siapapun bisa verifikasi keaslian sertifikat melalui QR Code' }
  ];

  return (
    <div className="min-vh-100 bg-white">
      <AppHeader />
      <div className="app-header-spacer" />

      {/* Hero Section */}
      <section 
        style={{
          background: `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
          padding: '4rem 0',
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

        <div className="container position-relative text-center">
          <h1 className="h3 fw-bold text-white mb-3">
            Autentikasi Sertifikat Digital Berbasis Digital Signature dengan Algoritma EdDSA
          </h1>
          <p className="text-white-50 mb-4 mx-auto" style={{fontSize: '1.1rem', maxWidth: '1000px'}}>
            Sistem autentikasi sertifikat digital yang memanfaatkan algoritma EdDSA dan QR Code untuk menjaga integritas data serta mempermudah proses verifikasi keaslian sertifikat.
          </p>
          
          {/* <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link 
              to="/verify" 
              className="btn d-inline-flex align-items-center gap-2 px-4 py-2 fw-semibold"
              style={{
                background: 'white',
                color: COLORS.primary,
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.3s ease',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
            >
              <Shield size={18} />
              Verifikasi Sertifikat
            </Link> */}

            {/* 3. PERBAIKAN: Conditional Rendering untuk Tombol */}
            {/* {isAuthenticated ? (
              // Jika SUDAH login, arahkan ke dashboard sesuai role
              <Link 
                to={user?.role === 'admin' ? '/admin/participants' : '/participant/mycertificate'} 
                className="btn d-inline-flex align-items-center gap-2 px-4 py-2 fw-semibold"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.5)',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.borderColor = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                }}
              >
                Lanjut
                <ArrowRight size={18} />
              </Link>
            ) : (
              // Jika BELUM login, tampilkan tombol Masuk
              <Link 
                to="/login" 
                className="btn d-inline-flex align-items-center gap-2 px-4 py-2 fw-semibold"
                style={{
                  background: 'transparent',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.5)',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.borderColor = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                }}
              >
                Masuk
                <ArrowRight size={18} />
              </Link>
            )} */}
          {/* </div> */}
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{padding: '4rem 0'}}>
        <div className="container">
          <div className="row g-4">
            {steps.map((item, index) => {
              const StepIcon = item.icon;
              return (
                <div className="col-6 col-md-3" key={index}>
                  <div className="text-center position-relative h-100">
                    <div 
                      className="d-inline-flex align-items-center justify-content-center mb-3"
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                        boxShadow: `0 8px 24px ${COLORS.primary}40`,
                        position: 'relative'
                      }}
                    >
                      <StepIcon color="white" size={32} />
                      <span 
                        className="position-absolute top-0 end-0 d-flex align-items-center justify-content-center fw-bold"
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'white',
                          color: COLORS.primary,
                          fontSize: '0.75rem',
                          border: `2px solid ${COLORS.primary}`,
                          transform: 'translate(20%, -20%)'
                        }}
                      >
                        {item.step}
                      </span>
                    </div>
                    
                    <h4 className="h6 fw-bold mb-2" style={{color: COLORS.dark}}>
                      {item.title}
                    </h4>
                    <p className="text-muted mb-0" style={{fontSize: '0.9rem'}}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;


// import React from 'react';
// import { Link } from 'react-router-dom';
// import { Shield, Zap, FileText, QrCode, Award, Sparkles, ArrowRight } from 'lucide-react';
// import AppHeader from './AppHeader';

// const Dashboard = () => {
//   const COLORS = {
//     primary: '#6b21a8',
//     primaryDark: '#a300c8',
//     success: '#10b981',
//     dark: '#1e293b',
//     light: '#f8fafc',
//     secondary: '#64748b'
//   };

//   const features = [
//     {
//       icon: Shield,
//       title: 'Aman & Terverifikasi',
//       description: 'Setiap sertifikat dilindungi dengan tanda tangan digital EdDSA untuk memastikan keaslian.',
//       color: COLORS.primary
//     },
//     {
//       icon: Zap,
//       title: 'Verifikasi Instan',
//       description: 'Cek keaslian sertifikat dalam hitungan detik cukup dengan unggah gambar sertifikat.',
//       color: COLORS.primary
//     },
//     {
//       icon: FileText,
//       title: 'Manajemen Mudah',
//       description: 'Kelola, unduh, dan bagikan sertifikat Anda kapan saja dari dashboard pribadi.',
//       color: COLORS.primary
//     }
//   ];

//   const steps = [
//     { step: '1', icon: Award, title: 'Unggah Sertifikat', desc: 'Admin mengunggah template sertifikat peserta' },
//     { step: '2', icon: Sparkles, title: 'Generasi QR', desc: 'Sistem membuat kode QR unik dengan tanda tangan digital EdDSA' },
//     { step: '3', icon: FileText, title: 'Distribusi', desc: 'Sertifikat diunduh' },
//     { step: '4', icon: QrCode, title: 'Verifikasi Publik', desc: 'Siapapun dapat memverifikasi keaslian sertifikat' }
//   ];

//   return (
//     <div className="min-vh-100 bg-white">
//       {/* Header */}
//       <AppHeader />
//       <div className="app-header-spacer" />

//       {/* Simple Hero */}
//       <section 
//         style={{
//           background: `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
//           padding: '4rem 0',
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

//         <div className="container position-relative text-center">
//           <h1 className="h2 fw-bold text-white mb-3">
//             Autentikasi Sertifikat Digital Berbasis Digital Signature dengan Algoritma EdDSA
//           </h1>
//           <p className="text-white-50 mb-0 mx-auto" style={{fontSize: '1.1rem', maxWidth: '600px'}}>
//             Cegah pemalsuan, mudahkan verifikasi, dan kelola sertifikat Anda dengan teknologi EdDSA & OCR
//           </p>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section style={{padding: '4rem 0', background: COLORS.light}}>
//         <div className="container">
//           <div className="text-center mb-5">
//             <h2 className="h3 fw-bold mb-2" style={{color: COLORS.dark}}>
//               Tujuan Kami?
//             </h2>
//             <p className="text-muted mb-0">
//               Fitur unggulan untuk keamanan dan kemudahan manajemen sertifikat Anda
//             </p>
//           </div>
          
//           <div className="row g-4">
//             {features.map((feature, index) => (
//               <div className="col-md-4" key={index}>
//                 <div 
//                   className="h-100 p-4 text-center"
//                   style={{
//                     background: 'white',
//                     borderRadius: '16px',
//                     boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
//                     transition: 'all 0.3s ease'
//                   }}
//                   onMouseEnter={(e) => {
//                     e.currentTarget.style.transform = 'translateY(-4px)';
//                     e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
//                   }}
//                   onMouseLeave={(e) => {
//                     e.currentTarget.style.transform = 'translateY(0)';
//                     e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
//                   }}
//                 >
//                   <div 
//                     className="d-inline-flex align-items-center justify-content-center mb-3"
//                     style={{
//                       width: '64px',
//                       height: '64px',
//                       borderRadius: '16px',
//                       background: `${feature.color}15`
//                     }}
//                   >
//                     <feature.icon size={28} color={feature.color} />
//                   </div>
//                   <h3 className="h5 fw-bold mb-2" style={{color: COLORS.dark}}>
//                     {feature.title}
//                   </h3>
//                   <p className="text-muted mb-0" style={{fontSize: '0.95rem'}}>
//                     {feature.description}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* How It Works Section */}
//       <section style={{padding: '4rem 0'}}>
//         <div className="container">
//           <div className="text-center mb-5">
//             <h2 className="h3 fw-bold mb-2" style={{color: COLORS.dark}}>
//               Cara Kerja
//             </h2>
//             <p className="text-muted mb-0">
//               Proses sederhana dari pembuatan hingga verifikasi sertifikat
//             </p>
//           </div>
          
//           <div className="row g-4">
//             {steps.map((item, index) => {
//               const StepIcon = item.icon;
//               return (
//                 <div className="col-6 col-md-3" key={index}>
//                   <div className="text-center position-relative h-100">
//                     {/* Step Number */}
//                     <div 
//                       className="d-inline-flex align-items-center justify-content-center mb-3"
//                       style={{
//                         width: '72px',
//                         height: '72px',
//                         borderRadius: '50%',
//                         background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
//                         boxShadow: `0 8px 24px ${COLORS.primary}40`,
//                         position: 'relative'
//                       }}
//                     >
//                       <StepIcon color="white" size={32} />
//                       <span 
//                         className="position-absolute top-0 end-0 d-flex align-items-center justify-content-center fw-bold"
//                         style={{
//                           width: '24px',
//                           height: '24px',
//                           borderRadius: '50%',
//                           background: 'white',
//                           color: COLORS.primary,
//                           fontSize: '0.75rem',
//                           border: `2px solid ${COLORS.primary}`,
//                           transform: 'translate(20%, -20%)'
//                         }}
//                       >
//                         {item.step}
//                       </span>
//                     </div>
                    
//                     <h4 className="h6 fw-bold mb-2" style={{color: COLORS.dark}}>
//                       {item.title}
//                     </h4>
//                     <p className="text-muted mb-0" style={{fontSize: '0.9rem'}}>
//                       {item.desc}
//                     </p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </section>

//       {/* Simple CTA */}
//       <section 
//         style={{
//           padding: '3rem 0',
//           background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`
//         }}
//       >
//         <div className="container text-center">
//           <h3 className="h4 fw-bold text-white mb-3">
//             Siap Memverifikasi Sertifikat?
//           </h3>
//           <p className="text-white-50 mb-4">
//             Cek keaslian sertifikat secara instan tanpa perlu login
//           </p>
//           <div className="d-flex justify-content-center gap-3 flex-wrap">
//             <Link 
//               to="/verify" 
//               className="btn d-inline-flex align-items-center gap-2 px-4 py-2 fw-semibold"
//               style={{
//                 background: 'white',
//                 color: COLORS.primary,
//                 borderRadius: '12px',
//                 boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
//                 transition: 'all 0.3s ease',
//                 textDecoration: 'none'
//               }}
//               onMouseEnter={(e) => {
//                 e.currentTarget.style.transform = 'translateY(-2px)';
//                 e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
//               }}
//               onMouseLeave={(e) => {
//                 e.currentTarget.style.transform = 'translateY(0)';
//                 e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
//               }}
//             >
//               <Shield size={18} />
//               Verifikasi Sekarang
//             </Link>
//             <Link 
//               to="/login" 
//               className="btn d-inline-flex align-items-center gap-2 px-4 py-2 fw-semibold"
//               style={{
//                 background: 'transparent',
//                 color: 'white',
//                 border: '2px solid rgba(255,255,255,0.5)',
//                 borderRadius: '12px',
//                 transition: 'all 0.3s ease',
//                 textDecoration: 'none'
//               }}
//               onMouseEnter={(e) => {
//                 e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
//                 e.currentTarget.style.borderColor = 'white';
//               }}
//               onMouseLeave={(e) => {
//                 e.currentTarget.style.background = 'transparent';
//                 e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
//               }}
//             >
//               Masuk
//               <ArrowRight size={18} />
//             </Link>
//           </div>
//         </div>
//       </section>

//       {/* Simple Footer */}
//       <footer style={{padding: '2rem 0', background: COLORS.dark}}>
//         <div className="container">
//           <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
//             <div className="d-flex align-items-center gap-2">
//             </div>
//             <p className="text-white-50 small mb-0">
//               © {new Date().getFullYear()} Mikroskil.
//             </p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default Dashboard;