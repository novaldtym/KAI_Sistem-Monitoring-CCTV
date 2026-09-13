import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth APIs ---
export const loginApi = (data) => api.post('/auth/login', data);
export const getMeApi = () => api.get('/auth/me');
export const getOfficersApi = () => api.get('/auth/officers');

// --- Dashboard APIs ---
export const getDashboardSummaryApi = () => api.get('/dashboard/summary');
export const getPendingCountApi = () => api.get('/dashboard/pending-count');

// --- Station APIs ---
export const getStationsApi = () => api.get('/stations');
export const getStationByIdApi = (id) => api.get(`/stations/${id}`);
export const createStationApi = (data) => api.post('/stations', data);
export const updateStationApi = (id, data) => api.put(`/stations/${id}`, data);
export const deleteStationApi = (id) => api.delete(`/stations/${id}`);

// --- CCTV Point APIs ---
export const getCCTVPointsByStationApi = (stationId) => api.get(`/cctv-points/station/${stationId}`);
export const createCCTVPointApi = (data) => api.post('/cctv-points', data);
export const updateCCTVPointApi = (id, data) => api.put(`/cctv-points/${id}`, data);
export const reorderCCTVPointsApi = (items) => api.patch('/cctv-points/reorder', { items });
export const deleteCCTVPointApi = (id) => api.delete(`/cctv-points/${id}`);

// --- Report APIs ---
export const getReportsApi = (params) => api.get('/reports', { params });
export const getReportByIdApi = (id) => api.get(`/reports/${id}`);
export const createReportApi = (data) => api.post('/reports', data);
export const updateReportApi = (id, data) => api.put(`/reports/${id}`, data);
export const submitReportApi = (id) => api.patch(`/reports/${id}/submit`);
export const approveReportApi = (id, komentar) => api.patch(`/reports/${id}/approve`, { komentar });
export const rejectReportApi = (id, komentar) => api.patch(`/reports/${id}/reject`, { komentar });
export const downloadReportPdfApi = (id) => api.get(`/reports/${id}/pdf`, { responseType: 'blob' });

export default api;
