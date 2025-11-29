// frontend/src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { getErrorMessage } from '../utils/validationHelper';
import './css/Register.css';

const serviceHighlights = [
  'Đăng yêu cầu dịch vụ nhanh chóng trong 2 phút, hệ thống AI tự động phân loại.',
  'Kết nối với thành viên ủy thac đã được xác thực và đánh giá bởi cộng đồng.',
  'Thanh toán an toàn qua ví F-Service, chỉ giải ngân khi dịch vụ hoàn thành.',
];

const serviceCategories = [
  'Gia sư các môn học, hỗ trợ bài tập về nhà, luyện thi.',
  'Sửa chữa điện tử, điện lạnh, thiết bị gia dụng.',
  'Giao hàng, chuyển phát, hỗ trợ logistics.',
  'Chăm sóc khách hàng, telesales, hỗ trợ online.',
  'Dọn dẹp nhà cửa, vệ sinh công nghiệp.',
  'Nấu ăn, tổ chức sự kiện, phục vụ.',
  'Chụp ảnh, thiết kế, viết nội dung.',
];

const benefits = [
  {
    icon: '🚀',
    title: 'Nhanh chóng',
    description: 'Đăng yêu cầu và nhận phản hồi trong vòng vài phút',
  },
  {
    icon: '🔒',
    title: 'An toàn',
    description: 'Thanh toán bảo mật, chỉ trả tiền khi hài lòng',
  },
  {
    icon: '⭐',
    title: 'Chất lượng',
    description: 'Thành viên được đánh giá và kiểm duyệt kỹ lưỡng',
  },
  {
    icon: '💬',
    title: 'Hỗ trợ 24/7',
    description: 'Đội ngũ CSKH luôn sẵn sàng giải quyết thắc mắc',
  },
];

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.password2) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password2: formData.password2,
      });

      if (result.success) {
        setSuccess('Đăng ký thành công! Vui lòng đăng nhập...');
        // Redirect to login page instead of dashboard
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        // Sử dụng validation helper để lấy thông báo lỗi rõ ràng
        const errorMessage = getErrorMessage({ response: { data: result, status: 400 } });
        setError(errorMessage);
      }
    } catch (err) {
      console.log('❌ Register error:', err);
      console.log('❌ Error response:', err.response?.data);
      
      // Sử dụng validation helper để lấy thông báo lỗi rõ ràng
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register app-main__centered">
      <section className="register__hero">
        <div className="register__intro">
          <span className="register__badge">Đăng ký người dùng F-Service</span>
          <h1>
            Tìm kiếm dịch vụ uy tín,
            <span> kết nối với chuyên gia trong vài phút</span>
          </h1>
          <p>
            Nền tảng kết nối người cần dịch vụ với thành viên ủy thac đã được xác thực. Đăng yêu cầu,
            theo dõi tiến độ và thanh toán an toàn chỉ sau khi hoàn thành.
          </p>
          <ul className="register__highlight-list">
            {serviceHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="register__form-card">
          <h2>Đăng ký tài khoản</h2>
          <p className="register__form-subtitle">
            Bạn đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>

          {error && (
            <div className="register__alert register__alert--error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="register__alert register__alert--success" role="alert">
              {success}
            </div>
          )}

          <form className="register__form" onSubmit={handleSubmit}>
            <div className="register__field">
              <label htmlFor="name">Họ và tên</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ví dụ: Trần Văn A"
                required
              />
            </div>
            <div className="register__field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="register__field">
              <label htmlFor="password">Mật khẩu</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Tối thiểu 6 ký tự"
                minLength={6}
                required
              />
            </div>
            <div className="register__field">
              <label htmlFor="password2">Xác nhận mật khẩu</label>
              <input
                id="password2"
                type="password"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu"
                minLength={6}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary register__submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
            </button>
            <p className="register__terms">
              Bằng việc đăng ký, bạn đồng ý với <Link to="/terms">Điều khoản dịch vụ</Link> và{' '}
              <Link to="/privacy">Chính sách bảo mật</Link> của F-Service.
            </p>
          </form>
        </div>
      </section>

      <section className="register__section">
        <div className="register__section-header">
          <h2 className="section-title">Dịch vụ phổ biến</h2>
          <p className="section-subtitle">
            Khám phá các dịch vụ được yêu thích nhất trên nền tảng của chúng tôi
          </p>
        </div>
        <div className="register__categories">
          {serviceCategories.map((category, index) => (
            <div key={index} className="register__category-item">
              <span className="register__category-icon">✓</span>
              <span>{category}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="register__section">
        <div className="register__section-header">
          <h2 className="section-title">Tại sao chọn F-Service?</h2>
          <p className="section-subtitle">
            Chúng tôi cam kết mang lại trải nghiệm dịch vụ tốt nhất cho bạn
          </p>
        </div>
        <div className="register__benefits">
          {benefits.map((benefit, index) => (
            <article key={index} className="register__benefit-card">
              <span className="register__benefit-icon">{benefit.icon}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="register__section">
        <div className="register__section-header">
          <h2 className="section-title">Bạn là thành viên ủy thác?</h2>
          <p className="section-subtitle">
            Đăng ký trở thành thành viên để nhận yêu cầu dịch vụ và tạo thu nhập
          </p>
        </div>
        <div className="register__member-cta">
          <p>
            Nếu bạn muốn cung cấp dịch vụ và tham gia mạng lưới ủy thac của chúng tôi,
            hãy đăng ký thành viên để nhận các quyền lợi đặc biệt.
          </p>
          <Link to="/member/register" className="btn btn-outline">
            Đăng ký thành viên ủy thac
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Register;

