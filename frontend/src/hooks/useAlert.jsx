// frontend/src/hooks/useAlert.jsx
import { useState } from 'react';

const useAlert = () => {
  const [alerts, setAlerts] = useState([]);

  const addAlert = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const newAlert = { id, message, type };
    
    setAlerts(prev => [...prev, newAlert]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }
    
    return id;
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const success = (message, duration) => addAlert(message, 'success', duration);
  const error = (message, duration) => addAlert(message, 'error', duration);
  const info = (message, duration) => addAlert(message, 'info', duration);
  const warning = (message, duration) => addAlert(message, 'warning', duration);

  const AlertContainer = () => (
    <div className="alert-container">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`alert alert-${alert.type}`}
          onClick={() => removeAlert(alert.id)}
        >
          {alert.message}
        </div>
      ))}
    </div>
  );

  return {
    alerts,
    addAlert,
    removeAlert,
    clearAlerts,
    success,
    error,
    info,
    warning,
    AlertContainer
  };
};

export { useAlert };
export default useAlert;
