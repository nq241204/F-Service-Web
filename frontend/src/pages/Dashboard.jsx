// frontend/src/pages/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAlert } from '../hooks/useAlert';
import { dashboardService } from '../services/dashboardService';
import { walletService } from '../services/walletService';
import './css/Dashboard.css';

// Helper functions
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

const getTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  return formatDate(dateString);
};

const quickActions = [
  {
    title: 'Tạo yêu cầu dịch vụ',
    description: 'Đăng yêu cầu ủy thác mới cho hệ thống xử lý.',
    action: { label: 'Tạo yêu cầu', to: '/requests/new' },
  },
  {
    title: 'Cập nhật hồ sơ',
    description: 'Bổ sung thông tin cá nhân và kỹ năng.',
    action: { label: 'Cập nhật hồ sơ', to: '/profile' },
  },
  {
    title: 'Xem lịch sử giao dịch',
    description: 'Theo dõi tất cả các giao dịch của bạn.',
    action: { label: 'Xem lịch sử', to: '/wallet' },
  },
];

const knowledgeCenter = [
  {
    title: 'Hướng dẫn sử dụng hệ thống',
    linkLabel: 'Xem hướng dẫn',
    to: '/knowledge?tab=guide'
  },
  {
    title: 'Quy định và điều khoản',
    linkLabel: 'Đọc chi tiết',
    to: '/knowledge?tab=terms'
  },
  {
    title: 'Câu hỏi thường gặp',
    linkLabel: 'Xem FAQ',
    to: '/knowledge?tab=faq'
  },
];

function Dashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false); // Prevent duplicate calls
  const { success, error: showError, AlertContainer } = useAlert();
  const navigate = useNavigate();

  // Handle service confirmation
  const handleConfirmService = async (serviceId, xacNhan, danhGia = 5, ghiChu = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user/confirm-service-completion/${serviceId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          xacNhan, 
          danhGia, 
          ghiChu: xacNhan ? ghiChu : 'Yêu cầu làm lại' 
        })
      });

      const result = await response.json();

      if (result.success) {
        success(xacNhan ? '🎉 Đã xác nhận hoàn thành dịch vụ!' : '❌ Đã yêu cầu làm lại dịch vụ');
        // Reload dashboard data to reflect changes
        setDataLoaded(false);
        loadDashboardData();
      } else {
        showError(result.message || 'Không thể xác nhận dịch vụ');
      }
    } catch (error) {
      console.error('Error confirming service:', error);
      showError('Lỗi khi xác nhận dịch vụ');
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading dashboard data...');
      
      // Prevent duplicate calls with simple guard
      if (dataLoaded) {
        console.log('Data already loaded, skipping...');
        setLoading(false);
        return;
      }
      
      // Set loading flag immediately
      setIsLoadingData(true);
      
      // Load real data from database
      const dashboardResult = await dashboardService.getDashboardData();
      const walletResult = await walletService.getWallet();
      
      console.log('Loading real dashboard data:', dashboardResult);
      console.log('Loading real wallet data:', walletResult);
      
      if (dashboardResult.success) {
        setDashboardData(dashboardResult.data);
      } else {
        setError(dashboardResult.message || 'Không thể tải dữ liệu dashboard');
      }
      
      if (walletResult.success) {
        setWalletData(walletResult.data);
      } else {
        setError(walletResult.message || 'Không thể tải dữ liệu ví');
      }
      
      setDataLoaded(true);
      
    } catch (err) {
      console.error('Dashboard load error:', err);
      const errorMsg = 'Không thể tải dữ liệu dashboard.';
      setError(errorMsg);
      
      // Set empty data on error
      setDashboardData({
        totalServices: 0,
        activeRequests: 0,
        completedRequests: 0,
        recentActivities: [],
        services: [],
        stats: { total: 0, active: 0, pending: 0, completed: 0 },
        wallet: { balance: 0, SoDuHienTai: 0 }
      });
      
      setWalletData({
        balance: 0,
        SoDuHienTai: 0,
        currency: 'VND',
        transactions: []
      });
    } finally {
      setLoading(false);
      setIsLoadingData(false); // Reset loading guard
    }
  }, [dataLoaded]); // Remove isLoadingData to prevent loop

  useEffect(() => {
    console.log('Dashboard useEffect - user:', user);
    if (user && !dataLoaded) { // Simple check only
      loadDashboardData();
    }
  }, [user, dataLoaded]); // Clean dependencies

  // Calculate metrics from data - only if data exists
  const calculateMetrics = () => {
    // Return empty metrics if no data
    if (!dashboardData && !walletData) {
      return {
        walletSummary: [
          {
            label: 'Số dư khả dụng',
            value: formatCurrency(0),
            description: 'Có thể rút hoặc sử dụng để thanh toán dịch vụ',
          },
          {
            label: 'Tổng đã nạp',
            value: formatCurrency(0),
            description: 'Tổng số tiền đã nạp vào ví',
          },
          {
            label: 'Tổng đã rút',
            value: formatCurrency(0),
            description: 'Tổng số tiền đã rút từ ví',
          },
          {
            label: 'Đã dùng cho dịch vụ',
            value: formatCurrency(0),
            description: 'Tổng số tiền đã thanh toán cho dịch vụ',
          },
        ],
        performanceIndicators: [
          {
            label: 'Tổng dịch vụ',
            value: '0',
            description: 'Tổng số dịch vụ đã tạo',
          },
          {
            label: 'Đang thực hiện',
            value: '0',
            description: 'Số dịch vụ đang được xử lý',
          },
          {
            label: 'Hoàn thành',
            value: '0',
            description: 'Số dịch vụ đã hoàn thành',
          },
        ],
        upcomingTasks: [],
        activityFeed: [
          {
            id: 'welcome',
            type: 'info',
            title: 'Chào mừng đến với F-Service!',
            description: 'Bạn đã đăng nhập thành công vào hệ thống',
            timestamp: new Date().toISOString(),
            icon: '🎉'
          }
        ],
      };
    }

    // NEW: Use wallet object from StatisticsService response
    const wallet = dashboardData?.wallet || walletData?.wallet;
    const stats = dashboardData?.stats || walletData?.stats || {};
    const services = dashboardData?.services || [];
    const transactions = dashboardData?.recentTransactions || walletData?.wallet?.transactions || [];

    // Wallet summary
    const walletSummary = [
      {
        label: 'Số dư khả dụng',
        value: formatCurrency(wallet?.balance || wallet?.SoDuHienTai || 0),
        description: 'Có thể rút hoặc sử dụng để thanh toán dịch vụ',
      },
      {
        label: 'Tổng đã nạp',
        value: formatCurrency(wallet?.totalDeposit || stats.totalDeposit || 0),
        description: 'Tổng số tiền đã nạp vào ví',
      },
      {
        label: 'Tổng đã rút',
        value: formatCurrency(wallet?.totalWithdraw || stats.totalWithdraw || 0),
        description: 'Tổng số tiền đã rút từ ví',
      },
      {
        label: 'Đã dùng cho dịch vụ',
        value: formatCurrency(wallet?.totalPaid || stats.totalPaid || 0),
        description: 'Tổng số tiền đã thanh toán cho dịch vụ',
      },
    ];

    // Performance indicators
    const completedServices = stats.completed || services.filter(
      (s) => s.TrangThai === 'hoan-thanh'
    ).length;
    const activeServices = stats.active || services.filter(
      (s) => s.TrangThai === 'da-nhan' || s.TrangThai === 'dang-xu-ly'
    ).length;
    const pendingServices = stats.pending || services.filter(
      (s) => s.TrangThai === 'cho-duyet'
    ).length;

    const performanceIndicators = [
      {
        label: 'Tổng dịch vụ',
        value: (stats.total || services.length).toString(),
        trend: `${completedServices} đã hoàn thành`,
      },
      {
        label: 'Đang thực hiện',
        value: activeServices.toString(),
        trend: `${pendingServices} đang chờ`,
      },
      {
        label: 'Tổng giao dịch',
        value: (stats.totalTransactions || transactions.length).toString(),
        trend: 'Tất cả giao dịch',
      },
    ];

    console.log('Dashboard services data:', services);
    console.log('Services with TrangThai:', services.map(s => ({
      id: s._id,
      title: s.TenDichVu,
      TrangThai: s.TrangThai,
      createdAt: s.createdAt,
      hasMember: !!s.ThanhVien
    })));

    // Upcoming tasks (show all recent requests for history)
    let upcomingTasks = services
      .filter((s) => {
        // Show all requests regardless of status for complete history
        return true; // Show everything for debugging
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by newest first
      .slice(0, 5); // Show only 5 most recent

    // If no tasks, show most recent services
    if (upcomingTasks.length === 0) {
      upcomingTasks = services.slice(0, 5); // Show more services for better history
    }

    console.log('Upcoming tasks before map:', upcomingTasks);

    upcomingTasks = upcomingTasks.map((service) => {
        console.log('Mapping service:', service.TenDichVu, 'TrangThai:', service.TrangThai);
        
        const statusText = service.TrangThai === 'da-nhan' ? 'Đã nhận' : 
                           service.TrangThai === 'dang-xu-ly' ? 'Đang xử lý' : 
                           service.TrangThai === 'cho-xac-nhan-hoan-thanh' ? '🎉 Chờ bạn xác nhận hoàn thành' :
                           service.TrangThai === 'hoan-thanh' ? (service.UserDaXacNhan ? '✅ Đã xác nhận' : '🎉 Hoàn thành - Chờ xác nhận') :
                           service.TrangThai === 'huy-bo' ? 'Đã hủy' :
                           service.TrangThai === 'cho-duyet' ? 'Chờ duyệt' :
                           service.TrangThai || 'Không xác định';
        
        console.log('Status text:', statusText);
        
        return {
          title: service.TenDichVu || service.Ten || 'Dịch vụ',
          time: formatDate(service.createdAt),
          location: service.DiaChi || 'Chưa có địa chỉ',
          status: statusText,
          priority: service.TrangThai === 'cho-xac-nhan-hoan-thanh' ? 'high' : // User confirmation needed
                   service.TrangThai === 'hoan-thanh' && !service.UserDaXacNhan ? 'high' : // User confirmation needed
                   service.TrangThai === 'cho-duyet-hoan-thanh' ? 'medium' : // Pending admin approval
                   service.TrangThai === 'dang-thuc-hien' ? 'medium' : // In progress
                   'low', // Normal priority
          serviceId: service._id,
          needsConfirmation: service.TrangThai === 'cho-xac-nhan-hoan-thanh',
          memberInfo: service.ThanhVienHoanThanh ? {
            name: service.ThanhVien?.Ten || 'Thành viên',
            completedAt: service.ThanhVienHoanThanh.ngayHoanThanh,
            memberRating: service.ThanhVienHoanThanh.danhGia,
            memberNotes: service.ThanhVienHoanThanh.ghiChu
          } : null
        };
    });

    const activityFeed = transactions.slice(0, 5).map((tx) => {
      let title = '';
      let detail = '';

      // NEW: Use new transaction field names from StatisticsService
      const txType = tx.type || tx.Loai;
      const txAmount = tx.amountFormatted || formatCurrency(tx.amount || tx.SoTien);
      const txDescription = tx.description || tx.MoTa;

      switch (txType) {
        case 'deposit':
          title = 'Đã nạp tiền vào ví';
          detail = `Số tiền: ${txAmount}`;
          break;
        case 'withdraw':
          title = 'Đã rút tiền từ ví';
          detail = `Số tiền: ${txAmount}`;
          break;
        case 'commission_payment':
          title = 'Nhận thanh toán hoa hồng';
          detail = `Số tiền: ${txAmount}`;
          break;
        case 'service_payment':
          title = 'Thanh toán dịch vụ';
          detail = `Số tiền: ${txAmount}`;
          break;
        default:
          title = 'Giao dịch mới';
          detail = txDescription || 'Không có mô tả';
      }

      return {
        title,
        timestamp: getTimeAgo(tx.date || tx.completedAt || tx.NgayGiaoDich || tx.createdAt),
        detail,
        status: tx.status || tx.TrangThai === 'success' ? 'Thành công' : tx.status || tx.TrangThai === 'pending' ? 'Đang xử lý' : 'Thất bại',
        id: tx._id,
      };
    });

    return {
      walletSummary,
      performanceIndicators,
      upcomingTasks,
      activityFeed,
    };
  };

  const metrics = calculateMetrics();
  const displayName = user?.name || user?.HoTen || 'Thành viên F-Service';
  const roleLabel = user?.role === 'admin' ? 'Quản trị' : user?.role === 'member' ? 'Thành viên ủy thác' : 'Người dùng';

  if (loading) {
    return (
      <div className="dashboard dashboard--loading app-main__centered">
        <div className="dashboard__loader">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard app-main__centered">
        <div className="dashboard__error">
          <p>{error}</p>
          <button onClick={loadDashboardData} className="btn btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AlertContainer />
      <div className="dashboard app-main__centered">
        <section className="dashboard__hero">
        <div className="dashboard__hero-content">
          <div className="dashboard__hero-header">
            <span className="dashboard__badge">Xin chào, {displayName} 👋</span>
          </div>
          <h1>
            Tạo dịch vụ, xem dịch vụ, quản lý ví
            <span> nhanh gọn</span>
          </h1>
          <p>
            Vai trò hiện tại: <strong>{roleLabel}</strong>. Hãy đưa ra yêu cầu dịch vụ mà bạn mong muốn để chúng tôi có thể hoàn thiện giúp bạn
          </p>
          <div className="dashboard__hero-actions">
            <Link to="/requests/new" className="btn btn-primary">
              Tạo yêu cầu mới
            </Link>
            <Link to="/my-requests" className="dashboard__link">
              Xem tất cả yêu cầu →
            </Link>
            <Link to="/wallet" className="btn btn-outline">
              Quản lý ví giao dịch
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin/dashboard" className="btn btn-secondary">
                📊 Quản trị hệ thống
              </Link>
            )}
          </div>
        </div>
        <div className="dashboard__hero-cards">
          {metrics.performanceIndicators.map((item, index) => (
            <article key={index} className="dashboard__metric-card">
              <span className="dashboard__metric-label">{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.trend}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard__section">
        <div className="dashboard__wallet">
          <header>
            <h2>Ví giao dịch & Doanh thu</h2>
            <p>Kiểm soát dòng tiền chi tiết theo từng trạng thái ủy thác.</p>
          </header>
          <div className="dashboard__wallet-grid">
            {metrics.walletSummary.map((item, index) => (
              <article key={index} className="dashboard__wallet-card">
                <span className="dashboard__wallet-label">{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
        <aside className="dashboard__compliance">
          <h3>Thông tin tài khoản</h3>
          <ul>
            <li className="dashboard__compliance-item dashboard__compliance-item--success">
              <span>Trạng thái tài khoản</span>
              <strong>Hoạt động</strong>
            </li>
            <li className="dashboard__compliance-item dashboard__compliance-item--success">
              <span>Email xác minh</span>
              <strong>{user?.email || user?.Email || 'Chưa xác minh'}</strong>
            </li>
            <li className="dashboard__compliance-item dashboard__compliance-item--warning">
              <span>Cập nhật hồ sơ</span>
              <strong>Khuyến nghị</strong>
            </li>
          </ul>
          <Link to="/profile" className="dashboard__link">
            Cập nhật ngay →
          </Link>
        </aside>
      </section>

      <section className="dashboard__section dashboard__section--split">
        <div className="dashboard__tasks">
          <header>
            <h2>Lịch sử yêu cầu</h2>
            <p>Xem thông tin yêu câu.</p>
          </header>
          {metrics.upcomingTasks.length > 0 ? (
            <ul className="dashboard__task-list">
              {metrics.upcomingTasks.map((task) => (
                <li key={task.id} className="dashboard__task-card">
                  <div className="dashboard__task-header">
                    <span className="dashboard__tier-tag dashboard__tier-tag--skilled">
                      {task.tier}
                    </span>
                    <span className="dashboard__task-status">{task.status}</span>
                  </div>
                  <h3>{task.title}</h3>
                  <p>{task.time}</p>
                  <p>{task.location}</p>
                  {task.needsConfirmation && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ 
                        padding: '10px', 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: '8px',
                        marginBottom: '10px'
                      }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>
                          🎉 Thành viên đã hoàn thành!
                        </h4>
                        {task.memberInfo && (
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                            <p style={{ margin: '0 0 4px 0' }}>
                              <strong>Thành viên:</strong> {task.memberInfo.name}
                            </p>
                            <p style={{ margin: '0 0 4px 0' }}>
                              <strong>Hoàn thành lúc:</strong> {new Date(task.memberInfo.completedAt).toLocaleString('vi-VN')}
                            </p>
                            {task.memberInfo.memberRating && (
                              <p style={{ margin: '0 0 4px 0' }}>
                                <strong>Đánh giá thành viên:</strong> {'⭐'.repeat(task.memberInfo.memberRating)}
                              </p>
                            )}
                            {task.memberInfo.memberNotes && (
                              <p style={{ margin: '0 0 4px 0' }}>
                                <strong>Ghi chú:</strong> {task.memberInfo.memberNotes}
                              </p>
                            )}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleConfirmService(task.serviceId, true)}
                            style={{
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.875rem'
                            }}
                          >
                            ✅ Xác nhận hoàn thành
                          </button>
                          <button
                            onClick={() => handleConfirmService(task.serviceId, false)}
                            style={{
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.875rem'
                            }}
                          >
                            ❌ Yêu cầu làm lại
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <a 
                    href={`/requests/${task.id}`}
                    className="dashboard__link"
                    style={{ 
                      display: 'inline-block',
                      padding: '0.6rem 1.2rem',
                      backgroundColor: '#667eea',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '0.375rem',
                      transition: 'all 0.3s ease',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      boxShadow: '0 2px 4px rgba(102, 126, 234, 0.2)',
                      textAlign: 'center',
                      minWidth: '120px',
                      pointerEvents: 'auto',
                      zIndex: 10,
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#5a6fd8';
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#667eea';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 4px rgba(102, 126, 234, 0.2)';
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Navigate to request:', task.id);
                      window.location.href = `/requests/${task.id}`;
                    }}
                  >
                    Xem chi tiết →
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="dashboard__empty">
              <p>Chưa có yêu cầu nào đang thực hiện</p>
            </div>
          )}
        </div>
        <div className="dashboard__actions">
          <h2>Hành động nhanh</h2>
          <div className="dashboard__actions-grid">
            {quickActions.map((item, index) => (
              <article key={index} className="dashboard__action-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <Link to={item.action.to} className="dashboard__link">
                  {item.action.label} →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard__section dashboard__section--resources">
        <div className="dashboard__activity">
          <header>
            <h2>Hoạt động gần đây</h2>
            <p>Cập nhật tức thời từ hệ thống và khách hàng.</p>
          </header>
          {metrics.activityFeed.length > 0 ? (
            <ul className="dashboard__activity-feed">
              {metrics.activityFeed.map((activity) => (
                <li key={activity.id} className="dashboard__activity-item">
                  <div>
                    <strong>{activity.title}</strong>
                    <p>{activity.detail}</p>
                  </div>
                  <span>{activity.timestamp}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="dashboard__empty">
              <p>Chưa có hoạt động nào</p>
            </div>
          )}
        </div>
        <aside className="dashboard__knowledge">
          <h2>Trung tâm kiến thức</h2>
          <ul>
            {knowledgeCenter.map((item, index) => (
              <li key={index}>
                <h3>{item.title}</h3>
                <Link to={item.to} className="dashboard__link">
                  {item.linkLabel} →
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
    </>
  );
}

export default Dashboard;
