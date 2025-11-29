// frontend/src/pages/AdminTransactions.jsx
import React, { useState, useEffect } from 'react';
import { getTransactions } from '../services/adminService';
import api from '../config/api.js';
import authUtilsEnhanced from '../utils/authUtilsEnhanced';
import './css/AdminTransactions.css';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Check authentication before loading data
    if (!authUtilsEnhanced.validateAuth()) {
      setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      setLoading(false);
      return;
    }
    
    // Check if user is admin
    const userData = authUtilsEnhanced.getUserData();
    if (!userData || userData.role !== 'admin') {
      setError('Bạn không có quyền truy cập trang này.');
      setLoading(false);
      return;
    }
    
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await getTransactions();
      console.log('Admin transactions data:', data);
      
      let transactionsArray = [];
      
      // Handle the actual data structure: {success: true, data: {transactions: [...], pagination: {...}}}
      if (data && data.success && data.data) {
        if (Array.isArray(data.data.transactions)) {
          transactionsArray = data.data.transactions;
        } else if (Array.isArray(data.data)) {
          transactionsArray = data.data;
        } else {
          console.warn('Expected transactions array not found in:', data.data);
          transactionsArray = [];
        }
      } else if (Array.isArray(data)) {
        transactionsArray = data;
      } else if (data && Array.isArray(data.transactions)) {
        transactionsArray = data.transactions;
      } else {
        console.warn('Unexpected data structure:', data);
        transactionsArray = [];
      }
      
      setTransactions(transactionsArray);
      setError('');
    } catch (err) {
      console.error('Error fetching transactions:', err);
      
      // Use authUtils to handle auth errors
      if (authUtilsEnhanced.handleAuthError(err)) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setTransactions([]);
        return;
      }
      
      setError('Không thể tải danh sách giao dịch.');
      setTransactions([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Approve transaction
  const handleApprove = async (txId) => {
    try {
      if (window.showNotification) {
        window.showNotification('Đang duyệt giao dịch...', 'info', 3000);
      }

      await api.put(`/admin/transactions/${txId}/approve`);
      
      if (window.showNotification) {
        window.showNotification('✅ Duyệt giao dịch thành công!', 'success', 3000);
      }
      
      // Refresh transactions list
      fetchTransactions();
    } catch (err) {
      console.error('Error approving transaction:', err);
      if (window.showNotification) {
        window.showNotification('❌ Không thể duyệt giao dịch', 'error', 5000);
      }
    }
  };

  // Reject transaction
  const handleReject = async (txId) => {
    try {
      const reason = prompt('Vui lòng nhập lý do từ chối:');
      if (!reason) return;

      if (window.showNotification) {
        window.showNotification('Đang từ chối giao dịch...', 'info', 3000);
      }

      await api.put(`/admin/transactions/${txId}/reject`, { reason });
      
      if (window.showNotification) {
        window.showNotification('❌ Từ chối giao dịch thành công!', 'success', 3000);
      }
      
      // Refresh transactions list
      fetchTransactions();
    } catch (err) {
      console.error('Error rejecting transaction:', err);
      if (window.showNotification) {
        window.showNotification('❌ Không thể từ chối giao dịch', 'error', 5000);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter transactions
  const filteredTransactions = Array.isArray(transactions) ? transactions.filter(tx => {
    if (!tx || typeof tx !== 'object') return false;
    
    const matchSearch = !searchTerm || 
      (tx.UserId?.name && typeof tx.UserId.name === 'string' && tx.UserId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.UserId?.email && typeof tx.UserId.email === 'string' && tx.UserId.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx._id && typeof tx._id === 'string' && tx._id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchType = !filterType || tx.Loai === filterType;
    const matchStatus = !filterStatus || tx.TrangThai === filterStatus;
    
    return matchSearch && matchType && matchStatus;
  }) : [];

  // Stats
  const stats = {
    total: Array.isArray(transactions) ? transactions.length : 0,
    totalAmount: Array.isArray(transactions) ? transactions.reduce((sum, tx) => sum + (typeof tx.SoTien === 'number' ? tx.SoTien : 0), 0) : 0,
    deposits: Array.isArray(transactions) ? transactions.filter(tx => tx.Loai === 'deposit').length : 0,
    withdraws: Array.isArray(transactions) ? transactions.filter(tx => tx.Loai === 'withdraw').length : 0,
    success: Array.isArray(transactions) ? transactions.filter(tx => tx.TrangThai === 'success').length : 0,
    pending: Array.isArray(transactions) ? transactions.filter(tx => tx.TrangThai === 'pending').length : 0,
    failed: Array.isArray(transactions) ? transactions.filter(tx => tx.TrangThai === 'failed').length : 0,
    cancelled: Array.isArray(transactions) ? transactions.filter(tx => tx.TrangThai === 'cancelled').length : 0,
    depositAmount: Array.isArray(transactions) ? transactions
      .filter(tx => tx.Loai === 'deposit' && tx.TrangThai === 'success')
      .reduce((sum, tx) => sum + (typeof tx.SoTien === 'number' ? tx.SoTien : 0), 0) : 0,
    withdrawAmount: Array.isArray(transactions) ? transactions
      .filter(tx => tx.Loai === 'withdraw' && tx.TrangThai === 'success')
      .reduce((sum, tx) => sum + (typeof tx.SoTien === 'number' ? tx.SoTien : 0), 0) : 0
  };

  return (
    <div className="admin-transactions-page">
      {/* Header */}
      <div className="admin-transactions-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">💰 Quản Lý Giao Dịch</h1>
            <p className="page-subtitle">Theo dõi và quản lý tất cả giao dịch trong hệ thống</p>
          </div>
          <button onClick={fetchTransactions} className="refresh-btn">
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Tổng giao dịch</div>
          </div>
        </div>
        <div className="stat-card stat-deposit">
          <div className="stat-icon">📥</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.depositAmount)}</div>
            <div className="stat-label">Tổng nạp ({stats.deposits})</div>
          </div>
        </div>
        <div className="stat-card stat-withdraw">
          <div className="stat-icon">📤</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.withdrawAmount)}</div>
            <div className="stat-label">Tổng rút ({stats.withdraws})</div>
          </div>
        </div>
        <div className="stat-card stat-pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Chờ xử lý</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-section">
        <div className="summary-card">
          <div className="summary-icon">✅</div>
          <div className="summary-content">
            <div className="summary-label">Thành công</div>
            <div className="summary-value">{stats.success}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">⏳</div>
          <div className="summary-content">
            <div className="summary-label">Chờ xử lý</div>
            <div className="summary-value">{stats.pending}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">❌</div>
          <div className="summary-content">
            <div className="summary-label">Thất bại</div>
            <div className="summary-value">{stats.failed}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Tìm kiếm theo tên, email, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <label className="filter-label">Loại:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả</option>
            <option value="deposit">Nạp tiền</option>
            <option value="withdraw">Rút tiền</option>
            <option value="commission_payment">Thanh toán hoa hồng</option>
            <option value="commission_fee">Phí hoa hồng</option>
            <option value="service_escrow">Ký quỹ dịch vụ</option>
            <option value="service_refund">Hoàn tiền dịch vụ</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Trạng thái:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả</option>
            <option value="success">Thành công</option>
            <option value="pending">Chờ xử lý</option>
            <option value="failed">Thất bại</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải giao dịch...</p>
        </div>
      ) : (Array.isArray(filteredTransactions) && filteredTransactions.length === 0) ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3 className="empty-title">Không tìm thấy giao dịch</h3>
          <p className="empty-description">
            {searchTerm || filterType || filterStatus 
              ? 'Thử thay đổi bộ lọc của bạn' 
              : 'Chưa có giao dịch nào trong hệ thống'}
          </p>
        </div>
      ) : (
        <div className="transactions-table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Người dùng</th>
                <th>Loại</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Phương thức</th>
                <th>Thời gian</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(filteredTransactions) && filteredTransactions.map((tx) => (
                <tr key={tx._id || Math.random()} className={`tx-row tx-${tx.TrangThai || tx.status || 'unknown'}`}>
                  <td className="tx-id">
                    <span className="id-text">{tx._id ? tx._id.slice(-8) : 'N/A'}</span>
                  </td>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar-small">
                        {tx.UserId?.name && typeof tx.UserId.name === 'string' ? tx.UserId.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="user-details-small">
                        <div className="user-name-small">{tx.UserId?.name || 'N/A'}</div>
                        <div className="user-email-small">{tx.UserId?.email || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`type-badge type-${tx.Loai || 'unknown'}`}>
                      {tx.Loai === 'deposit' ? '💰 Nạp tiền' : tx.Loai === 'withdraw' ? '💸 Rút tiền' : '🔄 ' + (tx.Loai || 'Unknown')}
                    </span>
                  </td>
                  <td className="amount-cell">
                    <span className={`amount ${tx.Loai === 'deposit' ? 'positive' : 'negative'}`}>
                      {tx.Loai === 'deposit' ? '+' : '-'}{formatCurrency(tx.SoTien || 0)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${tx.TrangThai || tx.status || 'unknown'}`}>
                      {(tx.TrangThai === 'success' || tx.status === 'success') ? '✅ Thành công' : 
                       (tx.TrangThai === 'pending' || tx.status === 'pending') ? '⏳ Đang chờ' : 
                       (tx.TrangThai === 'failed' || tx.status === 'failed') ? '❌ Thất bại' : 
                       (tx.TrangThai === 'cancelled' || tx.status === 'cancelled') ? '⏹️ Đã hủy' : '❓ ' + (tx.TrangThai || tx.status || 'Unknown')}
                    </span>
                  </td>
                  <td className="method-cell">
                    <span className="method-text">
                      {tx.PhuongThuc || 'Chuyển khoản'}
                    </span>
                  </td>
                  <td className="date-cell">
                    <span className="date-text">
                      {formatDate(tx.createdAt || tx.NgayTao || new Date())}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      {(tx.TrangThai === 'pending' || tx.status === 'pending') && (
                        <>
                          <button
                            onClick={() => handleApprove(tx._id)}
                            className="btn-approve"
                            title="Duyệt giao dịch"
                          >
                            ✅ Duyệt
                          </button>
                          <button
                            onClick={() => handleReject(tx._id)}
                            className="btn-reject"
                            title="Từ chối giao dịch"
                          >
                            ❌ Từ chối
                          </button>
                        </>
                      )}
                      {(tx.TrangThai === 'success' || tx.status === 'success') && (
                        <span className="status-processed status-approved">✅ Đã duyệt</span>
                      )}
                      {(tx.TrangThai === 'cancelled' || tx.status === 'cancelled') && (
                        <span className="status-processed status-cancelled">⏹️ Đã hủy</span>
                      )}
                      {(tx.TrangThai === 'failed' || tx.status === 'failed') && (
                        <span className="status-processed status-rejected">❌ Thất bại</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results Count */}
      {!loading && Array.isArray(filteredTransactions) && filteredTransactions.length > 0 && (
        <div className="results-count">
          Hiển thị {filteredTransactions.length} / {Array.isArray(transactions) ? transactions.length : 0} giao dịch
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
