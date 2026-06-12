import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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

// import { Navigate, Outlet } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';

// const ProtectedRoute = ({ allowedRoles, children }) => {
//   const { user, loading, isAuthenticated } = useAuth();

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-50">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

//   if (allowedRoles && !allowedRoles.includes(user?.role)) {
//     const redirectPath = user?.role === 'admin' ? '/admin/dashboard' : '/participant/dashboard';
//     return <Navigate to={redirectPath} replace />;
//   }

//   return children ? children : <Outlet />;
// };

// export default ProtectedRoute;