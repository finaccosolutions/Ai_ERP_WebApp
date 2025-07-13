import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Info, CheckCircle, AlertTriangle } from 'lucide-react'; // Keep these imports
import { useTheme } from './ThemeContext'; // ADD THIS IMPORT

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
}

interface NotificationContextType {
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const newNotification: Notification = { message, type, id: Date.now() };
    setNotifications((prev) => [...prev, newNotification]);

    // Clear previous timeout if exists
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    // Set a timeout to remove the notification after 5 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
    }, 5000);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        {notifications.map((notification) => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

interface NotificationToastProps {
  notification: Notification;
}

function NotificationToast({ notification }: NotificationToastProps) {
  const { theme } = useTheme(); // This is where useTheme is called
  const bgColor = notification.type === 'success' ? 'bg-green-500' : notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div
      className={`
        ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg
        flex items-center space-x-3 transition-all duration-300 ease-out
        transform translate-x-0 opacity-100
      `}
      style={{ minWidth: '250px', maxWidth: '350px' }}
    >
      {notification.type === 'success' && <CheckCircle size={20} />}
      {notification.type === 'error' && <AlertTriangle size={20} />}
      {notification.type === 'info' && <Info size={20} />}
      <p className="text-sm font-medium">{notification.message}</p>
    </div>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
