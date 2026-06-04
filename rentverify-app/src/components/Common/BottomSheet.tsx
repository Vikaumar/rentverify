import React from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-[#0b1c30]/40 backdrop-blur-sm z-[100] flex items-end justify-center" 
      onClick={handleOverlayClick}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div 
        className="bg-white border-t border-outline-variant rounded-t-[28px] p-6 pb-[calc(24px+env(safe-area-inset-bottom))] w-full max-w-[440px] shadow-lg animate-[slideUp_0.35s_cubic-bezier(0.16,1,0.3,1)_forwards]"
      >
        <div className="w-8 h-1 bg-outline-variant/60 rounded-full mx-auto mb-4" />
        {children}
      </div>
    </div>
  );
};

export default BottomSheet;
