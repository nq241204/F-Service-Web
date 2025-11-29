// frontend/src/pages/ServiceDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { servicesService } from '../services/servicesService';
import { memberService } from '../services/memberService';
import Chat from '../components/Chat';
import './css/ServiceDetail.css';

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

function ServiceDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  useEffect(() => {
    fetchServiceDetail();
  }, [id]);

  const fetchServiceDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await servicesService.getServiceById(id);
      if (result.success) {
        setService(result.data);
      } else {
        setError(result.message || 'Không thể tải thông tin dịch vụ.');
      }
    } catch (err) {
      console.error('Error fetching service detail:', err);
      setError(err.response?.data?.message || 'Không thể tải thông tin dịch vụ.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptService = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'member') {
      setError('Bạn cần đăng ký thành viên để nhận dịch vụ này.');
      return;
    }

    setAccepting(true);
    try {
      const result = await memberService.acceptService(id);
      if (result.success) {
        setShowAcceptModal(false);
        // Refresh service data
        await fetchServiceDetail();
      } else {
        setError(result.message || 'Không thể nhận dịch vụ này.');
      }
    } catch (err) {
      console.error('Error accepting service:', err);
      setError(err.response?.data?.message || 'Không thể nhận dịch vụ này.');
    } finally {
      setAccepting(false);
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
    });
  };

  if (loading) {
    return (
      <div className="service-detail app-main__centered">
        <div className="service-detail__loading">
          <div className="service-detail__spinner"></div>
          <p>Đang tải thông tin dịch vụ...</p>
        </div>
      </div>
    );
  }

  if (error && !service) {
    return (
      <div className="service-detail app-main__centered">
        <div className="service-detail__error">
          <span className="service-detail__error-icon">⚠</span>
          <h2>Không tìm thấy dịch vụ</h2>
          <p>{error}</p>
          <Link to="/services" className="service-detail__back-btn">
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  if (!service) {
    return null;
  }

  const userId = user?._id || user?.id;
  const isOwner = user && service.NguoiDung && userId === service.NguoiDung._id;
  const canAccept = user && user.role === 'member' && service.TrangThai === 'cho-duyet' && !isOwner;
  const isAccepted = service.TrangThai === 'da-nhan' || service.TrangThai === 'dang-xu-ly';

  return (
    <div className="service-detail app-main__centered">
      <div className="service-detail__container">
        {/* Breadcrumb */}
        <nav className="service-detail__breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <Link to="/services">Dịch vụ</Link>
          <span>/</span>
          <span>{service.TenDichVu}</span>
        </nav>

        {/* Error Alert */}
        {error && (
          <div className="service-detail__alert service-detail__alert--error">
            <span className="service-detail__alert-icon">⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div className="service-detail__main">
          {/* Left Column - Main Content */}
          <div className="service-detail__content">
            {/* Header */}
            <div className="service-detail__header">
              <div className="service-detail__header-top">
                <h1 className="service-detail__title">{service.TenDichVu}</h1>
                <span
                  className={`service-detail__status service-detail__status--${statusColors[service.TrangThai] || 'default'}`}
                >
                  {statusLabels[service.TrangThai] || service.TrangThai}
                </span>
              </div>
              <div className="service-detail__meta">
                <div className="service-detail__meta-item">
                  <span className="service-detail__meta-label">Người tạo:</span>
                  <span className="service-detail__meta-value">
                    {service.NguoiDung?.name || 'Không xác định'}
                  </span>
                </div>
                <div className="service-detail__meta-item">
                  <span className="service-detail__meta-label">Ngày tạo:</span>
                  <span className="service-detail__meta-value">
                    {formatDate(service.createdAt)}
                  </span>
                </div>
                {service.ThoiGianHoanThanh && (
                  <div className="service-detail__meta-item">
                    <span className="service-detail__meta-label">Thời gian hoàn thành:</span>
                    <span className="service-detail__meta-value">
                      {formatDate(service.ThoiGianHoanThanh)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="service-detail__section">
              <h2 className="service-detail__section-title">Mô tả dịch vụ</h2>
              <div className="service-detail__description">
                {service.MoTa ? (
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>{service.MoTa}</p>
                ) : (
                  <p className="service-detail__empty">Chưa có mô tả</p>
                )}
              </div>
            </div>

            {/* Member Info (if assigned) */}
            {service.ThanhVien && (
              <div className="service-detail__section">
                <h2 className="service-detail__section-title">Thành viên được giao</h2>
                <div className="service-detail__member-card">
                  <div className="service-detail__member-info">
                    <h3>{service.ThanhVien.Ten || 'Không xác định'}</h3>
                    <div className="service-detail__member-details">
                      <span className="service-detail__member-badge">
                        {service.ThanhVien.CapBac || 'N/A'}
                      </span>
                      <span className="service-detail__member-field">
                        {service.ThanhVien.LinhVuc || 'N/A'}
                      </span>
                    </div>
                    {/* Contact Information */}
                    <div className="service-detail__member-contact">
                      <h4 className="service-detail__contact-title">Thông tin liên lạc</h4>
                      <div className="service-detail__contact-info">
                        {service.ThanhVien.SoDienThoai && (
                          <div className="service-detail__contact-item">
                            <span className="service-detail__contact-label">📱 Số điện thoại:</span>
                            <span className="service-detail__contact-value">
                              <a href={`tel:${service.ThanhVien.SoDienThoai}`} className="service-detail__contact-link">
                                {service.ThanhVien.SoDienThoai}
                              </a>
                            </span>
                          </div>
                        )}
                        {service.ThanhVien.Email && (
                          <div className="service-detail__contact-item">
                            <span className="service-detail__contact-label">📧 Email:</span>
                            <span className="service-detail__contact-value">
                              <a href={`mailto:${service.ThanhVien.Email}`} className="service-detail__contact-link">
                                {service.ThanhVien.Email}
                              </a>
                            </span>
                          </div>
                        )}
                        {service.ThanhVien.DiaChi && (
                          <div className="service-detail__contact-item">
                            <span className="service-detail__contact-label">📍 Địa chỉ:</span>
                            <span className="service-detail__contact-value">
                              {service.ThanhVien.DiaChi}
                            </span>
                          </div>
                        )}
                        {!service.ThanhVien.SoDienThoai && !service.ThanhVien.Email && !service.ThanhVien.DiaChi && (
                          <p className="service-detail__contact-empty">Chưa có thông tin liên lạc</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rating (if completed) */}
            {service.DanhGia && service.DanhGia.Sao && (
              <div className="service-detail__section">
                <h2 className="service-detail__section-title">Đánh giá</h2>
                <div className="service-detail__rating">
                  <div className="service-detail__rating-stars">
                    {'★'.repeat(service.DanhGia.Sao)}
                    {'☆'.repeat(5 - service.DanhGia.Sao)}
                  </div>
                  {service.DanhGia.NhanXet && (
                    <p className="service-detail__rating-comment">{service.DanhGia.NhanXet}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="service-detail__sidebar">
            <div className="service-detail__card">
              <div className="service-detail__price-section">
                <div className="service-detail__price-label">Giá dịch vụ</div>
                <div className="service-detail__price-value">{formatCurrency(service.Gia)}</div>
                {service.GiaAI && service.GiaAI !== service.Gia && (
                  <div className="service-detail__price-ai">
                    <span className="service-detail__price-ai-label">Giá AI đề xuất:</span>
                    <span className="service-detail__price-ai-value">
                      {formatCurrency(service.GiaAI)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="service-detail__actions">
                {isOwner ? (
                  <div className="service-detail__owner-notice">
                    <p>Đây là dịch vụ của bạn</p>
                  </div>
                ) : canAccept ? (
                  <button
                    className="service-detail__accept-btn"
                    onClick={() => setShowAcceptModal(true)}
                  >
                    Nhận dịch vụ này
                  </button>
                ) : isAccepted ? (
                  <div className="service-detail__accepted-notice">
                    <p>Dịch vụ đã được nhận</p>
                  </div>
                ) : !user ? (
                  <Link to="/login" className="service-detail__login-btn">
                    Đăng nhập để nhận dịch vụ
                  </Link>
                ) : user.role !== 'member' ? (
                  <Link to="/member/register" className="service-detail__register-btn">
                    Đăng ký thành viên
                  </Link>
                ) : null}
              </div>

              {/* Info Box */}
              <div className="service-detail__info-box">
                <h3 className="service-detail__info-title">Thông tin quan trọng</h3>
                <ul className="service-detail__info-list">
                  <li>Dịch vụ sẽ được hệ thống duyệt trước khi giao cho thành viên</li>
                  <li>Thành viên sẽ nhận 95% phí dịch vụ sau khi hoàn thành</li>
                  <li>Bạn có thể thương lượng giá với thành viên</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Section - Show for owner and assigned member */}
      {service && user && (isOwner || isAccepted) && (
        <div className="service-detail__chat-section">
          <div className="service-detail__chat-container">
            <Chat 
              serviceId={service._id} 
              currentUser={user}
              onNewMessage={(updatedChat) => {
                console.log('Chat updated:', updatedChat);
              }}
            />
          </div>
        </div>
      )}

      {/* Accept Modal */}
      {showAcceptModal && (
        <div className="service-detail__modal-overlay" onClick={() => setShowAcceptModal(false)}>
          <div className="service-detail__modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="service-detail__modal-title">Xác nhận nhận dịch vụ</h3>
            <p className="service-detail__modal-text">
              Bạn có chắc chắn muốn nhận dịch vụ <strong>{service.TenDichVu}</strong>?
            </p>
            <div className="service-detail__modal-actions">
              <button
                className="service-detail__modal-btn service-detail__modal-btn--cancel"
                onClick={() => setShowAcceptModal(false)}
                disabled={accepting}
              >
                Hủy
              </button>
              <button
                className="service-detail__modal-btn service-detail__modal-btn--confirm"
                onClick={handleAcceptService}
                disabled={accepting}
              >
                {accepting ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceDetail;

