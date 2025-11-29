// frontend/src/services/adminService.js
import api from '../config/api.js';

// Dashboard
export const getDashboardStats = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

// Users Management
export const getUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const updateUserStatus = async (userId, status) => {
  const response = await api.post(`/admin/user/${userId}/status`, { status });
  return response.data;
};

// Services Management
export const getServices = async (params = {}) => {
  const response = await api.get('/admin/services', { params });
  return response.data;
};

export const createService = async (serviceData) => {
  const response = await api.post('/admin/services', serviceData);
  return response.data;
};

export const updateService = async (id, serviceData) => {
  const response = await api.put(`/admin/services/${id}`, serviceData);
  return response.data;
};

export const deleteService = async (id) => {
  const response = await api.delete(`/admin/services/${id}`);
  return response.data;
};

export const approveService = async (id) => {
  const response = await api.post(`/admin/services/${id}/approve`);
  return response.data;
};

export const rejectService = async (id, reason) => {
  const response = await api.post(`/admin/services/${id}/reject`, { reason });
  return response.data;
};

// Members Management
export const getMembers = async (params = {}) => {
  const response = await api.get('/admin/members', { params });
  return response.data;
};

export const updateMemberStatus = async (id, TrangThai) => {
  const response = await api.put(`/admin/members/${id}/status`, { TrangThai });
  return response.data;
};

// Transactions Management
export const getTransactions = async (params = {}) => {
  const response = await api.get('/admin/transactions', { params });
  return response.data;
};

// Get pending services
export const getPendingServices = async () => {
  const response = await api.get('/admin/services?status=pending');
  return response.data;
};

// Default export with all functions
const adminService = {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  getServices,
  createService,
  updateService,
  deleteService,
  approveService,
  rejectService,
  getMembers,
  updateMemberStatus,
  getTransactions,
  getPendingServices
};

export default adminService;
