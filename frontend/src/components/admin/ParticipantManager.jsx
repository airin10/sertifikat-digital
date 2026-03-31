import React, { useEffect, useState } from 'react';
import { useAuth, api } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Users, Plus, Trash2, Edit, ArrowLeft, Loader2, X } from 'lucide-react';

const ParticipantManager = () => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [confirmDelete, setConfirmDelete] = useState({show: false,id: null});
  const [showModal, setShowModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: ''
  });

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
      console.log('Data peserta:', response.data);
      
      const data = response.data;
      const participantsArray = Array.isArray(data) ? data : (data.participants || []);
      setParticipants(participantsArray);
      
    } catch (error) {
      console.error('Gagal mengambil data peserta:', error);
      
      if (error.response?.status === 401) {
        console.error('Sesi berakhir, mengarahkan ke halaman login');
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
    
    try {
      if (editingParticipant) {
        await api.put(`/api/admin/participants/${editingParticipant.id}`, formData);
      } else {
        await api.post('/api/admin/participants', formData);
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
    }
  };

  const deleteParticipant = async () => {
    try {
      await api.delete(`/api/admin/participants/${confirmDelete.id}`);
      
      setAlert({
        show: true,
        message: 'Peserta berhasil dihapus',
        type: 'success'
      });

      fetchParticipants();
    } catch (error) {
      console.error('Gagal menghapus peserta:', error);

      setAlert({
        show: true,
        message: error.response?.data?.detail || 'Gagal menghapus peserta',
        type: 'danger'
      });
    } finally {
      setConfirmDelete({ show: false, id: null });
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
    if (e.target === e.currentTarget) {
      setShowModal(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light py-4 py-md-5">
      <div className="container py-3 py-md-4">
        
        {/* Back Button */}
        <div className="mb-4">
          <Link 
            to="/admin/dashboard" 
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>Kembali</span>
          </Link>
        </div>

        {/* Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
          <div>
            <h1 className="h4 fw-bold text-dark mb-1">Kelola Peserta</h1>
            <p className="text-muted small mb-0">Tambah, edit, atau hapus data peserta</p>
          </div>
          
          <button
            onClick={openCreateModal}
            className="btn btn-primary d-flex align-items-center gap-2"
          >
            <Plus size={18} />
            Tambah Peserta
          </button>
        </div>
        {alert.show && (
          <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
            {alert.message}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setAlert({ ...alert, show: false })}
            />
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Memuat...</span>
            </div>
            <p className="text-muted">Memuat data peserta...</p>
          </div>
        ) : (
          /* Participant Table */
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 py-3 text-muted small fw-semibold">Username</th>
                    <th className="px-4 py-3 text-muted small fw-semibold">Nama Lengkap</th>
                    <th className="px-4 py-3 text-muted small fw-semibold">Email</th>
                    <th className="px-4 py-3 text-muted small fw-semibold">Status</th>
                    <th className="px-4 py-3 text-muted small fw-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="border-top">
                  {participants.map((p) => (
                    <tr key={p.id} className="align-middle">
                      <td className="px-4 py-3">
                        <code className="small text-dark bg-light px-2 py-1 rounded">
                          {p.username}
                        </code>
                      </td>
                      <td className="px-4 py-3 fw-semibold text-dark">
                        {p.full_name}
                      </td>
                      <td className="px-4 py-3 text-muted small">
                        {p.email}
                      </td>
                      <td className="px-4 py-3">
                        {p.is_active ? (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle">
                            Aktif
                          </span>
                        ) : (
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle">
                            Tidak Aktif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="d-flex gap-1">
                          <button 
                            onClick={() => openEditModal(p)}
                            className="btn btn-sm btn-outline-secondary"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => setConfirmDelete({ show: true, id: p.id })}
                            className="btn btn-sm btn-outline-danger"
                            title="Hapus"
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
            {participants.length === 0 && (
              <div className="text-center py-5">
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                     style={{width: '64px', height: '64px'}}>
                  <Users className="text-muted" size={28} />
                </div>
                <p className="text-muted mb-0">Tidak ada peserta</p>
                <small className="text-muted">Klik "Tambah Peserta" untuk memulai</small>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div 
            className="modal fade show d-block" 
            tabIndex="-1" 
            style={{backgroundColor: 'rgba(0,0,0,0.5)'}}
            onClick={handleModalBackdropClick}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold text-dark">
                    {editingParticipant ? 'Edit Peserta' : 'Tambah Peserta'}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowModal(false)}
                    aria-label="Close"
                  />
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label small fw-medium">Username</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className="form-control"
                        placeholder="Masukkan nama pengguna"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-medium">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="form-control"
                        placeholder="Masukkan email"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-medium">Nama Lengkap</label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        className="form-control"
                        placeholder="Masukkan nama lengkap"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-medium">
                        Password {editingParticipant && <span className="text-muted fw-normal">(Kosongkan jika tidak ingin mengubah)</span>}
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="form-control"
                        placeholder={editingParticipant ? "Biarkan kosong jika tidak ingin mengubah" : "Masukkan password"}
                        required={!editingParticipant}
                      />
                    </div>
                  </div>
                  
                  <div className="modal-footer border-top">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      Simpan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {confirmDelete.show && (
          <div 
            className="modal fade show d-block"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Konfirmasi Hapus</h5>
                </div>
                <div className="modal-body">
                  <p>Apakah Anda yakin ingin menghapus peserta ini?</p>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setConfirmDelete({ show: false, id: null })}
                  >
                    Tidak
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={deleteParticipant}
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

// import React, { useEffect, useState } from 'react';
// import { useAuth, api } from '../../contexts/AuthContext';
// import { Link } from 'react-router-dom';
// import { Users, Plus, Trash2, Edit, ArrowLeft, Loader2, X } from 'lucide-react';

// const ParticipantManager = () => {
//   const { user } = useAuth();
//   const [participants, setParticipants] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [editingParticipant, setEditingParticipant] = useState(null);
//   const [formData, setFormData] = useState({
//     username: '',
//     email: '',
//     password: '',
//     full_name: ''
//   });

//   useEffect(() => {
//     fetchParticipants();
//   }, []);

//   const fetchParticipants = async () => {
//     try {
//       setLoading(true);
//       const response = await api.get('/api/admin/participants');
//       console.log('Data peserta:', response.data);
      
//       const data = response.data;
//       const participantsArray = Array.isArray(data) ? data : (data.participants || []);
//       setParticipants(participantsArray);
      
//     } catch (error) {
//       console.error('Gagal mengambil data peserta:', error);
      
//       if (error.response?.status === 401) {
//         console.error('Sesi berakhir, mengarahkan ke halaman login');
//         localStorage.removeItem('token');
//         window.location.href = '/login';
//         return;
//       }
      
//       setParticipants([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     try {
//       if (editingParticipant) {
//         await api.put(`/api/admin/participants/${editingParticipant.id}`, formData);
//       } else {
//         await api.post('/api/admin/participants', formData);
//       }
      
//       setShowModal(false);
//       setEditingParticipant(null);
//       setFormData({ username: '', email: '', password: '', full_name: '' });
//       fetchParticipants();
      
//     } catch (error) {
//       console.error('Gagal menyimpan peserta:', error);
//       alert(error.response?.data?.detail || 'Gagal menyimpan data peserta');
//     }
//   };

//   const deleteParticipant = async (id) => {
//     if (!window.confirm('Yakin ingin menghapus peserta ini?')) return;
    
//     try {
//       await api.delete(`/api/admin/participants/${id}`);
//       fetchParticipants();
//     } catch (error) {
//       console.error('Gagal menghapus peserta:', error);
//       alert(error.response?.data?.detail || 'Gagal menghapus peserta');
//     }
//   };

//   const openEditModal = (participant) => {
//     setEditingParticipant(participant);
//     setFormData({
//       username: participant.username,
//       email: participant.email,
//       full_name: participant.full_name,
//       password: ''
//     });
//     setShowModal(true);
//   };

//   const openCreateModal = () => {
//     setEditingParticipant(null);
//     setFormData({ username: '', email: '', password: '', full_name: '' });
//     setShowModal(true);
//   };

//   const handleModalBackdropClick = (e) => {
//     if (e.target === e.currentTarget) {
//       setShowModal(false);
//     }
//   };

//   return (
//     <div className="min-vh-100 bg-light py-4 py-md-5">
//       <div className="container py-3 py-md-4">
        
//         {/* Back Button */}
//         <div className="mb-4">
//           <Link 
//             to="/admin/dashboard" 
//             className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
//           >
//             <ArrowLeft size={14} />
//             <span>Kembali</span>
//           </Link>
//         </div>

//         {/* Header */}
//         <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
//           <div>
//             <h1 className="h4 fw-bold text-dark mb-1">Kelola Peserta</h1>
//             <p className="text-muted small mb-0">Tambah, edit, atau hapus data peserta</p>
//           </div>
          
//           <button
//             onClick={openCreateModal}
//             className="btn btn-primary d-flex align-items-center gap-2"
//           >
//             <Plus size={18} />
//             Tambah Peserta
//           </button>
//         </div>

//         {/* Loading State */}
//         {loading ? (
//           <div className="text-center py-5">
//             <div className="spinner-border text-primary mb-3" role="status">
//               <span className="visually-hidden">Memuat...</span>
//             </div>
//             <p className="text-muted">Memuat data peserta...</p>
//           </div>
//         ) : (
//           /* Participant Table */
//           <div className="card border-0 shadow-sm">
//             <div className="table-responsive">
//               <table className="table table-hover align-middle mb-0">
//                 <thead className="bg-light">
//                   <tr>
//                     <th className="px-4 py-3 text-muted small fw-semibold">Username</th>
//                     <th className="px-4 py-3 text-muted small fw-semibold">Nama Lengkap</th>
//                     <th className="px-4 py-3 text-muted small fw-semibold">Email</th>
//                     <th className="px-4 py-3 text-muted small fw-semibold">Status</th>
//                     <th className="px-4 py-3 text-muted small fw-semibold">Aksi</th>
//                   </tr>
//                 </thead>
//                 <tbody className="border-top">
//                   {participants.map((p) => (
//                     <tr key={p.id} className="align-middle">
//                       <td className="px-4 py-3">
//                         <code className="small text-dark bg-light px-2 py-1 rounded">
//                           {p.username}
//                         </code>
//                       </td>
//                       <td className="px-4 py-3 fw-semibold text-dark">
//                         {p.full_name}
//                       </td>
//                       <td className="px-4 py-3 text-muted small">
//                         {p.email}
//                       </td>
//                       <td className="px-4 py-3">
//                         {p.is_active ? (
//                           <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle">
//                             Aktif
//                           </span>
//                         ) : (
//                           <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle">
//                             Tidak Aktif
//                           </span>
//                         )}
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="d-flex gap-1">
//                           <button 
//                             onClick={() => openEditModal(p)}
//                             className="btn btn-sm btn-outline-secondary"
//                             title="Edit"
//                           >
//                             <Edit size={14} />
//                           </button>
//                           <button 
//                             onClick={() => deleteParticipant(p.id)}
//                             className="btn btn-sm btn-outline-danger"
//                             title="Hapus"
//                           >
//                             <Trash2 size={14} />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
            
//             {/* Empty State */}
//             {participants.length === 0 && (
//               <div className="text-center py-5">
//                 <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
//                      style={{width: '64px', height: '64px'}}>
//                   <Users className="text-muted" size={28} />
//                 </div>
//                 <p className="text-muted mb-0">Tidak ada peserta</p>
//                 <small className="text-muted">Klik "Tambah Peserta" untuk memulai</small>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Modal */}
//         {showModal && (
//           <div 
//             className="modal fade show d-block" 
//             tabIndex="-1" 
//             style={{backgroundColor: 'rgba(0,0,0,0.5)'}}
//             onClick={handleModalBackdropClick}
//           >
//             <div className="modal-dialog modal-dialog-centered">
//               <div className="modal-content border-0 shadow-lg">
//                 <div className="modal-header border-bottom">
//                   <h5 className="modal-title fw-bold text-dark">
//                     {editingParticipant ? 'Edit Peserta' : 'Tambah Peserta'}
//                   </h5>
//                   <button 
//                     type="button" 
//                     className="btn-close" 
//                     onClick={() => setShowModal(false)}
//                     aria-label="Close"
//                   />
//                 </div>
                
//                 <form onSubmit={handleSubmit}>
//                   <div className="modal-body">
//                     <div className="mb-3">
//                       <label className="form-label small fw-medium">Username</label>
//                       <input
//                         type="text"
//                         value={formData.username}
//                         onChange={(e) => setFormData({...formData, username: e.target.value})}
//                         className="form-control"
//                         placeholder="Masukkan nama pengguna"
//                         required
//                       />
//                     </div>
//                     <div className="mb-3">
//                       <label className="form-label small fw-medium">Email</label>
//                       <input
//                         type="email"
//                         value={formData.email}
//                         onChange={(e) => setFormData({...formData, email: e.target.value})}
//                         className="form-control"
//                         placeholder="Masukkan email"
//                         required
//                       />
//                     </div>
//                     <div className="mb-3">
//                       <label className="form-label small fw-medium">Nama Lengkap</label>
//                       <input
//                         type="text"
//                         value={formData.full_name}
//                         onChange={(e) => setFormData({...formData, full_name: e.target.value})}
//                         className="form-control"
//                         placeholder="Masukkan nama lengkap"
//                         required
//                       />
//                     </div>
//                     <div className="mb-3">
//                       <label className="form-label small fw-medium">
//                         Password {editingParticipant && <span className="text-muted fw-normal">(Kosongkan jika tidak ingin mengubah)</span>}
//                       </label>
//                       <input
//                         type="password"
//                         value={formData.password}
//                         onChange={(e) => setFormData({...formData, password: e.target.value})}
//                         className="form-control"
//                         placeholder={editingParticipant ? "Biarkan kosong jika tidak ingin mengubah" : "Masukkan password"}
//                         required={!editingParticipant}
//                       />
//                     </div>
//                   </div>
                  
//                   <div className="modal-footer border-top">
//                     <button
//                       type="button"
//                       className="btn btn-outline-secondary"
//                       onClick={() => setShowModal(false)}
//                     >
//                       Batal
//                     </button>
//                     <button
//                       type="submit"
//                       className="btn btn-primary"
//                     >
//                       Simpan
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             </div>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// };

// export default ParticipantManager;