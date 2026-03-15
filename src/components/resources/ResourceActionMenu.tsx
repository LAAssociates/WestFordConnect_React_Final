import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils/cn';
import type { Resource } from './types';
import Tooltip from '../ui/Tooltip';
import DeleteFileModal from './DeleteFileModal';

interface ResourceActionMenuProps {
    resource: Resource;
    onEdit?: (resource: Resource) => void | Promise<void>;
    onDownload?: (resource: Resource) => void | Promise<void>;
    onFileInfo?: (resource: Resource) => void | Promise<void>;
    onDelete?: (resource: Resource) => void | Promise<void>;
    /** Whether to show button only on group hover (default: true) */
    showOnHover?: boolean;
}

const ResourceActionMenu: React.FC<ResourceActionMenuProps> = ({
    resource,
    onEdit,
    onDownload,
    onFileInfo,
    onDelete,
    showOnHover = true,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
    const [shouldRenderMenu, setShouldRenderMenu] = useState(false);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const updateMenuPosition = useCallback(() => {
        if (!triggerRef.current) {
            return;
        }

        const rect = triggerRef.current.getBoundingClientRect();
        // Use smaller offset in grid view (showOnHover=false), larger in list view (showOnHover=true)
        const OFFSET_PX = showOnHover ? 20 : 8;
        const PADDING = 10;
        const MENU_WIDTH = 180;

        // Calculate menu height (fallback estimate: 4 items * 40px + 20px padding)
        const MENU_ITEM_COUNT = 4;
        const estimatedMenuHeight = MENU_ITEM_COUNT * 40 + 20;
        const menuHeight = menuRef.current?.offsetHeight || estimatedMenuHeight;

        // Check available space
        const spaceBelow = window.innerHeight - rect.bottom - OFFSET_PX;
        const spaceAbove = rect.top - OFFSET_PX;

        // Determine vertical position
        // Default: position below if there's enough space, or if space below >= space above
        let top: number;
        if (spaceBelow >= menuHeight || spaceBelow >= spaceAbove) {
            // Position below (default)
            top = rect.bottom + OFFSET_PX;
        } else {
            // Position above
            top = rect.top - menuHeight - OFFSET_PX;
        }

        // Ensure menu doesn't go outside viewport vertically
        top = Math.max(PADDING, Math.min(top, window.innerHeight - menuHeight - PADDING));

        // Horizontal positioning (keep right alignment)
        let right = window.innerWidth - rect.right;
        const maxRight = window.innerWidth - MENU_WIDTH - PADDING;
        right = Math.max(PADDING, Math.min(right, maxRight));

        setMenuPosition({ top, right });
    }, [showOnHover]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

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
    }, [isOpen, updateMenuPosition]);

    // Re-measure menu after it's rendered to get accurate height
    useEffect(() => {
        if (!isOpen || !menuRef.current) {
            return;
        }

        // Use requestAnimationFrame to ensure menu is fully rendered
        const rafId = requestAnimationFrame(() => {
            updateMenuPosition();
        });

        return () => {
            cancelAnimationFrame(rafId);
        };
    }, [isOpen, updateMenuPosition]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;

            if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
                return;
            }

            setIsOpen(false);
            setMenuPosition(null);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    // Handle fade animation for dropdown menu
    useEffect(() => {
        if (isOpen && menuPosition) {
            // Always start with menu not visible for fade-in
            setIsMenuVisible(false);
            setShouldRenderMenu(true);

            // Defer to next frame so transition runs on mount
            let timeoutId: number;
            const raf = requestAnimationFrame(() => {
                // Use a small timeout to ensure the element is rendered before transitioning
                timeoutId = window.setTimeout(() => {
                    setIsMenuVisible(true);
                }, 20);
            });
            return () => {
                cancelAnimationFrame(raf);
                if (timeoutId) clearTimeout(timeoutId);
            };
        } else if (!isOpen) {
            setIsMenuVisible(false);
            const timer = setTimeout(() => {
                setShouldRenderMenu(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, menuPosition]);

    const toggleDropdown = () => {
        setIsOpen(prev => {
            const next = !prev;

            if (next) {
                updateMenuPosition();
            } else {
                setMenuPosition(null);
            }

            return next;
        });
    };

    const handleAction = async (id: string, action?: (resource: Resource) => void | Promise<void>) => {
        if (action) {
            setLoadingActionId(id);
            try {
                await action(resource);
            } finally {
                setLoadingActionId(null);
                setIsOpen(false);
                setMenuPosition(null);
            }
        } else {
            setIsOpen(false);
            setMenuPosition(null);
        }
    };

    const menuItems = [
        {
            id: 'edit', label: 'Edit', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M1.5 5.64456C1.5 4.551 1.93442 3.50222 2.70768 2.72896C3.48095 1.95569 4.52972 1.52127 5.62328 1.52127H9.98936C10.2145 1.52127 10.4304 1.61072 10.5897 1.76992C10.7489 1.92913 10.8383 2.14506 10.8383 2.37021C10.8383 2.59536 10.7489 2.81129 10.5897 2.9705C10.4304 3.12971 10.2145 3.21915 9.98936 3.21915H5.62328C4.98002 3.21915 4.36311 3.47468 3.90826 3.92953C3.45341 4.38439 3.19787 5.0013 3.19787 5.64456V14.3767C3.19787 15.02 3.45341 15.6369 3.90826 16.0917C4.36311 16.5466 4.98002 16.8021 5.62328 16.8021H14.3554C14.9987 16.8021 15.6156 16.5466 16.0705 16.0917C16.5253 15.6369 16.7809 15.02 16.7809 14.3767V10.0106C16.7809 9.78549 16.8703 9.56956 17.0295 9.41035C17.1887 9.25114 17.4046 9.1617 17.6298 9.1617C17.8549 9.1617 18.0709 9.25114 18.2301 9.41035C18.3893 9.56956 18.4787 9.78549 18.4787 10.0106V14.3767C18.4787 15.4703 18.0443 16.5191 17.271 17.2923C16.4978 18.0656 15.449 18.5 14.3554 18.5H5.62328C4.52972 18.5 3.48095 18.0656 2.70768 17.2923C1.93442 16.5191 1.5 15.4703 1.5 14.3767V5.64456Z" fill="white" />
                <path fillRule="evenodd" clipRule="evenodd" d="M12.6484 11.0431L10.7765 12.1722L9.89955 10.718L11.7715 9.58888L11.774 9.58718C11.8458 9.54397 11.9119 9.49208 11.971 9.43267L16.2241 5.15743C16.2667 5.11448 16.3078 5.07002 16.3472 5.02415C16.6282 4.69646 17.0442 4.04787 16.5408 3.5419C16.1155 3.11404 15.5059 3.51813 15.1112 3.86535C15.0053 3.9587 14.9033 4.05641 14.8056 4.15823L14.7767 4.1871L10.5829 8.40206C10.4834 8.50105 10.4053 8.61955 10.3537 8.75013L9.65421 10.51C9.64094 10.5431 9.63845 10.5795 9.64707 10.6142C9.65569 10.6488 9.675 10.6798 9.70225 10.7028C9.7295 10.7258 9.76331 10.7397 9.79888 10.7424C9.83445 10.7451 9.86912 10.7366 9.89955 10.718L10.7765 12.1722C9.24418 13.0958 7.41472 11.544 8.07689 9.88176L8.77726 8.12276C8.91362 7.77903 9.11872 7.46675 9.38 7.20506L13.5729 2.98925L13.5975 2.96463C13.7223 2.83729 14.1417 2.40773 14.6502 2.09871C14.9278 1.93147 15.3709 1.7099 15.9185 1.66745C16.5467 1.61737 17.2174 1.81517 17.7437 2.34406C18.1466 2.74203 18.3999 3.26672 18.4611 3.82969C18.5031 4.2685 18.4361 4.71091 18.2658 5.11753C18.0196 5.72622 17.6087 6.17361 17.4279 6.35443L13.1747 10.6297C13.0163 10.7887 12.8408 10.9265 12.6484 11.0431ZM16.4287 4.99359C16.4287 4.99359 16.4253 4.99613 16.4177 4.99868L16.4287 4.99359Z" fill="white" />
            </svg>, onClick: () => handleAction('edit', onEdit), tooltip: 'Edit File'
        },
        {
            id: 'download', label: 'Download', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M16 13V16H4V13H2V16C2 17.1 2.9 18 4 18H16C17.1 18 18 17.1 18 16V13H16Z" fill="white" />
                <path d="M6.41 7.59L5 9L10 14L15 9L13.59 7.59L11 10.17V2H9V10.17L6.41 7.59Z" fill="white" />
            </svg>, onClick: () => handleAction('download', onDownload), tooltip: 'Download File'
        },
        {
            id: 'file-info', label: 'File Information', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 1C12.3869 1 14.6761 1.94821 16.364 3.63604C18.0518 5.32387 19 7.61305 19 10C19 12.3869 18.0518 14.6761 16.364 16.364C14.6761 18.0518 12.3869 19 10 19C7.61305 19 5.32387 18.0518 3.63604 16.364C1.94821 14.6761 1 12.3869 1 10C1 7.61305 1.94821 5.32387 3.63604 3.63604C5.32387 1.94821 7.61305 1 10 1ZM11.3499 6.52561C12.0184 6.52561 12.561 6.0615 12.561 5.37369C12.561 4.68588 12.0171 4.22177 11.3499 4.22177C10.6814 4.22177 10.1414 4.68588 10.1414 5.37369C10.1414 6.0615 10.6814 6.52561 11.3499 6.52561ZM11.5852 13.7598C11.5852 13.6222 11.6327 13.2648 11.6057 13.0617L10.549 14.2779C10.3304 14.508 10.0566 14.6675 9.92801 14.625C9.86968 14.6036 9.82092 14.562 9.79052 14.5078C9.76012 14.4536 9.75006 14.3903 9.76216 14.3293L11.5235 8.76516C11.6675 8.05935 11.2715 7.41526 10.432 7.33298C9.54618 7.33298 8.24255 8.23163 7.44933 9.37197C7.44933 9.50825 7.42361 9.84765 7.45061 10.0508L8.50611 8.8333C8.72466 8.60574 8.97922 8.44504 9.10778 8.48875C9.17112 8.51149 9.22302 8.55815 9.25235 8.61872C9.28167 8.67929 9.28608 8.74894 9.26462 8.81273L7.51875 14.3499C7.31691 14.9979 7.69874 15.633 8.62438 15.7769C9.98714 15.7769 10.7919 14.9002 11.5865 13.7598H11.5852Z" fill="white" />
            </svg>, onClick: () => handleAction('file-info', onFileInfo), tooltip: 'File Information'
        },
        {
            id: 'delete', label: 'Delete', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M6.4375 2.62H6.25C6.35313 2.62 6.4375 2.539 6.4375 2.44V2.62ZM6.4375 2.62H13.5625V2.44C13.5625 2.539 13.6469 2.62 13.75 2.62H13.5625V4.24H15.25V2.44C15.25 1.64575 14.5773 1 13.75 1H6.25C5.42266 1 4.75 1.64575 4.75 2.44V4.24H6.4375V2.62ZM18.25 4.24H1.75C1.33516 4.24 1 4.56175 1 4.96V5.68C1 5.779 1.08437 5.86 1.1875 5.86H2.60312L3.18203 17.6275C3.21953 18.3948 3.88047 19 4.67969 19H15.3203C16.1219 19 16.7805 18.397 16.818 17.6275L17.3969 5.86H18.8125C18.9156 5.86 19 5.779 19 5.68V4.96C19 4.56175 18.6648 4.24 18.25 4.24ZM15.1398 17.38H4.86016L4.29297 5.86H15.707L15.1398 17.38Z" fill="#D93025" />
            </svg>, onClick: () => {
                setIsOpen(false);
                setMenuPosition(null);
                setIsDeleteModalOpen(true);
            }, className: 'text-[#D93025]', tooltip: 'Delete File'
        },
    ];

    const buttonClassName = showOnHover
        ? 'cursor-pointer w-4 block lg:hidden lg:group-hover:block'
        : 'cursor-pointer w-4 h-4 flex items-center justify-center rounded hover:bg-[#F3F4F6] transition-colors';

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown();
                }}
                className={buttonClassName}
                aria-label="More options"
                aria-expanded={isOpen}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="3" height="12" viewBox="0 0 3 12" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M1.5 12C1.10218 12 0.720645 11.842 0.43934 11.5607C0.158036 11.2794 0 10.8978 0 10.5C0 10.1022 0.158036 9.72064 0.43934 9.43934C0.720645 9.15804 1.10218 9 1.5 9C1.89782 9 2.27936 9.15804 2.56066 9.43934C2.84196 9.72064 3 10.1022 3 10.5C3 10.8978 2.84196 11.2794 2.56066 11.5607C2.27936 11.842 1.89782 12 1.5 12ZM1.5 7.5C1.10218 7.5 0.720645 7.34196 0.43934 7.06066C0.158036 6.77936 0 6.39782 0 6C0 5.60218 0.158036 5.22064 0.43934 4.93934C0.720645 4.65804 1.10218 4.5 1.5 4.5C1.89782 4.5 2.27936 4.65804 2.56066 4.93934C2.84196 5.22064 3 5.60218 3 6C3 6.39782 2.84196 6.77936 2.56066 7.06066C2.27936 7.34196 1.89782 7.5 1.5 7.5ZM1.5 3C1.10218 3 0.720645 2.84196 0.43934 2.56066C0.158036 2.27936 0 1.89782 0 1.5C0 1.10218 0.158036 0.720644 0.43934 0.43934C0.720645 0.158035 1.10218 0 1.5 0C1.89782 0 2.27936 0.158035 2.56066 0.43934C2.84196 0.720644 3 1.10218 3 1.5C3 1.89782 2.84196 2.27936 2.56066 2.56066C2.27936 2.84196 1.89782 3 1.5 3Z" fill="#535352" />
                </svg>
            </button>
            {showOnHover && <div className="w-4 block group-hover:hidden"></div>}

            {shouldRenderMenu && menuPosition && typeof document !== 'undefined' &&
                createPortal(
                    <div
                        ref={menuRef}
                        className={cn(
                            "bg-[#232725] rounded-[10px] shadow-[0px_2px_20px_0px_rgba(0,0,0,0.25)] z-50 overflow-hidden transition-opacity duration-300 ease-out",
                            isMenuVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        )}
                        style={{
                            position: 'fixed',
                            top: menuPosition.top,
                            right: menuPosition.right,
                            width: '180px',
                        }}
                    >
                        <div className="p-2.5 flex flex-col">
                            {menuItems.map((item) => {
                                const iconElement = item.tooltip ? (
                                    <Tooltip content={item.tooltip} side="bottom" delay={300}>
                                        <span className="inline-flex">{item.icon}</span>
                                    </Tooltip>
                                ) : (
                                    item.icon
                                );

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!loadingActionId) {
                                                item.onClick();
                                            }
                                        }}
                                        disabled={loadingActionId !== null}
                                        className={cn(
                                            'cursor-pointer flex items-center gap-2 h-[40px] pl-2.5 pr-2.5 rounded-[5px] text-sm font-medium text-white transition-colors hover:bg-[#2F3432] w-full',
                                            item.className,
                                            loadingActionId !== null && loadingActionId !== item.id && 'opacity-50 cursor-not-allowed',
                                            loadingActionId === item.id && 'opacity-80 cursor-wait'
                                        )}
                                    >
                                        {loadingActionId === item.id ? (
                                            <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : iconElement}
                                        <span className="whitespace-nowrap flex-1 text-left">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>,
                    document.body
                )
            }

            {isDeleteModalOpen && (
                <DeleteFileModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={async () => {
                        if (onDelete) {
                            await onDelete(resource);
                        }
                        setIsDeleteModalOpen(false);
                    }}
                    fileName={resource.title}
                />
            )}
        </div>
    );
};

export default ResourceActionMenu;
