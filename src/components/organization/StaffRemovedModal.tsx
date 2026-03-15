import React from 'react';
import { createPortal } from 'react-dom';

interface StaffRemovedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StaffRemovedModal: React.FC<StaffRemovedModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-[10px] shadow-xl w-full max-w-[371px]"
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
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="11.8379" cy="12.1622" r="10.1622" fill="#D93025" />
              <path d="M9.82763 7.99663H9.72178C9.78 7.99663 9.82763 7.9509 9.82763 7.895V7.99663ZM9.82763 7.99663H13.8502V7.895C13.8502 7.9509 13.8978 7.99663 13.956 7.99663H13.8502V8.91122H14.8029V7.895C14.8029 7.4466 14.4231 7.08203 13.956 7.08203H9.72178C9.25469 7.08203 8.87493 7.4466 8.87493 7.895V8.91122H9.82763V7.99663ZM16.4966 8.91122H7.18124C6.94703 8.91122 6.75781 9.09287 6.75781 9.31771V9.72419C6.75781 9.78009 6.80545 9.82581 6.86367 9.82581H7.66288L7.98971 16.4693C8.01088 16.9025 8.38402 17.2442 8.83523 17.2442H14.8426C15.2951 17.2442 15.6669 16.9038 15.6881 16.4693L16.0149 9.82581H16.8141C16.8723 9.82581 16.92 9.78009 16.92 9.72419V9.31771C16.92 9.09287 16.7308 8.91122 16.4966 8.91122ZM14.7407 16.3296H8.93712L8.61691 9.82581H15.0609L14.7407 16.3296Z" fill="white" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Staff Removed</h3>
          </div>

          <p className="text-base text-gray-700 mb-5 leading-normal">
            The selected member and their subordinates have been successfully removed from the chart.
          </p>

          {/* Button */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={onClose}
              className="w-[130px] px-8 py-2 border border-gray-300 rounded-[25px] text-sm font-semibold text-gray-900 hover:bg-gray-50 transition cursor-pointer"
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

export default StaffRemovedModal;
