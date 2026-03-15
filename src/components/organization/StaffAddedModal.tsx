import React from 'react';
import { createPortal } from 'react-dom';
import type { Employee } from './types';

interface StaffAddedModalProps {
  isOpen: boolean;
  manager: Employee | null;
  onClose: () => void;
  onViewManager?: (manager: Employee) => void;
}

const StaffAddedModal: React.FC<StaffAddedModalProps> = ({
  isOpen,
  manager,
  onClose,
  onViewManager,
}) => {
  if (!isOpen || !manager) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg shadow-xl w-full max-w-[371px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-[5px] right-[5px] flex items-center justify-center cursor-pointer"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
            <mask id="mask0_959_17432" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="22">
              <path d="M11 21C16.523 21 21 16.523 21 11C21 5.477 16.523 1 11 1C5.477 1 1 5.477 1 11C1 16.523 5.477 21 11 21Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round" />
              <path d="M13.8289 8.17188L8.17188 13.8289M8.17188 8.17188L13.8289 13.8289" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </mask>
            <g mask="url(#mask0_959_17432)">
              <path d="M-1 -1H23V23H-1V-1Z" fill="#232725" />
            </g>
          </svg>
        </button>

        {/* Content */}
        <div className="p-[25px]">
          <div className="flex items-center gap-1.5 mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
              <path d="M10.5 0C13.2848 0 15.9555 1.10625 17.9246 3.07538C19.8938 5.04451 21 7.71523 21 10.5C21 13.2848 19.8938 15.9555 17.9246 17.9246C15.9555 19.8938 13.2848 21 10.5 21C7.71523 21 5.04451 19.8938 3.07538 17.9246C1.10625 15.9555 0 13.2848 0 10.5C0 7.71523 1.10625 5.04451 3.07538 3.07538C5.04451 1.10625 7.71523 0 10.5 0ZM9.192 12.5715L6.8595 10.2375C6.77588 10.1539 6.67661 10.0876 6.56736 10.0423C6.4581 9.99704 6.34101 9.97375 6.22275 9.97375C6.10449 9.97375 5.9874 9.99704 5.87814 10.0423C5.76889 10.0876 5.66962 10.1539 5.586 10.2375C5.41712 10.4064 5.32225 10.6354 5.32225 10.8743C5.32225 11.1131 5.41712 11.3421 5.586 11.511L8.556 14.481C8.63938 14.565 8.73857 14.6317 8.84786 14.6773C8.95715 14.7228 9.07436 14.7462 9.19275 14.7462C9.31114 14.7462 9.42835 14.7228 9.53764 14.6773C9.64693 14.6317 9.74612 14.565 9.8295 14.481L15.9795 8.3295C16.0642 8.24623 16.1316 8.147 16.1778 8.03755C16.224 7.92809 16.2481 7.81057 16.2487 7.69177C16.2492 7.57297 16.2262 7.45523 16.1811 7.34535C16.1359 7.23547 16.0694 7.13562 15.9854 7.05156C15.9015 6.96751 15.8017 6.9009 15.6919 6.8556C15.5821 6.81029 15.4644 6.78718 15.3455 6.78759C15.2267 6.788 15.1092 6.81193 14.9997 6.858C14.8902 6.90407 14.7909 6.97136 14.7075 7.056L9.192 12.5715Z" fill="#16A34A" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Staff Added Successfully</h3>
          </div>

          <p className="text-base mb-5">
            The selected staff have been added under{' '}
            <button
              onClick={() => onViewManager?.(manager)}
              className="text-[#1E88E5] cursor-pointer font-semibold"
            >
              {manager.name}
            </button>
            .
          </p>

          {/* Button */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={onClose}
              className="w-[130px] px-8 py-2 border border-[#CACACA] rounded-[25px] text-sm font-semibold text-gray-900 hover:bg-gray-50 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StaffAddedModal;
