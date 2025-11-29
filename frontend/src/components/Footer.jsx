// frontend/src/components/Footer.jsx
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__content">
          {/* Company Info */}
          <div className="footer__section">
            <div className="footer__logo">
              <h2>F-Service</h2>
              <p>Nền tảng dịch vụ uy tín hàng đầu</p>
            </div>
            <p className="footer__description">
              Kết nối người dùng với các dịch vụ chất lượng cao. 
              Đối tác tin cậy cho mọi nhu cầu của bạn.
            </p>
            <div className="footer__social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer__social-link">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer__social-link">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer__social-link">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="footer__social-link">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer__section">
            <h3 className="footer__title">Liên kết nhanh</h3>
            <ul className="footer__links">
              <li>
                <Link to="/" className="footer__link">Trang chủ</Link>
              </li>
              <li>
                <Link to="/services" className="footer__link">Dịch vụ</Link>
              </li>
              <li>
                <Link to="/about" className="footer__link">Về chúng tôi</Link>
              </li>
              <li>
                <Link to="/contact" className="footer__link">Liên hệ</Link>
              </li>
              <li>
                <Link to="/blog" className="footer__link">Blog</Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="footer__section">
            <h3 className="footer__title">Dịch vụ</h3>
            <ul className="footer__links">
              <li>
                <Link to="/services?category=tutoring" className="footer__link">Gia sư</Link>
              </li>
              <li>
                <Link to="/services?category=repair" className="footer__link">Sửa chữa</Link>
              </li>
              <li>
                <Link to="/services?category=delivery" className="footer__link">Giao hàng</Link>
              </li>
              <li>
                <Link to="/services?category=cleaning" className="footer__link">Vệ sinh</Link>
              </li>
              <li>
                <Link to="/services?category=care" className="footer__link">Chăm sóc</Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="footer__section">
            <h3 className="footer__title">Hỗ trợ</h3>
            <ul className="footer__links">
              <li>
                <Link to="/help" className="footer__link">Trung tâm trợ giúp</Link>
              </li>
              <li>
                <Link to="/faq" className="footer__link">Câu hỏi thường gặp</Link>
              </li>
              <li>
                <Link to="/terms" className="footer__link">Điều khoản sử dụng</Link>
              </li>
              <li>
                <Link to="/privacy" className="footer__link">Chính sách bảo mật</Link>
              </li>
              <li>
                <Link to="/refund" className="footer__link">Chính sách hoàn tiền</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer__section">
            <h3 className="footer__title">Liên hệ</h3>
            <div className="footer__contact">
              <div className="footer__contact-item">
                <i className="fas fa-map-marker-alt"></i>
                <span>123 Nguyễn Huệ, Q.1, TP.HCM</span>
              </div>
              <div className="footer__contact-item">
                <i className="fas fa-phone"></i>
                <span>1900-1234</span>
              </div>
              <div className="footer__contact-item">
                <i className="fas fa-envelope"></i>
                <span>support@fservice.com</span>
              </div>
              <div className="footer__contact-item">
                <i className="fas fa-clock"></i>
                <span>Thứ 2 - Thứ 6: 8:00 - 18:00</span>
              </div>
            </div>
            <div className="footer__payment">
              <h4>Phương thức thanh toán</h4>
              <div className="footer__payment-methods">
                <i className="fab fa-cc-visa"></i>
                <i className="fab fa-cc-mastercard"></i>
                <i className="fab fa-cc-amex"></i>
                <i className="fab fa-cc-paypal"></i>
                <i className="fas fa-money-bill-wave"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="footer__bottom">
          <div className="footer__bottom-content">
            <p className="footer__copyright">
              © {currentYear} F-Service. Tất cả quyền được bảo lưu.
            </p>
            <div className="footer__bottom-links">
              <Link to="/sitemap" className="footer__bottom-link">Sitemap</Link>
              <Link to="/accessibility" className="footer__bottom-link">Accessibility</Link>
              <Link to="/cookies" className="footer__bottom-link">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button 
        className="footer__back-to-top" 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        <i className="fas fa-arrow-up"></i>
      </button>
    </footer>
  );
}

export default Footer;
