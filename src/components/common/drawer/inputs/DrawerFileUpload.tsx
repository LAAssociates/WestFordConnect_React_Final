import React, { useRef, useState } from 'react';
import { cn } from '../../../../lib/utils/cn';
import { Trash2 } from 'lucide-react';

interface DrawerFileUploadProps {
    label?: string;
    required?: boolean;
    file?: File | null;
    existingFileName?: string;
    onFileSelect: (file: File) => void;
    onFileRemove: () => void;
    accept?: string;
    disabled?: boolean;
    error?: string;
    containerClassName?: string;
}

const DrawerFileUpload: React.FC<DrawerFileUploadProps> = ({
    label = "Upload File",
    required,
    file,
    existingFileName,
    onFileSelect,
    onFileRemove,
    accept,
    disabled,
    error,
    containerClassName,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                onFileSelect(e.dataTransfer.files[0]);
            }
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    const handleFileClick = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    const hasFile = file || existingFileName;

    return (
        <div className={cn("flex items-start justify-between mb-6", containerClassName)}>
            <label className="text-[15px] font-semibold text-black mt-2.5 block">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <div className="w-[419px]">
                {hasFile ? (
                    <div className="w-full rounded-[5px] border border-[#E6E6E6] p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 bg-[#F3F4F6] rounded flex items-center justify-center shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#9A9A9A]">
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-[#111827] truncate">
                                {file ? file.name : existingFileName}
                            </span>
                        </div>
                        {!disabled && (
                            <button
                                type="button"
                                onClick={onFileRemove}
                                className="text-[#EF4444] hover:bg-[#FEF2F2] p-2 rounded-full transition-colors cursor-pointer"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleFileClick}
                        className={cn(
                            'w-full rounded-[5px] border border-dashed bg-white py-14 text-center space-y-3 transition-colors',
                            isDragging ? 'border-[#1E88E5] bg-[#E3F2FD]' : 'border-[#CACACA]',
                            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                        )}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileInputChange}
                            accept={accept}
                            disabled={disabled}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48" fill="none" className="mx-auto">
                            <path d="M35.4133 15.7714L20.6667 0.603429C20.292 0.217529 19.7836 0.000480143 19.2533 0H7.33333C5.38841 0 3.52315 0.794691 2.14788 2.20925C0.772616 3.62381 0 5.54237 0 7.54286V40.4571C0 42.4576 0.772616 44.3762 2.14788 45.7907C3.52315 47.2053 5.38841 48 7.33333 48H28.6667C30.6116 48 32.4769 47.2053 33.8521 45.7907C35.2274 44.3762 36 42.4576 36 40.4571V17.1429C35.979 16.6261 35.7695 16.1365 35.4133 15.7714ZM21.3333 7.02171L29.1733 15.0857H21.3333V7.02171ZM28.6667 43.8857H7.33333C6.44928 43.8857 5.60143 43.5245 4.97631 42.8815C4.35119 42.2385 4 41.3665 4 40.4571V7.54286C4 6.63354 4.35119 5.76147 4.97631 5.11849C5.60143 4.47551 6.44928 4.11429 7.33333 4.11429H17.3333V17.1429C17.3402 17.6862 17.5532 18.2054 17.9268 18.5896C18.3003 18.9739 18.805 19.1929 19.3333 19.2H32V40.4571C32 41.3665 31.6488 42.2385 31.0237 42.8815C30.3986 43.5245 29.5507 43.8857 28.6667 43.8857Z" fill="#9A9A9A" />
                        </svg>
                        <div className="text-sm text-[#535352]">
                            <span>Drag and drop a file, or </span>
                            <span className="font-medium text-[#1E88E5] underline underline-offset-4 cursor-pointer">
                                upload from device
                            </span>
                        </div>
                    </div>
                )}
                {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
            </div>
        </div>
    );
};

export default DrawerFileUpload;
