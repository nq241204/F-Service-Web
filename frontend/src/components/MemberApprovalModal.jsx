// frontend/src/components/MemberApprovalModal.jsx
import React, { useState } from 'react';
import api from '../config/api';
import './MemberApprovalModal.css';

const MemberApprovalModal = ({ member, onClose, onActionComplete }) => {
  const [activeTab, setActiveTab] = useState('interview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Interview form state
  const [interviewData, setInterviewData] = useState({
    interviewType: 'email',
    interviewDate: '',
    interviewTime: '',
    interviewLocation: '',
    meetingLink: '',
    message: '',
    contactInfo: {
      phone: '',
      additional: ''
    }
  });

  // Final approval form state
  const [approvalData, setApprovalData] = useState({
    approvalNotes: '',
    assignedCapBac: member?.CapBac || 'Intern',
    probationPeriod: 30,
    specialInstructions: ''
  });

  // Rejection form state
  const [rejectionData, setRejectionData] = useState({
    rejectionReason: '',
    rejectionCategory: 'not-qualified',
    feedback: '',
    canReapply: false
  });

  const handleInterviewSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post(`/admin/members/${member._id}/interview`, interviewData);
      
      if (response.data.success) {
        setSuccess('Đã gửi thư mời phỏng vấn thành công!');
        setTimeout(() => {
          onActionComplete();
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi gửi thư mời phỏng vấn');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalApproval = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post(`/admin/members/${member._id}/final-approve`, approvalData);
      
      if (response.data.success) {
        setSuccess('Đã phê duyệt thành viên thành công!');
        setTimeout(() => {
          onActionComplete();
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi phê duyệt thành viên');
    } finally {
      setLoading(false);
    }
  };

  const handleRejection = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post(`/admin/members/${member._id}/reject`, rejectionData);
      
      if (response.data.success) {
        setSuccess('Đã từ chối thành viên');
        setTimeout(() => {
          onActionComplete();
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi từ chối thành viên');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (!member) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container member-approval-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            📋 Xử lý thành viên: {member.Ten}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Member Info Summary */}
        <div className="member-summary">
          <div className="summary-row">
            <span className="label">Email:</span>
            <span className="value">{member.UserId?.email}</span>
          </div>
          <div className="summary-row">
            <span className="label">SĐT:</span>
            <span className="value">{member.SoDienThoai || 'Chưa có'}</span>
          </div>
          <div className="summary-row">
            <span className="label">Cấp bậc đăng ký:</span>
            <span className="value">{member.CapBac}</span>
          </div>
          <div className="summary-row">
            <span className="label">Lĩnh vực:</span>
            <span className="value">{member.LinhVuc}</span>
          </div>
          <div className="summary-row">
            <span className="label">Ngày đăng ký:</span>
            <span className="value">{formatDate(member.NgayTao)}</span>
          </div>
          <div className="summary-row">
            <span className="label">Trạng thái:</span>
            <span className={`status-badge ${member.TrangThai}`}>
              {member.TrangThai === 'pending' ? '⏳ Chờ duyệt' :
               member.TrangThai === 'interview-scheduled' ? '📅 Đã hẹn phỏng vấn' :
               member.TrangThai === 'approved' ? '✅ Đã duyệt' :
               member.TrangThai === 'active' ? '🟢 Hoạt động' :
               member.TrangThai === 'rejected' ? '❌ Đã từ chối' : member.TrangThai}
            </span>
          </div>
        </div>

        {/* Messages */}
        {error && <div className="alert alert-error">❌ {error}</div>}
        {success && <div className="alert alert-success">✅ {success}</div>}

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'interview' ? 'active' : ''}`}
            onClick={() => setActiveTab('interview')}
          >
            📅 Gửi lịch phỏng vấn
          </button>
          <button
            className={`tab-button ${activeTab === 'approve' ? 'active' : ''}`}
            onClick={() => setActiveTab('approve')}
          >
            ✅ Phê duyệt trực tiếp
          </button>
          <button
            className={`tab-button ${activeTab === 'reject' ? 'active' : ''}`}
            onClick={() => setActiveTab('reject')}
          >
            ❌ Từ chối
          </button>
        </div>

        {/* Tab Content */}
        <div className="modal-content">
          {/* Interview Tab */}
          {activeTab === 'interview' && (
            <form onSubmit={handleInterviewSubmit} className="interview-form">
              <div className="form-group">
                <label>Hình thức phỏng vấn:</label>
                <select
                  value={interviewData.interviewType}
                  onChange={(e) => setInterviewData({...interviewData, interviewType: e.target.value})}
                >
                  <option value="email">📧 Trao đổi qua email</option>
                  <option value="phone">📞 Phỏng vấn qua điện thoại</option>
                  <option value="video">📹 Phỏng vấn video</option>
                  <option value="in-person">👤 Phỏng vấn trực tiếp</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ngày phỏng vấn:</label>
                  <input
                    type="date"
                    value={interviewData.interviewDate}
                    onChange={(e) => setInterviewData({...interviewData, interviewDate: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Thời gian:</label>
                  <input
                    type="time"
                    value={interviewData.interviewTime}
                    onChange={(e) => setInterviewData({...interviewData, interviewTime: e.target.value})}
                    required
                  />
                </div>
              </div>

              {interviewData.interviewType === 'in-person' && (
                <div className="form-group">
                  <label>Địa điểm:</label>
                  <input
                    type="text"
                    value={interviewData.interviewLocation}
                    onChange={(e) => setInterviewData({...interviewData, interviewLocation: e.target.value})}
                    placeholder="Ví dụ: Văn phòng F-Service, 123 ABC Street"
                  />
                </div>
              )}

              {(interviewData.interviewType === 'video' || interviewData.interviewType === 'phone') && (
                <div className="form-group">
                  <label>{interviewData.interviewType === 'video' ? 'Link họp:' : 'Số điện thoại liên hệ:'}</label>
                  <input
                    type={interviewData.interviewType === 'video' ? 'url' : 'tel'}
                    value={interviewData.interviewType === 'video' ? interviewData.meetingLink : interviewData.contactInfo.phone}
                    onChange={(e) => {
                      if (interviewData.interviewType === 'video') {
                        setInterviewData({...interviewData, meetingLink: e.target.value});
                      } else {
                        setInterviewData({...interviewData, contactInfo: {...interviewData.contactInfo, phone: e.target.value}});
                      }
                    }}
                    placeholder={interviewData.interviewType === 'video' ? 'https://meet.google.com/...' : '09xxxxxxxx'}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Tin nhắn cho thành viên:</label>
                <textarea
                  value={interviewData.message}
                  onChange={(e) => setInterviewData({...interviewData, message: e.target.value})}
                  rows="4"
                  placeholder="Nhập nội dung tin nhắn, ghi chú về buổi phỏng vấn..."
                />
              </div>

              <div className="form-group">
                <label>Thông tin liên hệ bổ sung:</label>
                <textarea
                  value={interviewData.contactInfo.additional}
                  onChange={(e) => setInterviewData({...interviewData, contactInfo: {...interviewData.contactInfo, additional: e.target.value}})}
                  rows="2"
                  placeholder="Thông tin khác mà thành viên cần biết..."
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '📤 Đang gửi...' : '📤 Gửi thư mời phỏng vấn'}
              </button>
            </form>
          )}

          {/* Approval Tab */}
          {activeTab === 'approve' && (
            <form onSubmit={handleFinalApproval} className="approval-form">
              <div className="form-group">
                <label>Cấp bậc được duyệt:</label>
                <select
                  value={approvalData.assignedCapBac}
                  onChange={(e) => setApprovalData({...approvalData, assignedCapBac: e.target.value})}
                >
                  <option value="Intern">🌱 Intern (Thực tập sinh)</option>
                  <option value="Thành thạo">⭐ Thành thạo</option>
                  <option value="Chuyên gia">🏆 Chuyên gia</option>
                </select>
              </div>

              <div className="form-group">
                <label>Thời gian thử việc (ngày):</label>
                <input
                  type="number"
                  value={approvalData.probationPeriod}
                  onChange={(e) => setApprovalData({...approvalData, probationPeriod: parseInt(e.target.value)})}
                  min="7"
                  max="90"
                />
              </div>

              <div className="form-group">
                <label>Ghi chú phê duyệt:</label>
                <textarea
                  value={approvalData.approvalNotes}
                  onChange={(e) => setApprovalData({...approvalData, approvalNotes: e.target.value})}
                  rows="4"
                  placeholder="Nhập ghi chú về lý do phê duyệt, kỳ vọng đối với thành viên..."
                />
              </div>

              <div className="form-group">
                <label>Hướng dẫn đặc biệt (nếu có):</label>
                <textarea
                  value={approvalData.specialInstructions}
                  onChange={(e) => setApprovalData({...approvalData, specialInstructions: e.target.value})}
                  rows="3"
                  placeholder="Các hướng dẫn đặc biệt cho thành viên mới..."
                />
              </div>

              <div className="alert alert-info">
                <strong>⚠️ Lưu ý:</strong> Phê duyệt trực tiếp sẽ kích hoạt tài khoản thành viên ngay lập tức mà không cần phỏng vấn.
              </div>

              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? '✅ Đang xử lý...' : '✅ Phê duyệt thành viên'}
              </button>
            </form>
          )}

          {/* Rejection Tab */}
          {activeTab === 'reject' && (
            <form onSubmit={handleRejection} className="rejection-form">
              <div className="form-group">
                <label>Lý do từ chối:</label>
                <select
                  value={rejectionData.rejectionCategory}
                  onChange={(e) => setRejectionData({...rejectionData, rejectionCategory: e.target.value})}
                >
                  <option value="not-qualified">❌ Chưa đáp ứng yêu cầu</option>
                  <option value="incomplete-profile">📝 Hồ sơ chưa đầy đủ</option>
                  <option value="duplicate">🔄 Đăng ký trùng lặp</option>
                  <option value="other">⚠️ Lý do khác</option>
                </select>
              </div>

              <div className="form-group">
                <label>Chi tiết lý do:</label>
                <textarea
                  value={rejectionData.rejectionReason}
                  onChange={(e) => setRejectionData({...rejectionData, rejectionReason: e.target.value})}
                  rows="4"
                  placeholder="Nhập chi tiết lý do từ chối..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Góp ý để cải thiện:</label>
                <textarea
                  value={rejectionData.feedback}
                  onChange={(e) => setRejectionData({...rejectionData, feedback: e.target.value})}
                  rows="4"
                  placeholder="Nhập góp ý để thành viên có thể cải thiện hồ sơ trong tương lai..."
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rejectionData.canReapply}
                    onChange={(e) => setRejectionData({...rejectionData, canReapply: e.target.checked})}
                  />
                  Cho phép đăng ký lại sau
                </label>
              </div>

              <div className="alert alert-warning">
                <strong>⚠️ Cảnh báo:</strong> Thao tác này sẽ từ chối thành viên và vô hiệu hóa tài khoản của họ.
              </div>

              <button type="submit" className="btn btn-danger" disabled={loading}>
                {loading ? '❌ Đang xử lý...' : '❌ Từ chối thành viên'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberApprovalModal;
