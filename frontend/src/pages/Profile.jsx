// frontend/src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { dashboardService } from '../services/dashboardService';
import authUtilsEnhanced from '../utils/authUtilsEnhanced';
import './css/Profile.css';

const Profile = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    balance: 0,
    totalServices: 0,
    completedServices: 0
  });
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    avatar: user?.avatar || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  // Load user statistics
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user) return;
      
      setStatsLoading(true);
      try {
        const profileData = await dashboardService.getProfile();
        const dashboardData = await dashboardService.getDashboardData();
        
        setUserStats({
          balance: profileData.data.wallet?.SoDuHienTai || user.SoDu || 0,
          totalServices: dashboardData.data.stats?.services?.total || 0,
          completedServices: dashboardData.data.stats?.services?.completed || 0
        });
      } catch (err) {
        console.error('Error loading user stats:', err);
        // Fallback to user data
        setUserStats({
          balance: user.SoDu || 0,
          totalServices: 0,
          completedServices: 0
        });
      } finally {
        setStatsLoading(false);
      }
    };

    loadUserStats();
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = authUtilsEnhanced.getToken();
      if (!token) {
        setError('Bạn cần đăng nhập để cập nhật thông tin');
        return;
      }

      const updatedUser = await dashboardService.updateProfile(profileData);
      if (updatedUser.success) {
        // Update auth state with new user data
        authUtilsEnhanced.setAuth(token, updatedUser.data);
        setSuccess('Cập nhật thông tin thành công!');
        setIsEditing(false);
        
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      
      // Handle validation errors specifically
      if (err.response?.status === 400 && err.response?.data?.errors) {
        const errorMessages = err.response.data.errors.map(error => error.msg).join(', ');
        setError(`Validation error: ${errorMessages}`);
      } else {
        setError(err.response?.data?.message || 'Không thể cập nhật thông tin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Mật khẩu mới không khớp!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.success) {
        setSuccess('Đổi mật khẩu thành công!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordForm(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.message || 'Không thể đổi mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="page-title">👤 Hồ Sơ Cá Nhân</h1>
            <p className="page-subtitle">Quản lý thông tin tài khoản của bạn</p>
          </div>
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

      <div className="profile-container">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="avatar-section">
              <div className="avatar-large">
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="Avatar" />
                ) : (
                  <span className="avatar-placeholder">
                    {profileData.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="avatar-info">
                <h2 className="user-name">{profileData.name || 'N/A'}</h2>
                <div className="user-role">
                  <span className={`role-badge role-${user?.role}`}>
                    {user?.role === 'admin' ? '⭐ Admin' : 
                     user?.role === 'member' ? '🎖️ Member' : '👤 User'}
                  </span>
                </div>
                <div className="user-joined">
                  📅 Tham gia: {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                </div>
              </div>
            </div>
            
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="btn-edit-profile">
                ✏️ Chỉnh sửa
              </button>
            )}
          </div>

          {/* Profile Form */}
          <form onSubmit={handleProfileUpdate} className="profile-form">
            <div className="form-section">
              <h3 className="section-title">📋 Thông tin cơ bản</h3>
              
              <div className="form-group">
                <label className="form-label">Họ và tên *</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-input"
                  value={profileData.email}
                  disabled
                  title="Email không thể thay đổi"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input
                  type="tel"
                  className="form-input"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ</label>
                <textarea
                  className="form-textarea"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  disabled={!isEditing}
                  rows="3"
                  placeholder="Nhập địa chỉ của bạn"
                />
              </div>
            </div>

            {isEditing && (
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditing(false);
                    setProfileData({
                      name: user?.name || '',
                      email: user?.email || '',
                      phone: user?.phone || '',
                      address: user?.address || '',
                      avatar: user?.avatar || ''
                    });
                  }}
                  className="btn-cancel"
                  disabled={loading}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn-save"
                  disabled={loading}
                >
                  {loading ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Security Card */}
        <div className="security-card">
          <div className="card-header">
            <h3 className="section-title">🔒 Bảo mật</h3>
            {!showPasswordForm && (
              <button 
                onClick={() => setShowPasswordForm(true)}
                className="btn-change-password"
              >
                🔑 Đổi mật khẩu
              </button>
            )}
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="password-form">
              <div className="form-group">
                <label className="form-label">Mật khẩu hiện tại *</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mật khẩu mới *</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu mới *</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="btn-cancel"
                  disabled={loading}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn-save"
                  disabled={loading}
                >
                  {loading ? '⏳ Đang xử lý...' : '🔒 Đổi mật khẩu'}
                </button>
              </div>
            </form>
          )}

          {!showPasswordForm && (
            <div className="security-info">
              <div className="info-item">
                <span className="info-icon">🔐</span>
                <div className="info-content">
                  <div className="info-label">Mật khẩu</div>
                  <div className="info-value">••••••••</div>
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">📧</span>
                <div className="info-content">
                  <div className="info-label">Email xác thực</div>
                  <div className="info-value">{user?.email}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account Stats */}
        <div className="stats-card">
          <h3 className="section-title">📊 Thống kê tài khoản</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-label">Số dư ví</div>
                <div className="stat-value">
                  {statsLoading ? '⏳' : new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(userStats.balance)}
                </div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <div className="stat-label">Dịch vụ đã tạo</div>
                <div className="stat-value">
                  {statsLoading ? '⏳' : userStats.totalServices}
                </div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-label">Hoàn thành</div>
                <div className="stat-value">
                  {statsLoading ? '⏳' : userStats.completedServices}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
