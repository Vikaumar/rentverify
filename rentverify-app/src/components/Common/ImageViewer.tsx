import React from 'react';

interface ImageViewerProps {
  src: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ src, isOpen, onClose }) => {
  if (!isOpen || !src) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="image-viewer" onClick={handleOverlayClick}>
      <button className="image-viewer-close" onClick={onClose} aria-label="Close image viewer">
        ✕
      </button>
      <img src={src} className="image-viewer-img" alt="Fullscreen preview" />
    </div>
  );
};
