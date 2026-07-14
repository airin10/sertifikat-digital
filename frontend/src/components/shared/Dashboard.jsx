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

