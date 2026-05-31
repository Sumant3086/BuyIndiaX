/**
 * Shared Axios instance — single source of truth for API config.
 * All components import this instead of creating their own axios instances
 * or hardcoding API_URL.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Global response error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear local auth state
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      // Dispatch a custom event so AuthContext can react
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export default api;
