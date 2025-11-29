// frontend/src/pages/Wallet.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { walletService } from '../services/walletService';
import authUtilsEnhanced from '../utils/authUtilsEnhanced';
import { getErrorMessage } from '../utils/validationHelper';
import QRCodeGenerator from '../components/QRCodeGenerator';
import './css/Wallet.css';
import './css/WalletQR.css';

function Wallet({ user }) {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false); // Prevent duplicate loads

  // Deposit state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('transfer');
  const [depositProvider, setDepositProvider] = useState('bank');
  const [depositLoading, setDepositLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [transferInfo, setTransferInfo] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  // Withdraw state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankInfo, setBankInfo] = useState({
    accountNumber: '',
    bankName: '',
    accountHolder: '',
  });
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Load wallet data
  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError('');
      
      // Check authentication first
      if (!authUtilsEnhanced.validateAuth()) {
        setError('Vui lòng đăng nhập để xem thông tin ví.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
        return;
      }
      
      // Force refresh by clearing dataLoaded flag
      if (forceRefresh) {
        setDataLoaded(false);
      }
      
      // Load real data from database
      const result = await walletService.getWallet();
      console.log('Loading real wallet data:', result);
      
      if (result.success) {
        setWalletData(result.data);
        setDataLoaded(true);
      } else {
        setError(result.message || 'Không thể tải thông tin ví');
      }
      
    } catch (err) {
      console.error('Error loading wallet data:', err);
      
      // Use authUtils to handle auth errors
      if (authUtilsEnhanced.handleAuthError(err)) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      
      setError('Không thể tải thông tin ví. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    setDepositLoading(true);
    try {
      // Check if user is logged in
      const token = authUtilsEnhanced.getToken();
      if (!token) {
        setError('Bạn cần đăng nhập để sử dụng tính năng này');
        setDepositLoading(false);
        return;
      }

      let result;
      if (depositMethod === 'qrcode') {
        // Generate QR code first
        result = await walletService.generateQRCode(parseFloat(depositAmount), depositProvider);
        console.log('QR Code result:', result);
      } else {
        // Direct deposit - show transfer info
        result = await walletService.deposit(parseFloat(depositAmount), depositMethod, depositProvider);
        console.log('Deposit result:', result);
      }

      if (result.success) {
        if (depositMethod === 'qrcode') {
          // Show QR modal instead of inline QR
          setShowQRModal(true);
          setQrCodeData({
            amount: parseFloat(depositAmount),
            provider: depositProvider,
            transactionId: result.data.transactionId
          });
          setSuccess(`✅ Mã QR đã được tạo! Giao dịch ID: ${result.data.transactionId}.`);
        } else {
          // Show transfer info for bank transfer
          setTransferInfo(result.data.transferInfo);
          setSuccess(`✅ Thông tin chuyển khoản đã được tạo! Giao dịch ID: ${result.data.transactionId}. Vui lòng chuyển khoản theo thông tin dưới đây.`);
        }
        
        // Add transaction to wallet data immediately
        const newTransaction = {
          _id: result.data.transactionId || Date.now().toString(),
          type: 'deposit',
          amount: parseFloat(depositAmount),
          description: `Nạp tiền qua ${depositMethod === 'qrcode' ? 'QR Code' : 'chuyển khoản'} (${depositProvider})`,
          status: 'pending',
          date: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          qrCode: result.data.qrCodeUrl || result.data.qrCode,
          transferInfo: result.data.transferInfo,
          provider: depositProvider
        };
        
        setWalletData(prev => ({
          ...prev,
          wallet: {
            ...prev.wallet,
            transactions: [newTransaction, ...(prev.wallet?.transactions || [])]
          }
        }));
        
        // Refresh wallet data after a short delay to ensure UI updates
        setTimeout(() => {
          loadWalletData(true);
        }, 1000);
      } else {
        setError(result.message || 'Nạp tiền thất bại');
      }
    } catch (err) {
      console.error('Deposit error:', err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (!bankInfo.accountNumber || !bankInfo.bankName || !bankInfo.accountHolder) {
      setError('Vui lòng nhập đầy đủ thông tin ngân hàng');
      return;
    }

    setWithdrawLoading(true);
    try {
      const result = await walletService.withdraw(parseFloat(withdrawAmount), bankInfo);
      if (result.success) {
        setSuccess(result.message || 'Rút tiền thành công!');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setBankInfo({ accountNumber: '', bankName: '', accountHolder: '' });
        
        // Add new transaction to mock data
        const newTransaction = {
          _id: result.data.transactionId || Date.now().toString(),
          type: 'withdraw',
          amount: parseFloat(withdrawAmount),
          description: `Rút tiền về ${bankInfo.bankName}`,
          status: 'pending',
          date: new Date().toISOString(),
          completedAt: new Date().toISOString()
        };
        
        setWalletData(prev => ({
          ...prev,
          wallet: {
            ...prev.wallet,
            transactions: [newTransaction, ...(prev.wallet?.transactions || [])]
          }
        }));
        
        // Refresh wallet data after a short delay to ensure UI updates
        setTimeout(() => {
          loadWalletData(true);
        }, 1000);
      } else {
        setError(result.message || 'Rút tiền thất bại');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Lỗi khi rút tiền. Vui lòng thử lại.'
      );
    } finally {
      setWithdrawLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      deposit: 'Nạp tiền',
      withdraw: 'Rút tiền',
      commission_payment: 'Thanh toán hoa hồng',
      commission_fee: 'Phí hoa hồng',
      service_escrow: 'Tạm ứng dịch vụ',
      service_refund: 'Hoàn tiền dịch vụ',
    };
    return labels[type] || type;
  };

  const getTransactionStatusColor = (status) => {
    const colors = {
      success: 'success',
      pending: 'warning',
      failed: 'error',
      cancelled: 'neutral',
    };
    return colors[status] || 'neutral';
  };

  const handleQRConfirm = () => {
    setShowQRModal(false);
    setQrCodeData(null);
    setDepositAmount('');
    setSuccess('Giao dịch đã được tạo. Vui lòng chờ admin duyệt.');
    setTimeout(loadWalletData, 2000);
  };

  if (loading) {
    return (
      <div className="wallet wallet--loading">
        <div className="wallet__loader">Đang tải thông tin ví...</div>
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="wallet">
        <div className="wallet__error">
          <p>Không thể tải thông tin ví. Vui lòng thử lại sau.</p>
          <button onClick={loadWalletData} className="btn btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet app-main__centered">
      {/* Header */}
      <section className="wallet__header">
        <div>
          <h1>Ví giao dịch</h1>
          <p>Quản lý số dư, nạp/rút tiền và xem lịch sử giao dịch</p>
        </div>
        <div className="wallet__header-actions">
          <button
            onClick={() => setShowDepositModal(true)}
            className="btn btn-primary"
          >
            Nạp tiền
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="btn btn-outline"
          >
            Rút tiền
          </button>
        </div>
      </section>

      {/* Alert messages */}
      {error && (
        <div className="wallet__alert wallet__alert--error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="wallet__alert wallet__alert--success" role="alert">
          {success}
        </div>
      )}

      {/* Balance Card */}
      <section className="wallet__balance-card">
        <div className="wallet__balance-main">
          <span className="wallet__balance-label">Số dư hiện tại</span>
          <strong className="wallet__balance-amount">
            {formatCurrency(walletData.wallet?.balance || 0)}
          </strong>
        </div>
        <div className="wallet__balance-stats">
          <div className="wallet__stat-item">
            <span>Tổng nạp</span>
            <strong>{formatCurrency(walletData.wallet?.totalDeposit || 0)}</strong>
          </div>
          <div className="wallet__stat-item">
            <span>Tổng rút</span>
            <strong>{formatCurrency(walletData.wallet?.totalWithdraw || 0)}</strong>
          </div>
          <div className="wallet__stat-item">
            <span>Tổng giao dịch</span>
            <strong>{walletData.wallet?.totalTransactions || 0}</strong>
          </div>
        </div>
      </section>

      {/* Transactions History */}
      <section className="wallet__section">
        <header className="wallet__section-header">
          <h2>Lịch sử giao dịch</h2>
          <Link to="/transactions" className="wallet__link">
            Xem tất cả →
          </Link>
        </header>
        {walletData.wallet?.transactions && walletData.wallet.transactions.length > 0 ? (
          <div className="wallet__transactions">
            {walletData.wallet.transactions.map((tx) => (
              <article key={tx._id} className="wallet__transaction-card">
                <div className="wallet__transaction-main">
                  <div className="wallet__transaction-info">
                    <h3>{getTransactionTypeLabel(tx.type)}</h3>
                    <p>{tx.description || 'Không có mô tả'}</p>
                    <span className="wallet__transaction-date">
                      {formatDate(tx.date || tx.completedAt)}
                    </span>
                  </div>
                  <div className="wallet__transaction-amount">
                    <strong
                      className={`wallet__amount wallet__amount--${
                        tx.type === 'deposit' || tx.type === 'commission_payment'
                          ? 'positive'
                          : 'negative'
                      }`}
                    >
                      {tx.type === 'deposit' || tx.type === 'commission_payment'
                        ? '+'
                        : '-'}
                      {formatCurrency(tx.amount)}
                    </strong>
                    <span
                      className={`wallet__status wallet__status--${getTransactionStatusColor(
                        tx.status
                      )}`}
                    >
                      {tx.status === 'success'
                        ? 'Thành công'
                        : tx.status === 'pending'
                        ? 'Đang xử lý'
                        : tx.status === 'failed'
                        ? 'Thất bại'
                        : 'Đã hủy'}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="wallet__empty">
            <p>Chưa có giao dịch nào</p>
          </div>
        )}
      </section>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="wallet__modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="wallet__modal" onClick={(e) => e.stopPropagation()}>
            <header className="wallet__modal-header">
              <h2>Nạp tiền vào ví</h2>
              <button
                onClick={() => setShowDepositModal(false)}
                className="wallet__modal-close"
                aria-label="Đóng"
              >
                ×
              </button>
            </header>
            <form onSubmit={handleDeposit} className="wallet__modal-form">
              <div className="wallet__field">
                <label htmlFor="depositAmount">Số tiền (VND)</label>
                <input
                  id="depositAmount"
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Nhập số tiền muốn nạp"
                  min="10000"
                  max="50000000"
                  required
                />
                <small>Tối thiểu: 10.000đ - Tối đa: 50.000.000đ</small>
              </div>
              <div className="wallet__field">
                <label htmlFor="depositMethod">Phương thức thanh toán</label>
                <div className="wallet__method-options">
                  <div className="wallet__method-group">
                    <label className="wallet__method-option">
                      <input
                        type="radio"
                        name="depositMethod"
                        value="transfer"
                        checked={depositMethod === 'transfer'}
                        onChange={(e) => setDepositMethod(e.target.value)}
                        required
                      />
                      <span className="wallet__method-label">Chuyển khoản</span>
                    </label>
                    <label className="wallet__method-option">
                      <input
                        type="radio"
                        name="depositMethod"
                        value="qrcode"
                        checked={depositMethod === 'qrcode'}
                        onChange={(e) => setDepositMethod(e.target.value)}
                        required
                      />
                      <span className="wallet__method-label">Quét mã QR</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="wallet__field">
                <label htmlFor="depositProvider">Nhà cung cấp</label>
                <div className="wallet__provider-options">
                  <label className="wallet__provider-option">
                    <input
                      type="radio"
                      name="depositProvider"
                      value="momo"
                      checked={depositProvider === 'momo'}
                      onChange={(e) => setDepositProvider(e.target.value)}
                      required
                    />
                    <span className="wallet__provider-label">Ví Momo</span>
                  </label>
                  <label className="wallet__provider-option">
                    <input
                      type="radio"
                      name="depositProvider"
                      value="zalopay"
                      checked={depositProvider === 'zalopay'}
                      onChange={(e) => setDepositProvider(e.target.value)}
                      required
                    />
                    <span className="wallet__provider-label">Ví ZaloPay</span>
                  </label>
                  <label className="wallet__provider-option">
                    <input
                      type="radio"
                      name="depositProvider"
                      value="bank"
                      checked={depositProvider === 'bank'}
                      onChange={(e) => setDepositProvider(e.target.value)}
                      required
                    />
                    <span className="wallet__provider-label">Ngân hàng</span>
                  </label>
                </div>
              </div>
              <div className="wallet__modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowDepositModal(false);
                    setQrCodeData(null);
                    setTransferInfo(null);
                    setDepositAmount('');
                    setDepositProvider('bank');
                  }}
                  className="btn btn-outline"
                  disabled={depositLoading}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={depositLoading}>
                  {depositLoading ? 'Đang xử lý...' : depositMethod === 'qrcode' ? 'Tạo mã QR' : 'Xác nhận nạp tiền'}
                </button>
              </div>
            </form>

            {/* Transfer Information Display */}
            {transferInfo && (
              <div className="wallet__transfer-section">
                <div className="wallet__transfer-header">
                  <h3>Thông tin chuyển khoản</h3>
                  <p>Vui lòng chuyển khoản theo thông tin dưới đây</p>
                </div>
                <div className="wallet__transfer-content">
                  <div className="wallet__transfer-info">
                    <h4>Thông tin người nhận:</h4>
                    <div className="wallet__transfer-details">
                      <div className="wallet__transfer-item">
                        <span className="wallet__transfer-label">Người nhận:</span>
                        <span className="wallet__transfer-value">{transferInfo.recipientName}</span>
                      </div>
                      <div className="wallet__transfer-item">
                        <span className="wallet__transfer-label">Số tiền:</span>
                        <span className="wallet__transfer-value">{formatCurrency(transferInfo.amount)}</span>
                      </div>
                      <div className="wallet__transfer-item">
                        <span className="wallet__transfer-label">Lời nhắn:</span>
                        <span className="wallet__transfer-value">{transferInfo.message}</span>
                      </div>
                      <div className="wallet__transfer-item">
                        <span className="wallet__transfer-label">Tên ngân hàng:</span>
                        <span className="wallet__transfer-value">{transferInfo.bankName}</span>
                      </div>
                      {transferInfo.provider === 'momo' && (
                        <div className="wallet__transfer-item">
                          <span className="wallet__transfer-label">Số điện thoại MoMo:</span>
                          <span className="wallet__transfer-value">{transferInfo.momoNumber}</span>
                        </div>
                      )}
                      {transferInfo.provider === 'zalopay' && (
                        <div className="wallet__transfer-item">
                          <span className="wallet__transfer-label">Số điện thoại ZaloPay:</span>
                          <span className="wallet__transfer-value">{transferInfo.zalopayNumber}</span>
                        </div>
                      )}
                      {transferInfo.provider === 'bank' && (
                        <>
                          <div className="wallet__transfer-item">
                            <span className="wallet__transfer-label">Số tài khoản:</span>
                            <span className="wallet__transfer-value">{transferInfo.accountNumber}</span>
                          </div>
                          <div className="wallet__transfer-item">
                            <span className="wallet__transfer-label">Chi nhánh:</span>
                            <span className="wallet__transfer-value">{transferInfo.branch}</span>
                          </div>
                        </>
                      )}
                      <div className="wallet__transfer-item">
                        <span className="wallet__transfer-label">Mã giao dịch:</span>
                        <span className="wallet__transfer-value">{transferInfo.transactionId}</span>
                      </div>
                    </div>
                  </div>
                  <div className="wallet__transfer-actions">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${transferInfo.recipientName}\n${transferInfo.accountNumber || transferInfo.momoNumber || transferInfo.zalopayNumber}\n${formatCurrency(transferInfo.amount)}\n${transferInfo.message}`);
                        setSuccess('Đã sao chép thông tin chuyển khoản!');
                        setTimeout(() => setSuccess(''), 3000);
                      }}
                      className="btn btn-secondary"
                    >
                      Sao chép thông tin
                    </button>
                    <button
                      onClick={() => {
                        setShowDepositModal(false);
                        setTransferInfo(null);
                        setDepositAmount('');
                        setSuccess('Giao dịch đã được tạo. Vui lòng chờ admin duyệt.');
                        setTimeout(loadWalletData, 2000);
                      }}
                      className="btn btn-primary"
                    >
                      Xác nhận đã chuyển
                    </button>
                  </div>
                </div>
                <div className="wallet__transfer-note">
                  <p>💡 Sau khi chuyển khoản, admin sẽ duyệt và cộng tiền vào ví của bạn.</p>
                </div>
              </div>
            )}

            {/* QR Code Display */}
            {qrCodeData && (
              <div className="wallet__qr-section">
                <div className="wallet__qr-header">
                  <h3>Quét mã QR để thanh toán</h3>
                  <p>Số tiền: {formatCurrency(qrCodeData.amount)}</p>
                </div>
                <div className="wallet__qr-content">
                  <div className="wallet__qr-image">
                    {qrCodeData.qrCodeUrl ? (
                      <img src={qrCodeData.qrCodeUrl} alt="QR Code" />
                    ) : qrCodeData.qrCodeData ? (
                      <div className="wallet__qr-placeholder">
                        <div className="wallet__qr-code-text">{qrCodeData.qrCodeData}</div>
                      </div>
                    ) : (
                      <div className="wallet__qr-placeholder">Đang tạo mã QR...</div>
                    )}
                  </div>
                  <div className="wallet__qr-info">
                    <h4>Thông tin thanh toán:</h4>
                    <ul>
                      <li>Số tiền: {formatCurrency(qrCodeData.amount)}</li>
                      <li>Nội dung: {qrCodeData.content || 'Nạp tiền vào ví F-Service'}</li>
                      <li>Mã giao dịch: {qrCodeData.transactionId}</li>
                    </ul>
                    <div className="wallet__qr-actions">
                      <button
                        onClick={() => setQrCodeData(null)}
                        className="btn btn-outline"
                      >
                        Quay lại
                      </button>
                      <button
                        onClick={() => {
                          // Copy transaction ID or content
                          navigator.clipboard.writeText(qrCodeData.content || qrCodeData.transactionId);
                          setSuccess('Đã sao chép thông tin thanh toán!');
                          setTimeout(() => setSuccess(''), 3000);
                        }}
                        className="btn btn-secondary"
                      >
                        Sao chép thông tin
                      </button>
                    </div>
                  </div>
                </div>
                <div className="wallet__qr-note">
                  <p>💡 Sau khi thanh toán, admin sẽ duyệt và cộng tiền vào ví của bạn.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && qrCodeData && (
        <QRCodeGenerator
          amount={qrCodeData.amount}
          provider={qrCodeData.provider}
          transactionId={qrCodeData.transactionId}
          onClose={() => {
            setShowQRModal(false);
            setQrCodeData(null);
          }}
          onConfirm={handleQRConfirm}
        />
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="wallet__modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="wallet__modal" onClick={(e) => e.stopPropagation()}>
            <header className="wallet__modal-header">
              <h2>Rút tiền từ ví</h2>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="wallet__modal-close"
                aria-label="Đóng"
              >
                ×
              </button>
            </header>
            <form onSubmit={handleWithdraw} className="wallet__modal-form">
              <div className="wallet__field">
                <label htmlFor="withdrawAmount">Số tiền (VND)</label>
                <input
                  id="withdrawAmount"
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Nhập số tiền muốn rút"
                  min="50000"
                  max="50000000"
                  required
                />
                <small>
                  Tối thiểu: 50.000đ - Tối đa: 50.000.000đ - Số dư hiện tại:{' '}
                  {formatCurrency(walletData.wallet?.SoDuHienTai || 0)}
                </small>
              </div>
              <div className="wallet__field">
                <label htmlFor="bankAccountNumber">Số tài khoản</label>
                <input
                  id="bankAccountNumber"
                  type="text"
                  value={bankInfo.accountNumber}
                  onChange={(e) =>
                    setBankInfo({ ...bankInfo, accountNumber: e.target.value })
                  }
                  placeholder="Nhập số tài khoản (8-15 chữ số)"
                  pattern="[0-9]{8,15}"
                  required
                />
              </div>
              <div className="wallet__field">
                <label htmlFor="bankName">Tên ngân hàng</label>
                <input
                  id="bankName"
                  type="text"
                  value={bankInfo.bankName}
                  onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                  placeholder="Ví dụ: Vietcombank, Techcombank..."
                  required
                />
              </div>
              <div className="wallet__field">
                <label htmlFor="accountHolder">Tên chủ tài khoản</label>
                <input
                  id="accountHolder"
                  type="text"
                  value={bankInfo.accountHolder}
                  onChange={(e) =>
                    setBankInfo({ ...bankInfo, accountHolder: e.target.value })
                  }
                  placeholder="Nhập tên chủ tài khoản"
                  required
                />
              </div>
              <div className="wallet__modal-actions">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="btn btn-outline"
                  disabled={withdrawLoading}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={withdrawLoading}>
                  {withdrawLoading ? 'Đang xử lý...' : 'Xác nhận rút tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;

