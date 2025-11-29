// Frontend Security Utilities - Simplified for development
// Using localStorage directly to avoid crypto-js issues

console.log('🔧 Using simplified secureStorage for development');

// Fix for Vite environment variables
const getEnvVar = (key) => {
  return import.meta.env[key];
};

// Simple Storage using localStorage (no encryption for development)
class SimpleStorage {
  constructor() {
    console.log('🔧 Using SimpleStorage with localStorage');
  }

  setToken(token) {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('login_time', Date.now().toString());
      console.log('✅ Token saved to localStorage');
      return true;
    } catch (error) {
      console.error('Token storage error:', error);
      return false;
    }
  }

  getToken() {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Token from localStorage:', token ? 'exists' : 'null');
      return token;
    } catch (error) {
      console.error('Token retrieval error:', error);
      return null;
    }
  }

  removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('login_time');
    console.log('🗑️ Token removed from localStorage');
  }

  setUserData(userData) {
    try {
      localStorage.setItem('userData', JSON.stringify(userData));
      console.log('✅ UserData saved to localStorage:', userData.email);
      return true;
    } catch (error) {
      console.error('User data storage error:', error);
      return false;
    }
  }

  getUserData() {
    try {
      const userData = localStorage.getItem('userData');
      const parsed = userData ? JSON.parse(userData) : null;
      console.log('🔍 UserData from localStorage:', parsed ? parsed.email : 'null');
      return parsed;
    } catch (error) {
      console.error('User data retrieval error:', error);
      return null;
    }
  }
}

// Input Validation
export const validateInput = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  password: (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Mật khẩu phải có ít nhất ${minLength} ký tự`);
    }
    if (!hasUpperCase) {
      errors.push('Mật khẩu phải có ít nhất 1 chữ hoa');
    }
    if (!hasLowerCase) {
      errors.push('Mật khẩu phải có ít nhất 1 chữ thường');
    }
    if (!hasNumbers) {
      errors.push('Mật khẩu phải có ít nhất 1 số');
    }
    if (!hasSpecialChar) {
      errors.push('Mật khẩu phải có ít nhất 1 ký tự đặc biệt');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  phone: (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  },
  
  name: (name) => {
    return name.length >= 2 && name.length <= 50 && /^[a-zA-Z\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]+$/.test(name);
  }
};

// XSS Protection
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

// CSRF Protection
export const generateCSRFToken = () => {
  try {
    if (CryptoJS && CryptoJS.lib && CryptoJS.lib.WordArray) {
      return CryptoJS.lib.WordArray.random(16).toString();
    } else {
      // Fallback
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
};

// Rate Limiting for Frontend
class RateLimiter {
  constructor() {
    this.attempts = new Map();
  }

  isAllowed(action, limit = 5, windowMs = 15 * 60 * 1000) {
    const key = action;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }
    
    const attempts = this.attempts.get(key).filter(timestamp => timestamp > windowStart);
    
    if (attempts.length >= limit) {
      return { allowed: false, remainingTime: windowMs - (now - attempts[0]) };
    }
    
    attempts.push(now);
    this.attempts.set(key, attempts);
    
    return { allowed: true, remainingAttempts: limit - attempts.length };
  }
}

// Session Security
export const sessionSecurity = {
  checkSessionTimeout: () => {
    const loginTime = sessionStorage.getItem('login_time');
    if (!loginTime) return false;
    
    const sessionTimeout = 30 * 60 * 1000; // 30 minutes
    const currentTime = Date.now();
    
    if (currentTime - parseInt(loginTime) > sessionTimeout) {
      return false; // Session expired
    }
    
    return true;
  },
  
  extendSession: () => {
    sessionStorage.setItem('login_time', Date.now().toString());
  },
  
  startSessionMonitoring: () => {
    // Monitor user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const resetSessionTimeout = () => {
      sessionSecurity.extendSession();
    };
    
    events.forEach(event => {
      document.addEventListener(event, resetSessionTimeout, true);
    });
    
    // Check session every minute
    setInterval(() => {
      if (!sessionSecurity.checkSessionTimeout()) {
        // Log out user
        window.location.href = '/login?reason=session_expired';
      }
    }, 60000);
  }
};

// Password Strength Meter
export const calculatePasswordStrength = (password) => {
  let strength = 0;
  const feedback = [];
  
  // Length check
  if (password.length >= 8) strength += 1;
  else feedback.push('Thêm ít nhất 8 ký tự');
  
  if (password.length >= 12) strength += 1;
  
  // Character variety
  if (/[a-z]/.test(password)) strength += 1;
  else feedback.push('Thêm chữ thường');
  
  if (/[A-Z]/.test(password)) strength += 1;
  else feedback.push('Thêm chữ hoa');
  
  if (/[0-9]/.test(password)) strength += 1;
  else feedback.push('Thêm số');
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
  else feedback.push('Thêm ký tự đặc biệt');
  
  // Common patterns
  if (!/(.)\1{2,}/.test(password)) strength += 1; // No repeated characters
  else feedback.push('Tránh lặp lại ký tự');
  
  if (!/123|abc|qwe|password/i.test(password)) strength += 1; // No common patterns
  else feedback.push('Tránh các mẫu phổ biến');
  
  const strengthLevels = ['Rất yếu', 'Yếu', 'Trung bình', 'Khá', 'Mạnh', 'Rất mạnh'];
  const strengthLevel = strengthLevels[Math.min(strength, 5)];
  
  return {
    score: strength,
    level: strengthLevel,
    feedback,
    color: strength <= 2 ? '#ef4444' : strength <= 4 ? '#f59e0b' : '#10b981'
  };
};

// Safe JSON parse utility
export const safeJSONParse = (str, fallback = null) => {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch (error) {
    console.warn('JSON parse error:', error);
    return fallback;
  }
};

// Initialize simple storage
let secureStorageInstance;
try {
  secureStorageInstance = new SimpleStorage();
  if (import.meta.env.DEV) console.log('SimpleStorage initialized successfully');
} catch (error) {
  if (import.meta.env.DEV) console.error('Failed to initialize simple storage:', error);
  // Ultimate fallback
  secureStorageInstance = {
    setToken: (token) => localStorage.setItem('token', token),
    getToken: () => localStorage.getItem('token'),
    removeToken: () => localStorage.removeItem('token'),
    setUserData: (data) => localStorage.setItem('userData', JSON.stringify(data)),
    getUserData: () => {
      const data = localStorage.getItem('userData');
      try {
        return data ? JSON.parse(data) : null;
      } catch (e) {
        return null;
      }
    },
    removeUserData: () => localStorage.removeItem('userData')
  };
}

export const rateLimiter = new RateLimiter();

// Export secureStorage explicitly
export const secureStorage = secureStorageInstance;

// Export default security utilities
export default {
  secureStorage,
  validateInput,
  sanitizeInput,
  generateCSRFToken,
  rateLimiter,
  sessionSecurity,
  calculatePasswordStrength
};
