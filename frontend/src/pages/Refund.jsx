import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './css/Refund.css';

function Refund() {
  const [formData, setFormData] = useState({
    orderId: '',
    reason: '',
    description: '',
    contactEmail: '',
    contactPhone: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would normally send the form data to your backend
    console.log('Refund request submitted:', formData);
    alert('Yêu cầu hoàn tiền đã được gửi. Chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ.');
    
    // Reset form
    setFormData({
      orderId: '',
      reason: '',
      description: '',
      contactEmail: '',
      contactPhone: ''
    });
  };

  return (
    <div className="refund">
      <div className="refund__container">
        <div className="refund__header">
          <h1 className="refund__title">Chính sách hoàn tiền</h1>
          <p className="refund__subtitle">Quy định và quy trình hoàn tiền tại F-Service</p>
        </div>

        <div className="refund__content">
          <div className="refund__policy">
            <h2>Chính sách hoàn tiền</h2>
            
            <div className="refund__section">
              <h3>1. Điều kiện hoàn tiền</h3>
              <p>Bạn có thể yêu cầu hoàn tiền trong các trường hợp sau:</p>
              <ul>
                <li>Dịch vụ không được thực hiện hoặc không hoàn thành</li>
                <li>Chất lượng dịch vụ không đúng như thỏa thuận</li>
                <li>Thành viên ủy thac không thực hiện dịch vụ</li>
                <li>Lý do bất khả kháng từ cả hai bên</li>
                <li>Sai phạm trong quá trình thực hiện dịch vụ</li>
              </ul>
            </div>

            <div className="refund__section">
              <h3>2. Mức hoàn tiền</h3>
              <div className="refund__levels">
                <div className="refund__level">
                  <h4>Hoàn tiền 100%</h4>
                  <ul>
                    <li>Dịch vụ không được thực hiện</li>
                    <li>Thành viên hủy không có lý do chính đáng</li>
                    <li>Lừa đảo hoặc hành vi gian lận</li>
                  </ul>
                </div>
                <div className="refund__level">
                  <h4>Hoàn tiền 70-90%</h4>
                  <ul>
                    <li>Dịch vụ hoàn thành một phần</li>
                    <li>Chất lượng không đạt yêu cầu</li>
                    <li>Thành viên không đúng hẹn</li>
                  </ul>
                </div>
                <div className="refund__level">
                  <h4>Hoàn tiền 30-50%</h4>
                  <ul>
                    <li>Khách hàng hủy sau khi thành viên đã bắt đầu</li>
                    <li>Thỏa thuận thay đổi do khách hàng</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="refund__section">
              <h3>3. Thời gian xử lý</h3>
              <div className="refund__timeline">
                <div className="refund__step">
                  <div className="refund__step-number">1</div>
                  <div className="refund__step-content">
                    <h4>Nhận yêu cầu</h4>
                    <p>Trong vòng 24 giờ</p>
                  </div>
                </div>
                <div className="refund__step">
                  <div className="refund__step-number">2</div>
                  <div className="refund__step-content">
                    <h4>Xác minh thông tin</h4>
                    <p>2-3 ngày làm việc</p>
                  </div>
                </div>
                <div className="refund__step">
                  <div className="refund__step-number">3</div>
                  <div className="refund__step-content">
                    <h4>Đưa ra quyết định</h4>
                    <p>1-2 ngày làm việc</p>
                  </div>
                </div>
                <div className="refund__step">
                  <div className="refund__step-number">4</div>
                  <div className="refund__step-content">
                    <h4>Hoàn tiền</h4>
                    <p>3-5 ngày làm việc</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="refund__section">
              <h3>4. Trường hợp không hoàn tiền</h3>
              <p>Chúng tôi sẽ không hoàn tiền trong các trường hợp sau:</p>
              <ul>
                <li>Dịch vụ đã hoàn thành và khách hàng đã xác nhận</li>
                <li>Khách hàng hủy sau khi dịch vụ đã bắt đầu không có lý do chính đáng</li>
                <li>Vi phạm điều khoản sử dụng</li>
                <li>Yêu cầu hoàn tiền sau 30 ngày kể từ khi hoàn thành dịch vụ</li>
                <li>Cung cấp thông tin sai lệch hoặc gian dối</li>
              </ul>
            </div>
          </div>

          <div className="refund__request">
            <h2>Yêu cầu hoàn tiền</h2>
            <p>Nếu bạn cần yêu cầu hoàn tiền, vui lòng điền form dưới đây:</p>
            
            <form className="refund__form" onSubmit={handleSubmit}>
              <div className="refund__form-group">
                <label htmlFor="orderId">Mã đơn hàng *</label>
                <input
                  type="text"
                  id="orderId"
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleChange}
                  required
                  placeholder="Nhập mã đơn hàng của bạn"
                />
              </div>

              <div className="refund__form-group">
                <label htmlFor="reason">Lý do hoàn tiền *</label>
                <select
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn lý do --</option>
                  <option value="not-performed">Dịch vụ không được thực hiện</option>
                  <option value="poor-quality">Chất lượng dịch vụ kém</option>
                  <option value="member-cancelled">Thành viên hủy dịch vụ</option>
                  <option value="wrong-description">Không đúng mô tả</option>
                  <option value="fraud">Gian lận</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div className="refund__form-group">
                <label htmlFor="description">Mô tả chi tiết *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="5"
                  placeholder="Vui lòng mô tả chi tiết lý do yêu cầu hoàn tiền"
                ></textarea>
              </div>

              <div className="refund__form-row">
                <div className="refund__form-group">
                  <label htmlFor="contactEmail">Email liên hệ *</label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    required
                    placeholder="Email của bạn"
                  />
                </div>

                <div className="refund__form-group">
                  <label htmlFor="contactPhone">Số điện thoại liên hệ *</label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    required
                    placeholder="Số điện thoại của bạn"
                  />
                </div>
              </div>

              <div className="refund__form-note">
                <p><strong>Lưu ý:</strong></p>
                <ul>
                  <li>Vui lòng cung cấp đầy đủ thông tin để xử lý nhanh hơn</li>
                  <li>Chúng tôi có thể yêu cầu thêm bằng chứng nếu cần</li>
                  <li>Quyết định cuối cùng thuộc về F-Service</li>
                </ul>
              </div>

              <button type="submit" className="refund__btn">
                Gửi yêu cầu hoàn tiền
              </button>
            </form>
          </div>
        </div>

        <div className="refund__contact">
          <h2>Cần hỗ trợ?</h2>
          <p>Nếu bạn có câu hỏi về chính sách hoàn tiền, vui lòng liên hệ:</p>
          <div className="refund__contact-info">
            <div className="refund__contact-item">
              <strong>Hotline:</strong> 1900-1234
            </div>
            <div className="refund__contact-item">
              <strong>Email:</strong> refund@fservice.com
            </div>
            <div className="refund__contact-item">
              <strong>Thời gian:</strong> Thứ 2 - Thứ 6: 8:00 - 18:00
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Refund;
