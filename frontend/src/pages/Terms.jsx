import React from 'react';
import { Link } from 'react-router-dom';
import './css/Terms.css';

function Terms() {
  return (
    <div className="terms">
      <div className="terms__container">
        <div className="terms__header">
          <h1 className="terms__title">Điều khoản sử dụng</h1>
          <p className="terms__subtitle">Cập nhật lần cuối: 01/01/2024</p>
        </div>

        <div className="terms__content">
          <div className="terms__section">
            <h2>1. Chấp nhận điều khoản</h2>
            <p>
              Bằng việc truy cập và sử dụng nền tảng F-Service, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu ra dưới đây. 
              Nếu bạn không đồng ý với bất kỳ phần nào trong các điều khoản này, vui lòng không sử dụng dịch vụ của chúng tôi.
            </p>
          </div>

          <div className="terms__section">
            <h2>2. Mô tả dịch vụ</h2>
            <p>
              F-Service là nền tảng kết nối người dùng có nhu cầu với các thành viên ủy thác chuyên nghiệp. Chúng tôi cung cấp:
            </p>
            <ul>
              <li>Nền tảng trung gian kết nối dịch vụ</li>
              <li>Hệ thống quản lý giao dịch an toàn</li>
              <li>Công cụ đánh giá và xác thực thành viên</li>
              <li>Hỗ trợ giải quyết tranh chấp</li>
            </ul>
          </div>

          <div className="terms__section">
            <h2>3. Đăng ký tài khoản</h2>
            <p>
              Để sử dụng đầy đủ các tính năng của F-Service, bạn cần đăng ký tài khoản và cung cấp thông tin chính xác. 
              Bạn chịu trách nhiệm duy trì bảo mật tài khoản và mọi hoạt động diễn ra dưới tài khoản của mình.
            </p>
            <h3>3.1 Yêu cầu đăng ký:</h3>
            <ul>
              <li>Cung cấp thông tin cá nhân chính xác</li>
              <li>Tuổi tối thiểu: 18 tuổi</li>
              <li>Có năng lực hành vi dân sự đầy đủ</li>
              <li>Chưa bị cấm sử dụng dịch vụ trước đó</li>
            </ul>
          </div>

          <div className="terms__section">
            <h2>4. Trách nhiệm của người dùng</h2>
            <p>Là người dùng F-Service, bạn cam kết:</p>
            <ul>
              <li>Cung cấp thông tin trung thực và chính xác</li>
              <li>Không sử dụng dịch vụ cho mục đích bất hợp pháp</li>
              <li>Tôn trọng quyền riêng tư của người khác</li>
              <li>Không đăng tải nội dung độc hại, lừa đảo</li>
              <li>Thanh toán đúng hạn cho các dịch vụ đã sử dụng</li>
              <li>Tuân thủ pháp luật Việt Nam</li>
            </ul>
          </div>

          <div className="terms__section">
            <h2>5. Trách nhiệm của thành viên ủy thác</h2>
            <p>Ngoài các trách nhiệm của người dùng thông thường, thành viên ủy thác phải:</p>
            <ul>
              <li>Cung cấp thông tin xác thực chính xác</li>
              <li>Hoàn thành dịch vụ theo thỏa thuận</li>
              <li>Duy trì chất lượng dịch vụ cao</li>
              <li>Tôn trọng thời gian và yêu cầu của khách hàng</li>
              <li>Báo cáo tiến độ công việc thường xuyên</li>
            </ul>
          </div>

          <div className="terms__section">
            <h2>6. Thanh toán và giao dịch</h2>
            <h3>6.1 Phí dịch vụ:</h3>
            <ul>
              <li>Phí nền tảng: 5% giá trị giao dịch</li>
              <li>Phí được áp dụng khi giao dịch thành công</li>
              <li>Phí có thể thay đổi theo chính sách của công ty</li>
            </ul>
            <h3>6.2 Quy trình thanh toán:</h3>
            <ul>
              <li>Tiền được giữ trong tài khoản ký quỹ</li>
              <li>Tiền chỉ được giải ngân khi dịch vụ hoàn thành</li>
              <li>Quá trình xác nhận hoàn thành từ cả hai bên</li>
            </ul>
          </div>

          <div className="terms__section">
            <h2>7. Bảo mật và quyền riêng tư</h2>
            <p>
              Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn theo <Link to="/privacy">Chính sách bảo mật</Link>. 
              Tuy nhiên, bạn cần hiểu rằng:
            </p>
            <ul>
              <li>Không có hệ thống nào an toàn tuyệt đối</li>
              <li>Chúng tôi không chịu trách nhiệm cho các hành vi xâm phạm từ bên thứ ba</li>
              <li>Bạn có trách nhiệm bảo vệ tài khoản của mình</li>
            </ul>
          </div>

          <div className="terms__section">
            <h2>8. Sở hữu trí tuệ</h2>
            <p>
              Tất cả nội dung, thiết kế, logo và phần mềm thuộc sở hữu của F-Service và được bảo vệ bởi luật sở hữu trí tuệ. 
              Bạn không được sao chép, sửa đổi hoặc phân phối lại mà không có sự cho phép bằng văn bản.
            </p>
          </div>

          <div className="terms__section">
            <h2>9. Hủy dịch vụ và hoàn tiền</h2>
            <h3>9.1 Hủy bởi người dùng:</h3>
            <ul>
              <li>Có thể hủy trước khi thành viên nhận dịch vụ</li>
              <li>Phí hủy: 10% giá trị dịch vụ (nếu có)</li>
            </ul>
            <h3>9.2 Hủy bởi thành viên:</h3>
            <ul>
              <li>Chỉ được hủy trong trường hợp bất khả kháng</li>
              <li>Cần cung cấp bằng chứng và lý do hợp lệ</li>
            </ul>
            <h3>9.3 Chính sách hoàn tiền:</h3>
            <ul>
              <li>Hoàn tiền 100% nếu dịch vụ không được thực hiện</li>
              <li>Hoàn tiền một phần tùy thuộc vào tiến độ công việc</li>
              <li>Không hoàn tiền sau khi dịch vụ đã hoàn thành</li>
            </ul>
          </div>

          <div className="terms__section">
            <h2>10. Giới hạn trách nhiệm</h2>
            <p>
              F-Service chỉ đóng vai trò trung gian kết nối và không chịu trách nhiệm cho chất lượng dịch vụ của các thành viên. 
              Trách nhiệm của chúng tôi giới hạn trong việc:
            </p>
            <ul>
              <li>Cung cấp nền tảng ổn định</li>
              <li>Xác thực danh tính thành viên</li>
              <li>Hỗ trợ giải quyết tranh chấp</li>
              <li>Bảo vệ giao dịch tài chính</li>
            </ul>
          </div>

          <div className="terms__section">
            <h2>11. Giải quyết tranh chấp</h2>
            <p>
              Trong trường hợp có tranh chấp, các bên sẽ ưu tiên giải quyết thông qua thương lượng. 
              Nếu không đạt được thỏa thuận, tranh chấp sẽ được giải quyết tại Tòa án nhân dân có thẩm quyền tại Việt Nam.
            </p>
          </div>

          <div className="terms__section">
            <h2>12. Thay đổi điều khoản</h2>
            <p>
              Chúng tôi có quyền thay đổi các điều khoản này bất cứ lúc nào. 
              Thay đổi sẽ có hiệu lực sau 30 ngày kể từ ngày thông báo. 
              Việc bạn tiếp tục sử dụng dịch vụ sau khi có thay đổi có nghĩa là bạn chấp nhận các điều khoản mới.
            </p>
          </div>

          <div className="terms__section">
            <h2>13. Liên hệ</h2>
            <p>
              Nếu bạn có bất kỳ câu hỏi nào về các điều khoản này, vui lòng liên hệ với chúng tôi:
            </p>
            <ul>
              <li>Email: support@fservice.com</li>
              <li>Hotline: 1900-1234</li>
              <li>Địa chỉ: 123 Nguyễn Huệ, Q.1, TP.HCM</li>
            </ul>
          </div>
        </div>

        <div className="terms__footer">
          <p>
            Bằng việc sử dụng F-Service, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ các điều khoản và điều kiện này.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Terms;
