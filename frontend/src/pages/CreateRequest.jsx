// frontend/src/pages/CreateRequest.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { serviceRequestService } from '../services/serviceRequestService';
import { walletService } from '../services/walletService';
import './css/CreateRequest.css';

// Helper function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount || 0);
};

const serviceTypes = [
  { value: 'tutoring', label: 'Gia sư' },
  { value: 'repair', label: 'Sửa chữa thiết bị' },
  { value: 'delivery', label: 'Giao hàng' },
  { value: 'cleaning', label: 'Vệ sinh' },
  { value: 'cooking', label: 'Nấu ăn' },
  { value: 'care', label: 'Chăm sóc' },
  { value: 'design', label: 'Thiết kế' },
  { value: 'photography', label: 'Thư viện ảnh' },
  { value: 'writing', label: 'Viết' },
  { value: 'music', label: ' Âm nhạc' },
  { value: 'other', label: 'Khác' },

];

function CreateRequest({ user }) {
  const navigate = useNavigate();
  const alertRef = useRef(null); // Thêm ref để scroll đến alert
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableServices, setAvailableServices] = useState([]);
  const [showServiceList, setShowServiceList] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [userBalance, setUserBalance] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    address: '',
    expectedDate: '',
    serviceType: 'other',
    isNewService: false,
    suggestion: '',
    customServiceType: '', // Thêm trường cho lĩnh vực tùy chỉnh
    contactPhone: '', // Thêm trường cho số điện thoại liên lạc
    contactEmail: '', // Thêm trường cho email liên lạc
    contactMethod: 'phone', // Thêm trường cho phương thức liên lạc ưu tiên
  });

  // Set minimum date to current time
  useEffect(() => {
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    
    setFormData(prev => ({
      ...prev,
      expectedDate: localDateTime
    }));
  }, []);

  useEffect(() => {
    loadAvailableServices();
    loadUserBalance();
  }, []);

  const loadUserBalance = async () => {
    try {
      const result = await walletService.getBalance();
      if (result.success) {
        setUserBalance(result.data.balance || 0);
      }
    } catch (err) {
      console.error('Error loading balance:', err);
    }
  };

  const loadAvailableServices = async () => {
    try {
      console.log('Loading available services...');
      const result = await serviceRequestService.getAvailableServices();
      console.log('Services result:', result);
      if (result.success) {
        console.log('Setting available services:', result.data);
        setAvailableServices(result.data || []);
      }
    } catch (err) {
      console.error('Error loading services:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Validate expectedDate
    if (name === 'expectedDate') {
      const selectedDate = new Date(value);
      const now = new Date();
      
      if (selectedDate <= now) {
        setError('Thời gian mong muốn phải lớn hơn thời gian hiện tại');
        return;
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error when user corrects the date
    if (name === 'expectedDate' && error) {
      setError('');
    }
  };

  const handleSelectService = (service) => {
    setSelectedService(service);
    setFormData((prev) => ({
      ...prev,
      title: service.TenDichVu || service.title || '',
      description: service.MoTa || service.description || '',
      price: service.Gia || service.GiaAI || service.price || '',
      serviceType: service.LoaiDichVu || service.serviceType || 'other',
      isNewService: false,
    }));
    setShowServiceList(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Scroll to top to show error message if any
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Validation
    if (!formData.title.trim()) {
      setError('Vui lòng nhập tiêu đề dịch vụ');
      setLoading(false);
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!formData.description.trim()) {
      setError('Vui lòng nhập mô tả chi tiết');
      setLoading(false);
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate custom service type when "Khác" is selected
    if (formData.serviceType === 'other' && !formData.customServiceType.trim()) {
      setError('Vui lòng mô tả lĩnh vực dịch vụ của bạn khi chọn "Khác"');
      setLoading(false);
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate contact information
    if (!formData.contactPhone.trim() && !formData.contactEmail.trim()) {
      setError('Vui lòng cung cấp ít nhất một thông tin liên lạc (số điện thoại hoặc email)');
      setLoading(false);
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate phone number format if provided
    if (formData.contactPhone.trim()) {
      const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
      if (!phoneRegex.test(formData.contactPhone.trim())) {
        setError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam hợp lệ (ví dụ: 0912345678 hoặc 84912345678)');
        setLoading(false);
        // Scroll to top to show error message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Validate email format if provided
    if (formData.contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contactEmail.trim())) {
        setError('Email không hợp lệ. Vui lòng nhập email đúng định dạng (ví dụ: ten@email.com)');
        setLoading(false);
        // Scroll to top to show error message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Vui lòng nhập giá dịch vụ hợp lệ');
      setLoading(false);
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate price against user balance
    const price = parseFloat(formData.price);
    if (price > userBalance) {
      setError(`Giá dịch vụ (${formatCurrency(price)}) không thể lớn hơn số dư ví (${formatCurrency(userBalance)})`);
      setLoading(false);
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate expectedDate
    if (!formData.expectedDate) {
      setError('Vui lòng chọn thời gian mong muốn');
      setLoading(false);
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const selectedDate = new Date(formData.expectedDate);
    const now = new Date();
    
    if (selectedDate <= now) {
      setError('Thời gian mong muốn phải lớn hơn thời gian hiện tại');
      setLoading(false);
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const result = await serviceRequestService.createRequest({
        ...formData,
        price: parseFloat(formData.price),
      });

      if (result.success) {
        setSuccess(result.message || 'Tạo yêu cầu thành công!');
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(
          result.message ||
            result.errors?.map((e) => e.msg || e.message).join(', ') ||
            'Tạo yêu cầu thất bại'
        );
        // Scroll to top to show error message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.map((e) => e.msg || e.message).join(', ') ||
          'Lỗi khi tạo yêu cầu. Vui lòng thử lại.'
      );
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-request app-main__centered">
      <div className="create-request__header">
        <Link to="/dashboard" className="create-request__back">
          ← Quay lại Dashboard
        </Link>
        <h1>Tạo yêu cầu dịch vụ</h1>
        <p>
          Mô tả chi tiết nhu cầu của bạn. Hệ thống sẽ gửi thông báo cho các thành viên phù hợp
          và bạn có thể chọn người ủy thác mong muốn.
        </p>
      </div>

      {error && (
        <div className="create-request__alert create-request__alert--error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="create-request__alert create-request__alert--success" role="alert">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-request__form">
        {/* Chọn dịch vụ có sẵn hoặc tạo mới */}
        <div className="create-request__section">
          <div className="create-request__section-header">
            <h2>Loại dịch vụ</h2>
            <p>Chọn dịch vụ có sẵn hoặc tạo yêu cầu mới</p>
          </div>

          <div className="create-request__service-selector">
            <button
              type="button"
              onClick={() => setShowServiceList(!showServiceList)}
              className="create-request__toggle-btn"
            >
              {selectedService
                ? `Đã chọn: ${selectedService.TenDichVu || selectedService.title}`
                : 'Chọn dịch vụ có sẵn'}
            </button>

            {showServiceList && availableServices.length > 0 && (
              <div className="create-request__service-list">
                {availableServices.map((service) => (
                  <div
                    key={service._id}
                    onClick={() => handleSelectService(service)}
                    className="create-request__service-item"
                  >
                    <h3>{service.TenDichVu || service.title}</h3>
                    <p>{service.MoTa || service.description || 'Không có mô tả'}</p>
                    <span className="create-request__service-price">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(service.Gia || service.GiaAI || service.price || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {availableServices.length === 0 && showServiceList && (
              <p className="create-request__empty">Chưa có dịch vụ nào có sẵn</p>
            )}

            <div className="create-request__divider">
              <span>hoặc</span>
            </div>

            <label className="create-request__checkbox">
              <input
                type="checkbox"
                name="isNewService"
                checked={formData.isNewService}
                onChange={handleChange}
              />
              <span>Tạo yêu cầu dịch vụ mới (hệ thống chưa có)</span>
            </label>
          </div>
        </div>

        {/* Thông tin cơ bản */}
        <div className="create-request__section">
          <div className="create-request__section-header">
            <h2>Thông tin dịch vụ</h2>
            <p>Mô tả chi tiết yêu cầu của bạn</p>
          </div>

          <div className="create-request__field">
            <label htmlFor="title">
              Tiêu đề dịch vụ <span className="required">*</span>
            </label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ví dụ: Cần gia sư Toán lớp 9"
              required
            />
          </div>

          <div className="create-request__field">
            <label htmlFor="description">
              Mô tả chi tiết <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả chi tiết yêu cầu, thời gian, địa điểm, yêu cầu đặc biệt..."
              rows="6"
              required
            />
          </div>

          <div className="create-request__field-row">
            <div className="create-request__field">
              <label htmlFor="serviceType">Lĩnh vực dịch vụ</label>
              <select
                id="serviceType"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
              >
                {serviceTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {/* Hiển thị form nhập liệu khi chọn "Khác" */}
              {formData.serviceType === 'other' && (
                <div className="create-request__custom-service">
                  <label htmlFor="customServiceType">
                    Vui lòng mô tả lĩnh vực dịch vụ của bạn <span className="required">*</span>
                  </label>
                  <input
                    id="customServiceType"
                    type="text"
                    name="customServiceType"
                    value={formData.customServiceType}
                    onChange={handleChange}
                    placeholder="Ví dụ: Sửa chữa ô tô, Tư vấn pháp lý, Chăm sóc thú cưng..."
                    required={formData.serviceType === 'other'}
                  />
                  <small>Mô tả chi tiết về lĩnh vực dịch vụ bạn cần để chúng tôi tìm thành viên phù hợp nhất</small>
                </div>
              )}
            </div>

            <div className="create-request__field">
              <label htmlFor="price">
                Giá dịch vụ (VND) <span className="required">*</span>
              </label>
              <input
                id="price"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Nhập số tiền"
                min="0"
                step="1000"
                required
              />
              <small>
                Số dư khả dụng: <strong>{formatCurrency(userBalance)}</strong>
              </small>
              {error && error.includes('lớn hơn số dư') && (
                <div className="create-request__field-error">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thông tin liên lạc */}
        <div className="create-request__section">
          <div className="create-request__section-header">
            <h2>Thông tin liên lạc</h2>
            <p>Cung cấp thông tin để thành viên có thể liên hệ với bạn nhanh chóng</p>
          </div>

          <div className="create-request__field">
            <label htmlFor="contactMethod">Phương thức liên lạc ưu tiên</label>
            <select
              id="contactMethod"
              name="contactMethod"
              value={formData.contactMethod}
              onChange={handleChange}
            >
              <option value="phone">Điện thoại</option>
              <option value="email">Email</option>
              <option value="both">Cả hai</option>
            </select>
            <small>Chọn phương thức thành viên nên sử dụng để liên hệ với bạn</small>
          </div>

          <div className="create-request__field-row">
            <div className="create-request__field">
              <label htmlFor="contactPhone">
                Số điện thoại <span className={formData.contactMethod === 'email' ? '' : 'required'}>*</span>
              </label>
              <input
                id="contactPhone"
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="Ví dụ: 0912345678"
                required={formData.contactMethod !== 'email'}
              />
              <small>Số điện thoại Việt Nam (bắt đầu bằng 0xxx hoặc 84xxx)</small>
            </div>

            <div className="create-request__field">
              <label htmlFor="contactEmail">
                Email <span className={formData.contactMethod === 'phone' ? '' : 'required'}>*</span>
              </label>
              <input
                id="contactEmail"
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="Ví dụ: ten@email.com"
                required={formData.contactMethod !== 'phone'}
              />
              <small>Email để chúng tôi gửi xác nhận và thông báo</small>
            </div>
          </div>
        </div>

        {/* Địa chỉ và thời gian */}
        <div className="create-request__section">
          <div className="create-request__section-header">
            <h2>Địa điểm &amp; thời gian</h2>
            <p>Thông tin về nơi thực hiện và thời gian mong muốn</p>
          </div>

          <div className="create-request__field">
            <label htmlFor="address">Địa chỉ thực hiện</label>
            <input
              id="address"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Ví dụ: 123 Đường ABC, Quận 1, TP.HCM"
            />
            <small>Địa chỉ cụ thể giúp thành viên dễ dàng tìm đến nơi ủy thác</small>
          </div>

          <div className="create-request__field">
            <label htmlFor="expectedDate">Thời gian mong muốn</label>
            <input
              id="expectedDate"
              type="datetime-local"
              name="expectedDate"
              value={formData.expectedDate}
              onChange={handleChange}
              min={formData.expectedDate}
              required
            />
            <small>Thời gian bạn mong muốn dịch vụ được thực hiện (phải lớn hơn thời gian hiện tại)</small>
            {error && error.includes('thời gian') && (
              <div className="create-request__field-error">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Gợi ý dịch vụ mới */}
        {formData.isNewService && (
          <div className="create-request__section">
            <div className="create-request__section-header">
              <h2>Gợi ý dịch vụ mới</h2>
              <p>
                Nếu đây là dịch vụ hệ thống chưa có, hãy mô tả chi tiết. Những dịch vụ được đề xuất
                nhiều sẽ được quản lý xem xét thêm vào danh mục chính thức mỗi quý.
              </p>
            </div>

            <div className="create-request__field">
              <label htmlFor="suggestion">Mô tả dịch vụ mới</label>
              <textarea
                id="suggestion"
                name="suggestion"
                value={formData.suggestion}
                onChange={handleChange}
                placeholder="Mô tả chi tiết về dịch vụ mới này, tại sao bạn cần nó, và cách thức thực hiện..."
                rows="4"
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="create-request__actions">
          <Link to="/dashboard" className="btn btn-outline">
            Hủy
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateRequest;

