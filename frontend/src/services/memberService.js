// frontend/src/services/memberService.js
import api from '../config/api';

export const memberService = {
  // Register as member
  register: async (memberData) => {
    const response = await api.post('/member/register', memberData);
    return response.data;
  },

  // Get member profile
  getProfile: async () => {
    const response = await api.get('/member/profile');
    return response.data;
  },

  // Update member profile
  updateProfile: async (profileData) => {
    const response = await api.put('/member/profile', profileData);
    return response.data;
  },

  // Get member dashboard
  getDashboard: async () => {
    const response = await api.get('/member/dashboard');
    return response.data;
  },

  // Accept service request
  acceptService: async (serviceId) => {
    const response = await api.post(`/member/service/accept/${serviceId}`);
    return response.data;
  },

  // Reject/cancel accepted service
  rejectService: async (serviceId) => {
    const response = await api.post(`/member/service/reject/${serviceId}`);
    return response.data;
  },

  // Get available requests
  getAvailableRequests: async () => {
    const response = await api.get('/member/requests/available');
    return response.data;
  },

  // Get accepted requests
  getAcceptedRequests: async () => {
    const response = await api.get('/member/requests/accepted');
    return response.data;
  },

  // Negotiate price for service
  negotiatePrice: async (serviceId, giaThoaThuan) => {
    const response = await api.post(`/member/negotiate-price/${serviceId}`, {
      giaThoaThuan
    });
    return response.data;
  },

  // Complete commission
  completeCommission: async (serviceId, danhGia) => {
    const response = await api.post(`/member/complete-commission/${serviceId}`, {
      danhGia
    });
    return response.data;
  },

  // Get completed commissions
  getCompletedCommissions: async () => {
    const response = await api.get('/member/commissions/completed');
    return response.data;
  },
};

