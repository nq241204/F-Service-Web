// frontend/src/services/memberRegistrationService.js
import api from './api.js';

const memberRegistrationService = {
  // Register new member
  registerMember: async (memberData) => {
    try {
      const response = await api.post('/auth/register-member', memberData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Lỗi đăng ký thành viên' };
    }
  },

  // Get member registration status
  getMemberStatus: async (userId) => {
    try {
      const response = await api.get(`/auth/member-status/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Lỗi lấy trạng thái thành viên' };
    }
  },

  // Resend member confirmation email
  resendConfirmation: async (email) => {
    try {
      const response = await api.post('/auth/resend-member-confirmation', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Lỗi gửi lại email xác nhận' };
    }
  }
};

export default memberRegistrationService;
