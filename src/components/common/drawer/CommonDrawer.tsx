import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../lib/utils/cn';

interface CommonDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    width?: string;
    className?: string;
}

const CommonDrawer: React.FC<CommonDrawerProps> = ({
    isOpen,
    onClose,
    children,
    width = 'max-w-[641px]',
    className,
}) => {
    const [isMounted, setIsMounted] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Handle mount/unmount timing for smooth animations
    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            // Reset animation state first to ensure we start from closed
            setIsAnimating(false);
            // Use requestAnimationFrame to wait for the next paint cycle,
            // then a small timeout to ensure the closed state is rendered,
            // then trigger the opening animation
            let timerId: number | undefined;
            const rafId = requestAnimationFrame(() => {
                // Small delay to ensure the browser has painted the initial closed state
                timerId = window.setTimeout(() => {
                    setIsAnimating(true);
                }, 20);
            });
            return () => {
                cancelAnimationFrame(rafId);
                if (timerId !== undefined) clearTimeout(timerId);
            };
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => setIsMounted(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isMounted) return null;

    return createPortal(
        <div
            className={cn(
                'fixed inset-0 z-50 flex justify-end bg-black/40 transition-opacity duration-300 ease-in-out',
                isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            onClick={onClose}
        >
            <div
                data-drawer-content
                className={cn(
                    'relative w-full bg-[#1C2745] text-white shadow-xl max-h-[calc(100dvh-64px)] overflow-hidden mt-16 transition-transform duration-300 ease-in-out flex flex-col',
                    isAnimating ? 'translate-x-0' : 'translate-x-full',
                    width,
                    className
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Border */}
                <div className="h-[6px] bg-[#232725] w-full shrink-0" />

                {children}
            </div>
        </div>,
        document.body
    );
};

export default CommonDrawer;
