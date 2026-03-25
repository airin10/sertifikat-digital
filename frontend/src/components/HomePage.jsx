import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, FileCheck, ArrowRight, Upload, Search } from 'lucide-react';

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero Section - dari HomePage Anda dengan styling baru */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm text-blue-300">EdDSA (Ed25519) Secured</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Sertifikat Digital dengan{' '}
            <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
              Keamanan Kriptografi
            </span>
          </h1>
          
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Buat dan verifikasi sertifikat menggunakan EdDSA (Ed25519) dengan OCR otomatis. 
            Keamanan tingkat tinggi dengan verifikasi offline.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-all"
            >
              <Upload className="w-5 h-5" />
              Login Admin/Participant
            </Link>
            <Link 
              to="/verify" 
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-semibold transition-all"
            >
              <Search className="w-5 h-5" />
              Verifikasi Publik
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section - dari HomePage Anda */}
      <section className="py-20 px-4 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Cara Kerja</h2>
            <p className="text-slate-400">Tiga langkah sederhana untuk keamanan sertifikat</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Upload, title: 'Upload Sertifikat', desc: 'Upload gambar dan pilih area QR', color: 'blue' },
              { icon: Lock, title: 'Auto Sign EdDSA', desc: 'OCR ekstrak teks dan sign otomatis', color: 'green' },
              { icon: FileCheck, title: 'Verifikasi Instan', desc: 'Scan QR untuk validasi keaslian', color: 'purple' }
            ].map((item, idx) => (
              <div key={idx} className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-all">
                <div className={`w-12 h-12 bg-${item.color}-500/20 rounded-xl flex items-center justify-center mb-4`}>
                  <item.icon className={`w-6 h-6 text-${item.color}-400`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;

// import React from 'react';
// import { Link } from 'react-router-dom';

// function HomePage() {
//   return (
//     <div>
//       {/* ========================= hero-5 start ========================= */}
//       <div className="hero-section hero-style-5 img-bg" style={{backgroundImage: 'url("assets/img/hero/hero-5/hero-bg.svg")'}}>
//         <div className="container">
//           <div className="row">
//             <div className="col-lg-6">
//               <div className="hero-content-wrapper">
//                 <h2 className="mb-30 wow fadeInUp" data-wow-delay=".2s">
//                   Sertifikat Digital dengan <span className="text-primary">Keamanan Kriptografi</span>
//                 </h2>
//                 <p className="mb-30 wow fadeInUp" data-wow-delay=".4s">
//                   Buat dan verifikasi sertifikat menggunakan EdDSA (Ed25519) dengan OCR otomatis. 
//                   Keamanan tingkat tinggi dengan verifikasi offline.
//                 </p>
//                 <div className="d-flex gap-3 wow fadeInUp" data-wow-delay=".6s">
//                   <Link to="/create" className="button button-lg radius-50">
//                     Buat Sertifikat <i className="lni lni-chevron-right"></i>
//                   </Link>
//                   <Link to="/verify" className="button button-lg radius-50 button-outline">
//                     🔍 Verifikasi
//                   </Link>
//                 </div>
//               </div>
//             </div>
//             <div className="col-lg-6 align-self-end">
//               <div className="hero-image wow fadeInUp" data-wow-delay=".5s">
//                 {/* Ganti dengan ilustrasi certificate/QR */}
//                 <img src="assets/img/hero/hero-5/hero-img.svg" alt="Certificate Security" />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//       {/* ========================= hero-5 end ========================= */}

//       {/* ========================= feature style-5 start ========================= */}
//       <section id="feature" className="feature-section feature-style-5 pt-100">
//         <div className="container">
//           <div className="row justify-content-center">
//             <div className="col-xxl-5 col-xl-5 col-lg-7 col-md-8">
//               <div className="section-title text-center mb-60">
//                 <h3 className="mb-15 wow fadeInUp" data-wow-delay=".2s">Cara Kerja</h3>
//                 <p className="wow fadeInUp" data-wow-delay=".4s">
//                   Tiga langkah sederhana untuk keamanan sertifikat yang tak tertandingi
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="row">
//             {/* Step 1 */}
//             <div className="col-lg-4 col-md-6">
//               <div className="single-feature wow fadeInUp" data-wow-delay=".2s">
//                 <div className="icon">
//                   <i className="lni lni-cloud-upload"></i>
//                   <svg width="110" height="72" viewBox="0 0 110 72" fill="none" xmlns="http://www.w3.org/2000/svg">
//                     <path d="M110 54.7589C110 85.0014 85.3757 66.2583 55 66.2583C24.6243 66.2583 0 85.0014 0 54.7589C0 24.5164 24.6243 0 55 0C85.3757 0 110 24.5164 110 54.7589Z" fill="#EBF4FF"/>
//                   </svg>                  
//                 </div>
//                 <div className="content">
//                   <h5>1. Upload Sertifikat</h5>
//                   <p>Upload gambar sertifikat dan pilih area untuk QR Code menggunakan drag & drop.</p>
//                 </div>
//               </div>
//             </div>

//             {/* Step 2 */}
//             <div className="col-lg-4 col-md-6">
//               <div className="single-feature wow fadeInUp" data-wow-delay=".4s">
//                 <div className="icon">
//                   <i className="lni lni-lock-alt"></i>
//                   <svg width="110" height="72" viewBox="0 0 110 72" fill="none" xmlns="http://www.w3.org/2000/svg">
//                     <path d="M110 54.7589C110 85.0014 85.3757 66.2583 55 66.2583C24.6243 66.2583 0 85.0014 0 54.7589C0 24.5164 24.6243 0 55 0C85.3757 0 110 24.5164 110 54.7589Z" fill="#EBF4FF"/>
//                   </svg> 
//                 </div>
//                 <div className="content">
//                   <h5>2. Auto Sign dengan EdDSA</h5>
//                   <p>Sistem OCR ekstrak teks, buat hash SHA-256, dan sign dengan Ed25519 secara otomatis.</p>
//                 </div>
//               </div>
//             </div>

//             {/* Step 3 */}
//             <div className="col-lg-4 col-md-6">
//               <div className="single-feature wow fadeInUp" data-wow-delay=".6s">
//                 <div className="icon">
//                   <i className="lni lni-checkmark-circle"></i>
//                   <svg width="110" height="72" viewBox="0 0 110 72" fill="none" xmlns="http://www.w3.org/2000/svg">
//                     <path d="M110 54.7589C110 85.0014 85.3757 66.2583 55 66.2583C24.6243 66.2583 0 85.0014 0 54.7589C0 24.5164 24.6243 0 55 0C85.3757 0 110 24.5164 110 54.7589Z" fill="#EBF4FF"/>
//                   </svg> 
//                 </div>
//                 <div className="content">
//                   <h5>3. Verifikasi Instan</h5>
//                   <p>Verifikasi keaslian dengan scan QR. Bandingkan OCR dengan data tersign untuk validasi.</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//       {/* ========================= feature style-5 end ========================= */}

//       {/* ========================= about style-4 start ========================= */}
//       <section id="about" className="about-section about-style-4">
//         <div className="container">
//           <div className="row align-items-center">
//             <div className="col-xl-5 col-lg-6">
//               <div className="about-content-wrapper">
//                 <div className="section-title mb-30">
//                   <h3 className="mb-25 wow fadeInUp" data-wow-delay=".2s">Keamanan Kriptografi Modern</h3>
//                   <p className="wow fadeInUp" data-wow-delay=".3s">
//                     Menggunakan EdDSA (Edwards-curve Digital Signature Algorithm) dengan kurva Ed25519 
//                     untuk keamanan 128-bit yang kompatibel dengan QR code.
//                   </p>
//                 </div>
//                 <ul>
//                   <li className="wow fadeInUp" data-wow-delay=".35s">
//                     <i className="lni lni-checkmark-circle"></i>
//                     <strong>Ed25519:</strong> Signature hanya 64 byte, ideal untuk QR code
//                   </li>
//                   <li className="wow fadeInUp" data-wow-delay=".4s">
//                     <i className="lni lni-checkmark-circle"></i>
//                     <strong>OCR Tesseract:</strong> Ekstraksi teks akurat dari gambar
//                   </li>
//                   <li className="wow fadeInUp" data-wow-delay=".45s">
//                     <i className="lni lni-checkmark-circle"></i>
//                     <strong>SHA-256:</strong> Hashing dengan avalanche effect untuk deteksi modifikasi
//                   </li>
//                   {/* <li className="wow fadeInUp" data-wow-delay=".5s">
//                     <i className="lni lni-checkmark-circle"></i>
//                     <strong>Offline Verification:</strong> Tidak perlu koneksi internet untuk verifikasi
//                   </li> */}
//                 </ul>
//                 <Link to="/create" className="button button-lg radius-10 wow fadeInUp" data-wow-delay=".6s">
//                   Mulai Buat Sertifikat
//                 </Link>
//               </div>
//             </div>
//             <div className="col-xl-7 col-lg-6">
//               <div className="about-image text-lg-right wow fadeInUp" data-wow-delay=".5s">
//                 <img src="assets/img/about/about-4/about-img.svg" alt="Cryptography Security" />
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//       {/* ========================= about style-4 end ========================= */}

//       {/* ========================= CTA Section ========================= */}
//       <section className="pricing-section pricing-style-4 bg-light">
//         <div className="container">
//           <div className="row justify-content-center">
//             <div className="col-lg-8 text-center">
//               <div className="section-title mb-60">
//                 <h3 className="mb-15 wow fadeInUp" data-wow-delay=".2s">Siap Membuat Sertifikat Digital?</h3>
//                 <p className="wow fadeInUp" data-wow-delay=".4s">
//                   Mulai dengan mengupload sertifikat Anda dan biarkan sistem menangani 
//                   OCR, signing, dan QR generation secara otomatis.
//                 </p>
//               </div>
//               <div className="wow fadeInUp" data-wow-delay=".6s">
//                 <Link to="/create" className="button button-lg radius-50">
//                   Buat Sertifikat Sekarang <i className="lni lni-arrow-right"></i>
//                 </Link>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }

// export default HomePage;