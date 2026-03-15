import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils/cn';
import type { Meeting, Comment, MeetingStatus, User } from '../my-work/types';
import StatusBadge from '../my-work/StatusBadge';
import PriorityBadge from '../my-work/PriorityBadge';
import Tooltip from '../ui/Tooltip';
import avatarPlaceholder from '../../assets/images/avatar-placeholder-2.png';
import teamsIcon from '../../assets/icons/navigation/teams.svg';
import CommentSection from './CommentSection';
import { useAuth } from '../../contexts/AuthContext';
import { meetingService } from '../../services/meetingService';

interface MeetingInfoModalProps {
    isOpen: boolean;
    meeting: Meeting | null;
    onClose: () => void;
    onEdit?: (meeting: Meeting) => void;
    onDelete?: (meetingId: string) => void;
    onJoinMeeting?: (meetingLink?: string) => void;
    onStatusChange?: (meetingId: string, newStatus: MeetingStatus) => void;
}

type TabType = 'description' | 'comments' | 'attachments';

const STATUS_MAP: Record<MeetingStatus, number> = {
    'todo': 1,
    'in-progress': 2,
    'completed': 3,
    'overdue': 4
};

const MeetingInfoModal: React.FC<MeetingInfoModalProps> = ({
    isOpen,
    meeting,
    onClose,
    onEdit,
    onDelete,
    onJoinMeeting,
    onStatusChange
}) => {
    const { user: authUser } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('description');
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const currentUser: User = {
        id: authUser?.id ? String(authUser.id) : '0',
        name: authUser ? `${authUser.firstName} ${authUser.lastName}`.trim() : 'You',
        position: 'You',
        email: authUser?.email || '',
        avatar: authUser?.picture || undefined,
    };

    useEffect(() => {
        if (meeting) {
            setComments(meeting.comments || []);
        }
    }, [meeting]);

    if (!isOpen || !meeting) return null;

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    const formatTime = (time: string) => {
        if (time.includes('April') || time.includes('December')) return time;
        return time;
    };

    const description = meeting.description || '';
    const shouldTruncate = description.length > 150;
    const displayDescription = shouldTruncate && !showFullDescription
        ? description.substring(0, 150) + '... '
        : description;

    const handleJoinMeeting = () => {
        if (onJoinMeeting) {
            onJoinMeeting(meeting.teamsLink);
        } else if (meeting.teamsLink) {
            window.open(meeting.teamsLink, '_blank');
        }
    };

    const handleStatusToggle = async () => {
        if (!meeting || !onStatusChange) return;

        const statusCycle: MeetingStatus[] = ['todo', 'in-progress', 'completed'];
        const currentIndex = statusCycle.indexOf(meeting.status);
        const nextIndex = (currentIndex + 1) % statusCycle.length;
        const newStatus = statusCycle[nextIndex];

        try {
            await meetingService.changeMeetingStatus({
                entityId: parseInt(meeting.id, 10),
                statusCode: STATUS_MAP[newStatus]
            });
            onStatusChange(meeting.id, newStatus);
        } catch (error) {
            console.error('Failed to update meeting status:', error);
        }
    };

    const handleAddComment = async (text: string, parentId?: string) => {
        if (!meeting) return;

        try {
            if (parentId) {
                const commentId = parseInt(parentId, 10);
                if (!Number.isNaN(commentId)) {
                    const response = await meetingService.addCommentReply(parseInt(meeting.id, 10), {
                        commentId: commentId,
                        replyText: text.trim(),
                        replyToReplyId: null,
                        replyToUserId: null
                    });

                    if (response.success) {
                        // Refresh comments from API to get the proper structure and IDs
                        const freshData = await meetingService.getSingleMeeting(parseInt(meeting.id, 10));
                        if (freshData.success && freshData.result) {
                            // We need to map the API comments to UI format again.
                            // Since mapping logic is in Calendar.tsx, we could either move it to a service or just update local state pessimistically.
                            // However, to keep it simple and responsive, let's update local state but use the ID from response if available.
                            // Actually, the easiest is to just re-fetch and map if possible, but MeetingInfoModal doesn't have the mapper.
                            // Let's manually update local state with a temporary ID and let the next reload fix it, or better, use the response ID.
                            
                            // Re-fetching is safer for data consistency.
                            // But for now, let's just use the existing local update logic but wait for API success.
                            const newReply: Comment = {
                                id: response.result?.replyId?.toString() || `reply-${Date.now()}`,
                                text: text.trim(),
                                author: currentUser,
                                createdAt: new Date(),
                                likes: 0,
                                dislikes: 0,
                            };

                            const addReply = (comments: Comment[]): Comment[] => {
                                return comments.map((comment) => {
                                    if (comment.id === parentId) {
                                        return {
                                            ...comment,
                                            replies: [...(comment.replies || []), newReply],
                                        };
                                    }
                                    if (comment.replies) {
                                        return {
                                            ...comment,
                                            replies: addReply(comment.replies),
                                        };
                                    }
                                    return comment;
                                });
                            };
                            setComments(addReply(comments));
                        }
                    }
                }
            } else {
                const response = await meetingService.addComment(parseInt(meeting.id, 10), {
                    entityType: 'MEETING',
                    entityId: parseInt(meeting.id, 10),
                    commentText: text.trim()
                });

                if (response.success) {
                    const newComment: Comment = {
                        id: response.result?.commentId?.toString() || `comment-${Date.now()}`,
                        text: text.trim(),
                        author: currentUser,
                        createdAt: new Date(),
                        likes: 0,
                        dislikes: 0,
                        replies: [],
                    };
                    setComments([...comments, newComment]);
                }
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const handleLike = async (commentId: string, isReply: boolean = false, parentId?: string) => {
        if (!meeting) return;
        const meetingId = parseInt(meeting.id, 10);

        // Optimistic update
        const toggleLike = (comments: Comment[]): Comment[] => {
            return comments.map((comment) => {
                if (comment.id === commentId) {
                    const wasLiked = comment.userLiked;
                    const wasDisliked = comment.userDisliked;
                    return {
                        ...comment,
                        userLiked: !wasLiked,
                        userDisliked: false,
                        likes: wasLiked ? Math.max(0, comment.likes - 1) : comment.likes + 1,
                        dislikes: wasDisliked ? Math.max(0, comment.dislikes - 1) : comment.dislikes,
                    };
                }
                if (comment.replies) {
                    return {
                        ...comment,
                        replies: toggleLike(comment.replies),
                    };
                }
                return comment;
            });
        };
        setComments(toggleLike(comments));

        try {
            await meetingService.reactToComment(meetingId, {
                commentId: parseInt(isReply ? (parentId || '0') : commentId, 10),
                replyId: isReply ? parseInt(commentId, 10) : null,
                reaction: 1
            });
        } catch (error) {
            console.error('Failed to like comment:', error);
            // In a real app we might revert state on failure
        }
    };

    const handleDislike = async (commentId: string, isReply: boolean = false, parentId?: string) => {
        if (!meeting) return;
        const meetingId = parseInt(meeting.id, 10);

        // Optimistic update
        const toggleDislike = (comments: Comment[]): Comment[] => {
            return comments.map((comment) => {
                if (comment.id === commentId) {
                    const wasDisliked = comment.userDisliked;
                    const wasLiked = comment.userLiked;
                    return {
                        ...comment,
                        userDisliked: !wasDisliked,
                        userLiked: false,
                        dislikes: wasDisliked ? Math.max(0, comment.dislikes - 1) : comment.dislikes + 1,
                        likes: wasLiked ? Math.max(0, comment.likes - 1) : comment.likes,
                    };
                }
                if (comment.replies) {
                    return {
                        ...comment,
                        replies: toggleDislike(comment.replies),
                    };
                }
                return comment;
            });
        };
        setComments(toggleDislike(comments));

        try {
            await meetingService.reactToComment(meetingId, {
                commentId: parseInt(isReply ? (parentId || '0') : commentId, 10),
                replyId: isReply ? parseInt(commentId, 10) : null,
                reaction: 2
            });
        } catch (error) {
            console.error('Failed to dislike comment:', error);
        }
    };

    const handleDeleteComment = async (commentId: string, isReply: boolean = false) => {
        if (!meeting) return;
        const meetingId = parseInt(meeting.id, 10);

        try {
            if (isReply) {
                await meetingService.deleteCommentReply(meetingId, parseInt(commentId, 10));
            } else {
                await meetingService.deleteComment(meetingId, parseInt(commentId, 10));
            }

            // Pessimistic update: remove from state only after successful API call
            // to allow the loader in CommentSection to be visible.
            const deleteCommentFromState = (comments: Comment[]): Comment[] => {
                return comments
                    .filter((comment) => comment.id !== commentId)
                    .map((comment) => {
                        if (comment.replies) {
                            return {
                                ...comment,
                                replies: deleteCommentFromState(comment.replies),
                            };
                        }
                        return comment;
                    });
            };
            setComments(deleteCommentFromState(comments));
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    const handleOpenAttachment = (url?: string) => {
        if (!url) return;
        window.open(url, '_blank');
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[10px] relative w-full max-w-[485px] max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-[5px] top-[5px] flex items-center justify-center cursor-pointer z-10"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <mask id="mask0_meeting" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="22">
                            <path d="M11 21C16.523 21 21 16.523 21 11C21 5.477 16.523 1 11 1C5.477 1 1 5.477 1 11C1 16.523 5.477 21 11 21Z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                            <path d="M13.8289 8.17188L8.17188 13.8289M8.17188 8.17188L13.8289 13.8289" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </mask>
                        <g mask="url(#mask0_meeting)">
                            <path d="M-1 -1H23V23H-1V-1Z" fill="black" />
                        </g>
                    </svg>
                </button>

                <div className="p-[20px]">
                    {/* Header */}
                    <div className="flex items-start gap-[5px] mb-[25px]">
                        <div className="relative shrink-0 size-[21px] mt-1">
                            <img src={teamsIcon} alt="Microsoft Teams" className="w-full h-full" />
                        </div>
                        <div className="flex-1 flex flex-col gap-[8px]">
                            <h2 className="text-[18px] font-semibold text-black leading-normal mb-0">{meeting.title}</h2>

                            {/* Date/Time and Priority */}
                            <div className="flex items-end gap-[15px]">
                                <div className="flex items-center gap-[5px]">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M11.5142 2.64453H2.80304C2.11575 2.64453 1.55859 3.20169 1.55859 3.88898V11.9779C1.55859 12.6652 2.11575 13.2223 2.80304 13.2223H11.5142C12.2015 13.2223 12.7586 12.6652 12.7586 11.9779V3.88898C12.7586 3.20169 12.2015 2.64453 11.5142 2.64453Z" stroke="#535352" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M4.04749 0.777344V2.64402M10.2697 0.777344V2.64402M1.55859 5.75514H12.7586" stroke="#535352" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                    <span className="text-[14px] font-normal text-[#535352]">{formatDate(meeting.date)}</span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="2" height="18" viewBox="0 0 2 18" fill="none">
                                    <path d="M1 1L1 17" stroke="#E6E6E6" stroke-width="2" stroke-linecap="round" />
                                </svg>
                                <div className="flex items-center gap-[5px]">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M7 0C10.8661 0 14 3.1339 14 7C14 10.8661 10.8661 14 7 14C3.1339 14 0 10.8661 0 7C0 3.1339 3.1339 0 7 0ZM7 1.4C5.51479 1.4 4.09041 1.99 3.0402 3.0402C1.99 4.09041 1.4 5.51479 1.4 7C1.4 8.48521 1.99 9.90959 3.0402 10.9598C4.09041 12.01 5.51479 12.6 7 12.6C8.48521 12.6 9.90959 12.01 10.9598 10.9598C12.01 9.90959 12.6 8.48521 12.6 7C12.6 5.51479 12.01 4.09041 10.9598 3.0402C9.90959 1.99 8.48521 1.4 7 1.4ZM7 2.8C7.17145 2.80002 7.33694 2.86297 7.46506 2.9769C7.59318 3.09083 7.67504 3.24782 7.6951 3.4181L7.7 3.5V6.7102L9.5949 8.6051C9.72044 8.73107 9.79333 8.9001 9.79876 9.07787C9.80419 9.25563 9.74175 9.4288 9.62413 9.56219C9.5065 9.69559 9.34251 9.77921 9.16547 9.79608C8.98842 9.81294 8.81159 9.76179 8.6709 9.653L8.6051 9.5949L6.5051 7.4949C6.39631 7.38601 6.32643 7.2443 6.3063 7.0917L6.3 7V3.5C6.3 3.31435 6.37375 3.1363 6.50503 3.00503C6.6363 2.87375 6.81435 2.8 7 2.8Z" fill="#535352" />
                                    </svg>
                                    <span className="text-[14px] font-normal text-[#535352]">{formatTime(meeting.time)}</span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="2" height="18" viewBox="0 0 2 18" fill="none">
                                    <path d="M1 1L1 17" stroke="#E6E6E6" stroke-width="2" stroke-linecap="round" />
                                </svg>
                                {meeting.priority && (
                                    <div className="relative shrink-0 size-[17px]">
                                        <PriorityBadge priority={meeting.priority} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Participants */}
                    <div>
                        <div className="flex items-center justify-between mb-[25px]">
                            <div className="flex items-center gap-[10px]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M5.64706 7.07143C6.2055 7.07143 6.7514 6.90805 7.21573 6.60195C7.68005 6.29585 8.04195 5.86078 8.25566 5.35176C8.46937 4.84274 8.52528 4.28262 8.41633 3.74225C8.30739 3.20187 8.03847 2.70551 7.6436 2.31592C7.24872 1.92633 6.74561 1.66102 6.1979 1.55353C5.65019 1.44604 5.08247 1.50121 4.56654 1.71205C4.05061 1.9229 3.60963 2.27995 3.29938 2.73806C2.98913 3.19616 2.82353 3.73475 2.82353 4.28572C2.82353 5.02453 3.12101 5.73309 3.65052 6.25551C4.18004 6.77794 4.89821 7.07143 5.64706 7.07143ZM5.64706 3.35714C5.83321 3.35714 6.01517 3.4116 6.16995 3.51364C6.32472 3.61567 6.44536 3.76069 6.51659 3.93037C6.58783 4.10004 6.60647 4.28675 6.57015 4.46687C6.53384 4.647 6.4442 4.81245 6.31257 4.94231C6.18095 5.07218 6.01324 5.16062 5.83067 5.19644C5.6481 5.23227 5.45886 5.21388 5.28689 5.1436C5.11491 5.07332 4.96792 4.9543 4.8645 4.8016C4.76108 4.6489 4.70588 4.46937 4.70588 4.28572C4.70588 4.03944 4.80504 3.80326 4.98155 3.62912C5.15805 3.45498 5.39744 3.35714 5.64706 3.35714ZM9.5153 6.94143C10.0659 6.16239 10.3612 5.23547 10.3612 4.28572C10.3612 3.33596 10.0659 2.40904 9.5153 1.63C9.78594 1.54388 10.0686 1.50002 10.3529 1.5C11.1018 1.5 11.82 1.7935 12.3495 2.31592C12.879 2.83834 13.1765 3.5469 13.1765 4.28572C13.1765 5.02453 12.879 5.73309 12.3495 6.25551C11.82 6.77794 11.1018 7.07143 10.3529 7.07143C10.0686 7.07141 9.78594 7.02755 9.5153 6.94143ZM5.64706 8.92857C4.76837e-07 8.92857 0 12.6429 0 12.6429V14.5H11.2941V12.6429C11.2941 12.6429 11.2941 8.92857 5.64706 8.92857ZM1.88235 12.6429C1.88235 12.3736 2.18353 10.7857 5.64706 10.7857C8.94118 10.7857 9.35529 12.2343 9.41177 12.6429M16 12.6429V14.5H13.1765V12.6429C13.1545 11.9526 12.9933 11.2736 12.7025 10.6454C12.4116 10.0173 11.9968 9.45257 11.4824 8.98429C16 9.43929 16 12.6429 16 12.6429Z" fill="black" />
                                </svg>
                                <span className="text-[16px] font-normal text-black leading-normal">{meeting.attendees.length} Participants</span>
                            </div>
                            {meeting.attendees.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowParticipants(!showParticipants)}
                                    className={cn("size-[14px] flex items-center justify-center cursor-pointer hover:opacity-80 transition-transform duration-300 ease-in-out", showParticipants ? 'rotate-180' : '')}
                                    aria-label={showParticipants ? 'Hide participants' : 'Show participants'}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M1.26414 3.76768C1.43332 3.59628 1.66274 3.5 1.90196 3.5C2.14118 3.5 2.37061 3.59628 2.53978 3.76768L7.00545 8.2932L11.4711 3.76768C11.6413 3.60114 11.8691 3.50899 12.1057 3.51107C12.3422 3.51316 12.5685 3.60931 12.7358 3.77882C12.903 3.94833 12.9979 4.17763 13 4.41734C13.002 4.65706 12.9111 4.888 12.7468 5.06042L7.64327 10.2323C7.47409 10.4037 7.24467 10.5 7.00545 10.5C6.76623 10.5 6.5368 10.4037 6.36762 10.2323L1.26414 5.06042C1.09501 4.88898 1 4.65648 1 4.41405C1 4.17163 1.09501 3.93913 1.26414 3.76768Z" fill="black" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div
                            className={cn(
                                "overflow-hidden transition-all duration-300 ease",
                                showParticipants && meeting.attendees.length > 0
                                    ? "max-h-[1000px] mb-[25px]"
                                    : "max-h-0 mb-0"
                            )}
                        >
                            <div className="rounded-[10px] space-y-[15px]">
                                {meeting.attendees.map((attendee) => (
                                    <div key={attendee.id} className="flex items-center gap-[10px]">
                                        <img
                                            src={attendee.avatar || avatarPlaceholder}
                                            alt={attendee.name}
                                            className="size-[48px] rounded-full object-cover"
                                        />
                                        <div className="flex-1">
                                            <p className="text-[16px] font-semibold text-black">{attendee.name}</p>
                                            <p className="text-[14px] font-normal text-[#535352]">{attendee.position}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border border-[#e6e6e6] rounded-[25px] flex items-center overflow-hidden mb-[20px] w-fit">
                        <button
                            type="button"
                            onClick={() => setActiveTab('description')}
                            className={cn(
                                'px-[20px] py-[8px] flex items-center gap-[5px] transition-colors cursor-pointer',
                                activeTab === 'description' ? 'bg-[#008080]' : 'bg-transparent'
                            )}
                        >
                            <div className="size-[16px] flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M0 3.75C0 3.55109 0.0790176 3.36032 0.21967 3.21967C0.360322 3.07902 0.551088 3 0.75 3H15.25C15.4489 3 15.6397 3.07902 15.7803 3.21967C15.921 3.36032 16 3.55109 16 3.75C16 3.94891 15.921 4.13968 15.7803 4.28033C15.6397 4.42098 15.4489 4.5 15.25 4.5H0.75C0.551088 4.5 0.360322 4.42098 0.21967 4.28033C0.0790176 4.13968 0 3.94891 0 3.75ZM0 8C0 7.80109 0.0790176 7.61032 0.21967 7.46967C0.360322 7.32902 0.551088 7.25 0.75 7.25H15.25C15.4489 7.25 15.6397 7.32902 15.7803 7.46967C15.921 7.61032 16 7.80109 16 8C16 8.19891 15.921 8.38968 15.7803 8.53033C15.6397 8.67098 15.4489 8.75 15.25 8.75H0.75C0.551088 8.75 0.360322 8.67098 0.21967 8.53033C0.0790176 8.38968 0 8.19891 0 8ZM0.75 11.5C0.551088 11.5 0.360322 11.579 0.21967 11.7197C0.0790176 11.8603 0 12.0511 0 12.25C0 12.4489 0.0790176 12.6397 0.21967 12.7803C0.360322 12.921 0.551088 13 0.75 13H10.25C10.4489 13 10.6397 12.921 10.7803 12.7803C10.921 12.6397 11 12.4489 11 12.25C11 12.0511 10.921 11.8603 10.7803 11.7197C10.6397 11.579 10.4489 11.5 10.25 11.5H0.75Z" fill={activeTab === 'description' ? 'white' : '#535352'} />
                                </svg>
                            </div>
                        </button>
                        <svg xmlns="http://www.w3.org/2000/svg" width="2" height="18" viewBox="0 0 2 18" fill="none" className="mx-[5px]">
                            <path d="M1 1L1 17" stroke="#E6E6E6" stroke-width="2" stroke-linecap="round" />
                        </svg>
                        <button
                            type="button"
                            onClick={() => setActiveTab('comments')}
                            className={cn(
                                'px-[20px] py-[8px] flex items-center gap-[5px] transition-colors cursor-pointer',
                                activeTab === 'comments' ? 'bg-[#008080]' : 'bg-transparent'
                            )}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M4.375 10.0629C5.09961 10.0629 5.6875 10.6509 5.6875 11.3755V11.813L7.66992 10.3254C7.89687 10.1559 8.17305 10.0629 8.45742 10.0629H12.25C12.4906 10.0629 12.6875 9.86605 12.6875 9.62541V1.75008C12.6875 1.50944 12.4906 1.31256 12.25 1.31256H1.75C1.50937 1.31256 1.3125 1.50944 1.3125 1.75008V9.62541C1.3125 9.86605 1.50937 10.0629 1.75 10.0629H4.375ZM5.6875 13.4537L5.68203 13.4592L5.54258 13.5631L5.075 13.9131C4.94375 14.0115 4.76602 14.0279 4.61562 13.9541C4.46523 13.8803 4.375 13.7299 4.375 13.5631V11.3755H1.75C0.784766 11.3755 0 10.5907 0 9.62541V1.75008C0 0.784799 0.784766 0 1.75 0H12.25C13.2152 0 14 0.784799 14 1.75008V9.62541C14 10.5907 13.2152 11.3755 12.25 11.3755H8.45742L5.6875 13.4537Z" fill={activeTab === 'comments' ? 'white' : '#535352'} />
                            </svg>
                        </button>
                        <svg xmlns="http://www.w3.org/2000/svg" width="2" height="18" viewBox="0 0 2 18" fill="none" className="mx-[5px]">
                            <path d="M1 1L1 17" stroke="#E6E6E6" stroke-width="2" stroke-linecap="round" />
                        </svg>
                        <button
                            type="button"
                            onClick={() => setActiveTab('attachments')}
                            className={cn(
                                'px-[20px] py-[8px] flex items-center gap-[5px] transition-colors cursor-pointer',
                                activeTab === 'attachments' ? 'bg-[#008080]' : 'bg-transparent'
                            )}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="16" viewBox="0 0 8 16" fill="none">
                                <path d="M5.14286 0C5.90062 0 6.62734 0.351189 7.16316 0.976311C7.69898 1.60143 8 2.44928 8 3.33333V11.3333C8 11.9462 7.89654 12.553 7.69552 13.1192C7.4945 13.6854 7.19986 14.1998 6.82843 14.6332C6.45699 15.0665 6.01604 15.4102 5.53073 15.6448C5.04543 15.8793 4.52529 16 4 16C3.47471 16 2.95457 15.8793 2.46927 15.6448C1.98396 15.4102 1.54301 15.0665 1.17157 14.6332C0.800139 14.1998 0.505501 13.6854 0.304482 13.1192C0.103463 12.553 -7.82739e-09 11.9462 0 11.3333V6H1.14286V11.3333C1.14286 12.2174 1.44388 13.0652 1.97969 13.6904C2.51551 14.3155 3.24224 14.6667 4 14.6667C4.75776 14.6667 5.48449 14.3155 6.02031 13.6904C6.55612 13.0652 6.85714 12.2174 6.85714 11.3333V3.33333C6.85714 3.07069 6.8128 2.81062 6.72665 2.56797C6.6405 2.32532 6.51423 2.10484 6.35504 1.91912C6.19585 1.7334 6.00687 1.58608 5.79889 1.48557C5.5909 1.38506 5.36798 1.33333 5.14286 1.33333C4.91773 1.33333 4.69482 1.38506 4.48683 1.48557C4.27884 1.58608 4.08986 1.7334 3.93067 1.91912C3.77149 2.10484 3.64521 2.32532 3.55906 2.56797C3.47291 2.81062 3.42857 3.07069 3.42857 3.33333V11.3333C3.42857 11.5101 3.48878 11.6797 3.59594 11.8047C3.7031 11.9298 3.84845 12 4 12C4.15155 12 4.2969 11.9298 4.40406 11.8047C4.51122 11.6797 4.57143 11.5101 4.57143 11.3333V4H5.71429V11.3333C5.71429 11.8638 5.53367 12.3725 5.21218 12.7475C4.89069 13.1226 4.45466 13.3333 4 13.3333C3.54534 13.3333 3.10931 13.1226 2.78782 12.7475C2.46633 12.3725 2.28571 11.8638 2.28571 11.3333V3.33333C2.28571 2.44928 2.58673 1.60143 3.12255 0.976311C3.65837 0.351189 4.3851 0 5.14286 0Z"
                                    fill={activeTab === 'attachments' ? 'white' : '#535352'} />
                            </svg>
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="mb-[35px]">
                        {activeTab === 'description' && (
                            <div>
                                <p className="text-[16px] font-normal text-black leading-normal whitespace-pre-wrap">
                                    {displayDescription}
                                    {shouldTruncate && !showFullDescription && (
                                        <button
                                            type="button"
                                            onClick={() => setShowFullDescription(true)}
                                            className="text-[14px] font-semibold text-[#008080] ml-1 cursor-pointer"
                                        >
                                            Read More
                                        </button>
                                    )}
                                </p>
                            </div>
                        )}

                        {activeTab === 'comments' && (
                            <CommentSection
                                comments={comments}
                                currentUser={currentUser}
                                onAddComment={handleAddComment}
                                onLike={handleLike}
                                onDislike={handleDislike}
                                onDelete={handleDeleteComment}
                            />
                        )}

                        {activeTab === 'attachments' && (
                            <div>
                                {meeting.attachments && meeting.attachments.length > 0 ? (
                                    <div className="space-y-[10px]">
                                        {meeting.attachments.map((attachment) => {
                                            const getAttachmentIcon = () => {
                                                switch (attachment.type) {
                                                    case 'pdf':
                                                        return (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 9 12" fill="none">
                                                                <path d="M4.26328 6.00234C4.14609 5.62734 4.14844 4.90312 4.21641 4.90312C4.41328 4.90312 4.39453 5.76797 4.26328 6.00234ZM4.22344 7.10859C4.04297 7.58203 3.81797 8.12344 3.55781 8.57812C3.98672 8.41406 4.47187 8.175 5.03203 8.06484C4.73438 7.83984 4.44844 7.51641 4.22344 7.10859ZM2.01797 10.0336C2.01797 10.0523 2.32734 9.90703 2.83594 9.09141C2.67891 9.23906 2.15391 9.66563 2.01797 10.0336ZM5.8125 3.75H9V11.4375C9 11.7492 8.74922 12 8.4375 12H0.5625C0.250781 12 0 11.7492 0 11.4375V0.5625C0 0.250781 0.250781 0 0.5625 0H5.25V3.1875C5.25 3.49688 5.50313 3.75 5.8125 3.75ZM5.625 7.77656C5.15625 7.49062 4.84453 7.09688 4.62422 6.51562C4.72969 6.08203 4.89609 5.42344 4.76953 5.01094C4.65938 4.32188 3.77578 4.38984 3.64922 4.85156C3.53203 5.28047 3.63984 5.88516 3.83906 6.65625C3.56719 7.30312 3.16641 8.17031 2.88281 8.66719C2.88047 8.66719 2.88047 8.66953 2.87813 8.66953C2.24297 8.99531 1.15313 9.7125 1.60078 10.2633C1.73203 10.425 1.97578 10.4977 2.10469 10.4977C2.52422 10.4977 2.94141 10.0758 3.53672 9.04922C4.14141 8.85 4.80469 8.60156 5.38828 8.50547C5.89687 8.78203 6.49219 8.9625 6.88828 8.9625C7.57266 8.9625 7.61953 8.2125 7.35 7.94531C7.02422 7.62656 6.07734 7.71797 5.625 7.77656ZM7.09922 8.44453C7.19531 8.38125 7.04063 8.16562 6.09609 8.23359C6.96563 8.60391 7.09922 8.44453 7.09922 8.44453Z" fill="#E31E24" />
                                                            </svg>
                                                        );
                                                    case 'link':
                                                        return (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 8 16" fill="none">
                                                                <path d="M5.14286 0C5.90062 0 6.62734 0.351189 7.16316 0.976311C7.69898 1.60143 8 2.44928 8 3.33333V11.3333C8 11.9462 7.89654 12.553 7.69552 13.1192C7.4945 13.6854 7.19986 14.1998 6.82843 14.6332C6.45699 15.0665 6.01604 15.4102 5.53073 15.6448C5.04543 15.8793 4.52529 16 4 16C3.47471 16 2.95457 15.8793 2.46927 15.6448C1.98396 15.4102 1.54301 15.0665 1.17157 14.6332C0.800139 14.1998 0.505501 13.6854 0.304482 13.1192C0.103463 12.553 -7.82739e-09 11.9462 0 11.3333V6H1.14286V11.3333C1.14286 12.2174 1.44388 13.0652 1.97969 13.6904C2.51551 14.3155 3.24224 14.6667 4 14.6667C4.75776 14.6667 5.48449 14.3155 6.02031 13.6904C6.55612 13.0652 6.85714 12.2174 6.85714 11.3333V3.33333C6.85714 3.07069 6.8128 2.81062 6.72665 2.56797C6.6405 2.32532 6.51423 2.10484 6.35504 1.91912C6.19585 1.7334 6.00687 1.58608 5.79889 1.48557C5.5909 1.38506 5.36798 1.33333 5.14286 1.33333C4.91773 1.33333 4.69482 1.38506 4.48683 1.48557C4.27884 1.58608 4.08986 1.7334 3.93067 1.91912C3.77149 2.10484 3.64521 2.32532 3.55906 2.56797C3.47291 2.81062 3.42857 3.07069 3.42857 3.33333V11.3333C3.42857 11.5101 3.48878 11.6797 3.59594 11.8047C3.7031 11.9298 3.84845 12 4 12C4.15155 12 4.2969 11.9298 4.40406 11.8047C4.51122 11.6797 4.57143 11.5101 4.57143 11.3333V4H5.71429V11.3333C5.71429 11.8638 5.53367 12.3725 5.21218 12.7475C4.89069 13.1226 4.45466 13.3333 4 13.3333C3.54534 13.3333 3.10931 13.1226 2.78782 12.7475C2.46633 12.3725 2.28571 11.8638 2.28571 11.3333V3.33333C2.28571 2.44928 2.58673 1.60143 3.12255 0.976311C3.65837 0.351189 4.3851 0 5.14286 0Z" fill="#535352" />
                                                            </svg>
                                                        );
                                                    default:
                                                        return (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 12 12" fill="none">
                                                                <path d="M6.85714 0C7.42546 0 7.97051 0.263392 8.37237 0.732233C8.77424 1.20107 9 1.83696 9 2.5V8.5C9 8.95963 8.9224 9.41475 8.77164 9.83939C8.62087 10.264 8.3999 10.6499 8.12132 10.9749C7.84274 11.2999 7.51203 11.5577 7.14805 11.7336C6.78407 11.9095 6.39397 12 6 12C5.60603 12 5.21593 11.9095 4.85195 11.7336C4.48797 11.5577 4.15726 11.2999 3.87868 10.9749C3.6001 10.6499 3.37913 10.264 3.22836 9.83939C3.0776 9.41475 3 8.95963 3 8.5V4.5H3.85714V8.5C3.85714 9.16304 4.08291 9.79893 4.48477 10.2678C4.88663 10.7366 5.43168 11 6 11C6.56832 11 7.11337 10.7366 7.51523 10.2678C7.91709 9.79893 8.14286 9.16304 8.14286 8.5V2.5C8.14286 2.30302 8.1096 2.10796 8.04499 1.92597C7.98037 1.74399 7.88567 1.57863 7.76628 1.43934C7.64689 1.30005 7.50515 1.18956 7.34916 1.11418C7.19317 1.0388 7.02599 1 6.85714 1C6.6883 1 6.52111 1.0388 6.36512 1.11418C6.20913 1.18956 6.06739 1.30005 5.94801 1.43934C5.82862 1.57863 5.73391 1.74399 5.6693 1.92597C5.60468 2.10796 5.57143 2.30302 5.57143 2.5V8.5C5.57143 8.63261 5.61658 8.75979 5.69695 8.85355C5.77733 8.94732 5.88634 9 6 9C6.11366 9 6.22267 8.94732 6.30305 8.85355C6.38342 8.75979 6.42857 8.63261 6.42857 8.5V3H7.28571V8.5C7.28571 8.89782 7.15026 9.27936 6.90914 9.56066C6.66802 9.84196 6.34099 10 6 10C5.65901 10 5.33198 9.84196 5.09086 9.56066C4.84974 9.27936 4.71429 8.89782 4.71429 8.5V2.5C4.71429 1.83696 4.94005 1.20107 5.34191 0.732233C5.74378 0.263392 6.28882 0 6.85714 0Z" fill="#535352" />
                                                            </svg>
                                                        );
                                                }
                                            };
                                            return (
                                                <div key={attachment.id} className="flex items-center gap-[10px]">
                                                    <div className="size-[16px] flex items-center justify-center shrink-0">
                                                        {getAttachmentIcon()}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenAttachment(attachment.url)}
                                                        className="text-[14px] font-normal text-[#535352] cursor-pointer hover:underline text-left"
                                                    >
                                                        {attachment.name}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[14px] font-normal text-[#535352]">No attachments.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Join Meeting Button and Status */}
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handleJoinMeeting}
                            className="bg-[#5a62c3] flex items-center gap-[15px] px-[25px] py-[10px] rounded-[25px] text-white text-[14px] font-semibold hover:opacity-90 transition cursor-pointer"
                        >
                            <span>Join the Meeting</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 16 14" fill="none">
                                <path d="M15 7L9 1M15 7L9 13M15 7L1 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </button>
                        <div className="flex-1" />
                        <StatusBadge status={meeting.status} isSelected={true} onClick={handleStatusToggle} />
                    </div>

                    {/* Footer with Created By and Actions */}
                    <div className="flex items-center justify-between pt-5 pb-2.5">
                        <div className="flex items-center gap-[5px]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 16C4.1101 15.1018 1 11.2887 1 7.27273V2.90909L8 0L15 2.90909V7.27273C15 11.2902 11.8899 15.1018 8 16ZM2.4 3.63636V7.27273C2.44 8.95428 3.00925 10.5759 4.02062 11.8894C5.032 13.2028 6.42977 14.1358 8 14.5455C9.57023 14.1358 10.968 13.2028 11.9794 11.8894C12.9907 10.5759 13.56 8.95428 13.6 7.27273V3.63636L8 1.45455L2.4 3.63636Z" fill="black" />
                                <path d="M8 7C9.10457 7 10 6.10457 10 5C10 3.89543 9.10457 3 8 3C6.89543 3 6 3.89543 6 5C6 6.10457 6.89543 7 8 7Z" fill="black" />
                                <path d="M5 10.5C5.29564 11.2486 5.72924 11.8746 6.25639 12.3139C6.78354 12.7532 7.38529 12.99 8 13C8.61471 12.99 9.21647 12.7532 9.74361 12.3139C10.2708 11.8746 10.7044 11.2486 11 10.5C10.985 8.92 8.9948 8 8 8C6.9998 8 5.015 8.92 5 10.5Z" fill="black" />
                            </svg>
                            <span className="text-[14px] font-normal text-black">
                                Created by: {meeting.createdBy.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-[10px]">
                            {onEdit && (
                                <Tooltip content="Edit Event" side="top">
                                    <button
                                        type="button"
                                        onClick={() => onEdit(meeting)}
                                        className="size-[28px] flex items-center justify-center cursor-pointer hover:opacity-80 bg-[#1E88E5] rounded-full"
                                        aria-label="Edit"
                                    >
                                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M0 3.63758C0 2.67284 0.383244 1.7476 1.06542 1.06542C1.7476 0.383244 2.67284 0 3.63758 0H7.48936C7.68799 0 7.87849 0.0789055 8.01894 0.219358C8.15939 0.359811 8.2383 0.550306 8.2383 0.748936C8.2383 0.947567 8.15939 1.13806 8.01894 1.27851C7.87849 1.41897 7.68799 1.49787 7.48936 1.49787H3.63758C3.0701 1.49787 2.52585 1.72331 2.12458 2.12458C1.72331 2.52585 1.49787 3.0701 1.49787 3.63758V11.3411C1.49787 11.9086 1.72331 12.4529 2.12458 12.8541C2.52585 13.2554 3.0701 13.4809 3.63758 13.4809H11.3411C11.9086 13.4809 12.4529 13.2554 12.8541 12.8541C13.2554 12.4529 13.4809 11.9086 13.4809 11.3411V7.48936C13.4809 7.29073 13.5598 7.10024 13.7002 6.95978C13.8407 6.81933 14.0312 6.74043 14.2298 6.74043C14.4284 6.74043 14.6189 6.81933 14.7594 6.95978C14.8998 7.10024 14.9787 7.29073 14.9787 7.48936V11.3411C14.9787 12.3059 14.5955 13.2311 13.9133 13.9133C13.2311 14.5955 12.3059 14.9787 11.3411 14.9787H3.63758C2.67284 14.9787 1.7476 14.5955 1.06542 13.9133C0.383244 13.2311 0 12.3059 0 11.3411V3.63758Z" fill="white" />
                                            <path fillRule="evenodd" clipRule="evenodd" d="M9.83568 8.40092L8.18427 9.39701L7.41062 8.11408L9.06203 7.11799L9.06427 7.1165C9.12757 7.07838 9.18593 7.03259 9.23803 6.98019L12.9902 3.20855C13.0278 3.17065 13.064 3.13143 13.0988 3.09096C13.3467 2.80187 13.7137 2.22969 13.2696 1.78332C12.8943 1.40586 12.3566 1.76235 12.0083 2.06867C11.9149 2.15102 11.825 2.23722 11.7387 2.32705L11.7133 2.35251L8.01352 6.07098C7.92567 6.15831 7.85683 6.26285 7.8113 6.37804L7.19418 7.93059C7.18248 7.9598 7.18027 7.99196 7.18788 8.0225C7.19549 8.05304 7.21252 8.0804 7.23656 8.10071C7.2606 8.12102 7.29043 8.13324 7.32181 8.13564C7.35318 8.13804 7.38377 8.1305 7.41062 8.11408L8.18427 9.39701C6.83244 10.2118 5.21849 8.84279 5.80266 7.37638L6.42053 5.82458C6.54083 5.52134 6.72177 5.24584 6.95227 5.01498L10.6513 1.29576L10.673 1.27404C10.7831 1.1617 11.1531 0.782742 11.6017 0.510129C11.8466 0.362589 12.2375 0.167116 12.7206 0.129669C13.2748 0.085482 13.8665 0.259984 14.3308 0.726571C14.6862 1.07766 14.9097 1.54055 14.9636 2.03721C15.0007 2.42433 14.9416 2.81462 14.7914 3.17335C14.5742 3.71033 14.2117 4.10502 14.0522 4.26455L10.3 8.03619C10.1602 8.17649 10.0054 8.29807 9.83568 8.40092ZM13.1707 3.064C13.1707 3.064 13.1677 3.06625 13.161 3.0685L13.1707 3.064Z" fill="white" />
                                        </svg>
                                    </button>
                                </Tooltip>
                            )}
                            {onDelete && (
                                <Tooltip content="Delete Event" side="top">
                                    <button
                                        type="button"
                                        onClick={() => onDelete(meeting.id)}
                                        className="size-[28px] flex items-center justify-center cursor-pointer hover:opacity-80 bg-[#D93025] rounded-full"
                                        aria-label="Delete"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
                                            <path d="M4.52482 1.34809H4.36879C4.45461 1.34809 4.52482 1.28068 4.52482 1.1983V1.34809ZM4.52482 1.34809H10.4539V1.1983C10.4539 1.28068 10.5241 1.34809 10.6099 1.34809H10.4539V2.69617H11.8582V1.1983C11.8582 0.537362 11.2984 0 10.6099 0H4.36879C3.68032 0 3.12057 0.537362 3.12057 1.1983V2.69617H4.52482V1.34809ZM14.3546 2.69617H0.624114C0.278901 2.69617 0 2.96392 0 3.29532V3.89447C0 3.97685 0.0702128 4.04426 0.156028 4.04426H1.33404L1.81578 13.8366C1.84699 14.4751 2.39699 14.9787 3.06206 14.9787H11.9167C12.5837 14.9787 13.1317 14.4769 13.1629 13.8366L13.6447 4.04426H14.8227C14.9085 4.04426 14.9787 3.97685 14.9787 3.89447V3.29532C14.9787 2.96392 14.6998 2.69617 14.3546 2.69617ZM11.7665 13.6306H3.21223L2.74025 4.04426H12.2385L11.7665 13.6306Z" fill="white" />
                                        </svg>
                                    </button>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >,
        document.body
    );
};

export default MeetingInfoModal;
