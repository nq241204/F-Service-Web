import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Cleanup storage on startup
const cleanupStorage = () => {
  if (import.meta.env.DEV) console.log('Cleaning up storage...');
  
  // Clear potentially corrupted data - but skip JWT tokens
  const jsonKeysToCheck = ['userData', 'auth_token', 'user_data'];
  const tokenKeys = ['token']; // JWT tokens are not JSON
  
  // Check JSON data
  jsonKeysToCheck.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        JSON.parse(value); // Test if valid JSON
      }
    } catch (error) {
      if (import.meta.env.DEV) console.warn(`Removing corrupted ${key} from localStorage`);
      localStorage.removeItem(key);
    }
    
    try {
      const value = sessionStorage.getItem(key);
      if (value) {
        JSON.parse(value); // Test if valid JSON
      }
    } catch (error) {
      if (import.meta.env.DEV) console.warn(`Removing corrupted ${key} from sessionStorage`);
      sessionStorage.removeItem(key);
    }
  });
  
  // Check JWT tokens differently
  tokenKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        // JWT tokens should have 3 parts separated by dots
        const parts = value.split('.');
        if (parts.length !== 3) {
          if (import.meta.env.DEV) console.warn(`Removing invalid ${key} from localStorage`);
          localStorage.removeItem(key);
        } else {
          // Try to parse the payload to check if valid
          try {
            JSON.parse(atob(parts[1]));
          } catch (e) {
            if (import.meta.env.DEV) console.warn(`Removing corrupted ${key} from localStorage`);
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.warn(`Error checking ${key} in localStorage:`, error);
    }
    
    try {
      const value = sessionStorage.getItem(key);
      if (value) {
        // JWT tokens should have 3 parts separated by dots
        const parts = value.split('.');
        if (parts.length !== 3) {
          if (import.meta.env.DEV) console.warn(`Removing invalid ${key} from sessionStorage`);
          sessionStorage.removeItem(key);
        } else {
          // Try to parse the payload to check if valid
          try {
            JSON.parse(atob(parts[1]));
          } catch (e) {
            if (import.meta.env.DEV) console.warn(`Removing corrupted ${key} from sessionStorage`);
            sessionStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.warn(`Error checking ${key} in sessionStorage:`, error);
    }
  });
  
  if (import.meta.env.DEV) console.log('Storage cleanup completed');
};

// Run cleanup
cleanupStorage();

// Override JSON.parse for better error handling
const originalJSONParse = JSON.parse;
JSON.parse = function(text, reviver) {
  try {
    return originalJSONParse.call(this, text, reviver);
  } catch (error) {
    if (error instanceof SyntaxError && (text === undefined || text === null)) {
      console.warn('JSON.parse called with undefined/null, returning null');
      return null;
    }
    console.warn('JSON parse error:', error);
    throw error;
  }
};

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  if (import.meta.env.DEV) {
    console.warn('Unhandled promise rejection:', event.reason);
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
