// frontend/src/services/profileService.js
import api from './api';

// Get user profile
export const getProfile = async () => {
  try {
    const response = await api.get('/api/user/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi tải thông tin cá nhân' };
  }
};

// Update user profile
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/api/user/profile', profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi cập nhật thông tin cá nhân' };
  }
};

// Update user avatar
export const updateAvatar = async (avatarUrl) => {
  try {
    const response = await api.patch('/api/user/profile/avatar', { avatar: avatarUrl });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi cập nhật avatar' };
  }
};

// Update user preferences
export const updatePreferences = async (preferences) => {
  try {
    const response = await api.patch('/api/user/profile/preferences', { preferences });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi cập nhật cài đặt' };
  }
};
