// frontend/src/pages/ServicesList.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { servicesService } from '../services/servicesService';
import { receiveServiceService } from '../services/receiveService';
import './css/ServicesList.css';

const serviceTypes = [
  { value: '', label: 'Tất cả lĩnh vực' },
  { value: 'Lập trình Web', label: 'Lập trình Web' },
  { value: 'Lập trình Mobile', label: 'Lập trình Mobile' },
  { value: 'Thiết kế Đồ họa', label: 'Thiết kế Đồ họa' },
  { value: 'Thiết kế UI/UX', label: 'Thiết kế UI/UX' },
  { value: 'Marketing Digital', label: 'Marketing Digital' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'tutoring', label: 'Gia sư' },
  { value: 'repair', label: 'Sửa chữa thiết bị' },
  { value: 'delivery', label: 'Giao hàng' },
  { value: 'cleaning', label: 'Vệ sinh' },
  { value: 'cooking', label: 'Nấu ăn' },
  { value: 'care', label: 'Chăm sóc' },
  { value: 'other', label: 'Khác' },
];

const statusOptions = [
  { value: '', label: 'Tất cả dịch vụ đã duyệt' },
  { value: 'da-duyet', label: 'Đã duyệt' },
  { value: 'dang-thuc-hien', label: 'Đang thực hiện' },
  { value: 'hoan-thanh', label: 'Hoàn thành' },
];

const sortOptions = [
  { value: '-createdAt', label: 'Mới nhất' },
  { value: 'createdAt', label: 'Cũ nhất' },
  { value: '-Gia', label: 'Giá cao → thấp' },
  { value: 'Gia', label: 'Giá thấp → cao' },
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const getStatusLabel = (status) => {
  const labels = {
    'da-duyet': '✅ Đã duyệt',
    'dang-thuc-hien': '🔨 Đang thực hiện',
    'hoan-thanh': '🎉 Hoàn thành',
  };
  return labels[status] || status;
};

const getStatusClass = (status) => {
  const classes = {
    'da-duyet': 'approved',
    'dang-thuc-hien': 'processing',
    'hoan-thanh': 'completed',
  };
  return classes[status] || 'default';
};

function ServicesList({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [services, setServices] = useState([]);
  const [pagination, setPagination] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    minPrice: '',
    maxPrice: '',
    sortBy: '-createdAt',
    page: 1,
  });

  useEffect(() => {
    loadServices();
  }, [filters]);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await servicesService.getServices(filters);
      if (result.success) {
        setServices(result.data.services || []);
        setPagination(result.data.pagination);
      } else {
        setError(result.message || 'Không thể tải danh sách dịch vụ');
      }
    } catch (err) {
      console.error('Error loading services:', err);
      setError(
        err.response?.data?.message || 'Lỗi khi tải danh sách dịch vụ. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1, // Reset to first page when filter changes
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadServices();
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReceiveService = async (serviceId) => {
    if (!user) {
      alert('Vui lòng đăng nhập để nhận dịch vụ');
      navigate('/login');
      return;
    }
    
    if (user.role !== 'member') {
      alert('Chỉ thành viên mới có thể nhận dịch vụ');
      return;
    }

    try {
      const result = await receiveServiceService.receiveService(serviceId);
      if (result.success) {
        alert('Đã nhận dịch vụ thành công!');
        loadServices(); // Reload the services list
      } else {
        alert(result.message || 'Không thể nhận dịch vụ');
      }
    } catch (err) {
      console.error('Error receiving service:', err);
      alert(err.response?.data?.message || 'Lỗi khi nhận dịch vụ');
    }
  };

  const handleSelectService = (service) => {
    if (user) {
      navigate(`/services/${service._id}`);
    } else {
      navigate('/login');
    }
  };

  if (loading && !services.length) {
    return (
      <div className="services-list services-list--loading app-main__centered">
        <div className="services-list__loader">Đang tải danh sách dịch vụ...</div>
      </div>
    );
  }

  return (
    <div className="services-list app-main__centered">
      {/* Header */}
      <div className="services-list__header">
        <div>
          <h1>Danh sách dịch vụ</h1>
          <p>Tìm kiếm và chọn dịch vụ phù hợp với nhu cầu của bạn</p>
        </div>
        {user && (
          <Link to="/requests/new" className="btn btn-primary">
            Tạo yêu cầu mới
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="services-list__filters">
        <form onSubmit={handleSearch} className="services-list__search">
          <input
            type="text"
            placeholder="Tìm kiếm dịch vụ..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="services-list__search-input"
          />
          <button type="submit" className="services-list__search-btn">
            🔍 Tìm kiếm
          </button>
        </form>

        <div className="services-list__filter-row">
          <select
            value={filters.serviceType}
            onChange={(e) => handleFilterChange('serviceType', e.target.value)}
            className="services-list__filter-select"
          >
            {serviceTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="services-list__filter-select"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="services-list__price-filter">
            <input
              type="number"
              placeholder="Giá tối thiểu"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="services-list__price-input"
            />
            <span>—</span>
            <input
              type="number"
              placeholder="Giá tối đa"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="services-list__price-input"
            />
          </div>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="services-list__filter-select"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="services-list__alert services-list__alert--error" role="alert">
          {error}
        </div>
      )}

      {/* Services Grid */}
      {services.length > 0 ? (
        <>
          <div className="services-list__grid">
            {services.map((service) => (
              <article
                key={service._id}
                className="services-list__card"
                onClick={() => navigate(`/services/${service._id}`)}
              >
                <div className="services-list__card-header">
                  <span
                    className={`services-list__status services-list__status--${getStatusClass(
                      service.TrangThai
                    )}`}
                  >
                    {getStatusLabel(service.TrangThai)}
                  </span>
                  <span className="services-list__date">
                    {formatDate(service.createdAt)}
                  </span>
                </div>

                <h3 className="services-list__card-title">{service.TenDichVu}</h3>

                <p className="services-list__card-description">
                  {service.MoTa
                    ? service.MoTa.length > 120
                      ? `${service.MoTa.substring(0, 120)}...`
                      : service.MoTa
                    : 'Không có mô tả'}
                </p>

                <div className="services-list__card-footer">
                  <div className="services-list__card-price">
                    <span className="services-list__price-label">Giá đề xuất</span>
                    <strong className="services-list__price-value">
                      {formatCurrency(service.Gia || service.GiaAI || 0)}
                    </strong>
                  </div>
                  <div className="services-list__card-actions">
                    {user?.role === 'member' && service.TrangThai === 'da-duyet' && (
                      <button 
                        className="services-list__card-btn services-list__card-btn--receive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReceiveService(service._id);
                        }}
                      >
                        Nhận dịch vụ
                      </button>
                    )}
                    <button className="services-list__card-btn">Xem chi tiết →</button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="services-list__pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
                className="services-list__pagination-btn"
              >
                ← Trước
              </button>

              <div className="services-list__pagination-info">
                Trang {pagination.page} / {pagination.totalPages} ({pagination.total} dịch vụ)
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className="services-list__pagination-btn"
              >
                Sau →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="services-list__empty">
          <p>Không tìm thấy dịch vụ nào phù hợp</p>
          <Link to="/requests/new" className="btn btn-primary">
            Tạo yêu cầu mới
          </Link>
        </div>
      )}
    </div>
  );
}

export default ServicesList;

