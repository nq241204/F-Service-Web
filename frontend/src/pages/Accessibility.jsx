import React from 'react';
import { Link } from 'react-router-dom';
import './css/Accessibility.css';

function Accessibility() {
  return (
    <div className="accessibility">
      <div className="accessibility__container">
        <div className="accessibility__header">
          <h1 className="accessibility__title">Tuyên bố Khả năng Tiếp cận</h1>
          <p className="accessibility__subtitle">Cam kết của F-Service về khả năng tiếp cận cho mọi người dùng</p>
        </div>

        <div className="accessibility__content">
          <div className="accessibility__section">
            <h2>Cam kết của chúng tôi</h2>
            <p>
              Tại F-Service, chúng tôi cam kết đảm bảo rằng trang web của chúng tôi có thể truy cập được cho mọi người dùng, 
              bao gồm cả những người khuyết tật. Chúng tôi tin rằng mọi người đều deserve quyền truy cập thông tin và dịch vụ một cách bình đẳng.
            </p>
            <p>
              Chúng tôi đang nỗ lực tuân thủ Tiêu chuẩn Tiếp cận Nội dung Web (WCAG) 2.1 cấp độ AA, 
              được công nhận rộng rãi là tiêu chuẩn quốc tế về khả năng tiếp cận web.
            </p>
          </div>

          <div className="accessibility__section">
            <h2>Tính năng tiếp cận</h2>
            <p>Trang web F-Service bao gồm các tính năng tiếp cận sau:</p>
            <div className="accessibility__features">
              <div className="accessibility__feature">
                <h3>🔤 Điều hướng bàn phím</h3>
                <p>Có thể điều hướng toàn bộ trang web chỉ sử dụng bàn phím (Tab, Shift+Tab, Enter, Space)</p>
              </div>
              <div className="accessibility__feature">
                <h3>📱 Thiết kế đáp ứng</h3>
                <p>Tương thích với các thiết bị di động và máy tính bảng</p>
              </div>
              <div className="accessibility__feature">
                <h3>🎨 Tương phản màu sắc</h3>
                <p>Tương phản màu sắc đáp ứng tiêu chuẩn WCAG AA</p>
              </div>
              <div className="accessibility__feature">
                <h3>🏷️ Nhãn alt cho hình ảnh</h3>
                <p>Tất cả hình ảnh đều có mô tả alt text cho người dùng screen reader</p>
              </div>
              <div className="accessibility__feature">
                <h3>📝 Đánh dấu ngữ nghĩa</h3>
                <p>Sử dụng HTML5 semantic tags đúng cách</p>
              </div>
              <div className="accessibility__feature">
                <h3>⌨️ Lối tắt</h3>
                <p>Hỗ trợ các phím tắt phổ biến cho điều hướng nhanh</p>
              </div>
            </div>
          </div>

          <div className="accessibility__section">
            <h2>Công cụ hỗ trợ</h2>
            <p>Chúng tôi khuyến nghị các công cụ sau để cải thiện trải nghiệm tiếp cận:</p>
            <div className="accessibility__tools">
              <div className="accessibility__tool">
                <h3>Screen Readers</h3>
                <ul>
                  <li>NVDA (Windows)</li>
                  <li>JAWS (Windows)</li>
                  <li>VoiceOver (macOS/iOS)</li>
                  <li>TalkBack (Android)</li>
                </ul>
              </div>
              <div className="accessibility__tool">
                <h3>Magnification Tools</h3>
                <ul>
                  <li>Magnifier (Windows)</li>
                  <li>Zoom (macOS)</li>
                  <li>Bộ phóng lớn trình duyệt</li>
                </ul>
              </div>
              <div className="accessibility__tool">
                <h3>Voice Control</h3>
                <ul>
                  <li>Windows Speech Recognition</li>
                  <li>Dictation (macOS)</li>
                  <li>Google Voice Typing</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="accessibility__section">
            <h2>Lối tắt bàn phím</h2>
            <div className="accessibility__shortcuts">
              <div className="accessibility__shortcut">
                <kbd>Tab</kbd>
                <span>Chuyển đến phần tử tiếp theo</span>
              </div>
              <div className="accessibility__shortcut">
                <kbd>Shift + Tab</kbd>
                <span>Chuyển đến phần tử trước đó</span>
              </div>
              <div className="accessibility__shortcut">
                <kbd>Enter</kbd>
                <span>Kích hoạt nút hoặc link</span>
              </div>
              <div className="accessibility__shortcut">
                <kbd>Space</kbd>
                <span>Kích hoạt checkbox hoặc radio button</span>
              </div>
              <div className="accessibility__shortcut">
                <kbd>Esc</kbd>
                <span>Đóng modal hoặc popup</span>
              </div>
              <div className="accessibility__shortcut">
                <kbd>Alt + M</kbd>
                <span>Đi đến menu chính</span>
              </div>
              <div className="accessibility__shortcut">
                <kbd>Alt + S</kbd>
                <span>Đi đến tìm kiếm</span>
              </div>
              <div className="accessibility__shortcut">
                <kbd>Alt + H</kbd>
                <span>Đi đến trang chủ</span>
              </div>
            </div>
          </div>

          <div className="accessibility__section">
            <h2>Báo cáo vấn đề tiếp cận</h2>
            <p>
              Chúng tôi luôn nỗ lực cải thiện khả năng tiếp cận của trang web. 
              Nếu bạn gặp bất kỳ vấn đề nào về khả năng tiếp cận, vui lòng báo cáo cho chúng tôi.
            </p>
            <div className="accessibility__report">
              <h3>Cách báo cáo:</h3>
              <ul>
                <li>Email: accessibility@fservice.com</li>
                <li>Hotline: 1900-1234 (nhấn 3)</li>
                <li>Form liên hệ: <Link to="/contact">Trang liên hệ</Link></li>
              </ul>
              <h3>Thông tin cần cung cấp:</h3>
              <ul>
                <li>Mô tả chi tiết vấn đề bạn gặp</li>
                <li>Trình duyệt và phiên bản đang sử dụng</li>
                <li>Thiết bị và hệ điều hành</li>
                <li>Công nghệ hỗ trợ đang sử dụng (nếu có)</li>
                <li>URL của trang có vấn đề</li>
              </ul>
            </div>
          </div>

          <div className="accessibility__section">
            <h2>Kế hoạch cải tiến</h2>
            <p>Chúng tôi đang làm việc để cải thiện khả năng tiếp cận với các kế hoạch sau:</p>
            <div className="accessibility__roadmap">
              <div className="accessibility__roadmap-item">
                <h3>Quý 1 2024</h3>
                <ul>
                  <li>Audit toàn bộ trang web theo WCAG 2.1 AA</li>
                  <li>Cải thiện tương phản màu sắc</li>
                  <li>Thêm captions cho video</li>
                </ul>
              </div>
              <div className="accessibility__roadmap-item">
                <h3>Quý 2 2024</h3>
                <ul>
                  <li>Tối ưu hóa cho screen readers</li>
                  <li>Cải thiện điều hướng bàn phím</li>
                  <li>Thêm phiên bản tiếng Việt sign language</li>
                </ul>
              </div>
              <div className="accessibility__roadmap-item">
                <h3>Quý 3 2024</h3>
                <ul>
                  <li>Phát triển ứng dụng mobile có khả năng tiếp cận</li>
                  <li>Thêm tính năng đọc to (text-to-speech)</li>
                  <li>Tối ưu hóa cho người khiếm thị</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="accessibility__section">
            <h2>Chứng nhận và Tuân thủ</h2>
            <p>
              Chúng tôi cam kết tuân thủ các quy định pháp luật về khả năng tiếp cận tại Việt Nam và quốc tế:
            </p>
            <ul>
              <li>Luật Người khuyết tật Việt Nam</li>
              <li>Americans with Disabilities Act (ADA)</li>
              <li>European Accessibility Act</li>
              <li>WCAG 2.1 Level AA Guidelines</li>
            </ul>
          </div>

          <div className="accessibility__contact">
            <h2>Cần hỗ trợ thêm?</h2>
            <p>
              Nếu bạn cần hỗ trợ đặc biệt hoặc có câu hỏi về khả năng tiếp cận, 
              đừng ngần ngại liên hệ với chúng tôi.
            </p>
            <div className="accessibility__contact-info">
              <div className="accessibility__contact-item">
                <strong>Email:</strong> accessibility@fservice.com
              </div>
              <div className="accessibility__contact-item">
                <strong>Hotline:</strong> 1900-1234 (nhấn 3)
              </div>
              <div className="accessibility__contact-item">
                <strong>Thời gian:</strong> Thứ 2 - Thứ 6: 8:00 - 18:00
              </div>
            </div>
          </div>
        </div>

        <div className="accessibility__footer">
          <p>
            Tuyên bố này được cập nhật lần cuối vào ngày 01/01/2024 
            và sẽ được xem xét định kỳ 6 tháng một lần.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Accessibility;
