import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, FileText, CheckCircle, XCircle, 
  Plus, LogOut, TrendingUp 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Helper: Warna icon yang konsisten untuk Bootstrap 5.0.0-beta1
  const ICON_COLORS = {
    primary: '#0d6efd',
    secondary: '#6c757d',
    success: '#198754',
    danger: '#dc3545',
    purple: '#6f42c1',
    white: '#ffffff'
  };

  // ✅ Helper: Background rgba untuk opacity (karena bg-opacity-* tidak ada di Bootstrap 5 beta)
  const BG_RGBA = (hex, opacity = 0.1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <header className="bg-white border-bottom shadow-sm">
        <div className="container px-4 py-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary rounded-3 d-flex align-items-center justify-content-center" 
                 style={{width: '40px', height: '40px'}}>
              {/* ✅ FIX: Gunakan color prop explicit */}
              <CheckCircle color={ICON_COLORS.white} size={24} />
            </div>
            <div>
              <h1 className="h6 fw-bold text-dark mb-0">Admin Dashboard</h1>
              <p className="text-muted small mb-0">Welcome, {user?.full_name}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-link text-decoration-none text-muted d-flex align-items-center gap-2 p-0"
          >
            {/* ✅ FIX: Gunakan color prop explicit */}
            <LogOut color={ICON_COLORS.secondary} size={18} />
            <span className="small fw-medium">Logout</span>
          </button>
        </div>
      </header>

      <div className="container py-4 py-md-5">
        
        {/* Stats Grid */}
        {stats && (
          <div className="row g-4 mb-5">
            <div className="col-12 col-md-6 col-lg-3">
              <StatCard
                icon={Users}
                label="Total Participants"
                value={stats.total_participants}
                color="primary"
                iconColor={ICON_COLORS.primary}
                bgColor={BG_RGBA('#0d6efd')}
              />
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <StatCard
                icon={FileText}
                label="Total Certificates"
                value={stats.total_certificates}
                color="purple"
                iconColor={ICON_COLORS.purple}
                bgColor={BG_RGBA('#6f42c1')}
              />
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <StatCard
                icon={CheckCircle}
                label="Active Certificates"
                value={stats.active_certificates}
                color="success"
                iconColor={ICON_COLORS.success}
                bgColor={BG_RGBA('#198754')}
              />
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <StatCard
                icon={XCircle}
                label="Revoked"
                value={stats.revoked_certificates}
                color="danger"
                iconColor={ICON_COLORS.danger}
                bgColor={BG_RGBA('#dc3545')}
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <Link
              to="/admin/participants"
              className="card h-100 border-0 shadow-sm text-decoration-none text-dark"
            >
              <div className="card-body p-4">
                {/* ✅ FIX: Gunakan inline style untuk background + color prop untuk icon */}
                <div className="rounded-3 d-inline-flex align-items-center justify-content-center mb-3" 
                     style={{width: '48px', height: '48px', backgroundColor: BG_RGBA('#0d6efd')}}>
                  <Users color={ICON_COLORS.primary} size={24} />
                </div>
                <h3 className="h6 fw-bold text-dark mb-2">Kelola Participant</h3>
                <p className="text-muted small mb-0">Tambah, edit, atau hapus data participant</p>
              </div>
            </Link>
          </div>

          <div className="col-md-4">
            <Link
              to="/admin/certificates/create"
              className="card h-100 border-0 shadow-sm text-decoration-none text-dark"
            >
              <div className="card-body p-4">
                <div className="rounded-3 d-inline-flex align-items-center justify-content-center mb-3" 
                     style={{width: '48px', height: '48px', backgroundColor: BG_RGBA('#198754')}}>
                  <Plus color={ICON_COLORS.success} size={24} />
                </div>
                <h3 className="h6 fw-bold text-dark mb-2">Buat Sertifikat</h3>
                <p className="text-muted small mb-0">Upload dan sign sertifikat baru dengan QR</p>
              </div>
            </Link>
          </div>

          <div className="col-md-4">
            <Link
              to="/admin/certificates"
              className="card h-100 border-0 shadow-sm text-decoration-none text-dark"
            >
              <div className="card-body p-4">
                <div className="rounded-3 d-inline-flex align-items-center justify-content-center mb-3" 
                     style={{width: '48px', height: '48px', backgroundColor: BG_RGBA('#6f42c1')}}>
                  <FileText color={ICON_COLORS.purple} size={24} />
                </div>
                <h3 className="h6 fw-bold text-dark mb-2">Daftar Sertifikat</h3>
                <p className="text-muted small mb-0">Lihat dan kelola semua sertifikat</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Certificates */}
        {stats?.recent_certificates && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-3">
              <h3 className="h6 fw-bold text-dark mb-0">Sertifikat Terbaru</h3>
            </div>
            <div className="list-group list-group-flush">
              {stats.recent_certificates.map((cert) => (
                <div key={cert.id} className="list-group-item d-flex align-items-center justify-content-between py-3">
                  <div>
                    <p className="fw-semibold text-dark mb-0">{cert.title}</p>
                    <p className="small text-muted mb-0">{cert.participant}</p>
                  </div>
                  <span className="small text-muted">
                    {new Date(cert.created_at).toLocaleDateString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, iconColor, bgColor }) => {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body p-4">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <p className="text-muted small mb-1">{label}</p>
            <p className="h4 fw-bold text-dark mb-0">{value}</p>
          </div>
          {/* ✅ FIX: Gunakan inline style untuk background + color prop untuk icon */}
          <div className="rounded-3 d-flex align-items-center justify-content-center" 
               style={{width: '48px', height: '48px', backgroundColor: bgColor}}>
            <Icon color={iconColor} size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;