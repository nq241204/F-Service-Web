import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './css/Help.css';

function Help() {
  const [activeCategory, setActiveCategory] = useState('general');
  const [expandedItem, setExpandedItem] = useState(null);

  const categories = [
    {
      id: 'general',
      name: 'Tổng quan',
      icon: '📚'
    },
    {
      id: 'account',
      name: 'Tài khoản',
      icon: '👤'
    },
    {
      id: 'services',
      name: 'Dịch vụ',
      icon: '🔧'
    },
    {
      id: 'payment',
      name: 'Thanh toán',
      icon: '💳'
    },
    {
      id: 'safety',
      name: 'An toàn & Bảo mật',
      icon: '🔒'
    }
  ];

  const helpItems = {
    general: [
      {
        question: 'F-Service là gì?',
        answer: 'F-Service là nền tảng dịch vụ ủy thác kết nối người dùng có nhu cầu với các thành viên ủy thác chuyên nghiệp và đã được xác thực.'
      },
      {
        question: 'Làm thế nào để bắt đầu sử dụng F-Service?',
        answer: 'Bạn có thể bắt đầu bằng cách đăng ký tài khoản, sau đó có thể tạo yêu cầu dịch vụ hoặc đăng ký trở thành thành viên ủy thac.'
      },
      {
        question: 'F-Service có miễn phí không?',
        answer: 'Việc đăng ký và sử dụng nền tảng F-Service hoàn toàn miễn phí. Chúng tôi chỉ thu phí khi giao dịch dịch vụ thành công.'
      }
    ],
    account: [
      {
        question: 'Làm thế nào để đăng ký tài khoản?',
        answer: 'Bạn có thể đăng ký tài khoản bằng cách nhấp vào nút "Đăng ký" trên trang chủ và điền thông tin cần thiết.'
      },
      {
        question: 'Làm thế nào để đặt lại mật khẩu?',
        answer: 'Bạn có thể đặt lại mật khẩu bằng cách nhấp vào "Quên mật khẩu" trên trang đăng nhập và làm theo hướng dẫn.'
      },
      {
        question: 'Làm thế nào để cập nhật thông tin cá nhân?',
        answer: 'Sau khi đăng nhập, bạn có thể vào trang "Hồ sơ" để cập nhật thông tin cá nhân của mình.'
      }
    ],
    services: [
      {
        question: 'Làm thế nào để tạo yêu cầu dịch vụ?',
        answer: 'Bạn có thể tạo yêu cầu dịch vụ bằng cách vào trang "Tạo yêu cầu", điền thông tin chi tiết và gửi yêu cầu của mình.'
      },
      {
        question: 'Làm thế nào để nhận dịch vụ?',
        answer: 'Nếu bạn là thành viên ủy thac đã được xác thực, bạn có thể xem danh sách dịch vụ và nhận các yêu cầu phù hợp với kỹ năng của mình.'
      },
      {
        question: 'Làm thế nào để theo dõi tiến độ dịch vụ?',
        answer: 'Bạn có thể theo dõi tiến độ dịch vụ trong trang "Dashboard" hoặc trang "Yêu cầu của tôi".'
      }
    ],
    payment: [
      {
        question: 'Các phương thức thanh toán nào được chấp nhận?',
        answer: 'Chúng tôi chấp nhận thanh toán qua ví điện tử F-Service, chuyển khoản ngân hàng và các phương thức thanh toán trực tuyến khác.'
      },
      {
        question: 'Tiền được giữ như thế nào?',
        answer: 'Tiền của bạn được giữ trong tài khoản ký quỹ an toàn và chỉ được giải ngân khi dịch vụ được hoàn thành và xác nhận.'
      },
      {
        question: 'Làm thế nào để yêu cầu hoàn tiền?',
        answer: 'Bạn có thể yêu cầu hoàn tiền nếu dịch vụ không được thực hiện đúng thỏa thuận. Vui lòng liên hệ với bộ phận hỗ trợ để được xử lý.'
      }
    ],
    safety: [
      {
        question: 'Thông tin của tôi có được bảo mật không?',
        answer: 'Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn theo chính sách bảo mật và các quy định pháp luật hiện hành.'
      },
      {
        question: 'Làm thế nào để nhận biết thành viên uy tín?',
        answer: 'Các thành viên đã được xác thực sẽ có huy hiệu "Đã xác thực" và điểm đánh giá từ các dịch vụ đã hoàn thành.'
      },
      {
        question: 'Phải làm gì khi có tranh chấp?',
        answer: 'Trong trường hợp có tranh chấp, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi để được giải quyết một cách công bằng.'
      }
    ]
  };

  const toggleItem = (index) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  return (
    <div className="help">
      <div className="help__container">
        <div className="help__header">
          <h1 className="help__title">Trung tâm trợ giúp</h1>
          <p className="help__subtitle">Tìm câu trả lời cho các câu hỏi thường gặp</p>
        </div>

        <div className="help__content">
          <div className="help__sidebar">
            <div className="help__categories">
              <h2>Danh mục trợ giúp</h2>
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`help__category ${activeCategory === category.id ? 'help__category--active' : ''}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <span className="help__category-icon">{category.icon}</span>
                  <span className="help__category-name">{category.name}</span>
                </button>
              ))}
            </div>

            <div className="help__contact">
              <h2>Cần thêm trợ giúp?</h2>
              <p>Nếu bạn không tìm thấy câu trả lời, hãy liên hệ với chúng tôi:</p>
              <div className="help__contact-info">
                <div className="help__contact-item">
                  <strong>Hotline:</strong> 1900-1234
                </div>
                <div className="help__contact-item">
                  <strong>Email:</strong> support@fservice.com
                </div>
                <div className="help__contact-item">
                  <strong>Chat:</strong> Có sẵn 24/7
                </div>
              </div>
              <Link to="/contact" className="help__contact-btn">
                Liên hệ hỗ trợ
              </Link>
            </div>
          </div>

          <div className="help__main">
            <div className="help__section">
              <h2>{categories.find(cat => cat.id === activeCategory)?.name}</h2>
              <div className="help__items">
                {helpItems[activeCategory].map((item, index) => (
                  <div
                    key={index}
                    className={`help__item ${expandedItem === index ? 'help__item--expanded' : ''}`}
                  >
                    <button
                      className="help__question"
                      onClick={() => toggleItem(index)}
                    >
                      <span className="help__question-text">{item.question}</span>
                      <span className={`help__question-icon ${expandedItem === index ? 'help__question-icon--rotated' : ''}`}>
                        ▼
                      </span>
                    </button>
                    <div className="help__answer">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="help__quick-links">
              <h2>Liên kết nhanh</h2>
              <div className="help__links-grid">
                <Link to="/services" className="help__link">
                  <span className="help__link-icon">🔧</span>
                  <span className="help__link-text">Dịch vụ</span>
                </Link>
                <Link to="/register-choice" className="help__link">
                  <span className="help__link-icon">👤</span>
                  <span className="help__link-text">Đăng ký</span>
                </Link>
                <Link to="/terms" className="help__link">
                  <span className="help__link-icon">📄</span>
                  <span className="help__link-text">Điều khoản</span>
                </Link>
                <Link to="/privacy" className="help__link">
                  <span className="help__link-icon">🔒</span>
                  <span className="help__link-text">Bảo mật</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Help;
