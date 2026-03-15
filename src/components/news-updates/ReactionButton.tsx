import React from 'react';
import { cn } from '../../lib/utils/cn';
import CelebrateIcon from '../../assets/images/news-updates/celebrate-icon.png';
import ApplaudIcon from '../../assets/images/news-updates/applaud-icon.png';
import SupportIcon from '../../assets/images/news-updates/support-icon.png';

export type ReactionType = 'celebrate' | 'applaud' | 'support';

interface ReactionButtonProps {
    type: ReactionType;
    count?: number;
    active?: boolean;
    onClick?: () => void;
    className?: string;
    useImageAssets?: boolean;
    variant?: 'Default' | 'Variant2';
}

const reactionConfig: Record<ReactionType, { emoji: string; label: string; image: string }> = {
    celebrate: { emoji: '🎉', label: 'Celebrate', image: CelebrateIcon },
    applaud: { emoji: '👏', label: 'Applaud', image: ApplaudIcon },
    support: { emoji: '❤️', label: 'Support', image: SupportIcon },
};

const ReactionButton: React.FC<ReactionButtonProps> = ({
    type,
    count = 0,
    active = false,
    onClick,
    className,
    useImageAssets = false,
}) => {
    const config = reactionConfig[type];
    const isActive = active;

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex items-center justify-center w-[43px] h-[43px] border border-[#e6e6e6] border-solid rounded-[50px] transition-all cursor-pointer relative',
                isActive ? 'bg-[#535352]' : 'bg-white',
                className
            )}
            aria-label={count > 0 ? `${config.label} (${count})` : config.label}
            title={config.label}
        >
            {useImageAssets ? (
                <div className="flex items-center justify-center w-full h-full">
                    <img 
                        className="block w-[25px] h-[25px] object-contain" 
                        alt={config.label} 
                        src={config.image}
                        onError={(e) => {
                            // Fallback to emoji if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                                const fallback = document.createElement('span');
                                fallback.className = 'text-[25px] leading-none';
                                fallback.textContent = config.emoji;
                                parent.appendChild(fallback);
                            }
                        }}
                    />
                </div>
            ) : (
                <span className="text-[25px] leading-none">{config.emoji}</span>
            )}
        </button>
    );
};

export default ReactionButton;
