import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FolderPlus, FileUp, FolderUp, X } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface AddResourceButtonProps {
    onNewFolder?: () => void;
    onUploadFile?: () => void;
    onUploadFolder?: (files: FileList) => void;
    // Optional: keep for backward compatibility but will open popover
    onClick?: () => void;
    isLoading?: boolean;
}

const AddResourceButton: React.FC<AddResourceButtonProps> = ({
    onNewFolder,
    onUploadFile,
    onUploadFolder,
    onClick,
    isLoading = false,
}) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
    const [showError, setShowError] = useState(false);
    const [shouldRenderMenu, setShouldRenderMenu] = useState(false);
    const [isMenuVisible, setIsMenuVisible] = useState(false);

    const updateMenuPosition = () => {
        if (!buttonRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const dropdownWidth = 200;
        const HORIZONTAL_OFFSET = 8; // Gap between button and popover
        const VERTICAL_OFFSET = 0; // Slight vertical offset if needed
        const padding = 10;

        // Position the popover to the right of the button
        let menuLeft = rect.right + HORIZONTAL_OFFSET;
        let menuTop = rect.top + VERTICAL_OFFSET;

        // Ensure menu stays within viewport bounds
        const maxLeft = window.innerWidth - dropdownWidth - padding;
        const minLeft = padding;

        if (menuLeft > maxLeft) {
            // If popover would overflow on the right, position it to the left of the button instead
            menuLeft = rect.left - dropdownWidth - HORIZONTAL_OFFSET;
            if (menuLeft < minLeft) {
                menuLeft = minLeft;
            }
        }

        // Ensure menu stays within vertical viewport bounds
        const maxTop = window.innerHeight - 150; // Approximate menu height
        const minTop = padding;
        if (menuTop < minTop) {
            menuTop = minTop;
        } else if (menuTop > maxTop) {
            menuTop = maxTop;
        }

        setMenuPosition({
            top: menuTop,
            left: menuLeft,
        });
    };

    useEffect(() => {
        if (!isOpen) return;

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
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;

            if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
                return;
            }

            setIsOpen(false);
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
            setShouldRenderMenu(true);
            // Defer to next frame so transition runs on mount
            const raf = requestAnimationFrame(() => setIsMenuVisible(true));
            return () => cancelAnimationFrame(raf);
        } else {
            setIsMenuVisible(false);
            const timer = setTimeout(() => setShouldRenderMenu(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, menuPosition]);

    const handleButtonClick = () => {
        if (onClick && !onNewFolder && !onUploadFile && !onUploadFolder) {
            // Backward compatibility: if only onClick is provided, call it directly
            onClick();
        } else {
            // Otherwise, toggle the popover
            setIsOpen(!isOpen);
        }
    };

    const handleNewFolder = () => {
        setIsOpen(false);
        onNewFolder?.();
    };

    const handleUploadFile = () => {
        setIsOpen(false);
        onUploadFile?.();
    };

    const handleUploadFolder = () => {
        setIsOpen(false);
        folderInputRef.current?.click();
    };

    const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // When webkitdirectory is used, files will have webkitRelativePath
        // Check if files have webkitRelativePath (indicates folder selection)
        // If no files have webkitRelativePath, it means regular files were selected
        let hasValidFolderStructure = false;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const webkitRelativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
            // If webkitRelativePath exists and has path separators, it's from a folder
            if (webkitRelativePath && webkitRelativePath.includes('/')) {
                hasValidFolderStructure = true;
                break;
            }
        }

        if (!hasValidFolderStructure) {
            // Show error if no valid folder structure detected
            setShowError(true);
            // Reset input
            if (folderInputRef.current) {
                folderInputRef.current.value = '';
            }
        } else {
            // Valid folder selection
            onUploadFolder?.(files);
            // Reset input
            if (folderInputRef.current) {
                folderInputRef.current.value = '';
            }
        }
    };


    const menuItems = [
        {
            id: 'new-folder',
            label: 'New Folder',
            icon: FolderPlus,
            onClick: handleNewFolder,
        },
        {
            id: 'upload-file',
            label: 'Upload File',
            icon: FileUp,
            onClick: handleUploadFile,
        },
        {
            id: 'upload-folder',
            label: 'Upload Folder',
            icon: FolderUp,
            onClick: handleUploadFolder,
        },
    ];

    return (
        <>
            <input
                ref={folderInputRef}
                type="file"
                className="hidden"
                {...({ webkitdirectory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
                onChange={handleFolderInputChange}
            />

            {isLoading ? (
                <div className="mx-5 my-[25px] h-[40px] bg-gray-200 animate-pulse rounded-[25px]"></div>
            ) : (
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={handleButtonClick}
                    className={cn(
                        'mx-5 my-[25px] flex justify-center items-center gap-2 bg-[#008080] text-white font-semibold text-[14px] leading-normal px-[20px] py-[10px] rounded-[25px] transition cursor-pointer',
                        isOpen ? 'hover:opacity-100' : 'hover:opacity-90'
                    )}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M14 11V14H2V11H0V14C0 15.1 0.9 16 2 16H14C15.1 16 16 15.1 16 14V11H14ZM3 5L4.41 6.41L7 3.83V12H9V3.83L11.59 6.41L13 5L8 0L3 5Z" fill="white" />
                    </svg>
                    <span>Add Resource</span>
                </button>
            )}

            {shouldRenderMenu && menuPosition && createPortal(
                <div
                    ref={menuRef}
                    className={cn(
                        "bg-[#232725] rounded-[10px] shadow-lg z-50 overflow-hidden transition-opacity duration-300",
                        isMenuVisible ? 'opacity-100' : 'opacity-0'
                    )}
                    style={{
                        position: 'fixed',
                        top: menuPosition.top,
                        left: menuPosition.left,
                        width: '200px',
                    }}
                >
                    <div className="p-2.5 flex flex-col">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={item.onClick}
                                    className="cursor-pointer flex items-center gap-2 h-[40px] pl-2.5 pr-2.5 rounded-[5px] text-sm font-medium text-white transition-colors hover:bg-[#2F3432] w-full"
                                >
                                    <Icon className="w-5 h-5 shrink-0" />
                                    <span className="whitespace-nowrap">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>,
                document.body
            )}

            {/* Error Message Modal */}
            {showError && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
                    onClick={() => setShowError(false)}
                >
                    <div
                        className="relative bg-[#232725] rounded-[10px] p-6 max-w-md w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setShowError(false)}
                            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-[#2F3432] text-white hover:bg-[#3A3F3D] cursor-pointer transition"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-lg font-semibold text-white">Not Supported</h3>
                            <div className="w-6 h-6 rounded-full bg-[#FF6B35] flex items-center justify-center">
                                <span className="text-white text-xs font-bold">!</span>
                            </div>
                        </div>
                        <p className="text-white text-sm leading-relaxed">
                            Folder upload isn't supported in your current browser. Please zip your folder and upload it as a file instead.
                        </p>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default AddResourceButton;

