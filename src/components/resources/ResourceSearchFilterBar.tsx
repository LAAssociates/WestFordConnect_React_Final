import { Search, Loader2 } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { cn } from '../../lib/utils/cn';
import FilterPopover, { type FilterState } from '../common/FilterPopover';
import SortPopover from '../common/SortPopover';
import type { ResourceSortOption, ViewMode } from './types';

interface ResourceSearchFilterBarProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    onFilterApply?: (filters: FilterState) => void;
    onFilterReset?: () => void;
    onSortChange?: (sort: ResourceSortOption) => void;
    selectedSort?: ResourceSortOption;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    className?: string;
    departments?: Array<{ id: string; name: string; count: number }>;
    users?: Array<{ id: string; name: string; position: string; email: string; avatar?: string }>;
    fileTypes?: any[];
    projectGroups?: any[];
    sortOptions?: Array<{ value: string; label: string }>;
    isLoading?: boolean;
    initialFilters?: FilterState;
}

const ResourceSearchFilterBar: React.FC<ResourceSearchFilterBarProps> = ({
    searchValue,
    onSearchChange,
    onFilterApply,
    onFilterReset,
    onSortChange,
    selectedSort = 'title-az',
    viewMode,
    onViewModeChange,
    className,
    departments,
    users,
    fileTypes,
    projectGroups,
    sortOptions: externalSortOptions,
    isLoading = false,
    initialFilters,
}) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const filterButtonRef = useRef<HTMLButtonElement>(null);
    const sortButtonRef = useRef<HTMLButtonElement>(null);

    const handleFilterClick = () => {
        setIsFilterOpen((prev) => !prev);
        setIsSortOpen(false);
    };

    const handleSortClick = () => {
        setIsSortOpen((prev) => !prev);
        setIsFilterOpen(false);
    };

    const handleFilterApply = (filters: FilterState) => {
        setIsFilterOpen(false);
        if (onFilterApply) {
            onFilterApply(filters);
        }
    };

    const handleFilterReset = () => {
        setIsFilterOpen(false);
        if (onFilterReset) {
            onFilterReset();
        }
    };

    const handleSortChange = (sort: string) => {
        setIsSortOpen(false);
        if (onSortChange) {
            onSortChange(sort as ResourceSortOption);
        }
    };

    const sortOptions = externalSortOptions || [
        { value: 'date-newest', label: 'Newest First' },
        { value: 'date-oldest', label: 'Oldest First' },
        { value: 'title-az', label: 'Title A-Z' },
        { value: 'title-za', label: 'Title Z-A' },
    ];

    return (
        <div className={cn('relative flex justify-between items-center max-w-full', className)}>
            <div />
            <div className="flex items-center gap-[15px]">
                <div className="h-[40px] flex-1 w-[399px] max-w-full bg-[#e6e6e6] border border-[#cacaca] border-solid rounded-[25px] flex items-center px-[15px] py-[10px]">
                    {isLoading ? (
                        <Loader2 className="h-[18px] w-[18px] text-black shrink-0 animate-spin" />
                    ) : (
                        <Search className="h-[18px] w-[18px] text-black shrink-0" />
                    )}
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search resources by name, keyword, or category..."
                        className="flex-1 bg-transparent text-[14px] font-medium text-black placeholder:text-black focus:outline-none ml-2"
                        disabled={isLoading}
                    />
                </div>

                {isLoading ? (
                    <button
                        type="button"
                        className="shrink-0 rounded-full flex h-[32px] w-[32px] items-center justify-center bg-[#DE4A2C]"
                    >
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                    </button>
                ) : (
                    <button
                        ref={filterButtonRef}
                        type="button"
                        onClick={handleFilterClick}
                        className={cn(
                            'shrink-0 rounded-full flex h-[32px] w-[32px] items-center justify-center cursor-pointer transition-colors',
                            isFilterOpen ? 'bg-[#DE4A2C]' : 'bg-[#DE4A2C]'
                        )}
                        aria-label="Filter resources"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M1.61274 1.6L6.84029 8.0808C7.06912 8.36466 7.1937 8.71734 7.19353 9.0808V14.4L8.80647 13.2V9.08C8.80648 8.71682 8.93105 8.36445 9.15971 8.0808L14.3873 1.6H1.61274ZM1.61274 0H14.3873C14.6911 3.76005e-05 14.9888 0.0852189 15.246 0.245733C15.5032 0.406246 15.7094 0.635563 15.841 0.90727C15.9725 1.17898 16.0241 1.48202 15.9896 1.7815C15.9551 2.08097 15.8361 2.3647 15.6462 2.6L10.4194 9.08V13.2C10.4194 13.4484 10.3611 13.6934 10.2491 13.9155C10.1371 14.1377 9.97456 14.331 9.77424 14.48L8.16129 15.68C7.92166 15.8583 7.63671 15.9669 7.33838 15.9935C7.04005 16.0202 6.74012 15.964 6.4722 15.8311C6.20428 15.6982 5.97896 15.4939 5.82148 15.2412C5.664 14.9884 5.58058 14.6971 5.58058 14.4V9.08L0.353841 2.6C0.163928 2.3647 0.0448808 2.08097 0.010412 1.7815C-0.0240568 1.48202 0.0274547 1.17898 0.159013 0.90727C0.290572 0.635563 0.496826 0.406246 0.754019 0.245733C1.01121 0.0852189 1.30888 3.76005e-05 1.61274 0Z" fill="white" />
                        </svg>
                    </button>
                )}

                {isLoading ? (
                    <button
                        type="button"
                        className="shrink-0 rounded-full flex h-[32px] w-[32px] items-center justify-center bg-[#CACACA]"
                    >
                        <Loader2 className="h-4 w-4 text-black animate-spin" />
                    </button>
                ) : (
                    <button
                        ref={sortButtonRef}
                        type="button"
                        onClick={handleSortClick}
                        className={cn(
                            'shrink-0 rounded-full flex h-[32px] w-[32px] items-center justify-center cursor-pointer transition-colors',
                            isSortOpen ? 'bg-[#CACACA]' : 'bg-[#CACACA]'
                        )}
                        aria-label="Sort resources"
                    >
                        <svg width="19" height="15" viewBox="0 0 19 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0.24063 8.42789C0.394703 8.58196 0.603671 8.66852 0.821563 8.66852H6.84636C7.06425 8.66852 7.27322 8.58196 7.42729 8.42789C7.58136 8.27381 7.66792 8.06485 7.66792 7.84695C7.66792 7.62906 7.58136 7.42009 7.42729 7.26602C7.27322 7.11195 7.06425 7.02539 6.84636 7.02539H0.821563C0.603671 7.02539 0.394703 7.11195 0.24063 7.26602C0.0865571 7.42009 0 7.62906 0 7.84695C0 8.06485 0.0865571 8.27381 0.24063 8.42789Z" fill="black" />
                            <path d="M0.821563 12.8111C0.603671 12.8111 0.394703 12.7245 0.24063 12.5705C0.0865571 12.4164 0 12.2074 0 11.9895C0 11.7716 0.0865571 11.5627 0.24063 11.4086C0.394703 11.2545 0.603671 11.168 0.821563 11.168H9.91907C10.137 11.168 10.3459 11.2545 10.5 11.4086C10.6541 11.5627 10.7406 11.7716 10.7406 11.9895C10.7406 12.2074 10.6541 12.4164 10.5 12.5705C10.3459 12.7245 10.137 12.8111 9.91907 12.8111H0.821563Z" fill="black" />
                            <path d="M0.24063 4.28335C0.394703 4.43743 0.603671 4.52398 0.821563 4.52398H4.65552C4.87341 4.52398 5.08238 4.43743 5.23645 4.28335C5.39053 4.12928 5.47708 3.92031 5.47708 3.70242C5.47708 3.48453 5.39053 3.27556 5.23645 3.12149C5.08238 2.96742 4.87341 2.88086 4.65552 2.88086H0.821563C0.603671 2.88086 0.394703 2.96742 0.24063 3.12149C0.0865571 3.27556 0 3.48453 0 3.70242C0 3.92031 0.0865571 4.12928 0.24063 4.28335Z" fill="black" />
                            <path d="M13.9991 13.9991C14.1532 13.845 14.2398 13.636 14.2398 13.4181V2.80354L16.6716 5.23537C16.8273 5.38049 17.0333 5.4595 17.2462 5.45574C17.459 5.45199 17.6621 5.36576 17.8126 5.21524C17.9631 5.06471 18.0493 4.86164 18.0531 4.6488C18.0569 4.43596 17.9779 4.22997 17.8327 4.07423L13.9988 0.240269C13.8447 0.0864168 13.6359 0 13.4182 0C13.2005 0 12.9917 0.0864168 12.8376 0.240269L9.00367 4.07423C8.92296 4.14944 8.85821 4.24014 8.81331 4.34092C8.76841 4.4417 8.74426 4.55049 8.74232 4.6608C8.74037 4.77111 8.76066 4.88068 8.80198 4.98298C8.8433 5.08528 8.9048 5.17821 8.98282 5.25622C9.06083 5.33424 9.15376 5.39574 9.25606 5.43706C9.35836 5.47838 9.46793 5.49867 9.57824 5.49673C9.68855 5.49478 9.79735 5.47064 9.89812 5.42573C9.9989 5.38083 10.0896 5.31609 10.1648 5.23537L12.5966 2.80354V13.4181C12.5966 13.636 12.6832 13.845 12.8373 13.9991C12.9913 14.1531 13.2003 14.2397 13.4182 14.2397C13.6361 14.2397 13.8451 14.1531 13.9991 13.9991Z" fill="black" />
                        </svg>
                    </button>
                )}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-[#e6e6e6] rounded-[25px]">
                <button
                    type="button"
                    onClick={() => onViewModeChange('list')}
                    className={cn(
                        'rounded-l-full flex h-[36px] w-[46px] items-center justify-center cursor-pointer transition-colors',
                        viewMode === 'list' ? 'bg-[#008080] text-white' : 'bg-transparent text-black'
                    )}
                    aria-label="List view"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
                        <path d="M8.125 7.3125H22.75M8.125 13H22.75M8.125 18.6875H22.75" stroke={viewMode === 'list' ? 'white' : '#535352'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4.0625 8.125C4.51123 8.125 4.875 7.76123 4.875 7.3125C4.875 6.86377 4.51123 6.5 4.0625 6.5C3.61377 6.5 3.25 6.86377 3.25 7.3125C3.25 7.76123 3.61377 8.125 4.0625 8.125Z" stroke={viewMode === 'list' ? 'white' : '#535352'} strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4.0625 13.8125C4.51123 13.8125 4.875 13.4487 4.875 13C4.875 12.5513 4.51123 12.1875 4.0625 12.1875C3.61377 12.1875 3.25 12.5513 3.25 13C3.25 13.4487 3.61377 13.8125 4.0625 13.8125Z" stroke={viewMode === 'list' ? 'white' : '#535352'} strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4.0625 19.5C4.51123 19.5 4.875 19.1362 4.875 18.6875C4.875 18.2388 4.51123 17.875 4.0625 17.875C3.61377 17.875 3.25 18.2388 3.25 18.6875C3.25 19.1362 3.61377 19.5 4.0625 19.5Z" stroke={viewMode === 'list' ? 'white' : '#535352'} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => onViewModeChange('grid')}
                    className={cn(
                        'rounded-r-full flex h-[36px] w-[46px] items-center justify-center cursor-pointer transition-colors',
                        viewMode === 'grid' ? 'bg-[#008080] text-white' : 'bg-transparent text-black'
                    )}
                    aria-label="Grid view"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
                        <path d="M5.41406 11.0493V6.28268C5.41406 6.05283 5.50537 5.83239 5.6679 5.66986C5.83043 5.50732 6.05088 5.41602 6.28073 5.41602H11.0474C11.2772 5.41602 11.4977 5.50732 11.6602 5.66986C11.8228 5.83239 11.9141 6.05283 11.9141 6.28268V11.0493C11.9141 11.2792 11.8228 11.4996 11.6602 11.6622C11.4977 11.8247 11.2772 11.916 11.0474 11.916H6.28073C6.05088 11.916 5.83043 11.8247 5.6679 11.6622C5.50537 11.4996 5.41406 11.2792 5.41406 11.0493ZM14.0807 11.0493V6.28268C14.0807 6.05283 14.172 5.83239 14.3346 5.66986C14.4971 5.50732 14.7175 5.41602 14.9474 5.41602H19.7141C19.9439 5.41602 20.1644 5.50732 20.3269 5.66986C20.4894 5.83239 20.5807 6.05283 20.5807 6.28268V11.0493C20.5807 11.2792 20.4894 11.4996 20.3269 11.6622C20.1644 11.8247 19.9439 11.916 19.7141 11.916H14.9474C14.7175 11.916 14.4971 11.8247 14.3346 11.6622C14.172 11.4996 14.0807 11.2792 14.0807 11.0493ZM14.0807 19.716V14.9493C14.0807 14.7195 14.172 14.4991 14.3346 14.3365C14.4971 14.174 14.7175 14.0827 14.9474 14.0827H19.7141C19.9439 14.0827 20.1644 14.174 20.3269 14.3365C20.4894 14.4991 20.5807 14.7195 20.5807 14.9493V19.716C20.5807 19.9459 20.4894 20.1663 20.3269 20.3288C20.1644 20.4914 19.9439 20.5827 19.7141 20.5827H14.9474C14.7175 20.5827 14.4971 20.4914 14.3346 20.3288C14.172 20.1663 14.0807 19.9459 14.0807 19.716ZM5.41406 19.716V14.9493C5.41406 14.7195 5.50537 14.4991 5.6679 14.3365C5.83043 14.174 6.05088 14.0827 6.28073 14.0827H11.0474C11.2772 14.0827 11.4977 14.174 11.6602 14.3365C11.8228 14.4991 11.9141 14.7195 11.9141 14.9493V19.716C11.9141 19.9459 11.8228 20.1663 11.6602 20.3288C11.4977 20.4914 11.2772 20.5827 11.0474 20.5827H6.28073C6.05088 20.5827 5.83043 20.4914 5.6679 20.3288C5.50537 20.1663 5.41406 19.9459 5.41406 19.716Z"
                            fill={viewMode === 'grid' ? 'white' : '#535352'} />
                    </svg>
                </button>
            </div>

            {/* Filter Popover */}
            <FilterPopover
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                triggerRef={filterButtonRef}
                onApply={handleFilterApply}
                onReset={handleFilterReset}
                filterConfig={[
                    { type: 'singleDate', title: 'Upload Date', showTimePicker: true },
                    { type: 'userSelection', title: 'Uploaded By', id: 'createdBy' },
                    { type: 'audienceSelection', title: 'Audience' },
                    { type: 'multiSelection', title: 'Category', id: 'category', multiSelectionTitle: "Choose one or more relevant categories" },
                    { type: 'multiSelection', title: 'File Type', id: 'fileType' },
                ]}
                departments={departments}
                users={users}
                fileTypes={fileTypes}
                projectGroups={projectGroups}
                initialFilters={initialFilters}
            />

            {/* Sort Popover */}
            <SortPopover
                isOpen={isSortOpen}
                onClose={() => setIsSortOpen(false)}
                triggerRef={sortButtonRef}
                selectedSort={selectedSort}
                onSortChange={(sort) => handleSortChange(sort)}
                sortOptions={sortOptions}
            />
        </div>
    );
};

export default ResourceSearchFilterBar;

