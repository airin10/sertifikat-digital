import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const COLORS = {
    primary: '#6b21a8',
    primaryDark: '#a300c8',
    danger: '#dc2626',
    dark: '#1e293b',
    light: '#f8fafc'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (username.length < 3) {
      setError('Username minimal 3 karakter');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const user = await login(username, password);
      
      if (user.role === 'admin') {
        navigate('/');  
      } else {
        navigate('/participant/mycertificate'); 
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Username atau kata sandi salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-vh-100 d-flex align-items-center justify-content-center position-relative overflow-hidden"
      style={{
        background: `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
        padding: '2rem 1rem'
      }}
    >
      <div 
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          pointerEvents: 'none'
        }}
      />
      <div 
        style={{
          position: 'absolute',
          bottom: '-150px',
          left: '-150px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          pointerEvents: 'none'
        }}
      />
      <div 
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          pointerEvents: 'none'
        }}
      />

      {/* Login Card */}
      <div 
        className="w-100 position-relative" 
        style={{maxWidth: '480px', zIndex: 10}}
      >
        <div 
          className="p-4 p-md-5"
          style={{
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}
        >
          {/* Logo & Title */}
          <div className="text-center mb-4">
            <h2 className="h4 fw-bold mb-1" style={{color: COLORS.dark}}>
              LOGIN
            </h2>
          </div>

          {/* Error Alert */}
          {error && (
            <div 
              className="d-flex align-items-center gap-3 p-3 mb-4 rounded-3"
              style={{
                background: `${COLORS.danger}10`,
                border: `1px solid ${COLORS.danger}30`
              }}
            >
              <div 
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: COLORS.danger
                }}
              >
                <span style={{color: 'white', fontWeight: 'bold', fontSize: '1rem'}}>!</span>
              </div>
              <span className="fw-semibold small" style={{color: COLORS.danger}}>
                {error}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Username Field */}
            <div className="mb-3">
              <label className="form-label fw-semibold small mb-2" style={{color: COLORS.dark}}>
                Nama Pengguna
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan nama pengguna"
                className="form-control form-control-lg ps-4"
                style={{
                  borderRadius: '12px',
                  border: `2px solid #e2e8f0`,
                  background: COLORS.light,
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = COLORS.primary;
                  e.target.style.boxShadow = `0 0 0 3px ${COLORS.primary}20`;
                  e.target.style.background = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = COLORS.light;
                }}
                required
              />
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label className="form-label fw-semibold small mb-2" style={{color: COLORS.dark}}>
                Kata Sandi
              </label>
              <div className="position-relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="form-control form-control-lg ps-4 pe-5"
                  style={{
                    borderRadius: '12px',
                    border: `2px solid #e2e8f0`,
                    background: COLORS.light,
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${COLORS.primary}20`;
                    e.target.style.background = 'white';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = COLORS.light;
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted p-0 me-3"
                  tabIndex="-1"
                  style={{textDecoration: 'none'}}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
              style={{
                background: loading 
                  ? '#9ca3af'
                  : `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                color: 'white',
                borderRadius: '12px',
                border: 'none',
                fontSize: '1rem',
                boxShadow: loading ? 'none' : `0 8px 24px ${COLORS.primary}40`,
                transition: 'all 0.3s ease',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 12px 32px ${COLORS.primary}50`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = loading ? 'none' : `0 8px 24px ${COLORS.primary}40`;
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" />
                  Sedang masuk...
                </>
              ) : (
                <>Masuk</>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-muted small mt-4 mb-0">
            © Mikroskil {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;