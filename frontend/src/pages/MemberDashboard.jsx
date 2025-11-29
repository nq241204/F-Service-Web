import React, { useState, useEffect } from 'react';
import { memberService } from '../services/memberService';
import './css/MemberDashboard.css';

const MemberDashboard = () => {
  const [activeTab, setActiveTab] = useState('available');
  const [availableRequests, setAvailableRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [completedCommissions, setCompletedCommissions] = useState([]);
  const [memberStats, setMemberStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [negotiating, setNegotiating] = useState(null);
  const [negotiatePrice, setNegotiatePrice] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch all data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      // Get dashboard for member stats
      const dashboardRes = await memberService.getDashboard();
      if (dashboardRes.success) {
        setMemberStats(dashboardRes.data);
      } else {
        console.warn('Dashboard API returned:', dashboardRes.message);
      }

      // Get available requests
      const availableRes = await memberService.getAvailableRequests();
      if (availableRes.success) {
        setAvailableRequests(availableRes.data || []);
      } else {
        console.warn('Available requests API returned:', availableRes.message);
        setAvailableRequests([]);
      }

      // Get accepted requests
      const acceptedRes = await memberService.getAcceptedRequests();
      if (acceptedRes.success) {
        setAcceptedRequests(acceptedRes.data || []);
      } else {
        console.warn('Accepted requests API returned:', acceptedRes.message);
        setAcceptedRequests([]);
      }

      // Get completed commissions
      const completedRes = await memberService.getCompletedCommissions();
      if (completedRes.success) {
        setCompletedCommissions(completedRes.data || []);
      } else {
        console.warn('Completed commissions API returned:', completedRes.message);
        setCompletedCommissions([]);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('❌ Không thể tải dữ liệu. Vui lòng thử lại.');
      // Set empty arrays to prevent UI crashes
      setAvailableRequests([]);
      setAcceptedRequests([]);
      setCompletedCommissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (serviceId) => {
    if (window.confirm('Bạn có chắc chắn muốn nhận yêu cầu này? Tiền sẽ được ký quỹ từ ví khách hàng.')) {
      try {
        const res = await memberService.acceptService(serviceId);
        if (res.success) {
          setSuccess('✅ Đã nhận yêu cầu thành công! Yêu cầu đã chuyển sang danh sách "Đã Nhận".');
          // Add small delay to ensure backend updates
          setTimeout(() => {
            loadAllData();
          }, 500);
          setTimeout(() => setSuccess(''), 5000);
        }
      } catch (err) {
        setError('❌ Lỗi khi nhận yêu cầu: ' + (err.response?.data?.message || err.message));
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  const handleRejectRequest = async (serviceId) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy yêu cầu này?')) {
      try {
        const res = await memberService.rejectService(serviceId);
        if (res.success) {
          setSuccess('Hủy yêu cầu thành công!');
          loadAllData();
          setTimeout(() => setSuccess(''), 3000);
        }
      } catch (err) {
        setError('Lỗi khi hủy yêu cầu: ' + err.message);
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleStartNegotiate = (serviceId) => {
    setNegotiating(serviceId);
    setNegotiatePrice('');
  };

  const handleSubmitNegotiate = async (serviceId) => {
    if (!negotiatePrice || negotiatePrice <= 0) {
      setError('Giá thỏa thuận phải lớn hơn 0');
      return;
    }

    try {
      const res = await memberService.negotiatePrice(serviceId, parseInt(negotiatePrice));
      if (res.success) {
        setSuccess('Thỏa thuận giá thành công!');
        setNegotiating(null);
        setNegotiatePrice('');
        loadAllData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Lỗi khi thỏa thuận: ' + err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCompleteCommission = async (serviceId) => {
    if (window.confirm('🎉 Bạn có chắc chắn muốn hoàn thành ủy thác này?\n\n• Người dùng sẽ nhận thông báo xác nhận\n• Bạn cần chờ người dùng xác nhận trước khi admin duyệt\n• Không thể hoàn tác sau khi gửi yêu cầu')) {
      try {
        const res = await memberService.completeCommission(serviceId, 5);
        if (res.success) {
          setSuccess(`🎉 ${res.message || 'Yêu cầu hoàn thành đã được gửi đến người dùng! Vui lòng chờ xác nhận.'}`);
          loadAllData();
          setTimeout(() => setSuccess(''), 5000);
        }
      } catch (err) {
        setError('❌ Lỗi khi hoàn thành ủy thác: ' + (err.response?.data?.message || err.message));
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  if (loading) {
    return <div className="member-dashboard">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="member-dashboard">
      {/* Header with stats */}
      <div className="dashboard-header">
        <h1>Bảng Điều Khiển Thành Viên</h1>
        {memberStats && (
          <div className="member-stats">
            <div className="stat-card">
              <div className="stat-label">Điểm EXP</div>
              <div className="stat-value">{memberStats.member?.DiemExp || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Ủy Thác Đang Xử Lý</div>
              <div className="stat-value">{memberStats.commissions?.inProgressCommissions || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Tổng Kiếm</div>
              <div className="stat-value">{(memberStats.commissions?.totalEarned || 0).toLocaleString()}đ</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Số Dư Ví</div>
              <div className="stat-value">{(memberStats.wallet?.balance || memberStats.walletBalance || 0).toLocaleString()}đ</div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Yêu Cầu Có Sẵn ({availableRequests.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'accepted' ? 'active' : ''}`}
          onClick={() => setActiveTab('accepted')}
        >
          Yêu Cầu Đã Nhận ({acceptedRequests.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Ủy Thác Hoàn Thành ({completedCommissions.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Available Requests Tab */}
        {activeTab === 'available' && (
          <div className="requests-list">
            <h2>Yêu Cầu Dịch Vụ Có Sẵn</h2>
            {availableRequests.length === 0 ? (
              <p className="no-data">Hiện không có yêu cầu nào</p>
            ) : (
              availableRequests.map((request) => (
                <div key={request._id} className={`request-card ${memberStats?.LinhVuc !== request.LinhVuc ? 'different-field' : ''}`}>
                  <div className="request-header">
                    <h3>{request.TenDichVu}</h3>
                    <div className="request-price">
                      <span className="price">💰 {request.Gia?.toLocaleString()}đ</span>
                      <span className={`status-badge status-${request.TrangThai}`}>
                        {request.TrangThai === 'da-duyet' ? '✅ Đã duyệt - Có thể nhận' : 
                         request.TrangThai === 'dang-thuc-hien' ? '🔨 Đang thực hiện' :
                         request.TrangThai === 'cho-xac-nhan-hoan-thanh' ? '🎉 Chờ người dùng xác nhận' :
                         request.TrangThai === 'cho-duyet-hoan-thanh' ? '⏳ Chờ Admin duyệt hoàn thành' :
                         request.TrangThai === 'hoan-thanh' ? '🎉 Hoàn thành - Đã cộng tiền' : '⏳ Chờ duyệt'}
                        {memberStats?.LinhVuc !== request.LinhVuc ? ' (Khác lĩnh vực)' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="request-info">
                    <div className="info-row">
                      <span className="info-label">🏷️ Lĩnh vực:</span>
                      <span className="info-value">{request.LinhVuc} {memberStats?.LinhVuc !== request.LinhVuc ? '(Không chuyên)' : ''}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">👤 Khách hàng:</span>
                      <span className="info-value">{request.NguoiDung?.name || request.UserId?.name || 'Người dùng ẩn'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">📝 Mô tả:</span>
                      <span className="info-value">{request.MoTa || 'Không có mô tả'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">📅 Ngày đăng:</span>
                      <span className="info-value">{new Date(request.createdAt || request.NgayTao).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <div className="request-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleAcceptRequest(request._id)}
                    >
                      Nhận Yêu Cầu
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Accepted Requests Tab */}
        {activeTab === 'accepted' && (
          <div className="requests-list">
            <h2>Yêu Cầu Đã Nhận</h2>
            {acceptedRequests.length === 0 ? (
              <p className="no-data">Bạn chưa nhận yêu cầu nào</p>
            ) : (
              acceptedRequests.map((request) => (
                <div key={request._id} className="request-card accepted">
                  <div className="request-header">
                    <h3>{request.TenDichVu}</h3>
                    <div className="request-price">
                      <span className="price">{request.Gia?.toLocaleString()}đ</span>
                      <span className={`status-badge status-${request.TrangThai}`}>
                        {request.TrangThai === 'dang-thuc-hien' ? '🔨 Đang thực hiện - Chờ hoàn thành' :
                         request.TrangThai === 'cho-xac-nhan-hoan-thanh' ? '🎉 Đã gửi hoàn thành - Chờ người dùng xác nhận' :
                         request.TrangThai === 'cho-duyet-hoan-thanh' ? '⏳ Đã xác nhận - Chờ Admin duyệt' :
                         request.TrangThai === 'da-nhan' ? '✅ Đã nhận - Đang xử lý' :
                         request.TrangThai === 'dang-xu-ly' ? '🔄 Đang xử lý' : '⏳ Chờ xử lý'}
                      </span>
                    </div>
                  </div>
                  <div className="request-info">
                    <div className="info-row">
                      <span className="info-label">🏷️ Lĩnh vực:</span>
                      <span className="info-value">{request.LinhVuc}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">👤 Khách hàng:</span>
                      <span className="info-value">{request.NguoiDung?.name || request.UserId?.name || 'Người dùng ẩn'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">📝 Mô tả:</span>
                      <span className="info-value">{request.MoTa || 'Không có mô tả'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">📅 Ngày đăng:</span>
                      <span className="info-value">{new Date(request.createdAt || request.NgayTao).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  {/* Negotiate Price Section */}
                  {negotiating === request._id ? (
                    <div className="negotiate-section">
                      <input
                        type="number"
                        min="1"
                        placeholder="Nhập giá thỏa thuận"
                        value={negotiatePrice}
                        onChange={(e) => setNegotiatePrice(e.target.value)}
                        className="negotiate-input"
                      />
                      <div className="negotiate-actions">
                        <button
                          className="btn btn-success"
                          onClick={() => handleSubmitNegotiate(request._id)}
                        >
                          Xác Nhận
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setNegotiating(null)}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="request-actions">
                      <button
                        className="btn btn-info"
                        onClick={() => handleStartNegotiate(request._id)}
                        disabled={request.TrangThai === 'cho-duyet-hoan-thanh'}
                      >
                        Thỏa Thuận Giá
                      </button>
                      <button
                        className={`btn ${request.TrangThai === 'cho-xac-nhan-hoan-thanh' || request.TrangThai === 'cho-duyet-hoan-thanh' ? 'btn-secondary' : 'btn-success'}`}
                        onClick={() => handleCompleteCommission(request._id)}
                        disabled={request.TrangThai === 'cho-xac-nhan-hoan-thanh' || request.TrangThai === 'cho-duyet-hoan-thanh'}
                      >
                        {request.TrangThai === 'cho-xac-nhan-hoan-thanh' ? '⏳ Đang chờ người dùng xác nhận' : 
                         request.TrangThai === 'cho-duyet-hoan-thanh' ? '⏳ Đang chờ Admin duyệt hoàn thành' : '🎉 Hoàn thành nhiệm vụ'}
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleRejectRequest(request._id)}
                        disabled={request.TrangThai === 'cho-xac-nhan-hoan-thanh' || request.TrangThai === 'cho-duyet-hoan-thanh'}
                      >
                        Hủy Yêu Cầu
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Completed Commissions Tab */}
        {activeTab === 'completed' && (
          <div className="requests-list">
            <h2>Ủy Thác Hoàn Thành</h2>
            {completedCommissions.length === 0 ? (
              <p className="no-data">Bạn chưa hoàn thành ủy thác nào</p>
            ) : (
              completedCommissions.map((commission) => (
                <div key={commission._id} className="request-card completed">
                  <div className="request-header">
                    <h3>{commission.TenDichVu || commission.DichVuId?.TenDichVu || 'Dịch vụ'}</h3>
                    <div className="request-price">
                      <span className="price">
                        💰 {commission.GiaThoaThuan?.toLocaleString() || commission.Gia?.toLocaleString() || '0'}đ
                      </span>
                      <span className="status-badge status-hoan-thanh">🎉 Hoàn thành - Tiền đã cộng vào ví</span>
                    </div>
                  </div>
                  <div className="request-info">
                    <div className="info-row">
                      <span className="info-label">👤 Khách hàng:</span>
                      <span className="info-value">{commission.NguoiDung?.name || commission.UserId?.name || 'Người dùng ẩn'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">💰 Giá thỏa thuận:</span>
                      <span className="info-value">{commission.GiaThoaThuan?.toLocaleString() || commission.Gia?.toLocaleString() || '0'}đ</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">📝 Mô tả:</span>
                      <span className="info-value">{commission.MoTa || commission.DichVuId?.MoTa || 'Không có mô tả'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">🏷️ Lĩnh vực:</span>
                      <span className="info-value">{commission.LinhVuc || commission.DichVuId?.LinhVuc || 'Không xác định'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">⭐ Đánh giá:</span>
                      <span className="info-value">{'⭐'.repeat(commission.DanhGia || 5)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">📅 Hoàn thành:</span>
                      <span className="info-value">{new Date(commission.updatedAt || commission.NgayHoanThanh).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDashboard;
