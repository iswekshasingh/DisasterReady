import axios from 'axios';
import { storage } from './storage';

// API Base URL from Vite environment variable with safe fallback
// Use same-origin in deployed builds (configure a reverse proxy there), while
// allowing Vite's development proxy to reach the local Express API.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach Bearer token if present
api.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and cached user
      storage.clearAuth();
      // Dispatch custom event so AuthContext handles logout cleanly
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  register: async (payload) => {
    const res = await api.post('/api/auth/register', payload);
    return res.data;
  },

  login: async (credentials) => {
    const res = await api.post('/api/auth/login', credentials);
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/api/auth/me');
    return res.data;
  },
};

// Leaderboard endpoint
export const leaderboardApi = {
  getLeaderboard: async () => {
    const res = await api.get('/api/leaderboard');
    return res.data;
  },
};

export default api;
