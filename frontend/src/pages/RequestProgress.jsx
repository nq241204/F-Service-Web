// frontend/src/pages/RequestProgress.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import './css/RequestProgress.css';

const RequestProgress = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progressUpdates, setProgressUpdates] = useState([]);

  useEffect(() => {
    loadRequestData();
  }, [id]);

  const loadRequestData = async () => {
    try {
      setLoading(true);
      const result = await dashboardService.getRequestDetail(id);
      if (result.success) {
        setRequest(result.data);
        // Mock progress updates - trong thực tế sẽ lấy từ API
        setProgressUpdates(generateMockProgressUpdates(result.data));
      } else {
        setError(result.message || 'Không thể tải thông tin yêu cầu.');
      }
    } catch (err) {
      console.error('Error fetching request:', err);
      setError('Lỗi khi tải thông tin yêu cầu.');
    } finally {
      setLoading(false);
    }
  };

  const generateMockProgressUpdates = (requestData) => {
    const updates = [];
    const createdAt = new Date(requestData.createdAt || requestData.NgayTao);
    
    // Initial request
    updates.push({
      id: 1,
      type: 'created',
      title: 'Yêu cầu đã được tạo',
      description: 'Yêu cầu dịch vụ của bạn đã được gửi và đang chờ duyệt.',
      timestamp: createdAt,
      status: 'completed'
    });

    // Approved
    if (['da-nhan', 'dang-xu-ly', 'hoan-thanh'].includes(requestData.TrangThai)) {
      const approvedTime = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
      updates.push({
        id: 2,
        type: 'approved',
        title: 'Yêu cầu đã được duyệt',
        description: 'Yêu cầu của bạn đã được hệ thống phê duyệt và đang tìm thành viên phù hợp.',
        timestamp: approvedTime,
        status: 'completed'
      });
    }

    // Member assigned
    if (requestData.ThanhVien && ['dang-xu-ly', 'hoan-thanh'].includes(requestData.TrangThai)) {
      const assignedTime = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000); // 4 hours later
      updates.push({
        id: 3,
        type: 'assigned',
        title: 'Thành viên đã nhận yêu cầu',
        description: `${requestData.ThanhVien.Ten} đã nhận yêu cầu của bạn và bắt đầu xử lý.`,
        timestamp: assignedTime,
        status: 'completed',
        member: requestData.ThanhVien
      });
    }

    // In progress
    if (requestData.TrangThai === 'dang-xu-ly') {
      const progressTime = new Date(createdAt.getTime() + 6 * 60 * 60 * 1000); // 6 hours later
      updates.push({
        id: 4,
        type: 'progress',
        title: 'Đang thực hiện dịch vụ',
        description: 'Thành viên đang thực hiện dịch vụ theo yêu cầu của bạn.',
        timestamp: progressTime,
        status: 'current'
      });
    }

    // Completed
    if (requestData.TrangThai === 'hoan-thanh') {
      const completedTime = new Date(createdAt.getTime() + 8 * 60 * 60 * 1000); // 8 hours later
      updates.push({
        id: 4,
        type: 'progress',
        title: 'Đang thực hiện dịch vụ',
        description: 'Thành viên đang thực hiện dịch vụ theo yêu cầu của bạn.',
        timestamp: new Date(createdAt.getTime() + 6 * 60 * 60 * 1000),
        status: 'completed'
      });
      
      updates.push({
        id: 5,
        type: 'completed',
        title: 'Dịch vụ đã hoàn thành',
        description: 'Dịch vụ đã được hoàn thành. Vui lòng kiểm tra và đánh giá chất lượng.',
        timestamp: completedTime,
        status: 'current'
      });
    }

    return updates.sort((a, b) => b.timestamp - a.timestamp);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    return 'Vừa xong';
  };

  const getProgressIcon = (type) => {
    const icons = {
      created: '📝',
      approved: '✅',
      assigned: '👤',
      progress: '⚡',
      completed: '🎉'
    };
    return icons[type] || '📋';
  };

  const getProgressColor = (status) => {
    const colors = {
      completed: 'success',
      current: 'primary',
      pending: 'secondary'
    };
    return colors[status] || 'secondary';
  };

  const getCompletionPercentage = () => {
    if (!request) return 0;
    const statusWeights = {
      'cho-duyet': 20,
      'da-nhan': 40,
      'dang-xu-ly': 70,
      'hoan-thanh': 100
    };
    return statusWeights[request.TrangThai] || 0;
  };

  if (loading) {
    return (
      <div className="request-progress request-progress--loading">
        <div className="request-progress__container">
          <div className="request-progress__loading">
            <div className="spinner"></div>
            <p>Đang tải thông tin tiến độ...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="request-progress">
        <div className="request-progress__container">
          <div className="request-progress__error">
            <span className="request-progress__error-icon">⚠</span>
            <h2>Không tìm thấy yêu cầu</h2>
            <p>{error}</p>
            <Link to="/my-requests" className="btn btn-primary">
              ← Quay lại danh sách yêu cầu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return null;
  }

  return (
    <div className="request-progress">
      <div className="request-progress__container">
        {/* Header */}
        <div className="request-progress__header">
          <Link to="/my-requests" className="request-progress__back">
            ← Quay lại yêu cầu của tôi
          </Link>
          <h1 className="request-progress__title">Theo dõi tiến độ</h1>
          <div className="request-progress__request-info">
            <h2>{request.TenDichVu}</h2>
            <div className="request-progress__request-meta">
              <span className="request-progress__price">{formatCurrency(request.Gia)}</span>
              <span className={`request-progress__status request-progress__status--${request.TrangThai}`}>
                {request.TrangThai === 'cho-duyet' && 'Chờ duyệt'}
                {request.TrangThai === 'da-nhan' && 'Đã nhận'}
                {request.TrangThai === 'dang-xu-ly' && 'Đang xử lý'}
                {request.TrangThai === 'hoan-thanh' && 'Hoàn thành'}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="request-progress__overview">
          <div className="request-progress__progress-bar">
            <div 
              className="request-progress__progress-fill"
              style={{ width: `${getCompletionPercentage()}%` }}
            ></div>
          </div>
          <div className="request-progress__progress-text">
            {getCompletionPercentage()}% hoàn thành
          </div>
        </div>

        {/* Member Info */}
        {request.ThanhVien && (
          <div className="request-progress__member">
            <h3>Thành viên thực hiện</h3>
            <div className="request-progress__member-card">
              <div className="request-progress__member-avatar">
                {request.ThanhVien.Ten?.charAt(0) || 'M'}
              </div>
              <div className="request-progress__member-info">
                <div className="request-progress__member-name">{request.ThanhVien.Ten}</div>
                <div className="request-progress__member-level">
                  {request.ThanhVien.CapBac} • {request.ThanhVien.LinhVuc}
                </div>
                {request.ThanhVien.DiemDanhGiaTB && (
                  <div className="request-progress__member-rating">
                    ⭐ {request.ThanhVien.DiemDanhGiaTB.toFixed(1)}
                  </div>
                )}
              </div>
              <div className="request-progress__member-contact">
                {request.ThanhVien.SoDienThoai && (
                  <a href={`tel:${request.ThanhVien.SoDienThoai}`} className="btn btn-outline btn-sm">
                    📞 Gọi
                  </a>
                )}
                {request.ThanhVien.Email && (
                  <a href={`mailto:${request.ThanhVien.Email}`} className="btn btn-outline btn-sm">
                    📧 Email
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="request-progress__timeline">
          <h3>Lịch sử tiến độ</h3>
          <div className="request-progress__timeline-list">
            {progressUpdates.map((update, index) => (
              <div 
                key={update.id} 
                className={`request-progress__timeline-item request-progress__timeline-item--${getProgressColor(update.status)}`}
              >
                <div className="request-progress__timeline-icon">
                  {getProgressIcon(update.type)}
                </div>
                <div className="request-progress__timeline-content">
                  <div className="request-progress__timeline-header">
                    <h4>{update.title}</h4>
                    <div className="request-progress__timeline-time">
                      <span>{formatDate(update.timestamp)}</span>
                      <span className="request-progress__timeline-relative">
                        {formatRelativeTime(update.timestamp)}
                      </span>
                    </div>
                  </div>
                  <p className="request-progress__timeline-description">
                    {update.description}
                  </p>
                  {update.member && (
                    <div className="request-progress__timeline-member">
                      <span>Thực hiện bởi: {update.member.Ten}</span>
                    </div>
                  )}
                </div>
                {index < progressUpdates.length - 1 && (
                  <div className="request-progress__timeline-connector"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="request-progress__actions">
          {request.TrangThai === 'hoan-thanh' && (
            <Link to={`/requests/${id}/review`} className="btn btn-success">
              ⭐ Đánh giá dịch vụ
            </Link>
          )}
          
          <Link to={`/requests/${id}`} className="btn btn-outline">
            📋 Xem chi tiết yêu cầu
          </Link>
          
          {request.ThanhVien && (
            <Link to={`/messages/${request.ThanhVien._id}`} className="btn btn-primary">
              💬 Nhắn tin cho thành viên
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestProgress;
