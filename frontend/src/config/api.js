// frontend/src/config/api.js
import axios from 'axios';
import authUtilsEnhanced from '../utils/authUtilsEnhanced';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request-level token cache to prevent multiple retrievals
let requestTokenCache = null;
let requestTokenCacheTime = 0;
const REQUEST_TOKEN_CACHE_DURATION = 500; // 500ms

// Make cache accessible globally for clearing
export const clearRequestTokenCache = () => {
  requestTokenCache = null;
  requestTokenCacheTime = 0;
};

// Add token to requests

api.interceptors.request.use(
  (config) => {
    // Use request-level cache first
    const now = Date.now();
    if (requestTokenCache && (now - requestTokenCacheTime) < REQUEST_TOKEN_CACHE_DURATION) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 API Request:', config.method?.toUpperCase(), config.url);
        console.log('🔍 Token from request cache:', !!requestTokenCache);
        console.log('🔍 Token length:', requestTokenCache?.length || 0);
      }
      
      if (requestTokenCache) {
        config.headers.Authorization = `Bearer ${requestTokenCache}`;
      }
      return config;
    }
    
    // Use only authUtilsEnhanced for consistent token management
    const token = authUtilsEnhanced.getToken();
    
    // Update request cache
    requestTokenCache = token;
    requestTokenCacheTime = now;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 API Request:', config.method?.toUpperCase(), config.url);
      console.log('🔍 Token exists:', !!token);
      console.log('🔍 Token length:', token?.length || 0);
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No token available for request:', config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API Response:', response.config.method?.toUpperCase(), response.config.url);
      console.log('✅ Response status:', response.status);
      console.log('✅ Response data:', response.data);
    }
    return response;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ API Error:', error.config?.method?.toUpperCase(), error.config?.url);
      console.log('❌ Error status:', error.response?.status);
      console.log('❌ Error data:', error.response?.data);
      console.log('❌ Error message:', error.message);
    }
    
    // Handle 401/403 errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('🔥 Auth error response:', error.response.status);
      // Use authUtilsEnhanced to clear all storage
      authUtilsEnhanced.clearAuth();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;

