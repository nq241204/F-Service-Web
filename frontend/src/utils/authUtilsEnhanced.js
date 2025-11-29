// Enhanced authUtils with Cookie Fallback
// frontend/src/utils/authUtilsEnhanced.js

// Token cache to prevent multiple retrievals
let tokenCache = null;
let tokenCacheTime = 0;
const TOKEN_CACHE_DURATION = 1000; // 1 second - shorter but still effective

export const authUtilsEnhanced = {
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = authUtilsEnhanced.getToken();
    const userData = authUtilsEnhanced.getUserData();
    
    if (!token || token.startsWith('mock_token_')) {
      return false;
    }
    
    if (!userData) {
      return false;
    }
    
    try {
      return userData && userData.role;
    } catch (e) {
      console.warn('❌ Corrupted userData, clearing...');
      authUtilsEnhanced.clearAuth();
      return false;
    }
  },

  // Get token with multiple fallbacks
  getToken: () => {
    // Check cache first
    const now = Date.now();
    if (tokenCache && (now - tokenCacheTime) < TOKEN_CACHE_DURATION) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Token from cache:', tokenCache.substring(0, 20) + '...');
      }
      return tokenCache;
    }

    // Try localStorage first
    let token = localStorage.getItem('token');
    if (token) {
      // Backup to other storages
      authUtilsEnhanced.backupToken(token);
      
      // Update cache
      tokenCache = token;
      tokenCacheTime = now;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Token from localStorage:', token.substring(0, 20) + '...');
      }
      return token;
    }

    // Try sessionStorage
    token = sessionStorage.getItem('token');
    if (token) {
      localStorage.setItem('token', token);
      authUtilsEnhanced.backupToken(token);
      
      // Update cache
      tokenCache = token;
      tokenCacheTime = now;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Token from sessionStorage:', token.substring(0, 20) + '...');
      }
      return token;
    }

    // Try cookie
    token = authUtilsEnhanced.getCookie('token');
    if (token) {
      localStorage.setItem('token', token);
      authUtilsEnhanced.backupToken(token);
      
      // Update cache
      tokenCache = token;
      tokenCacheTime = now;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Token from cookie:', token.substring(0, 20) + '...');
      }
      return token;
    }

    return null;
  },

  // Get user data with multiple fallbacks
  getUserData: () => {
    // Try localStorage first
    let userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        authUtilsEnhanced.backupUserData(userDataStr);
        return userData;
      } catch (e) {
        console.warn('❌ Corrupted localStorage userData');
      }
    }

    // Try sessionStorage
    userDataStr = sessionStorage.getItem('userData');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        localStorage.setItem('userData', userDataStr);
        authUtilsEnhanced.backupUserData(userDataStr);
        return userData;
      } catch (e) {
        console.warn('❌ Corrupted sessionStorage userData');
      }
    }

    // Try cookie
    userDataStr = authUtilsEnhanced.getCookie('userData');
    if (userDataStr) {
      try {
        const userData = JSON.parse(decodeURIComponent(userDataStr));
        localStorage.setItem('userData', JSON.stringify(userData));
        sessionStorage.setItem('userData', JSON.stringify(userData));
        authUtilsEnhanced.backupUserData(userDataStr);
        return userData;
      } catch (e) {
        console.warn('❌ Corrupted cookie userData');
      }
    }

    return null;
  },

  // Set authentication data to all storages
  setAuth: (token, userData) => {
    try {
      // Store in all storages
      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('userData', JSON.stringify(userData));
      authUtilsEnhanced.setCookie('token', token, 7);
      authUtilsEnhanced.setCookie('userData', JSON.stringify(userData), 7);
      
      // Update cache
      tokenCache = token;
      tokenCacheTime = Date.now();
      
      // Backup to IndexedDB
      authUtilsEnhanced.backupToIndexedDB(token, userData);
      
      console.log('✅ Authentication data saved to all storages');
    } catch (e) {
      console.error('❌ Failed to save auth data:', e);
    }
  },

  // Clear all authentication data
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userData');
    authUtilsEnhanced.deleteCookie('token');
    authUtilsEnhanced.deleteCookie('userData');
    authUtilsEnhanced.clearIndexedDB();
    
    // Clear token cache
    tokenCache = null;
    tokenCacheTime = 0;
    
    // Clear request cache
    try {
      // Dynamic import to avoid circular dependency
      import('../config/api.js').then(({ clearRequestTokenCache }) => {
        clearRequestTokenCache();
      }).catch(() => {
        // Ignore if import fails
      });
    } catch (e) {
      // Ignore if import fails
    }
  },

  // Cookie helpers
  setCookie: (name, value, days) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    const cookieString = name + '=' + encodeURIComponent(value) + '; expires=' + expires.toUTCString() + '; path=/; SameSite=Lax';
    document.cookie = cookieString;
  },

  getCookie: (name) => {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  },

  deleteCookie: (name) => {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  },

  // Backup helpers
  backupToken: (token) => {
    try {
      // Store in multiple places as backup
      sessionStorage.setItem('backup_token', token);
      authUtilsEnhanced.setCookie('backup_token', token, 7);
    } catch (e) {
      console.warn('❌ Failed to backup token:', e);
    }
  },

  backupUserData: (userDataStr) => {
    try {
      sessionStorage.setItem('backup_userData', userDataStr);
      authUtilsEnhanced.setCookie('backup_userData', userDataStr, 7);
    } catch (e) {
      console.warn('❌ Failed to backup userData:', e);
    }
  },

  // IndexedDB backup for maximum persistence
  backupToIndexedDB: async (token, userData) => {
    try {
      if ('indexedDB' in window) {
        const request = indexedDB.open('AuthBackup', 1);
        
        request.onerror = () => console.warn('❌ IndexedDB backup failed');
        
        request.onsuccess = (event) => {
          try {
            const db = event.target.result;
            
            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains('auth')) {
              console.warn('🔄 Auth store not found, closing and reopening...');
              db.close();
              
              // Retry with version upgrade
              setTimeout(() => {
                const retryRequest = indexedDB.open('AuthBackup', 2);
                retryRequest.onsuccess = (retryEvent) => {
                  const retryDb = retryEvent.target.result;
                  const transaction = retryDb.transaction(['auth'], 'readwrite');
                  const store = transaction.objectStore('auth');
                  store.put({ id: 'main', token, userData, timestamp: Date.now() });
                  console.log('✅ IndexedDB backup successful (retry)');
                };
                retryRequest.onerror = () => console.warn('❌ IndexedDB retry failed');
              }, 100);
              return;
            }
            
            const transaction = db.transaction(['auth'], 'readwrite');
            const store = transaction.objectStore('auth');
            
            store.put({ id: 'main', token, userData, timestamp: Date.now() });
            console.log('✅ IndexedDB backup successful');
          } catch (e) {
            console.warn('❌ IndexedDB transaction error:', e);
          }
        };
        
        request.onupgradeneeded = (event) => {
          try {
            const db = event.target.result;
            console.log('🔄 IndexedDB upgrade needed - creating auth store...');
            
            if (!db.objectStoreNames.contains('auth')) {
              const store = db.createObjectStore('auth');
              console.log('✅ Auth object store created successfully');
            }
          } catch (e) {
            console.warn('❌ IndexedDB upgrade error:', e);
          }
        };
      }
    } catch (e) {
      console.warn('❌ IndexedDB not available:', e);
    }
  },

  clearIndexedDB: () => {
    try {
      if ('indexedDB' in window) {
        const request = indexedDB.open('AuthBackup', 1);
        request.onsuccess = (event) => {
          try {
            const db = event.target.result;
            
            // Check if object store exists
            if (!db.objectStoreNames.contains('auth')) {
              return;
            }
            
            const transaction = db.transaction(['auth'], 'readwrite');
            const store = transaction.objectStore('auth');
            store.delete('main');
          } catch (e) {
            console.warn('❌ IndexedDB clear error:', e);
          }
        };
        request.onerror = () => console.warn('❌ IndexedDB clear failed');
      }
    } catch (e) {
      console.warn('❌ Failed to clear IndexedDB:', e);
    }
  },

  // Restore from IndexedDB
  restoreFromIndexedDB: async () => {
    try {
      if ('indexedDB' in window) {
        return new Promise((resolve) => {
          const request = indexedDB.open('AuthBackup', 1);
          
          request.onsuccess = (event) => {
            try {
              const db = event.target.result;
              
              // Check if object store exists
              if (!db.objectStoreNames.contains('auth')) {
                resolve(null);
                return;
              }
              
              const transaction = db.transaction(['auth'], 'readonly');
              const store = transaction.objectStore('auth');
              
              const getRequest = store.get('main');
              getRequest.onsuccess = () => {
                const result = getRequest.result;
                if (result) {
                  resolve({ token: result.token, userData: result.userData });
                } else {
                  resolve(null);
                }
              };
              
              getRequest.onerror = () => resolve(null);
            } catch (e) {
              console.warn('❌ IndexedDB restore error:', e);
              resolve(null);
            }
          };
          
          request.onerror = () => resolve(null);
        });
      }
      return null;
    } catch (e) {
      console.warn('❌ Failed to restore from IndexedDB:', e);
      return null;
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
      return true;
    }
    return false;
  },

  // Validate and refresh authentication
  validateAuth: async () => {
    const token = authUtilsEnhanced.getToken();
    const userData = authUtilsEnhanced.getUserData();
    
    if (!token) {
      // Try to restore from IndexedDB
      const backup = await authUtilsEnhanced.restoreFromIndexedDB();
      if (backup) {
        authUtilsEnhanced.setAuth(backup.token, backup.userData);
        return true;
      }
      return false;
    }

    if (token.startsWith('mock_token_')) {
      authUtilsEnhanced.clearAuth();
      return false;
    }

    if (!userData) {
      authUtilsEnhanced.clearAuth();
      return false;
    }

    try {
      if (!userData.role) {
        authUtilsEnhanced.clearAuth();
        return false;
      }
    } catch (e) {
      authUtilsEnhanced.clearAuth();
      return false;
    }

    if (authUtilsEnhanced.isTokenExpired(token)) {
      authUtilsEnhanced.clearAuth();
      return false;
    }

    return true;
  },

  // Handle authentication errors
  handleAuthError: (error, redirectUrl = '/login') => {
    const status = error.response?.status;
    
    if (status === 401 || status === 403) {
      authUtilsEnhanced.clearAuth();
      window.location.href = redirectUrl;
      return true;
    }
    return false;
  }
};

export default authUtilsEnhanced;
