// frontend/src/services/servicesService.js
import api from '../config/api';

export const servicesService = {
  // Lấy danh sách dịch vụ với filter và pagination
  getServices: async (filters = {}) => {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 12,
      ...(filters.search && { search: filters.search }),
      ...(filters.status && { status: filters.status }),
      ...(filters.serviceType && { linhVuc: filters.serviceType }),
      ...(filters.minPrice && { minPrice: filters.minPrice }),
      ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
      ...(filters.sortBy && { sortBy: filters.sortBy }),
    };
    const response = await api.get('/services/list', { params });
    return response.data;
  },

  // Lấy chi tiết dịch vụ
  getServiceById: async (id) => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },
};

