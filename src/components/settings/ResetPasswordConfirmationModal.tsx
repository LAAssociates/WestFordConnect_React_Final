import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface ResetPasswordConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (logoutAllDevices: boolean) => void;
}

const ResetPasswordConfirmationModal: React.FC<ResetPasswordConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
}) => {
    const [logoutAllDevices, setLogoutAllDevices] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(logoutAllDevices);
        setLogoutAllDevices(false);
    };

    const handleClose = () => {
        setLogoutAllDevices(false);
        onClose();
    };

    const CheckboxIcon: React.FC<{ checked: boolean }> = ({ checked }) => {
        if (checked) {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none" >
                    <rect x="0.5" y="0.5" width="16" height="16" rx="4.5" fill="#0198F1" stroke="white" />
                    <path d="M12.3951 4L7.35488 10.2136L4.375 7.42924L3 8.71496L7.58262 13L14 5.28571L12.3951 4Z" fill="white" />
                </svg >
            );
        }
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none" >
                <rect x="0.5" y="0.5" width="16" height="16" rx="4.5" fill="#CACACA" stroke="white" />
            </svg >
        );
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={handleClose}
        >
            <div
                className="relative bg-white rounded-[10px] w-full max-w-[371px] shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute top-[6px] right-[6px] flex items-center justify-center cursor-pointer"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <mask id="mask0_reset_password" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="22">
                            <path d="M11 21C16.523 21 21 16.523 21 11C21 5.477 16.523 1 11 1C5.477 1 1 5.477 1 11C1 16.523 5.477 21 11 21Z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                            <path d="M13.8289 8.17188L8.17188 13.8289M8.17188 8.17188L13.8289 13.8289" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </mask>
                        <g mask="url(#mask0_reset_password)">
                            <path d="M-1 -1H23V23H-1V-1Z" fill="#232725" />
                        </g>
                    </svg>
                </button>

                {/* Content */}
                <div className="p-[25px]">
                    {/* Header with Warning Icon and Title */}
                    <div className="flex items-center gap-[5px] mb-5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="18" viewBox="0 0 19 18" fill="none">
                            <path d="M18.798 15.6248L10.8091 0.788906C10.2429 -0.262969 8.73442 -0.262969 8.1677 0.788906L0.179264 15.6248C0.0563167 15.8532 -0.00532333 16.1095 0.000360326 16.3688C0.00604398 16.6281 0.0788572 16.8815 0.211693 17.1042C0.344528 17.327 0.532848 17.5115 0.758269 17.6397C0.98369 17.768 1.23851 17.8356 1.49786 17.8359H17.4771C17.7366 17.836 17.9917 17.7687 18.2175 17.6406C18.4432 17.5125 18.6319 17.328 18.765 17.1052C18.8981 16.8824 18.9711 16.6289 18.9769 16.3694C18.9827 16.1099 18.9211 15.8534 18.798 15.6248ZM9.48864 15.5391C9.30322 15.5391 9.12196 15.4841 8.96779 15.3811C8.81362 15.2781 8.69346 15.1316 8.6225 14.9603C8.55155 14.789 8.53298 14.6005 8.56915 14.4187C8.60533 14.2368 8.69462 14.0698 8.82573 13.9386C8.95684 13.8075 9.12389 13.7183 9.30574 13.6821C9.4876 13.6459 9.6761 13.6645 9.84741 13.7354C10.0187 13.8064 10.1651 13.9265 10.2681 14.0807C10.3712 14.2349 10.4261 14.4161 10.4261 14.6016C10.4261 14.8502 10.3274 15.0887 10.1516 15.2645C9.97574 15.4403 9.73728 15.5391 9.48864 15.5391ZM10.5068 6.11016L10.2377 11.8289C10.2377 12.0278 10.1587 12.2186 10.018 12.3592C9.87738 12.4999 9.68661 12.5789 9.4877 12.5789C9.28879 12.5789 9.09802 12.4999 8.95737 12.3592C8.81672 12.2186 8.7377 12.0278 8.7377 11.8289L8.46864 6.1125C8.46259 5.9759 8.48411 5.83948 8.53191 5.71138C8.57971 5.58327 8.65281 5.4661 8.74685 5.36685C8.8409 5.2676 8.95397 5.18829 9.07932 5.13367C9.20466 5.07905 9.33973 5.05022 9.47645 5.04891H9.4863C9.62395 5.04884 9.7602 5.07665 9.88681 5.13069C10.0134 5.18472 10.1278 5.26384 10.223 5.36328C10.3182 5.46272 10.3922 5.58042 10.4407 5.70927C10.4891 5.83812 10.511 5.97545 10.5049 6.11297L10.5068 6.11016Z" fill="#D93025" />
                        </svg>
                        <h3 className="text-[18px] font-semibold text-black">Reset Password?</h3>
                    </div>

                    {/* Message */}
                    <div className="mb-5">
                        <p className="text-[16px] font-normal text-black leading-normal">
                            Your password will be updated immediately. Do you also want to log out of all other devices?
                        </p>
                    </div>

                    {/* Checkbox */}
                    <button
                        type="button"
                        onClick={() => setLogoutAllDevices(!logoutAllDevices)}
                        className="cursor-pointer flex items-center justify-center gap-[10px] mb-[25px]"
                        aria-label="Log out of all other devices"
                    >
                        <p className="text-[15px] font-medium text-[#535352]">
                            Log out of all other devices
                        </p>
                        <CheckboxIcon checked={logoutAllDevices} />
                    </button>

                    {/* Buttons */}
                    <div className="flex items-center justify-center gap-[10px]">
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="border border-[#CACACA] rounded-[25px] px-[25px] py-[10px] text-[14px] leading-none font-semibold text-[#D93025] hover:bg-[#F3F4F6] cursor-pointer transition"
                        >
                            Reset Password
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="border border-[#CACACA] rounded-[25px] px-[25px] py-[10px] text-[14px] leading-none font-semibold text-black hover:bg-[#F3F4F6] cursor-pointer transition"
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

export default ResetPasswordConfirmationModal;

