import { X } from 'lucide-react';
import React from 'react';
import { Skeleton } from '../common/Skeleton';
import { categoryLabels } from './mockData';
import type { PostCategory } from './types';

export type DraftData = {
    title: string;
    category: PostCategory;
    content: string;
    publishDate?: string;
    ctaLabel?: string;
    ctaLink?: string;
    attachments?: Array<{ type: 'pdf' | 'link'; title: string; url: string }>;
    allowReactions?: boolean;
    showOnDashboard?: boolean;
    sendEmailNotification?: boolean;
    audience?: {
        allStaff?: boolean;
        individuals?: string[];
        groups?: string[];
    };
};

export type DraftItem = DraftData & {
    id: string;
    lastModified: string;
};

export type DraftsDrawerProps = {
    open: boolean;
    onClose: () => void;
    drafts?: DraftItem[];
    onDraftClick?: (draftId: string) => void;
    isLoading?: boolean;
};

// Mock draft data - replace with actual data from props or API
export const mockDrafts: DraftItem[] = [
    {
        id: '1',
        title: 'CEO December Message',
        category: 'ceo-messages',
        content: 'Dear Team,\n\nAs we approach the end of another remarkable year, I want to take a moment to express my heartfelt gratitude for your dedication and hard work. This year has been filled with challenges, but your resilience and commitment have been truly inspiring.\n\nLooking ahead to December, I\'m excited about the opportunities that await us. Let\'s continue to work together to achieve our shared goals and make a positive impact.\n\nThank you for being an integral part of our success.\n\nBest regards,\n[CEO Name]',
        lastModified: '5 minutes ago',
        showOnDashboard: true,
        sendEmailNotification: true,
        allowReactions: true,
        audience: {
            allStaff: true,
        },
    },
    {
        id: '2',
        title: 'Staff Development Workshop',
        category: 'events-activities',
        content: 'We are excited to announce our upcoming Staff Development Workshop scheduled for [Date]. This workshop will focus on professional growth, team collaboration, and skill enhancement.\n\nKey topics include:\n- Leadership development\n- Communication strategies\n- Time management techniques\n- Career advancement pathways\n\nRegistration details will be shared shortly. We encourage all staff members to participate in this valuable learning opportunity.',
        lastModified: '2 hours ago',
        showOnDashboard: true,
        sendEmailNotification: true,
        allowReactions: true,
        audience: {
            allStaff: true,
        },
    },
    {
        id: '3',
        title: 'New Joiners - November List',
        category: 'hr-update',
        content: 'Please join us in welcoming our new team members who joined us in November:\n\n1. [Name] - [Position]\n2. [Name] - [Position]\n3. [Name] - [Position]\n\nWe are thrilled to have them on board and look forward to their contributions to our team. Please extend a warm welcome when you see them around the office!',
        lastModified: 'Yesterday',
        showOnDashboard: true,
        sendEmailNotification: false,
        allowReactions: true,
        audience: {
            allStaff: true,
        },
    },
    {
        id: '4',
        title: 'System Enhancements Update',
        category: 'it-system-updates',
        content: 'We are pleased to announce several system enhancements that will improve your daily workflow:\n\n1. Improved user interface for better navigation\n2. Enhanced security features\n3. Faster processing times\n4. New reporting capabilities\n\nThese updates will be rolled out gradually over the next few weeks. Training sessions will be available for those who need assistance. Please contact the IT support team if you have any questions.',
        lastModified: 'Yesterday',
        showOnDashboard: true,
        sendEmailNotification: true,
        allowReactions: false,
        audience: {
            allStaff: true,
        },
    },
    {
        id: '5',
        title: 'Staffroom Relocation Notice',
        category: 'general',
        content: 'This is to inform all staff members that the staffroom will be relocated to the new building starting from [Date].\n\nThe new location offers:\n- More spacious facilities\n- Improved amenities\n- Better accessibility\n- Enhanced comfort areas\n\nPlease note that the current staffroom will be closed for relocation from [Date] to [Date]. We apologize for any inconvenience and appreciate your understanding during this transition.',
        lastModified: '10 Nov',
        showOnDashboard: true,
        sendEmailNotification: true,
        allowReactions: false,
        audience: {
            allStaff: true,
        },
    },
    {
        id: '6',
        title: 'New Campus Progress Brief',
        category: 'general',
        content: 'We are excited to share an update on the progress of our new campus construction:\n\nConstruction Milestones:\n- Foundation work: Completed\n- Structural framework: 75% complete\n- Interior work: 40% complete\n- Expected completion: [Date]\n\nThe new campus will feature state-of-the-art facilities including modern classrooms, advanced laboratories, and enhanced recreational areas. We will continue to provide regular updates as the project progresses.',
        lastModified: '15 Jun 2024',
        showOnDashboard: true,
        sendEmailNotification: false,
        allowReactions: true,
        audience: {
            allStaff: true,
        },
    },
];

const DraftsDrawer: React.FC<DraftsDrawerProps> = ({ open, onClose, drafts = [], onDraftClick, isLoading }) => {
    const closeDrawer = () => {
        onClose();
    };

    const handleDraftClick = (draftId: string) => {
        if (onDraftClick) {
            onDraftClick(draftId);
        }
    };

    return (
        <div
            className={`fixed inset-0 z-40 flex justify-end transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
        >
            <div className="absolute inset-0 bg-[#0F172A]/40 cursor-pointer" onClick={closeDrawer} />
            <aside
                className={`relative w-full max-w-[641px] bg-[#1C2745] text-white shadow-[5px] border-t-[6px] border-t-[#232725] flex flex-col mt-16 h-[calc(100%-64px)] transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <header className="px-[32px] py-6 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="border-2 border-[#DE4A2C] rounded-full h-5 w-px ml-[11px]"></div>
                        <h2 className="text-lg font-semibold text-white">Drafts</h2>
                    </div>
                    <button
                        type="button"
                        onClick={closeDrawer}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-white text-black hover:bg-[#F3F4F6] transition cursor-pointer"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4 stroke-3" />
                    </button>
                </header>

                <div className="flex-1 px-[15px] pb-[15px]">
                    <div className="bg-white rounded-[5px] px-[24px] py-[35px] h-[calc(100dvh-159px)] overflow-hidden">
                        <div className="overflow-y-auto">
                            {/* Table Header */}
                            <div className="flex items-center pb-[25px] border-b border-[#E6E6E6]">
                                <div className="w-[282px]">
                                    <p className="text-[15px] font-semibold text-black">Title</p>
                                </div>
                                <div className="w-[175px]">
                                    <p className="text-[15px] font-semibold text-black">Category</p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[15px] font-semibold text-black">Last Modified</p>
                                </div>
                            </div>

                            {/* Draft Items */}
                            <div className="flex flex-col">
                                {isLoading ? (
                                    <div className="flex flex-col">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="flex items-center py-[25px] border-b border-[#E6E6E6]">
                                                <div className="w-[282px]">
                                                    <Skeleton className="h-5 w-3/4" />
                                                </div>
                                                <div className="w-[175px]">
                                                    <Skeleton className="h-5 w-24" />
                                                </div>
                                                <div className="flex-1">
                                                    <Skeleton className="h-5 w-20" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : drafts.length > 0 ? (
                                    drafts.map((draft, index) => (
                                        <div key={draft.id}>
                                            <button
                                                type="button"
                                                onClick={() => handleDraftClick(draft.id)}
                                                className="w-full flex items-center py-[25px] hover:bg-[#F5F5F5] transition cursor-pointer text-left"
                                            >
                                                <div className="w-[282px]">
                                                    <p className="text-[15px] font-normal text-[#535352]">{draft.title}</p>
                                                </div>
                                                <div className="w-[175px]">
                                                    <p className="text-[15px] font-normal text-[#535352]">
                                                        {categoryLabels[draft.category] || draft.category}
                                                    </p>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[15px] font-normal text-[#535352]">{draft.lastModified}</p>
                                                </div>
                                            </button>
                                            {index < drafts.length - 1 && (
                                                <div className="h-px bg-[#E6E6E6] w-full"></div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-[#535352]">
                                        No drafts found.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default DraftsDrawer;

