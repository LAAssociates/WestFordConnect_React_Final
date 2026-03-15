import { Search, Loader2 } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { cn } from '../../lib/utils/cn';
import FilterPopover, { type FilterState } from '../common/FilterPopover';
import SortPopover from '../common/SortPopover';

interface SearchFilterBarProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    onFilterClick?: () => void;
    onSortClick?: () => void;
    onFilterApply?: (filters: FilterState) => void;
    onFilterReset?: () => void;
    onSortChange?: (sort: 'newest' | 'oldest' | 'title-az' | 'title-za') => void;
    selectedSort?: string;
    className?: string;
    users?: any[];
    groups?: any[];
    sortOptions?: { value: string; label: string }[];
    isLoading?: boolean;
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
    searchValue,
    onSearchChange,
    onFilterClick,
    onSortClick,
    onFilterApply,
    onFilterReset,
    onSortChange,
    selectedSort,
    className,
    users,
    groups,
    sortOptions = [],
    isLoading = false,
}) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const filterButtonRef = useRef<HTMLButtonElement>(null);
    const sortButtonRef = useRef<HTMLButtonElement>(null);
    const effectiveSort = selectedSort && String(selectedSort).length > 0 ? String(selectedSort) : (sortOptions.length > 0 ? String(sortOptions[0].value) : '');
    const handleFilterClick = () => {
        setIsFilterOpen((prev) => !prev);
        setIsSortOpen(false);
        if (onFilterClick) {
            onFilterClick();
        }
    };

    const handleSortClick = () => {
        setIsSortOpen((prev) => !prev);
        setIsFilterOpen(false);
        if (onSortClick) {
            onSortClick();
        }
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
            onSortChange(String(sort) as any);
        }
    };

    return (
        <div className={cn('relative flex items-center gap-[15px] max-w-full', className)}>
            <div className="h-[40px] w-[399px] max-w-full bg-[#e6e6e6] border border-[#cacaca] border-solid rounded-[25px] flex items-center px-[15px] py-[10px]">
                {isLoading ? (
                    <Loader2 className="h-[18px] w-[18px] text-black shrink-0 animate-spin" />
                ) : (
                    <Search className="h-[18px] w-[18px] text-black shrink-0" />
                )}
                <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Find a post by keyword, category, or title..."
                    className="flex-1 bg-transparent text-[14px] font-medium text-black placeholder:text-black focus:outline-none ml-2"
                />
            </div>
            <button
                ref={filterButtonRef}
                type="button"
                onClick={handleFilterClick}
                className={cn(
                    'shrink-0 rounded-full flex h-[32px] w-[32px] items-center justify-center cursor-pointer transition-colors',
                    isFilterOpen ? 'bg-[#DE4A2C]' : 'bg-[#DE4A2C]'
                )}
                aria-label="Filter posts"
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M1.61274 1.6L6.84029 8.0808C7.06912 8.36466 7.1937 8.71734 7.19353 9.0808V14.4L8.80647 13.2V9.08C8.80648 8.71682 8.93105 8.36445 9.15971 8.0808L14.3873 1.6H1.61274ZM1.61274 0H14.3873C14.6911 3.76005e-05 14.9888 0.0852189 15.246 0.245733C15.5032 0.406246 15.7094 0.635563 15.841 0.90727C15.9725 1.17898 16.0241 1.48202 15.9896 1.7815C15.9551 2.08097 15.8361 2.3647 15.6462 2.6L10.4194 9.08V13.2C10.4194 13.4484 10.3611 13.6934 10.2491 13.9155C10.1371 14.1377 9.97456 14.331 9.77424 14.48L8.16129 15.68C7.92166 15.8583 7.63671 15.9669 7.33838 15.9935C7.04005 16.0202 6.74012 15.964 6.4722 15.8311C6.20428 15.6982 5.97896 15.4939 5.82148 15.2412C5.664 14.9884 5.58058 14.6971 5.58058 14.4V9.08L0.353841 2.6C0.163928 2.3647 0.0448808 2.08097 0.010412 1.7815C-0.0240568 1.48202 0.0274547 1.17898 0.159013 0.90727C0.290572 0.635563 0.496826 0.406246 0.754019 0.245733C1.01121 0.0852189 1.30888 3.76005e-05 1.61274 0Z" fill="white" />
                    </svg>
                )}
            </button>
            <button
                ref={sortButtonRef}
                type="button"
                onClick={handleSortClick}
                className={cn(
                    'shrink-0 rounded-full flex h-[32px] w-[32px] items-center justify-center cursor-pointer transition-colors',
                    isSortOpen ? 'bg-[#CACACA]' : 'bg-[#CACACA]'
                )}
                aria-label="Sort posts"
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 text-black animate-spin" />
                ) : (
                    <svg width="19" height="15" viewBox="0 0 19 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0.24063 8.42789C0.394703 8.58196 0.603671 8.66852 0.821563 8.66852H6.84636C7.06425 8.66852 7.27322 8.58196 7.42729 8.42789C7.58136 8.27381 7.66792 8.06485 7.66792 7.84695C7.66792 7.62906 7.58136 7.42009 7.42729 7.26602C7.27322 7.11195 7.06425 7.02539 6.84636 7.02539H0.821563C0.603671 7.02539 0.394703 7.11195 0.24063 7.26602C0.0865571 7.42009 0 7.62906 0 7.84695C0 8.06485 0.0865571 8.27381 0.24063 8.42789Z" fill="black" />
                        <path d="M0.821563 12.8111C0.603671 12.8111 0.394703 12.7245 0.24063 12.5705C0.0865571 12.4164 0 12.2074 0 11.9895C0 11.7716 0.0865571 11.5627 0.24063 11.4086C0.394703 11.2545 0.603671 11.168 0.821563 11.168H9.91907C10.137 11.168 10.3459 11.2545 10.5 11.4086C10.6541 11.5627 10.7406 11.7716 10.7406 11.9895C10.7406 12.2074 10.6541 12.4164 10.5 12.5705C10.3459 12.7245 10.137 12.8111 9.91907 12.8111H0.821563Z" fill="black" />
                        <path d="M0.24063 4.28335C0.394703 4.43743 0.603671 4.52398 0.821563 4.52398H4.65552C4.87341 4.52398 5.08238 4.43743 5.23645 4.28335C5.39053 4.12928 5.47708 3.92031 5.47708 3.70242C5.47708 3.48453 5.39053 3.27556 5.23645 3.12149C5.08238 2.96742 4.87341 2.88086 4.65552 2.88086H0.821563C0.603671 2.88086 0.394703 2.96742 0.24063 3.12149C0.0865571 3.27556 0 3.48453 0 3.70242C0 3.92031 0.0865571 4.12928 0.24063 4.28335Z" fill="black" />
                        <path d="M13.9991 13.9991C14.1532 13.845 14.2398 13.636 14.2398 13.4181V2.80354L16.6716 5.23537C16.8273 5.38049 17.0333 5.4595 17.2462 5.45574C17.459 5.45199 17.6621 5.36576 17.8126 5.21524C17.9631 5.06471 18.0493 4.86164 18.0531 4.6488C18.0569 4.43596 17.9779 4.22997 17.8327 4.07423L13.9988 0.240269C13.8447 0.0864168 13.6359 0 13.4182 0C13.2005 0 12.9917 0.0864168 12.8376 0.240269L9.00367 4.07423C8.92296 4.14944 8.85821 4.24014 8.81331 4.34092C8.76841 4.4417 8.74426 4.55049 8.74232 4.6608C8.74037 4.77111 8.76066 4.88068 8.80198 4.98298C8.8433 5.08528 8.9048 5.17821 8.98282 5.25622C9.06083 5.33424 9.15376 5.39574 9.25606 5.43706C9.35836 5.47838 9.46793 5.49867 9.57824 5.49673C9.68855 5.49478 9.79735 5.47064 9.89812 5.42573C9.9989 5.38083 10.0896 5.31609 10.1648 5.23537L12.5966 2.80354V13.4181C12.5966 13.636 12.6832 13.845 12.8373 13.9991C12.9913 14.1531 13.2003 14.2397 13.4182 14.2397C13.6361 14.2397 13.8451 14.1531 13.9991 13.9991Z" fill="black" />
                    </svg>
                )}
            </button>

            {/* Filter Popover */}
            <FilterPopover
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                triggerRef={filterButtonRef}
                onApply={handleFilterApply}
                onReset={handleFilterReset}
                users={users}
                projectGroups={groups}
            />

            {/* Sort Popover */}
            <SortPopover
                isOpen={isSortOpen}
                onClose={() => setIsSortOpen(false)}
                triggerRef={sortButtonRef}
                selectedSort={effectiveSort}
                onSortChange={handleSortChange}
                sortOptions={sortOptions}
            />
        </div>
    );
};

export default SearchFilterBar;

