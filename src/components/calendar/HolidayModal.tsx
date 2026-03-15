import React from 'react';
import { createPortal } from 'react-dom';
import type { Holiday } from './types';

interface HolidayModalProps {
    isOpen: boolean;
    holiday: Holiday | null;
    onClose: () => void;
}

const HolidayModal: React.FC<HolidayModalProps> = ({ isOpen, holiday, onClose }) => {
    if (!isOpen || !holiday) return null;

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[10px] relative w-full max-w-[485px] p-[20px]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-[5px] top-[5px] flex items-center justify-center cursor-pointer"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <mask id="mask0_1022_5270" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="22">
                            <path d="M11 21C16.523 21 21 16.523 21 11C21 5.477 16.523 1 11 1C5.477 1 1 5.477 1 11C1 16.523 5.477 21 11 21Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round" />
                            <path d="M13.8289 8.17188L8.17188 13.8289M8.17188 8.17188L13.8289 13.8289" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </mask>
                        <g mask="url(#mask0_1022_5270)">
                            <path d="M-1 -1H23V23H-1V-1Z" fill="black" />
                        </g>
                    </svg>
                </button>

                {/* Header */}
                <div className="flex items-start gap-[10px] mb-[20px]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
                        <rect width="21" height="21" fill="white" />
                        <path d="M15.9016 4.90039H4.70157C3.81791 4.90039 3.10156 5.61674 3.10156 6.5004V16.9004C3.10156 17.7841 3.81791 18.5004 4.70157 18.5004H15.9016C16.7853 18.5004 17.5016 17.7841 17.5016 16.9004V6.5004C17.5016 5.61674 16.7853 4.90039 15.9016 4.90039Z" stroke="#535352" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M6.30157 2.5V4.90001M14.3016 2.5V4.90001M3.10156 8.90002H17.5016" stroke="#535352" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <div>
                        <h2 className="text-[18px] font-semibold text-black">{holiday.title}</h2>
                        <p className="text-[14px] font-normal text-[#535352]">
                            {formatDate(holiday.date)}
                        </p>
                    </div>
                </div>

                {/* Description */}
                <div className="flex items-start gap-[10px]">
                    <div className="w-[16px] h-[16px] flex items-center justify-center mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M0 3.75C0 3.55109 0.0790176 3.36032 0.21967 3.21967C0.360322 3.07902 0.551088 3 0.75 3H15.25C15.4489 3 15.6397 3.07902 15.7803 3.21967C15.921 3.36032 16 3.55109 16 3.75C16 3.94891 15.921 4.13968 15.7803 4.28033C15.6397 4.42098 15.4489 4.5 15.25 4.5H0.75C0.551088 4.5 0.360322 4.42098 0.21967 4.28033C0.0790176 4.13968 0 3.94891 0 3.75ZM0 8C0 7.80109 0.0790176 7.61032 0.21967 7.46967C0.360322 7.32902 0.551088 7.25 0.75 7.25H15.25C15.4489 7.25 15.6397 7.32902 15.7803 7.46967C15.921 7.61032 16 7.80109 16 8C16 8.19891 15.921 8.38968 15.7803 8.53033C15.6397 8.67098 15.4489 8.75 15.25 8.75H0.75C0.551088 8.75 0.360322 8.67098 0.21967 8.53033C0.0790176 8.38968 0 8.19891 0 8ZM0.75 11.5C0.551088 11.5 0.360322 11.579 0.21967 11.7197C0.0790176 11.8603 0 12.0511 0 12.25C0 12.4489 0.0790176 12.6397 0.21967 12.7803C0.360322 12.921 0.551088 13 0.75 13H10.25C10.4489 13 10.6397 12.921 10.7803 12.7803C10.921 12.6397 11 12.4489 11 12.25C11 12.0511 10.921 11.8603 10.7803 11.7197C10.6397 11.579 10.4489 11.5 10.25 11.5H0.75Z" fill="black" />
                        </svg>
                    </div>
                    <p className="text-[16px] font-normal text-black flex-1">
                        {holiday.description}
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default HolidayModal;

