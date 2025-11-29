// services/chatService.js - Chat system service
import api from './api';

export const chatService = {
  // Get all chats for current user
  getChats: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/chat', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Lỗi khi lấy danh sách cuộc trò chuyện' };
    }
  },

  // Get chat by service ID
  getChatByService: async (serviceId) => {
    try {
      const response = await api.get(`/chat/service/${serviceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Lỗi khi lấy thông tin cuộc trò chuyện' };
    }
  },

  // Send message
  sendMessage: async (chatId, messageData) => {
    try {
      const response = await api.post(`/chat/${chatId}/message`, {
        content: messageData.content,
        type: messageData.type || 'text',
        fileUrl: messageData.fileUrl || null,
        fileName: messageData.fileName || null,
        metadata: messageData.metadata || {}
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Lỗi khi gửi tin nhắn' };
    }
  },

  // Mark chat as read
  markAsRead: async (chatId) => {
    try {
      const response = await api.put(`/chat/${chatId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Lỗi khi đánh dấu đã đọc' };
    }
  },

  // Send price negotiation
  negotiatePrice: async (chatId, priceOffer) => {
    try {
      const response = await api.post(`/chat/${chatId}/negotiate`, {
        priceOffer
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Lỗi khi gửi đề nghị giá' };
    }
  },

  // Agree to price
  agreeToPrice: async (chatId) => {
    try {
      const response = await api.post(`/chat/${chatId}/agree-price`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Lỗi khi đồng ý giá' };
    }
  },

  // Get unread count for all chats
  getUnreadCount: async () => {
    try {
      const response = await api.get('/chat');
      const chats = response.data.data?.chats || [];
      return chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
};
