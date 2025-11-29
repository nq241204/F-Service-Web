// frontend/src/components/Alert.jsx
import React from 'react';
import './css/Alert.css';

const Alert = ({ type = 'info', message, onClose, autoClose = false, duration = 5000 }) => {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose, duration]);

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`alert alert--${type}`}>
      <div className="alert__icon">
        {icons[type]}
      </div>
      <div className="alert__message">
        {message}
      </div>
      {onClose && (
        <button className="alert__close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
