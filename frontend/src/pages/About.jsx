import React from 'react';
import { Link } from 'react-router-dom';
import './css/About.css';

function About() {
  return (
    <div className="about">
      <div className="about__container">
        <div className="about__header">
          <h1 className="about__title">Về F-Service</h1>
          <p className="about__subtitle">Nền tảng dịch vụ uy tín hàng đầu Việt Nam</p>
        </div>

        <div className="about__content">
          <section className="about__section">
            <h2 className="about__section-title">Câu chuyện của chúng tôi</h2>
            <div className="about__section-content">
              <p className="about__text">
                F-Service được thành lập với sứ mệnh kết nối người dùng có nhu cầu với các thành viên ủy thác chuyên nghiệp và đã được xác thực. Chúng tôi xây dựng một hệ sinh thái an toàn, minh bạch và hiệu quả cho mọi loại dịch vụ.
              </p>
              <p className="about__text">
                Với công nghệ AI thông minh, F-Service tự động phân loại yêu cầu, đề xuất thành viên phù hợp và quản lý giao dịch một cách tự động. Hệ thống ví điện tử tích hợp đảm bảo thanh toán an toàn, chỉ giải ngân khi dịch vụ được hoàn thành và xác nhận.
              </p>
            </div>
          </section>

          <section className="about__section">
            <h2 className="about__section-title">Tầm nhìn & Sứ mệnh</h2>
            <div className="about__section-content">
              <div className="about__vision-mission">
                <div className="about__vision">
                  <h3>Tầm nhìn</h3>
                  <p>Trở thành nền tảng dịch vụ ủy thac hàng đầu tại Việt Nam, mang lại sự tin tưởng và an toàn cho mọi giao dịch dịch vụ.</p>
                </div>
                <div className="about__mission">
                  <h3>Sứ mệnh</h3>
                  <p>Kết nối người dùng và thành viên ủy thac một cách hiệu quả, minh bạch và bảo vệ quyền lợi của tất cả các bên.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="about__section">
            <h2 className="about__section-title">Giá trị cốt lõi</h2>
            <div className="about__values">
              <div className="about__value">
                <div className="about__value-icon">🔒</div>
                <h3>An toàn</h3>
                <p>Bảo vệ thông tin và giao dịch của người dùng</p>
              </div>
              <div className="about__value">
                <div className="about__value-icon">✅</div>
                <h3>Chất lượng</h3>
                <p>Đảm bảo dịch vụ đạt tiêu chuẩn cao nhất</p>
              </div>
              <div className="about__value">
                <div className="about__value-icon">🤝</div>
                <h3>Tin cậy</h3>
                <p>Xây dựng niềm tin lâu dài với khách hàng</p>
              </div>
              <div className="about__value">
                <div className="about__value-icon">🚀</div>
                <h3>Sáng tạo</h3>
                <p>Luôn cải tiến và phát triển công nghệ mới</p>
              </div>
            </div>
          </section>

          <section className="about__section">
            <h2 className="about__section-title">Đội ngũ của chúng tôi</h2>
            <div className="about__section-content">
              <p className="about__text">
                Đội ngũ F-Service bao gồm các chuyên gia công nghệ, kinh doanh và dịch vụ khách hàng với nhiều năm kinh nghiệm. Chúng tôi luôn lắng nghe và cải tiến để mang lại trải nghiệm tốt nhất cho người dùng.
              </p>
            </div>
          </section>

          <section className="about__section">
            <h2 className="about__section-title">Liên hệ với chúng tôi</h2>
            <div className="about__contact">
              <div className="about__contact-item">
                <strong>Địa chỉ:</strong> 123 Nguyễn Huệ, Q.1, TP.HCM
              </div>
              <div className="about__contact-item">
                <strong>Điện thoại:</strong> 1900-1234
              </div>
              <div className="about__contact-item">
                <strong>Email:</strong> support@fservice.com
              </div>
              <div className="about__contact-item">
                <strong>Giờ làm việc:</strong> Thứ 2 - Thứ 6: 8:00 - 18:00
              </div>
            </div>
          </section>
        </div>

        <div className="about__cta">
          <h2>Sẵn sàng trải nghiệm?</h2>
          <p>Hãy tham gia cùng hàng ngàn người dùng tin tưởng F-Service</p>
          <div className="about__cta-buttons">
            <Link to="/register-choice" className="about__btn about__btn--primary">
              Đăng ký ngay
            </Link>
            <Link to="/services" className="about__btn about__btn--secondary">
              Khám phá dịch vụ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
