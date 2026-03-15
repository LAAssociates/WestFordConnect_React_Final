import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import type { Comment, User } from '../my-work/types';
import avatarPlaceholder from '../../assets/images/avatar-placeholder-2.png';

interface CommentSectionProps {
    comments: Comment[];
    currentUser: User;
    onAddComment: (text: string, parentId?: string) => Promise<void>;
    onLike: (commentId: string, isReply?: boolean, parentId?: string) => Promise<void>;
    onDislike: (commentId: string, isReply?: boolean, parentId?: string) => Promise<void>;
    onDelete: (commentId: string, isReply?: boolean) => Promise<void>;
}

const CommentSection: React.FC<CommentSectionProps> = ({
    comments,
    currentUser,
    onAddComment,
    onLike,
    onDislike,
    onDelete,
}) => {
    const [commentText, setCommentText] = useState('');
    const [replyText, setReplyText] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [isAddingReply, setIsAddingReply] = useState(false);
    const [processingComments, setProcessingComments] = useState<Record<string, boolean>>({});

    const formatTime = (date: Date): string => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        const minuteStr = minutes.toString().padStart(2, '0');
        return `${hour12}:${minuteStr} ${ampm}`;
    };

    const formatDate = (date: Date): string => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${date.getDate()} ${months[date.getMonth()]}`;
    };

    const formatCommentTime = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return formatTime(date);
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return formatDate(date);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || isAddingComment) return;
        setIsAddingComment(true);
        try {
            await onAddComment(commentText.trim());
            setCommentText('');
        } finally {
            setIsAddingComment(false);
        }
    };

    const handleAddReply = async () => {
        if (!replyText.trim() || !replyingTo || isAddingReply) return;
        setIsAddingReply(true);
        try {
            await onAddComment(replyText.trim(), replyingTo);
            setReplyText('');
            setReplyingTo(null);
        } finally {
            setIsAddingReply(false);
        }
    };

    const handleAction = async (commentId: string, fn: () => Promise<void>) => {
        if (processingComments[commentId]) return;
        setProcessingComments(prev => ({ ...prev, [commentId]: true }));
        try {
            await fn();
        } finally {
            setProcessingComments(prev => ({ ...prev, [commentId]: false }));
        }
    };

    const renderComment = (comment: Comment, isReply: boolean = false, _parentId?: string, isLast: boolean = false) => {
        const isOwnComment = comment.author.id === currentUser.id;
        const isProcessing = processingComments[comment.id];
        return (
            <div key={comment.id} className={cn('mb-4', isReply && 'ml-7')}>
                <div className="flex items-start gap-[10px]">
                    <img
                        src={comment.author.avatar || avatarPlaceholder}
                        alt={comment.author.name}
                        className="w-7 h-7 rounded-full shrink-0"
                    />
                    <div className="flex-1">
                        <div className="flex items-center gap-[10px] mb-1">
                            <span className="text-[16px] font-semibold text-black">{comment.author.name}</span>
                            <div className="w-1 h-1 rounded-full bg-[#535352]" />
                            <span className="text-[12px] font-semibold text-[#535352]">
                                {formatCommentTime(comment.createdAt)}
                            </span>
                        </div>
                        <p className="text-[14px] font-normal text-[#535352] mb-2">{comment.text}</p>
                        <div className="flex items-center gap-[13px]">
                            <button
                                type="button"
                                onClick={() => handleAction(comment.id, () => onLike(comment.id, isReply, _parentId))}
                                disabled={isProcessing}
                                className={cn(
                                    "flex items-center gap-[5px] cursor-pointer hover:opacity-80 transition duration-300",
                                    isProcessing && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <g clipPath="url(#clip0_1276_9450)">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M5.04097 14.8124C5.425 14.9957 5.84513 15.091 6.27069 15.0912H12.3804C13.0617 15.0912 13.7206 14.8477 14.2382 14.4047C14.7558 13.9617 15.0981 13.3483 15.2033 12.6752L15.9187 8.10035C15.9699 7.7742 15.9498 7.44083 15.8598 7.12319C15.7698 6.80554 15.6121 6.51115 15.3975 6.26028C15.1829 6.0094 14.9165 5.80799 14.6166 5.6699C14.3168 5.53181 13.9905 5.46032 13.6604 5.46035H9.90954V2.76778C9.91008 2.35643 9.77404 1.95654 9.52275 1.63086C9.27147 1.30519 8.91917 1.07215 8.52114 0.968331C8.12311 0.864508 7.70187 0.895771 7.32352 1.05722C6.94518 1.21866 6.63114 1.50115 6.43069 1.86035L4.05697 6.10035C3.91374 6.35632 3.83858 6.64475 3.83869 6.93807V13.1575C3.83864 13.4813 3.93028 13.7984 4.103 14.0723C4.27573 14.3461 4.52248 14.5655 4.81469 14.7049L5.04097 14.8124ZM1.19412 6.30949C1.04454 6.30934 0.896397 6.33868 0.758162 6.39581C0.619927 6.45295 0.494308 6.53677 0.388488 6.64249C0.282667 6.7482 0.198719 6.87373 0.141444 7.01191C0.0841679 7.15009 0.0546874 7.2982 0.0546875 7.44778V13.2901C0.0546875 13.5923 0.174734 13.8821 0.388418 14.0958C0.602103 14.3094 0.891921 14.4295 1.19412 14.4295H1.76097C1.91253 14.4295 2.05787 14.3693 2.16503 14.2621C2.2722 14.155 2.3324 14.0096 2.3324 13.8581V6.87978C2.3324 6.72823 2.2722 6.58288 2.16503 6.47572C2.05787 6.36856 1.91253 6.30835 1.76097 6.30835L1.19412 6.30949Z" className={cn("transition duration-300", comment.userLiked ? "fill-[#1E88E5]" : "fill-[#535352]")} />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_1276_9450">
                                            <rect width="16" height="16" fill="white" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span
                                    className={cn(
                                        'text-[12px] font-semibold',
                                        comment.userLiked ? 'text-[#1e88e5]' : 'text-[#535352]'
                                    )}
                                >
                                    {comment.likes}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAction(comment.id, () => onDislike(comment.id, isReply, _parentId))}
                                disabled={isProcessing}
                                className={cn(
                                    "flex items-center gap-[5px] cursor-pointer hover:opacity-80 transition duration-300",
                                    isProcessing && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <g clipPath="url(#clip0_4455_14088)">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M5.04097 1.18765C5.425 1.00428 5.84513 0.909005 6.27069 0.908793H12.3804C13.0617 0.908798 13.7206 1.15226 14.2382 1.59527C14.7558 2.03827 15.0981 2.65166 15.2033 3.32479L15.9187 7.89965C15.9699 8.2258 15.9498 8.55917 15.8598 8.87681C15.7698 9.19446 15.6121 9.48885 15.3975 9.73972C15.1829 9.9906 14.9165 10.192 14.6166 10.3301C14.3168 10.4682 13.9905 10.5397 13.6604 10.5396H9.90954V13.2322C9.91008 13.6436 9.77404 14.0435 9.52275 14.3691C9.27147 14.6948 8.91917 14.9278 8.52114 15.0317C8.12311 15.1355 7.70187 15.1042 7.32352 14.9428C6.94518 14.7813 6.63114 14.4989 6.43069 14.1396L4.05697 9.89965C3.91374 9.64368 3.83858 9.35525 3.83869 9.06193V2.84251C3.83864 2.51873 3.93028 2.20156 4.103 1.92771C4.27573 1.65386 4.52248 1.43452 4.81469 1.29508L5.04097 1.18765ZM1.19412 9.69051C1.04454 9.69066 0.896397 9.66132 0.758162 9.60419C0.619927 9.54705 0.494308 9.46323 0.388488 9.35751C0.282667 9.2518 0.198719 9.12627 0.141444 8.98809C0.0841679 8.84991 0.0546874 8.7018 0.0546875 8.55222V2.70994C0.0546875 2.40774 0.174734 2.11792 0.388418 1.90424C0.602103 1.69055 0.891921 1.57051 1.19412 1.57051H1.76097C1.91253 1.57051 2.05787 1.63071 2.16503 1.73787C2.2722 1.84504 2.3324 1.99038 2.3324 2.14193V9.12022C2.3324 9.27177 2.2722 9.41712 2.16503 9.52428C2.05787 1.63145 1.91253 1.69165 1.76097 1.69165L1.19412 9.69051Z" className={cn("transition duration-300", comment.userDisliked ? "fill-[#1E88E5]" : "fill-[#535352]")} />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_4455_14088">
                                            <rect width="16" height="16" fill="white" transform="matrix(1 0 0 -1 0 16)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span
                                    className={cn(
                                        'text-[12px] font-semibold',
                                        comment.userDisliked ? 'text-[#1e88e5]' : 'text-[#535352]'
                                    )}
                                >
                                    {comment.dislikes}
                                </span>
                            </button>
                            {!isReply && (
                                <button
                                    type="button"
                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                    disabled={isProcessing}
                                    className={cn(
                                        "flex items-center gap-[5px] cursor-pointer hover:opacity-80 transition duration-300",
                                        isProcessing && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M5.375 11.0629C6.09961 11.0629 6.6875 11.6508 6.6875 12.3755V12.813L8.66992 11.3254C8.89688 11.1559 9.17305 11.0629 9.45742 11.0629H13.25C13.4906 11.0629 13.6875 10.8661 13.6875 10.6254V2.75008C13.6875 2.50944 13.4906 2.31256 13.25 2.31256H2.75C2.50937 2.31256 2.3125 2.50944 2.3125 2.75008V10.6254C2.3125 10.8661 2.50937 11.0629 2.75 11.0629H5.375ZM6.6875 14.4537L6.68203 14.4592L6.54258 14.5631L6.075 14.9131C5.94375 15.0115 5.76602 15.0279 5.61563 14.9541C5.46523 14.8803 5.375 14.7299 5.375 14.5631V12.3755H2.75C1.78477 12.3755 1 11.5907 1 10.6254V2.75008C1 1.7848 1.78477 1 2.75 1H13.25C14.2152 1 15 1.7848 15 2.75008V10.6254C15 11.5907 14.2152 12.3755 13.25 12.3755H9.45742L6.6875 14.4537Z" fill="#535352" />
                                    </svg>
                                    <span className="text-[12px] font-semibold text-[#535352]">Reply</span>
                                </button>
                            )}
                            {isOwnComment && (
                                <button
                                    type="button"
                                    onClick={() => handleAction(comment.id, () => onDelete(comment.id, isReply))}
                                    disabled={isProcessing}
                                    className={cn(
                                        "cursor-pointer hover:opacity-80 transition duration-300 relative",
                                        isProcessing && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {isProcessing ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-[#D93025]" />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M5.04435 1.84809H4.88833C4.97414 1.84809 5.04435 1.78068 5.04435 1.6983V1.84809ZM5.04435 1.84809H10.9734V1.6983C10.9734 1.78068 11.0436 1.84809 11.1295 1.84809H10.9734V3.19617H12.3777V1.6983C12.3777 1.03736 11.8179 0.5 11.1295 0.5H4.88833C4.19985 0.5 3.6401 1.03736 3.6401 1.6983V3.19617H5.04435V1.84809ZM14.8741 3.19617H1.14364C0.798432 3.19617 0.519531 3.46392 0.519531 3.79532V4.39447C0.519531 4.47685 0.589744 4.54426 0.67556 4.54426H1.85357L2.33531 14.3366C2.36652 14.9751 2.91652 15.4787 3.58159 15.4787H12.4362C13.1032 15.4787 13.6513 14.9769 13.6825 14.3366L14.1642 4.54426H15.3422C15.428 4.54426 15.4983 4.47685 15.4983 4.39447V3.79532C15.4983 3.46392 15.2194 3.19617 14.8741 3.19617ZM12.286 14.1306H3.73177L3.25978 4.54426H12.758L12.286 14.1306Z" fill="#D93025" />
                                        </svg>
                                    )}
                                </button>
                            )}
                        </div>
                        {/* Inline Reply Input */}
                        {replyingTo === comment.id && !isReply && (
                            <div className="flex items-center gap-[10px] mt-3">
                                <img
                                    src={currentUser.avatar || avatarPlaceholder}
                                    alt={currentUser.name}
                                    className="w-10 h-10 rounded-full shrink-0"
                                />
                                <div className="flex-1 border border-[#E6E6E6] rounded-[10px] px-[20px] py-[12px]">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAddReply();
                                            }
                                        }}
                                        disabled={isAddingReply}
                                        placeholder="Reply to comment..."
                                        className="w-full text-[14px] font-medium text-black placeholder:text-black focus:outline-none bg-transparent disabled:opacity-50"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddReply}
                                    disabled={isAddingReply}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[#008080] text-white hover:opacity-90 transition cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Send reply"
                                >
                                    {isAddingReply ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                                </button>
                            </div>
                        )}
                        {comment.replies && comment.replies.length > 0 && (
                            <div className="pt-[30px] relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="34" viewBox="0 0 18 34" fill="none" className="absolute top-2.5 left-0">
                                    <path d="M1 24C1 28.9706 5.02944 33 10 33H18V34H10L9.48535 33.9873C4.37212 33.7281 0.271903 29.6279 0.0126953 24.5146L0 24V0H1V24Z" fill="#E6E6E6" />
                                </svg>

                                {comment.replies.map((reply, replyIndex) => renderComment(reply, true, comment.id, replyIndex === (comment.replies?.length ?? 0) - 1))}
                            </div>
                        )}
                    </div>
                </div>

                {!isReply && !isLast && <div className="h-px bg-[#E6E6E6] my-5" />}
            </div>
        );
    };

    return (
        <div className="border border-[#e6e6e6] rounded-[10px] p-[7px]">
            {/* Main Comment Input (Only for top-level comments) */}
            <div className="flex items-center gap-[10px]">
                <img
                    src={currentUser.avatar || avatarPlaceholder}
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-full shrink-0"
                />
                <div className="flex-1 border border-[#E6E6E6] rounded-[10px] px-[25px] py-[15px]">
                    <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment();
                            }
                        }}
                        disabled={isAddingComment}
                        placeholder="Add a comment…"
                        className="w-full text-[14px] font-medium text-black placeholder:text-black focus:outline-none bg-transparent disabled:opacity-50"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleAddComment}
                    disabled={isAddingComment}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[#008080] text-white hover:opacity-90 transition cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send comment"
                >
                    {isAddingComment ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                </button>
            </div>

            {comments.length > 0 && (
                <>
                    {/* Divider */}
                    < div className="h-px bg-[#E6E6E6] my-4" />

                    {/* Comments List */}
                    <div className="space-y-4">
                        {comments.map((comment, index) => renderComment(comment, false, undefined, index === comments.length - 1))}
                    </div>
                </>
            )}
        </div>
    );
};

export default CommentSection;
