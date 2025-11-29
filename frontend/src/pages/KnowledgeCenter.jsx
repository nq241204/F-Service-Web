// frontend/src/pages/KnowledgeCenter.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './css/KnowledgeCenter.css';

const KnowledgeCenter = () => {
  const [activeTab, setActiveTab] = useState('guide');
  const location = useLocation();

  useEffect(() => {
    // Get tab from URL query parameter
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['guide', 'terms', 'faq'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const tabs = [
    { id: 'guide', label: 'Hướng dẫn sử dụng', icon: '📖' },
    { id: 'terms', label: 'Quy định & Điều khoản', icon: '📋' },
    { id: 'faq', label: 'Câu hỏi thường gặp', icon: '❓' },
  ];

  const content = {
    guide: {
      title: 'Hướng dẫn sử dụng hệ thống F-Service',
      sections: [
        {
          title: '🚀 Bắt đầu nhanh',
          content: [
            '1. Đăng ký tài khoản và xác thực email',
            '2. Nạp tiền vào ví để sử dụng dịch vụ',
            '3. Tạo yêu cầu dịch vụ đầu tiên',
            '4. Theo dõi tiến độ và đánh giá khi hoàn thành'
          ]
        },
        {
          title: '📝 Tạo yêu cầu dịch vụ',
          content: [
            '1. Chọn "Tạo yêu cầu" từ menu hoặc Dashboard',
            '2. Điền thông tin chi tiết về dịch vụ cần yêu cầu',
            '3. Chọn mức giá phù hợp và thời gian mong muốn',
            '4. Xác nhận và chờ admin duyệt yêu cầu'
          ]
        },
        {
          title: '💳 Quản lý ví giao dịch',
          content: [
            '1. Nạp tiền qua chuyển khoản hoặc QR code',
            '2. Kiểm tra số dư và lịch sử giao dịch',
            '3. Rút tiền khi cần thiết',
            '4. Xem báo cáo chi tiết các giao dịch'
          ]
        },
        {
          title: '📊 Theo dõi yêu cầu',
          content: [
            '1. Xem danh sách yêu cầu trong "Yêu cầu của tôi"',
            '2. Theo dõi tiến độ thực hiện',
            '3. Liên hệ với thành viên thực hiện',
            '4. Đánh giá chất lượng dịch vụ khi hoàn thành'
          ]
        }
      ]
    },
    terms: {
      title: 'Quy định và Điều khoản sử dụng',
      sections: [
        {
          title: '📜 Điều khoản chung',
          content: [
            'F-Service là nền tảng kết nối người dùng với thành viên ủy thác',
            'Người dùng phải đủ 18 tuổi để sử dụng dịch vụ',
            'Mọi thông tin cung cấp phải chính xác và hợp lệ',
            'Vi phạm các điều khoản có thể dẫn đến khóa tài khoản'
          ]
        },
        {
          title: '💰 Quy định về thanh toán',
          content: [
            'Tất cả giao dịch được thực hiện qua hệ thống ví',
            'Phí dịch vụ sẽ được thông báo rõ trước khi xác nhận',
            'Hoàn tiền theo chính sách của từng dịch vụ cụ thể',
            'Các giao dịch được ghi nhận và có thể truy xuất'
          ]
        },
        {
          title: '🔒 Bảo mật và quyền riêng tư',
          content: [
            'Thông tin cá nhân được bảo mật theo tiêu chuẩn',
            'Không chia sẻ thông tin cho bên thứ ba',
            'Người dùng có quyền kiểm soát dữ liệu của mình',
            'Hệ thống sử dụng mã hóa end-to-end'
          ]
        },
        {
          title: '⚖️ Giải quyết tranh chấp',
          content: [
            'Tranh chấp sẽ được giải quyết qua hệ thống mediation',
            'Admin có quyền quyết định cuối cùng',
            'Cần cung cấp bằng chứng khi khiếu nại',
            'Thời gian giải quyết tối đa 7 ngày làm việc'
          ]
        }
      ]
    },
    faq: {
      title: 'Câu hỏi thường gặp',
      sections: [
        {
          title: '❓ Làm thế nào để tạo yêu cầu?',
          content: [
            'Vào Dashboard → Tạo yêu cầu mới',
            'Điền đầy đủ thông tin yêu cầu',
            'Chọn mức giá và thời gian',
            'Xác nhận và chờ duyệt'
          ]
        },
        {
          title: '💳 Các phương thức nạp tiền nào?',
          content: [
            'Chuyển khoản ngân hàng',
            'Quét mã QR',
            'Ví điện tử (đang phát triển)',
            'Thẻ tín dụng (sắp ra mắt)'
          ]
        },
        {
          title: '⏰ Yêu cầu mất bao lâu để hoàn thành?',
          content: [
            'Thời gian phụ thuộc vào loại dịch vụ',
            'Thông thường 1-3 ngày làm việc',
            'Dịch vụ khẩn cấp có thể hoàn thành trong vài giờ',
            'Bạn có thể theo dõi tiến độ real-time'
          ]
        },
        {
          title: '🔄 Chính sách hoàn tiền?',
          content: [
            'Hoàn tiền 100% nếu chưa có thành viên nhận',
            'Hoàn 50% nếu thành viên đã bắt đầu làm việc',
            'Không hoàn tiền sau khi dịch vụ hoàn thành',
            'Trường hợp đặc biệt sẽ được xem xét riêng'
          ]
        },
        {
          title: '👤 Làm thế nào trở thành thành viên ủy thác?',
          content: [
            'Đăng ký tài khoản thành viên',
            'Cung cấp thông tin xác thực',
            'Đạt yêu cầu về kỹ năng và kinh nghiệm',
            'Phê duyệt từ admin hệ thống'
          ]
        },
        {
          title: '📞 Liên hệ hỗ trợ?',
          content: [
            'Email: support@f-service.com',
            'Hotline: 1900-xxxx (24/7)',
            'Live chat trên website',
            'Messenger: m.me/f-service'
          ]
        }
      ]
    }
  };

  const currentContent = content[activeTab];

  return (
    <div className="knowledge-center">
      <div className="knowledge-center__container">
        {/* Header */}
        <div className="knowledge-center__header">
          <Link to="/dashboard" className="knowledge-center__back">
            ← Quay lại Dashboard
          </Link>
          <h1>Trung tâm kiến thức</h1>
          <p>Tìm hiểu cách sử dụng F-Service hiệu quả</p>
        </div>

        {/* Tabs */}
        <div className="knowledge-center__tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`knowledge-center__tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="knowledge-center__tab-icon">{tab.icon}</span>
              <span className="knowledge-center__tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="knowledge-center__content">
          <h2>{currentContent.title}</h2>
          
          <div className="knowledge-center__sections">
            {currentContent.sections.map((section, index) => (
              <div key={index} className="knowledge-center__section">
                <h3>{section.title}</h3>
                <ul>
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="knowledge-center__quick-links">
          <h3>Liên kết nhanh</h3>
          <div className="knowledge-center__links-grid">
            <Link to="/requests/new" className="knowledge-center__quick-link">
              ➕ Tạo yêu cầu mới
            </Link>
            <Link to="/my-requests" className="knowledge-center__quick-link">
              📋 Yêu cầu của tôi
            </Link>
            <Link to="/wallet" className="knowledge-center__quick-link">
              💳 Quản lý ví
            </Link>
            <Link to="/profile" className="knowledge-center__quick-link">
              👤 Cập nhật hồ sơ
            </Link>
          </div>
        </div>

        {/* Contact Support */}
        <div className="knowledge-center__support">
          <h3>Cần hỗ trợ thêm?</h3>
          <p>Nếu bạn không tìm thấy câu trả lời, hãy liên hệ với đội ngũ hỗ trợ của chúng tôi.</p>
          <div className="knowledge-center__contact-methods">
            <a href="mailto:support@f-service.com" className="knowledge-center__contact-link">
              📧 support@f-service.com
            </a>
            <a href="tel:1900xxxx" className="knowledge-center__contact-link">
              📞 1900-xxxx (24/7)
            </a>
            <a href="#" className="knowledge-center__contact-link">
              💬 Live Chat
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeCenter;
