import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useEscapeKey } from '../../contexts/NavigationStackContext';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = '90vh'
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEscapeKey(onClose, isOpen);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-theme-card rounded-t-3xl shadow-2xl transform transition-transform duration-300 animate-slide-up"
        style={{ maxHeight }}
      >
        <div className="w-12 h-1.5 bg-theme-tertiary rounded-full mx-auto mt-3 mb-2" />

        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
            <h3 className="text-lg font-semibold text-theme-primary">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-theme-tertiary rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-theme-secondary" />
            </button>
          </div>
        )}

        <div className="px-6 py-4 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          {children}
        </div>
      </div>
    </>
  );
};

export default BottomSheet;
