// frontend/src/pages/MyRequests.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { serviceRequestService } from '../services/serviceRequestService';
import './css/MyRequests.css';

const MyRequests = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, in-progress, completed, cancelled

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const result = await serviceRequestService.getMyRequests();
      console.log('MyRequests - API result:', result);
      if (result.success) {
        setRequests(result.data || []);
        console.log('MyRequests - Requests loaded:', result.data);
      } else {
        setError('Không thể tải danh sách yêu cầu');
        console.error('MyRequests - API error:', result.message);
      }
    } catch (err) {
      console.error('MyRequests - Error loading requests:', err);
      setError('Lỗi khi tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'cho-duyet': 'warning',
      'da-nhan': 'info', 
      'dang-xu-ly': 'primary',
      'hoan-thanh': 'success',
      'huy-bo': 'danger',
      'pending': 'warning',
      'in-progress': 'primary',
      'completed': 'success',
      'cancelled': 'danger'
    };
    return colors[status] || 'secondary';
  };

  const getStatusText = (status) => {
    const texts = {
      'cho-duyet': 'Chờ duyệt',
      'da-nhan': 'Đã nhận',
      'dang-xu-ly': 'Đang xử lý', 
      'hoan-thanh': 'Hoàn thành',
      'huy-bo': 'Đã hủy',
      'pending': 'Chờ duyệt',
      'in-progress': 'Đang xử lý',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return texts[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['cho-duyet', 'pending'].includes(request.TrangThai);
    if (filter === 'in-progress') return ['da-nhan', 'dang-xu-ly', 'in-progress'].includes(request.TrangThai);
    if (filter === 'completed') return ['hoan-thanh', 'completed'].includes(request.TrangThai);
    if (filter === 'cancelled') return ['huy-bo', 'cancelled'].includes(request.TrangThai);
    return true;
  });

  const RequestCard = ({ request }) => {
    const isAssigned = request.ThanhVien && request.ThanhVien._id;
    const canTrackProgress = ['da-nhan', 'dang-xu-ly', 'in-progress'].includes(request.TrangThai);

    return (
      <div className="my-requests__card">
        <div className="my-requests__card-header">
          <div className="my-requests__title-section">
            <h3 className="my-requests__title">{request.TenDichVu}</h3>
            <span className={`my-requests__status my-requests__status--${getStatusColor(request.TrangThai)}`}>
              {getStatusText(request.TrangThai)}
            </span>
          </div>
          <div className="my-requests__price">
            {formatCurrency(request.Gia)}
          </div>
        </div>

        <div className="my-requests__description">
          <p>{request.MoTa}</p>
        </div>

        <div className="my-requests__meta">
          <div className="my-requests__meta-item">
            <span className="my-requests__meta-label">Lĩnh vực:</span>
            <span className="my-requests__meta-value">{request.LinhVuc}</span>
          </div>
          <div className="my-requests__meta-item">
            <span className="my-requests__meta-label">Ngày tạo:</span>
            <span className="my-requests__meta-value">{formatDate(request.NgayTao)}</span>
          </div>
          {request.NgayCapNhat && (
            <div className="my-requests__meta-item">
              <span className="my-requests__meta-label">Cập nhật:</span>
              <span className="my-requests__meta-value">{formatDate(request.NgayCapNhat)}</span>
            </div>
          )}
        </div>

        {isAssigned && (
          <div className="my-requests__assigned-member">
            <div className="my-requests__member-info">
              <div className="my-requests__member-avatar">
                {request.ThanhVien.Ten?.charAt(0) || 'M'}
              </div>
              <div className="my-requests__member-details">
                <div className="my-requests__member-name">{request.ThanhVien.Ten}</div>
                <div className="my-requests__member-level">
                  {request.ThanhVien.CapBac} • {request.ThanhVien.LinhVuc}
                </div>
                {request.ThanhVien.DiemDanhGiaTB && (
                  <div className="my-requests__member-rating">
                    ⭐ {request.ThanhVien.DiemDanhGiaTB.toFixed(1)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="my-requests__actions">
          {request.TrangThai === 'cho-duyet' && (
            <Link to={`/requests/${request._id}`} className="btn btn-outline">
              📋 Xem chi tiết
            </Link>
          )}

          {isAssigned && canTrackProgress && (
            <Link to={`/requests/${request._id}/progress`} className="btn btn-primary">
              📊 Theo dõi tiến độ
            </Link>
          )}

          {request.TrangThai === 'hoan-thanh' && (
            <Link to={`/requests/${request._id}/review`} className="btn btn-success">
              ⭐ Đánh giá dịch vụ
            </Link>
          )}

          <Link to={`/requests/${request._id}`} className="btn btn-secondary">
              Xem chi tiết
            </Link>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="my-requests my-requests--loading">
        <div className="my-requests__container">
          <div className="my-requests__loading">
            <div className="spinner"></div>
            <p>Đang tải danh sách yêu cầu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-requests">
      <div className="my-requests__container">
        <div className="my-requests__header">
          <Link to="/dashboard" className="my-requests__back">
            ← Quay lại Dashboard
          </Link>
          <h1 className="my-requests__title">Yêu cầu của tôi</h1>
          <p className="my-requests__subtitle">
            Quản lý và theo dõi tất cả các yêu cầu dịch vụ của bạn
          </p>
        </div>

        {error && (
          <div className="my-requests__error">
            {error}
          </div>
        )}

        <div className="my-requests__filters">
          <button
            className={`my-requests__filter ${filter === 'all' ? 'my-requests__filter--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả ({requests.length})
          </button>
          <button
            className={`my-requests__filter ${filter === 'pending' ? 'my-requests__filter--active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Chờ duyệt ({requests.filter(r => ['cho-duyet', 'pending'].includes(r.TrangThai)).length})
          </button>
          <button
            className={`my-requests__filter ${filter === 'in-progress' ? 'my-requests__filter--active' : ''}`}
            onClick={() => setFilter('in-progress')}
          >
            Đang thực hiện ({requests.filter(r => ['da-nhan', 'dang-xu-ly', 'in-progress'].includes(r.TrangThai)).length})
          </button>
          <button
            className={`my-requests__filter ${filter === 'completed' ? 'my-requests__filter--active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Hoàn thành ({requests.filter(r => ['hoan-thanh', 'completed'].includes(r.TrangThai)).length})
          </button>
          <button
            className={`my-requests__filter ${filter === 'cancelled' ? 'my-requests__filter--active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Đã hủy ({requests.filter(r => ['huy-bo', 'cancelled'].includes(r.TrangThai)).length})
          </button>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="my-requests__empty">
            <div className="my-requests__empty-icon">📋</div>
            <h3>Chưa có yêu cầu nào</h3>
            <p>
              {filter === 'all' 
                ? 'Bạn chưa tạo yêu cầu dịch vụ nào. Hãy tạo yêu cầu đầu tiên ngay!'
                : `Không có yêu cầu nào ở trạng thái "${getStatusText(filter)}"`
              }
            </p>
            {filter === 'all' && (
              <Link to="/requests/new" className="btn btn-primary">
                ➕ Tạo yêu cầu mới
              </Link>
            )}
            <div className="my-requests__debug-info" style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginTop: '1rem',
              fontSize: '0.875rem',
              color: 'white',
              textAlign: 'left',
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              <p><strong>Debug Info:</strong></p>
              <p>Tổng số requests: {requests.length}</p>
              <p>Filter hiện tại: {filter}</p>
              <details>
                <summary>Raw requests data</summary>
                <pre style={{ fontSize: '0.75rem', overflow: 'auto' }}>
                  {JSON.stringify(requests.map(r => ({ 
                    id: r._id, 
                    title: r.TenDichVu, 
                    status: r.TrangThai 
                  })), null, 2)}
                </pre>
              </details>
            </div>
          </div>
        ) : (
          <div className="my-requests__list">
            {filteredRequests.map((request) => (
              <RequestCard key={request._id} request={request} />
            ))}
          </div>
        )}

        <div className="my-requests__footer">
          <Link to="/requests/new" className="btn btn-primary">
            ➕ Tạo yêu cầu mới
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyRequests;
