// import React, { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';
// import { Shield, User, Mail, Lock, UserPlus, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';

// const Register = () => {
//   const [formData, setFormData] = useState({
//     username: '',
//     email: '',
//     full_name: '',
//     password: '',
//     confirm_password: '',
//     role: 'participant'
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [loading, setLoading] = useState(false);

//   const { register } = useAuth();
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//   };

//   const validateForm = () => {
//     if (formData.password !== formData.confirm_password) {
//       setError('Password tidak cocok');
//       return false;
//     }
//     if (formData.password.length < 6) {
//       setError('Password minimal 6 karakter');
//       return false;
//     }
//     if (!formData.email.includes('@')) {
//       setError('Email tidak valid');
//       return false;
//     }
//     return true;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     setSuccess('');

//     if (!validateForm()) {
//       setLoading(false);
//       return;
//     }

//     try {
//       const { confirm_password, ...submitData } = formData;
//       await register(submitData);
//       setSuccess('Pendaftaran berhasil! Silakan login.');
//       setTimeout(() => {
//         navigate('/login');
//       }, 2000);
//     } catch (err) {
//       setError(err.response?.data?.detail || 'Gagal mendaftar. Silakan coba lagi.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleBack = () => {
//     if (window.history.length > 1) {
//       navigate(-1);
//     } else {
//       navigate('/login');
//     }
//   };

//   return (
//     <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center px-4 position-relative overflow-hidden">
//       {/* Background Decorations - Subtle blobs */}
//       <div className="position-absolute top-0 end-0 bg-primary bg-opacity-10 rounded-circle" 
//            style={{width: '384px', height: '384px', transform: 'translate(25%, -25%)', filter: 'blur(100px)', opacity: '0.5'}} />
//       <div className="position-absolute bottom-0 start-0 bg-purple bg-opacity-10 rounded-circle" 
//            style={{width: '384px', height: '384px', transform: 'translate(-25%, 25%)', filter: 'blur(100px)', opacity: '0.5'}} />

//       <div className="w-100 position-relative z-1" style={{maxWidth: '448px'}}>
        
//         {/* Back Button */}
//         <div className="mb-4">
//           <button 
//             onClick={handleBack}
//             className="btn btn-link text-decoration-none text-muted d-flex align-items-center gap-2 p-0 hover-text-dark"
//           >
//             <ArrowLeft size={16} />
//             <span className="small fw-medium">Kembali</span>
//           </button>
//         </div>

//         {/* Header */}
//         <div className="text-center mb-4">
//           <div className="bg-white rounded-4 d-flex align-items-center justify-content-center mx-auto mb-4 shadow-lg border" 
//                style={{width: '80px', height: '80px'}}>
//             <UserPlus className="text-primary" size={40} />
//           </div>
//           <h1 className="h4 fw-bold text-dark mb-1">Daftar Akun</h1>
//           <p className="text-muted small">Buat akun baru CertiChain</p>
//         </div>

//         {/* Register Card */}
//         <div className="card border-0 shadow-lg">
//           <div className="card-body p-4 p-md-5">
            
//             {/* Error Alert */}
//             {error && (
//               <div className="alert alert-danger d-flex align-items-center gap-2 small mb-4" role="alert">
//                 <span className="badge bg-danger rounded-circle" style={{width: '6px', height: '6px'}}></span>
//                 {error}
//               </div>
//             )}

//             {/* Success Alert */}
//             {success && (
//               <div className="alert alert-success d-flex align-items-center gap-2 small mb-4" role="alert">
//                 <CheckCircle size={18} />
//                 {success}
//               </div>
//             )}

//             <form onSubmit={handleSubmit}>
              
//               {/* Role Selection */}
//               <div className="mb-4">
//                 <label className="form-label small fw-bold text-dark mb-2">
//                   Tipe Akun
//                 </label>
//                 <div className="btn-group w-100" role="group">
//                   <input 
//                     type="radio" 
//                     className="btn-check" 
//                     name="role" 
//                     id="role-participant" 
//                     value="participant"
//                     checked={formData.role === 'participant'}
//                     onChange={() => setFormData({...formData, role: 'participant'})}
//                   />
//                   <label className="btn btn-outline-primary" htmlFor="role-participant">
//                     <User size={14} className="me-1" /> Peserta
//                   </label>
                  
//                   <input 
//                     type="radio" 
//                     className="btn-check" 
//                     name="role" 
//                     id="role-admin" 
//                     value="admin"
//                     checked={formData.role === 'admin'}
//                     onChange={() => setFormData({...formData, role: 'admin'})}
//                   />
//                   <label className="btn btn-outline-purple" htmlFor="role-admin">
//                     <Shield size={14} className="me-1" /> Admin
//                   </label>
//                 </div>
//                 <small className="text-muted d-block mt-2">
//                   {formData.role === 'admin' 
//                     ? 'Admin dapat mengelola sertifikat dan peserta' 
//                     : 'Peserta dapat melihat dan mengunduh sertifikat'}
//                 </small>
//               </div>

//               {/* Full Name */}
//               <div className="mb-3">
//                 <label className="form-label small fw-bold text-dark mb-2">
//                   Nama Lengkap
//                 </label>
//                 <div className="position-relative">
//                   <User className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={20} />
//                   <input
//                     type="text"
//                     name="full_name"
//                     value={formData.full_name}
//                     onChange={handleChange}
//                     placeholder="John Doe"
//                     className="form-control ps-5"
//                     required
//                   />
//                 </div>
//               </div>

//               {/* Username */}
//               <div className="mb-3">
//                 <label className="form-label small fw-bold text-dark mb-2">
//                   Username
//                 </label>
//                 <div className="position-relative">
//                   <Shield className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={20} />
//                   <input
//                     type="text"
//                     name="username"
//                     value={formData.username}
//                     onChange={handleChange}
//                     placeholder="johndoe123"
//                     className="form-control ps-5"
//                     required
//                   />
//                 </div>
//               </div>

//               {/* Email */}
//               <div className="mb-3">
//                 <label className="form-label small fw-bold text-dark mb-2">
//                   Email
//                 </label>
//                 <div className="position-relative">
//                   <Mail className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={20} />
//                   <input
//                     type="email"
//                     name="email"
//                     value={formData.email}
//                     onChange={handleChange}
//                     placeholder="john@example.com"
//                     className="form-control ps-5"
//                     required
//                   />
//                 </div>
//               </div>

//               {/* Password */}
//               <div className="mb-3">
//                 <label className="form-label small fw-bold text-dark mb-2">
//                   Password
//                 </label>
//                 <div className="position-relative">
//                   <Lock className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={20} />
//                   <input
//                     type={showPassword ? 'text' : 'password'}
//                     name="password"
//                     value={formData.password}
//                     onChange={handleChange}
//                     placeholder="••••••••"
//                     className="form-control ps-5 pe-5"
//                     required
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted p-0 me-3"
//                     tabIndex="-1"
//                   >
//                     {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                   </button>
//                 </div>
//               </div>

//               {/* Confirm Password */}
//               <div className="mb-4">
//                 <label className="form-label small fw-bold text-dark mb-2">
//                   Konfirmasi Password
//                 </label>
//                 <div className="position-relative">
//                   <Lock className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={20} />
//                   <input
//                     type={showConfirmPassword ? 'text' : 'password'}
//                     name="confirm_password"
//                     value={formData.confirm_password}
//                     onChange={handleChange}
//                     placeholder="••••••••"
//                     className="form-control ps-5 pe-5"
//                     required
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                     className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted p-0 me-3"
//                     tabIndex="-1"
//                   >
//                     {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                   </button>
//                 </div>
//               </div>

//               {/* Submit Button */}
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="btn btn-dark w-100 py-3 rounded-4 fw-bold mt-2 shadow disabled:opacity-50"
//               >
//                 {loading ? (
//                   <span className="d-flex align-items-center justify-content-center gap-2">
//                     <span className="spinner-border spinner-border-sm" role="status" />
//                     Mendaftarkan...
//                   </span>
//                 ) : (
//                   'Daftar Sekarang'
//                 )}
//               </button>
//             </form>

//             {/* Login Link */}
//             <div className="mt-4 text-center">
//               <p className="small text-muted mb-0">
//                 Sudah punya akun?{' '}
//                 <Link to="/login" className="text-primary fw-bold text-decoration-none">
//                   Masuk di sini
//                 </Link>
//               </p>
//             </div>
//           </div>
//         </div>
        
//         {/* Footer */}
//         <p className="text-center text-muted small mt-4">
//           © {new Date().getFullYear()} CertiChain — Keamanan Terverifikasi
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Register;