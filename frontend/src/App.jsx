// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import RegisterChoice from './pages/RegisterChoice';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminServices from './pages/AdminServices';
import AdminUsers from './pages/AdminUsers';
import AdminMembers from './pages/AdminMembers';
import AdminRoute from './components/AdminRoute';
import UserRoute from './components/UserRoute';
import MemberRoute from './components/MemberRoute';
import AdminTransactions from './pages/AdminTransactions';
import CreateRequest from './pages/CreateRequest';
import MyRequests from './pages/MyRequests';
import RequestDetail from './pages/RequestDetail';
import RequestProgress from './pages/RequestProgress';
import ServicesList from './pages/ServicesList';
import KnowledgeCenter from './pages/KnowledgeCenter';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import MemberRegisterNew from './pages/MemberRegisterNew';
import MemberDashboard from './pages/MemberDashboard';
import MemberProfile from './pages/MemberProfile';
import About from './pages/About';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import Help from './pages/Help';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Refund from './pages/Refund';
import Sitemap from './pages/Sitemap';
import Accessibility from './pages/Accessibility';
import Cookies from './pages/Cookies';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import authUtilsEnhanced from './utils/authUtilsEnhanced'; // Thêm import enhanced authUtils
import { authService } from './services/authService'; // Thêm import authService
import './App.css';

function AppContent() {
  const [user, setUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const navigate = useNavigate();

  // Check for existing user on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Sử dụng basic authUtils trước để avoid race condition
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const userDataStr = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        const path = window.location.pathname;
        
        // Debug logging
        if (import.meta.env.DEV) {
          console.log('🔍 App initialization - Token exists:', !!token);
          console.log('🔍 App initialization - UserData exists:', !!userDataStr);
          console.log('🔍 App initialization - Current path:', path);
        }
        
        // If user is authenticated but on login page, redirect to appropriate dashboard
        if (token && userDataStr && path === '/login') {
          try {
            const userData = JSON.parse(userDataStr);
            console.log('🔄 User authenticated but on login page - redirecting to dashboard for:', userData.email);
            
            if (userData.role === 'admin') {
              window.location.href = '/admin/dashboard';
            } else if (userData.role === 'member') {
              window.location.href = '/member/dashboard';
            } else {
              window.location.href = '/dashboard';
            }
            return;
          } catch (e) {
            console.warn('❌ Corrupted userData on login page:', e);
            authUtilsEnhanced.clearAuth();
            setUser(null);
            setAuthInitialized(true);
            return;
          }
        }
        
        // Early return if no auth data and not on protected route
        if (!token && !userDataStr) {
          // Check if we just logged out (check for logout flag in sessionStorage)
          const justLoggedOut = sessionStorage.getItem('justLoggedOut');
          if (justLoggedOut) {
            console.log('🔄 Just logged out - not restoring auth');
            sessionStorage.removeItem('justLoggedOut');
            setAuthInitialized(true);
            return;
          }
          
          // Try enhanced restore
          const isValid = await authUtilsEnhanced.validateAuth();
          if (isValid) {
            const restoredToken = authUtilsEnhanced.getToken();
            const restoredUserData = authUtilsEnhanced.getUserData();
            if (restoredToken && restoredUserData) {
              console.log('🔄 Authentication restored from backup for user:', restoredUserData.email);
              setUser(restoredUserData);
              return;
            }
          }
          
          // Only redirect if trying to access protected routes
          if (path.startsWith('/admin') || path.startsWith('/member') || path.startsWith('/dashboard')) {
            console.log('🔄 Redirecting to login - no auth data');
            window.location.href = '/login';
            return;
          }
        }
        
        // Handle case where userData exists but token is missing
        if (!token && userDataStr) {
          console.log('⚠️ User data exists but token missing - trying to restore...');
          
          // Try to restore from cookies
          const cookies = document.cookie.split(';');
          let tokenFromCookie = null;
          
          cookies.forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name === 'token') tokenFromCookie = value;
          });
          
          if (tokenFromCookie) {
            console.log('✅ Found token in cookies - restoring...');
            localStorage.setItem('token', tokenFromCookie);
            sessionStorage.setItem('token', tokenFromCookie);
            
            // Validate restored token
            try {
              const tokenParts = tokenFromCookie.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                const currentTime = Date.now() / 1000;
                
                if (payload.exp && payload.exp < currentTime) {
                  console.log('❌ Restored token expired');
                  authUtilsEnhanced.clearAuth();
                  setUser(null);
                  if (path.startsWith('/admin') || path.startsWith('/member') || path.startsWith('/dashboard')) {
                    window.location.href = '/login';
                  }
                  return;
                }
                
                // Token valid, set it
                const token = tokenFromCookie;
                console.log('✅ Token restored and valid');
                
                // Parse userData
                let userData = null;
                try {
                  userData = JSON.parse(userDataStr);
                } catch (e) {
                  console.warn('❌ Corrupted userData, clearing...');
                  authUtilsEnhanced.clearAuth();
                  setUser(null);
                  if (path.startsWith('/admin') || path.startsWith('/member') || path.startsWith('/dashboard')) {
                    window.location.href = '/login';
                  }
                  return;
                }
                
                if (userData && userData.role) {
                  console.log('✅ Authentication restored for user:', userData.email);
                  setUser(userData);
                  return;
                }
              }
            } catch (e) {
              console.warn('❌ Restored token invalid:', e);
            }
          }
          
          // No valid token found - clear and redirect
          console.log('❌ No valid token found - clearing auth');
          authUtilsEnhanced.clearAuth();
          setUser(null);
          if (path.startsWith('/admin') || path.startsWith('/member') || path.startsWith('/dashboard')) {
            window.location.href = '/login';
          }
          return;
        }
        
        // Clear mock tokens on app load
        if (token && token.startsWith('mock_token_')) {
          console.log('🧹 Clearing mock token on app load');
          authUtilsEnhanced.clearAuth();
          setUser(null);
          if (path.startsWith('/admin') || path.startsWith('/member')) {
            window.location.href = '/login';
          }
          return;
        }
        
        // Parse and validate user data
        let userData = null;
        if (userDataStr) {
          try {
            userData = JSON.parse(userDataStr);
          } catch (e) {
            console.warn('❌ Corrupted userData, clearing...');
            authUtilsEnhanced.clearAuth();
            setUser(null);
            if (path.startsWith('/admin') || path.startsWith('/member') || path.startsWith('/dashboard')) {
              window.location.href = '/login';
            }
            return;
          }
        }
        
        // Check token expiration
        if (token) {
          try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const currentTime = Date.now() / 1000;
              
              if (payload.exp && payload.exp < currentTime) {
                console.log('⏰ Token expired, clearing auth');
                authUtilsEnhanced.clearAuth();
                setUser(null);
                if (path.startsWith('/admin') || path.startsWith('/member') || path.startsWith('/dashboard')) {
                  window.location.href = '/login';
                }
                return;
              }
            }
          } catch (e) {
            console.warn('❌ Token validation failed:', e);
            authUtilsEnhanced.clearAuth();
            setUser(null);
            if (path.startsWith('/admin') || path.startsWith('/member') || path.startsWith('/dashboard')) {
              window.location.href = '/login';
            }
            return;
          }
        }
        
        // Validate and set user
        if (token && userData && userData.role) {
          console.log('✅ Authentication restored for user:', userData.email);
          setUser(userData);
        } else if (token && userData) {
          console.warn('❌ Invalid role data - missing role, clearing storage');
          authUtilsEnhanced.clearAuth();
          setUser(null);
          if (path.startsWith('/admin') || path.startsWith('/member') || path.startsWith('/dashboard')) {
            window.location.href = '/login';
          }
        } else {
          console.log('ℹ️ No valid authentication data found');
          setUser(null);
          
          // Only redirect if trying to access protected routes
          if (path.startsWith('/admin') || path.startsWith('/member') || path.startsWith('/dashboard')) {
            console.log('🔄 Redirecting to login - invalid auth data');
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authUtilsEnhanced.clearAuth();
        setUser(null);
        const path = window.location.pathname;
        if (path.startsWith('/admin') || path.startsWith('/member') || path.startsWith('/dashboard')) {
          window.location.href = '/login';
        }
      }
    };

    // Initialize immediately
    initializeAuth();
    
    // Also set up a storage event listener for cross-tab synchronization
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'userData') {
        initializeAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    
    // Chuyển hướng dựa trên role
    if (userData.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (userData.role === 'member') {
      navigate('/member/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      // Use authService for consistent logout behavior
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback to manual logout
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userData');
      window.location.href = '/';
    }
  };

  return (
    <ErrorBoundary>
      <div className="App">
        <Navbar user={user} onLogout={handleLogout} />
        <Routes>
            <Route index element={<Home />} />
            <Route path="/register-choice" element={<RegisterChoice />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
            
            {/* Admin routes FIRST */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute user={user}>
                  <Navigate to="/admin/dashboard" replace />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/" 
              element={
                <AdminRoute user={user}>
                  <Navigate to="/admin/dashboard" replace />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <AdminRoute user={user}>
                  <AdminDashboard user={user} />
                </AdminRoute>
              } 
            />
            
            {/* Other Admin routes */}
            <Route 
              path="/admin/services" 
              element={
                <AdminRoute user={user}>
                  <AdminServices user={user} />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <AdminRoute user={user}>
                  <AdminUsers user={user} />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/members" 
              element={
                <AdminRoute user={user}>
                  <AdminMembers user={user} />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/transactions" 
              element={
                <AdminRoute user={user}>
                  <AdminTransactions user={user} />
                </AdminRoute>
              } 
            />
            
            {/* Public routes */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/help" element={<Help />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="/sitemap" element={<Sitemap />} />
            <Route path="/accessibility" element={<Accessibility />} />
            <Route path="/cookies" element={<Cookies />} />

            {/* User routes AFTER */}
            <Route 
              path="/dashboard" 
              element={
                <UserRoute user={user}>
                  <Dashboard user={user} />
                </UserRoute>
              } 
            />
            <Route 
              path="/requests/new" 
              element={
                <ErrorBoundary>
                  <UserRoute user={user}>
                    <CreateRequest user={user} />
                  </UserRoute>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/my-requests" 
              element={
                <ErrorBoundary>
                  <UserRoute user={user}>
                    <MyRequests user={user} />
                  </UserRoute>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/requests/:id" 
              element={
                <ErrorBoundary>
                  <UserRoute user={user}>
                    <RequestDetail user={user} />
                  </UserRoute>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/requests/:id/progress" 
              element={
                <ErrorBoundary>
                  <UserRoute user={user}>
                    <RequestProgress user={user} />
                  </UserRoute>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/services" 
              element={
                <ErrorBoundary>
                  <ServicesList user={user} />
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/knowledge" 
              element={
                <ErrorBoundary>
                  <UserRoute user={user}>
                    <KnowledgeCenter />
                  </UserRoute>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/wallet" 
              element={
                <ErrorBoundary>
                  <UserRoute user={user}>
                    <Wallet user={user} />
                  </UserRoute>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ErrorBoundary>
                  <UserRoute user={user}>
                    <Profile user={user} />
                  </UserRoute>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/history" 
              element={
                <UserRoute user={user}>
                  <div style={{padding: '40px', textAlign: 'center'}}><h1>History Page - Coming Soon</h1><Link to="/dashboard">← Back</Link></div>
                </UserRoute>
              } 
            />
            <Route 
              path="/test-admin" 
              element={
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <h1>Admin Test Page</h1>
                  <p>Current user: {JSON.stringify(user)}</p>
                  <p>User role: {user?.role}</p>
                  <p>Is admin: {user?.role === 'admin' ? 'YES' : 'NO'}</p>
                  {import.meta.env.DEV && <button onClick={() => {console.log('User:', user);}}>Debug Info</button>}
                  <br /><br />
                  <a href="/admin/dashboard">Go to Admin Dashboard</a>
                  <br /><br />
                  <a href="/dashboard">Go to User Dashboard</a>
                </div>
              } 
            />
            <Route 
              path="/test-dashboard" 
              element={
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <h1>Test Dashboard Route</h1>
                  <p>User state: {JSON.stringify(user)}</p>
                  <p>Token: {authUtilsEnhanced.getToken() || 'null'}</p>
                  {import.meta.env.DEV && <button onClick={() => {console.log('User:', user);}}>Debug Info</button>}
                </div>
              } 
            />
            
            {/* Member routes */}
            <Route 
              path="/member/dashboard" 
              element={
                <MemberRoute user={user}>
                  <MemberDashboard user={user} />
                </MemberRoute>
              } 
            />
            <Route 
              path="/member/profile" 
              element={
                <MemberRoute user={user}>
                  <MemberProfile user={user} />
                </MemberRoute>
              } 
            />
            <Route path="/member/register" element={<MemberRegisterNew />} />
            
            {/* Test routes */}
          </Routes>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
