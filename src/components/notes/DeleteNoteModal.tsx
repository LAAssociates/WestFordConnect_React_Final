import React from 'react';
import { X } from 'lucide-react';

interface DeleteNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isShared?: boolean;
  sharedByName?: string;
}

const DeleteNoteModal: React.FC<DeleteNoteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isShared = false,
  sharedByName,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-[10px] shadow-xl w-full max-w-[371px] p-[25px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-[10px] right-[10px] size-[20px] flex items-center justify-center rounded-full bg-black text-white hover:opacity-90 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-3 h-3 stroke-3" />
        </button>

        {/* Warning Icon and Title */}
        <div className="flex items-center gap-[5px] mb-5">
          <div className="size-[24px] flex items-center justify-center rounded-full bg-[#D93025]">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M3.06982 0.914595H2.96396C3.02218 0.914595 3.06982 0.868865 3.06982 0.812973V0.914595ZM3.06982 0.914595H7.09234V0.812973C7.09234 0.868865 7.13998 0.914595 7.1982 0.914595H7.09234V1.82919H8.04504V0.812973C8.04504 0.364568 7.66529 0 7.1982 0H2.96396C2.49687 0 2.11712 0.364568 2.11712 0.812973V1.82919H3.06982V0.914595ZM9.73874 1.82919H0.423423C0.189217 1.82919 0 2.01084 0 2.23568V2.64216C0 2.69805 0.0476351 2.74378 0.105856 2.74378H0.905067L1.2319 9.3873C1.25307 9.82046 1.62621 10.1622 2.07742 10.1622H8.08474C8.53727 10.1622 8.90909 9.82173 8.93026 9.3873L9.25709 2.74378H10.0563C10.1145 2.74378 10.1622 2.69805 10.1622 2.64216V2.23568C10.1622 2.01084 9.97294 1.82919 9.73874 1.82919ZM7.98285 9.24757H2.17931L1.85909 2.74378H8.30307L7.98285 9.24757Z" fill="white" />
            </svg>
          </div>
          <h2 className="text-[18px] font-semibold text-black">
            {isShared ? 'Remove Shared Note?' : 'Delete Note?'}
          </h2>
        </div>

        {/* Message */}
        <p className="text-[16px] font-normal text-black mb-5 leading-normal">
          {isShared ? (
            <>
              This note was shared with you by {sharedByName || 'someone'}. Removing it will only delete it from your view and will remain visible to others.
            </>
          ) : (
            <>
              This note will be permanently deleted from your account. This action cannot be undone.
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-[10px] px-[26px]">
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 border border-[#cacaca] border-solid rounded-[25px] px-[25px] py-[10px] text-[14px] font-semibold text-[#d93025] hover:bg-[#f5f5f5] transition cursor-pointer"
          >
            {isShared ? 'Remove' : 'Delete'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-[#cacaca] border-solid rounded-[25px] px-[25px] py-[10px] text-[14px] font-semibold text-black hover:bg-[#f5f5f5] transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteNoteModal;

