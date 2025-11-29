// frontend/src/pages/MemberProfile.jsx
import React, { useState, useEffect } from 'react';
import { memberService } from '../services/memberService';
import './css/MemberProfile.css';

const MemberProfile = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [memberData, setMemberData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    Ten: '',
    CapBac: '',
    LinhVuc: '',
    SoDienThoai: '',
    KyNang: [],
    ChungChi: []
  });
  const [newSkill, setNewSkill] = useState('');
  const [newCert, setNewCert] = useState('');

  const capBacOptions = ['Thực tập', 'Thành thạo', 'Chuyên gia'];
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
    fetchMemberProfile();
  }, []);

  const fetchMemberProfile = async () => {
    try {
      setLoading(true);
      const response = await memberService.getProfile();
      
      if (response.success) {
        setMemberData(response.data);
        setFormData({
          Ten: response.data.member?.Ten || '',
          CapBac: response.data.member?.CapBac || '',
          LinhVuc: response.data.member?.LinhVuc || '',
          SoDienThoai: response.data.member?.SoDienThoai || '',
          KyNang: response.data.member?.KyNang || [],
          ChungChi: response.data.member?.ChungChi || []
        });
      }
    } catch (err) {
      console.error('Error fetching member profile:', err);
      setError('Không thể tải thông tin thành viên.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await memberService.updateProfile(formData);
      
      if (response.success) {
        setSuccess('Cập nhật hồ sơ thành công!');
        setIsEditing(false);
        await fetchMemberProfile();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Không thể cập nhật hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.KyNang.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        KyNang: [...formData.KyNang, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData({
      ...formData,
      KyNang: formData.KyNang.filter(s => s !== skill)
    });
  };

  const handleAddCert = () => {
    if (newCert.trim() && !formData.ChungChi.includes(newCert.trim())) {
      setFormData({
        ...formData,
        ChungChi: [...formData.ChungChi, newCert.trim()]
      });
      setNewCert('');
    }
  };

  const handleRemoveCert = (cert) => {
    setFormData({
      ...formData,
      ChungChi: formData.ChungChi.filter(c => c !== cert)
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading && !memberData) {
    return (
      <div className="member-profile-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="member-profile-page">
      {/* Header */}
      <div className="member-profile-header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="page-title">⭐ Hồ Sơ Thành Viên</h1>
            <p className="page-subtitle">Quản lý thông tin năng lực và dịch vụ</p>
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

      <div className="member-profile-container">
        {/* Main Profile Card */}
        <div className="main-profile-card">
          <div className="profile-card-header">
            <div className="member-avatar-section">
              <div className="member-avatar-large">
                {formData.Ten?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div className="member-info">
                <h2 className="member-name">{formData.Ten || 'N/A'}</h2>
                <div className="member-badges">
                  <span className={`badge badge-capbac badge-${formData.CapBac?.toLowerCase().replace(' ', '-')}`}>
                    🎖️ {formData.CapBac || 'N/A'}
                  </span>
                  <span className={`badge badge-status badge-${memberData?.member?.TrangThai}`}>
                    {memberData?.member?.TrangThai === 'active' ? '✅ Hoạt động' : 
                     memberData?.member?.TrangThai === 'pending' ? '⏳ Chờ duyệt' : '⏸️ Tạm dừng'}
                  </span>
                </div>
                <div className="member-joined">
                  📅 Đăng ký: {memberData?.member?.NgayTao ? formatDate(memberData.member.NgayTao) : 'N/A'}
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
          <form onSubmit={handleSubmit} className="member-profile-form">
            <div className="form-section">
              <h3 className="section-title">📋 Thông tin cơ bản</h3>
              
              <div className="form-group">
                <label className="form-label">Tên hiển thị *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.Ten}
                  onChange={(e) => setFormData({ ...formData, Ten: e.target.value })}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cấp bậc *</label>
                  <select
                    className="form-select"
                    value={formData.CapBac}
                    onChange={(e) => setFormData({ ...formData, CapBac: e.target.value })}
                    disabled={!isEditing}
                    required
                  >
                    <option value="">-- Chọn cấp bậc --</option>
                    {capBacOptions.map(cb => (
                      <option key={cb} value={cb}>{cb}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Lĩnh vực *</label>
                  <select
                    className="form-select"
                    value={formData.LinhVuc}
                    onChange={(e) => setFormData({ ...formData, LinhVuc: e.target.value })}
                    disabled={!isEditing}
                    required
                  >
                    <option value="">-- Chọn lĩnh vực --</option>
                    {linhVucOptions.map(lv => (
                      <option key={lv} value={lv}>{lv}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.SoDienThoai}
                  onChange={(e) => setFormData({ ...formData, SoDienThoai: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>

            {/* Skills Section */}
            <div className="form-section">
              <h3 className="section-title">💼 Kỹ năng</h3>
              
              {isEditing && (
                <div className="add-item-group">
                  <input
                    type="text"
                    className="form-input"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Nhập kỹ năng mới..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddSkill}
                    className="btn-add-item"
                  >
                    ➕ Thêm
                  </button>
                </div>
              )}

              <div className="tags-list">
                {formData.KyNang.length > 0 ? (
                  formData.KyNang.map((skill, idx) => (
                    <div key={idx} className="tag-item">
                      <span className="tag-text">{skill}</span>
                      {isEditing && (
                        <button 
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="tag-remove"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-tags">Chưa có kỹ năng nào</div>
                )}
              </div>
            </div>

            {/* Certificates Section */}
            <div className="form-section">
              <h3 className="section-title">🏆 Chứng chỉ</h3>
              
              {isEditing && (
                <div className="add-item-group">
                  <input
                    type="text"
                    className="form-input"
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    placeholder="Nhập chứng chỉ mới..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCert())}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddCert}
                    className="btn-add-item"
                  >
                    ➕ Thêm
                  </button>
                </div>
              )}

              <div className="tags-list">
                {formData.ChungChi.length > 0 ? (
                  formData.ChungChi.map((cert, idx) => (
                    <div key={idx} className="tag-item tag-cert">
                      <span className="tag-text">{cert}</span>
                      {isEditing && (
                        <button 
                          type="button"
                          onClick={() => handleRemoveCert(cert)}
                          className="tag-remove"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-tags">Chưa có chứng chỉ nào</div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      Ten: memberData?.member?.Ten || '',
                      CapBac: memberData?.member?.CapBac || '',
                      LinhVuc: memberData?.member?.LinhVuc || '',
                      SoDienThoai: memberData?.member?.SoDienThoai || '',
                      KyNang: memberData?.member?.KyNang || [],
                      ChungChi: memberData?.member?.ChungChi || []
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

        {/* Stats Card */}
        <div className="member-stats-card">
          <h3 className="section-title">📊 Thống kê hoạt động</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-label">Số dư</div>
                <div className="stat-value">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(memberData?.wallet?.balance || memberData?.balance || 0)}
                </div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <div className="stat-label">Đánh giá TB</div>
                <div className="stat-value">
                  {memberData?.member?.DiemDanhGiaTB?.toFixed(1) || '0.0'}/5
                </div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <div className="stat-label">Ủy thác đang xử lý</div>
                <div className="stat-value">{memberData?.commissions?.inProgressCommissions || 0}</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-label">Hoàn thành</div>
                <div className="stat-value">0</div>
              </div>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="user-info-card">
          <h3 className="section-title">👤 Thông tin tài khoản</h3>
          <div className="info-list">
            <div className="info-item">
              <span className="info-icon">📧</span>
              <div className="info-content">
                <div className="info-label">Email</div>
                <div className="info-value">{memberData?.user?.email || 'N/A'}</div>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">👤</span>
              <div className="info-content">
                <div className="info-label">Tên tài khoản</div>
                <div className="info-value">{memberData?.user?.name || 'N/A'}</div>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">🎖️</span>
              <div className="info-content">
                <div className="info-label">Vai trò</div>
                <div className="info-value">
                  <span className="role-badge role-member">Member</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;
