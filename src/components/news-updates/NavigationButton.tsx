import React from 'react';
import { cn } from '../../lib/utils/cn';

export type NavigationButtonType = 'next' | 'previous';

interface NavigationButtonProps {
    type: NavigationButtonType;
    onClick?: () => void;
    className?: string;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
    type,
    onClick,
    className,
}) => {
    const isNext = type === 'next';

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex items-center justify-center gap-[10px] px-[25px] py-[10px] rounded-[25px] font-semibold text-[14px] text-white cursor-pointer transition-opacity hover:opacity-90',
                isNext ? 'bg-[#3f51b5]' : 'bg-[#9a9a9a]',
                className
            )}
        >
            {isNext ? (
                <>
                    <span className="leading-normal">What's Next?</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 16 14" fill="none">
                        <path d="M15 7L9 1M15 7L9 13M15 7L1 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </>
            ) : (
                <>
                    <svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 7L7 1M1 7L7 13M1 7L15 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

                    <span className="leading-normal">See Previous</span>
                </>
            )}
        </button>
    );
};

export default NavigationButton;

