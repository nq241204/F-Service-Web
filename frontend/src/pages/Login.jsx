// frontend/src/pages/Login.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import { socialLoginService } from '../config/oauthConfig';
import Captcha, { MathCaptcha, useCaptchaValidation } from '../components/Captcha';
import { getErrorMessage } from '../utils/validationHelper';
import './css/Login.css';
import './css/LoginSocial.css';

const loginBenefits = [
  'Truy cập ví giao dịch và quản lý tài chính',
  'Đặt dịch vụ và theo dõi tiến độ ủy thác',
  'Nâng cấp VIP để hưởng ưu đãi đặc biệt',
];

function Login({ onLogin }) {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [useMathCaptcha, setUseMathCaptcha] = useState(true); // Use math captcha for development
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render trigger
  
  // CAPTCHA validation
  const { captchaToken, isCaptchaValid, handleCaptchaVerify, handleCaptchaExpire, resetCaptcha } = useCaptchaValidation();
  
  const navigate = useNavigate();

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (error) {
      console.log('🔍 Error state updated:', error);
      const timer = setTimeout(() => {
        console.log('🔍 Auto-clearing error message');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      console.log('🎯 Success state updated:', success);
      console.log('🎯 Success message should be visible now');
      const timer = setTimeout(() => {
        console.log('🎯 Auto-clearing success message');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Debug logging (remove in production)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🚀 Login component mounted');
      
      // Global click listener để debug
      const handleGlobalClick = (e) => {
        console.log('🌍 Global click:', e.target.tagName, e.target.className, e.target.textContent?.substring(0, 20));
      };
      
      document.addEventListener('click', handleGlobalClick);
      
      return () => {
        document.removeEventListener('click', handleGlobalClick);
      };
    }
  }, []); // Chạy 1 lần thôi!

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const provider = searchParams.get('provider');
    
    if (code && state && provider) {
      handleOAuthCallback(provider, code, state);
    }
  }, [searchParams]);

  const handleOAuthCallback = async (provider, code, state) => {
    try {
      setLoading(true);
      setError('');
      
      const result = await socialLoginService.handleCallback(provider, code, state);
      
      if (result.success) {
        setSuccess('Đăng nhập thành công! Đang chuyển hướng...');
        onLogin(result.user);
        
        setTimeout(() => {
          if (result.user.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (result.user.role === 'member') {
            navigate('/member/dashboard');
          } else {
            navigate('/dashboard');
          }
        }, 500);
      } else {
        setError(result.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setError('Đăng nhập thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    try {
      setError('');
      socialLoginService.initiateLogin(provider);
    } catch (err) {
      setError(`Không thể đăng nhập bằng ${provider}. Vui lòng thử lại.`);
    }
  };

  const handleChange = useCallback((e) => {
    console.log('📝 Input changed:', e.target.name, e.target.value);
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // Clear error when user starts typing
    setError('');
  }, []);

  const handleFocus = useCallback((e) => {
    console.log('🎯 Input focused:', e.target.name);
  }, []);

  const handleBlur = useCallback((e) => {
    console.log('👁️ Input blurred:', e.target.name, e.target.value);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    console.log('🚀 handleSubmit called!');
    e.preventDefault();
    console.log('🚀 Form prevented default');
    
    setError('');
    setSuccess('');
    console.log('🚀 States cleared');
    
    setLoading(true);
    console.log('🚀 Loading set to true');

    // Client validation
    console.log('🔍 Form data:', formData);
    
    if (!formData.email || !formData.password) {
      console.log('❌ Validation failed - missing fields');
      setError('Vui lòng điền đầy đủ email và mật khẩu!');
      setLoading(false);
      return;
    }

    if (!formData.email.includes('@')) {
      console.log('❌ Validation failed - invalid email');
      setError('Email không hợp lệ!');
      setLoading(false);
      return;
    }

    console.log('✅ Validation passed');

    // CAPTCHA validation (enable lại)
    console.log('🔍 Checking CAPTCHA validation...');
    console.log('🔍 isCaptchaValid:', isCaptchaValid);
    console.log('🔍 captchaToken:', captchaToken);
    
    if (!isCaptchaValid && !captchaToken) {
      console.log('❌ CAPTCHA validation failed - no valid token');
      setError('Vui lòng hoàn thành xác minh CAPTCHA!');
      setLoading(false);
      return;
    }
    
    console.log('✅ CAPTCHA validation passed');

    try {
      console.log('📝 Attempting login with:', formData.email);
      console.log('📝 Password provided:', formData.password ? 'YES' : 'NO');
      const result = await authService.login(formData.email, formData.password);
      console.log('📝 Login result:', result);
      console.log('📝 Result success:', result.success);
      console.log('📝 Result message:', result.message);
      
      if (result.success) {
        console.log('✅ Login successful for:', result.user.email);
        console.log('🎯 Setting success message...');
        setSuccess('Đăng nhập thành công! Đang chuyển hướng...');
        console.log('🎯 Success message set:', success);
        
        // Delay onLogin để user thấy success message
        setTimeout(() => {
          console.log('🎯 Calling onLogin callback after delay...');
          onLogin(result.user);
          console.log('🎯 onLogin callback called');
        }, 500); // 500ms delay để success message render
        
        // Redirect dự phòng (nếu App.jsx không redirect)
        console.log('🎯 Starting redirect timer...');
        setTimeout(() => {
          console.log('🎯 Redirect timer fired');
          if (result.user.role === 'admin') {
            console.log('🎯 Redirecting to admin dashboard');
            navigate('/admin/dashboard');
          } else if (result.user.role === 'member') {
            console.log('🎯 Redirecting to member dashboard');
            navigate('/member/dashboard');
          } else {
            console.log('🎯 Redirecting to user dashboard');
            navigate('/dashboard');
          }
        }, 4000); // Tăng delay lên 4 giây để user thấy success message
      } else {
        // Handle specific error messages from backend
        let errorMsg = result.message || 'Đăng nhập thất bại';
        
        // Show available emails for development (remove in production)
        if (result.availableEmails && result.availableEmails.length > 0) {
          errorMsg += `\n\nEmail có sẵn trong hệ thống:\n${result.availableEmails.join('\n')}`;
        }
        
        console.log('❌ Login failed - Setting error:', errorMsg);
        console.log('❌ Error state before:', error);
        setError(errorMsg);
        setForceUpdate(prev => prev + 1); // Force re-render
        console.log('❌ Error state after:', errorMsg);
        console.log('❌ Force update triggered:', forceUpdate + 1);
        
        // Reset CAPTCHA on login failure
        resetCaptcha();
        setCaptchaResetKey(prev => prev + 1);
      }
    } catch (err) {
      console.log('❌ Login error (catch block):', err);
      console.log('❌ Error response:', err.response?.data);
      console.log('❌ Error status:', err.response?.status);
      
      // Sử dụng validation helper để lấy thông báo lỗi rõ ràng
      const errorMessage = getErrorMessage(err);
      console.log('❌ Formatted error message:', errorMessage);
      setError(errorMessage);
      setForceUpdate(prev => prev + 1); // Force re-render
      console.log('❌ Force update triggered in catch block:', forceUpdate + 1);
      
      // Reset CAPTCHA on login failure
      resetCaptcha();
      setCaptchaResetKey(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  }, [formData, error, forceUpdate, onLogin, navigate, isCaptchaValid, resetCaptcha]);

  return (
    <div className="login app-main__centered">
      <div className="login__container">
        <div className="login__hero">
          <div className="login__intro">
            <span className="login__badge">Chào mừng trở lại</span>
            <h1>
              Đăng nhập vào <span>F-Service</span>
            </h1>
            <p>
              Kết nối với hệ sinh thái dịch vụ ủy thác chuyên nghiệp, quản lý giao dịch và tận
              hưởng các tiện ích độc quyền.
            </p>
            <ul className="login__benefits">
              {loginBenefits.map((benefit, index) => (
                <li key={index}>
                  <span className="login__check-icon">✓</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="login__form-card">
          <div className="login__form-header">
            <h2>Đăng nhập tài khoản</h2>
            <p>Nhập thông tin để truy cập hệ thống</p>
          </div>

            {error && (
              <div className="login__error">
                <div className="login__error-content">
                  <span className="login__error-icon">🚫</span>
                  <div style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>{error}</div>
                </div>
                <button 
                  className="login__error-close" 
                  onClick={() => setError('')}
                  aria-label="Đóng thông báo"
                >
                  ×
                </button>
              </div>
            )}

            {success && (
              <div className="login__success">
                <div className="login__success-content">
                  <span className="login__success-icon">✨</span>
                  <div style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>{success}</div>
                </div>
                <button 
                  className="login__success-close" 
                  onClick={() => setSuccess('')}
                  aria-label="Đóng thông báo"
                >
                  ×
                </button>
              </div>
            )}

            
          <form 
            onSubmit={handleSubmit} 
            className="login__form"
            onClick={() => console.log('📝 Form clicked')}
          >
            <div className="login__field">
              <label htmlFor="email" className="login__label">
                Email
              </label>
              <div className="login__input-wrapper">
                <span className="login__input-icon">✉</span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="your.email@example.com"
                  required
                  className="login__input"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login__field">
              <label htmlFor="password" className="login__label">
                Mật khẩu
              </label>
              <div className="login__input-wrapper">
                <span className="login__input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Nhập mật khẩu"
                  required
                  className="login__input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login__toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <div className="login__form-footer">
              <label className="login__remember">
                <input type="checkbox" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className="login__forgot">
                Quên mật khẩu?
              </Link>
            </div>

            {/* Social Login Buttons */}
            <div className="login__social-section">
              <div className="login__divider">
                <span>Hoặc đăng nhập với</span>
              </div>
              
              <div className="login__social-buttons">
                <button
                  type="button"
                  className="login__social-btn login__social-btn--google"
                  onClick={() => handleSocialLogin('google')}
                  disabled={loading}
                >
                  <span className="login__social-icon">🔷</span>
                  <span>Google</span>
                </button>
                
                <button
                  type="button"
                  className="login__social-btn login__social-btn--facebook"
                  onClick={() => handleSocialLogin('facebook')}
                  disabled={loading}
                >
                  <span className="login__social-icon">📘</span>
                  <span>Facebook</span>
                </button>
              </div>
            </div>

            {/* CAPTCHA */}
            <div className="login__captcha-section">
              {useMathCaptcha ? (
                <MathCaptcha 
                  onVerify={handleCaptchaVerify} 
                  resetKey={captchaResetKey}
                />
              ) : (
                <Captcha 
                  onVerify={handleCaptchaVerify} 
                  onExpire={handleCaptchaExpire}
                  resetKey={captchaResetKey}
                />
              )}
              
              {/* Toggle CAPTCHA type for development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="login__captcha-toggle">
                  <button
                    type="button"
                    className="login__captcha-toggle-btn"
                    onClick={() => {
                      setUseMathCaptcha(!useMathCaptcha);
                      resetCaptcha();
                      setCaptchaResetKey(prev => prev + 1);
                    }}
                  >
                    {useMathCaptcha ? '🔄 Dùng reCAPTCHA' : '🔄 Dùng Math CAPTCHA'}
                  </button>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="login__submit"
              onClick={() => {
                console.log('🔘 Submit button clicked!');
                alert('Button clicked! Check console for details.');
              }}
            >
              {loading ? (
                <>
                  <span className="login__spinner"></span>
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập
                  <span className="login__arrow">→</span>
                </>
              )}
            </button>
          </form>

          <div className="login__divider">
            <span>Hoặc</span>
          </div>

          <div className="login__register-link">
            <p>
              Chưa có tài khoản?{' '}
              <Link to="/register" className="login__register-btn">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

