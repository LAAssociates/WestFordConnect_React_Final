import React from 'react';
import { cn } from '../../lib/utils/cn';
import type { PostCategory } from './types';
import type { CategoryMenuItem } from '../../types/news';

// Removed AllUpdatesIcon import
import GeneralIcon from '../../assets/icons/news-and-updates/General.svg';
import HRUpdateIcon from '../../assets/icons/news-and-updates/HR Updates.svg';
import PolicyUpdatesIcon from '../../assets/icons/news-and-updates/Policy Updates.svg';
import EventsActivitiesIcon from '../../assets/icons/news-and-updates/Events & Activities.svg';
import CEOMessagesIcon from '../../assets/icons/news-and-updates/CEO Messages.svg';
import StaffRecognitionIcon from '../../assets/icons/news-and-updates/Staff Recognition.svg';
import ITSystemUpdatesIcon from '../../assets/icons/news-and-updates/System Updates.svg';
import { Loader2 } from 'lucide-react';

interface CategorySidebarProps {
    activeCategory: PostCategory;
    onCategoryChange: (category: PostCategory) => void;
    onCreatePost: () => void;
    onOpenDrafts?: () => void;
    dynamicCategories: CategoryMenuItem[];
    categoriesLoading: boolean;
    isFetching?: boolean;
}

// Icon mapping for dynamic categories based on iconKey from API
const iconMap: { [key: string]: string } = {
    'HR_UPDATE': HRUpdateIcon,
    'POLICY_UPDATES': PolicyUpdatesIcon,
    'EVENTS_ACTIVITIES': EventsActivitiesIcon,
    'CEO_MESSAGES': CEOMessagesIcon,
    'STAFF_RECOGNITION': StaffRecognitionIcon,
    'IT_SYSTEM_UPDATES': ITSystemUpdatesIcon,
    'GENERAL': GeneralIcon,
};

// Helper function to convert category name to PostCategory type
const getCategoryKey = (categoryName: string): PostCategory => {
    const normalized = categoryName.toLowerCase().replace(/[\s\/]/g, '-').replace(/'/g, '');
    return normalized as PostCategory;
};

const CategorySidebar: React.FC<CategorySidebarProps> = ({
    activeCategory,
    onCategoryChange,
    onCreatePost,
    onOpenDrafts,
    dynamicCategories,
    categoriesLoading,
    isFetching = false,
}) => {
    return (
        <aside className="w-[18%] flex flex-col bg-white">
            <div className="flex flex-col gap-5 px-5 py-[26px]">
                <button
                    type="button"
                    onClick={onCreatePost}
                    className="text-sm w-full flex items-center justify-center gap-2.5 bg-[#008080] hover:opacity-90 text-white font-semibold text-[14px] leading-normal px-[25px] py-[10px] rounded-[25px] transition cursor-pointer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M14 8H8V14H6V8H0V6H6V0H8V6H14V8Z" fill="white" />
                    </svg>
                    <span>Create Post</span>
                </button>
                <button
                    type="button"
                    onClick={onOpenDrafts}
                    className="text-sm w-full flex items-center justify-center gap-2.5 bg-[#1C2745] hover:opacity-90 text-white font-semibold text-[14px] leading-normal px-[25px] py-[10px] rounded-[25px] transition cursor-pointer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="14" viewBox="0 0 12 14" fill="none">
                        <path d="M1.5 14C1.0875 14 0.7345 13.863 0.441 13.5891C0.1475 13.3152 0.0005 12.9855 0 12.6V1.4C0 1.015 0.147 0.685533 0.441 0.4116C0.735 0.137667 1.088 0.000466667 1.5 0H7.5L12 4.2V12.6C12 12.985 11.8533 13.3147 11.5597 13.5891C11.2662 13.8635 10.913 14.0005 10.5 14H1.5ZM6.75 4.9V1.4H1.5V12.6H10.5V4.9H6.75Z" fill="white" />
                    </svg>
                    <span>Drafts</span>
                </button>
            </div>

            <div className="h-px bg-[#E6E6E6]"></div>

            <div className="flex-1 overflow-y-auto p-5">
                <div className="flex flex-col gap-2.5">
                    {/* Dynamic categories from API */}
                    {categoriesLoading ? (
                        <>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="w-full flex items-center gap-2 px-[10px] py-[10px] rounded-[5px]"
                                >
                                    <div className="w-5 h-5 rounded-full bg-[#E6E6E6] animate-pulse flex-shrink-0" />
                                    <div
                                        className="h-3 rounded-full bg-[#E6E6E6] animate-pulse"
                                        style={{ width: `${55 + (i % 3) * 15}%` }}
                                    />
                                </div>
                            ))}
                        </>
                    ) : (
                        dynamicCategories
                            .filter((category) => {
                                const categoryKey = getCategoryKey(category.categoryName);
                                return categoryKey !== 'all';
                            })
                            .map((category) => {
                                // activeCategory holds categoryId as a string (e.g. "12") —
                                // this is what the GetAll API expects in the categories filter.
                                const isActive = activeCategory === category.categoryCode.toString();

                                let iconSrc = category.iconUrl;

                                if (!iconSrc) {
                                    if (category.iconKey) {
                                        iconSrc = iconMap[category.iconKey] || GeneralIcon;
                                    } else {
                                        iconSrc = GeneralIcon;
                                    }
                                }

                                return (
                                    <button
                                        key={category.categoryCode}
                                        type="button"
                                        onClick={() => onCategoryChange(category.categoryCode.toString() as PostCategory)}
                                        className={cn(
                                            'w-full flex items-center gap-2 px-[10px] py-[10px] rounded-[5px] text-sm font-semibold transition cursor-pointer mb-0 group',
                                            isActive
                                                ? 'bg-[#42484B] text-white'
                                                : 'text-black hover:bg-[#F5F5F5]'
                                        )}
                                    >
                                        <span className="w-5 h-5 flex items-center justify-center">
                                            {iconSrc ? (
                                                <img
                                                    src={iconSrc}
                                                    alt={category.categoryName}
                                                    className={cn("w-[18px] h-[18px] object-contain", isActive && "invert-0 brightness-[100]")}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = GeneralIcon;
                                                    }}
                                                />
                                            ) : null}
                                        </span>
                                        <span className="truncate">{category.categoryName}</span>
                                    </button>
                                );
                            })
                    )}

                    {isFetching && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-[#008080]" />
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default CategorySidebar;

