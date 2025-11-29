import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './css/Cookies.css';

function Cookies() {
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false
  });

  const handlePreferenceChange = (category) => {
    setCookiePreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSavePreferences = () => {
    // Here you would normally save preferences to localStorage or backend
    localStorage.setItem('cookiePreferences', JSON.stringify(cookiePreferences));
    alert('Tùy chọn cookie đã được lưu!');
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    setCookiePreferences(allAccepted);
    localStorage.setItem('cookiePreferences', JSON.stringify(allAccepted));
    alert('Đã chấp nhận tất cả cookies!');
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    setCookiePreferences(onlyNecessary);
    localStorage.setItem('cookiePreferences', JSON.stringify(onlyNecessary));
    alert('Chỉ chấp nhận cookies cần thiết!');
  };

  return (
    <div className="cookies">
      <div className="cookies__container">
        <div className="cookies__header">
          <h1 className="cookies__title">Chính sách Cookie</h1>
          <p className="cookies__subtitle">Cách chúng tôi sử dụng cookies và quyền lựa chọn của bạn</p>
        </div>

        <div className="cookies__content">
          <div className="cookies__section">
            <h2>Cookies là gì?</h2>
            <p>
              Cookies là các tệp văn bản nhỏ được lưu trữ trên thiết bị của bạn khi bạn truy cập trang web. 
              Chúng giúp trang web ghi nhớ thông tin về bạn và cải thiện trải nghiệm sử dụng.
            </p>
            <p>
              Cookies được sử dụng rộng rãi trên internet và giúp các trang web hoạt động hiệu quả hơn. 
              Chúng tôi sử dụng các loại cookies khác nhau để phục vụ các mục đích khác nhau.
            </p>
          </div>

          <div className="cookies__section">
            <h2>Cách chúng tôi sử dụng cookies</h2>
            <div className="cookies__types">
              <div className="cookies__type">
                <h3>🔒 Cookies cần thiết</h3>
                <p>Cookies cần thiết cho hoạt động cơ bản của trang web:</p>
                <ul>
                  <li>Đăng nhập và xác thực người dùng</li>
                  <li>Giữ trạng thái giỏ hàng</li>
                  <li>Bảo mật và chống gian lận</li>
                  <li>Quản lý phiên làm việc</li>
                </ul>
                <p className="cookies__type-note">Không thể tắt</p>
              </div>

              <div className="cookies__type">
                <h3>⚙️ Cookies chức năng</h3>
                <p>Cookies giúp cá nhân hóa trải nghiệm:</p>
                <ul>
                  <li>Ghi nhớ ngôn ngữ và khu vực</li>
                  <li>Lưu tùy chọn người dùng</li>
                  <li>Tùy chỉnh giao diện</li>
                  <li>Ghi nhớ các lựa chọn đã thực hiện</li>
                </ul>
              </div>

              <div className="cookies__type">
                <h3>📊 Cookies phân tích</h3>
                <p>Cookies giúp chúng tôi hiểu cách bạn sử dụng trang web:</p>
                <ul>
                  <li>Thống kê lượng truy cập</li>
                  <li>Phân tích hành vi người dùng</li>
                  <li>Đo lường hiệu quả nội dung</li>
                  <li>Cải thiện thiết kế trang web</li>
                </ul>
              </div>

              <div className="cookies__type">
                <h3>📢 Cookies marketing</h3>
                <p>Cookies được sử dụng cho mục đích marketing:</p>
                <ul>
                  <li>Hiển thị quảng cáo phù hợp</li>
                  <li>Theo dõi hiệu quả chiến dịch</li>
                  <li>Đo lường chuyển đổi</li>
                  <li>Retargeting quảng cáo</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="cookies__section">
            <h2>Cookies của bên thứ ba</h2>
            <p>
              Chúng tôi sử dụng dịch vụ của các bên thứ ba có thể đặt cookies trên trình duyệt của bạn:
            </p>
            <div className="cookies__third-party">
              <div className="cookies__provider">
                <h3>Google Analytics</h3>
                <p>Phân tích lưu lượng truy cập và hành vi người dùng</p>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                  Chính sách bảo mật Google
                </a>
              </div>
              <div className="cookies__provider">
                <h3>Facebook/Meta</h3>
                <p>Quảng cáo và theo dõi hiệu quả marketing</p>
                <a href="https://www.facebook.com/policy.php" target="_blank" rel="noopener noreferrer">
                  Chính sách bảo mật Facebook
                </a>
              </div>
              <div className="cookies__provider">
                <h3>Google Ads</h3>
                <p>Hiển thị quảng cáo theo sở thích</p>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                  Chính sách bảo mật Google
                </a>
              </div>
            </div>
          </div>

          <div className="cookies__section">
            <h2>Thời gian lưu trữ cookies</h2>
            <div className="cookies__duration">
              <div className="cookies__duration-item">
                <h3>Cookies phiên</h3>
                <p>Bị xóa khi bạn đóng trình duyệt</p>
              </div>
              <div className="cookies__duration-item">
                <h3>Cookies cố định</h3>
                <p>Lưu trữ từ 30 ngày đến 1 năm</p>
              </div>
              <div className="cookies__duration-item">
                <h3>Cookies xác thực</h3>
                <p>Lưu trữ 24 giờ đến 30 ngày</p>
              </div>
            </div>
          </div>

          <div className="cookies__section">
            <h2>Quản lý cookies</h2>
            <p>
              Bạn có thể kiểm soát cookies theo nhiều cách khác nhau. 
              Dưới đây là các tùy chọn quản lý cookies của chúng tôi:
            </p>

            <div className="cookies__preferences">
              <h3>Tùy chọn cookie của bạn</h3>
              <div className="cookies__preference-list">
                <div className="cookies__preference">
                  <div className="cookies__preference-header">
                    <label className="cookies__preference-toggle">
                      <input
                        type="checkbox"
                        checked={cookiePreferences.necessary}
                        disabled
                      />
                      <span className="cookies__preference-slider"></span>
                    </label>
                    <div className="cookies__preference-info">
                      <h4>Cookies cần thiết</h4>
                      <p>Bắt buộc cho hoạt động của trang web</p>
                    </div>
                  </div>
                </div>

                <div className="cookies__preference">
                  <div className="cookies__preference-header">
                    <label className="cookies__preference-toggle">
                      <input
                        type="checkbox"
                        checked={cookiePreferences.functional}
                        onChange={() => handlePreferenceChange('functional')}
                      />
                      <span className="cookies__preference-slider"></span>
                    </label>
                    <div className="cookies__preference-info">
                      <h4>Cookies chức năng</h4>
                      <p>Cá nhân hóa trải nghiệm người dùng</p>
                    </div>
                  </div>
                </div>

                <div className="cookies__preference">
                  <div className="cookies__preference-header">
                    <label className="cookies__preference-toggle">
                      <input
                        type="checkbox"
                        checked={cookiePreferences.analytics}
                        onChange={() => handlePreferenceChange('analytics')}
                      />
                      <span className="cookies__preference-slider"></span>
                    </label>
                    <div className="cookies__preference-info">
                      <h4>Cookies phân tích</h4>
                      <p>Giúp chúng tôi cải thiện trang web</p>
                    </div>
                  </div>
                </div>

                <div className="cookies__preference">
                  <div className="cookies__preference-header">
                    <label className="cookies__preference-toggle">
                      <input
                        type="checkbox"
                        checked={cookiePreferences.marketing}
                        onChange={() => handlePreferenceChange('marketing')}
                      />
                      <span className="cookies__preference-slider"></span>
                    </label>
                    <div className="cookies__preference-info">
                      <h4>Cookies marketing</h4>
                      <p>Hiển thị quảng cáo phù hợp</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="cookies__preference-buttons">
                <button className="cookies__btn cookies__btn--accept" onClick={handleAcceptAll}>
                  Chấp nhận tất cả
                </button>
                <button className="cookies__btn cookies__btn--reject" onClick={handleRejectAll}>
                  Chỉ cần thiết
                </button>
                <button className="cookies__btn cookies__btn--save" onClick={handleSavePreferences}>
                  Lưu tùy chọn
                </button>
              </div>
            </div>
          </div>

          <div className="cookies__section">
            <h2>Quản lý cookies trong trình duyệt</h2>
            <p>
              Bạn cũng có thể quản lý cookies trực tiếp trong trình duyệt của mình:
            </p>
            <div className="cookies__browser-instructions">
              <div className="cookies__browser">
                <h3>Chrome</h3>
                <ol>
                  <li>Nhấp vào 3 chấm ở góc trên bên phải</li>
                  <li>Chọn "Cài đặt" → "Quyền riêng tư và bảo mật"</li>
                  <li>Chọn "Cookies và dữ liệu trang web"</li>
                  <li>Quản lý tùy chọn cookies</li>
                </ol>
              </div>
              <div className="cookies__browser">
                <h3>Firefox</h3>
                <ol>
                  <li>Nhấp vào 3 đường kẻ ở góc trên bên phải</li>
                  <li>Chọn "Cài đặt" → "Quyền riêng tư & bảo mật"</li>
                  <li>Chọn "Quản lý dữ liệu và cookie"</li>
                  <li>Quản lý tùy chọn cookies</li>
                </ol>
              </div>
              <div className="cookies__browser">
                <h3>Safari</h3>
                <ol>
                  <li>Chọn "Safari" → "Tùy chọn"</li>
                  <li>Chọn tab "Quyền riêng tư"</li>
                  <li>Nhấp vào "Quản lý dữ liệu trang web"</li>
                  <li>Quản lý tùy chọn cookies</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="cookies__section">
            <h2>Cập nhật chính sách</h2>
            <p>
              Chúng tôi có thể cập nhật chính sách cookie này theo thời gian để phản ánh các thay đổi 
              trong cách chúng tôi sử dụng cookies hoặc do yêu cầu pháp lý.
            </p>
            <p>
              Bất kỳ thay đổi nào sẽ được đăng trên trang này với ngày cập nhật mới. 
              Việc bạn tiếp tục sử dụng trang web sau khi có thay đổi có nghĩa là bạn chấp nhận chính sách mới.
            </p>
          </div>

          <div className="cookies__contact">
            <h2>Câu hỏi về cookies?</h2>
            <p>Nếu bạn có câu hỏi về cách chúng tôi sử dụng cookies, vui lòng liên hệ:</p>
            <div className="cookies__contact-info">
              <div className="cookies__contact-item">
                <strong>Email:</strong> privacy@fservice.com
              </div>
              <div className="cookies__contact-item">
                <strong>Hotline:</strong> 1900-1234
              </div>
              <div className="cookies__contact-item">
                <strong>Địa chỉ:</strong> 123 Nguyễn Huệ, Q.1, TP.HCM
              </div>
            </div>
          </div>
        </div>

        <div className="cookies__footer">
          <p>
            Chính sách cookie này có hiệu lực từ ngày 01/01/2024 và được cập nhật lần cuối vào ngày này.
          </p>
          <div className="cookies__footer-links">
            <Link to="/privacy">Chính sách bảo mật</Link>
            <Link to="/terms">Điều khoản sử dụng</Link>
            <Link to="/contact">Liên hệ</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cookies;
