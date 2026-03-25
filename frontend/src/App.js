import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';


// Auth
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Admin
import AdminDashboard from './components/admin/AdminDashboard';
import ParticipantManager from './components/admin/ParticipantManager';
import CertificateCreator from './components/admin/CertificateCreator';
import CertificateList from './components/admin/CertificateList';

// Participant
import ParticipantDashboard from './components/participant/ParticipantDashboard';
import CertificateDetail from './components/participant/CertificateDetail';

// Public
import PublicVerify from './components/public/PublicVerify';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<PublicVerify />} />
          
          {/* Admin Routes - Nested */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="participants" element={<ParticipantManager />} />
            <Route path="certificates" element={<CertificateList />} />
            <Route path="certificates/create" element={<CertificateCreator />} />
          </Route>
          
          {/* Participant Routes - Nested */}
          <Route
            path="/participant"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <ParticipantLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ParticipantDashboard />} />
            <Route path="certificates/:id" element={<CertificateDetail />} />
          </Route>
          
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Layout Components untuk Admin dan Participant
function AdminLayout() {
  return (
    <div className="admin-layout">
      {/* Sidebar/Navigation untuk Admin */}
      <Outlet /> {/* Ini akan merender child routes */}
    </div>
  );
}

function ParticipantLayout() {
  return (
    <div className="participant-layout">
      {/* Sidebar/Navigation untuk Participant */}
      <Outlet /> {/* Ini akan merender child routes */}
    </div>
  );
}

function ParticipantRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<ParticipantDashboard />} />
      <Route path="certificates/:id" element={<CertificateDetail />} />
    </Routes>
  );
}

export default App;