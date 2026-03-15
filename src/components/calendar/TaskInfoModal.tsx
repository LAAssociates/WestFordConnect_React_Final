import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils/cn';
import type { Task, Comment, Attachment, User } from '../my-work/types';
import StatusBadge from '../my-work/StatusBadge';
import PriorityBadge from '../my-work/PriorityBadge';
import avatarPlaceholder from '../../assets/images/avatar-placeholder-2.png';
import Tooltip from '../ui/Tooltip';
import CommentSection from './CommentSection';
import AttachmentViewerDrawer from './AttachmentViewerDrawer';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../contexts/AuthContext';

interface TaskInfoModalProps {
    isOpen: boolean;
    task: Task | null;
    onClose: () => void;
    onEdit?: (task: Task) => void;
    onDelete?: (taskId: string) => void;
}

type TabType = 'description' | 'comments' | 'attachments';

const TaskInfoModal: React.FC<TaskInfoModalProps> = ({ isOpen, task, onClose, onEdit, onDelete }) => {
    const { user: authUser } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('description');
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [showAllAssignedUsers, setShowAllAssignedUsers] = useState(false);
    const [maxHeight, setMaxHeight] = useState<number>(60);
    const contentRef = useRef<HTMLDivElement>(null);
    const currentUser: User = {
        id: authUser?.id ? String(authUser.id) : '0',
        name: authUser ? `${authUser.firstName} ${authUser.lastName}`.trim() : 'You',
        position: 'You',
        email: authUser?.email || '',
        avatar: authUser?.picture || undefined,
    };
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
    const menuButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    useEffect(() => {
        if (task) {
            setComments(task.comments || []);
        }
    }, [task]);

    useEffect(() => {
        if (contentRef.current) {
            const height = contentRef.current.scrollHeight;
            setMaxHeight(height);
        }
    }, [showAllAssignedUsers, task]);

    if (!isOpen || !task) return null;

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    const formatTime = (time?: string) => {
        if (!time || time === 'EOD') return 'EOD';
        return time;
    };

    const assignedUsers = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
    const visibleUsers = assignedUsers.slice(0, 2);
    const remainingCount = assignedUsers.length - 2;


    const description = task.description || '';
    const shouldTruncate = description.length > 150;
    const displayDescription = shouldTruncate && !showFullDescription
        ? description.substring(0, 150) + '... '
        : description;

    const handleAddComment = async (text: string, parentId?: string) => {
        const newComment: Comment = {
            id: `comment-${Date.now()}`,
            text: text.trim(),
            author: currentUser,
            createdAt: new Date(),
            likes: 0,
            dislikes: 0,
            replies: parentId ? undefined : [],
        };

        if (parentId) {
            const addReply = (comments: Comment[]): Comment[] => {
                return comments.map((comment) => {
                    if (comment.id === parentId) {
                        return {
                            ...comment,
                            replies: [...(comment.replies || []), newComment],
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
        } else {
            setComments([...comments, newComment]);
        }
    };

    const handleLike = async (commentId: string, _isReply?: boolean, _parentId?: string) => {
        const toggleLike = (comments: Comment[]): Comment[] => {
            return comments.map((comment) => {
                if (comment.id === commentId) {
                    const wasLiked = comment.userLiked;
                    const wasDisliked = comment.userDisliked;
                    return {
                        ...comment,
                        userLiked: !wasLiked,
                        userDisliked: false,
                        likes: wasLiked ? comment.likes - 1 : comment.likes + 1,
                        dislikes: wasDisliked ? comment.dislikes - 1 : comment.dislikes,
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
    };

    const handleDislike = async (commentId: string, _isReply?: boolean, _parentId?: string) => {
        const toggleDislike = (comments: Comment[]): Comment[] => {
            return comments.map((comment) => {
                if (comment.id === commentId) {
                    const wasDisliked = comment.userDisliked;
                    const wasLiked = comment.userLiked;
                    return {
                        ...comment,
                        userDisliked: !wasDisliked,
                        userLiked: false,
                        dislikes: wasDisliked ? comment.dislikes - 1 : comment.dislikes + 1,
                        likes: wasLiked ? comment.likes - 1 : comment.likes,
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
    };

    const handleDeleteComment = async (commentId: string, _isReply?: boolean) => {
        const deleteComment = (comments: Comment[]): Comment[] => {
            return comments
                .filter((comment) => comment.id !== commentId)
                .map((comment) => {
                    if (comment.replies) {
                        return {
                            ...comment,
                            replies: deleteComment(comment.replies),
                        };
                    }
                    return comment;
                });
        };
        setComments(deleteComment(comments));
    };

    const handleViewAttachment = async (attachment: Attachment) => {
        let resolvedAttachment = attachment;

        // For file attachments without URL, resolve a temporary/open URL via API.
        if (!resolvedAttachment.url && attachment.type !== 'link') {
            const taskId = parseInt(task.id, 10);
            const attachmentId = parseInt(attachment.id, 10);
            if (!Number.isNaN(taskId) && taskId > 0 && !Number.isNaN(attachmentId) && attachmentId > 0) {
                try {
                    const response = await taskService.downloadTaskAttachment(taskId, attachmentId);
                    const resolvedUrl = response.result?.url;
                    if (resolvedUrl) {
                        resolvedAttachment = { ...attachment, url: resolvedUrl };
                    }
                } catch (error) {
                    console.error('TaskInfoModal: failed to resolve attachment preview URL', error);
                }
            }
        }

        setViewingAttachment(resolvedAttachment);
        setOpenMenuId(null);
    };

    const handleDownloadAttachment = (attachment: Attachment) => {
        if (attachment.url) {
            window.open(attachment.url, '_blank');
        }
        setOpenMenuId(null);
    };

    const toggleMenu = (attachmentId: string) => {
        setOpenMenuId(openMenuId === attachmentId ? null : attachmentId);
    };

    // Attachment Menu Component
    const AttachmentMenu: React.FC<{
        attachment: Attachment;
        buttonRef: HTMLButtonElement | null;
        onClose: () => void;
        onView: () => void;
        onDownload: () => void;
    }> = ({ buttonRef, onClose, onView, onDownload }) => {
        const menuRef = useRef<HTMLDivElement>(null);
        const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

        useEffect(() => {
            if (!buttonRef) return;

            const updateMenuPosition = () => {
                const rect = buttonRef.getBoundingClientRect();
                const dropdownWidth = 72; // 2 icons (24px each) + 2 gaps (10px each) + padding (5px * 2) = 48 + 20 + 4 = 72px
                const OFFSET_PX = 8;
                const padding = 10;

                // Position to the left of the button
                let menuLeft = rect.left - dropdownWidth - OFFSET_PX;

                // Ensure menu stays within viewport bounds
                const minLeft = padding;
                if (menuLeft < minLeft) {
                    menuLeft = minLeft;
                }

                // Center vertically with the button
                const menuTop = rect.top + rect.height / 2 - 12; // 12px is half of icon height (24px)

                setMenuPosition({
                    top: menuTop,
                    left: menuLeft,
                });
            };

            updateMenuPosition();

            const handleWindowChange = () => {
                updateMenuPosition();
            };

            window.addEventListener('resize', handleWindowChange);
            window.addEventListener('scroll', handleWindowChange, true);

            return () => {
                window.removeEventListener('resize', handleWindowChange);
                window.removeEventListener('scroll', handleWindowChange, true);
            };
        }, [buttonRef]);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent | TouchEvent) => {
                const target = event.target as Node;

                if (buttonRef?.contains(target) || menuRef.current?.contains(target)) {
                    return;
                }

                onClose();
            };

            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('touchstart', handleClickOutside);
            };
        }, [buttonRef, onClose]);

        if (!menuPosition) return null;

        return createPortal(
            <div
                ref={menuRef}
                className="bg-[#232725] rounded-[5px] shadow-lg z-40 overflow-hidden"
                style={{
                    position: 'fixed',
                    top: menuPosition.top,
                    left: menuPosition.left,
                }}
            >
                <div className="p-[5px] flex items-center gap-[10px]">
                    <button
                        type="button"
                        onClick={() => {
                            onView();
                        }}
                        className="cursor-pointer w-6 h-6 flex items-center justify-center rounded-[3px] hover:bg-[#2F3432] transition-colors shrink-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M5.25 0.75H2.25C1.85218 0.75 1.47064 0.908035 1.18934 1.18934C0.908035 1.47064 0.75 1.85218 0.75 2.25V11.25C0.75 11.6478 0.908035 12.0294 1.18934 12.3107C1.47064 12.592 1.85218 12.75 2.25 12.75H11.25C11.6478 12.75 12.0294 12.592 12.3107 12.3107C12.592 12.0294 12.75 11.6478 12.75 11.25V8.25M6.75 6.75L12.75 0.75M12.75 0.75V4.5M12.75 0.75H9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onDownload();
                        }}
                        className="cursor-pointer w-6 h-6 flex items-center justify-center rounded-[3px] hover:bg-[#2F3432] transition-colors shrink-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M6.99999 10.1281C6.88333 10.1281 6.77395 10.11 6.67187 10.0739C6.56979 10.0377 6.47499 9.97558 6.3875 9.8875L3.2375 6.7375C3.0625 6.5625 2.9785 6.35833 2.9855 6.125C2.9925 5.89167 3.0765 5.6875 3.2375 5.5125C3.4125 5.3375 3.62046 5.2465 3.86137 5.2395C4.10229 5.2325 4.30995 5.31621 4.48437 5.49063L6.125 7.13125V0.875003C6.125 0.627086 6.20899 0.41942 6.377 0.252003C6.54499 0.0845864 6.75266 0.00058635 6.99999 3.01724e-06C7.24733 -0.000580316 7.45529 0.0834198 7.62387 0.252003C7.79245 0.420586 7.87616 0.628253 7.87499 0.875003V7.13125L9.51562 5.49063C9.69062 5.31563 9.89858 5.23163 10.1395 5.23863C10.3804 5.24563 10.5881 5.33692 10.7625 5.5125C10.9229 5.6875 11.0069 5.89167 11.0145 6.125C11.0221 6.35833 10.9381 6.5625 10.7625 6.7375L7.61249 9.8875C7.52499 9.975 7.4302 10.0371 7.32812 10.0739C7.22604 10.1106 7.11666 10.1287 6.99999 10.1281ZM1.75 14C1.26875 14 0.856916 13.8288 0.514499 13.4864C0.172083 13.144 0.000583333 12.7318 0 12.25V10.5C0 10.2521 0.084 10.0444 0.252 9.877C0.42 9.70958 0.627666 9.62558 0.874999 9.625C1.12233 9.62442 1.33029 9.70842 1.49887 9.877C1.66746 10.0456 1.75117 10.2533 1.75 10.5V12.25H12.25V10.5C12.25 10.2521 12.334 10.0444 12.502 9.877C12.67 9.70958 12.8777 9.62558 13.125 9.625C13.3723 9.62442 13.5803 9.70842 13.7489 9.877C13.9174 10.0456 14.0012 10.2533 14 10.5V12.25C14 12.7312 13.8288 13.1434 13.4864 13.4864C13.1439 13.8294 12.7318 14.0006 12.25 14H1.75Z" fill="white" />
                        </svg>
                    </button>
                </div>
            </div>,
            document.body
        );
    };

    return createPortal(
        <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
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
                        <mask id="mask0_task" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="22">
                            <path d="M11 21C16.523 21 21 16.523 21 11C21 5.477 16.523 1 11 1C5.477 1 1 5.477 1 11C1 16.523 5.477 21 11 21Z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                            <path d="M13.8289 8.17188L8.17188 13.8289M8.17188 8.17188L13.8289 13.8289" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </mask>
                        <g mask="url(#mask0_task)">
                            <path d="M-1 -1H23V23H-1V-1Z" fill="black" />
                        </g>
                    </svg>
                </button>

                <div className="p-[20px]">
                    {/* Header */}
                    <div className="flex items-start gap-[5px] mb-[25px]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
                            <g clip-path="url(#clip0_4539_10272)">
                                <path d="M9.46777 0.512695C9.98594 -0.00344977 10.8621 -0.0344891 11.4229 0.415039L11.5312 0.511719L13.7676 2.75L13.8828 2.86621L13.9336 2.70996C14.3877 1.29823 15.7129 0.273438 17.2715 0.273438C19.2039 0.273676 20.7761 1.84793 20.7764 3.78223C20.7764 5.34185 19.7535 6.66849 18.3418 7.12207L18.1855 7.17188L18.3018 7.28711L20.4746 9.45996C21.042 10.0294 21.0414 10.9557 20.4746 11.5244L11.5312 20.4727C11.2543 20.7487 10.8891 20.9004 10.5 20.9004C10.1109 20.9004 9.7453 20.7492 9.46973 20.4746L0.524414 11.5254H0.525391C-0.0409404 10.956 -0.0421439 10.0291 0.522461 9.46094L0.523438 9.46191L3.7998 6.18359C3.9498 6.03353 4.17013 5.98368 4.36719 6.04883L4.4502 6.08398C4.66474 6.19618 4.78221 6.43504 4.74023 6.67383C4.7061 6.86538 4.69043 7.02269 4.69043 7.16602C4.69059 8.65501 5.90121 9.89258 7.39258 9.89258C8.89115 9.89252 9.9774 8.64876 9.97754 7.16602C9.97754 5.68002 8.89017 4.46002 7.39258 4.45996C7.25048 4.45996 7.09447 4.47696 6.90332 4.51074H6.90234C6.66255 4.5549 6.42615 4.43603 6.31348 4.2207C6.20118 4.00518 6.24167 3.74085 6.41309 3.56934L9.46777 0.512695Z" fill="#9A9A9A" stroke="#9A9A9A" stroke-width="0.2" />
                            </g>
                            <defs>
                                <clipPath id="clip0_4539_10272">
                                    <rect width="21" height="21" fill="white" />
                                </clipPath>
                            </defs>
                        </svg>
                        <div className="flex-1 flex flex-col gap-[6px]">
                            <h2 className="text-[18px] font-semibold text-black leading-normal mb-0">{task.title}</h2>

                            {/* Date/Time and Priority */}
                            <div className="flex items-end gap-[15px]">
                                <div className="flex items-center gap-[5px]">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M11.5142 2.64453H2.80304C2.11575 2.64453 1.55859 3.20169 1.55859 3.88898V11.9779C1.55859 12.6652 2.11575 13.2223 2.80304 13.2223H11.5142C12.2015 13.2223 12.7586 12.6652 12.7586 11.9779V3.88898C12.7586 3.20169 12.2015 2.64453 11.5142 2.64453Z" stroke="#535352" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M4.04749 0.777344V2.64402M10.2697 0.777344V2.64402M1.55859 5.75514H12.7586" stroke="#535352" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                    <span className="text-[14px] font-normal text-[#535352]">{formatDate(task.dueDate)}</span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="2" height="18" viewBox="0 0 2 18" fill="none">
                                    <path d="M1 1L1 17" stroke="#E6E6E6" stroke-width="2" stroke-linecap="round" />
                                </svg>
                                <div className="flex items-center gap-[5px]">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M7 0C10.8661 0 14 3.1339 14 7C14 10.8661 10.8661 14 7 14C3.1339 14 0 10.8661 0 7C0 3.1339 3.1339 0 7 0ZM7 1.4C5.51479 1.4 4.09041 1.99 3.0402 3.0402C1.99 4.09041 1.4 5.51479 1.4 7C1.4 8.48521 1.99 9.90959 3.0402 10.9598C4.09041 12.01 5.51479 12.6 7 12.6C8.48521 12.6 9.90959 12.01 10.9598 10.9598C12.01 9.90959 12.6 8.48521 12.6 7C12.6 5.51479 12.01 4.09041 10.9598 3.0402C9.90959 1.99 8.48521 1.4 7 1.4ZM7 2.8C7.17145 2.80002 7.33694 2.86297 7.46506 2.9769C7.59318 3.09083 7.67504 3.24782 7.6951 3.4181L7.7 3.5V6.7102L9.5949 8.6051C9.72044 8.73107 9.79333 8.9001 9.79876 9.07787C9.80419 9.25563 9.74175 9.4288 9.62413 9.56219C9.5065 9.69559 9.34251 9.77921 9.16547 9.79608C8.98842 9.81294 8.81159 9.76179 8.6709 9.653L8.6051 9.5949L6.5051 7.4949C6.39631 7.38601 6.32643 7.2443 6.3063 7.0917L6.3 7V3.5C6.3 3.31435 6.37375 3.1363 6.50503 3.00503C6.6363 2.87375 6.81435 2.8 7 2.8Z" fill="#535352" />
                                    </svg>
                                    <span className="text-[14px] font-normal text-[#535352]">{formatTime(task.dueTime)}</span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="2" height="18" viewBox="0 0 2 18" fill="none">
                                    <path d="M1 1L1 17" stroke="#E6E6E6" stroke-width="2" stroke-linecap="round" />
                                </svg>
                                <div className="relative shrink-0 size-[17px]">
                                    <PriorityBadge priority={task.priority} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Assigned To */}
                    {assignedUsers.length > 0 && (
                        <div className="mb-[20px]">
                            <div
                                ref={contentRef}
                                className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                                style={{
                                    maxHeight: showAllAssignedUsers ? `${maxHeight}px` : '60px'
                                }}
                            >
                                {!showAllAssignedUsers ? (
                                    // Collapsed view
                                    <div className="flex items-center gap-[10px] mb-[10px]">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M5.64706 7.07143C6.2055 7.07143 6.7514 6.90805 7.21573 6.60195C7.68005 6.29585 8.04195 5.86078 8.25566 5.35176C8.46937 4.84274 8.52528 4.28262 8.41633 3.74225C8.30739 3.20187 8.03847 2.70551 7.6436 2.31592C7.24872 1.92633 6.74561 1.66102 6.1979 1.55353C5.65019 1.44604 5.08247 1.50121 4.56654 1.71205C4.05061 1.9229 3.60963 2.27995 3.29938 2.73806C2.98913 3.19616 2.82353 3.73475 2.82353 4.28572C2.82353 5.02453 3.12101 5.73309 3.65052 6.25551C4.18004 6.77794 4.89821 7.07143 5.64706 7.07143ZM5.64706 3.35714C5.83321 3.35714 6.01517 3.4116 6.16995 3.51364C6.32472 3.61567 6.44536 3.76069 6.51659 3.93037C6.58783 4.10004 6.60647 4.28675 6.57015 4.46687C6.53384 4.647 6.4442 4.81245 6.31257 4.94231C6.18095 5.07218 6.01324 5.16062 5.83067 5.19644C5.6481 5.23227 5.45886 5.21388 5.28689 5.1436C5.11491 5.07332 4.96792 4.9543 4.8645 4.8016C4.76108 4.6489 4.70588 4.46937 4.70588 4.28572C4.70588 4.03944 4.80504 3.80326 4.98155 3.62912C5.15805 3.45498 5.39744 3.35714 5.64706 3.35714ZM9.5153 6.94143C10.0659 6.16239 10.3612 5.23547 10.3612 4.28572C10.3612 3.33596 10.0659 2.40904 9.5153 1.63C9.78594 1.54388 10.0686 1.50002 10.3529 1.5C11.1018 1.5 11.82 1.7935 12.3495 2.31592C12.879 2.83834 13.1765 3.5469 13.1765 4.28572C13.1765 5.02453 12.879 5.73309 12.3495 6.25551C11.82 6.77794 11.1018 7.07143 10.3529 7.07143C10.0686 7.07141 9.78594 7.02755 9.5153 6.94143ZM5.64706 8.92857C4.76837e-07 8.92857 0 12.6429 0 12.6429V14.5H11.2941V12.6429C11.2941 12.6429 11.2941 8.92857 5.64706 8.92857ZM1.88235 12.6429C1.88235 12.3736 2.18353 10.7857 5.64706 10.7857C8.94118 10.7857 9.35529 12.2343 9.41177 12.6429M16 12.6429V14.5H13.1765V12.6429C13.1545 11.9526 12.9933 11.2736 12.7025 10.6454C12.4116 10.0173 11.9968 9.45257 11.4824 8.98429C16 9.43929 16 12.6429 16 12.6429Z" fill="black" />
                                        </svg>
                                        <span className="text-[16px] font-normal text-black">Assigned To:</span>
                                        <div className="flex items-center gap-[5px] flex-wrap">
                                            {visibleUsers.map((user) => (
                                                <div
                                                    key={user.id}
                                                    className="bg-white border border-[#e6e6e6] rounded-[3px] px-[5px] py-[3px] flex items-center gap-[5px]"
                                                >
                                                    <img
                                                        src={user.avatar || avatarPlaceholder}
                                                        alt={user.name}
                                                        className="size-[24px] rounded-full object-cover"
                                                    />
                                                    <span className="text-[15px] font-medium text-black">{user.name.split(' ')[0]}</span>
                                                </div>
                                            ))}
                                            {remainingCount > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAllAssignedUsers(true)}
                                                    className="bg-white border border-[#e6e6e6] rounded-[3px] px-[5px] py-[3px] h-[30px] flex items-center justify-center cursor-pointer hover:bg-gray-50"
                                                >
                                                    <span className="text-[15px] font-normal text-black">+{remainingCount} more</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    // Expanded view
                                    <div>
                                        <div className="flex items-center justify-between mb-[10px]">
                                            <div className="flex items-center gap-[10px]">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                    <path d="M5.64706 7.07143C6.2055 7.07143 6.7514 6.90805 7.21573 6.60195C7.68005 6.29585 8.04195 5.86078 8.25566 5.35176C8.46937 4.84274 8.52528 4.28262 8.41633 3.74225C8.30739 3.20187 8.03847 2.70551 7.6436 2.31592C7.24872 1.92633 6.74561 1.66102 6.1979 1.55353C5.65019 1.44604 5.08247 1.50121 4.56654 1.71205C4.05061 1.9229 3.60963 2.27995 3.29938 2.73806C2.98913 3.19616 2.82353 3.73475 2.82353 4.28572C2.82353 5.02453 3.12101 5.73309 3.65052 6.25551C4.18004 6.77794 4.89821 7.07143 5.64706 7.07143ZM5.64706 3.35714C5.83321 3.35714 6.01517 3.4116 6.16995 3.51364C6.32472 3.61567 6.44536 3.76069 6.51659 3.93037C6.58783 4.10004 6.60647 4.28675 6.57015 4.46687C6.53384 4.647 6.4442 4.81245 6.31257 4.94231C6.18095 5.07218 6.01324 5.16062 5.83067 5.19644C5.6481 5.23227 5.45886 5.21388 5.28689 5.1436C5.11491 5.07332 4.96792 4.9543 4.8645 4.8016C4.76108 4.6489 4.70588 4.46937 4.70588 4.28572C4.70588 4.03944 4.80504 3.80326 4.98155 3.62912C5.15805 3.45498 5.39744 3.35714 5.64706 3.35714ZM9.5153 6.94143C10.0659 6.16239 10.3612 5.23547 10.3612 4.28572C10.3612 3.33596 10.0659 2.40904 9.5153 1.63C9.78594 1.54388 10.0686 1.50002 10.3529 1.5C11.1018 1.5 11.82 1.7935 12.3495 2.31592C12.879 2.83834 13.1765 3.5469 13.1765 4.28572C13.1765 5.02453 12.879 5.73309 12.3495 6.25551C11.82 6.77794 11.1018 7.07143 10.3529 7.07143C10.0686 7.07141 9.78594 7.02755 9.5153 6.94143ZM5.64706 8.92857C4.76837e-07 8.92857 0 12.6429 0 12.6429V14.5H11.2941V12.6429C11.2941 12.6429 11.2941 8.92857 5.64706 8.92857ZM1.88235 12.6429C1.88235 12.3736 2.18353 10.7857 5.64706 10.7857C8.94118 10.7857 9.35529 12.2343 9.41177 12.6429M16 12.6429V14.5H13.1765V12.6429C13.1545 11.9526 12.9933 11.2736 12.7025 10.6454C12.4116 10.0173 11.9968 9.45257 11.4824 8.98429C16 9.43929 16 12.6429 16 12.6429Z" fill="black" />
                                                </svg>
                                                <span className="text-[16px] font-normal text-black">Assigned To:</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowAllAssignedUsers(false)}
                                                className="bg-white border border-[#e6e6e6] rounded-[3px] px-[5px] py-[3px] h-[30px] flex items-center gap-[5px] cursor-pointer hover:bg-gray-50"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                    <path d="M3 7L6 4L9 7" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                                </svg>
                                                <span className="text-[15px] font-normal text-black">Collapse</span>
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-[10px]">
                                            {assignedUsers.map((user) => (
                                                <div
                                                    key={user.id}
                                                    className="flex items-center gap-[10px]"
                                                >
                                                    <img
                                                        src={user.avatar || avatarPlaceholder}
                                                        alt={user.name}
                                                        className="size-[40px] rounded-full object-cover shrink-0"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-[15px] font-semibold text-black">{user.name}</span>
                                                        <span className="text-[14px] font-normal text-[#535352]">{user.position}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
                        <svg xmlns="http://www.w3.org/2000/svg" width="2" height="18" viewBox="0 0 2 18" fill="none" className='mx-[5px]'>
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M5.375 11.0629C6.09961 11.0629 6.6875 11.6509 6.6875 12.3755V12.813L8.66992 11.3254C8.89687 11.1559 9.17305 11.0629 9.45742 11.0629H13.25C13.4906 11.0629 13.6875 10.8661 13.6875 10.6254V2.75008C13.6875 2.50944 13.4906 2.31256 13.25 2.31256H2.75C2.50937 2.31256 2.3125 2.50944 2.3125 2.75008V10.6254C2.3125 10.8661 2.50937 11.0629 2.75 11.0629H5.375ZM6.6875 14.4537L6.68203 14.4592L6.54258 14.5631L6.075 14.9131C5.94375 15.0115 5.76602 15.0279 5.61562 14.9541C5.46523 14.8803 5.375 14.7299 5.375 14.5631V12.3755H2.75C1.78477 12.3755 1 11.5907 1 10.6254V2.75008C1 1.7848 1.78477 1 2.75 1H13.25C14.2152 1 15 1.7848 15 2.75008V10.6254C15 11.5907 14.2152 12.3755 13.25 12.3755H9.45742L6.6875 14.4537Z"
                                    fill={activeTab === 'comments' ? 'white' : '#535352'} />
                            </svg>
                        </button>
                        <svg xmlns="http://www.w3.org/2000/svg" width="2" height="18" viewBox="0 0 2 18" fill="none" className='mx-[5px]'>
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M9.14286 0C9.90062 0 10.6273 0.351189 11.1632 0.976311C11.699 1.60143 12 2.44928 12 3.33333V11.3333C12 11.9462 11.8965 12.553 11.6955 13.1192C11.4945 13.6854 11.1999 14.1998 10.8284 14.6332C10.457 15.0665 10.016 15.4102 9.53073 15.6448C9.04543 15.8793 8.52529 16 8 16C7.47471 16 6.95457 15.8793 6.46927 15.6448C5.98396 15.4102 5.54301 15.0665 5.17157 14.6332C4.80014 14.1998 4.5055 13.6854 4.30448 13.1192C4.10346 12.553 4 11.9462 4 11.3333V6H5.14286V11.3333C5.14286 12.2174 5.44388 13.0652 5.97969 13.6904C6.51551 14.3155 7.24224 14.6667 8 14.6667C8.75776 14.6667 9.48449 14.3155 10.0203 13.6904C10.5561 13.0652 10.8571 12.2174 10.8571 11.3333V3.33333C10.8571 3.07069 10.8128 2.81062 10.7267 2.56797C10.6405 2.32532 10.5142 2.10484 10.355 1.91912C10.1959 1.7334 10.0069 1.58608 9.79889 1.48557C9.5909 1.38506 9.36798 1.33333 9.14286 1.33333C8.91773 1.33333 8.69482 1.38506 8.48683 1.48557C8.27884 1.58608 8.08986 1.7334 7.93067 1.91912C7.77149 2.10484 7.64521 2.32532 7.55906 2.56797C7.47291 2.81062 7.42857 3.07069 7.42857 3.33333V11.3333C7.42857 11.5101 7.48878 11.6797 7.59594 11.8047C7.7031 11.9298 7.84845 12 8 12C8.15155 12 8.2969 11.9298 8.40406 11.8047C8.51122 11.6797 8.57143 11.5101 8.57143 11.3333V4H9.71429V11.3333C9.71429 11.8638 9.53367 12.3725 9.21218 12.7475C8.89069 13.1226 8.45466 13.3333 8 13.3333C7.54534 13.3333 7.10931 13.1226 6.78782 12.7475C6.46633 12.3725 6.28571 11.8638 6.28571 11.3333V3.33333C6.28571 2.44928 6.58673 1.60143 7.12255 0.976311C7.65837 0.351189 8.3851 0 9.14286 0Z"
                                    fill={activeTab === 'attachments' ? 'white' : '#535352'} />
                            </svg>
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="mb-[20px]">
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
                                {task.attachments && task.attachments.length > 0 ? (
                                    <div className="space-y-[10px] border border-[#E6E6E6] rounded-[10px] px-[7px] py-[15px]">
                                        {task.attachments.map((attachment) => {
                                            const getAttachmentIcon = () => {
                                                switch (attachment.type) {
                                                    case 'link':
                                                        return (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 8 16" fill="none">
                                                                <path d="M5.14286 0C5.90062 0 6.62734 0.351189 7.16316 0.976311C7.69898 1.60143 8 2.44928 8 3.33333V11.3333C8 11.9462 7.89654 12.553 7.69552 13.1192C7.4945 13.6854 7.19986 14.1998 6.82843 14.6332C6.45699 15.0665 6.01604 15.4102 5.53073 15.6448C5.04543 15.8793 4.52529 16 4 16C3.47471 16 2.95457 15.8793 2.46927 15.6448C1.98396 15.4102 1.54301 15.0665 1.17157 14.6332C0.800139 14.1998 0.505501 13.6854 0.304482 13.1192C0.103463 12.553 -7.82739e-09 11.9462 0 11.3333V6H1.14286V11.3333C1.14286 12.2174 1.44388 13.0652 1.97969 13.6904C2.51551 14.3155 3.24224 14.6667 4 14.6667C4.75776 14.6667 5.48449 14.3155 6.02031 13.6904C6.55612 13.0652 6.85714 12.2174 6.85714 11.3333V3.33333C6.85714 3.07069 6.8128 2.81062 6.72665 2.56797C6.6405 2.32532 6.51423 2.10484 6.35504 1.91912C6.19585 1.7334 6.00687 1.58608 5.79889 1.48557C5.5909 1.38506 5.36798 1.33333 5.14286 1.33333C4.91773 1.33333 4.69482 1.38506 4.48683 1.48557C4.27884 1.58608 4.08986 1.7334 3.93067 1.91912C3.77149 2.10484 3.64521 2.32532 3.55906 2.56797C3.47291 2.81062 3.42857 3.07069 3.42857 3.33333V11.3333C3.42857 11.5101 3.48878 11.6797 3.59594 11.8047C3.7031 11.9298 3.84845 12 4 12C4.15155 12 4.2969 11.9298 4.40406 11.8047C4.51122 11.6797 4.57143 11.5101 4.57143 11.3333V4H5.71429V11.3333C5.71429 11.8638 5.53367 12.3725 5.21218 12.7475C4.89069 13.1226 4.45466 13.3333 4 13.3333C3.54534 13.3333 3.10931 13.1226 2.78782 12.7475C2.46633 12.3725 2.28571 11.8638 2.28571 11.3333V3.33333C2.28571 2.44928 2.58673 1.60143 3.12255 0.976311C3.65837 0.351189 4.3851 0 5.14286 0Z" fill="#535352" />
                                                            </svg>
                                                        );
                                                    default:
                                                        return (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16" fill="none">
                                                                <path d="M2.45751 16H10.8758C12.5169 16 13.3333 15.2164 13.3333 13.6642V6.88812H7.59407C6.57941 6.88812 6.10387 6.4328 6.10387 5.47757V0H2.45751C0.824582 0 0 0.790925 0 2.34348V13.6642C0 15.2237 0.824582 16 2.45751 16ZM7.61808 5.86571H13.2461C13.1906 5.55972 12.9606 5.26105 12.5882 4.89552L8.21233 0.709095C7.84773 0.350886 7.51492 0.134368 7.18178 0.0818308V5.46292C7.18178 5.73134 7.33262 5.86571 7.61808 5.86571Z" fill="#FFB74D" />
                                                            </svg>
                                                        );
                                                }
                                            };
                                            return (
                                                <div key={attachment.id} className="flex items-center justify-between relative">
                                                    <div className="flex items-center gap-[10px]">
                                                        <div className="size-[16px] flex items-center justify-center shrink-0">
                                                            {getAttachmentIcon()}
                                                        </div>
                                                        <span className={cn(
                                                            "text-[14px] font-normal cursor-pointer hover:underline",
                                                            attachment.type === 'link' ? 'text-[#1E88E5]' : 'text-[#535352]'
                                                        )}
                                                        onClick={() => handleDownloadAttachment(attachment)}
                                                        >{attachment.name}</span>
                                                    </div>
                                                    <div className="relative">
                                                        <button
                                                            type="button"
                                                            ref={(el) => {
                                                                menuButtonRefs.current[attachment.id] = el;
                                                            }}
                                                            onClick={() => toggleMenu(attachment.id)}
                                                            className="cursor-pointer w-4"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="3" height="12" viewBox="0 0 3 12" fill="none">
                                                                <path fillRule="evenodd" clipRule="evenodd" d="M1.5 12C1.10218 12 0.720645 11.842 0.43934 11.5607C0.158036 11.2794 0 10.8978 0 10.5C0 10.1022 0.158036 9.72064 0.43934 9.43934C0.720645 9.15804 1.10218 9 1.5 9C1.89782 9 2.27936 9.15804 2.56066 9.43934C2.84196 9.72064 3 10.1022 3 10.5C3 10.8978 2.84196 11.2794 2.56066 11.5607C2.27936 11.842 1.89782 12 1.5 12ZM1.5 7.5C1.10218 7.5 0.720645 7.34196 0.43934 7.06066C0.158036 6.77936 0 6.39782 0 6C0 5.60218 0.158036 5.22064 0.43934 4.93934C0.720645 4.65804 1.10218 4.5 1.5 4.5C1.89782 4.5 2.27936 4.65804 2.56066 4.93934C2.84196 5.22064 3 5.60218 3 6C3 6.39782 2.84196 6.77936 2.56066 7.06066C2.27936 7.34196 1.89782 7.5 1.5 7.5ZM1.5 3C1.10218 3 0.720645 2.84196 0.43934 2.56066C0.158036 2.27936 0 1.89782 0 1.5C0 1.10218 0.158036 0.720644 0.43934 0.43934C0.720645 0.158035 1.10218 0 1.5 0C1.89782 0 2.27936 0.158035 2.56066 0.43934C2.84196 0.720644 3 1.10218 3 1.5C3 1.89782 2.84196 2.27936 2.56066 2.56066C2.27936 2.84196 1.89782 3 1.5 3Z" fill="#535352" />
                                                            </svg>
                                                        </button>
                                                        {openMenuId === attachment.id && (
                                                            <AttachmentMenu
                                                                attachment={attachment}
                                                                buttonRef={menuButtonRefs.current[attachment.id]}
                                                                onClose={() => setOpenMenuId(null)}
                                                                onView={() => handleViewAttachment(attachment)}
                                                                onDownload={() => handleDownloadAttachment(attachment)}
                                                            />
                                                        )}
                                                    </div>
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

                    {/* Status Badge */}
                    <div className="mb-[25px] flex items-start">
                        <StatusBadge status={task.status} isSelected={true} />
                    </div>

                    {/* Footer with Created By and Actions */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-[5px]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 16C4.1101 15.1018 1 11.2887 1 7.27273V2.90909L8 0L15 2.90909V7.27273C15 11.2902 11.8899 15.1018 8 16ZM2.4 3.63636V7.27273C2.44 8.95428 3.00925 10.5759 4.02062 11.8894C5.032 13.2028 6.42977 14.1358 8 14.5455C9.57023 14.1358 10.968 13.2028 11.9794 11.8894C12.9907 10.5759 13.56 8.95428 13.6 7.27273V3.63636L8 1.45455L2.4 3.63636Z" fill="black" />
                                <path d="M8 7C9.10457 7 10 6.10457 10 5C10 3.89543 9.10457 3 8 3C6.89543 3 6 3.89543 6 5C6 6.10457 6.89543 7 8 7Z" fill="black" />
                                <path d="M5 10.5C5.29564 11.2486 5.72924 11.8746 6.25639 12.3139C6.78354 12.7532 7.38529 12.99 8 13C8.61471 12.99 9.21647 12.7532 9.74361 12.3139C10.2708 11.8746 10.7044 11.2486 11 10.5C10.985 8.92 8.9948 8 8 8C6.9998 8 5.015 8.92 5 10.5Z" fill="black" />
                            </svg>
                            <span className="text-[14px] font-normal text-black">
                                Created by: {task.createdBy.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-[10px]">
                            {onEdit && (
                                <Tooltip content="Edit Event" side="top">
                                    <button
                                        type="button"
                                        onClick={() => onEdit(task)}
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
                                        onClick={() => onDelete(task.id)}
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
            <AttachmentViewerDrawer
                isOpen={!!viewingAttachment}
                attachment={viewingAttachment}
                onClose={() => setViewingAttachment(null)}
                onDownload={() => {
                    if (viewingAttachment?.url) {
                        const link = document.createElement('a');
                        link.href = viewingAttachment.url;
                        link.download = viewingAttachment.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                }}
            />
        </div>,
        document.body
    );
};

export default TaskInfoModal;
