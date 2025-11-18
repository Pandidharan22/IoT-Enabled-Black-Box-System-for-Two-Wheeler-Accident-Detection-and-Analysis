import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Device API calls
export const deviceApi = {
  getAll: () => apiClient.get('/api/devices'),
  getById: (deviceId: string) => apiClient.get(`/api/devices/${deviceId}`),
  create: (data: any) => apiClient.post('/api/devices', data),
  update: (deviceId: string, data: any) => apiClient.patch(`/api/devices/${deviceId}`, data),
  getStatus: (deviceId: string) => apiClient.get(`/api/devices/${deviceId}/status`),
};

// Event API calls
export const eventApi = {
  getCrashes: (params?: any) => apiClient.get('/api/events/crashes', { params }),
  getCrashById: (eventId: string) => apiClient.get(`/api/events/crashes/${eventId}`),
  updateCrash: (eventId: string, data: any) => apiClient.patch(`/api/events/crashes/${eventId}`, data),
  
  getPanics: (params?: any) => apiClient.get('/api/events/panics', { params }),
  getPanicById: (eventId: string) => apiClient.get(`/api/events/panics/${eventId}`),
  updatePanic: (eventId: string, data: any) => apiClient.patch(`/api/events/panics/${eventId}`, data),
};

// Telemetry API calls
export const telemetryApi = {
  getByDevice: (deviceId: string, params?: any) => 
    apiClient.get(`/api/telemetry/device/${deviceId}`, { params }),
  getLastLocation: (deviceId: string) => 
    apiClient.get(`/api/telemetry/device/${deviceId}/last-location`),
  create: (data: any) => apiClient.post('/api/telemetry', data),
};

export default apiClient;
