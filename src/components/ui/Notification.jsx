import React, { useEffect, memo } from 'react';
import { CheckCircle, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';

/**
 * Notification types configuration
 */
const NOTIFICATION_TYPES = {
  success: {
    bg: 'bg-emerald-600',
    icon: CheckCircle,
    iconColor: 'text-white'
  },
  error: {
    bg: 'bg-rose-500',
    icon: AlertCircle,
    iconColor: 'text-white'
  },
  warning: {
    bg: 'bg-amber-500',
    icon: AlertTriangle,
    iconColor: 'text-white'
  },
  info: {
    bg: 'bg-blue-500',
    icon: Info,
    iconColor: 'text-white'
  }
};

/**
 * Notification component for displaying toast-style messages
 * 
 * @param {string} message - Message to display
 * @param {string} type - Notification type: 'success' | 'error' | 'warning' | 'info'
 * @param {function} onClose - Callback when notification is dismissed
 * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
 */
const Notification = memo(({ 
  message, 
  type = 'success', 
  onClose, 
  duration = 3000 
}) => {
  // Auto-dismiss after duration
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);
  
  if (!message) return null;
  
  const config = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
  const IconComponent = config.icon;
  
  return (
    <div 
      className={`
        fixed bottom-6 right-6 z-[100]
        ${config.bg} text-white
        px-5 py-3 rounded-lg shadow-xl
        animate-fade-in
        flex items-center gap-3
        max-w-sm
      `}
      role="alert"
    >
      <IconComponent size={20} className={config.iconColor} />
      <span className="font-medium text-sm flex-1">{message}</span>
      {onClose && (
        <button 
          onClick={onClose} 
          className="opacity-70 hover:opacity-100 transition-opacity ml-2"
          aria-label="Stäng"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
});

Notification.displayName = 'Notification';

export default Notification;

/**
 * Hook for managing notifications
 */
export function useNotification() {
  const [notification, setNotification] = React.useState(null);
  
  const showNotification = React.useCallback((message, type = 'success', duration = 3000) => {
    setNotification({ message, type, duration });
  }, []);
  
  const hideNotification = React.useCallback(() => {
    setNotification(null);
  }, []);
  
  const NotificationComponent = notification ? (
    <Notification
      message={notification.message}
      type={notification.type}
      duration={notification.duration}
      onClose={hideNotification}
    />
  ) : null;
  
  return {
    showNotification,
    hideNotification,
    NotificationComponent
  };
}










