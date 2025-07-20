// src/contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useEffect } from 'react'; // <--- ADD THIS IMPORT
import { Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTheme } from './ThemeContext';

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

  // Function to remove a specific notification by its ID
  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const newNotification: Notification = { message, type, id: Date.now() };
    setNotifications((prev) => [...prev, newNotification]);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        {notifications.map((notification) => (
          <NotificationToast key={notification.id} notification={notification} removeNotification={removeNotification} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

interface NotificationToastProps {
  notification: Notification;
  removeNotification: (id: number) => void; // Pass remove function
}

function NotificationToast({ notification, removeNotification }: NotificationToastProps) {
  const { theme } = useTheme();
  const bgColor = notification.type === 'success' ? 'bg-green-500' : notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  // Manage individual toast's timeout
  useEffect(() => { // This useEffect was causing the error
    const timer = setTimeout(() => {
      removeNotification(notification.id);
    }, 5000); // Auto-hide after 5 seconds

    return () => {
      clearTimeout(timer); // Clear timeout on unmount
    };
  }, [notification.id, removeNotification]); // Re-run if notification ID or remove function changes

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