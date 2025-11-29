// frontend/src/pages/AdminMembers.jsx
import React, { useState, useEffect } from 'react';
import { getMembers, updateMemberStatus } from '../services/adminService';
import MemberApprovalModal from '../components/MemberApprovalModal';
import authUtilsEnhanced from '../utils/authUtilsEnhanced';
import './css/AdminMembers.css';

const AdminMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCapBac, setFilterCapBac] = useState('');
  const [filterLinhVuc, setFilterLinhVuc] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

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
    
    fetchMembers();
  }, [filterStatus, filterCapBac, filterLinhVuc]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterCapBac) params.capBac = filterCapBac;
      if (filterLinhVuc) params.linhVuc = filterLinhVuc;
      
      const data = await getMembers(params);
      console.log('Members data received:', data);
      setMembers(data.data.members || []);
      setError('');
    } catch (err) {
      console.error('Error fetching members:', err);
      
      // Use authUtils to handle auth errors
      if (authUtilsEnhanced.handleAuthError(err)) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      
      setError('Không thể tải danh sách thành viên.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (memberId, newStatus) => {
    const statusLabels = {
      'active': '✅ Hoạt động',
      'inactive': '⏸️ Tạm dừng',
      'pending': '⏳ Chờ duyệt',
      'approved': '✅ Đã duyệt',
      'rejected': '❌ Đã từ chối',
      'interview-scheduled': '📅 Đã hẹn phỏng vấn'
    };

    if (!window.confirm(`Bạn có chắc chắn muốn đổi trạng thái thành "${statusLabels[newStatus]}"?`)) {
      return;
    }

    try {
      await updateMemberStatus(memberId, newStatus);
      setSuccess(`Cập nhật trạng thái thành công!`);
      fetchMembers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating member status:', err);
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleOpenApprovalModal = (member) => {
    setSelectedMember(member);
    setShowApprovalModal(true);
  };

  const handleCloseApprovalModal = () => {
    setSelectedMember(null);
    setShowApprovalModal(false);
  };

  const handleApprovalActionComplete = () => {
    fetchMembers();
    setSelectedMember(null);
    setShowApprovalModal(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Filter members (client-side filter for search only)
  const filteredMembers = (members || []).filter(member => {
    const matchSearch = !searchTerm || 
      member.Ten?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.UserId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.UserId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchSearch; // Server-side filters already applied
  });

  // Stats
  const stats = {
    total: (members || []).length,
    active: (members || []).filter(m => m.TrangThai === 'active').length,
    pending: (members || []).filter(m => m.TrangThai === 'pending' || m.TrangThai === 'cho-duyet').length,
    interviewScheduled: (members || []).filter(m => m.TrangThai === 'interview-scheduled').length,
    inactive: (members || []).filter(m => m.TrangThai === 'inactive').length,
    approved: (members || []).filter(m => m.TrangThai === 'approved').length,
    rejected: (members || []).filter(m => m.TrangThai === 'rejected').length,
    avgRating: (members || []).length > 0 
      ? ((members || []).reduce((sum, m) => sum + (m.DiemDanhGiaTB || 0), 0) / (members || []).length).toFixed(1)
      : 0
  };

  return (
    <div className="admin-members-page">
      {/* Header */}
      <div className="admin-members-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">⭐ Quản Lý Thành Viên</h1>
            <p className="page-subtitle">Duyệt và quản lý các thành viên cung cấp dịch vụ</p>
          </div>
          <button onClick={fetchMembers} className="refresh-btn">
            🔄 Làm mới
          </button>
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

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Tổng số</div>
          </div>
        </div>
        <div className="stat-card stat-active">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Đang hoạt động</div>
          </div>
        </div>
        <div className="stat-card stat-pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Chờ duyệt</div>
          </div>
        </div>
        <div className="stat-card stat-interview">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.interviewScheduled}</div>
            <div className="stat-label">Đã hẹn phỏng vấn</div>
          </div>
        </div>
        <div className="stat-card stat-rating">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{stats.avgRating}</div>
            <div className="stat-label">Đánh giá TB</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Tìm kiếm theo tên, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <label className="filter-label">Cấp bậc:</label>
          <select 
            value={filterCapBac} 
            onChange={(e) => setFilterCapBac(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả</option>
            {capBacOptions.map(cb => (
              <option key={cb} value={cb}>{cb}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Lĩnh vực:</label>
          <select 
            value={filterLinhVuc} 
            onChange={(e) => setFilterLinhVuc(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả</option>
            {linhVucOptions.map(lv => (
              <option key={lv} value={lv}>{lv}</option>
            ))}
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
            <option value="pending">Chờ duyệt</option>
            <option value="interview-scheduled">Đã hẹn phỏng vấn</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Đã từ chối</option>
            <option value="inactive">Tạm dừng</option>
          </select>
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải thành viên...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3 className="empty-title">Không tìm thấy thành viên</h3>
          <p className="empty-description">
            {searchTerm || filterCapBac || filterLinhVuc || filterStatus 
              ? 'Thử thay đổi bộ lọc của bạn' 
              : 'Chưa có thành viên nào đăng ký'}
          </p>
        </div>
      ) : (
        <div className="members-grid">
          {filteredMembers.map((member) => (
            <div key={member._id} className="member-card">
              <div className="member-card-header">
                <div className="member-avatar">
                  {member.Ten?.charAt(0).toUpperCase() || 'M'}
                </div>
                <div className="member-info">
                  <h3 className="member-name">{member.Ten || 'N/A'}</h3>
                  <div className="member-user">
                    👤 {member.UserId?.name || 'N/A'}
                  </div>
                  <div className="member-email">
                    📧 {member.UserId?.email || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="member-card-body">
                <div className="member-badges">
                  <span className={`badge badge-capbac badge-${member.CapBac?.toLowerCase().replace(' ', '-')}`}>
                    🎖️ {member.CapBac}
                  </span>
                  <span className={`badge badge-status badge-${member.TrangThai}`}>
                    {member.TrangThai === 'active' ? '✅ Hoạt động' : 
                     member.TrangThai === 'pending' ? '⏳ Chờ duyệt' : 
                     member.TrangThai === 'approved' ? '✅ Đã duyệt' :
                     member.TrangThai === 'rejected' ? '❌ Đã từ chối' : 
                     member.TrangThai === 'interview-scheduled' ? '📅 Đã hẹn phỏng vấn' :
                     '⏸️ Tạm dừng'}
                  </span>
                </div>

                <div className="member-field">
                  <span className="field-icon">🛠️</span>
                  <span className="field-label">Lĩnh vực:</span>
                  <span className="field-value">{member.LinhVuc}</span>
                </div>

                <div className="member-field">
                  <span className="field-icon">📞</span>
                  <span className="field-label">SĐT:</span>
                  <span className="field-value">{member.SoDienThoai || 'Chưa có'}</span>
                </div>

                <div className="member-field">
                  <span className="field-icon">⭐</span>
                  <span className="field-label">Đánh giá:</span>
                  <span className="field-value rating">
                    {member.DiemDanhGiaTB ? `${member.DiemDanhGiaTB.toFixed(1)}/5` : 'Chưa có'}
                  </span>
                </div>

                {member.KyNang && member.KyNang.length > 0 && (
                  <div className="member-skills">
                    <div className="skills-label">💼 Kỹ năng:</div>
                    <div className="skills-list">
                      {member.KyNang.map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {member.ChungChi && member.ChungChi.length > 0 && (
                  <div className="member-certs">
                    <div className="certs-label">🏆 Chứng chỉ:</div>
                    <div className="certs-list">
                      {member.ChungChi.map((cert, idx) => (
                        <span key={idx} className="cert-tag">{cert}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="member-date">
                  📅 Đăng ký: {formatDate(member.NgayTao)}
                </div>
              </div>

              <div className="member-card-actions">
                {(member.TrangThai === 'pending' || member.TrangThai === 'approved') && (
                  <>
                    <button
                      onClick={() => handleOpenApprovalModal(member)}
                      className="btn-approve"
                    >
                      📋 Xử lý
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(member._id, 'rejected')}
                      className="btn-reject"
                    >
                      ❌ Từ chối nhanh
                    </button>
                  </>
                )}
                
                {member.TrangThai === 'interview-scheduled' && (
                  <>
                    <button
                      onClick={() => handleOpenApprovalModal(member)}
                      className="btn-approve"
                    >
                      ✅ Phê duyệt
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(member._id, 'rejected')}
                      className="btn-reject"
                    >
                      ❌ Từ chối
                    </button>
                  </>
                )}
                
                {member.TrangThai === 'active' && (
                  <button
                    onClick={() => handleUpdateStatus(member._id, 'inactive')}
                    className="btn-deactivate"
                  >
                    ⏸️ Tạm dừng
                  </button>
                )}
                
                {member.TrangThai === 'inactive' && (
                  <button
                    onClick={() => handleUpdateStatus(member._id, 'active')}
                    className="btn-activate"
                  >
                    ✅ Kích hoạt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Count */}
      {!loading && filteredMembers.length > 0 && (
        <div className="results-count">
          Hiển thị {filteredMembers.length} / {members.length} thành viên
        </div>
      )}

      {/* Member Approval Modal */}
      {showApprovalModal && selectedMember && (
        <MemberApprovalModal
          member={selectedMember}
          onClose={handleCloseApprovalModal}
          onActionComplete={handleApprovalActionComplete}
        />
      )}
    </div>
  );
};

export default AdminMembers;
