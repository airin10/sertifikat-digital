import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Auth & Shared
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './components/shared/Dashboard'; 

// Admin Pages
import ParticipantManager from './components/admin/ParticipantManager';
import CertificateCreator from './components/admin/CertificateCreator';
import CertificateList from './components/admin/CertificateList';

// Participant Pages
import MyCertificate from './components/participant/MyCertificate';
import CertificateDetail from './components/participant/CertificateDetail';

// Public Pages
import PublicVerify from './components/public/PublicVerify';

function AdminLayout() {
  return (
    <div className="admin-layout">
      <Outlet />
    </div>
  );
}

function ParticipantLayout() {
  return (
    <div className="participant-layout">
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<PublicVerify />} />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/participants" replace />} />
            <Route path="participants" element={<ParticipantManager />} />
            <Route path="certificates" element={<CertificateList />} />
            <Route path="certificates/create" element={<CertificateCreator />} />
          </Route>
          
          {/* Participant Routes */}
          <Route path="/participant" element={
            <ProtectedRoute allowedRoles={['participant']}>
              <ParticipantLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/participant/mycertificate" replace />} />
            <Route path="mycertificate" element={<MyCertificate />} />
            <Route path="certificates/:id" element={<CertificateDetail />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
// import { AuthProvider } from './contexts/AuthContext';

// // Auth & Shared
// import Login from './components/auth/Login';
// import Register from './components/auth/Register';
// import ProtectedRoute from './components/auth/ProtectedRoute';
// import Dashboard from './components/shared/Dashboard'; 
// import AppHeader from './components/shared/AppHeader';

// // Admin Pages
// import ParticipantManager from './components/admin/ParticipantManager';
// import CertificateCreator from './components/admin/CertificateCreator';
// import CertificateList from './components/admin/CertificateList';

// // Participant Pages
// import MyCertificate from './components/participant/MyCertificate';
// import CertificateDetail from './components/participant/CertificateDetail';

// // Public Pages
// import PublicVerify from './components/public/PublicVerify';

// // Layouts (Hanya wrapper, konten utama ada di Dashboard)
// function AdminLayout() {
//   return (
//     <div className="admin-layout">
//       <AppHeader />
//       <div className="app-header-spacer" />
//       <Outlet />
//     </div>
//   );
// }

// function ParticipantLayout() {
//   return (
//     <div className="participant-layout">
//       <AppHeader />
//       <div className="app-header-spacer" />
//       <Outlet />
//     </div>
//   );
// }

// function App() {
//   return (
//     <AuthProvider>
//       <Router>
//         <Routes>
//           <Route path="/" element={<Dashboard />} />
          
//           {/* Auth Routes */}
//           <Route path="/login" element={<Login />} />
//           <Route path="/register" element={<Register />} />
//           <Route path="/verify" element={<PublicVerify />} />
          
//           {/* Admin Management Routes */}
//           <Route path="/admin" element={
//             <ProtectedRoute allowedRoles={['admin']}>
//               <AdminLayout />
//             </ProtectedRoute>
//           }>
//             <Route index element={<Navigate to="/" replace />} />
//             <Route path="participants" element={<ParticipantManager />} />
//             <Route path="certificates" element={<CertificateList />} />
//             <Route path="certificates/create" element={<CertificateCreator />} />
//           </Route>
          
//           {/* Participant Routes */}
//           <Route path="/participant" element={
//             <ProtectedRoute allowedRoles={['participant']}>
//               <ParticipantLayout />
//             </ProtectedRoute>
//           }>
//             <Route index element={<Navigate to="/" replace />} />
//             <Route path="mycertificate" element={<MyCertificate />} />
//             <Route path="certificates/:id" element={<CertificateDetail />} />
//           </Route>

  
//           {/* Fallback */}
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;

// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
// import { AuthProvider } from './contexts/AuthContext';


// import Login from './components/auth/Login';
// import Register from './components/auth/Register';
// import ProtectedRoute from './components/auth/ProtectedRoute';

// import AppHeader from './components/shared/AppHeader';
// import AdminDashboard from './components/admin/AdminDashboard';
// import ParticipantManager from './components/admin/ParticipantManager';
// import CertificateCreator from './components/admin/CertificateCreator';
// import CertificateList from './components/admin/CertificateList';

// import ParticipantDashboard from './components/participant/ParticipantDashboard';
// import CertificateDetail from './components/participant/CertificateDetail';

// import PublicVerify from './components/public/PublicVerify';

// function App() {
//   return (
//     <AuthProvider>
//       <Router>
//         <Routes>
//           {/* Public Routes */}
//           <Route path="/login" element={<Login />} />
//           <Route path="/register" element={<Register />} />
//           <Route path="/verify" element={<PublicVerify />} />
          
//           {/* Admin Routes */}
//           <Route
//             path="/admin"
//             element={
//               <ProtectedRoute allowedRoles={['admin']}>
//                 <AdminLayout />
//               </ProtectedRoute>
//             }
//           >
//             <Route index element={<Navigate to="dashboard" replace />} />
//             <Route path="dashboard" element={<AdminDashboard />} />
//             <Route path="participants" element={<ParticipantManager />} />
//             <Route path="certificates" element={<CertificateList />} />
//             <Route path="certificates/create" element={<CertificateCreator />} />
//           </Route>
          
//           {/* Participant Routes */}
//           <Route
//             path="/participant"
//             element={
//               <ProtectedRoute allowedRoles={['participant']}>
//                 <ParticipantLayout />
//               </ProtectedRoute>
//             }
//           >
//             <Route index element={<Navigate to="dashboard" replace />} />
//             <Route path="dashboard" element={<ParticipantDashboard />} />
//             <Route path="certificates/:id" element={<CertificateDetail />} />
//           </Route>
          
//           {/* Default Redirect */}
//           <Route path="/" element={<Navigate to="/login" replace />} />
//           <Route path="*" element={<Navigate to="/login" replace />} />
//         </Routes>
//       </Router>
//     </AuthProvider>
//   );
// }

// // Layout Components untuk Admin dan Participant
// function AdminLayout() {
//   return (
//     <div className="admin-layout">
//       {/* Sidebar/Navigation untuk Admin */}
//       <Outlet /> {/* Ini akan merender child routes */}
//     </div>
//   );
// }

// function ParticipantLayout() {
//   return (
//     <div className="participant-layout">
//       {/* Sidebar/Navigation untuk Participant */}
//       <Outlet /> {/* Ini akan merender child routes */}
//     </div>
//   );
// }

// function ParticipantRoutes() {
//   return (
//     <Routes>
//       <Route index element={<Navigate to="dashboard" replace />} />
//       <Route path="dashboard" element={<ParticipantDashboard />} />
//       <Route path="certificates/:id" element={<CertificateDetail />} />
//     </Routes>
//   );
// }

// export default App;