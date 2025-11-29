// frontend/src/pages/RequestService.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAlert } from '../hooks/useAlert';
import './css/RequestService.css';

function RequestService({ user }) {
  const { success, error: showError, AlertContainer } = useAlert();
  const [formData, setFormData] = useState({
    serviceType: '',
    description: '',
    location: '',
    budget: '',
    urgency: 'normal',
    contactInfo: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.serviceType || !formData.description) {
      showError('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    // Mock submission
    console.log('Service request submitted:', formData);
    success('Yêu cầu dịch vụ đã được gửi thành công! Chúng tôi sẽ liên hệ sớm.');
    
    // Reset form
    setFormData({
      serviceType: '',
      description: '',
      location: '',
      budget: '',
      urgency: 'normal',
      contactInfo: '',
    });
  };

  return (
    <>
      <AlertContainer />
      <div className="request-service">
        <div className="request-service__container">
          <div className="request-service__header">
            <Link to="/dashboard" className="request-service__back">
              ← Quay lại Dashboard
            </Link>
            <h1 className="request-service__title">Tạo Yêu Cầu Dịch Vụ</h1>
            <p className="request-service__subtitle">
              Điền thông tin chi tiết để chúng tôi có thể phục vụ bạn tốt nhất
            </p>
          </div>

          <form onSubmit={handleSubmit} className="request-service__form">
            <div className="request-service__section">
              <h2 className="request-service__section-title">📋 Thông tin cơ bản</h2>
              
              <div className="request-service__field">
                <label className="request-service__label">Loại dịch vụ *</label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  className="request-service__select"
                  required
                >
                  <option value="">-- Chọn loại dịch vụ --</option>
                  <option value="legal">Dịch vụ pháp lý</option>
                  <option value="consulting">Tư vấn chuyên môn</option>
                  <option value="financial">Dịch vụ tài chính</option>
                  <option value="education">Dịch vụ giáo dục</option>
                  <option value="healthcare">Dịch vụ y tế</option>
                  <option value="technology">Dịch vụ công nghệ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div className="request-service__field">
                <label className="request-service__label">Mô tả chi tiết *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Mô tả chi tiết yêu cầu của bạn..."
                  className="request-service__textarea"
                  rows={5}
                  required
                />
              </div>

              <div className="request-service__field">
                <label className="request-service__label">Địa điểm</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Địa điểm thực hiện dịch vụ"
                  className="request-service__input"
                />
              </div>
            </div>

            <div className="request-service__section">
              <h2 className="request-service__section-title">💰 Thông tin tài chính</h2>
              
              <div className="request-service__field">
                <label className="request-service__label">Ngân sách dự kiến</label>
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="VD: 5.000.000 VNĐ"
                  className="request-service__input"
                />
              </div>

              <div className="request-service__field">
                <label className="request-service__label">Mức độ ưu tiên</label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  className="request-service__select"
                >
                  <option value="low">Thấp</option>
                  <option value="normal">Bình thường</option>
                  <option value="high">Cao</option>
                  <option value="urgent">Khẩn cấp</option>
                </select>
              </div>
            </div>

            <div className="request-service__section">
              <h2 className="request-service__section-title">📞 Thông tin liên hệ</h2>
              
              <div className="request-service__field">
                <label className="request-service__label">Thông tin liên hệ thêm</label>
                <input
                  type="text"
                  name="contactInfo"
                  value={formData.contactInfo}
                  onChange={handleChange}
                  placeholder="Số điện thoại hoặc email liên hệ"
                  className="request-service__input"
                />
              </div>
            </div>

            <div className="request-service__actions">
              <button type="submit" className="request-service__submit">
                Gửi Yêu Cầu
              </button>
              <Link to="/dashboard" className="request-service__cancel">
                Hủy
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default RequestService;
