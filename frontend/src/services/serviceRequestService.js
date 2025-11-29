// frontend/src/services/serviceRequestService.js
import api from '../config/api';

export const serviceRequestService = {
  // Tạo yêu cầu dịch vụ mới
  createRequest: async (requestData) => {
    const response = await api.post('/user/create-request', {
      title: requestData.title,
      description: requestData.description,
      price: requestData.price,
      address: requestData.address,
      expectedDate: requestData.expectedDate,
      serviceType: requestData.serviceType,
      isNewService: requestData.isNewService,
      suggestion: requestData.suggestion,
      customServiceType: requestData.customServiceType,
      contactPhone: requestData.contactPhone,
      contactEmail: requestData.contactEmail,
      contactMethod: requestData.contactMethod,
    });
    return response.data;
  },

  // Lấy danh sách dịch vụ có sẵn
  getAvailableServices: async () => {
    const response = await api.get('/services/list?limit=20');
    return {
      success: response.data.success,
      data: response.data.data?.services || []
    };
  },

  // Lấy danh sách yêu cầu của user
  getMyRequests: async () => {
    const response = await api.get('/user/requests');
    return response.data;
  },
};

