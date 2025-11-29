// frontend/src/utils/authUtils.js

export const authUtils = {
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = authUtils.getToken();
    const userData = authUtils.getUserData();
    
    if (!token || token.startsWith('mock_token_')) {
      return false;
    }
    
    // Check if userData exists and is valid
    if (!userData) {
      return false;
    }
    
    try {
      return userData && userData.role;
    } catch (e) {
      console.warn('❌ Corrupted userData, clearing...');
      authUtils.clearAuth();
      return false;
    }
  },

  // Get token with fallback to session storage
  getToken: () => {
    let token = localStorage.getItem('token');
    if (!token) {
      // Fallback to session storage
      token = sessionStorage.getItem('token');
      if (token) {
        // Restore to localStorage
        localStorage.setItem('token', token);
        sessionStorage.removeItem('token');
      }
    }
    return token;
  },

  // Get user data with fallback to session storage
  getUserData: () => {
    let userDataStr = localStorage.getItem('userData');
    if (!userDataStr) {
      // Fallback to session storage
      userDataStr = sessionStorage.getItem('userData');
      if (userDataStr) {
        // Restore to localStorage
        localStorage.setItem('userData', userDataStr);
        sessionStorage.removeItem('userData');
      }
    }
    
    if (!userDataStr) return null;
    
    try {
      return JSON.parse(userDataStr);
    } catch (e) {
      console.warn('❌ Corrupted userData, clearing...');
      authUtils.clearAuth();
      return null;
    }
  },

  // Set authentication data with backup to session storage
  setAuth: (token, userData) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Backup to session storage
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('userData', JSON.stringify(userData));
      
      console.log('✅ Authentication data saved with backup');
    } catch (e) {
      console.error('❌ Failed to save auth data:', e);
      // Fallback to session storage only
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('userData', JSON.stringify(userData));
    }
  },

  // Check if token is expired
  isTokenExpired: (token) => {
    if (!token || token.startsWith('mock_token_')) {
      return true;
    }

    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const currentTime = Date.now() / 1000;
        return payload.exp && payload.exp < currentTime;
      }
    } catch (e) {
      return true; // Assume expired if validation fails
    }
    return false;
  },

  // Get token expiration time
  getTokenExpiration: (token) => {
    if (!token || token.startsWith('mock_token_')) {
      return null;
    }

    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        return payload.exp ? new Date(payload.exp * 1000) : null;
      }
    } catch (e) {
      return null;
    }
    return null;
  },

  // Clear authentication data
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userData');
  },

  // Validate and refresh authentication
  validateAuth: () => {
    const token = authUtils.getToken();
    const userData = authUtils.getUserData();
    
    if (!token) {
      return false;
    }

    if (token.startsWith('mock_token_')) {
      authUtils.clearAuth();
      return false;
    }

    // Check userData exists and is valid
    if (!userData) {
      authUtils.clearAuth();
      return false;
    }

    try {
      // Handle corrupted localStorage
      if (!userData) {
        console.warn('❌ Corrupted userData, cleaning up...');
        authUtils.clearAuth();
        return false;
      }
      
      // Check for valid role
      if (!userData.role) {
        console.warn('❌ Invalid role data - missing role, clearing storage');
        authUtils.clearAuth();
        return false;
      }
      
    } catch (e) {
      console.warn('❌ Corrupted userData, cleaning up gracefully:', e);
      authUtils.clearAuth();
      return false;
    }

    if (authUtils.isTokenExpired(token)) {
      authUtils.clearAuth();
      return false;
    }

    return true;
  },

  // Handle authentication errors
  handleAuthError: (error, redirectUrl = '/login') => {
    const status = error.response?.status;
    
    if (status === 401 || status === 403) {
      authUtils.clearAuth();
      window.location.href = redirectUrl;
      return true;
    }
    return false;
  }
};

export default authUtils;
