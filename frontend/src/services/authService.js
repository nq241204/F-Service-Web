// frontend/src/services/authService.js
import api from '../config/api.js';
import authUtilsEnhanced from '../utils/authUtilsEnhanced.js';

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.success && response.data.token) {
      // Use authUtilsEnhanced instead of secureStorage
      authUtilsEnhanced.setAuth(response.data.token, response.data.user);
    }
    return response.data;
  },

  login: async (email, password) => {
    try {
      console.log('🔍 authService.login - Starting request');
      console.log('🔍 Request data:', { email, password: password ? 'PROVIDED' : 'MISSING' });
      
      const response = await api.post('/auth/login', { email, password });
      
      console.log('🔍 authService.login - Response received');
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response data:', response.data);
      
      if (response.data.success && response.data.token) {
        // Sử dụng authUtilsEnhanced để lưu với multiple storages
        authUtilsEnhanced.setAuth(response.data.token, response.data.user);
        console.log('✅ Login - saved with enhanced authUtils:', response.data.user.email);
      } else {
        console.log('❌ Login failed - no success/token in response');
      }
      
      return response.data;
    } catch (error) {
      console.log('🔥 authService.login - Error caught:', error);
      console.log('🔥 Error response:', error.response?.data);
      console.log('🔥 Error status:', error.response?.status);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.log('Logout API error:', error);
    } finally {
      // Set logout flag to prevent auto-restore
      sessionStorage.setItem('justLoggedOut', 'true');
      
      // Sử dụng authUtilsEnhanced để clear tất cả storage
      authUtilsEnhanced.clearAuth();
      console.log('🗑️ Logout - cleared all storage with enhanced authUtils');
      
      // Force redirect to home page
      window.location.href = '/';
    }
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    try {
      const formData = new FormData();
      
      // Only append fields that have values
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== undefined && profileData[key] !== null && profileData[key] !== '') {
          formData.append(key, profileData[key]);
        }
      });
      
      const response = await api.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error.response?.data);
      throw error;
    }
  },

  updatePassword: async (passwordData) => {
    const response = await api.put('/auth/password', passwordData);
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.put('/auth/password', passwordData);
    return response.data;
  },

  resetPasswordRequest: async (email) => {
    const response = await api.post('/auth/reset-password', { email });
    return response.data;
  },

  resetPassword: async (token, password, confirmPassword) => {
    const response = await api.put(`/auth/reset-password/${token}`, {
      password,
      confirmPassword,
    });
    return response.data;
  },
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const getUser = () => {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};

export const isAuthenticated = () => {
  return !!getToken();
};

