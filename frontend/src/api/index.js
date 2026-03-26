import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('staff_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('staff_token');
      localStorage.removeItem('staff_user');
      window.location.href = '/signin';
    }
    return Promise.reject(err);
  }
);

export const recordService = {
  getRecords: (params) => api.get('/records', { params }),
  createRecord: (data) => api.post('/records', data),
  getRecordById: (id) => api.get(`/records/${id}`),
  updateRecord: (id, data) => api.put(`/records/${id}`, data),
  deleteRecord: (id) => api.delete(`/records/${id}`),
};

export const certificateService = {
  upload: (categoryId, file) => {
    const fd = new FormData();
    fd.append('certificate', file);
    return api.post(`/certificates/${categoryId}/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  download: (categoryId) => api.get(`/certificates/${categoryId}/download`, { responseType: 'blob' }),
};

export const exportService = {
  exportExcel: (params) => api.get('/exports/excel', { params, responseType: 'blob' }),
  exportPdf: (params) => api.get('/exports/pdf', { params, responseType: 'blob' }),
};

export const authService = {
  staffLogin: (credentials) => api.post('/auth/staff/login', credentials),
  adminLogin: (credentials) => api.post('/auth/admin/login', credentials),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const adminService = {
  createStaff: (data) => api.post('/auth/admin/staff', data),
  listStaff: () => api.get('/auth/admin/staff'),
  deleteStaff: (id) => api.delete(`/auth/admin/staff/${id}`),
};

export default api;
