// frontend/src/pages/MemberRegisterNew.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAlert } from '../hooks/useAlert';
import Alert from '../components/Alert';
import api from '../config/api';
import './css/MemberRegisterNew.css';

function MemberRegisterNew() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '', // Add password confirmation
    phone: '',
    address: '',
    CapBac: 'Intern',
    LinhVuc: 'CongNghe',
    MoTa: '',
    KinhNghiem: ''
  });

  const [loading, setLoading] = useState(false);
  const { success, error, AlertContainer } = useAlert();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      error('Vui lòng điền đầy đủ các trường bắt buộc!');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      error('Password phải có ít nhất 6 ký tự!');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.password2) {
      error('Mật khẩu xác nhận không khớp!');
      setLoading(false);
      return;
    }

    if (!formData.email.includes('@')) {
      error('Email không hợp lệ!');
      setLoading(false);
      return;
    }

    if (!formData.CapBac || !formData.LinhVuc) {
      error('Vui lòng chọn cấp bậc và lĩnh vực!');
      setLoading(false);
      return;
    }

    try {
      // Call actual API
      const result = await api.post('/auth/register-member', formData);

      if (result.data?.success) {
        success('Đăng ký thành viên thành công! Chúng tôi sẽ liên hệ qua email để hướng dẫn các bước tiếp theo.');
        setLoading(false);
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        error(result.data?.message || 'Đăng ký thất bại!');
        setLoading(false);
      }
    } catch (err) {
      error('Lỗi kết nối đến server. Vui lòng thử lại!');
      setLoading(false);
    }
  };

  return (
    <React.Fragment>
      <AlertContainer />
      <div className="member-register-new">
        <div className="member-register-new__container">
          <h1 className="member-register-new__title">
            Đăng ký Thành viên F-Service
          </h1>
          <p className="member-register-new__subtitle">
            Gia nhập mạng lưới ủy thác chuyên nghiệp và nhận các yêu cầu phù hợp với chuyên môn của bạn
          </p>

          <form onSubmit={handleSubmit} className="member-register-new__form">
            <div className="member-register-new__form-row">
              <div className="member-register-new__field">
                <label className="member-register-new__label">
                  Họ tên <span className="member-register-new__required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="member-register-new__input"
                  placeholder="Nhập họ và tên của bạn"
                  required
                />
              </div>

              <div className="member-register-new__field">
                <label className="member-register-new__label">
                  Email <span className="member-register-new__required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="member-register-new__input"
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>

          <div className="member-register-new__form-row">
              <div className="member-register-new__field">
                <label className="member-register-new__label">
                  Password <span className="member-register-new__required">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="member-register-new__input"
                  placeholder="Tối thiểu 6 ký tự"
                  required
                />
              </div>

              <div className="member-register-new__field">
                <label className="member-register-new__label">
                  Xác nhận Password <span className="member-register-new__required">*</span>
                </label>
                <input
                  type="password"
                  name="password2"
                  value={formData.password2}
                  onChange={(e) => setFormData({...formData, password2: e.target.value})}
                  className="member-register-new__input"
                  placeholder="Nhập lại mật khẩu"
                  required
                />
              </div>

              <div className="member-register-new__field">
                <label className="member-register-new__label">
                  Số điện thoại <span className="member-register-new__optional">(tùy chọn)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="member-register-new__input"
                  placeholder="09xxxxxxxx"
                />
              </div>
            </div>

            <div className="member-register-new__field">
              <label className="member-register-new__label">
                Địa chỉ <span className="member-register-new__optional">(tùy chọn)</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="member-register-new__input"
                placeholder="Thành phố, Quận/Huyện"
              />
            </div>

            <div className="member-register-new__form-row">
              <div className="member-register-new__field">
                <label className="member-register-new__label">
                  Cấp bậc <span className="member-register-new__required">*</span>
                </label>
                <select
                  name="CapBac"
                  value={formData.CapBac}
                  onChange={(e) => setFormData({...formData, CapBac: e.target.value})}
                  className="member-register-new__select"
                  required
                >
                  <option value="Intern">🌱 Intern (Thực tập sinh)</option>
                  <option value="Thành thạo">⭐ Thành thạo</option>
                  <option value="Chuyên gia">🏆 Chuyên gia</option>
                </select>
              </div>

              <div className="member-register-new__field">
                <label className="member-register-new__label">
                  Lĩnh vực <span className="member-register-new__required">*</span>
                </label>
                <select
                  name="LinhVuc"
                  value={formData.LinhVuc}
                  onChange={(e) => setFormData({...formData, LinhVuc: e.target.value})}
                  className="member-register-new__select"
                  required
                >
                  <option value="CongNghe">💻 Công nghệ</option>
                  <option value="GiaoDuc">📚 Giáo dục</option>
                  <option value="YTe">🏥 Y tế</option>
                  <option value="TaiChinh">💰 Tài chính</option>
                  <option value="ThietKe">🎨 Thiết kế</option>
                  <option value="Marketing">📢 Marketing</option>
                </select>
              </div>
            </div>

            <div className="member-register-new__field">
              <label className="member-register-new__label">
                Mô tả kinh nghiệm
              </label>
              <textarea
                name="MoTa"
                value={formData.MoTa}
                onChange={(e) => setFormData({...formData, MoTa: e.target.value})}
                className="member-register-new__textarea"
                placeholder="Mô tả kinh nghiệm, kỹ năng và dự án đã thực hiện..."
                rows="4"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="member-register-new__submit"
            >
              {loading ? (
                <>
                  <span className="member-register-new__spinner"></span>
                  Đang xử lý...
                </>
              ) : (
                <>
                  Đăng ký thành viên
                  <span style={{ marginLeft: '8px' }}>→</span>
                </>
              )}
            </button>
          </form>

          <div className="member-register-new__footer">
            <Link to="/register-choice">← Quay lại lựa chọn đăng ký</Link>
          </div>

          <div className="member-register-new__notice">
            <div className="member-register-new__notice-title">
              ⚠️ Lưu ý quan trọng
            </div>
            <div className="member-register-new__notice-text">
              Đăng ký thành viên cần được admin phê duyệt. Sau khi đăng ký:
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Chúng tôi sẽ xem xét hồ sơ của bạn</li>
                <li>Liên hệ qua email để hẹn phỏng vấn (nếu cần)</li>
                <li>Hướng dẫn nộp hồ sơ và chứng chỉ</li>
                <li>Phê duyệt cuối cùng và kích hoạt tài khoản</li>
              </ul>
              Quá trình này thường mất 2-3 ngày làm việc.
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export default MemberRegisterNew;
