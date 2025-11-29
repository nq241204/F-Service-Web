// frontend/src/pages/RequestDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import './css/ServiceDetail.css'; // Reuse the same styles

const statusLabels = {
  'cho-duyet': 'Chờ duyệt',
  'da-nhan': 'Đã nhận',
  'dang-xu-ly': 'Đang xử lý',
  'hoan-thanh': 'Hoàn thành',
  'huy-bo': 'Hủy bỏ',
};

const statusColors = {
  'cho-duyet': 'pending',
  'da-nhan': 'accepted',
  'dang-xu-ly': 'processing',
  'hoan-thanh': 'completed',
  'huy-bo': 'cancelled',
};

function RequestDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequestDetail();
  }, [id]);

  const fetchRequestDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await dashboardService.getRequestDetail(id);
      if (result.success) {
        setRequest(result.data);
      } else {
        setError(result.message || 'Không thể tải thông tin yêu cầu.');
      }
    } catch (err) {
      console.error('Error fetching request detail:', err);
      setError(err.response?.data?.message || 'Không thể tải thông tin yêu cầu.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'Chưa có';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="service-detail app-main__centered">
        <div className="service-detail__loading">
          <div className="service-detail__spinner"></div>
          <p>Đang tải thông tin yêu cầu...</p>
        </div>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="service-detail app-main__centered">
        <div className="service-detail__error">
          <span className="service-detail__error-icon">⚠</span>
          <h2>Không tìm thấy yêu cầu</h2>
          <p>{error}</p>
          <Link to="/dashboard" className="service-detail__back-btn">
            ← Quay lại dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!request) {
    return null;
  }

  return (
    <div className="service-detail app-main__centered">
      <div className="service-detail__container">
        {/* Breadcrumb */}
        <nav className="service-detail__breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <Link to="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>{request.TenDichVu}</span>
        </nav>

        {/* Error Alert */}
        {error && (
          <div className="service-detail__alert service-detail__alert--error">
            <span>⚠</span>
            <p>{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="service-detail__content">
          {/* Service Header */}
          <header className="service-detail__header">
            <div className="service-detail__header-left">
              <h1>{request.TenDichVu}</h1>
              <span className={`service-detail__status service-detail__status--${statusColors[request.TrangThai]}`}>
                {statusLabels[request.TrangThai]}
              </span>
            </div>
            <div className="service-detail__header-right">
              <div className="service-detail__price">
                <span className="service-detail__price-label">Giá dịch vụ</span>
                <strong>{formatCurrency(request.Gia)}</strong>
              </div>
              {request.GiaAI && request.GiaAI !== request.Gia && (
                <div className="service-detail__price-ai">
                  <span>AI gợi ý: {formatCurrency(request.GiaAI)}</span>
                </div>
              )}
            </div>
          </header>

          {/* Main Section */}
          <section className="service-detail__main">
            {/* Left Column - Description */}
            <div className="service-detail__left">
              {/* Description */}
              <article className="service-detail__section">
                <h2>Mô tả chi tiết</h2>
                <div className="service-detail__description">
                  <p>{request.MoTa}</p>
                </div>
              </article>

              {/* Details */}
              <article className="service-detail__section">
                <h2>Thông tin yêu cầu</h2>
                <div className="service-detail__details">
                  <div className="service-detail__detail-row">
                    <span className="service-detail__detail-label">Lĩnh vực</span>
                    <span className="service-detail__detail-value">{request.LinhVuc}</span>
                  </div>
                  <div className="service-detail__detail-row">
                    <span className="service-detail__detail-label">Đơn vị tính</span>
                    <span className="service-detail__detail-value">{request.DonVi || 'VND'}</span>
                  </div>
                  <div className="service-detail__detail-row">
                    <span className="service-detail__detail-label">Ngày tạo</span>
                    <span className="service-detail__detail-value">{formatDate(request.createdAt)}</span>
                  </div>
                  {request.ThoiGianHoanThanh && (
                    <div className="service-detail__detail-row">
                      <span className="service-detail__detail-label">Ngày hoàn thành</span>
                      <span className="service-detail__detail-value">{formatDate(request.ThoiGianHoanThanh)}</span>
                    </div>
                  )}
                </div>
              </article>

              {/* Rating (if completed) */}
              {request.DanhGia && request.DanhGia.Sao && (
                <article className="service-detail__section">
                  <h2>Đánh giá</h2>
                  <div className="service-detail__rating">
                    <div className="service-detail__stars">
                      {'⭐'.repeat(request.DanhGia.Sao)}
                    </div>
                    {request.DanhGia.NhanXet && (
                      <p>{request.DanhGia.NhanXet}</p>
                    )}
                  </div>
                </article>
              )}
            </div>

            {/* Right Column - Provider Info */}
            <aside className="service-detail__right">
              {/* Provider Card */}
              {request.ThanhVien ? (
                <article className="service-detail__provider">
                  <h3>Người nhận</h3>
                  <div className="service-detail__provider-info">
                    <div className="service-detail__provider-header">
                      <h4>{request.ThanhVien.Ten}</h4>
                      <span className="service-detail__provider-tier">{request.ThanhVien.CapBac}</span>
                    </div>
                    <div className="service-detail__provider-details">
                      <p>
                        <strong>Lĩnh vực:</strong> {request.ThanhVien.LinhVuc}
                      </p>
                      <p>
                        <strong>Đánh giá:</strong> {request.ThanhVien.DiemDanhGiaTB}⭐
                      </p>
                    </div>
                    {/* Contact Information */}
                    <div className="service-detail__member-contact">
                      <h4 className="service-detail__contact-title">Thông tin liên lạc</h4>
                      <div className="service-detail__contact-info">
                        {request.ThanhVien.SoDienThoai && (
                          <div className="service-detail__contact-item">
                            <span className="service-detail__contact-label">📱 Số điện thoại:</span>
                            <span className="service-detail__contact-value">
                              <a href={`tel:${request.ThanhVien.SoDienThoai}`} className="service-detail__contact-link">
                                {request.ThanhVien.SoDienThoai}
                              </a>
                            </span>
                          </div>
                        )}
                        {request.ThanhVien.Email && (
                          <div className="service-detail__contact-item">
                            <span className="service-detail__contact-label">📧 Email:</span>
                            <span className="service-detail__contact-value">
                              <a href={`mailto:${request.ThanhVien.Email}`} className="service-detail__contact-link">
                                {request.ThanhVien.Email}
                              </a>
                            </span>
                          </div>
                        )}
                        {request.ThanhVien.DiaChi && (
                          <div className="service-detail__contact-item">
                            <span className="service-detail__contact-label">📍 Địa chỉ:</span>
                            <span className="service-detail__contact-value">
                              {request.ThanhVien.DiaChi}
                            </span>
                          </div>
                        )}
                        {!request.ThanhVien.SoDienThoai && !request.ThanhVien.Email && !request.ThanhVien.DiaChi && (
                          <p className="service-detail__contact-empty">Chưa có thông tin liên lạc</p>
                        )}
                      </div>
                    </div>
                    <Link to={`/member/${request.ThanhVien._id}`} className="service-detail__link">
                      Xem hồ sơ →
                    </Link>
                  </div>
                </article>
              ) : (
                <article className="service-detail__provider">
                  <h3>Trạng thái</h3>
                  <div className="service-detail__provider-info">
                    <p className="service-detail__status-message">
                      Yêu cầu này đang chờ được thành viên phù hợp nhận
                    </p>
                  </div>
                </article>
              )}

              {/* Action Buttons */}
              <div className="service-detail__actions">
                <Link to="/dashboard" className="btn btn-outline">
                  ← Quay lại
                </Link>
              </div>

              {/* Info Box */}
              <article className="service-detail__info-box">
                <h3>Thông tin thêm</h3>
                <ul>
                  <li>
                    <span>Trạng thái:</span>
                    <strong>{statusLabels[request.TrangThai]}</strong>
                  </li>
                  <li>
                    <span>Giá dịch vụ:</span>
                    <strong>{formatCurrency(request.Gia)}</strong>
                  </li>
                  {request.GiaAI && (
                    <li>
                      <span>Giá AI gợi ý:</span>
                      <strong>{formatCurrency(request.GiaAI)}</strong>
                    </li>
                  )}
                </ul>
              </article>
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
}

export default RequestDetail;
