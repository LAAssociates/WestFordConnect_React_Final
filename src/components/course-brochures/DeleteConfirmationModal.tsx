import { X } from 'lucide-react';
import React from 'react';

export type DeleteConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  isDeleting?: boolean;
};

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Brochure?',
  message = 'Are you sure you want to delete this brochure? This action cannot be undone.',
  isDeleting = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className="relative w-full max-w-[370px] rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 h-6 w-6 inline-flex items-center justify-center rounded-full text-white bg-[#232725] hover:bg-[#1F2937] transition cursor-pointer"
          aria-label="Close"
          disabled={isDeleting}
        >
          <X className="w-3 h-3 stroke-3" />
        </button>

        <div className="p-[25px]">
          <div className="flex items-center gap-[5px] mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11.834" cy="12.1622" r="10.1622" fill="#D93025" />
              <path d="M9.81982 7.99663H9.71396C9.77218 7.99663 9.81982 7.9509 9.81982 7.895V7.99663ZM9.81982 7.99663H13.8423V7.895C13.8423 7.9509 13.89 7.99663 13.9482 7.99663H13.8423V8.91122H14.795V7.895C14.795 7.4466 14.4153 7.08203 13.9482 7.08203H9.71396C9.24687 7.08203 8.86712 7.4466 8.86712 7.895V8.91122H9.81982V7.99663ZM16.4887 8.91122H7.17342C6.93922 8.91122 6.75 9.09287 6.75 9.31771V9.72419C6.75 9.78009 6.79764 9.82581 6.85586 9.82581H7.65507L7.9819 16.4693C8.00307 16.9025 8.37621 17.2442 8.82742 17.2442H14.8347C15.2873 17.2442 15.6591 16.9038 15.6803 16.4693L16.0071 9.82581H16.8063C16.8645 9.82581 16.9122 9.78009 16.9122 9.72419V9.31771C16.9122 9.09287 16.7229 8.91122 16.4887 8.91122ZM14.7329 16.3296H8.92931L8.60909 9.82581H15.0531L14.7329 16.3296Z" fill="white" />
            </svg>
            <h3 className="text-lg font-semibold text-black">{title}</h3>
          </div>

          <p className="text-sm text-black leading-normal mb-4">{message}</p>

          <div className="flex items-center justify-end gap-2.5 px-[26px]">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 inline-flex items-center justify-center rounded-full border border-[#CACACA] px-6 py-2.5 text-sm font-semibold text-[#D93025] hover:bg-[#D93025]/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 inline-flex items-center justify-center rounded-full border border-[#CACACA] px-6 py-2.5 text-sm font-semibold text-black hover:bg-[#F3F4F6] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;