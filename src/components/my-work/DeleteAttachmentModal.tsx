import React from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DeleteAttachmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    attachmentName?: string;
}

const DeleteAttachmentModal: React.FC<DeleteAttachmentModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
}) => {
    if (!isOpen) return null;

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
                    className="absolute top-[5px] right-[5px] w-5 h-5 flex items-center justify-center rounded-full bg-[#232725] text-white hover:bg-[#1F2937] cursor-pointer transition"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Content */}
                <div className="px-[25px] pt-[25px] pb-[25px]">
                    <div className="flex items-center gap-[5px] mb-5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <circle cx="11.8379" cy="12.1622" r="10.1622" fill="#D93025" />
                            <path d="M9.82763 7.99663H9.72178C9.78 7.99663 9.82763 7.9509 9.82763 7.895V7.99663ZM9.82763 7.99663H13.8502V7.895C13.8502 7.9509 13.8978 7.99663 13.956 7.99663H13.8502V8.91122H14.8029V7.895C14.8029 7.4466 14.4231 7.08203 13.956 7.08203H9.72178C9.25469 7.08203 8.87493 7.4466 8.87493 7.895V8.91122H9.82763V7.99663ZM16.4966 8.91122H7.18124C6.94703 8.91122 6.75781 9.09287 6.75781 9.31771V9.72419C6.75781 9.78009 6.80545 9.82581 6.86367 9.82581H7.66288L7.98971 16.4693C8.01088 16.9025 8.38402 17.2442 8.83523 17.2442H14.8426C15.2951 17.2442 15.6669 16.9038 15.6881 16.4693L16.0149 9.82581H16.8141C16.8723 9.82581 16.92 9.78009 16.92 9.72419V9.31771C16.92 9.09287 16.7308 8.91122 16.4966 8.91122ZM14.7407 16.3296H8.93712L8.61691 9.82581H15.0609L14.7407 16.3296Z" fill="white" />
                        </svg>
                        <h3 className="text-[18px] font-semibold text-black">Delete Resource</h3>
                    </div>

                    <p className="text-[16px] font-normal text-black mb-[20px]">
                        This action cannot be undone. Are you sure you want to delete this resource?
                    </p>

                    {/* Buttons */}
                    <div className="flex items-center justify-center gap-[10px]">
                        <button
                            type="button"
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="border border-[#cacaca] rounded-[25px] px-[25px] py-[10px] w-[130px] text-[14px] font-semibold text-[#d93025] hover:bg-[#F3F4F6] cursor-pointer transition"
                        >
                            Delete
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="border border-[#cacaca] rounded-[25px] px-[25px] py-[10px] w-[130px] text-[14px] font-semibold text-black hover:bg-[#F3F4F6] cursor-pointer transition"
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

export default DeleteAttachmentModal;

