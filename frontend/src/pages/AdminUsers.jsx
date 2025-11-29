// frontend/src/pages/AdminUsers.jsx
import React, { useState, useEffect } from 'react';
import { getUsers, updateUserStatus } from '../services/adminService';
import authUtilsEnhanced from '../utils/authUtilsEnhanced';
import './css/AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [statsFromAPI, setStatsFromAPI] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchUsers(1);
  }, []);

  useEffect(() => {
    if (searchTerm || filterRole || filterStatus) {
      fetchUsers(1); // Reset to page 1 when filters change
    }
  }, [searchTerm, filterRole, filterStatus]);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      
      // Check authentication using authUtils
      if (!authUtilsEnhanced.validateAuth()) {
        setError('Vui lòng đăng nhập lại');
        return;
      }
      
      // Fix parameters - ensure page is number and use correct query params
      const params = {
        page: typeof page === 'object' ? 1 : parseInt(page) || 1,
        limit: pagination.limit || 20,
        search: searchTerm || undefined,
        role: filterRole || undefined,
        status: filterStatus || undefined
      };
      
      // Remove undefined params
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
      
      const response = await getUsers(params);
      console.log('Users data received:', response);
      
      if (response.success) {
        setUsers(response.data.users || []);
        setPagination(response.data.pagination || pagination);
        setStatsFromAPI(response.data.statistics || null);
        setError('');
      } else {
        setError(response.message || 'Không thể tải danh sách người dùng');
      }
    } catch (err) {
      // Use authUtils to handle auth errors
      if (authUtilsEnhanced.handleAuthError(err)) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      
      // Handle rate limiting
      if (err.response?.status === 429) {
        setError('Quá nhiều yêu cầu. Vui lòng đợi 5 giây và thử lại.');
        setTimeout(() => fetchUsers(page), 5000);
        return;
      }
      
      setError('Không thể tải danh sách người dùng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    const confirmMsg = newStatus === 'banned' 
      ? 'Bạn có chắc chắn muốn khóa tài khoản này?' 
      : 'Bạn có chắc chắn muốn mở khóa tài khoản này?';
    
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      await updateUserStatus(userId, newStatus);
      setSuccess(`${newStatus === 'banned' ? 'Khóa' : 'Mở khóa'} tài khoản thành công!`);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating user status:', err);
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái.');
      setTimeout(() => setError(''), 5000);
    }
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

  // Stats from API (use real data instead of hardcoded)
  const stats = statsFromAPI ? {
    total: statsFromAPI.total,
    active: statsFromAPI.active,
    banned: statsFromAPI.banned,
    admins: statsFromAPI.byRole?.admin || 0,
    members: statsFromAPI.byRole?.member || 0,
    regularUsers: statsFromAPI.byRole?.user || 0
  } : {
    total: pagination.total,
    active: 0,
    banned: 0,
    admins: 0,
    members: 0,
    regularUsers: 0
  };

  return (
    <div className="admin-users-page">
      {/* Error Display */}
      {error && (
        <div className="error-info" style={{background: '#ffebee', padding: '10px', margin: '10px 0', borderRadius: '5px', fontSize: '12px', border: '1px solid #f44336'}}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{statsFromAPI?.total || 0}</div>
            <div className="stat-label">Tổng số</div>
          </div>
        </div>
        <div className="stat-card stat-active">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{statsFromAPI?.active || 0}</div>
            <div className="stat-label">Đang hoạt động</div>
          </div>
        </div>
        <div className="stat-card stat-banned">
          <div className="stat-icon">🚫</div>
          <div className="stat-content">
            <div className="stat-value">{statsFromAPI?.banned || 0}</div>
            <div className="stat-label">Bị khóa</div>
          </div>
        </div>
        <div className="stat-card stat-admin">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{statsFromAPI?.byRole?.admin || 0}</div>
            <div className="stat-label">Admin</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <label className="filter-label">Vai trò:</label>
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả</option>
            <option value="user">User</option>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Trạng thái:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="banned">Bị khóa</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải người dùng...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3 className="empty-title">Không tìm thấy người dùng</h3>
          <p className="empty-description">
            {searchTerm || filterRole || filterStatus 
              ? 'Thử thay đổi bộ lọc của bạn' 
              : 'Chưa có người dùng nào trong hệ thống'}
          </p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Số dư</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{user.name || 'N/A'}</div>
                        <div className="user-id">ID: {user._id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="user-email">{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role === 'admin' ? '⭐ Admin' : 
                       user.role === 'member' ? '🎖️ Member' : '👤 User'}
                    </span>
                  </td>
                  <td className="user-balance">{formatCurrency(user.SoDu)}</td>
                  <td>
                    <span className={`status-badge status-${user.status}`}>
                      {user.status === 'active' ? '✅ Hoạt động' : '🚫 Bị khóa'}
                    </span>
                  </td>
                  <td className="user-date">{formatDate(user.createdAt)}</td>
                  <td>
                    <button
                      onClick={() => handleUpdateStatus(user._id, user.status)}
                      className={`btn-action ${user.status === 'active' ? 'btn-ban' : 'btn-unban'}`}
                      disabled={user.role === 'admin'}
                    >
                      {user.status === 'active' ? '🔒 Khóa' : '🔓 Mở khóa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Hiển thị {users.length} trên {pagination.total} người dùng
          </div>
          <div className="pagination-controls">
            <button
              onClick={() => fetchUsers(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="pagination-btn"
            >
              ← Trước
            </button>
            
            <div className="pagination-pages">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === pagination.page;
                return (
                  <button
                    key={pageNum}
                    onClick={() => fetchUsers(pageNum)}
                    className={`pagination-page ${isActive ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {pagination.pages > 5 && (
                <>
                  <span className="pagination-dots">...</span>
                  <button
                    onClick={() => fetchUsers(pagination.pages)}
                    className={`pagination-page ${pagination.page === pagination.pages ? 'active' : ''}`}
                  >
                    {pagination.pages}
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => fetchUsers(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="pagination-btn"
            >
              Tiếp →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
