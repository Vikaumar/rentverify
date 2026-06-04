import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface NotificationContextType {
  toasts: Toast[];
  show: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  simulateSMS: (guestName: string, messageType: 'submission_received' | 'approved' | 'rejected' | 'flagged') => void;
  simulateWhatsApp: (guestName: string, messageType: 'submission_received' | 'approved' | 'rejected' | 'flagged') => void;
  simulateEscalation: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const MESSAGE_TEMPLATES = {
  submission_received: 'Your verification has been received and is being reviewed.',
  approved: 'Your stay has been approved! Welcome — see you soon.',
  rejected: 'Unfortunately your verification could not be approved. Please contact the property.',
  flagged: "Your verification needs additional review. We'll be in touch shortly.",
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const success = useCallback((message: string) => show(message, 'success'), [show]);
  const error = useCallback((message: string) => show(message, 'error'), [show]);
  const warning = useCallback((message: string) => show(message, 'warning'), [show]);
  const info = useCallback((message: string) => show(message, 'info'), [show]);

  const simulateSMS = useCallback((guestName: string, messageType: keyof typeof MESSAGE_TEMPLATES) => {
    const brief = MESSAGE_TEMPLATES[messageType] || 'Notification sent.';
    show(`📱 SMS sent to ${guestName}: ${brief}`, 'info', 5000);
  }, [show]);

  const simulateWhatsApp = useCallback((guestName: string, messageType: keyof typeof MESSAGE_TEMPLATES) => {
    const brief = MESSAGE_TEMPLATES[messageType] || 'Notification sent.';
    show(`💬 WhatsApp sent to ${guestName}: ${brief}`, 'info', 5000);
  }, [show]);

  const simulateEscalation = useCallback(() => {
    show('⚠️ Escalation alert sent to property owner', 'warning', 6000);
  }, [show]);

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        show,
        success,
        error,
        warning,
        info,
        simulateSMS,
        simulateWhatsApp,
        simulateEscalation,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
