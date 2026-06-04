import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import type { ToastType } from '../../context/NotificationContext';

const ICON_MAP: Record<ToastType, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const COLOR_MAP: Record<ToastType, { border: string; text: string; iconColor: string }> = {
  success: {
    border: 'border-[#10b981]/30',
    text: 'text-on-surface',
    iconColor: 'text-[#10b981]',
  },
  error: {
    border: 'border-error/30',
    text: 'text-on-surface',
    iconColor: 'text-error',
  },
  warning: {
    border: 'border-tertiary-fixed-dim/50',
    text: 'text-on-surface',
    iconColor: 'text-on-tertiary-container',
  },
  info: {
    border: 'border-outline-variant',
    text: 'text-on-surface',
    iconColor: 'text-secondary',
  },
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useNotifications();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[380px] flex flex-col gap-2 px-4 pointer-events-none">
      {toasts.map((toast) => {
        const symbol = ICON_MAP[toast.type] || 'info';
        const colors = COLOR_MAP[toast.type] || COLOR_MAP.info;

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 bg-surface-container-lowest border ${colors.border} rounded-xl p-3 shadow-md w-full pointer-events-auto transition-all duration-300`}
            style={{ animation: 'fadeIn 0.25s ease-out' }}
          >
            <span className={`material-symbols-outlined text-[20px] shrink-0 ${colors.iconColor}`}>
              {symbol}
            </span>
            <span className={`text-sm font-medium ${colors.text}`}>
              {toast.message}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
