import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './css/FAQ.css';

function FAQ() {
  const [activeCategory, setActiveCategory] = useState('general');
  const [expandedItems, setExpandedItems] = useState(new Set());

  const categories = [
    { id: 'general', name: 'Câu hỏi chung', icon: '❓' },
    { id: 'account', name: 'Tài khoản', icon: '👤' },
    { id: 'services', name: 'Dịch vụ', icon: '🔧' },
    { id: 'payment', name: 'Thanh toán', icon: '💳' },
    { id: 'disputes', name: 'Tranh chấp', icon: '⚖️' },
    { id: 'technical', name: 'Kỹ thuật', icon: '💻' }
  ];

  const faqData = {
    general: [
      {
        question: 'F-Service là gì?',
        answer: 'F-Service là nền tảng dịch vụ ủy thác kết nối người dùng có nhu cầu với các thành viên ủy thác chuyên nghiệp và đã được xác thực.'
      },
      {
        question: 'F-Service có miễn phí không?',
        answer: 'Việc đăng ký và sử dụng nền tảng F-Service hoàn toàn miễn phí. Chúng tôi chỉ thu phí 5% khi giao dịch dịch vụ thành công.'
      },
      {
        question: 'Làm thế nào để bắt đầu sử dụng F-Service?',
        answer: 'Bạn có thể bắt đầu bằng cách đăng ký tài khoản, sau đó có thể tạo yêu cầu dịch vụ hoặc đăng ký trở thành thành viên ủy thac.'
      },
      {
        question: 'F-Service hoạt động ở những khu vực nào?',
        answer: 'Hiện tại F-Service hoạt động trên toàn lãnh thổ Việt Nam. Chúng tôi đang mở rộng ra các tỉnh thành khác.'
      }
    ],
    account: [
      {
        question: 'Làm thế nào để đăng ký tài khoản?',
        answer: 'Bạn có thể đăng ký tài khoản bằng cách nhấp vào nút "Đăng ký" trên trang chủ, điền thông tin cần thiết và xác nhận email.'
      },
      {
        question: 'Làm thế nào để xác thực tài khoản?',
        answer: 'Sau khi đăng ký, bạn cần cung cấp thông tin CMND/CCCD và các giấy tờ liên quan để xác thực danh tính. Quá trình này thường mất 1-2 ngày làm việc.'
      },
      {
        question: 'Làm thế nào để đặt lại mật khẩu?',
        answer: 'Bạn có thể đặt lại mật khẩu bằng cách nhấp vào "Quên mật khẩu" trên trang đăng nhập, nhập email và làm theo hướng dẫn.'
      },
      {
        question: 'Tôi có thể thay đổi thông tin cá nhân không?',
        answer: 'Có. Sau khi đăng nhập, bạn có thể vào trang "Hồ sơ" để cập nhật thông tin cá nhân của mình.'
      },
      {
        question: 'Làm thế nào để xóa tài khoản?',
        answer: 'Bạn có thể yêu cầu xóa tài khoản trong phần Cài đặt tài khoản. Lưu ý rằng việc xóa tài khoản sẽ không thể hoàn tác.'
      }
    ],
    services: [
      {
        question: 'Làm thế nào để tạo yêu cầu dịch vụ?',
        answer: 'Bạn có thể tạo yêu cầu dịch vụ bằng cách vào trang "Tạo yêu cầu", điền thông tin chi tiết về dịch vụ cần thực hiện và gửi yêu cầu.'
      },
      {
        question: 'Làm thế nào để nhận dịch vụ?',
        answer: 'Nếu bạn là thành viên ủy thac đã được xác thực, bạn có thể xem danh sách dịch vụ và nhận các yêu cầu phù hợp với kỹ năng của mình.'
      },
      {
        question: 'Làm thế nào để biết thành viên có uy tín không?',
        answer: 'Bạn có thể kiểm tra hồ sơ thành viên, xem điểm đánh giá, số lượng dịch vụ đã hoàn thành và các nhận xét từ khách hàng trước.'
      },
      {
        question: 'Tôi có thể hủy yêu cầu dịch vụ không?',
        answer: 'Bạn có thể hủy yêu cầu trước khi có thành viên nhận. Nếu đã có thành viên nhận, bạn cần thương lượng với thành viên đó.'
      },
      {
        question: 'Thời gian hoàn thành dịch vụ là bao lâu?',
        answer: 'Thời gian hoàn thành phụ thuộc vào loại dịch vụ và thỏa thuận giữa bạn và thành viên. Thông thường được ghi rõ trong yêu cầu dịch vụ.'
      }
    ],
    payment: [
      {
        question: 'Các phương thức thanh toán nào được chấp nhận?',
        answer: 'Chúng tôi chấp nhận thanh toán qua ví điện tử F-Service, chuyển khoản ngân hàng, thẻ tín dụng/ghi nợ và các ví điện tử phổ biến khác.'
      },
      {
        question: 'Tiền của tôi được giữ như thế nào?',
        answer: 'Tiền được giữ trong tài khoản ký quỹ an toàn và chỉ được giải ngân khi dịch vụ được hoàn thành và được cả hai bên xác nhận.'
      },
      {
        question: 'Khi nào tôi phải thanh toán?',
        answer: 'Bạn cần thanh toán ngay khi tạo yêu cầu dịch vụ. Tiền sẽ được giữ trong ký quỹ cho đến khi dịch vụ hoàn thành.'
      },
      {
        question: 'Làm thế nào để yêu cầu hoàn tiền?',
        answer: 'Bạn có thể yêu cầu hoàn tiền nếu dịch vụ không được thực hiện đúng thỏa thuận. Vui lòng liên hệ với bộ phận hỗ trợ để được xử lý.'
      },
      {
        question: 'Phí dịch vụ là bao nhiêu?',
        answer: 'Chúng tôi thu phí 5% giá trị giao dịch khi dịch vụ thành công. Phí này được trừ trực tiếp từ số tiền thanh toán cho thành viên.'
      }
    ],
    disputes: [
      {
        question: 'Phải làm gì khi có tranh chấp?',
        answer: 'Trong trường hợp có tranh chấp, bạn nên đầu tiên liên hệ trực tiếp với bên kia. Nếu không giải quyết được, hãy liên hệ với bộ phận hỗ trợ của F-Service.'
      },
      {
        question: 'F-Service giải quyết tranh chấp như thế nào?',
        answer: 'Chúng tôi sẽ xem xét bằng chứng từ cả hai bên, điều tra các thông tin liên quan và đưa ra quyết định công bằng dựa trên điều khoản dịch vụ.'
      },
      {
        question: 'Thời gian giải quyết tranh chấp là bao lâu?',
        answer: 'Thời gian giải quyết tranh chấp thường từ 5-10 ngày làm việc, tùy thuộc vào độ phức tạp của vụ việc.'
      },
      {
        question: 'Tôi cần cung cấp những bằng chứng gì?',
        answer: 'Bạn cần cung cấp lịch sử trò chuyện, hình ảnh, video, email và bất kỳ bằng chứng nào liên quan đến dịch vụ.'
      }
    ],
    technical: [
      {
        question: 'Tại sao tôi không thể đăng nhập?',
        answer: 'Vui lòng kiểm tra lại email và mật khẩu. Nếu vẫn không được, thử đặt lại mật khẩu. Nếu vấn đề tiếp tục, liên hệ hỗ trợ kỹ thuật.'
      },
      {
        question: 'Tại sao trang web tải chậm?',
        answer: 'Vui lòng kiểm tra kết nối internet, xóa cache trình duyệt, hoặc thử sử dụng trình duyệt khác. Nếu vẫn còn vấn đề, báo lỗi cho chúng tôi.'
      },
      {
        question: 'Ứng dụng di động có sẵn không?',
        answer: 'Hiện tại chúng tôi đang phát triển ứng dụng di động. Bạn có thể sử dụng phiên bản web trên điện thoại.'
      },
      {
        question: 'Làm thế nào để báo lỗi kỹ thuật?',
        answer: 'Bạn có thể báo lỗi qua email support@fservice.com hoặc sử dụng form liên hệ trên website.'
      }
    ]
  };

  const toggleItem = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="faq">
      <div className="faq__container">
        <div className="faq__header">
          <h1 className="faq__title">Câu hỏi thường gặp</h1>
          <p className="faq__subtitle">Tìm câu trả lời cho các câu hỏi phổ biến về F-Service</p>
        </div>

        <div className="faq__search">
          <input 
            type="text" 
            placeholder="Tìm câu hỏi của bạn..." 
            className="faq__search-input"
          />
          <button className="faq__search-btn">🔍 Tìm kiếm</button>
        </div>

        <div className="faq__content">
          <div className="faq__sidebar">
            <div className="faq__categories">
              <h3>Danh mục</h3>
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`faq__category ${activeCategory === category.id ? 'faq__category--active' : ''}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <span className="faq__category-icon">{category.icon}</span>
                  <span className="faq__category-name">{category.name}</span>
                </button>
              ))}
            </div>

            <div className="faq__contact">
              <h3>Không tìm thấy câu trả lời?</h3>
              <p>Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ</p>
              <div className="faq__contact-options">
                <Link to="/contact" className="faq__contact-btn">
                  💬 Liên hệ hỗ trợ
                </Link>
                <a href="tel:1900-1234" className="faq__contact-phone">
                  📞 1900-1234
                </a>
              </div>
            </div>
          </div>

          <div className="faq__main">
            <div className="faq__section">
              <h2>{categories.find(cat => cat.id === activeCategory)?.name}</h2>
              <div className="faq__items">
                {faqData[activeCategory].map((item, index) => (
                  <div
                    key={index}
                    className={`faq__item ${expandedItems.has(index) ? 'faq__item--expanded' : ''}`}
                  >
                    <button
                      className="faq__question"
                      onClick={() => toggleItem(index)}
                    >
                      <span className="faq__question-text">{item.question}</span>
                      <span className={`faq__question-icon ${expandedItems.has(index) ? 'faq__question-icon--rotated' : ''}`}>
                        ▼
                      </span>
                    </button>
                    <div className="faq__answer">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="faq__helpful">
              <h3>Bài viết này có hữu ích không?</h3>
              <div className="faq__helpful-buttons">
                <button className="faq__helpful-btn">👍 Có</button>
                <button className="faq__helpful-btn">👎 Không</button>
              </div>
            </div>
          </div>
        </div>

        <div className="faq__related">
          <h2>Bài viết liên quan</h2>
          <div className="faq__related-links">
            <Link to="/help" className="faq__related-link">
              📚 Trung tâm trợ giúp
            </Link>
            <Link to="/blog" className="faq__related-link">
              📝 Blog và hướng dẫn
            </Link>
            <Link to="/contact" className="faq__related-link">
              💬 Liên hệ hỗ trợ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FAQ;
