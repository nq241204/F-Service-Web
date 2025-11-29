import api from '../config/api';

export const receiveServiceService = {
  // Member nhận dịch vụ
  receiveService: async (serviceId) => {
    const response = await api.post('/service/receive', { serviceId });
    return response.data;
  }
};
