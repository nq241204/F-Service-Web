// frontend/src/components/QRCodeGenerator.jsx
import React, { useState, useEffect } from 'react';
import QRCodeLib from 'qrcode';
import './QRCodeGenerator.css';

const QRCodeGenerator = ({ amount, provider, transactionId, onClose, onConfirm }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    generateQRCode();
  }, [amount, provider, transactionId]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      setError('');

      // Tạo nội dung cho QR code
      const content = `FS_NAPTIEN_${transactionId}_${amount}_${provider.toUpperCase()}`;
      
      // Tạo QR code
      const qrDataUrl = await QRCodeLib.toDataURL(content, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeUrl(qrDataUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Không thể tạo mã QR. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const content = `FS_NAPTIEN_${transactionId}_${amount}_${provider.toUpperCase()}`;
    navigator.clipboard.writeText(content);
    alert('Đã sao chép nội dung mã QR!');
  };

  const handleConfirm = () => {
    onConfirm && onConfirm();
  };

  const getProviderInfo = () => {
    const providers = {
      momo: {
        name: 'Ví MoMo',
        color: '#ff6b35',
        instructions: '1. Mở ứng dụng MoMo\n2. Quét mã QR hoặc chọn "Quét mã"\n3. Đ nhập số tiền và xác nhận'
      },
      zalopay: {
        name: 'Ví ZaloPay',
        color: '#0066ff',
        instructions: '1. Mở ứng dụng ZaloPay\n2. Chọn "Quét mã"\n3. Đ nhập số tiền và xác nhận'
      },
      bank: {
        name: 'Ngân hàng BIDV',
        color: '#003366',
        instructions: '1. Mở ứng dụng ngân hàng\n2. Chọn "Quét mã QR"\n3. Đ nhập số tiền và xác nhận'
      }
    };
    return providers[provider] || providers.bank;
  };

  const providerInfo = getProviderInfo();

  if (loading) {
    return (
      <div className="qr-modal-overlay">
        <div className="qr-modal">
          <div className="qr-loading">
            <div className="spinner"></div>
            <p>Đang tạo mã QR...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qr-header">
          <h3 style={{ color: providerInfo.color }}>
            {providerInfo.name}
          </h3>
          <button onClick={onClose} className="qr-close">×</button>
        </div>

        {error ? (
          <div className="qr-error">
            <p>{error}</p>
            <button onClick={generateQRCode} className="btn btn-primary">
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <div className="qr-content">
              <div className="qr-amount">
                <span className="qr-amount-label">Số tiền:</span>
                <span className="qr-amount-value">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(amount)}
                </span>
              </div>

              <div className="qr-image-container">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" className="qr-image" />
                ) : (
                  <div className="qr-placeholder">
                    <div className="qr-placeholder-text">QR Code</div>
                  </div>
                )}
              </div>

              <div className="qr-info">
                <h4>Thông tin thanh toán:</h4>
                <ul>
                  <li>Số tiền: {new Intl.NumberFormat('vi-VN').format(amount)}đ</li>
                  <li>Mã giao dịch: {transactionId}</li>
                  <li>Nội dung: FS_NAPTIEN_{transactionId}_{amount}_{provider.toUpperCase()}</li>
                </ul>
              </div>

              <div className="qr-instructions">
                <h4>Hướng dẫn thanh toán:</h4>
                <pre>{providerInfo.instructions}</pre>
              </div>
            </div>

            <div className="qr-actions">
              <button onClick={handleCopy} className="btn btn-secondary">
                📋 Sao chép nội dung
              </button>
              <button onClick={handleConfirm} className="btn btn-primary" style={{ backgroundColor: providerInfo.color }}>
                ✅ Đã thanh toán
              </button>
            </div>

            <div className="qr-note">
              <p>💡 Sau khi thanh toán, admin sẽ duyệt và cộng tiền vào ví của bạn.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QRCodeGenerator;
