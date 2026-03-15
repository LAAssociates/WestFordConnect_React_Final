import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils/cn';
import Updates from './Updates';
import type { UpdatesVariant, UpdatesContent } from './types';
import RippedPaper1 from '../../assets/images/news-updates/ripped-paper-1.png';
import RippedPaper2 from '../../assets/images/news-updates/ripped-paper-2.png';

function hasNoContent(content: UpdatesContent | undefined): boolean {
    if (!content) return true;
    const { title, content: body, userName, userRole } = content;
    return !title && !body && !userName && !userRole;
}

export interface WelcomePopupProps {
    isOpen: boolean;
    onClose: () => void;
    variant?: UpdatesVariant;
    content?: UpdatesContent;
    showReactions?: boolean;
    ctaLabel?: string;
    onNext?: () => void;
    onPrevious?: () => void;
    onReactionClick?: (type: 'celebrate' | 'applaud' | 'support') => void;
    onCommentSubmit?: (comment: string) => void;
    onLearnMore?: () => void;
    isLoading?: boolean;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({
    isOpen,
    onClose,
    variant = 'Default',
    content,
    showReactions,
    ctaLabel,
    onNext,
    onPrevious,
    onReactionClick,
    onCommentSubmit,
    onLearnMore,
    isLoading,
}) => {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            // Defer to next frame so transition runs on mount
            const raf = requestAnimationFrame(() => setIsVisible(true));
            return () => cancelAnimationFrame(raf);
        }

        setIsVisible(false);
        const timer = setTimeout(() => setShouldRender(false), 300);
        return () => clearTimeout(timer);
    }, [isOpen]);

    if (!shouldRender || typeof document === 'undefined') return null;

    const noData = !isLoading && hasNoContent(content);

    return createPortal(
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center bg-black/40 transition-opacity duration-300',
                isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            onClick={onClose}
        >
            <div
                className="relative bg-[#d7dbe8] border border-[#cecece] border-solid overflow-clip rounded-[10px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.1)] w-[597px]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Ripped Paper Top */}
                <div className="absolute h-[61px] left-[-1px] top-[-1px] w-[597px] pointer-events-none">
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            alt=""
                            className="absolute h-[177.05%] left-[-0.08%] max-w-none top-[-77.05%] w-[111.22%]"
                            src={RippedPaper1}
                        />
                    </div>
                </div>

                {/* Ripped Paper Bottom */}
                <div className="absolute bottom-[-1px] h-[37px] left-[-1px] w-[597px] pointer-events-none">
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            alt=""
                            className="absolute h-[221.62%] left-[-1.65%] max-w-none top-0 w-[106.48%]"
                            src={RippedPaper2}
                        />
                    </div>
                </div>

                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-[5px] right-[5px] cursor-pointer z-10 flex items-center justify-center hover:opacity-80 transition-opacity"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <mask id="mask0_803_1337" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="28" height="28">
                            <path d="M14 27C21.1799 27 27 21.1799 27 14C27 6.8201 21.1799 1 14 1C6.8201 1 1 6.8201 1 14C1 21.1799 6.8201 27 14 27Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round" />
                            <path d="M17.6783 10.3242L10.3242 17.6783M10.3242 10.3242L17.6783 17.6783" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </mask>
                        <g mask="url(#mask0_803_1337)">
                            <path d="M-1.59961 -1.59961H29.6004V29.6004H-1.59961V-1.59961Z" fill="#232725" />
                        </g>
                    </svg>
                </button>

                {/* Updates Component or No data */}
                <div className="relative pt-[45px] pb-[20px]">
                    {noData ? (
                        <div className="w-[577px] mx-auto min-h-[120px] flex items-center justify-center">
                            <p className="font-normal text-[16px] text-[#535352]">No data</p>
                        </div>
                    ) : (
                        <Updates
                            variant={variant}
                            content={content}
                            showReactions={showReactions}
                            ctaLabel={ctaLabel}
                            onNext={onNext}
                            onPrevious={onPrevious}
                            onReactionClick={onReactionClick}
                            onCommentSubmit={onCommentSubmit}
                            onLearnMore={onLearnMore}
                            isLoading={isLoading}
                        />
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default WelcomePopup;
