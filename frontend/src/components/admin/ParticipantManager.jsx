import React, { useEffect, useState } from 'react';
// import { useAuth, api } from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import AdminHeader from '../shared/AppHeader';
import { Link } from 'react-router-dom';
import { 
  Users, Plus, Trash2, Edit, ArrowLeft, Loader2, 
  ChevronRight, Search, XCircle, CheckCircle, 
  AlertCircle, Mail, Key, User
} from 'lucide-react';

const ParticipantManager = () => {
  const { user, logout } = useAuth();
  
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [confirmDelete, setConfirmDelete] = useState({show: false, user_id: null});
  const [showModal, setShowModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: ''
  });

  const COLORS = {
    primary: '#6b21a8',
    primaryDark: '#a300c8',
    success: '#10b981',
    danger: '#dc2626',
    warning: '#f59e0b',
    secondary: '#64748b',
    dark: '#1e293b',
    light: '#f8fafc'
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert({ ...alert, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/participants');
      const data = response.data;
      const participantsArray = Array.isArray(data) ? data : (data.participants || []);
      setParticipants(participantsArray);
    } catch (error) {
      console.error('Gagal mengambil data peserta:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingParticipant) {
        await api.put(`/api/admin/participants/${editingParticipant.user_id}`, formData);
        setAlert({ show: true, message: 'Data peserta berhasil diperbarui', type: 'success' });
      } else {
        await api.post('/api/admin/participants', formData);
        setAlert({ show: true, message: 'Peserta baru berhasil ditambahkan', type: 'success' });
      }
      setShowModal(false);
      setEditingParticipant(null);
      setFormData({ username: '', email: '', password: '', full_name: '' });
      fetchParticipants();
    } catch (error) {
      console.error('Gagal menyimpan peserta:', error);
      setAlert({
        show: true,
        message: error.response?.data?.detail || 'Gagal menyimpan data peserta',
        type: 'danger'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteParticipant = async () => {
    try {
      await api.delete(`/api/admin/participants/${confirmDelete.user_id}`);
      setAlert({ show: true, message: 'Peserta berhasil dihapus', type: 'success' });
      fetchParticipants();
    } catch (error) {
      console.error('Gagal menghapus peserta:', error);
      setAlert({
        show: true,
        message: error.response?.data?.detail || 'Gagal menghapus peserta',
        type: 'danger'
      });
    } finally {
      setConfirmDelete({ show: false, user_id: null });
    }
  };

  const openEditModal = (participant) => {
    setEditingParticipant(participant);
    setFormData({
      username: participant.username,
      email: participant.email,
      full_name: participant.full_name,
      password: ''
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingParticipant(null);
    setFormData({ username: '', email: '', password: '', full_name: '' });
    setShowModal(true);
  };

  const handleModalBackdropClick = (e) => {
    if (e.target === e.currentTarget) setShowModal(false);
  };

  const filteredParticipants = participants.filter(p => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.username?.toLowerCase().includes(query) ||
      p.full_name?.toLowerCase().includes(query) ||
      p.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-vh-100 ">
      <AdminHeader user={user} logout={logout} />
            <div className="admin-header-spacer" />

      
      {/* ========== HEADER SECTION ========== */}
      <div 
        style={{
          background: `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
          padding: '2.5rem 0 4rem',
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

        <div className="container position-relative">
          {/* Title & Action */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <div className="d-flex align-items-center gap-3 mb-2">
                <h1 className="h3 fw-bold text-white mb-0">
                  Mengelola Data Peserta
                </h1>
              </div>
              <p className="text-white-50 mb-0">
                Menambah, mengubah, atau menghapus data peserta sebagai penerima sertifikat digital
              </p>
            </div>
            
            <button 
              onClick={openCreateModal}
              className="btn d-inline-flex align-items-center gap-2 px-4 py-2 fw-semibold"
              style={{
                background: 'white',
                color: COLORS.primary,
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.3s ease',
                border: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
            >
              <Plus size={18} />
              Tambah Peserta
            </button>
          </div>
        </div>
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <div className="container" style={{marginTop: '-2rem', position: 'relative', zIndex: 10}}>

        {/* Search & Total Section */}
        {!loading && participants.length > 0 && (
          <div className="mb-4">
            <div 
              className="card border-0"
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              <div className="card-body p-3">
                <div className="row g-3 align-items-center">
                  {/* Search Input */}
                  <div className="col-md-10">
                    <div className="position-relative">
                      <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
                      <input
                        type="text"
                        className="form-control ps-5"
                        placeholder="Cari berdasarkan username, nama lengkap, atau email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          borderRadius: '12px',
                          border: `2px solid ${COLORS.light}`,
                          transition: 'all 0.3s ease',
                          height: '48px'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 3px ${COLORS.primary}20`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = COLORS.light;
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      {searchQuery && (
                        <button 
                          className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted p-0 me-3"
                          onClick={() => setSearchQuery('')}
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="col-md-2">
                    <div 
                      className="d-flex align-items-center justify-content-between h-100 px-3 py-2 rounded-3"
                      style={{
                        background: `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                        minHeight: '48px'
                      }}
                    >
                      <p className="text-white mb-0 fw-semibold small">Total Peserta</p>
                      <span 
                        className="badge rounded-pill px-3 py-2"
                        style={{
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          minWidth: '32px'
                        }}
                      >
                        {participants.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alert */}
        {alert.show && (
          <div 
            className="alert alert-dismissible fade show d-flex align-items-center gap-3 mb-4" 
            role="alert"
            style={{
              borderRadius: '12px',
              border: `1px solid ${alert.type === 'success' ? COLORS.success : COLORS.danger}30`,
              background: alert.type === 'success' ? `${COLORS.success}10` : `${COLORS.danger}10`
            }}
          >
            {alert.type === 'success' ? (
              <CheckCircle color={COLORS.success} size={20} />
            ) : (
              <XCircle color={COLORS.danger} size={20} />
            )}
            <span className="fw-semibold" style={{color: alert.type === 'success' ? COLORS.success : COLORS.danger}}>
              {alert.message}
            </span>
            <button 
              type="button" 
              className="btn-close ms-auto" 
              onClick={() => setAlert({ ...alert, show: false })} 
            />
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div 
            className="card border-0 text-center py-5"
            style={{
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}
          >
            <Loader2 className="animate-spin mb-3" size={48} color={COLORS.primary} />
            <p className="text-muted mb-0">Memuat data peserta...</p>
          </div>
        ) : (
          /* Participant Table */
          <div 
            className="card border-0"
            style={{
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}
          >
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{background: COLORS.light}}>
                  <tr>
                    <th className="px-4 py-3 text-muted small fw-semibold">Username</th>
                    <th className="px-4 py-3 text-muted small fw-semibold">Nama Lengkap</th>
                    <th className="px-4 py-3 text-muted small fw-semibold">Email</th>
                    <th className="px-4 py-3 text-muted small fw-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="border-top">
                  {filteredParticipants.map((p) => (
                    <tr key={p.user_id} className="align-middle">
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="text-white rounded-circle d-flex align-items-center justify-content-center fw-semibold" 
                            style={{
                              width: '36px',
                              height: '36px',
                              fontSize: '0.8rem',
                              background: `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`
                            }}
                          >
                            {p.username?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className="fw-semibold" style={{color: COLORS.dark}}>{p.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 fw-semibold" style={{color: COLORS.dark}}>
                        {p.full_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-muted small">{p.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="d-flex justify-content-center gap-1">
                          <button 
                            onClick={() => openEditModal(p)} 
                            className="btn btn-sm"
                            title="Ubah"
                            style={{
                              border: `1px solid ${COLORS.secondary}30`,
                              color: COLORS.secondary,
                              borderRadius: '8px',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = COLORS.primary;
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.borderColor = COLORS.primary;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = COLORS.secondary;
                              e.currentTarget.style.borderColor = `${COLORS.secondary}30`;
                            }}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => setConfirmDelete({ show: true, user_id: p.user_id })} 
                            className="btn btn-sm"
                            title="Hapus"
                            style={{
                              border: `1px solid ${COLORS.danger}30`,
                              color: COLORS.danger,
                              borderRadius: '8px',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = COLORS.danger;
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.borderColor = COLORS.danger;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = COLORS.danger;
                              e.currentTarget.style.borderColor = `${COLORS.danger}30`;
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Empty State */}
            {filteredParticipants.length === 0 && (
              <div className="text-center py-5">
                <div 
                  className="d-inline-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: `${COLORS.primary}10`
                  }}
                >
                  <Users size={32} color={COLORS.primary} />
                </div>
                <h5 className="text-dark mb-2">
                  {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada peserta'}
                </h5>
                <p className="text-muted small mb-3">
                  {searchQuery 
                    ? `Tidak ditemukan peserta dengan kata kunci "${searchQuery}"`
                    : 'Mulai tambahkan peserta untuk membuat sertifikat'}
                </p>
                {!searchQuery && (
                  <button 
                    onClick={openCreateModal}
                    className="btn d-inline-flex align-items-center gap-2"
                    style={{
                      background: `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                      color: 'white',
                      borderRadius: '12px',
                      padding: '10px 24px',
                      fontWeight: '600',
                      border: 'none'
                    }}
                  >
                    <Plus size={18} />
                    Tambah Peserta Pertama
                  </button>
                )}
              </div>
            )}
            
            {/* Showing Results */}
            {filteredParticipants.length > 0 && (
              <div 
                className="card-footer border-top py-3"
                style={{background: COLORS.light}}
              >
                <small className="text-muted">
                  Menampilkan <strong>{filteredParticipants.length}</strong> dari <strong>{participants.length}</strong> peserta
                  {searchQuery && ` (pencarian: "${searchQuery}")`}
                </small>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="modal fade show d-block" tabIndex="-1" onClick={handleModalBackdropClick} style={{background: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div 
                className="modal-content border-0"
                style={{
                  borderRadius: '20px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  overflow: 'hidden'
                }}
              >
                <div 
                  className="modal-header border-0 py-4"
                  style={{
                    background: `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
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
                      {editingParticipant ? <Edit size={22} /> : <Plus size={22} />}
                    </div>
                    <div>
                      <h5 className="modal-title fw-bold mb-0 text-white">
                        {editingParticipant ? 'Perbarui Data Peserta' : 'Tambah Peserta Baru'}
                      </h5>
                      <p className="mb-0 small opacity-75">
                        {editingParticipant ? 'Lakukan perubahan pada informasi peserta yang dipilih' : 'Isi form untuk menambahkan peserta'}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => setShowModal(false)} 
                    aria-label="Close" 
                  />
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label fw-semibold small d-flex align-items-center gap-2 mb-2">
                        <User size={14} color={COLORS.primary} />
                        Username <span className="text-danger">*</span>
                      </label>
                      <input 
                        type="text" 
                        value={formData.username} 
                        onChange={(e) => setFormData({...formData, username: e.target.value})} 
                        className="form-control" 
                        placeholder="Masukkan nama pengguna" 
                        required 
                        style={{borderRadius: '10px', border: `2px solid #e2e8f0`}}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold small d-flex align-items-center gap-2 mb-2">
                        <Mail size={14} color={COLORS.primary} />
                        Email <span className="text-danger">*</span>
                      </label>
                      <input 
                        type="email" 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        className="form-control" 
                        placeholder="Masukkan email" 
                        required 
                        style={{borderRadius: '10px', border: `2px solid #e2e8f0`}}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold small d-flex align-items-center gap-2 mb-2">
                        <Users size={14} color={COLORS.primary} />
                        Nama Lengkap <span className="text-danger">*</span>
                      </label>
                      <input 
                        type="text" 
                        value={formData.full_name} 
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                        className="form-control" 
                        placeholder="Masukkan nama lengkap" 
                        required 
                        style={{borderRadius: '10px', border: `2px solid #e2e8f0`}}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold small d-flex align-items-center gap-2 mb-2">
                        <Key size={14} color={COLORS.primary} />
                        Kata Sandi {editingParticipant && <span className="text-muted fw-normal">(Kosongkan jika tidak ingin mengubah)</span>}
                      </label>
                      <input 
                        type="password" 
                        value={formData.password} 
                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                        className="form-control" 
                        placeholder={editingParticipant ? "Biarkan kosong jika tidak ingin mengubah" : "Masukkan kata sandi"} 
                        required={!editingParticipant} 
                        style={{borderRadius: '10px', border: `2px solid #e2e8f0`}}
                      />
                    </div>
                  </div>
                  <div className="modal-footer border-top py-3 px-4">
                    <button 
                      type="button" 
                      className="btn px-4 py-2 fw-semibold"
                      onClick={() => setShowModal(false)}
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
                      type="submit" 
                      className="btn px-4 py-2 fw-semibold"
                      disabled={submitting}
                      style={{
                        background: submitting ? '#9ca3af' : `linear-gradient(150deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        boxShadow: submitting ? 'none' : `0 4px 12px ${COLORS.primary}40`,
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        editingParticipant ? 'Perbarui' : 'Simpan'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {confirmDelete.show && (
          <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div 
                className="modal-content border-0"
                style={{
                  borderRadius: '20px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  overflow: 'hidden'
                }}
              >
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
                      <h5 className="modal-title fw-bold mb-0 text-white">Konfirmasi Hapus</h5>
                      <p className="mb-0 small opacity-75">Data yang telah dihapus tidak dapat dipulihkan kembali</p>
                    </div>
                  </div>
                </div>
                <div className="modal-body p-4 text-center">
                  <p className="text-dark mb-0">
                    Apakah Anda yakin ingin menghapus peserta ini?
                  </p>
                </div>
                <div className="btn px-4 justify-content-center">
                  <button 
                    className="btn px-4 py-2 fw-semibold me-2"
                    onClick={() => setConfirmDelete({ show: false, user_id: null })}
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
                    onClick={deleteParticipant}
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.danger} 0%, #b91c1c 100%)`,
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      boxShadow: `0 4px 12px ${COLORS.danger}40`
                    }}
                  >
                    Ya, Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantManager;
