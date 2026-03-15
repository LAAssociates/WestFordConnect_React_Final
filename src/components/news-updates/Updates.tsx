import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils/cn';
import ReactionButton from './ReactionButton';
import type { ReactionType } from './ReactionButton';
import NavigationButton from './NavigationButton';
import type { UpdatesVariant, UpdatesContent } from './types';

interface UpdatesProps {
    variant?: UpdatesVariant;
    content?: UpdatesContent;
    showReactions?: boolean;
    ctaLabel?: string;
    onNext?: () => void;
    onPrevious?: () => void;
    onReactionClick?: (type: 'celebrate' | 'applaud' | 'support') => void;
    onCommentSubmit?: (comment: string) => void;
    onLearnMore?: () => void;
    className?: string;
    isLoading?: boolean;
}

const emptyContent: UpdatesContent = {
    title: "",
    content: "",
    userName: "",
    userRole: "",
};

const Updates: React.FC<UpdatesProps> = ({
    variant = 'Default',
    content,
    showReactions,
    ctaLabel,
    onNext,
    onPrevious,
    onReactionClick,
    onCommentSubmit,
    onLearnMore,
    className,
    isLoading,
}) => {
    const [commentText, setCommentText] = useState('');
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [activeReactions, setActiveReactions] = useState<Record<ReactionType, boolean>>({
        celebrate: false,
        applaud: false,
        support: false,
    });
    const updateContent = content || emptyContent;
    const avatar = updateContent.avatar;
    const isDefault = variant === 'Default';
    const isVariant3 = variant === 'Variant3';
    const descriptionText = updateContent.content || '';
    const shouldShowLoadMore = isVariant3 && descriptionText.length > 210;
    const collapsedDescription = shouldShowLoadMore
        ? `${descriptionText.slice(0, 210).trimEnd()}...`
        : descriptionText;
    const expandedDescription = shouldShowLoadMore
        ? `${descriptionText.slice(0, 360).trimEnd()}...`
        : descriptionText;
    const renderedDescription = isDescriptionExpanded ? expandedDescription : collapsedDescription;

    useEffect(() => {
        setIsDescriptionExpanded(false);
        setActiveReactions({
            celebrate: false,
            applaud: false,
            support: false,
        });
    }, [updateContent.title, updateContent.content, updateContent.userName, updateContent.userRole]);

    const handleCommentSubmit = () => {
        if (commentText.trim() && onCommentSubmit) {
            onCommentSubmit(commentText.trim());
            setCommentText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleCommentSubmit();
        }
    };

    const handleReactionToggle = (type: ReactionType) => {
        setActiveReactions((prev) => ({
            ...prev,
            [type]: !prev[type],
        }));
        onReactionClick?.(type);
    };

    // Style refinements for dynamic height
    const containerClasses = cn(
        'relative w-[577px] mx-auto flex flex-col gap-5',
        className
    );

    if (isLoading) {
        return (
            <div className={cn(containerClasses, 'min-h-[200px] items-center justify-center')}>
                <div className="w-10 h-10 border-4 border-[#e6e6e6] border-t-[#1e88e5] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className={containerClasses}>
            {/* Main Card */}
            <div className={cn(
                'relative bg-white border-2 border-[#e6e6e6] border-solid px-5 py-[17px] overflow-clip rounded-[10px] w-full flex flex-col gap-4'
            )}>
                {/* Title */}
                <div className="font-semibold text-[16px] text-black">
                    <p className="leading-normal">{updateContent.title}</p>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3">
                    {avatar && (
                        <div className="w-[48px] h-[48px] flex-shrink-0">
                            <img className="block max-w-none size-full rounded-full object-cover" alt={updateContent.userName} src={avatar} />
                        </div>
                    )}
                    <div className="flex flex-col gap-1">
                        <p className="font-semibold text-[16px] text-black leading-tight">{updateContent.userName}</p>
                        <p className="font-normal text-[#535352] text-[14px] leading-tight">{updateContent.userRole}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="font-normal text-[16px] text-black w-full">
                    <p className="leading-normal whitespace-pre-wrap">{renderedDescription}</p>
                    {shouldShowLoadMore && (
                        <button
                            type="button"
                            onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                            className="mt-1 w-fit text-[13px] font-semibold text-[#1e88e5] hover:underline cursor-pointer leading-normal block"
                        >
                            {isDescriptionExpanded ? 'Show less' : 'Load more'}
                        </button>
                    )}
                </div>

                {/* Learn More Button (Variant3 only) */}
                {isVariant3 && (
                    <button
                        type="button"
                        onClick={onLearnMore}
                        className="bg-[#1e88e5] flex gap-[5px] items-center px-[10px] py-[6px] rounded-[25px] w-fit cursor-pointer hover:opacity-90 transition-opacity mt-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M7.0005 0C8.85715 0 10.6378 0.737551 11.9506 2.0504C13.2634 3.36325 14.001 5.14385 14.001 7.0005C14.001 8.85715 13.2634 10.6378 11.9506 11.9506C10.6378 13.2634 8.85715 14.001 7.0005 14.001C5.14385 14.001 3.36325 13.2634 2.0504 11.9506C0.73755 10.6378 0 8.85715 0 7.0005C0 5.14385 0.73755 3.36325 2.0504 2.0504C3.36325 0.737551 5.14385 0 7.0005 0ZM8.0505 4.298C8.5705 4.298 8.9925 3.937 8.9925 3.402C8.9925 2.867 8.5695 2.506 8.0505 2.506C7.5305 2.506 7.1105 2.867 7.1105 3.402C7.1105 3.937 7.5305 4.298 8.0505 4.298ZM8.2335 9.925C8.2335 9.818 8.2705 9.54 8.2495 9.382L7.4275 10.328C7.2575 10.507 7.0445 10.631 6.9445 10.598C6.89913 10.5813 6.86121 10.549 6.83756 10.5068C6.81391 10.4646 6.81391 10.4154 6.8155 10.368L8.1855 6.04C8.2975 5.491 7.9895 4.99 7.3365 4.926C6.6475 4.926 5.6335 5.625 5.0165 6.512C5.0165 6.618 4.9965 6.882 5.0175 7.04L5.8385 6.093C6.0085 5.916 6.2065 5.791 6.3065 5.825C6.35577 5.84268 6.39614 5.87898 6.41895 5.92609C6.44176 5.97321 6.44519 6.02739 6.4285 6.077L5.0705 10.384C4.9135 10.888 5.2105 11.382 5.9305 11.494C6.9905 11.494 7.6165 10.812 8.2345 9.925H8.2335Z" fill="white" />
                        </svg>
                        <p className="font-semibold leading-normal not-italic text-[14px] text-left text-white">
                            {ctaLabel && ctaLabel.trim().length > 0 ? ctaLabel : 'Learn More'}
                        </p>
                    </button>
                )}
            </div>

            {/* Actions Section: Reactions, Comment, Navigation */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    {/* Reactions */}
                    {!isVariant3 && (showReactions ?? true) && (
                        <div className="flex items-center gap-3">
                            <ReactionButton
                                type="celebrate"
                                active={activeReactions.celebrate}
                                onClick={() => handleReactionToggle('celebrate')}
                                useImageAssets
                                variant={isDefault ? "Default" : "Variant2"}
                            />
                            <ReactionButton
                                type="applaud"
                                active={activeReactions.applaud}
                                onClick={() => handleReactionToggle('applaud')}
                                useImageAssets
                                variant={isDefault ? "Default" : "Variant2"}
                            />
                            <ReactionButton
                                type="support"
                                active={activeReactions.support}
                                onClick={() => handleReactionToggle('support')}
                                useImageAssets
                                variant={isDefault ? "Default" : "Variant2"}
                            />
                        </div>
                    )}

                    {/* Comment Input */}
                    {!isVariant3 && (showReactions ?? true) && (
                        <div className="flex-1 relative bg-white border border-[#e6e6e6] border-solid rounded-[10px] px-5 py-2.5 flex items-center gap-2">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 bg-transparent text-[14px] font-normal text-black placeholder:text-[#999] focus:outline-none border-b border-[#E6E6E6] pb-1"
                                placeholder="Type your greeting here..."
                            />
                            <button
                                type="button"
                                onClick={handleCommentSubmit}
                                className="cursor-pointer size-[28px] hover:opacity-90 transition-opacity flex-shrink-0"
                                aria-label="Send comment"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 34 34" fill="none">
                                    <path d="M20.9728 9.17876L6.12356 14.1285C5.53843 14.3247 5.02806 14.6967 4.66203 15.1936C4.296 15.6905 4.09213 16.2882 4.07821 16.9052C4.0643 17.5222 4.24101 18.1284 4.58426 18.6413C4.92751 19.1542 5.42059 19.5488 5.99628 19.7712L11.4905 21.8713C11.6208 21.9246 11.7392 22.0033 11.8388 22.1029C11.9383 22.2025 12.017 22.3208 12.0703 22.4512L14.1704 27.9454C14.3496 28.4121 14.6426 28.8266 15.0227 29.1513C15.4029 29.4759 15.8581 29.7005 16.3471 29.8044C16.8361 29.9084 17.3433 29.8886 17.8227 29.7466C18.302 29.6047 18.7383 29.3453 19.0919 28.9919C19.4197 28.6575 19.6685 28.254 19.8202 27.811L24.77 12.9618C24.9445 12.434 24.9689 11.8681 24.8405 11.3272C24.7121 10.7864 24.436 10.2918 24.0429 9.89872C23.6499 9.50565 23.1553 9.22952 22.6144 9.10114C22.0736 8.97276 21.5077 8.99718 20.9799 9.17168L20.9728 9.17876ZM22.8678 12.3325L17.9181 27.1817C17.8505 27.3741 17.7257 27.5413 17.5605 27.6607C17.3952 27.7802 17.1974 27.8463 16.9935 27.8502C16.7896 27.854 16.5894 27.7954 16.4197 27.6823C16.2501 27.5691 16.1191 27.4068 16.0443 27.217L13.9371 21.7299C13.9083 21.6573 13.8752 21.5865 13.8381 21.5178L18.7101 16.6458C18.8976 16.4583 19.003 16.2039 19.003 15.9387C19.003 15.6735 18.8976 15.4191 18.7101 15.2316C18.5225 15.0441 18.2682 14.9387 18.003 14.9387C17.7377 14.9387 17.4834 15.0441 17.2958 15.2316L12.4239 20.1036C12.3552 20.0664 12.2843 20.0334 12.2117 20.0046L6.7246 17.8974C6.53487 17.8226 6.37255 17.6916 6.25939 17.5219C6.14623 17.3523 6.08765 17.1521 6.0915 16.9482C6.09534 16.7443 6.16144 16.5464 6.28092 16.3812C6.40039 16.2159 6.56754 16.0911 6.75995 16.0235L21.6092 11.0738C21.7844 11.0173 21.9717 11.0103 22.1506 11.0534C22.3295 11.0966 22.4931 11.1883 22.6232 11.3184C22.7534 11.4486 22.8451 11.6121 22.8882 11.791C22.9314 11.9699 22.9243 12.1573 22.8678 12.3325Z" fill="#008080" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between w-full">
                    <div>
                        {onPrevious && (
                            <NavigationButton
                                type="previous"
                                onClick={onPrevious}
                            />
                        )}
                    </div>
                    <div>
                        {onNext && (
                            <NavigationButton
                                type="next"
                                onClick={onNext}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Updates;
