import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface SOPModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const SOPModal: React.FC<SOPModalProps> = ({
  isOpen,
  onClose,
  title = 'Standard Operating Procedure (Read-Only)',
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Defer to next frame so transition runs on mount
      const raf = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    setIsVisible(false);
    const timer = setTimeout(() => setShouldRender(false), 300);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!shouldRender) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-end bg-black/40 transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          'relative w-full max-w-[641px] bg-[#1C2745] text-white shadow-xl max-h-[calc(100dvh-64px)] overflow-hidden mt-16 transition-transform duration-300 ease-out',
          isVisible ? 'translate-x-0' : 'translate-x-full'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Border */}
        <div className="h-[6px] bg-[#232725] w-full" />

        {/* Header */}
        <div className="bg-[#1C2745] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-[#DE4A2C] rounded-full" />
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:bg-[#F3F4F6] cursor-pointer transition"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-black stroke-3" />
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-[10px] px-[42px] py-[54px] mx-2.5 mb-2.5 overflow-y-auto min-h-[calc(100dvh-144px)] max-h-[calc(100dvh-144px)] flex flex-col items-center">
          {/* Placeholder Content */}
          <div className="flex items-center justify-center h-full p-12 flex-1">
            <p className="text-4xl font-semibold text-[#E6E6E6] uppercase">SAMPLE SOP</p>
          </div>
          <div className="flex items-center gap-[5px]">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4.5 16.5C4.0875 16.5 3.7345 16.3533 3.441 16.0597C3.1475 15.7662 3.0005 15.413 3 15V7.5C3 7.0875 3.147 6.7345 3.441 6.441C3.735 6.1475 4.088 6.0005 4.5 6H5.25V4.5C5.25 3.4625 5.61575 2.57825 6.34725 1.84725C7.07875 1.11625 7.963 0.750501 9 0.750001C10.037 0.749501 10.9215 1.11525 11.6535 1.84725C12.3855 2.57925 12.751 3.4635 12.75 4.5V6H13.5C13.9125 6 14.2657 6.147 14.5597 6.441C14.8538 6.735 15.0005 7.088 15 7.5V15C15 15.4125 14.8533 15.7657 14.5597 16.0597C14.2662 16.3538 13.913 16.5005 13.5 16.5H4.5ZM4.5 15H13.5V7.5H4.5V15ZM9 12.75C9.4125 12.75 9.76575 12.6033 10.0598 12.3098C10.3538 12.0163 10.5005 11.663 10.5 11.25C10.4995 10.837 10.3528 10.484 10.0598 10.191C9.76675 9.898 9.4135 9.751 9 9.75C8.5865 9.749 8.2335 9.896 7.941 10.191C7.6485 10.486 7.5015 10.839 7.5 11.25C7.4985 11.661 7.6455 12.0143 7.941 12.3098C8.2365 12.6053 8.5895 12.752 9 12.75ZM6.75 6H11.25V4.5C11.25 3.875 11.0312 3.34375 10.5938 2.90625C10.1562 2.46875 9.625 2.25 9 2.25C8.375 2.25 7.84375 2.46875 7.40625 2.90625C6.96875 3.34375 6.75 3.875 6.75 4.5V6Z" fill="#D93025" />
            </svg>
            <p className="text-sm leading-normal text-black font-semibold">
              This document is confidential. Viewing only – download and print disabled.
            </p>
          </div>
        </div>

        {/* Footer */}
      </div>
    </div>,
    document.body
  );
};

export default SOPModal;
