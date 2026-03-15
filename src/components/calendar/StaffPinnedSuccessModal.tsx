import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { User } from '../my-work/types';

interface StaffPinnedSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: User | null;
    onAddAnother?: () => void;
}

const StaffPinnedSuccessModal: React.FC<StaffPinnedSuccessModalProps> = ({
    isOpen,
    onClose,
    staff,
    onAddAnother,
}) => {
    if (!isOpen || !staff) return null;

    const staffName = staff.name.split(' ')[0]; // Get first name

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
                    className="absolute top-[5px] right-[5px] w-[22px] h-[22px] flex items-center justify-center rounded-full bg-[#232725] text-white hover:bg-[#1F2937] cursor-pointer transition z-10"
                    aria-label="Close"
                >
                    <X className="w-3 h-3 stroke-3" />
                </button>

                {/* Content */}
                <div className="px-[25px] pt-[25px] pb-[25px]">
                    {/* Success Icon and Title */}
                    <div className="flex items-center gap-[5px] mb-5">
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" fill="#16A34A" />
                                <path
                                    d="M8 12L11 15L16 9"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <h3 className="text-[18px] font-semibold text-black leading-normal">
                            Staff Pinned Successfully
                        </h3>
                    </div>

                    {/* Message */}
                    <p className="text-[16px] font-normal text-black leading-normal mb-[20px]">
                        You can now view {staffName}'s calendar alongside yours.
                    </p>

                    {/* Buttons */}
                    <div className="flex items-center justify-center gap-[10px]">
                        <button
                            type="button"
                            onClick={() => {
                                onAddAnother?.();
                            }}
                            className="border border-[#CACACA] rounded-[25px] py-[10px] w-[130px] text-[14px] font-semibold text-[#1E88E5] hover:bg-[#F3F4F6] cursor-pointer transition flex items-center justify-center gap-[10px]"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M10 5.71429H5.71429V10H4.28571V5.71429H0V4.28571H4.28571V0H5.71429V4.28571H10V5.71429Z" fill="#1E88E5" />
                            </svg>
                            Add another
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="border border-[#CACACA] rounded-[25px] px-[25px] py-[10px] w-[130px] text-[14px] font-semibold text-black hover:bg-[#F3F4F6] cursor-pointer transition"
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

export default StaffPinnedSuccessModal;

