import React, { useState } from 'react'; 
import { Link, useLocation } from 'react-router-dom';
import { LogOut, LogIn, CheckCircle, Menu, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AppHeader = () => {
  const { user, logout, isAdmin, isParticipant } = useAuth();
  const location = useLocation();
  
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const isActive = (path) => location.pathname === path;

  const COLORS = {
    primary: '#6b21a8',
    primaryDark: '#a300c8',
    danger: '#dc2626',
    secondary: '#64748b'
  };

  const getNavItems = () => {
    if (isAdmin) {
      return [
        { label: 'Beranda', path: '/' },
        { label: 'Kelola Peserta', path: '/admin/participants' },
        { label: 'Buat Sertifikat', path: '/admin/certificates/create' },
        { label: 'Daftar Sertifikat', path: '/admin/certificates' },
        { label: 'Verifikasi', path: '/verify' },
      ];
    }
    if (isParticipant) {
      return [
        { label: 'Beranda', path: '/' },
        { label: 'Sertifikat Saya', path: '/participant/mycertificate' },
        { label: 'Verifikasi', path: '/verify' },
      ];
    }
    return [
      { label: 'Beranda', path: '/' },
      { label: 'Verifikasi', path: '/verify' },
    ];
  };

  const navItems = getNavItems();

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setMobileOpen(false);  
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout(false);
    setShowLogoutToast(true);
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);  
  };

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showLogoutConfirm) {
        setShowLogoutConfirm(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showLogoutConfirm]);

  return (
    <header className="app-header">
      <div className="app-header-container">
        
        {/* Brand */}
        <div className="app-header-brand">
          <div className="app-header-logo">
            <CheckCircle size={18} color="#fff" />
          </div>
          <div className="app-header-text">
            <h1>{isAdmin ? 'Admin' : isParticipant ? 'Peserta' : 'Publik'}</h1>
            <p>{user ? `Selamat datang, ${user.full_name || user.username}` : 'Selamat datang'}</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="app-header-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`app-header-link ${isActive(item.path) ? 'active' : ''}`}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="app-header-actions">
          {user ? (
            <button 
              onClick={handleLogoutClick} 
              className="app-header-logout"
            >
              Keluar
              <LogOut size={15} />
            </button>
          ) : (
            <Link to="/login" className="app-header-login">
              Masuk
              <LogIn size={15} />
            </Link>
          )}
          
          <button 
            className="app-header-mobile-toggle" 
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Logout Toast */}
      {showLogoutToast && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1040,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'slideIn 0.3s ease'
        }}>
          <CheckCircle size={16} />
          <span>Berhasil keluar</span>
        </div>
      )}

      {/* ✅ MODAL KONFIRMASI LOGOUT - Mirip ParticipantManager */}
      {showLogoutConfirm && (
        <div 
          className="modal fade show d-block" 
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div 
              className="modal-content border-0"
              onClick={(e) => e.stopPropagation()}
              style={{
                borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                overflow: 'hidden'
              }}
            >
              {/* Header - Gradient Merah (bahaya/logout) */}
              <div 
                className="modal-header border-0 py-4"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.danger} 0%, #b91c1c 100%)`,
                  color: 'white'
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div 
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.2)'
                    }}
                  >
                    <AlertCircle size={22} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0 text-white">
                      Konfirmasi Keluar
                    </h5>
                    <p className="mb-0 small opacity-75">
                      Anda akan keluar dari sistem
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowLogoutConfirm(false)}
                  aria-label="Close" 
                />
              </div>

              {/* Body */}
              <div className="modal-body p-4 text-center">
                <div 
                  className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                  style={{
                    width: '64px',
                    height: '64px',
                    background: `${COLORS.danger}15`
                  }}
                >
                  <LogOut color={COLORS.danger} size={28} />
                </div>
                <p className="text-dark mb-0 fw-medium">
                  Apakah Anda yakin ingin keluar dari sistem?
                </p>
                <p className="text-muted small mt-2 mb-0">
                  Anda perlu login kembali untuk mengakses fitur yang memerlukan autentikasi.
                </p>
              </div>

              {/* Footer */}
              <div className="modal-footer border-top py-3 px-4 justify-content-center">
                <button 
                  className="btn px-4 py-2 fw-semibold me-2"
                  onClick={() => setShowLogoutConfirm(false)}
                  style={{
                    background: 'white',
                    color: COLORS.secondary,
                    border: `2px solid #e2e8f0`,
                    borderRadius: '10px'
                  }}
                >
                  Batal
                </button>
                <button 
                  className="btn px-4 py-2 fw-semibold"
                  onClick={confirmLogout}
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.danger} 0%, #b91c1c 100%)`,
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    boxShadow: `0 4px 12px ${COLORS.danger}40`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <LogOut size={16} />
                  Ya, Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileOpen && (
        <nav className="app-header-mobile-menu">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`app-header-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="app-header-mobile-auth">
            {user ? (
              <button 
                onClick={handleLogoutClick} 
                className="app-header-logout"
              >
                Keluar
              </button>
            ) : (
              <Link 
                to="/login" 
                className="app-header-login" 
                onClick={() => setMobileOpen(false)}
              >
                Masuk
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

export default AppHeader;

// import React, { useState } from 'react'; 
// import { Link, useLocation } from 'react-router-dom';
// import { LogOut, CheckCircle, Menu, X} from 'lucide-react';
// import { useAuth } from '../../contexts/AuthContext';

// const AppHeader = () => {
//   const { user, logout, isAdmin, isParticipant } = useAuth();
//   const location = useLocation();
  
//   const [showLogoutToast, setShowLogoutToast] = useState(false);
  
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const isActive = (path) => location.pathname === path;

//   const getNavItems = () => {
//     if (isAdmin) {
//       return [
//         { label: 'Beranda', path: '/'},
//         { label: 'Kelola Peserta', path: '/admin/participants'},
//         { label: 'Buat Sertifikat', path: '/admin/certificates/create'},
//         { label: 'Daftar Sertifikat', path: '/admin/certificates'},
//         { label: 'Verifikasi', path: '/verify'},
//       ];
//     }
//     if (isParticipant) {
//       return [
//         { label: 'Beranda', path: '/'},
//         { label: 'Sertifikat Saya', path: '/participant/mycertificate'},
//         { label: 'Verifikasi', path: '/verify'},
//       ];
//     }
//     return [
//       { label: 'Beranda', path: '/'},
//       { label: 'Verifikasi', path: '/verify'},
//     ];
//   };

//   const navItems = getNavItems();

//   const handleLogout = () => {
//     logout();
//     setShowLogoutToast(true);
//     setTimeout(() => setShowLogoutToast(false), 3000);
//   };

//   return (
//     <header className="app-header">
//       <div className="app-header-container">
        
//         {/* Brand */}
//         <div className="app-header-brand">
//           <div className="app-header-logo">
//             <CheckCircle size={18} color="#fff" />
//           </div>
//           <div className="app-header-text">
//             <h1>{isAdmin ? 'Admin' : isParticipant ? 'Peserta' : 'Publik'}</h1>
//             <p>{user ? `Selamat datang, ${user.full_name || user.username}` : 'Selamat datang'}</p>
//           </div>
//         </div>

//         {/* Desktop Navigation */}
//         <nav className="app-header-nav">
//           {navItems.map((item) => (
//             <Link
//               key={item.path}
//               to={item.path}
//               className={`app-header-link ${isActive(item.path) ? 'active' : ''}`}
//             >
//               {/* <item.icon size={16} /> */}
//               <span>{item.label}</span>
//             </Link>
//           ))}
//         </nav>

//         {/* Actions */}
//         <div className="app-header-actions">
//           {user ? (
//             <button onClick={handleLogout} className="app-header-logout">
//               Keluar
//               <LogOut size={15} />
//             </button>
//           ) : (
//             <Link to="/login" className="app-header-login">
//               Masuk
//               <LogOut size={15} className="rotate-180" />
//             </Link>
//           )}
          
//           <button className="app-header-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
//             {mobileOpen ? <X size={20} /> : <Menu size={20} />}
//           </button>
//         </div>
//       </div>

//       {showLogoutToast && (
//         <div style={{
//           position: 'fixed',
//           top: '80px',
//           right: '20px',
//           background: 'linear-gradient(135deg, #6b21a8, #a300c8)',
//           color: 'white',
//           padding: '10px 20px',
//           borderRadius: '8px',
//           fontSize: '14px',
//           fontWeight: '500',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
//           zIndex: 1040,
//           display: 'flex',
//           alignItems: 'center',
//           gap: '8px',
//           animation: 'slideIn 0.3s ease'
//         }}>
//           <span>✓</span>
//           <span>Berhasil keluar</span>
//         </div>
//       )}

//       {/* Mobile Menu */}
//       {mobileOpen && (
//         <nav className="app-header-mobile-menu">
//           {navItems.map((item) => (
//             <Link
//               key={item.path}
//               to={item.path}
//               className={`app-header-link ${isActive(item.path) ? 'active' : ''}`}
//               onClick={() => setMobileOpen(false)}
//             >
//               {/* <item.icon size={18} /> */}
//               <span>{item.label}</span>
//             </Link>
//           ))}
//           <div className="app-header-mobile-auth">
//             {user ? (
//               <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="app-header-logout">
//                 Keluar
//               </button>
//             ) : (
//               <Link to="/login" className="app-header-login" onClick={() => setMobileOpen(false)}>
//                 Masuk
//               </Link>
//             )}
//           </div>
//         </nav>
//       )}
//     </header>
//   );
// };

// export default AppHeader;