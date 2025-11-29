import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './css/Contact.css';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would normally send the form data to your backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 3000);
  };

  return (
    <div className="contact">
      <div className="contact__container">
        <div className="contact__header">
          <h1 className="contact__title">Liên hệ với F-Service</h1>
          <p className="contact__subtitle">Chúng tôi luôn lắng nghe và sẵn sàng hỗ trợ bạn</p>
        </div>

        <div className="contact__content">
          <div className="contact__info">
            <div className="contact__info-section">
              <h2>Thông tin liên hệ</h2>
              <div className="contact__info-item">
                <div className="contact__info-icon">📍</div>
                <div className="contact__info-text">
                  <strong>Địa chỉ:</strong>
                  <p>123 Nguyễn Huệ, Q.1, TP.HCM</p>
                </div>
              </div>
              <div className="contact__info-item">
                <div className="contact__info-icon">📞</div>
                <div className="contact__info-text">
                  <strong>Điện thoại:</strong>
                  <p>1900-1234</p>
                </div>
              </div>
              <div className="contact__info-item">
                <div className="contact__info-icon">✉️</div>
                <div className="contact__info-text">
                  <strong>Email:</strong>
                  <p>support@fservice.com</p>
                </div>
              </div>
              <div className="contact__info-item">
                <div className="contact__info-icon">🕐</div>
                <div className="contact__info-text">
                  <strong>Giờ làm việc:</strong>
                  <p>Thứ 2 - Thứ 6: 8:00 - 18:00</p>
                </div>
              </div>
            </div>

            <div className="contact__info-section">
              <h2>Mạng xã hội</h2>
              <div className="contact__social">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="contact__social-link">
                  <i className="fab fa-facebook-f"></i>
                  Facebook
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="contact__social-link">
                  <i className="fab fa-twitter"></i>
                  Twitter
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="contact__social-link">
                  <i className="fab fa-instagram"></i>
                  Instagram
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="contact__social-link">
                  <i className="fab fa-linkedin-in"></i>
                  LinkedIn
                </a>
              </div>
            </div>
          </div>

          <div className="contact__form-section">
            <h2>Gửi tin nhắn cho chúng tôi</h2>
            {submitted ? (
              <div className="contact__success">
                <div className="contact__success-icon">✅</div>
                <h3>Cảm ơn bạn đã liên hệ!</h3>
                <p>Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>
              </div>
            ) : (
              <form className="contact__form" onSubmit={handleSubmit}>
                <div className="contact__form-group">
                  <label htmlFor="name">Họ và tên *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Nhập họ và tên của bạn"
                  />
                </div>

                <div className="contact__form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Nhập email của bạn"
                  />
                </div>

                <div className="contact__form-group">
                  <label htmlFor="phone">Số điện thoại</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại của bạn"
                  />
                </div>

                <div className="contact__form-group">
                  <label htmlFor="subject">Chủ đề *</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Chọn chủ đề --</option>
                    <option value="support">Hỗ trợ kỹ thuật</option>
                    <option value="service">Hỏi về dịch vụ</option>
                    <option value="partnership">Hợp tác</option>
                    <option value="feedback">Góp ý</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div className="contact__form-group">
                  <label htmlFor="message">Tin nhắn *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    placeholder="Nhập nội dung tin nhắn của bạn"
                  ></textarea>
                </div>

                <button type="submit" className="contact__btn">
                  Gửi tin nhắn
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="contact__faq">
          <h2>Câu hỏi thường gặp</h2>
          <div className="contact__faq-list">
            <div className="contact__faq-item">
              <h3>Làm thế nào để đăng ký dịch vụ?</h3>
              <p>Bạn có thể đăng ký tài khoản và tạo yêu cầu dịch vụ trực tiếp trên trang web của chúng tôi.</p>
            </div>
            <div className="contact__faq-item">
              <h3>Thời gian xử lý yêu cầu là bao lâu?</h3>
              <p>Chúng tôi xử lý yêu cầu trong vòng 24 giờ làm việc.</p>
            </div>
            <div className="contact__faq-item">
              <h3>Làm thế nào để trở thành thành viên ủy thác?</h3>
              <p>Bạn có thể đăng ký thành viên và hoàn thành quy trình xác thực của chúng tôi.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
