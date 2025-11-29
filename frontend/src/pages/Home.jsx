import React from 'react';
import { Link } from 'react-router-dom';
import './css/Home.css';

function Home() {
  return (
    <div className="home">
      <div className="home__container">
        {/* Hero Section */}
        <section className="home__hero">
          <div className="home__hero-content">
            <div className="home__hero-badge">
              <span>🚀</span>
              <span>Chào mừng đến với F-Service</span>
            </div>
            <h1 className="home__hero-title">
              Hệ sinh thái dịch vụ <span>ủy thác chuyên nghiệp</span>
            </h1>
            <p className="home__hero-description">
              Nền tảng tiên phong kết nối người dùng với các thành viên ủy thác chuyên nghiệp. An toàn, minh bạch và hiệu quả cho mọi loại dịch vụ.
            </p>
            <div className="home__hero-buttons">
              <Link to="/register-choice" className="home__btn home__btn--primary">
                Đăng ký ngay
              </Link>
              <Link to="/member/register" className="home__btn home__btn--secondary">
                Trở thành Thành viên
              </Link>
              <Link to="/services" className="home__btn home__btn--outline">
                Khám phá dịch vụ
              </Link>
            </div>
          </div>
        </section>

        {/* Website Introduction */}
        <section className="home__intro">
          <h2 className="home__intro-title">Giới thiệu về F-Service</h2>
          <div className="home__intro-content">
            <p className="home__intro-text">
              <strong>F-Service</strong> là nền tảng dịch vụ ủy thác tiên phong, kết nối người dùng có nhu cầu với các thành viên ủy thác chuyên nghiệp và đã được xác thực. Chúng tôi xây dựng một hệ sinh thái an toàn, minh bạch và hiệu quả cho mọi loại dịch vụ.
            </p>
            <p className="home__intro-text">
              Với công nghệ AI thông minh, F-Service tự động phân loại yêu cầu, đề xuất thành viên phù hợp và quản lý giao dịch một cách tự động. Hệ thống ví điện tử tích hợp đảm bảo thanh toán an toàn, chỉ giải ngân khi dịch vụ được hoàn thành và xác nhận.
            </p>
            
            {/* Stats Grid */}
            <div className="home__stats">
              <div className="home__stat">
                <span className="home__stat-number">10,000+</span>
                <span className="home__stat-label">Người dùng tin tưởng</span>
              </div>
              <div className="home__stat">
                <span className="home__stat-number">500+</span>
                <span className="home__stat-label">Thành viên ủy thac</span>
              </div>
              <div className="home__stat">
                <span className="home__stat-number">50+</span>
                <span className="home__stat-label">Loại dịch vụ</span>
              </div>
              <div className="home__stat">
                <span className="home__stat-number">99.9%</span>
                <span className="home__stat-label">Hài lòng</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="home__features">
          <h2 className="home__section-title">Tại sao chọn F-Service?</h2>
          <div className="home__features-grid">
            <div className="home__feature-card">
              <div className="home__feature-icon">🔒</div>
              <h3 className="home__feature-title">An toàn tuyệt đối</h3>
              <p className="home__feature-description">
                Hệ thống bảo mật đa lớp, mã hóa dữ liệu và xác thực hai yếu tố
              </p>
            </div>
            <div className="home__feature-card">
              <div className="home__feature-icon">⚡</div>
              <h3 className="home__feature-title">Giao dịch nhanh chóng</h3>
              <p className="home__feature-description">
                Xử lý giao dịch tức thì, tự động xác nhận và hoàn tiền nhanh chóng
              </p>
            </div>
            <div className="home__feature-card">
              <div className="home__feature-icon">🎯</div>
              <h3 className="home__feature-title">Dịch vụ đa dạng</h3>
              <p className="home__feature-description">
                Nhiều loại dịch vụ với mức giá và ưu đãi khác nhau
              </p>
            </div>
            <div className="home__feature-card">
              <div className="home__feature-icon">📊</div>
              <h3 className="home__feature-title">Thống kê chi tiết</h3>
              <p className="home__feature-description">
                Báo cáo doanh thu, thống kê giao dịch và phân tích hiệu quả
              </p>
            </div>
          </div>
        </section>

        {/* Member Registration Section */}
        <section className="home__member-section">
          <h2 className="home__member-title">Trở thành Thành viên ủy thac</h2>
          <p className="home__member-description">
            Hãy tham gia cộng đồng thành viên chuyên nghiệp của F-Service để nhận các yêu cầu dịch vụ và tăng thu nhập
          </p>
          
          <div className="home__member-levels">
            <div className="home__member-level">
              <div className="home__member-level-icon">🌱</div>
              <h3 className="home__member-level-title">Intern</h3>
              <p className="home__member-level-description">
                Thực tập sinh mới, nhận đào tạo và các yêu cầu cơ bản
              </p>
              <div className="home__member-level-commission">Hoa hồng: 5-10%</div>
            </div>
            <div className="home__member-level">
              <div className="home__member-level-icon">⭐</div>
              <h3 className="home__member-level-title">Thành thạo</h3>
              <p className="home__member-level-description">
                Đã có kinh nghiệm, nhận các yêu cầu phức tạp hơn
              </p>
              <div className="home__member-level-commission">Hoa hồng: 10-15%</div>
            </div>
            <div className="home__member-level">
              <div className="home__member-level-icon">👑</div>
              <h3 className="home__member-level-title">Chuyên gia</h3>
              <p className="home__member-level-description">
                Chuyên gia hàng đầu, nhận các yêu cầu giá trị cao
              </p>
              <div className="home__member-level-commission">Hoa hồng: 15-25%</div>
            </div>
          </div>

          <div className="home__hero-buttons">
            <Link to="/member/register" className="home__btn home__btn--primary">
              Đăng ký thành viên
            </Link>
            <Link to="/services" className="home__btn home__btn--outline">
              Tìm hiểu thêm
            </Link>
          </div>
        </section>

        {/* Services Preview */}
        <section className="home__services">
          <h2 className="home__section-title">Dịch vụ nổi bật</h2>
          <div className="home__services-grid">
            <div className="home__service-card">
              <div className="home__service-icon">🎓</div>
              <h3 className="home__service-title">Gia sư</h3>
              <p className="home__service-description">
                Dạy kèm các môn học, luyện thi, hỗ trợ bài tập
              </p>
              <Link to="/services?category=tutoring" className="home__service-link">
                Xem chi tiết →
              </Link>
            </div>
            <div className="home__service-card">
              <div className="home__service-icon">🔧</div>
              <h3 className="home__service-title">Sửa chữa</h3>
              <p className="home__service-description">
                Sửa chữa điện tử, điện lạnh, thiết bị gia dụng
              </p>
              <Link to="/services?category=repair" className="home__service-link">
                Xem chi tiết →
              </Link>
            </div>
            <div className="home__service-card">
              <div className="home__service-icon">📦</div>
              <h3 className="home__service-title">Giao hàng</h3>
              <p className="home__service-description">
                Giao hàng, chuyển phát, hỗ trợ logistics
              </p>
              <Link to="/services?category=delivery" className="home__service-link">
                Xem chi tiết →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="home__cta">
          <div className="home__cta-content">
            <h2 className="home__cta-title">Sẵn sàng bắt đầu?</h2>
            <p className="home__cta-description">
              Đăng ký tài khoản ngay hôm nay để trải nghiệm dịch vụ ủy thac chuyên nghiệp
            </p>
            <div className="home__cta-buttons">
              <Link to="/register" className="home__btn home__btn--primary">
                Đăng ký miễn phí
              </Link>
              <Link to="/member/register" className="home__btn home__btn--outline">
                Trở thành thành viên
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
