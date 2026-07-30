// Autentikasi apakah user sudah login dan 
// Otorisasi/RBAC apakah user punya hak akses ke halaman ini

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Dna } from 'lucide-react'

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div 
        className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{background: '#f8fafc'}}
      >
        <div 
          className="spinner-border" 
          role="status"
          style={{width: '3rem', height: '3rem', color: '#6b21a8'}}
        >
          <span className="visually-hidden">Memuat...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const redirectPath = user?.role === 'admin' ? '/' : '/participant/mycertificate';
    return <Navigate to={redirectPath} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;