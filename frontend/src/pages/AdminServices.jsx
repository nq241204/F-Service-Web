// frontend/src/pages/AdminServices.jsx
import React, { useState, useEffect } from 'react';
import { getServices, createService, updateService, deleteService, approveService, rejectService } from '../services/adminService';
import authUtilsEnhanced from '../utils/authUtilsEnhanced';
import './css/AdminServices.css';

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [formData, setFormData] = useState({
    Ten: '',
    MoTa: '',
    LinhVuc: '',
    GiaThamKhao: '',
    DonVi: 'VND',
    TrangThai: 'active'
  });

  // Handle service completion approval
  const handleApproveCompletion = async (serviceId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/approve-completion/${serviceId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ danhGia: 5 }) // Default rating
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('🎉 Đã duyệt hoàn thành dịch vụ! Tiền đã được chuyển cho member.');
        fetchServices();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Không thể duyệt hoàn thành dịch vụ.');
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      console.error('Error approving completion:', err);
      setError('Lỗi khi duyệt hoàn thành dịch vụ.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const linhVucOptions = [
    'Gia sư',
    'Sửa chữa điện tử',
    'Vận chuyển',
    'Làm vườn',
    'Dọn dẹp nhà cửa',
    'Sửa chữa nhà',
    'Chăm sóc thú cưng',
    'Nấu ăn',
    'Khác'
  ];

  useEffect(() => {
    // Check authentication before loading data
    if (!authUtilsEnhanced.validateAuth()) {
      setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      setLoading(false);
      return;
    }
    
    // Check if user is admin
    const userData = authUtilsEnhanced.getUserData();
    if (!userData || userData.role !== 'admin') {
      setError('Bạn không có quyền truy cập trang này.');
      setLoading(false);
      return;
    }
    
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchServices(1);
  }, [filter]);

  const fetchServices = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: pagination.limit };
      if (filter) params.status = filter;
      
      const data = await getServices(params);
      console.log('Services data received:', data);
      setServices(data.data?.services || []);
      setPagination(data.data?.pagination || pagination);
      setError('');
    } catch (err) {
      console.error('Error fetching services:', err);
      
      // Use authUtils to handle auth errors
      if (authUtilsEnhanced.handleAuthError(err)) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      
      setError('Không thể tải danh sách dịch vụ.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        Ten: service.TenDichVu || '',
        MoTa: service.MoTa || '',
        LinhVuc: service.LinhVuc || '',
        GiaThamKhao: service.Gia || '',
        DonVi: service.DonVi || 'VND',
        TrangThai: service.TrangThai || 'cho-duyet'
      });
    } else {
      setEditingService(null);
      setFormData({
        Ten: '',
        MoTa: '',
        LinhVuc: '',
        GiaThamKhao: '',
        DonVi: 'VND',
        TrangThai: 'cho-duyet'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
    setFormData({
      Ten: '',
      MoTa: '',
      LinhVuc: '',
      GiaThamKhao: '',
      DonVi: 'VND',
      TrangThai: 'cho-duyet'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingService) {
        await updateService(editingService._id, formData);
        setSuccess('Cập nhật dịch vụ thành công!');
      } else {
        await createService(formData);
        setSuccess('Tạo dịch vụ mới thành công!');
      }
      
      handleCloseModal();
      fetchServices();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving service:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dịch vụ.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      return;
    }

    try {
      await deleteService(id);
      setSuccess('Xóa dịch vụ thành công!');
      fetchServices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting service:', err);
      setError(err.response?.data?.message || 'Không thể xóa dịch vụ.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveService(id);
      setSuccess('Dịch vụ đã được phê duyệt và tiền đã chuyển cho chủ dịch vụ!');
      fetchServices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error approving service:', err);
      setError(err.response?.data?.message || 'Không thể phê duyệt dịch vụ.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Vui lòng nhập lý do từ chối dịch vụ:');
    if (!reason) return;

    try {
      await rejectService(id, reason);
      setSuccess('Dịch vụ đã bị từ chối và tiền đã hoàn trả!');
      fetchServices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error rejecting service:', err);
      setError(err.response?.data?.message || 'Không thể từ chối dịch vụ.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="admin-services-page">
      {/* Header */}
      <div className="admin-services-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">🛠️ Quản Lý Dịch Vụ</h1>
            <p className="page-subtitle">Thêm, sửa, xóa các dịch vụ trong hệ thống</p>
          </div>
          <button onClick={() => handleOpenModal()} className="btn-create">
            ➕ Tạo dịch vụ mới
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {success && (
        <div className="alert alert-success">
          ✅ {success}
        </div>
      )}
      
      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-label">Lọc theo trạng thái:</div>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === '' ? 'active' : ''}`}
            onClick={() => setFilter('')}
          >
            Tất cả
          </button>
          <button 
            className={`filter-btn ${filter === 'cho-duyet' ? 'active' : ''}`}
            onClick={() => setFilter('cho-duyet')}
          >
            Chờ duyệt
          </button>
          <button 
            className={`filter-btn ${filter === 'da-duyet' ? 'active' : ''}`}
            onClick={() => setFilter('da-duyet')}
          >
            Đã duyệt
          </button>
          <button 
            className={`filter-btn ${filter === 'dang-thuc-hien' ? 'active' : ''}`}
            onClick={() => setFilter('dang-thuc-hien')}
          >
            Đang thực hiện
          </button>
          <button 
            className={`filter-btn ${filter === 'hoan-thanh' ? 'active' : ''}`}
            onClick={() => setFilter('hoan-thanh')}
          >
            Hoàn thành
          </button>
          <button 
            className={`filter-btn ${filter === 'huy-bo' ? 'active' : ''}`}
            onClick={() => setFilter('huy-bo')}
          >
            Hủy bỏ
          </button>
        </div>
      </div>

      {/* Services List */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dịch vụ...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3 className="empty-title">Chưa có dịch vụ nào</h3>
          <p className="empty-description">Hãy tạo dịch vụ đầu tiên của bạn</p>
          <button onClick={() => handleOpenModal()} className="btn-create">
            ➕ Tạo dịch vụ mới
          </button>
        </div>
      ) : (
        <div className="services-grid">
          {services.map((service) => (
            <div key={service._id} className="service-card">
              <div className="service-card-header">
                <div className="service-info">
                  <h3 className="service-name">{service.TenDichVu}</h3>
                  <span className={`service-status status-${service.TrangThai}`}>
                    {service.TrangThai === 'cho-duyet' ? '⏳ Chờ duyệt' : 
                     service.TrangThai === 'da-nhan' ? '👤 Đã nhận' : 
                     service.TrangThai === 'dang-xu-ly' ? '🔄 Đang xử lý' : 
                     service.TrangThai === 'hoan-thanh' ? '✅ Hoàn thành' : 
                     service.TrangThai === 'huy-bo' ? '❌ Hủy bỏ' : '❓ Không xác định'}
                  </span>
                </div>
              </div>

              <div className="service-card-body">
                <div className="service-field">
                  <span className="field-label">Lĩnh vực:</span>
                  <span className="field-value">{service.LinhVuc}</span>
                </div>

                {service.NguoiDung && (
                  <div className="service-field">
                    <span className="field-label">Người tạo:</span>
                    <span className="field-value">{service.NguoiDung.name} ({service.NguoiDung.email})</span>
                  </div>
                )}

                {service.ThanhVien && (
                  <div className="service-field">
                    <span className="field-label">Thành viên:</span>
                    <span className="field-value">{service.ThanhVien.Ten} - {service.ThanhVien.CapBac}</span>
                  </div>
                )}

                {service.MoTa && (
                  <div className="service-description">
                    {service.MoTa}
                  </div>
                )}

                <div className="service-price">
                  <span className="price-label">Giá:</span>
                  <span className="price-value">
                    {service.Gia ? formatCurrency(service.Gia) : 'Chưa có'}
                  </span>
                </div>
              </div>

              <div className="service-card-actions">
                {service.TrangThai === 'cho-duyet' && (
                  <>
                    <button 
                      onClick={() => handleApprove(service._id)}
                      className="btn-approve"
                    >
                      ✅ Phê duyệt
                    </button>
                    <button 
                      onClick={() => handleReject(service._id)}
                      className="btn-reject"
                    >
                      ❌ Từ chối
                    </button>
                  </>
                )}
                {service.TrangThai === 'cho-duyet-hoan-thanh' && (
                  <button 
                    onClick={() => handleApproveCompletion(service._id)}
                    className="btn-approve"
                    style={{ backgroundColor: '#28a745' }}
                  >
                    🎉 Duyệt hoàn thành
                  </button>
                )}
                <button 
                  onClick={() => handleOpenModal(service)}
                  className="btn-edit"
                >
                  ✏️ Sửa
                </button>
                <button 
                  onClick={() => handleDelete(service._id)}
                  className="btn-delete"
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} dịch vụ
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => fetchServices(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              ← Trước
            </button>
            
            {[...Array(pagination.pages)].map((_, index) => {
              const pageNum = index + 1;
              const showPage = pageNum === 1 || pageNum === pagination.pages || 
                             (pageNum >= pagination.page - 2 && pageNum <= pagination.page + 2);
              
              if (!showPage) {
                if (pageNum === pagination.page - 3 || pageNum === pagination.page + 3) {
                  return <span key={pageNum} className="pagination-ellipsis">...</span>;
                }
                return null;
              }
              
              return (
                <button
                  key={pageNum}
                  className={`pagination-btn ${pageNum === pagination.page ? 'active' : ''}`}
                  onClick={() => fetchServices(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              className="pagination-btn"
              onClick={() => fetchServices(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              Sau →
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingService ? '✏️ Chỉnh sửa dịch vụ' : '➕ Tạo dịch vụ mới'}
              </h2>
              <button onClick={handleCloseModal} className="modal-close">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Tên dịch vụ *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.Ten || ''}
                  onChange={(e) => setFormData({ ...formData, Ten: e.target.value })}
                  required
                  placeholder="VD: Gia sư Toán học"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lĩnh vực *</label>
                <select
                  className="form-select"
                  value={formData.LinhVuc || ''}
                  onChange={(e) => setFormData({ ...formData, LinhVuc: e.target.value })}
                  required
                >
                  <option value="">-- Chọn lĩnh vực --</option>
                  {linhVucOptions.map((lv) => (
                    <option key={lv} value={lv}>{lv}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-textarea"
                  value={formData.MoTa || ''}
                  onChange={(e) => setFormData({ ...formData, MoTa: e.target.value })}
                  rows="4"
                  placeholder="Mô tả chi tiết về dịch vụ..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Giá tham khảo</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.GiaThamKhao || ''}
                    onChange={(e) => setFormData({ ...formData, GiaThamKhao: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Đơn vị</label>
                  <select
                    className="form-select"
                    value={formData.DonVi || 'VND'}
                    onChange={(e) => setFormData({ ...formData, DonVi: e.target.value })}
                  >
                    <option value="VND">VND</option>
                    <option value="giờ">Giờ</option>
                    <option value="buổi">Buổi</option>
                    <option value="lần">Lần</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <select
                  className="form-select"
                  value={formData.TrangThai}
                  onChange={(e) => setFormData({ ...formData, TrangThai: e.target.value })}
                >
                  <option value="cho-duyet">Chờ duyệt</option>
                  <option value="da-duyet">Đã duyệt</option>
                  <option value="dang-thuc-hien">Đang thực hiện</option>
                  <option value="hoan-thanh">Hoàn thành</option>
                  <option value="huy-bo">Hủy bỏ</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal} className="btn-cancel">
                  Hủy
                </button>
                <button type="submit" className="btn-submit">
                  {editingService ? '💾 Lưu thay đổi' : '➕ Tạo dịch vụ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServices;
