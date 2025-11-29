import React from 'react';
import { Link } from 'react-router-dom';
import './css/Sitemap.css';

function Sitemap() {
  const siteStructure = [
    {
      title: 'Trang chính',
      links: [
        { name: 'Trang chủ', url: '/' },
        { name: 'Về chúng tôi', url: '/about' },
        { name: 'Liên hệ', url: '/contact' },
        { name: 'Blog', url: '/blog' }
      ]
    },
    {
      title: 'Tài khoản',
      links: [
        { name: 'Đăng nhập', url: '/login' },
        { name: 'Đăng ký', url: '/register' },
        { name: 'Lựa chọn đăng ký', url: '/register-choice' },
        { name: 'Đăng ký thành viên', url: '/member/register' },
        { name: 'Quên mật khẩu', url: '/forgot-password' }
      ]
    },
    {
      title: 'Dịch vụ',
      links: [
        { name: 'Danh sách dịch vụ', url: '/services' },
        { name: 'Tạo yêu cầu', url: '/requests/new' },
        { name: 'Yêu cầu của tôi', url: '/my-requests' },
        { name: 'Trung tâm tri thức', url: '/knowledge' }
      ]
    },
    {
      title: 'Dashboard',
      links: [
        { name: 'Dashboard người dùng', url: '/dashboard' },
        { name: 'Dashboard thành viên', url: '/member/dashboard' },
        { name: 'Dashboard admin', url: '/admin/dashboard' },
        { name: 'Ví điện tử', url: '/wallet' },
        { name: 'Hồ sơ', url: '/profile' },
        { name: 'Hồ sơ thành viên', url: '/member/profile' }
      ]
    },
    {
      title: 'Admin',
      links: [
        { name: 'Quản lý dịch vụ', url: '/admin/services' },
        { name: 'Quản lý người dùng', url: '/admin/users' },
        { name: 'Quản lý thành viên', url: '/admin/members' },
        { name: 'Quản lý giao dịch', url: '/admin/transactions' }
      ]
    },
    {
      title: 'Hỗ trợ',
      links: [
        { name: 'Trung tâm trợ giúp', url: '/help' },
        { name: 'Câu hỏi thường gặp', url: '/faq' },
        { name: 'Điều khoản sử dụng', url: '/terms' },
        { name: 'Chính sách bảo mật', url: '/privacy' },
        { name: 'Chính sách hoàn tiền', url: '/refund' }
      ]
    }
  ];

  const serviceCategories = [
    'Gia sư',
    'Sửa chữa thiết bị',
    'Giao hàng',
    'Vệ sinh',
    'Nấu ăn',
    'Chăm sóc',
    'Lập trình Web',
    'Lập trình Mobile',
    'Thiết kế Đồ họa',
    'Thiết kế UI/UX',
    'Marketing Digital',
    'Marketing'
  ];

  return (
    <div className="sitemap">
      <div className="sitemap__container">
        <div className="sitemap__header">
          <h1 className="sitemap__title">Sitemap</h1>
          <p className="sitemap__subtitle">Sơ đồ trang web F-Service</p>
        </div>

        <div className="sitemap__content">
          <div className="sitemap__sections">
            {siteStructure.map((section, index) => (
              <div key={index} className="sitemap__section">
                <h2 className="sitemap__section-title">{section.title}</h2>
                <ul className="sitemap__links">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex} className="sitemap__link-item">
                      <Link to={link.url} className="sitemap__link">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="sitemap__categories">
            <h2 className="sitemap__section-title">Danh mục dịch vụ</h2>
            <div className="sitemap__category-grid">
              {serviceCategories.map((category, index) => (
                <Link 
                  key={index} 
                  to={`/services?category=${category.toLowerCase().replace(/\s+/g, '-')}`}
                  className="sitemap__category-link"
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>

          <div className="sitemap__info">
            <div className="sitemap__stats">
              <h2>Thống kê website</h2>
              <div className="sitemap__stats-grid">
                <div className="sitemap__stat">
                  <span className="sitemap__stat-number">50+</span>
                  <span className="sitemap__stat-label">Trang</span>
                </div>
                <div className="sitemap__stat">
                  <span className="sitemap__stat-number">12</span>
                  <span className="sitemap__stat-label">Danh mục dịch vụ</span>
                </div>
                <div className="sitemap__stat">
                  <span className="sitemap__stat-number">1000+</span>
                  <span className="sitemap__stat-label">Dịch vụ</span>
                </div>
                <div className="sitemap__stat">
                  <span className="sitemap__stat-number">24/7</span>
                  <span className="sitemap__stat-label">Hỗ trợ</span>
                </div>
              </div>
            </div>

            <div className="sitemap__last-updated">
              <h2>Cập nhật lần cuối</h2>
              <p>Sitemap được cập nhật tự động hàng ngày</p>
              <p>Lần cập nhật cuối: {new Date().toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
        </div>

        <div className="sitemap__footer">
          <div className="sitemap__footer-links">
            <Link to="/" className="sitemap__footer-link">← Về trang chủ</Link>
            <Link to="/contact" className="sitemap__footer-link">Liên hệ</Link>
            <a href="mailto:support@fservice.com" className="sitemap__footer-link">
              Gửi phản hồi về sitemap
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sitemap;
