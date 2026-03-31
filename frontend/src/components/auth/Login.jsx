import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(username, password);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/participant/dashboard');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center px-4 position-relative overflow-hidden">
      
      {/* Background Decoration - Subtle blobs */}
      <div className="position-absolute top-0 end-0 w-100 h-100 bg-primary bg-opacity-10 rounded-circle" 
           style={{width: '384px', height: '384px', transform: 'translate(25%, -25%)', filter: 'blur(100px)', opacity: '0.5'}} />
      <div className="position-absolute bottom-0 start-0 w-100 h-100 bg-purple bg-opacity-10 rounded-circle" 
           style={{width: '384px', height: '384px', transform: 'translate(-25%, 25%)', filter: 'blur(100px)', opacity: '0.5'}} />

      <div className="w-100" style={{maxWidth: '448px'}} >

        {/* Logo & Title */}
        <div className="text-center mb-5">
          <div className="bg-white rounded-4 d-flex align-items-center justify-content-center mx-auto mb-4 shadow-lg border" 
               style={{width: '80px', height: '80px'}}>
            <Shield className="text-primary" size={40} />
          </div>
          <h1 className="h3 fw-bold text-dark mb-1">Skripsi</h1>
          <p className="text-muted small">Sistem Sertifikat Digital</p>
        </div>

        {/* Login Card */}
        <div className="card border-0 shadow-lg">
          <div className="card-body p-4 p-md-5">
            <h2 className="h5 fw-bold text-center text-dark mb-4">
              Selamat Datang
            </h2>

            {/* Error Alert */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 small mb-4" role="alert">
                <span className="badge bg-danger rounded-circle" style={{width: '6px', height: '6px'}}></span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Username Field */}
              <div className="mb-4">
                <label className="form-label small fw-bold text-dark mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan nama pengguna"
                  className="form-control form-control-lg bg-light border"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="mb-4">
                <label className="form-label small fw-bold text-dark mb-2">
                  Password
                </label>
                <div className="position-relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="form-control form-control-lg bg-light border pe-5"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted p-0 me-3"
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-dark w-100 py-3 rounded-4 fw-bold mt-3 shadow disabled:opacity-50"
              >
                {loading ? (
                  <span className="d-flex align-items-center justify-content-center gap-2">
                    <span className="spinner-border spinner-border-sm" role="status" />
                    Sedang Masuk...
                  </span>
                ) : (
                  'Masuk ke Akun'
                )}
              </button>
            </form>

            {/* Links Section */}
            <div className="mt-5 text-center">
              {/* <p className="small text-muted mb-2">
                Belum punya akun?{' '}
                <Link to="/register" className="text-primary fw-bold text-decoration-none">
                  Daftar sekarang
                </Link>
              </p> */}
              <p className="small text-muted mb-0">
                Verifikasi publik?{' '}
                <a href="/verify" className="text-dark fw-semibold text-decoration-none">
                  Klik di sini
                </a>
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <p className="text-center text-muted small mt-4">
          © {new Date().getFullYear()} Skripsi — Keamanan Terverifikasi
        </p>
      </div>
    </div>
  );
};

export default Login;