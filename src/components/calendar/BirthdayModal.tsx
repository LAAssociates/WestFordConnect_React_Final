import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils/cn';
import type { Birthday } from './types';
import avatarPlaceholder from '../../assets/images/avatar-placeholder-2.png';
import { greetingService } from '../../services/greetingService';

interface BirthdayModalProps {
    isOpen: boolean;
    birthday: Birthday | null;
    onClose: () => void;
}

const BirthdayModal: React.FC<BirthdayModalProps> = ({ isOpen, birthday, onClose }) => {
    const [greeting, setGreeting] = useState('');
    const [activeCelebration, setActiveCelebration] = useState<'celebrate' | 'applaud' | 'support' | null>(null);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Reset success message when modal closes
    useEffect(() => {
        if (!isOpen) {
            setShowSuccessMessage(false);
            setGreeting('');
            setErrorMessage('');
            setIsSending(false);
        }
    }, [isOpen]);

    if (!isOpen || !birthday) return null;

    const firstName = birthday.person.name.split(' ')[0] || birthday.person.name;

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    const handleSendGreeting = async () => {
        const message = greeting.trim();
        if (!message || isSending) return;
        if (!birthday.person.email) {
            setErrorMessage('User email is not available for greeting.');
            return;
        }

        setIsSending(true);
        setErrorMessage('');
        try {
            const response = await greetingService.send({
                eventType: 'birthday',
                targetEmail: birthday.person.email,
                targetName: birthday.person.name,
                message,
                source: 'calendar',
            });

            if (!response.success) {
                setErrorMessage(response.message || 'Unable to send greeting.');
                return;
            }

            setGreeting('');
            setShowSuccessMessage(true);
            setTimeout(() => {
                setShowSuccessMessage(false);
            }, 3000);
        } catch (error) {
            console.error('Failed to send greeting:', error);
            const apiMessage = (error as any)?.response?.data?.message;
            const fallbackMessage = error instanceof Error ? error.message : '';
            setErrorMessage(apiMessage || fallbackMessage || 'Unable to send greeting.');
        } finally {
            setIsSending(false);
        }
    };

    const handleCelebrationClick = (type: 'celebrate' | 'applaud' | 'support') => {
        // Toggle the active state - if already active, deactivate it
        setActiveCelebration((prev) => (prev === type ? null : type));
        console.log('Celebration clicked:', type);
        // Handle celebration action
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
                        <mask id="mask0_1022_4678" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="22">
                            <path d="M11 21C16.523 21 21 16.523 21 11C21 5.477 16.523 1 11 1C5.477 1 1 5.477 1 11C1 16.523 5.477 21 11 21Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round" />
                            <path d="M13.8289 8.17188L8.17188 13.8289M8.17188 8.17188L13.8289 13.8289" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </mask>
                        <g mask="url(#mask0_1022_4678)">
                            <path d="M-1 -1H23V23H-1V-1Z" fill="black" />
                        </g>
                    </svg>
                </button>

                {/* Header */}
                <div className="flex items-start gap-[5px] mb-[20px]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
                        <rect width="21" height="21" fill="white" />
                        <path d="M3 11.5484C3 10.6897 3.34113 9.86613 3.94836 9.2589C4.55558 8.65168 5.37915 8.31055 6.23789 8.31055H14.3326C15.1914 8.31055 16.0149 8.65168 16.6222 9.2589C17.2294 9.86613 17.5705 10.6897 17.5705 11.5484V17.2148C17.5705 17.6441 17.3999 18.0559 17.0963 18.3595C16.7927 18.6631 16.3809 18.8337 15.9516 18.8337H4.61895C4.18957 18.8337 3.77779 18.6631 3.47418 18.3595C3.17057 18.0559 3 17.6441 3 17.2148V11.5484Z" stroke="#535352" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M3 11.5469L5.3588 13.4338C6.31965 14.2028 7.70628 14.1259 8.57646 13.2557C8.80084 13.0312 9.06724 12.8532 9.36044 12.7317C9.65364 12.6102 9.96789 12.5477 10.2853 12.5477C10.6026 12.5477 10.9169 12.6102 11.2101 12.7317C11.5033 12.8532 11.7697 13.0312 11.9941 13.2557C12.4145 13.676 12.9752 13.9266 13.5689 13.9595C14.1625 13.9923 14.7474 13.8051 15.2117 13.4338L17.5705 11.5469" stroke="#535352" stroke-width="1.5" stroke-linecap="round" />
                        <path d="M10.2908 5.88135C9.86145 5.88135 9.44966 5.71078 9.14605 5.40717C8.84244 5.10356 8.67188 4.69178 8.67188 4.2624C8.67188 3.55331 9.21989 2.98667 9.70233 2.4678L10.2908 1.83398L10.8793 2.4678C11.3618 2.98667 11.9098 3.55331 11.9098 4.2624C11.9098 4.69178 11.7392 5.10356 11.4356 5.40717C11.132 5.71078 10.7202 5.88135 10.2908 5.88135Z" stroke="#535352" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <div>
                        <h2 className="text-[18px] font-semibold text-black leading-normal">
                            {birthday.person.name ? `${firstName}'s Birthday!` : birthday.title}
                        </h2>
                        <p className="text-[14px] font-normal text-[#535352]">
                            {formatDate(birthday.date)}
                        </p>
                    </div>
                </div>

                {/* Person Info */}
                <div className="flex items-center gap-[15px] mb-[20px]">
                    <div className="relative">
                        <img
                            src={birthday.person.avatar || avatarPlaceholder}
                            alt={birthday.person.name}
                            className="w-[70px] h-[70px] rounded-full object-cover"
                        />
                        <div className="absolute bottom-0 right-0 w-[18px] h-[18px]">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                            >
                                <circle cx="9" cy="9" r="8.5" fill="#16A34A" stroke="white" strokeWidth="2" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p className="text-[20px] font-semibold text-black mb-1">
                            {birthday.person.name}
                        </p>
                        <p className="text-[14px] font-normal text-[#535352]">
                            {birthday.person.position}
                        </p>
                    </div>
                </div>

                {/* Message */}
                <div className="mb-[20px]">
                    <p className="text-[16px] font-normal text-black mb-[15px]">
                        Join us in wishing {firstName} a wonderful birthday today!
                    </p>
                </div>

                {/* Greeting Input */}
                <div className="relative bg-white border border-[#e6e6e6] rounded-[10px] h-[55px] px-[19px] py-[15px] mb-[20px] flex items-center gap-[10px]">
                    <input
                        type="text"
                        value={greeting}
                        onChange={(e) => {
                            setGreeting(e.target.value);
                            // Hide success message when user starts typing
                            if (showSuccessMessage) {
                                setShowSuccessMessage(false);
                            }
                            if (errorMessage) {
                                setErrorMessage('');
                            }
                        }}
                        placeholder="Type your greeting here..."
                        className="flex-1 text-[14px] font-normal text-black outline-none bg-transparent border-b border-b-[#E6E6E6] pb-1"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleSendGreeting();
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={handleSendGreeting}
                        className={cn(
                            "flex items-center justify-center cursor-pointer",
                            isSending && "opacity-60 pointer-events-none"
                        )}
                        aria-label="Send greeting"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34" fill="none">
                            <path d="M20.9718 9.17876L6.12258 14.1285C5.53745 14.3247 5.02708 14.6967 4.66105 15.1936C4.29502 15.6905 4.09115 16.2882 4.07724 16.9052C4.06332 17.5222 4.24003 18.1284 4.58328 18.6413C4.92653 19.1542 5.41961 19.5488 5.9953 19.7712L11.4895 21.8713C11.6198 21.9246 11.7382 22.0033 11.8378 22.1029C11.9373 22.2025 12.0161 22.3208 12.0693 22.4512L14.1695 27.9454C14.3486 28.4121 14.6416 28.8266 15.0218 29.1513C15.4019 29.4759 15.8571 29.7005 16.3461 29.8044C16.8351 29.9084 17.3423 29.8886 17.8217 29.7466C18.301 29.6047 18.7373 29.3453 19.0909 28.9919C19.4187 28.6575 19.6676 28.254 19.8192 27.811L24.769 12.9618C24.9435 12.434 24.9679 11.8681 24.8395 11.3272C24.7112 10.7864 24.435 10.2918 24.042 9.89872C23.6489 9.50565 23.1543 9.22952 22.6135 9.10114C22.0726 8.97276 21.5067 8.99718 20.9789 9.17168L20.9718 9.17876ZM22.8669 12.3325L17.9171 27.1817C17.8495 27.3741 17.7248 27.5413 17.5595 27.6607C17.3942 27.7802 17.1964 27.8463 16.9925 27.8502C16.7886 27.854 16.5884 27.7954 16.4187 27.6823C16.2491 27.5691 16.1181 27.4068 16.0433 27.217L13.9361 21.7299C13.9073 21.6573 13.8742 21.5865 13.8371 21.5178L18.7091 16.6458C18.8966 16.4583 19.002 16.2039 19.002 15.9387C19.002 15.6735 18.8966 15.4191 18.7091 15.2316C18.5215 15.0441 18.2672 14.9387 18.002 14.9387C17.7368 14.9387 17.4824 15.0441 17.2949 15.2316L12.4229 20.1036C12.3542 20.0664 12.2834 20.0334 12.2108 20.0046L6.72362 17.8974C6.5339 17.8226 6.37157 17.6916 6.25842 17.5219C6.14526 17.3523 6.08667 17.1521 6.09052 16.9482C6.09437 16.7443 6.16046 16.5464 6.27994 16.3812C6.39942 16.2159 6.56657 16.0911 6.75898 16.0235L21.6082 11.0738C21.7834 11.0173 21.9707 11.0103 22.1497 11.0534C22.3286 11.0966 22.4921 11.1883 22.6222 11.3184C22.7524 11.4486 22.8441 11.6121 22.8872 11.791C22.9304 11.9699 22.9234 12.1573 22.8669 12.3325Z" fill="#008080" />
                        </svg>
                    </button>

                    {/* Success Message - Absolute positioned at bottom right */}
                    <div className={cn(
                        "absolute bottom-[-30px] right-0 bg-[#16A34A] flex items-center justify-center overflow-clip px-[7px] py-[5px] rounded-[2px] z-10",
                        "transition-opacity duration-300 ease-in-out",
                        showSuccessMessage ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    )}>
                        <p className="text-[12px] font-semibold text-white whitespace-nowrap leading-normal">
                            Greeting sent successfully.
                        </p>
                    </div>
                </div>

                {errorMessage && (
                    <div className="mb-[20px]">
                        <p className="text-[12px] font-semibold text-[#B3261E]">
                            {errorMessage}
                        </p>
                    </div>
                )}

                {/* Celebration Buttons */}
                <div className="flex items-center gap-[10px] justify-end">
                    <button
                        type="button"
                        onClick={() => handleCelebrationClick('celebrate')}
                        className={cn(
                            'border border-[#e6e6e6] rounded-[50px] w-[43px] h-[43px] flex items-center justify-center cursor-pointer transition-all',
                            activeCelebration === 'celebrate' ? 'bg-[#535352]' : 'bg-white hover:bg-[#f5f5f5]'
                        )}
                        aria-label="Celebrate"
                    >
                        <span className="text-[20px]">🎉</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleCelebrationClick('applaud')}
                        className={cn(
                            'border border-[#e6e6e6] rounded-[50px] w-[43px] h-[43px] flex items-center justify-center cursor-pointer transition-all',
                            activeCelebration === 'applaud' ? 'bg-[#535352]' : 'bg-white hover:bg-[#f5f5f5]'
                        )}
                        aria-label="Applaud"
                    >
                        <span className="text-[20px]">👏</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleCelebrationClick('support')}
                        className={cn(
                            'border border-[#e6e6e6] rounded-[50px] w-[43px] h-[43px] flex items-center justify-center cursor-pointer transition-all',
                            activeCelebration === 'support' ? 'bg-[#535352]' : 'bg-white hover:bg-[#f5f5f5]'
                        )}
                        aria-label="Support"
                    >
                        <span className="text-[20px]">❤️</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BirthdayModal;
