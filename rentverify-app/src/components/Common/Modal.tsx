import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-[#0b1c30]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" 
      onClick={handleOverlayClick}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div 
        className="bg-white border border-outline-variant rounded-[28px] p-6 w-full max-w-[340px] shadow-xl text-center"
        style={{ animation: 'fadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
