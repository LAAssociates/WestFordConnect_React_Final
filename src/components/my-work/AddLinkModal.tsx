import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface AddLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (displayText: string, url: string) => void;
}

const AddLinkModal: React.FC<AddLinkModalProps> = ({ isOpen, onClose, onInsert }) => {
    const [displayText, setDisplayText] = useState('');
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (isOpen) {
            setDisplayText('');
            setUrl('');
        }
    }, [isOpen]);

    const handleInsert = () => {
        if (!displayText.trim() || !url.trim()) {
            return;
        }
        onInsert(displayText.trim(), url.trim());
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={onClose}
        >
            <div
                data-add-link-modal
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
                    <X className="w-2.5 h-2.5 stroke-3" />
                </button>

                {/* Header */}
                <div className="px-[25px] pt-[25px]">
                    <div className="flex items-center gap-[5px]">
                        <div className="w-6 h-6 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M13.4286 2C14.3758 2 15.2842 2.43899 15.954 3.22039C16.6237 4.00179 17 5.0616 17 6.16667V16.1667C17 16.9327 16.8707 17.6913 16.6194 18.399C16.3681 19.1067 15.9998 19.7498 15.5355 20.2915C15.0712 20.8331 14.52 21.2628 13.9134 21.556C13.3068 21.8491 12.6566 22 12 22C11.3434 22 10.6932 21.8491 10.0866 21.556C9.47995 21.2628 8.92876 20.8331 8.46447 20.2915C8.00017 19.7498 7.63188 19.1067 7.3806 18.399C7.12933 17.6913 7 16.9327 7 16.1667V9.5H8.42857V16.1667C8.42857 17.2717 8.80485 18.3315 9.47462 19.1129C10.1444 19.8943 11.0528 20.3333 12 20.3333C12.9472 20.3333 13.8556 19.8943 14.5254 19.1129C15.1952 18.3315 15.5714 17.2717 15.5714 16.1667V6.16667C15.5714 5.83836 15.516 5.51327 15.4083 5.20996C15.3006 4.90664 15.1428 4.63105 14.9438 4.3989C14.7448 4.16675 14.5086 3.9826 14.2486 3.85697C13.9886 3.73133 13.71 3.66667 13.4286 3.66667C13.1472 3.66667 12.8685 3.73133 12.6085 3.85697C12.3486 3.9826 12.1123 4.16675 11.9133 4.3989C11.7144 4.63105 11.5565 4.90664 11.4488 5.20996C11.3411 5.51327 11.2857 5.83836 11.2857 6.16667V16.1667C11.2857 16.3877 11.361 16.5996 11.4949 16.7559C11.6289 16.9122 11.8106 17 12 17C12.1894 17 12.3711 16.9122 12.5051 16.7559C12.639 16.5996 12.7143 16.3877 12.7143 16.1667V7H14.1429V16.1667C14.1429 16.8297 13.9171 17.4656 13.5152 17.9344C13.1134 18.4033 12.5683 18.6667 12 18.6667C11.4317 18.6667 10.8866 18.4033 10.4848 17.9344C10.0829 17.4656 9.85714 16.8297 9.85714 16.1667V6.16667C9.85714 5.0616 10.2334 4.00179 10.9032 3.22039C11.573 2.43899 12.4814 2 13.4286 2Z" fill="#9A9A9A" />
                            </svg>
                        </div>
                        <h3 className="text-[18px] font-semibold text-black">Add Link</h3>
                    </div>
                </div>

                {/* Content */}
                <div className="px-[25px] pt-[24px] pb-[25px]">
                    {/* Display Text Field */}
                    <div className="mb-[10px]">
                        <label className="text-[15px] font-semibold text-black mb-[10px] block">
                            Display Text<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={displayText}
                            onChange={(e) => setDisplayText(e.target.value)}
                            className="w-full border border-[#E6E6E6] rounded-[5px] px-[10px] py-[10px] text-[15px] text-black placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40"
                        />
                    </div>

                    {/* URL Field */}
                    <div className="mb-[25px]">
                        <label className="text-[15px] font-semibold text-black mb-[10px] block">
                            URL<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full border border-[#E6E6E6] rounded-[5px] px-[10px] py-[10px] text-[15px] text-black placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-center gap-[10px]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="border border-[#CACACA] rounded-[25px] px-[15px] py-[10px] w-[130px] text-[14px] font-semibold text-black hover:bg-[#F3F4F6] cursor-pointer transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleInsert}
                            className="bg-[#DE4A2C] rounded-[25px] px-[25px] py-[10px] w-[130px] text-[14px] font-semibold text-white hover:bg-[#C62828] cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Insert
                        </button>
                    </div>
                </div>
            </div>
        </div >,
        document.body
    );
};

export default AddLinkModal;

