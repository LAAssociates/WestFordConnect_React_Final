import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../lib/utils/cn';
import { mockUsers } from '../../messenger/mockData';
import type { User } from '../../messenger/types';
import avatarPlaceholder from '../../../assets/images/avatar-placeholder-2.png';
import { MacScrollbar } from 'mac-scrollbar';

export interface AssignReviewerProps {
    selectedReviewers: User[];
    onReviewersChange: (reviewers: User[]) => void;
    availableUsers?: User[];
    className?: string;
    variant?: 'default' | 'variant2' | 'variant3' | 'variant4' | 'variant5';
}

const AssignReviewer: React.FC<AssignReviewerProps> = ({
    selectedReviewers,
    onReviewersChange,
    availableUsers,
    className,
    variant = 'default',
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get "You" user (user-1) - always selected by default
    const youUser = useMemo(() => {
        return mockUsers.find((user) => user.id === 'user-1' || user.name === 'You');
    }, []);

    // Function to get display name - show "Hanil Das" instead of "You"
    const getDisplayName = (user: User) => {
        if (youUser && user.id === youUser.id) {
            return 'Hanil Das';
        }
        return user.name;
    };

    // Include "You" user in the list for dropdown - always add "You" user even if filtered out
    const users = useMemo(() => {
        const baseUsers = availableUsers || mockUsers;
        // Ensure "You" user is always included
        if (youUser && !baseUsers.some((u) => u.id === youUser.id)) {
            return [youUser, ...baseUsers];
        }
        return baseUsers;
    }, [availableUsers, youUser]);

    // Ensure "You" user is always in selectedReviewers
    useEffect(() => {
        if (youUser && !selectedReviewers.some((r) => r.id === youUser.id)) {
            onReviewersChange([youUser, ...selectedReviewers]);
        }
    }, [youUser, selectedReviewers, onReviewersChange]);

    // Helper function to check if user is selected
    const isUserSelected = useCallback((userId: string) => {
        return selectedReviewers.some((r) => r.id === userId);
    }, [selectedReviewers]);

    // Filter and sort users for dropdown - "You" user first, then selected users, then others
    const filteredUsers = useMemo(() => {
        let filtered = users;

        // Filter by search query if present
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = users.filter(
                (user) =>
                    user.name.toLowerCase().includes(query) ||
                    user.position.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query) ||
                    (youUser && user.id === youUser.id && 'hanil das'.includes(query))
            );
        }

        // Sort: "You" user first, then selected users, then others
        const sorted = [...filtered].sort((a, b) => {
            const aIsYou = youUser ? a.id === youUser.id : false;
            const bIsYou = youUser ? b.id === youUser.id : false;
            const aIsSelected = isUserSelected(a.id);
            const bIsSelected = isUserSelected(b.id);

            // "You" user always first
            if (aIsYou && !bIsYou) return -1;
            if (!aIsYou && bIsYou) return 1;

            // Selected users come after "You"
            if (aIsSelected && !bIsSelected) return -1;
            if (!aIsSelected && bIsSelected) return 1;

            // Alphabetical order for rest
            return a.name.localeCompare(b.name);
        });

        return sorted;
    }, [users, searchQuery, youUser, selectedReviewers, isUserSelected]);

    // Handle click outside
    useEffect(() => {
        if (!isDropdownOpen) return;

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            if (
                containerRef.current?.contains(target) ||
                buttonRef.current?.contains(target) ||
                dropdownRef.current?.contains(target)
            ) {
                return;
            }
            setIsDropdownOpen(false);
            setSearchQuery('');
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isDropdownOpen]);

    // Calculate dropdown position
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

    // Function to calculate position based on actual dropdown height
    const calculatePosition = useCallback((actualHeight: number) => {
        if (!containerRef.current) return null;

        const rect = containerRef.current.getBoundingClientRect();
        const dropdownWidth = 419;
        const dropdownHeight = actualHeight;
        const offset = 8;

        // Handle viewport boundaries
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Check available space below and above
        const spaceBelow = viewportHeight - rect.bottom - offset;
        const spaceAbove = rect.top - offset;

        // Calculate left position (align right edge of input with right edge of dropdown)
        let left = rect.right - dropdownWidth;

        // Determine if we should open above or below based on available space
        let top: number;
        if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
            // Enough space below, or more space below than above - open below
            top = rect.bottom + offset;
        } else {
            // Not enough space below - open above
            top = rect.top - dropdownHeight - offset;
        }

        // If dropdown goes off top when positioned above, try positioning below
        if (top < 0 && spaceBelow >= dropdownHeight) {
            top = rect.bottom + offset;
        }

        // If dropdown goes off right, align to left edge of viewport
        if (left < 0) {
            left = Math.max(0, rect.left);
        }

        // If dropdown goes off right edge, align to right edge of viewport
        if (left + dropdownWidth > viewportWidth) {
            left = viewportWidth - dropdownWidth - offset;
        }

        return { top, left };
    }, []);

    // Initial position calculation with estimated height
    useEffect(() => {
        if (!isDropdownOpen || !containerRef.current) {
            setDropdownPosition(null);
            return;
        }

        // Use estimated height for initial positioning
        const estimatedHeight = 498; // 65px (search) + 433px (max content)
        const initialPosition = calculatePosition(estimatedHeight);
        if (initialPosition) {
            setDropdownPosition(initialPosition);
        }
    }, [isDropdownOpen, calculatePosition]);

    // Recalculate position based on actual dropdown height when content changes
    useEffect(() => {
        if (!isDropdownOpen || !dropdownPosition || !dropdownRef.current) return;

        const updatePositionWithActualHeight = () => {
            // Use requestAnimationFrame to ensure dropdown is fully rendered
            requestAnimationFrame(() => {
                if (!dropdownRef.current || !containerRef.current) return;

                const actualHeight = dropdownRef.current.getBoundingClientRect().height;
                const newPosition = calculatePosition(actualHeight);

                if (newPosition) {
                    setDropdownPosition(newPosition);
                }
            });
        };

        updatePositionWithActualHeight();
    }, [isDropdownOpen, dropdownPosition, filteredUsers, searchQuery, calculatePosition]);

    // Handle scroll and resize events
    useEffect(() => {
        if (!isDropdownOpen || !dropdownPosition) return;

        const updatePosition = () => {
            if (!dropdownRef.current || !containerRef.current) return;

            const actualHeight = dropdownRef.current.getBoundingClientRect().height;
            const newPosition = calculatePosition(actualHeight);

            if (newPosition) {
                setDropdownPosition(newPosition);
            }
        };

        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isDropdownOpen, dropdownPosition, calculatePosition]);

    const handleToggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
        if (!isDropdownOpen) {
            setSearchQuery('');
        }
    };

    const handleUserClick = (user: User) => {
        // Prevent clicking "You" user
        if (youUser && user.id === youUser.id) {
            return;
        }
        // Only add users, don't toggle - removal happens via X icon
        const isSelected = selectedReviewers.some((r) => r.id === user.id);
        if (!isSelected) {
            // Ensure "You" user is first in the list
            const youUserInList = selectedReviewers.find((r) => youUser && r.id === youUser.id);
            if (youUserInList) {
                const otherReviewers = youUser ? selectedReviewers.filter((r) => r.id !== youUser.id) : selectedReviewers;
                onReviewersChange([youUserInList, ...otherReviewers, user]);
            } else if (youUser) {
                onReviewersChange([youUser, ...selectedReviewers, user]);
            } else {
                onReviewersChange([...selectedReviewers, user]);
            }
        }
    };

    const handleRemoveReviewer = (userId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        // Prevent removing "You" user
        if (youUser && userId === youUser.id) {
            return;
        }
        // Ensure "You" user remains in the list
        const filtered = selectedReviewers.filter((r) => r.id !== userId);
        const youUserInList = filtered.find((r) => youUser && r.id === youUser.id);
        if (!youUserInList && youUser) {
            onReviewersChange([youUser, ...filtered]);
        } else {
            onReviewersChange(filtered);
        }
    };

    // Display logic: show first reviewer (always "You"), then "+X more" if there are more
    const displayChips = useMemo(() => {
        if (selectedReviewers.length === 0 && youUser) {
            return { firstReviewer: youUser, remainingCount: 0 };
        }
        // Ensure "You" user is always first
        const youUserInList = selectedReviewers.find((r) => youUser && r.id === youUser.id);
        const otherReviewers = selectedReviewers.filter((r) => !youUser || r.id !== youUser.id);
        const firstReviewer = youUserInList || youUser || selectedReviewers[0];
        const remainingCount = otherReviewers.length;
        return { firstReviewer, remainingCount };
    }, [selectedReviewers, youUser]);

    // Determine if we should show the add button
    const showAddButton = variant !== 'variant5' || selectedReviewers.length === 0;

    return (
        <>
            <div ref={containerRef} className={cn('relative w-[260px] h-[38px]', className)}>
                <div className="absolute border border-[#E6E6E6] rounded-[5px] inset-0 flex items-center p-[10px] gap-2">
                    {/* First Reviewer Chip (always "You") */}
                    {displayChips.firstReviewer && (
                        <div className="bg-white border border-[#E6E6E6] rounded-[3px] px-[5px] py-[3px] flex items-center gap-1.5 shrink-0">
                            <span className="text-[15px] font-medium text-black leading-snug whitespace-nowrap">
                                {getDisplayName(displayChips.firstReviewer)}
                            </span>
                            {/* Only show delete button if not "You" user */}
                            {youUser && displayChips.firstReviewer.id !== youUser.id && (
                                <button
                                    type="button"
                                    onClick={(e) => handleRemoveReviewer(displayChips.firstReviewer.id, e)}
                                    className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-100 transition ml-1"
                                    aria-label={`Remove ${displayChips.firstReviewer.name}`}
                                >
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 0C2.23858 0 0 2.23858 0 5C0 7.76142 2.23858 10 5 10C7.76142 10 10 7.76142 10 5C10 2.23858 7.76142 0 5 0ZM7.14286 6.42857L6.42857 7.14286L5 5.71429L3.57143 7.14286L2.85714 6.42857L4.28571 5L2.85714 3.57143L3.57143 2.85714L5 4.28571L6.42857 2.85714L7.14286 3.57143L5.71429 5L7.14286 6.42857Z" fill="#535352" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}

                    {/* +X more Chip */}
                    {displayChips.remainingCount > 0 && (
                        <div className="bg-white border border-[#E6E6E6] rounded-[3px] px-[5px] py-[3px] flex items-center gap-1.5 shrink-0">
                            <span className="text-[15px] font-medium text-black leading-snug whitespace-nowrap">
                                +{displayChips.remainingCount} more
                            </span>
                        </div>
                    )}

                    {/* Add Button - inside input */}
                    {showAddButton && (
                        <button
                            ref={buttonRef}
                            type="button"
                            onClick={handleToggleDropdown}
                            className={cn(
                                'shrink-0 flex items-center justify-center rounded-full transition ml-auto',
                                variant === 'variant5' && selectedReviewers.length === 0
                                    ? 'w-[34px] h-[34px] bg-[#008080]'
                                    : 'w-[24px] h-[24px] bg-[#1C2745]'
                            )}
                            aria-label="Add reviewer"
                        >
                            {variant === 'variant5' && selectedReviewers.length === 0 ? (
                                <img
                                    src="https://www.figma.com/api/mcp/asset/260b43bf-771e-48d3-b309-d0be5e472b30"
                                    alt="Plus"
                                    className="w-full h-full"
                                />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M10 5.71429H5.71429V10H4.28571V5.71429H0V4.28571H4.28571V0H5.71429V4.28571H10V5.71429Z" fill="white" />
                                </svg>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Dropdown */}
            {isDropdownOpen && dropdownPosition && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed bg-white border border-[#E6E6E6] rounded-[5px] z-[60] w-[419px] overflow-hidden flex flex-col"
                    style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                    }}
                >
                    {/* Search Bar */}
                    <div className="h-[65px] px-[10px] py-[12px] bg-white">
                        <div className="relative">
                            <div className="absolute left-[15px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] flex items-center justify-center">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.5 11H11.71L11.43 10.73C12.41 9.59 13 8.11 13 6.5C13 2.91 10.09 0 6.5 0C2.91 0 0 2.91 0 6.5C0 10.09 2.91 13 6.5 13C8.11 13 9.59 12.41 10.73 11.43L11 11.71V12.5L16 17.49L17.49 16L12.5 11ZM6.5 11C4.01 11 2 8.99 2 6.5C2 4.01 4.01 2 6.5 2C8.99 2 11 4.01 11 6.5C11 8.99 8.99 11 6.5 11Z" fill="white" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search people by name or email"
                                className="w-full h-[40px] bg-[#232725] border border-[#CACACA] rounded-[5px] px-[15px] pl-[43px] py-[10px] text-[14px] font-medium text-white placeholder:text-white outline-none"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* User List */}
                    <MacScrollbar className="flex-1 max-h-[433px] overflow-y-auto">
                        <div className="p-[10px] pt-0">
                            {filteredUsers.map((user) => {
                                const isSelected = isUserSelected(user.id);
                                const isHovered = hoveredUserId === user.id;
                                const isYouUser = youUser && user.id === youUser.id;

                                return (
                                    <React.Fragment key={user.id}>
                                        <button
                                            type="button"
                                            onClick={() => !isYouUser && handleUserClick(user)}
                                            onMouseEnter={() => !isYouUser && setHoveredUserId(user.id)}
                                            onMouseLeave={() => setHoveredUserId(null)}
                                            disabled={isYouUser}
                                            className={cn(
                                                'w-full flex items-center gap-[10px] p-[10px] rounded-[3px] transition-colors relative border-b',
                                                (isSelected || (isHovered && !isYouUser)) && 'bg-[#E1E6EE]',
                                                (isYouUser || isSelected) && '!cursor-default',
                                                isSelected ? 'border-[#CACACA]' : ' border-[#E6E6E6]'
                                            )}
                                        >
                                            <img
                                                src={user.avatar || avatarPlaceholder}
                                                alt={user.name}
                                                className="w-12 h-12 rounded-full object-cover shrink-0"
                                            />
                                            <div className="flex-1 min-w-0 text-left">
                                                <p className="text-[16px] font-semibold text-black truncate">
                                                    {getDisplayName(user)}
                                                </p>
                                                <p className="text-[14px] text-[#535352] truncate">
                                                    {user.position}
                                                </p>
                                            </div>
                                            {isSelected && !isYouUser && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveReviewer(user.id, e);
                                                    }}
                                                    className="shrink-0 w-6 h-6 flex items-center justify-center rounded transition"
                                                    aria-label={`Remove ${getDisplayName(user)}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                        <path d="M12 0C5.31429 0 0 5.31429 0 12C0 18.6857 5.31429 24 12 24C18.6857 24 24 18.6857 24 12C24 5.31429 18.6857 0 12 0ZM12 22.2857C6.34286 22.2857 1.71429 17.6571 1.71429 12C1.71429 6.34286 6.34286 1.71429 12 1.71429C17.6571 1.71429 22.2857 6.34286 22.2857 12C22.2857 17.6571 17.6571 22.2857 12 22.2857Z" fill="#9A9A9A" />
                                                        <path d="M16.6286 18L12 13.3714L7.37143 18L6 16.6286L10.6286 12L6 7.37143L7.37143 6L12 10.6286L16.6286 6L18 7.37143L13.3714 12L18 16.6286L16.6286 18Z" fill="#9A9A9A" />
                                                    </svg>
                                                </button>
                                            )}
                                        </button>
                                        {/* {index < filteredUsers.length - 1 && (
                                            <div className="h-px bg-[#CACACA]" />
                                        )} */}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </MacScrollbar>
                </div>,
                document.body
            )}
        </>
    );
};

export default AssignReviewer;

