import React from 'react';
import { Link } from 'react-router-dom';
import './css/Privacy.css';

function Privacy() {
  return (
    <div className="privacy">
      <div className="privacy__container">
        <div className="privacy__header">
          <h1 className="privacy__title">Chính sách bảo mật</h1>
          <p className="privacy__subtitle">Cập nhật lần cuối: 01/01/2024</p>
        </div>

        <div className="privacy__content">
          <div className="privacy__section">
            <h2>1. Giới thiệu</h2>
            <p>
              F-Service cam kết bảo vệ thông tin cá nhân của người dùng. Chính sách này giải thích cách chúng tôi 
              thu thập, sử dụng, và bảo vệ thông tin của bạn khi sử dụng nền tảng F-Service.
            </p>
          </div>

          <div className="privacy__section">
            <h2>2. Thông tin chúng tôi thu thập</h2>
            <h3>2.1 Thông tin cá nhân:</h3>
            <ul>
              <li>Họ và tên</li>
              <li>Email và số điện thoại</li>
              <li>Địa chỉ</li>
              <li>Ngày sinh</li>
              <li>Thông tin định danh (CMND/CCCD)</li>
              <li>Thông tin tài khoản ngân hàng</li>
            </ul>
            <h3>2.2 Thông tin sử dụng:</h3>
            <ul>
              <li>Lịch sử truy cập và hoạt động</li>
              <li>Thông tin thiết bị và trình duyệt</li>
              <li>Địa chỉ IP</li>
              <li>Cookies và dữ liệu tương tự</li>
            </ul>
            <h3>2.3 Thông tin giao dịch:</h3>
            <ul>
              <li>Lịch sử giao dịch</li>
              <li>Thông tin thanh toán</li>
              <li>Dịch vụ đã sử dụng</li>
            </ul>
          </div>

          <div className="privacy__section">
            <h2>3. Cách chúng tôi sử dụng thông tin</h2>
            <p>Chúng tôi sử dụng thông tin của bạn để:</p>
            <ul>
              <li>Cung cấp và cải thiện dịch vụ</li>
              <li>Xác thực danh tính và phòng chống gian lận</li>
              <li>Xử lý giao dịch và thanh toán</li>
              <li>Giao tiếp và hỗ trợ khách hàng</li>
              <li>Gửi thông báo và cập nhật quan trọng</li>
              <li>Phân tích và nghiên cứu thị trường</li>
              <li>Tuân thủ quy định pháp luật</li>
            </ul>
          </div>

          <div className="privacy__section">
            <h2>4. Chia sẻ thông tin</h2>
            <p>Chúng tôi không bán, cho thuê hoặc chuyển giao thông tin cá nhân của bạn cho bên thứ ba, trừ các trường hợp:</p>
            <h3>4.1 Với sự đồng ý của bạn:</h3>
            <ul>
              <li>Chia sẻ với thành viên ủy thac để thực hiện dịch vụ</li>
              <li>Chia sẻ thông tin cần thiết để hoàn thành giao dịch</li>
            </ul>
            <h3>4.2 Theo yêu cầu pháp luật:</h3>
            <ul>
              <li>Yêu cầu từ cơ quan nhà nước có thẩm quyền</li>
              <li>Để bảo vệ quyền và lợi ích hợp pháp</li>
              <li>Để ngăn chặn hành vi bất hợp pháp</li>
            </ul>
            <h3>4.3 Đối tác kinh doanh:</h3>
            <ul>
              <li>Các nhà cung cấp dịch vụ thanh toán</li>
              <li>Đối tác cung cấp công nghệ</li>
              <li>Có ký kết thỏa thuận bảo mật</li>
            </ul>
          </div>

          <div className="privacy__section">
            <h2>5. Bảo mật thông tin</h2>
            <p>Chúng tôi áp dụng các biện pháp bảo mật sau:</p>
            <h3>5.1 Biện pháp kỹ thuật:</h3>
            <ul>
              <li>Mã hóa dữ liệu (SSL/TLS)</li>
              <li>Tường lửa và hệ thống chống xâm nhập</li>
              <li>Quét bảo mật định kỳ</li>
              <li>Sao lưu dữ liệu an toàn</li>
            </ul>
            <h3>5.2 Biện pháp tổ chức:</h3>
            <ul>
              <li>Hạn chế quyền truy cập thông tin</li>
              <li>Đào tạo nhân viên về bảo mật</li>
              <li>Ký kết thỏa thuận bảo mật với nhân viên</li>
              <li>Quy trình xử lý sự cố bảo mật</li>
            </ul>
          </div>

          <div className="privacy__section">
            <h2>6. Cookies</h2>
            <p>
              Chúng tôi sử dụng cookies để cải thiện trải nghiệm người dùng và phân tích lưu lượng truy cập. 
              Bạn có thể kiểm soát cookies thông qua cài đặt trình duyệt.
            </p>
            <h3>6.1 Loại cookies:</h3>
            <ul>
              <li>Cookies bắt buộc: cần thiết cho hoạt động website</li>
              <li>Cookies hiệu suất: thu thập thông tin thống kê</li>
              <li>Cookies chức năng: ghi nhớ sở thích của bạn</li>
              <li>Cookies quảng cáo: hiển thị nội dung phù hợp</li>
            </ul>
          </div>

          <div className="privacy__section">
            <h2>7. Quyền của người dùng</h2>
            <p>Bạn có các quyền sau đối với thông tin cá nhân của mình:</p>
            <h3>7.1 Quyền truy cập:</h3>
            <p>Yêu cầu cung cấp bản sao thông tin cá nhân của bạn</p>
            <h3>7.2 Quyền chỉnh sửa:</h3>
            <p>Cập nhật hoặc sửa đổi thông tin không chính xác</p>
            <h3>7.3 Quyền xóa:</h3>
            <p>Yêu cầu xóa thông tin cá nhân (trong các trường hợp được pháp luật cho phép)</p>
            <h3>7.4 Quyền hạn chế:</h3>
            <p>Hạn chế xử lý thông tin trong một số trường hợp</p>
            <h3>7.5 Quyền phản đối:</h3>
            <p>Phản đối việc xử lý thông tin của bạn</p>
          </div>

          <div className="privacy__section">
            <h2>8. Lưu trữ thông tin</h2>
            <p>
              Chúng tôi lưu trữ thông tin cá nhân của bạn trong thời gian cần thiết để thực hiện các mục đích được nêu trong chính sách này, 
              hoặc theo yêu cầu của pháp luật.
            </p>
            <h3>8.2 Thời gian lưu trữ:</h3>
            <ul>
              <li>Thông tin tài khoản: cho đến khi bạn xóa tài khoản</li>
              <li>Thông tin giao dịch: 7 năm (theo luật kế toán)</li>
              <li>Thông tin hỗ trợ: 3 năm</li>
              <li>Log hệ thống: 1 năm</li>
            </ul>
          </div>

          <div className="privacy__section">
            <h2>9. Bảo vệ trẻ em</h2>
            <p>
              Dịch vụ của chúng tôi không dành cho trẻ em dưới 18 tuổi. 
              Chúng tôi không cố tình thu thập thông tin từ trẻ em. 
              Nếu phát hiện thông tin từ trẻ em, chúng tôi sẽ xóa ngay lập tức.
            </p>
          </div>

          <div className="privacy__section">
            <h2>10. Thay đổi chính sách</h2>
            <p>
              Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. 
              Thay đổi sẽ được thông báo trên website và gửi email cho người dùng. 
              Việc bạn tiếp tục sử dụng dịch vụ sau khi có thay đổi có nghĩa là bạn chấp nhận chính sách mới.
            </p>
          </div>

          <div className="privacy__section">
            <h2>11. Liên hệ</h2>
            <p>
              Nếu bạn có câu hỏi hoặc yêu cầu về quyền riêng tư, vui lòng liên hệ:
            </p>
            <ul>
              <li>Email: privacy@fservice.com</li>
              <li>Hotline: 1900-1234</li>
              <li>Địa chỉ: 123 Nguyễn Huệ, Q.1, TP.HCM</li>
            </ul>
          </div>
        </div>

        <div className="privacy__footer">
          <p>
            Chính sách bảo mật này có hiệu lực từ ngày 01/01/2024 và áp dụng cho tất cả người dùng F-Service.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Privacy;
