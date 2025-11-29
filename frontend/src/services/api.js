// frontend/src/services/api.js
import axios from 'axios';
import authUtilsEnhanced from '../utils/authUtilsEnhanced';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = authUtilsEnhanced.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - use enhanced authUtils to clear all storage
      authUtilsEnhanced.clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
