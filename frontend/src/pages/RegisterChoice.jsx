// frontend/src/pages/RegisterChoice.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './css/RegisterChoice.css';

const RegisterChoice = () => {
  return (
    <div className="register-choice-container">
      <div className="register-choice-header">
        <h1>Chào mừng đến với F-Service</h1>
        <p>Chọn loại tài khoản phù hợp với bạn</p>
      </div>

      <div className="register-options">
        {/* User Registration Option */}
        <div className="register-option user-option">
          <div className="option-icon">👤</div>
          <h2>Đăng ký Người Dùng</h2>
          <p>
            Tìm kiếm và sử dụng các dịch vụ chuyên nghiệp từ thành viên ủy thác của chúng tôi
          </p>
          
          <div className="option-benefits">
            <h3>Quyền lợi:</h3>
            <ul>
              <li>Đăng yêu cầu dịch vụ miễn phí</li>
              <li>Kết nối với thành viên đã được xác thực</li>
              <li>Thanh toán an toàn qua ví F-Service</li>
              <li>Đánh giá và phản hồi dịch vụ</li>
              <li>Hỗ trợ 24/7</li>
            </ul>
          </div>

          <div className="option-features">
            <h3>Tính năng:</h3>
            <ul>
              <li>Tạo và quản lý yêu cầu dịch vụ</li>
              <li>Theo dõi tiến độ thực hiện</li>
              <li>Quản lý ví và thanh toán</li>
              <li>Lịch sử giao dịch</li>
            </ul>
          </div>

          <Link to="/register" className="register-btn user-btn">
            Đăng ký Người Dùng
          </Link>
        </div>

        {/* Member Registration Option */}
        <div className="register-option member-option">
          <div className="option-icon">👨‍💼</div>
          <h2>Đăng ký Thành Viên</h2>
          <p>
            Trở thành thành viên ủy thác, cung cấp dịch vụ chuyên nghiệp và kiếm thu nhập
          </p>
          
          <div className="option-benefits">
            <h3>Quyền lợi:</h3>
            <ul>
              <li>Nhận yêu cầu dịch vụ phù hợp</li>
              <li>Thu nhập ổn định và linh hoạt</li>
              <li>Xây dựng uy tín và đánh giá</li>
              <li>Công cụ quản lý công việc</li>
              <li>Hỗ trợ đào tạo và phát triển</li>
            </ul>
          </div>

          <div className="option-features">
            <h3>Yêu cầu:</h3>
            <ul>
              <li>Độ tuổi từ 18 trở lên</li>
              <li>Cung cấp thông tin xác thực</li>
              <li>Kỹ năng và kinh nghiệm relevant</li>
              <li>Phê duyệt từ admin</li>
            </ul>
          </div>

          <div className="approval-notice">
            <div className="notice-icon">⚠️</div>
            <p>
              <strong>Lưu ý:</strong> Đăng ký thành viên cần được admin phê duyệt. 
              Sau khi đăng ký, chúng tôi sẽ liên hệ qua email để hẹn phỏng vấn và hướng dẫn nộp hồ sơ.
            </p>
          </div>

          <Link to="/member/register" className="register-btn member-btn">
            Đăng ký Thành Viên
          </Link>
        </div>
      </div>

      <div className="register-choice-footer">
        <p>Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link></p>
        <p>
          <Link to="/services">Khám phá dịch vụ</Link> hoặc 
          <Link to="/"> Về trang chủ</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterChoice;
