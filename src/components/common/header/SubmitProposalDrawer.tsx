import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils/cn';
import { mockUsers } from '../../messenger/mockData';
import type { User } from '../../messenger/types';
import AttachmentDropdown from '../../my-work/AttachmentDropdown';
import AssignReviewer from './AssignReviewer';

interface SubmitProposalDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: (data: ProposalData) => void;
    onSaveDraft?: (data: ProposalData) => void;
}

export interface ProposalData {
    title: string;
    summary: string;
    timeline: string;
    requirements: string;
    challenges: string;
    attachments: File[];
    reviewers: User[];
}

const SubmitProposalDrawer: React.FC<SubmitProposalDrawerProps> = ({
    isOpen,
    onClose,
    onSubmit,
    onSaveDraft,
}) => {
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [timeline, setTimeline] = useState('');
    const [requirements, setRequirements] = useState('');
    const [challenges, setChallenges] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    // Initialize reviewers with "You" user (user-1) by default
    const [reviewers, setReviewers] = useState<User[]>(() => {
        const youUser = mockUsers.find((user) => user.id === 'user-1' || user.name === 'You');
        return youUser ? [youUser] : [];
    });
    const [attachmentDropdownOpen, setAttachmentDropdownOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const attachmentButtonRef = useRef<HTMLButtonElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle mount/unmount timing for smooth animations
    useLayoutEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            // Ensure isAnimating starts as false, then trigger animation after paint
            setIsAnimating(false);
            // Use double requestAnimationFrame to ensure browser has painted initial state before animating
            let raf2: number;
            const raf1 = requestAnimationFrame(() => {
                raf2 = requestAnimationFrame(() => {
                    setIsAnimating(true);
                });
            });
            return () => {
                cancelAnimationFrame(raf1);
                if (raf2) cancelAnimationFrame(raf2);
            };
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => {
                setIsMounted(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Reset form when drawer closes
    useEffect(() => {
        if (!isOpen) {
            setTitle('');
            setSummary('');
            setTimeline('');
            setRequirements('');
            setChallenges('');
            setAttachments([]);
            // Reset reviewers but keep "You" user
            const youUser = mockUsers.find((user) => user.id === 'user-1' || user.name === 'You');
            setReviewers(youUser ? [youUser] : []);
        }
    }, [isOpen]);

    const handleFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            setAttachments((prev) => [...prev, ...Array.from(files)]);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = () => {
        const data: ProposalData = {
            title,
            summary,
            timeline,
            requirements,
            challenges,
            attachments,
            reviewers,
        };
        onSubmit?.(data);
        onClose();
    };

    const handleSaveDraft = () => {
        const data: ProposalData = {
            title,
            summary,
            timeline,
            requirements,
            challenges,
            attachments,
            reviewers,
        };
        onSaveDraft?.(data);
        onClose();
    };

    const isFormValid = title.trim() && summary.trim() && timeline.trim() && requirements.trim() && challenges.trim();

    if (!isMounted) return null;

    return createPortal(
        <div
            className={cn(
                'fixed inset-0 z-50 flex justify-end bg-black/40 transition-opacity duration-300 ease-out',
                isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            onClick={onClose}
        >
            <div
                className={cn(
                    'relative w-full max-w-[641px] bg-[#1C2745] text-white shadow-xl max-h-[calc(100dvh-64px)] overflow-hidden mt-16 transition-transform duration-300 ease-out flex flex-col',
                    isAnimating ? 'translate-x-0' : 'translate-x-full'
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Border */}
                <div className="h-[6px] bg-[#232725] w-full" />

                {/* Header */}
                <div className="px-8 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-px h-5 border-2 border-[#DE4A2C] rounded-full" />
                        <h2 className="text-lg font-semibold text-white">Submit Proposal</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:bg-[#F3F4F6] cursor-pointer transition"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div 
                    className={cn(
                        'flex-1 overflow-y-auto bg-white mx-[15px] mb-[15px] rounded-[5px] py-[35px] ps-[23px] pr-[30px] transition-opacity duration-300 delay-75',
                        isAnimating ? 'opacity-100' : 'opacity-0'
                    )}
                >
                    {/* Title */}
                    <div className="flex items-start justify-between mb-6">
                        <label className="text-[15px] font-semibold text-black block mt-2.5">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Automate Faculty Scheduling"
                            className="w-[419px] rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352] placeholder:text-[#535352] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40"
                        />
                    </div>

                    {/* Summary */}
                    <div className="flex items-start justify-between mb-6">
                        <label className="text-[15px] font-semibold text-black block mt-2.5">
                            Summary <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Briefly explain the idea, goal, and expected benefits"
                            rows={4}
                            className="w-[419px] rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352] placeholder:text-[#535352] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 resize-none min-h-[105px]"
                        />
                    </div>

                    {/* Timeline */}
                    <div className="flex items-start justify-between mb-6">
                        <label className="text-[15px] font-semibold text-black block mt-2.5">
                            Timeline <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={timeline}
                            onChange={(e) => setTimeline(e.target.value)}
                            placeholder="Key phases and estimated completion dates"
                            rows={4}
                            className="w-[419px] rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352] placeholder:text-[#535352] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 resize-none min-h-[105px]"
                        />
                    </div>

                    {/* Requirements */}
                    <div className="flex items-start justify-between mb-6">
                        <label className="text-[15px] font-semibold text-black block mt-2.5">
                            Requirements <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={requirements}
                            onChange={(e) => setRequirements(e.target.value)}
                            placeholder="e.g. Budget, tools, team support, approvals needed"
                            rows={4}
                            className="w-[419px] rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352] placeholder:text-[#535352] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 resize-none min-h-[105px]"
                        />
                    </div>

                    {/* Challenges */}
                    <div className="flex items-start justify-between mb-6">
                        <label className="text-[15px] font-semibold text-black block mt-2.5">
                            Challenges <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={challenges}
                            onChange={(e) => setChallenges(e.target.value)}
                            placeholder="Any known constraints, risks, or dependencies"
                            rows={4}
                            className="w-[419px] rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352] placeholder:text-[#535352] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 resize-none min-h-[105px]"
                        />
                    </div>

                    {/* Attachments and Assign Reviewers */}
                    <div className="flex items-start justify-between mb-6">
                        {/* Attachments */}
                        <div className="flex flex-col">
                            <label className="text-[15px] font-semibold text-black mb-2.5">
                                Attachments
                            </label>
                            <div className="relative">
                                <button
                                    ref={attachmentButtonRef}
                                    type="button"
                                    onClick={() => setAttachmentDropdownOpen(!attachmentDropdownOpen)}
                                    className="border border-[#E6E6E6] rounded-[5px] px-[10px] py-[8px] w-[260px] flex items-center gap-[5px] cursor-pointer hover:bg-gray-50 transition"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="18" viewBox="0 0 10 18" fill="none">
                                        <path d="M6.42857 0C7.37577 0 8.28418 0.395088 8.95395 1.09835C9.62373 1.80161 10 2.75544 10 3.75V12.75C10 13.4394 9.87067 14.1221 9.6194 14.7591C9.36812 15.396 8.99983 15.9748 8.53553 16.4623C8.07124 16.9498 7.52005 17.3365 6.91342 17.6004C6.30679 17.8642 5.65661 18 5 18C4.34339 18 3.69321 17.8642 3.08658 17.6004C2.47995 17.3365 1.92876 16.9498 1.46447 16.4623C1.00017 15.9748 0.631876 15.396 0.380602 14.7591C0.129329 14.1221 -9.78424e-09 13.4394 0 12.75V6.75H1.42857V12.75C1.42857 13.7446 1.80485 14.6984 2.47462 15.4017C3.14439 16.1049 4.0528 16.5 5 16.5C5.9472 16.5 6.85561 16.1049 7.52538 15.4017C8.19515 14.6984 8.57143 13.7446 8.57143 12.75V3.75C8.57143 3.45453 8.516 3.16194 8.40831 2.88896C8.30062 2.61598 8.14278 2.36794 7.9438 2.15901C7.74482 1.95008 7.50859 1.78434 7.24861 1.67127C6.98862 1.5582 6.70998 1.5 6.42857 1.5C6.14717 1.5 5.86852 1.5582 5.60854 1.67127C5.34855 1.78434 5.11233 1.95008 4.91334 2.15901C4.71436 2.36794 4.55652 2.61598 4.44883 2.88896C4.34114 3.16194 4.28571 3.45453 4.28571 3.75V12.75C4.28571 12.9489 4.36097 13.1397 4.49492 13.2803C4.62888 13.421 4.81056 13.5 5 13.5C5.18944 13.5 5.37112 13.421 5.50508 13.2803C5.63903 13.1397 5.71429 12.9489 5.71429 12.75V4.5H7.14286V12.75C7.14286 13.3467 6.91709 13.919 6.51523 14.341C6.11337 14.7629 5.56832 15 5 15C4.43168 15 3.88663 14.7629 3.48477 14.341C3.08291 13.919 2.85714 13.3467 2.85714 12.75V3.75C2.85714 2.75544 3.23342 1.80161 3.90319 1.09835C4.57296 0.395088 5.48137 0 6.42857 0Z" fill="#008080" />
                                    </svg>
                                    <span className="text-[15px] font-normal text-[#535352] leading-snug">Add Attachment(s)</span>
                                </button>
                                <AttachmentDropdown
                                    isOpen={attachmentDropdownOpen}
                                    onClose={() => setAttachmentDropdownOpen(false)}
                                    triggerRef={attachmentButtonRef}
                                    onUploadFile={handleFileUpload}
                                    onAttachFromCloud={() => {
                                        // TODO: Implement attach from cloud
                                        console.log('Attach from Cloud');
                                    }}
                                    onAddLink={() => {
                                        // TODO: Implement add link
                                        console.log('Add Link');
                                    }}
                                />
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    multiple
                                />
                            </div>
                        </div>

                        {/* Assign Reviewers */}
                        <div className="flex flex-col">
                            <label className="text-[15px] font-semibold text-black mb-2.5">
                                Assign Reviewer(s)
                            </label>
                            <AssignReviewer
                                selectedReviewers={reviewers}
                                onReviewersChange={setReviewers}
                                availableUsers={mockUsers.filter((user) => user.name !== 'You')}
                            />
                        </div>
                    </div>


                    {/* Footer Buttons */}
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={onClose}
                            className="border border-[#CACACA] rounded-[25px] px-[25px] py-[10px] text-[14px] leading-snug font-semibold text-black hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <div className="flex items-center gap-[15px]">
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                className="bg-[#008080] rounded-[25px] px-[25px] py-[10px] text-[14px] leading-snug font-semibold text-white hover:opacity-90 transition"
                            >
                                Save as Draft
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!isFormValid}
                                className={cn(
                                    'bg-[#DE4A2C] rounded-[25px] px-10 py-[10px] text-[14px] leading-snug font-semibold text-white hover:opacity-90 transition',
                                    !isFormValid && 'cursor-not-allowed'
                                )}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SubmitProposalDrawer;

