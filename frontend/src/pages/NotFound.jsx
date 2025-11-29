// frontend/src/pages/NotFound.jsx
import { Link } from 'react-router-dom';
import './css/NotFound.css';

function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found__container">
        <div className="not-found__content">
          <div className="not-found__error-code">404</div>
          <h1 className="not-found__title">Trang không tìm thấy</h1>
          <p className="not-found__description">
            Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
          </p>
          <div className="not-found__actions">
            <Link to="/" className="btn btn-primary">
              <i className="fas fa-home"></i>
              Về trang chủ
            </Link>
            <Link to="/services" className="btn btn-outline">
              <i className="fas fa-list"></i>
              Xem dịch vụ
            </Link>
          </div>
          <div className="not-found__help">
            <h3>Bạn có thể thử:</h3>
            <ul>
              <li>Kiểm tra lại URL bạn đã nhập</li>
              <li>Quay lại trang trước</li>
              <li>Liên hệ hỗ trợ nếu bạn nghĩ đây là lỗi</li>
            </ul>
            <div className="not-found__contact">
              <p>
                <i className="fas fa-envelope"></i>
                Email: support@fservice.com
              </p>
              <p>
                <i className="fas fa-phone"></i>
                Hotline: 1900-1234
              </p>
            </div>
          </div>
        </div>
        <div className="not-found__illustration">
          <div className="not-found__icon">
            <i className="fas fa-search"></i>
          </div>
          <div className="not-found__dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
