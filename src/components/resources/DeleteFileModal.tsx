import React from 'react';
import { Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DeleteFileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    fileName?: string;
}

const DeleteFileModal: React.FC<DeleteFileModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
}) => {
    const [isDeleting, setIsDeleting] = React.useState(false);
    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await onConfirm();
        } finally {
            setIsDeleting(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={onClose}
        >
            <div
                className="relative bg-white rounded-[10px] w-full max-w-[371px] shadow-xl"
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
                        <mask id="mask0_1571_25106" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="22">
                            <path d="M11 21C16.523 21 21 16.523 21 11C21 5.477 16.523 1 11 1C5.477 1 1 5.477 1 11C1 16.523 5.477 21 11 21Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round" />
                            <path d="M13.8289 8.17188L8.17188 13.8289M8.17188 8.17188L13.8289 13.8289" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </mask>
                        <g mask="url(#mask0_1571_25106)">
                            <path d="M-1 -1H23V23H-1V-1Z" fill="#232725" />
                        </g>
                    </svg>
                </button>

                {/* Content */}
                <div className="px-[25px] pt-[25px] pb-[25px]">
                    {/* Header with Icon and Title */}
                    <div className="flex items-center gap-[5px] mb-5">
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#D93025]">
                            <Trash2 className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-[18px] font-semibold text-black">Delete File?</h3>
                    </div>

                    {/* Message */}
                    <div className="mb-[20px]">
                        <p className="text-[16px] font-normal text-black leading-normal">
                            This file will be permanently removed from the system and cannot be recovered. <br />
                            Are you sure you want to proceed?
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-center gap-[10px]">
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isDeleting}
                            className={`border border-[#CACACA] rounded-[25px] px-[25px] py-[10px] w-[130px] text-[14px] font-semibold flex items-center justify-center transition
                                ${isDeleting ? 'text-gray-400 cursor-not-allowed bg-[#F3F4F6]' : 'text-[#D93025] hover:bg-[#F3F4F6] cursor-pointer'} `}
                        >
                            {isDeleting ? (
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
                            ) : (
                                "Delete"
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="border border-[#CACACA] rounded-[25px] px-[25px] py-[10px] w-[130px] text-[14px] font-semibold text-black hover:bg-[#F3F4F6] cursor-pointer transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DeleteFileModal;
