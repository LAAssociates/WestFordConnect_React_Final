import React from 'react';
import { createPortal } from 'react-dom';

interface DiscardChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
}

const DiscardChangesModal: React.FC<DiscardChangesModalProps> = ({
  isOpen,
  onClose,
  onDiscard,
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
          <div className="flex items-center gap-[5px] mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3.47138 21.4442C2.44805 21.4442 1.99694 20.7009 2.46805 19.7925L11.1397 3.09531C11.6114 2.18698 12.383 2.18698 12.8547 3.09531L21.5264 19.7931C21.9986 20.7009 21.5469 21.4442 20.5236 21.4442H3.47138Z" fill="#FFCC4D" />
              <path d="M10.6562 18.0858C10.6565 17.7296 10.7982 17.388 11.0502 17.1361C11.3022 16.8842 11.6439 16.7427 12.0001 16.7425C12.3563 16.7428 12.6978 16.8844 12.9497 17.1363C13.2016 17.3881 13.3432 17.7297 13.3435 18.0858C13.3433 18.4421 13.2018 18.7838 12.9499 19.0358C12.698 19.2877 12.3564 19.4294 12.0001 19.4297C11.6438 19.4296 11.302 19.2879 11.05 19.036C10.798 18.784 10.6564 18.4422 10.6562 18.0858ZM10.7596 7.92306C10.7596 7.19973 11.2935 6.75195 11.9996 6.75195C12.689 6.75195 13.2401 7.21695 13.2401 7.92306V14.5553C13.2401 15.2614 12.689 15.7264 11.9996 15.7264C11.2935 15.7264 10.7596 15.2781 10.7596 14.5553V7.92306Z" fill="#231F20" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Discard Changes?</h3>
          </div>

          <p className="text-base text-gray-700 mb-6">
            Unsaved edits will be lost.
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-[10px] px-[25px]">
            <button
              type="button"
              onClick={() => {
                onDiscard();
                onClose();
              }}
              className="w-[130px] px-8 py-2 border border-gray-300 rounded-[25px] text-sm font-semibold text-red-600 hover:bg-gray-50 transition cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-[130px] px-8 py-2 border border-gray-300 rounded-[25px] text-sm font-semibold text-gray-900 hover:bg-gray-50 transition cursor-pointer"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DiscardChangesModal;
