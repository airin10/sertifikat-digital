import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (data) => api.post('/api/auth/register', data),
  getProfile: () => api.get('/api/auth/profile'),
};

export const adminApi = {
  // Participants
  getParticipants: () => api.get('/api/admin/participants'),
  createParticipant: (data) => api.post('/api/admin/participants', data),
  updateParticipant: (id, data) => api.put(`/api/admin/participants/${id}`, data),
  deleteParticipant: (id) => api.delete(`/api/admin/participants/${id}`),
  
  // Certificates
  getCertificates: (params) => api.get('/api/admin/certificates', { params }),
  createCertificate: (formData) => api.post('/api/admin/certificates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
    createCertificateSingle: (formData) => {
    return api.post('/api/admin/certificates/single-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // OCR Preview 
  previewOcr: (formData) => {
    return api.post('/api/admin/utils/ocr-preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteCertificate: (id) => api.delete(`/api/admin/certificates/${id}`),
  getDashboardStats: () => api.get('/api/admin/dashboard/stats'),
  
  // Get participants for dropdown
  getParticipantsList: () => api.get('/api/admin/participants?limit=1000'),
};

// Participant APIs
export const participantApi = {
  getMyCertificates: () => api.get('/api/participant/certificates'),
  getCertificateDetail: (id) => api.get(`/api/participant/certificates/${id}`),
  downloadCertificate: (id) => api.get(`/api/participant/certificates/${id}/download`, {
    responseType: 'blob'
  }),
  getProfile: () => api.get('/api/participant/profile'),
};

// Public/Verification APIs
export const verifyApi = {
  verifyCertificate: (formData) => api.post('/api/verify', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getPublicStats: () => api.get('/api/verify/stats'),
};

// OCR API 
export const ocrApi = {
  extractText: (formData) => api.post('/api/ocr/extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const certificateApi = {
  // Health check
  checkHealth: () => api.get('/health'),
  
  // Get public key
  getPublicKey: () => api.get('/api/public-key'),
  
  // Extract text (preview OCR)
  extractText: (formData) => api.post('/api/extract-text', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Create certificate (auto OCR + sign)
  createCertificate: (formData) => api.post('/api/sign', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Verify certificate
  verifyCertificate: (formData) => api.post('/api/verify', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // List certificates
  listCertificates: () => api.get('/api/certificates'),
  
  // Download certificate
  downloadCertificate: (certId) => api.get(`/api/certificates/${certId}/download`, {
    responseType: 'blob'
  }),
};

export const checkBackendConnection = async () => {
  try {
    const response = await api.get('/health');
    return {
      connected: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
};

export default api;