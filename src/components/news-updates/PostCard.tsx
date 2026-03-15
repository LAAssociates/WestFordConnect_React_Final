import React, { useState } from 'react';
import { Calendar, Send, Loader2 } from 'lucide-react';
import { ensureAbsoluteUrl } from '../../lib/utils/url';
import type { Post } from './types';
import { categoryColors, categoryLabels } from './mockData';
import ReactionButton from './ReactionButton';
import { cn } from '../../lib/utils/cn';
import HighlightText from '../common/HighlightText';

interface PostCardProps {
    post: Post;
    onPinToggle?: (postId: string) => void;
    onReactionClick?: (postId: string, reactionType: 'celebrate' | 'applaud' | 'support') => void;
    onCommentSubmit?: (postId: string, comment: string) => void;
    onViewPost?: (postId: string) => void;
    compact?: boolean;
    isPinning?: boolean;
    searchTerm?: string;
}

const PostCard: React.FC<PostCardProps> = ({
    post,
    onPinToggle,
    onReactionClick,
    onCommentSubmit,
    onViewPost,
    compact = false,
    isPinning = false,
    searchTerm = '',
}) => {
    const [commentText, setCommentText] = useState('');

    const handleReactionClick = (reactionType: 'celebrate' | 'applaud' | 'support') => {
        onReactionClick?.(post.id, reactionType);
    };

    const handleCommentSubmit = () => {
        if (commentText.trim()) {
            onCommentSubmit?.(post.id, commentText.trim());
            setCommentText('');
        }
    };

    const categoryColor = categoryColors[post.category] || '#6B7280';
    const categoryLabel = categoryLabels[post.category] || post.category;

    if (compact) {
        return (
            // add shadow filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.10));
            <div className="relative bg-[#fbfbfb] border border-[#ebebeb] border-solid rounded-[5px] p-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.10)]">
                {/* Pin Button */}
                <button
                    type="button"
                    onClick={() => onPinToggle?.(post.id)}
                    disabled={isPinning}
                    className={cn(
                        "absolute top-[5px] right-[5px] w-[29px] h-[29px] flex items-center justify-center cursor-pointer rounded-full transition-all",
                        post.pinned && !isPinning && "bg-[#E6E6E6]",
                        isPinning && "opacity-70 cursor-not-allowed"
                    )}
                    aria-label={post.pinned ? "Unpin post" : "Pin post"}
                >
                    {isPinning ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#3f51b5]" />
                    ) : post.pinned && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M15.55 5.39171C15.3781 5.56362 15.2114 5.7199 15.0499 5.86055C14.8884 6.00121 14.7191 6.12363 14.542 6.22781C14.3649 6.332 14.1747 6.40754 13.9716 6.45442C13.7684 6.50131 13.534 6.52996 13.2683 6.54038C13.0912 6.54038 12.9219 6.52475 12.7604 6.49349L9.79884 9.45502C9.86657 9.65298 9.91606 9.85615 9.94731 10.0645C9.97857 10.2729 9.9942 10.4813 9.9942 10.6896C9.9942 11.0283 9.96033 11.3356 9.89261 11.6117C9.82489 11.8878 9.72852 12.1483 9.60349 12.3931C9.47847 12.638 9.32219 12.8698 9.13465 13.0886C8.94711 13.3074 8.74134 13.534 8.51734 13.7684L5.50111 10.7522L1.06271 15.1984L0 15.55L0.351633 14.4873L4.79784 10.0489L1.78161 7.03266L2.13324 6.68103C2.4979 6.31637 2.91465 6.03767 3.38349 5.84492C3.85234 5.65218 4.34723 5.5558 4.86817 5.5558C5.29533 5.5558 5.70427 5.62092 6.09497 5.75116L9.05651 2.78962C9.02525 2.62813 9.00962 2.45883 9.00962 2.28171C9.00962 2.02645 9.03567 1.79724 9.08776 1.59407C9.13986 1.3909 9.218 1.19816 9.32219 1.01583C9.42637 0.833501 9.54619 0.664196 9.68163 0.507915C9.81708 0.351633 9.97596 0.182328 10.1583 0L15.55 5.39171Z" fill="black" />
                        </svg>
                    )}
                </button>

                <div className="mb-[5px]">
                    <span
                        className="inline-flex items-center px-[10px] py-[2px] rounded-[25px] text-xs font-semibold text-white"
                        style={{ backgroundColor: categoryColor }}
                    >
                        {categoryLabel}
                    </span>
                </div>

                <h3 className="text-[16px] font-semibold text-black mb-[5px]">
                    <HighlightText text={post.title} highlight={searchTerm} />
                </h3>

                <p className="text-[14px] font-normal text-[#535352] mb-[15px] line-clamp-3 leading-normal">
                    <HighlightText text={post.content} highlight={searchTerm} />
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-[6px] text-[14px] font-normal text-[#535352]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none">
                            <path d="M9.55004 2.40039H1.85C1.24249 2.40039 0.75 2.89288 0.75 3.5004V10.6504C0.75 11.2579 1.24249 11.7504 1.85 11.7504H9.55004C10.1576 11.7504 10.65 11.2579 10.65 10.6504V3.5004C10.65 2.89288 10.1576 2.40039 9.55004 2.40039Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2.95001 0.75V2.40001M8.45003 0.75V2.40001M0.75 5.15002H10.65" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{post.formattedDateLong || post.formattedDate.split(',')[0]}</span>
                    </div>

                    {onViewPost && (
                        <button
                            type="button"
                            onClick={() => onViewPost(post.id)}
                            className="flex items-center gap-[10px] bg-[#3f51b5] hover:opacity-90 text-white font-semibold text-[14px] px-[20px] py-[5px] rounded-[25px] transition cursor-pointer"
                        >
                            <span>View Post</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 16 14" fill="none">
                                <path d="M15 7L9 1M15 7L9 13M15 7L1 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#fbfbfb] border border-[#ebebeb] border-solid rounded-[5px] p-5 relative overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.10)]">
            {/* Pin Button */}
            <button
                type="button"
                onClick={() => onPinToggle?.(post.id)}
                disabled={isPinning}
                className={cn(
                    "absolute top-[10px] right-[10px] w-[29px] h-[29px] flex items-center justify-center cursor-pointer rounded-full transition-all",
                    post.pinned && !isPinning && "bg-[#E6E6E6]",
                    isPinning && "opacity-70 cursor-not-allowed"
                )}
                aria-label={post.pinned ? "Unpin post" : "Pin post"}
            >
                {isPinning ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#3f51b5]" />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M15.55 5.39171C15.3781 5.56362 15.2114 5.7199 15.0499 5.86055C14.8884 6.00121 14.7191 6.12363 14.542 6.22781C14.3649 6.332 14.1747 6.40754 13.9716 6.45442C13.7684 6.50131 13.534 6.52996 13.2683 6.54038C13.0912 6.54038 12.9219 6.52475 12.7604 6.49349L9.79884 9.45502C9.86657 9.65298 9.91606 9.85615 9.94731 10.0645C9.97857 10.2729 9.9942 10.4813 9.9942 10.6896C9.9942 11.0283 9.96033 11.3356 9.89261 11.6117C9.82489 11.8878 9.72852 12.1483 9.60349 12.3931C9.47847 12.638 9.32219 12.8698 9.13465 13.0886C8.94711 13.3074 8.74134 13.534 8.51734 13.7684L5.50111 10.7522L1.06271 15.1984L0 15.55L0.351633 14.4873L4.79784 10.0489L1.78161 7.03266L2.13324 6.68103C2.4979 6.31637 2.91465 6.03767 3.38349 5.84492C3.85234 5.65218 4.34723 5.5558 4.86817 5.5558C5.29533 5.5558 5.70427 5.62092 6.09497 5.75116L9.05651 2.78962C9.02525 2.62813 9.00962 2.45883 9.00962 2.28171C9.00962 2.02645 9.03567 1.79724 9.08776 1.59407C9.13986 1.3909 9.218 1.19816 9.32219 1.01583C9.42637 0.833501 9.54619 0.664196 9.68163 0.507915C9.81708 0.351633 9.97596 0.182328 10.1583 0L15.55 5.39171Z" fill="black" />
                    </svg>
                )}
            </button>


            {/* Header with Author and Date */}
            <div className="flex items-start gap-3 mb-4">
                <div className="relative">
                    <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&background=3f51b5&color=fff&size=128`;
                        }}
                    />
                    {post.author.availability === 'online' && (
                        <div className="absolute bottom-0 right-0 w-[13px] h-[13px] bg-[#4CAF50] border-2 border-white rounded-full"></div>
                    )}
                </div>
                <div className="flex-1">
                    <h4 className="text-[16px] font-semibold text-black">{post.author.name}</h4>
                    <div className="flex items-center gap-[10px] text-[14px] font-normal text-[#535352]">
                        <span>{post.author.role}</span>
                        <span className="text-[#E6E6E6] w-[14px] h-0 border-t-2 border-black rotate-90"></span>
                        <div className="flex items-center gap-[6px]">
                            <Calendar className="w-3.5 h-3.5 stroke-3" />
                            <span>{post.formattedDate}</span>
                        </div>
                    </div>
                </div>
            </div>

            <span
                className="inline-flex items-center px-[10px] py-[2px] rounded-[25px] text-[12px] font-semibold text-white mb-2"
                style={{ backgroundColor: categoryColor }}
            >
                {categoryLabel}
            </span>

            {/* Title */}
            <h3 className="text-[16px] font-semibold text-black mb-2">
                <HighlightText text={post.title} highlight={searchTerm} />
            </h3>

            {/* Content */}
            <p className="text-[14px] font-normal text-[#535352] mb-4 whitespace-pre-wrap leading-normal">
                <HighlightText text={post.content} highlight={searchTerm} />
            </p>

            {/* Attachments */}
            {post.attachments && post.attachments.length > 0 && (
                <div className="mb-4 flex flex-col gap-2">
                    {post.attachments.map((attachment) => (
                        <a
                            key={attachment.id}
                            href={ensureAbsoluteUrl(attachment.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-[#1E88E5] transition w-fit"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="16" viewBox="0 0 8 16" fill="none">
                                <path d="M5.14286 0C5.90062 0 6.62734 0.351189 7.16316 0.976311C7.69898 1.60143 8 2.44928 8 3.33333V11.3333C8 11.9462 7.89654 12.553 7.69552 13.1192C7.4945 13.6854 7.19986 14.1998 6.82843 14.6332C6.45699 15.0665 6.01604 15.4102 5.53073 15.6448C5.04543 15.8793 4.52529 16 4 16C3.47471 16 2.95457 15.8793 2.46927 15.6448C1.98396 15.4102 1.54301 15.0665 1.17157 14.6332C0.800139 14.1998 0.505501 13.6854 0.304482 13.1192C0.103463 12.553 -7.82739e-09 11.9462 0 11.3333V6H1.14286V11.3333C1.14286 12.2174 1.44388 13.0652 1.97969 13.6904C2.51551 14.3155 3.24224 14.6667 4 14.6667C4.75776 14.6667 5.48449 14.3155 6.02031 13.6904C6.55612 13.0652 6.85714 12.2174 6.85714 11.3333V3.33333C6.85714 3.07069 6.8128 2.81062 6.72665 2.56797C6.6405 2.32532 6.51423 2.10484 6.35504 1.91912C6.19585 1.7334 6.00687 1.58608 5.79889 1.48557C5.5909 1.38506 5.36798 1.33333 5.14286 1.33333C4.91773 1.33333 4.69482 1.38506 4.48683 1.48557C4.27884 1.58608 4.08986 1.7334 3.93067 1.91912C3.77149 2.10484 3.64521 2.32532 3.55906 2.56797C3.47291 2.81062 3.42857 3.07069 3.42857 3.33333V11.3333C3.42857 11.5101 3.48878 11.6797 3.59594 11.8047C3.7031 11.9298 3.84845 12 4 12C4.15155 12 4.2969 11.9298 4.40406 11.8047C4.51122 11.6797 4.57143 11.5101 4.57143 11.3333V4H5.71429V11.3333C5.71429 11.8638 5.53367 12.3725 5.21218 12.7475C4.89069 13.1226 4.45466 13.3333 4 13.3333C3.54534 13.3333 3.10931 13.1226 2.78782 12.7475C2.46633 12.3725 2.28571 11.8638 2.28571 11.3333V3.33333C2.28571 2.44928 2.58673 1.60143 3.12255 0.976311C3.65837 0.351189 4.3851 0 5.14286 0Z" fill="#535352" />
                            </svg>
                            <span className="underline">[{attachment.title}]</span>
                        </a>
                    ))}
                </div>
            )}

            {/* Images */}
            {post.images && post.images.length > 0 && (
                <div className="mb-4">
                    {post.images.slice(0, 1).map((image, index) => {
                        if (image.type === 'avatar') {
                            return (
                                <div key={index} className="relative w-full border border-[#e6e6e6] rounded-[5px] overflow-hidden bg-white">
                                    <div className="relative h-[200px] flex items-center justify-center bg-white">
                                        <img
                                            src={image.url}
                                            alt={image.alt || 'Post image'}
                                            className="w-[170px] h-[170px] rounded-full object-cover z-10"
                                        />
                                    </div>
                                    {/* Name and role below image */}
                                    {image.alt && (
                                        <div className="bg-[#1C2745] text-white p-4 text-center min-h-[71px] flex flex-col justify-center">
                                            <p className="font-semibold text-base">{image.alt}</p>
                                            {post.id === 'post-1' && (
                                                <p className="text-sm text-[#B0B0B0] mt-1">Associate Faculty & Data Analyst</p>
                                            )}
                                            {post.id === 'post-2' && (
                                                <p className="text-sm text-[#B0B0B0] mt-1">Associate Faculty and Student Service Officer</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        if (image.type === 'banner' || image.type === 'document') {
                            return (
                                <div key={index} className="w-full">
                                    <img
                                        src={image.url}
                                        alt={image.alt || 'Post image'}
                                        className="w-full h-auto object-cover"
                                        style={{ maxHeight: image.height ? `${image.height}px` : 'auto' }}
                                    />
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            )}

            {/* CTA Button */}
            {post.cta && post.ctaLink && (
                <div className="mb-6">
                    <a
                        href={ensureAbsoluteUrl(post.ctaLink)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center bg-[#3f51b5] hover:opacity-90 text-white font-semibold text-[14px] px-[30px] py-[8px] rounded-[25px] transition cursor-pointer"
                    >
                        {post.cta}
                    </a>
                </div>
            )}

            {/* Reactions and Comment Input */}
            {post.allowReactions === true && (
                <div className="flex items-center justify-center gap-3 pt-6 mx-auto" style={{ height: '54.941px' }}>
                    <div className="flex items-center gap-0">
                        <ReactionButton
                            type="celebrate"
                            count={post.reactions.find((r) => r.type === 'celebrate')?.count || 0}
                            active={post.reactions.find((r) => r.type === 'celebrate')?.userReacted || false}
                            onClick={() => handleReactionClick('celebrate')}
                        />
                        <ReactionButton
                            type="applaud"
                            count={post.reactions.find((r) => r.type === 'applaud')?.count || 0}
                            active={post.reactions.find((r) => r.type === 'applaud')?.userReacted || false}
                            onClick={() => handleReactionClick('applaud')}
                            className="ml-[8px]"
                        />
                        <ReactionButton
                            type="support"
                            count={post.reactions.find((r) => r.type === 'support')?.count || 0}
                            active={post.reactions.find((r) => r.type === 'support')?.userReacted || false}
                            onClick={() => handleReactionClick('support')}
                            className="ml-[8px]"
                        />
                    </div>

                    <div className="relative w-[420px] h-[54.941px] px-5 flex items-center bg-white border border-[#e6e6e6] border-solid rounded-[10px]">
                        <div className="relative">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCommentSubmit();
                                    }
                                }}
                                placeholder="Type your greeting here..."
                                className="w-[350px] bg-transparent text-[14px] font-normal text-black placeholder:text-black focus:outline-none"
                            />
                            <div className="absolute left-0 -bottom-1 h-0 w-[350px] border-b border-[#e6e6e6]"></div>
                        </div>
                        <button
                            type="button"
                            onClick={handleCommentSubmit}
                            className="absolute right-[10px] top-[10px] w-[33.941px] h-[33.941px] flex items-center justify-center rounded-full hover:opacity-90 text-[#008080] transition cursor-pointer"
                            aria-label="Send comment"
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostCard;

