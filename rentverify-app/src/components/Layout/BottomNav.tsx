import React from 'react';
import { useStore } from '../../context/StoreContext';

interface BottomNavProps {
  currentRoute: string;
  onRouteChange: (route: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, onRouteChange }) => {
  const { verifications } = useStore();

  // Calculate pending count dynamically
  const pendingCount = verifications.filter((v) => v.status === 'pending').length;

  const navItems = [
    { id: 'dashboard', label: 'Home', symbol: 'home' },
    { id: 'pending', label: 'Tasks', symbol: 'assignment', badge: pendingCount },
    { id: 'invite', label: 'Invite', symbol: 'add_circle' },
    { id: 'analytics', label: 'Analytics', symbol: 'analytics' },
    { id: 'audit', label: 'History', symbol: 'history' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant z-50">
      <div className="flex max-w-xl mx-auto px-4 pb-safe pt-2">
        {navItems.map((item) => {
          const isActive =
            currentRoute === item.id ||
            (item.id === 'audit' && currentRoute === 'audit-detail') ||
            (item.id === 'pending' && currentRoute === 'detail');

          const iconStyle = isActive
            ? { fontVariationSettings: "'FILL' 1" }
            : {};

          return (
            <button
              key={item.id}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 relative transition-all ${
                isActive ? 'text-secondary font-bold' : 'text-on-surface-variant'
              }`}
              onClick={() => onRouteChange(item.id)}
              aria-label={item.label}
            >
              <div className="flex h-8 w-12 items-center justify-center relative rounded-full hover:bg-surface-container transition-colors">
                <span 
                  className="material-symbols-outlined text-[24px]"
                  style={iconStyle}
                >
                  {item.symbol}
                </span>
                
                {/* Pending count badge */}
                {!!item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-medium text-white shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-xs leading-normal tracking-wide">
                {item.label}
              </p>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
