// frontend/src/components/Notifications.jsx
import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import './css/Notifications.css';

function Notifications() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="notifications__container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notifications__notification notifications__notification--${notification.type}`}
        >
          <div className="notifications__icon">
            {notification.type === 'success' && '✅'}
            {notification.type === 'error' && '❌'}
            {notification.type === 'warning' && '⚠️'}
            {notification.type === 'info' && 'ℹ️'}
          </div>
          <div className="notifications__content">
            <div className="notifications__message">{notification.message}</div>
            <div className="notifications__time">
              {notification.timestamp.toLocaleTimeString()}
            </div>
          </div>
          <button
            className="notifications__close"
            onClick={() => removeNotification(notification.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default Notifications;
