import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, isOpen, onClose }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    } else {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset'; // Restore scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent closing the modal when clicking the image
    setIsZoomed(!isZoomed);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={onClose} // Close when clicking outside the image
    >
      <button
        className="absolute top-4 right-4 text-white text-2xl p-2 rounded-full bg-gray-800 bg-opacity-50 hover:bg-opacity-75 transition-all"
        onClick={onClose}
        aria-label="Close image"
      >
        <X size={24} />
      </button>
      <img
        src={imageUrl}
        alt="Full size product"
        className={`max-w-[90vw] max-h-[90vh] object-contain image-zoomable ${isZoomed ? 'zoomed' : ''}`}
        onClick={handleImageClick}
      />
    </div>
  );
};

export default ImageModal;