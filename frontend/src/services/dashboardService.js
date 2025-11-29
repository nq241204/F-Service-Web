// frontend/src/services/dashboardService.js
import api from '../config/api';

export const dashboardService = {
  // Lấy dữ liệu dashboard tổng hợp
  getDashboardData: async () => {
    const response = await api.get('/user/dashboard');
    return response.data;
  },

  // Lấy dữ liệu trang chủ
  getHomeData: async () => {
    const response = await api.get('/user/home');
    return response.data;
  },

  // Lấy thống kê chi tiết
  getStats: async () => {
    const response = await api.get('/user/stats');
    return response.data;
  },

  // Lấy profile với thống kê
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  // Lấy lịch sử giao dịch
  getTransactions: async (page = 1, limit = 10) => {
    const response = await api.get('/user/transactions', {
      params: { page, limit },
    });
    return response.data;
  },

  // Lấy danh sách ủy thác
  getCommissions: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/user/commissions', { params });
    return response.data;
  },

  // Lấy danh sách yêu cầu của user
  getRequests: async () => {
    const response = await api.get('/user/requests');
    return response.data;
  },

  // Lấy chi tiết yêu cầu
  getRequestDetail: async (id) => {
    const response = await api.get(`/user/requests/${id}`);
    return response.data;
  },

  // Tạo yêu cầu mới
  createRequest: async (requestData) => {
    const response = await api.post('/user/create-request', requestData);
    return response.data;
  },

  // Cập nhật profile
  updateProfile: async (profileData) => {
    const response = await api.put('/user/profile', profileData);
    return response.data;
  },
};

