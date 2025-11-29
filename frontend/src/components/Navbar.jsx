// frontend/src/components/Navbar.jsx
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  
  // Check if current path is active
  const isActivePath = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          🚀 F-Service
        </Link>
      </div>
      <div className="navbar-nav">
        {user ? (
          <>
            <span className="user-greeting" title={user.name}>
              👋 Xin chào, {user.name}
            </span>
            {user.role === 'admin' ? (
              <>
                <Link 
                  to="/admin/dashboard" 
                  className={`nav-link ${isActivePath('/admin/dashboard') ? 'active' : ''}`}
                >
                  📊 Admin Dashboard
                </Link>
                <Link 
                  to="/admin/users" 
                  className={`nav-link ${isActivePath('/admin/users') ? 'active' : ''}`}
                >
                  👥 Quản lý Users
                </Link>
                <Link 
                  to="/admin/members" 
                  className={`nav-link ${isActivePath('/admin/members') ? 'active' : ''}`}
                >
                  🎯 Quản lý Members
                </Link>
                <Link 
                  to="/admin/services" 
                  className={`nav-link ${isActivePath('/admin/services') ? 'active' : ''}`}
                >
                  🛠️ Quản lý Dịch vụ
                </Link>
                <Link 
                  to="/admin/transactions" 
                  className={`nav-link ${isActivePath('/admin/transactions') ? 'active' : ''}`}
                >
                  💳 Quản lý Giao dịch
                </Link>
              </>
            ) : (
              <>
                {user.role === 'member' ? (
                 <Link 
                    to="/member/dashboard" 
                    className={`nav-link ${isActivePath('/member/dashboard') ? 'active' : ''}`}
                  >
                    🎯 Dashboard
                  </Link>
                ) : (
                  <Link 
                    to="/dashboard" 
                    className={`nav-link ${isActivePath('/dashboard') ? 'active' : ''}`}
                  >
                    📊 Dashboard
                  </Link>
                )}
                {user.role === 'user' && (
                  <>
                    <Link 
                      to="/requests/new" 
                      className={`nav-link ${isActivePath('/requests/new') ? 'active' : ''}`}
                    >
                      ➕ Tạo yêu cầu
                    </Link>
                    <Link 
                      to="/my-requests" 
                      className={`nav-link ${isActivePath('/my-requests') ? 'active' : ''}`}
                    >
                      📋 Yêu cầu của tôi
                    </Link>
                  </>
                )}
              </>
            )}
            {user.role !== 'admin' && (
              <>
                <Link 
                  to="/wallet" 
                  className={`nav-link ${isActivePath('/wallet') ? 'active' : ''}`}
                >
                  💳 Ví giao dịch
                </Link>
                <Link 
                  to="/profile" 
                  className={`nav-link ${isActivePath('/profile') ? 'active' : ''}`}
                >
                  👤 Profile
                </Link>
              </>
            )}
            <button 
              onClick={onLogout} 
              className="logout-btn"
              title="Đăng xuất khỏi hệ thống"
            >
              🚪 Đăng xuất
            </button>
          </>
        ) : (
          <>
            <Link 
              to="/login" 
              className={`nav-link ${isActivePath('/login') ? 'active' : ''}`}
            >
              🚪 Đăng nhập
            </Link>
            <Link 
              to="/register" 
              className={`nav-link ${isActivePath('/register') ? 'active' : ''}`}
            >
              📝 Đăng ký
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

