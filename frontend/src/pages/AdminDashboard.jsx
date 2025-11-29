// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/adminService';
import authUtilsEnhanced from '../utils/authUtilsEnhanced';
import './css/AdminDashboard.css';

const AdminDashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    
    fetchStats();
    
    const updateViewport = () => {
      const width = window.innerWidth;
      document.body.setAttribute('data-viewport', `${width}px`);
    };
    
    updateViewport();
    window.addEventListener('resize', updateViewport);
    
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data.data);
      setError('');
    } catch (err) {
      // Use authUtils to handle auth errors
      if (authUtilsEnhanced.handleAuthError(err)) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      setError('Không thể tải thống kê. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
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

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1 className="admin-title">🎛️ Admin Dashboard</h1>
            <p className="admin-subtitle">Quản lý và giám sát hệ thống F-Service</p>
          </div>
          <button onClick={fetchStats} className="refresh-btn">
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.basic?.totalUsers || 0}</div>
            <div className="stat-label">Người dùng</div>
          </div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.basic?.totalMembers || 0}</div>
            <div className="stat-label">Thành viên</div>
          </div>
        </div>

        <div className="stat-card stat-card-info">
          <div className="stat-icon">🛠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.basic?.totalServices || 0}</div>
            <div className="stat-label">Dịch vụ</div>
          </div>
        </div>

        <div className="stat-card stat-card-warning">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.basic?.totalTransactions || 0}</div>
            <div className="stat-label">Giao dịch</div>
          </div>
        </div>
      </div>

      {/* Pending Items */}
      <div className="pending-section">
        <h2 className="section-title">⚠️ Cần xử lý</h2>
        <div className="pending-grid">
          <div className="pending-card">
            <div className="pending-icon pending-icon-warning">📋</div>
            <div className="pending-content">
              <div className="pending-value">{stats?.basic?.pendingServices || 0}</div>
              <div className="pending-label">Dịch vụ chờ duyệt</div>
            </div>
            <Link to="/admin/services?status=pending" className="pending-link">
              Xem chi tiết →
            </Link>
          </div>

          <div className="pending-card">
            <div className="pending-icon pending-icon-success">🎉</div>
            <div className="pending-content">
              <div className="pending-value">{stats?.basic?.pendingCompletions || 0}</div>
              <div className="pending-label">Hoàn thành chờ duyệt</div>
            </div>
            <Link to="/admin/services?status=pending-completion" className="pending-link">
              Xem chi tiết →
            </Link>
          </div>

          <div className="pending-card">
            <div className="pending-icon pending-icon-info">⭐</div>
            <div className="pending-content">
              <div className="pending-value">{stats?.basic?.pendingMembers || 0}</div>
              <div className="pending-label">Thành viên chờ duyệt</div>
            </div>
            <Link to="/admin/members?status=pending" className="pending-link">
              Xem chi tiết →
            </Link>
          </div>

          <div className="pending-card">
            <div className="pending-icon pending-icon-danger">💸</div>
            <div className="pending-content">
              <div className="pending-value">{stats?.basic?.pendingDeposits || 0}</div>
              <div className="pending-label">Yêu cầu nạp tiền</div>
            </div>
            <Link to="/admin/transactions?type=deposit&status=pending" className="pending-link">
              Xem chi tiết →
            </Link>
          </div>

          <div className="pending-card">
            <div className="pending-icon pending-icon-warning">💸</div>
            <div className="pending-content">
              <div className="pending-value">{stats?.basic?.pendingWithdraws || 0}</div>
              <div className="pending-label">Yêu cầu rút tiền</div>
            </div>
            <Link to="/admin/transactions?type=withdraw&status=pending" className="pending-link">
              Xem chi tiết →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2 className="section-title">⚡ Thao tác nhanh</h2>
        <div className="quick-actions-grid">
          <Link to="/admin/services" className="action-card">
            <div className="action-icon">🛠️</div>
            <div className="action-title">Quản lý dịch vụ</div>
            <div className="action-description">Thêm, sửa, xóa dịch vụ</div>
          </Link>

          <Link to="/admin/users" className="action-card">
            <div className="action-icon">👥</div>
            <div className="action-title">Quản lý người dùng</div>
            <div className="action-description">Xem và quản lý users</div>
          </Link>

          <Link to="/admin/members" className="action-card">
            <div className="action-icon">⭐</div>
            <div className="action-title">Quản lý thành viên</div>
            <div className="action-description">Duyệt và quản lý members</div>
          </Link>

          <Link to="/admin/transactions" className="action-card">
            <div className="action-icon">💰</div>
            <div className="action-title">Quản lý giao dịch</div>
            <div className="action-description">Xem lịch sử giao dịch</div>
          </Link>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="activities-section">
        <div className="activities-grid">
          {/* Recent Users */}
          <div className="activity-card">
            <h3 className="activity-title">👥 Người dùng mới</h3>
            <div className="activity-list">
              {stats?.recent?.users?.length > 0 ? (
                stats.recent.users.map((user) => (
                  <div key={user._id} className="activity-item">
                    <div className="activity-avatar">{user.name?.charAt(0) || 'U'}</div>
                    <div className="activity-info">
                      <div className="activity-name">{user.name || 'N/A'}</div>
                      <div className="activity-meta">{user.email}</div>
                    </div>
                    <div className="activity-time">{formatDate(user.createdAt)}</div>
                  </div>
                ))
              ) : (
                <div className="empty-activity">Chưa có người dùng mới</div>
              )}
            </div>
          </div>

          {/* Recent Members */}
          <div className="activity-card">
            <h3 className="activity-title">⭐ Thành viên mới</h3>
            <div className="activity-list">
              {stats?.recent?.members?.length > 0 ? (
                stats.recent.members.map((member) => (
                  <div key={member._id} className="activity-item">
                    <div className="activity-avatar">{member.Ten?.charAt(0) || 'M'}</div>
                    <div className="activity-info">
                      <div className="activity-name">{member.Ten || 'N/A'}</div>
                      <div className="activity-meta">
                        {member.CapBac} • {member.LinhVuc}
                      </div>
                    </div>
                    <div className="activity-time">{formatDate(member.NgayTao)}</div>
                  </div>
                ))
              ) : (
                <div className="empty-activity">Chưa có thành viên mới</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="transactions-card">
          <h3 className="activity-title">💰 Giao dịch gần đây</h3>
          <div className="transactions-table">
            <table>
              <thead>
                <tr>
                  <th>Loại</th>
                  <th>Người dùng</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recent?.transactions?.length > 0 ? (
                  stats.recent.transactions.map((tx) => (
                    <tr key={tx._id}>
                      <td>
                        <span className={`tx-type tx-type-${tx.Loai}`}>
                          {tx.Loai === 'deposit' ? '📥 Nạp' : '📤 Rút'}
                        </span>
                      </td>
                      <td>{tx.NguoiThamGia?.name || 'N/A'}</td>
                      <td className="tx-amount">{formatCurrency(tx.SoTien)}</td>
                      <td>
                        <span className={`tx-status tx-status-${tx.TrangThai}`}>
                          {tx.TrangThai === 'success' ? '✅ Thành công' : 
                           tx.TrangThai === 'pending' ? '⏳ Chờ xử lý' : '❌ Thất bại'}
                        </span>
                      </td>
                      <td className="tx-time">{formatDate(tx.NgayGiaoDich)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-transactions">
                      Chưa có giao dịch nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
