import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { cn } from '../../lib/utils/cn';
import type { Resource } from './types';
import Tooltip from '../ui/Tooltip';
import CustomToast from '../common/CustomToast';
import type { AudienceSelection } from '../common/AudienceDropdown';

import DeleteFileModal from './DeleteFileModal';
import CommonDrawer from '../common/drawer/CommonDrawer';
import DrawerHeader from '../common/drawer/DrawerHeader';
import DrawerContent from '../common/drawer/DrawerContent';
import DrawerFooter from '../common/drawer/DrawerFooter';
import DrawerInput from '../common/drawer/inputs/DrawerInput';
import { resourceService } from '../../services/resourceService';
import type { ResourceItem, CategoryItem } from '../../types/resource';
import DrawerTextarea from '../common/drawer/inputs/DrawerTextarea';
import DrawerCategorySelect from '../common/drawer/inputs/DrawerCategorySelect';
import DrawerAudienceSelect from '../common/drawer/inputs/DrawerAudienceSelect';
import DrawerFileUpload from '../common/drawer/inputs/DrawerFileUpload';
import DrawerAttachments, { type AttachmentItem, type AttachmentOption } from '../common/drawer/inputs/DrawerAttachments';

// Extended Resource interface for drawer
interface ExtendedResource extends Resource {
    description?: string;
    audience?: Array<{ id: string; name: string; avatar?: string; iconUrl?: string }>;
    fileUrl?: string;
}

// Attachment type is now imported from DrawerAttachments

interface ResourceDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    resource?: Resource | null; // If null, it's add mode; if provided, it's info/edit mode
    mode?: 'info' | 'edit'; // Only used when resource is provided
    isNewFolder?: boolean; // If true, drawer is in new folder creation mode
    onEdit?: (resource: Resource) => void;
    onDownload?: (resource: Resource) => Promise<void> | void;
    onDelete?: (resource: Resource) => Promise<void> | void;
    onSave?: (resource: ExtendedResource) => Promise<void> | void;
    onSubmit?: (data: {
        title: string;
        category: string;
        audience: Array<{ id: string; name: string; avatar?: string; iconUrl?: string }>;
        description: string;
        file?: File;
        attachments?: File[];
        links?: Array<{ id: string; displayText: string; url: string }>;
    }) => Promise<void> | void;
    onNewFolder?: (data: {
        folderName: string;
        category: string;
        audience: Array<{ id: string; name: string; avatar?: string; iconUrl?: string }>;
        description: string;
        file?: File;
        attachments?: File[];
        links?: Array<{ id: string; displayText: string; url: string }>;
    }) => Promise<void> | void;
    onCategoryAdded?: (category: CategoryItem) => void;
    availableUsers?: Array<{ id: string; name: string; avatar?: string; position?: string }>;
    projectGroups?: Array<{ id: string; name: string; avatar?: string; iconUrl?: string; memberCount?: number; members?: any[] }>;
    categories?: Array<{ id: string; name: string; code?: string }>;
    preFetchedDetails?: ResourceItem | null;
    attachmentOptions?: AttachmentOption[];
    isSaving?: boolean;
}

const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const minutesStr = minutes.toString().padStart(2, '0');
    return `${day} ${month}, ${hour12}:${minutesStr} ${ampm}`;
};

const EMPTY_USERS: any[] = [];
const EMPTY_CATEGORIES: any[] = [];
const EMPTY_PROJECT_GROUPS: any[] = [];

const ResourceDrawer: React.FC<ResourceDrawerProps> = ({
    isOpen,
    onClose,
    resource,
    mode: initialMode = 'info',
    isNewFolder = false,
    onDownload,
    onDelete,
    onSave,
    onSubmit,
    onNewFolder,
    onCategoryAdded,
    availableUsers = EMPTY_USERS,
    projectGroups = EMPTY_PROJECT_GROUPS,
    categories: initialCategories = EMPTY_CATEGORIES,
    preFetchedDetails = null,
    attachmentOptions,
    isSaving = false,
}) => {
    const isAddMode = !resource;
    const [mode, setMode] = useState<'info' | 'edit'>(initialMode);
    const [title, setTitle] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedAudience, setSelectedAudience] = useState<AudienceSelection>({
        allStaff: false,
        individualIds: [],
        groupIds: [],
    });
    const [description, setDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isFileRemoved, setIsFileRemoved] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [fetchedResource, setFetchedResource] = useState<ResourceItem | null>(null);
    const [toastMessage, setToastMessage] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null);
    const [errors, setErrors] = useState<{ title?: string; category?: string; audience?: string; file?: string }>({});

    const categories = useMemo(() => {
        return initialCategories.map((cat) => ({ id: cat.id, name: cat.name, code: cat.code }));
    }, [initialCategories]);

    // individualUsers and projectGroups will use props now
    const individualUsers = availableUsers;

    // Transform AudienceSelection to the format expected by callbacks
    const transformAudienceForCallback = useCallback(
        (selection: AudienceSelection): Array<{ id: string; name: string; avatar?: string; iconUrl?: string }> => {
            const result: Array<{ id: string; name: string; avatar?: string; iconUrl?: string }> = [];

            if (selection.allStaff) {
                result.push({ id: 'all-staff', name: 'All Staff' });
            }

            selection.individualIds.forEach((id) => {
                const user = availableUsers.find((u) => u.id === id);
                if (user) {
                    result.push({ id: user.id, name: user.name, avatar: user.avatar });
                }
            });

            // Note: Groups would be handled here if projectGroups were available
            selection.groupIds.forEach((id) => {
                const group = projectGroups.find((g) => g.id === id);
                if (group) {
                    result.push({ id: group.id, name: group.name, iconUrl: group.iconUrl, avatar: group.avatar });
                }
            });

            return result;
        },
        [availableUsers, projectGroups]
    );

    // Transform the old format to AudienceSelection
    const transformToAudienceSelection = useCallback(
        (audienceArray: Array<{ id: string; name: string; avatar?: string; iconUrl?: string }>): AudienceSelection => {
            const selection: AudienceSelection = {
                allStaff: false,
                individualIds: [],
                groupIds: [],
            };

            audienceArray.forEach((item) => {
                if (item.id === 'all-staff') {
                    selection.allStaff = true;
                } else if (availableUsers.some((u) => u.id === item.id)) {
                    selection.individualIds.push(item.id);
                } else if (projectGroups.some((g) => g.id === item.id)) {
                    selection.groupIds.push(item.id);
                }
            });

            return selection;
        },
        [availableUsers, projectGroups]
    );

    // Track when drawer opens to avoid resetting on prop changes
    const prevIsOpenRef = useRef(false);

    // Initialize form data when resource changes or drawer opens
    useEffect(() => {
        const justOpened = isOpen && !prevIsOpenRef.current;
        prevIsOpenRef.current = isOpen;

        let isMounted = true;
        if (isOpen) {
            if (resource) {
                // Initialize with prop data for immediate UI feedback
                setTitle(resource.title);
                const categoryCode = initialCategories.find((cat) => cat.name === resource.category)?.id || '';
                setSelectedCategory(categoryCode);
                const audienceData = resource.audience && resource.audience.length > 0
                    ? resource.audience
                    : (resource.uploadedBy ? [resource.uploadedBy] : []);
                setSelectedAudience(transformToAudienceSelection(audienceData));
                setDescription(resource.description || '');
                setMode(initialMode);
                setIsFileRemoved(false);
                setFetchedResource(preFetchedDetails || null);

                const mapFetchedData = (data: ResourceItem) => {
                    setTitle(data.title);

                    // Match category id or code
                    const categoryCodeStr = data.categoryId.toString(); // API might still return ID as categoryId field, but we want to match it against our codes
                    const categoryMatch = categories.find(c => c.code === categoryCodeStr || c.id === categoryCodeStr);
                    setSelectedCategory(categoryMatch ? categoryMatch.id : categoryCodeStr);

                    setDescription(data.description || '');

                    let newAudience = { allStaff: true, individualIds: [] as string[], groupIds: [] as string[] };
                    if (data.audience) {
                        const isAllStaff = data.audience.audienceType === 1 && (!data.audience.userIds?.length && !data.audience.groupIds?.length);
                        newAudience = {
                            allStaff: isAllStaff,
                            individualIds: (data.audience.userIds || []).map(String),
                            groupIds: (data.audience.groupIds || []).map(String)
                        };
                    }
                    setSelectedAudience(newAudience);

                    if (data.attachments && data.attachments.length > 0) {
                        const mappedAttachments: AttachmentItem[] = data.attachments.map(att => ({
                            id: att.id || att.attachmentId?.toString() || Date.now().toString(),
                            type: att.url ? 'link' : 'file',
                            title: att.displayText || att.fileName || att.title || 'Attachment',
                            url: att.url || '',
                            size: att.fileSize ? `${(att.fileSize / 1024).toFixed(2)} KB` : undefined
                        }));
                        setAttachments(mappedAttachments);
                    } else {
                        setAttachments([]);
                    }
                };

                if (preFetchedDetails) {
                    mapFetchedData(preFetchedDetails);
                } else {
                    // Fetch full resource details from GetSingle API
                    setIsLoadingDetails(true);
                    resourceService.getSingleResource(parseInt(resource.id, 10))
                        .then(res => {
                            if (isMounted && res.success && res.result) {
                                const data = res.result;
                                setFetchedResource(data);
                                mapFetchedData(data);
                            }
                        })
                        .catch(err => console.error("Failed to fetch single resource", err))
                        .finally(() => {
                            if (isMounted) setIsLoadingDetails(false);
                        });
                }
            } else if (justOpened) {
                // Reset for add mode ONLY when first opening
                setTitle('');
                setSelectedCategory('');
                // Set default audience to "All Staff" for both new folder and upload file modes
                setSelectedAudience({ allStaff: true, individualIds: [], groupIds: [] });
                setDescription('');
                setSelectedFile(null);
                setAttachments([]);
                setIsFileRemoved(false);
                setFetchedResource(null);
                setErrors({});
            }
        }

        return () => {
            isMounted = false;
        };
    }, [resource, initialMode, isOpen, isNewFolder, transformToAudienceSelection, initialCategories, categories]);

    // Reset form when drawer closes
    useEffect(() => {
        if (!isOpen) {
            setIsDeleteModalOpen(false);
            setErrors({});
        }
    }, [isOpen]);

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
    };

    const handleFileRemove = () => {
        setSelectedFile(null);
        setIsFileRemoved(true);
    };

    const handleAttachmentsChange = (newAttachments: AttachmentItem[]) => {
        setAttachments(newAttachments);
    };



    const handleSave = async () => {
        if (onSave && resource) {
            const newErrors: { title?: string; category?: string; audience?: string; file?: string } = {};
            const audienceArray = transformAudienceForCallback(selectedAudience);

            if (!title.trim()) newErrors.title = 'Title is required';
            if (!selectedCategory || selectedCategory === '') newErrors.category = 'Category is required';
            if (audienceArray.length === 0) newErrors.audience = 'Audience is required';

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }
            setErrors({});

            const updatedResource: ExtendedResource = {
                ...resource,
                title,
                category: selectedCategory,
                audience: audienceArray,
                description,
            };
            try {
                await onSave(updatedResource);
                setToastMessage({ title: 'Success', message: 'Resource successfully updated.', type: 'success' });
                // Delay mode change slightly to let user see success
                setTimeout(() => setMode('info'), 1500);
            } catch (e: any) {
                setToastMessage({ title: 'Error', message: e.message || 'An error occurred while saving.', type: 'error' });
            }
        }
    };

    const handleSubmit = async () => {
        const newErrors: { title?: string; category?: string; audience?: string; file?: string } = {};
        const audienceArray = transformAudienceForCallback(selectedAudience);

        if (!title.trim()) newErrors.title = 'Title is required';
        if (!selectedCategory || selectedCategory === '') newErrors.category = 'Category is required';
        if (audienceArray.length === 0) newErrors.audience = 'Audience is required';

        if (!isNewFolder && !selectedFile && attachments.length === 0) {
            newErrors.file = 'File or attachments are required';
        }

        if (!isNewFolder && selectedFile && attachments.length > 0) {
            newErrors.file = 'Only one of File or Attachments is allowed';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});

        if (isNewFolder && onNewFolder) {
            try {
                await onNewFolder({
                    folderName: title.trim(),
                    category: selectedCategory,
                    audience: audienceArray,
                    description: description.trim(),
                });
                setToastMessage({ title: 'Success', message: 'Folder successfully created.', type: 'success' });
                setTimeout(() => onClose(), 1500);
            } catch (e: any) {
                setToastMessage({ title: 'Error', message: e.message || 'An error occurred while creating the folder.', type: 'error' });
            }
            return;
        }

        if (onSubmit) {
            // Separate file attachments and link attachments
            const fileAttachments = attachments
                .filter((att) => att.type === 'file')
                .map((att) => att.file)
                .filter((f): f is File => f !== undefined);

            const linkAttachments = attachments
                .filter((att) => att.type === 'link')
                .map(att => ({
                    id: att.id || Date.now().toString(),
                    displayText: att.title,
                    url: att.url || ''
                }));

            try {
                await onSubmit({
                    title: title.trim(),
                    category: selectedCategory,
                    audience: audienceArray,
                    description: description.trim(),
                    file: selectedFile || undefined,
                    attachments: fileAttachments.length > 0 ? fileAttachments : undefined,
                    links: linkAttachments.length > 0 ? linkAttachments : undefined,
                });
                setToastMessage({ title: 'Success', message: 'Resource uploaded successfully.', type: 'success' });
                setTimeout(() => onClose(), 1500);
            } catch (e: any) {
                setToastMessage({ title: 'Error', message: e.message || 'An error occurred while uploading.', type: 'error' });
            }
        }
    };

    const handleCancel = () => {
        if (resource) {
            // If drawer was opened directly in edit mode, close it on cancel
            if (initialMode === 'edit') {
                onClose();
                return;
            }

            // Reset form to original resource values
            setTitle(resource.title);
            // Find category code that matches the resource's category name
            const categoryCode = initialCategories.find((cat) => cat.name === resource.category)?.id || '';
            setSelectedCategory(categoryCode);
            // Use resource.audience if available, otherwise fall back to uploadedBy for backward compatibility
            const audienceData = resource.audience && resource.audience.length > 0
                ? resource.audience
                : (resource.uploadedBy ? [resource.uploadedBy] : []);
            setSelectedAudience(
                transformToAudienceSelection(audienceData)
            );
            setDescription(resource.description || '');
            setSelectedFile(null);
            setIsFileRemoved(false);
            setErrors({});
            // Return to info mode if we came from info mode
            setMode('info');
        } else {
            onClose();
        }
    };

    const handleAddCategory = async (categoryName: string, iconFile?: File) => {
        const trimmedName = categoryName.trim();
        if (!trimmedName) {
            return false;
        }

        try {
            const formData = new FormData();
            formData.append('CategoryName', trimmedName);
            if (iconFile) {
                formData.append('IconFile', iconFile);
            }

            const response = await resourceService.addCategory(formData);

            if (response.success && response.result) {
                const newCat = response.result;
                const newCategoryId = newCat.categoryId?.toString() || newCat.categoryName;

                setSelectedCategory(newCategoryId);
                setShowSuccessToast(true);

                if (onCategoryAdded) {
                    onCategoryAdded({
                        id: newCat.categoryId,
                        code: newCat.categoryId,
                        name: newCat.categoryName,
                        colourCode: newCat.colourCode || ''
                    });
                }
                return true;
            }
            return false;
        } catch (error: any) {
            console.error('Failed to add category:', error);
            setToastMessage({ title: 'Error', message: error.message || 'Failed to add category', type: 'error' });
            return false;
        }
    };

    const handleAudienceChange = (selection: AudienceSelection) => {
        setSelectedAudience(selection);
    };





    const isEditMode = !isAddMode && mode === 'edit';
    const isInfoMode = !isAddMode && mode === 'info';

    // Determine header title
    const getHeaderTitle = () => {
        if (isNewFolder) return 'New Folder';
        if (isAddMode) return 'Upload File';
        if (isEditMode) return 'Edit File';
        return 'File Information';
    };

    // Check if fields should be editable
    const isEditable = isAddMode || isEditMode;

    const drawerFooter = (isAddMode || isEditMode) ? (
        <DrawerFooter>
            <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="border border-[#CACACA] rounded-full py-[10px] text-[14px] font-semibold text-black hover:bg-[#F3F4F6] cursor-pointer transition w-[130px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Cancel
            </button>
            <button
                type="button"
                onClick={isAddMode ? handleSubmit : handleSave}
                disabled={isSaving}
                className={cn("bg-[#DE4A2C] rounded-full h-[40px] text-[14px] font-semibold text-white hover:bg-[#C62828] cursor-pointer transition w-[130px] flex items-center justify-center", isSaving && "opacity-70 cursor-not-allowed")}
            >
                {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
                ) : (
                    isNewFolder ? 'Create Folder' : isAddMode ? 'Upload' : 'Save'
                )}
            </button>
        </DrawerFooter>
    ) : null;

    return (
        <>
            <CommonDrawer isOpen={isOpen} onClose={onClose}>
                <DrawerHeader title={getHeaderTitle()} onClose={onClose} />
                <DrawerContent footer={drawerFooter}>

                    {/* Uploaded By and Action Buttons - Only show in info/edit mode */}
                    {!isAddMode && resource && (
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-[10px]">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM8 2C11.3137 2 14 4.68629 14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2ZM8 4C6.89543 4 6 4.89543 6 6C6 7.10457 6.89543 8 8 8C9.10457 8 10 7.10457 10 6C10 4.89543 9.10457 4 8 4ZM8 10C6.89543 10 6 10.8954 6 12C6 13.1046 6.89543 14 8 14C9.10457 14 10 13.1046 10 12C10 10.8954 9.10457 10 8 10Z"
                                        fill="#535352"
                                    />
                                </svg>
                                <span className="text-[14px] font-normal text-black">
                                    Uploaded by: {resource.uploadedBy.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                {(isInfoMode || isEditMode) && (
                                    <Tooltip content="Download File" side="bottom">
                                        <button
                                            type="button"
                                            disabled={isDownloading}
                                            onClick={async () => {
                                                if (!onDownload) return;
                                                setIsDownloading(true);
                                                try {
                                                    await onDownload(resource);
                                                } finally {
                                                    setIsDownloading(false);
                                                }
                                            }}
                                            className={cn(
                                                "cursor-pointer w-[27.676px] h-[27.676px] flex items-center justify-center rounded-full transition",
                                                isDownloading ? "bg-gray-400 cursor-not-allowed text-white" : "bg-black text-white"
                                            )}
                                            aria-label="Download"
                                        >
                                            {isDownloading ? (
                                                <div className="w-[14px] h-[14px] border-2 border-white border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
                                            ) : (
                                                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <circle cx="13.8378" cy="13.8378" r="13.8378" fill="#232725" />
                                                    <path d="M19.25 16.625V19.25H8.75V16.625H7V19.25C7 20.2125 7.7875 21 8.75 21H19.25C20.2125 21 21 20.2125 21 19.25V16.625H19.25Z" fill="white" />
                                                    <path d="M10.8587 11.8913L9.625 13.125L14 17.5L18.375 13.125L17.1413 11.8913L14.875 14.1488V7H13.125V14.1488L10.8587 11.8913Z" fill="white" />
                                                </svg>
                                            )}
                                        </button>
                                    </Tooltip>
                                )}
                                {isInfoMode && (
                                    <Tooltip content="Edit File" side="bottom">
                                        <button
                                            type="button"
                                            onClick={() => setMode('edit')}
                                            className={cn(
                                                "cursor-pointer w-[27.676px] h-[27.676px] flex items-center justify-center rounded-full bg-[#1E88E5] text-white transition",
                                            )}
                                            aria-label="Edit"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
                                                <circle cx="13.8378" cy="13.8378" r="13.8378" fill="#1E88E5" />
                                                <path fillRule="evenodd" clipRule="evenodd" d="M6.125 10.4462C6.125 9.48143 6.50824 8.5562 7.19042 7.87402C7.8726 7.19184 8.79784 6.80859 9.76258 6.80859H13.6144C13.813 6.80859 14.0035 6.8875 14.1439 7.02795C14.2844 7.1684 14.3633 7.3589 14.3633 7.55753C14.3633 7.75616 14.2844 7.94666 14.1439 8.08711C14.0035 8.22756 13.813 8.30647 13.6144 8.30647H9.76258C9.1951 8.30647 8.65085 8.5319 8.24958 8.93317C7.84831 9.33445 7.62287 9.87869 7.62287 10.4462V18.1497C7.62287 18.7172 7.84831 19.2615 8.24958 19.6627C8.65085 20.064 9.1951 20.2894 9.76258 20.2894H17.4661C18.0336 20.2894 18.5779 20.064 18.9791 19.6627C19.3804 19.2615 19.6059 18.7172 19.6059 18.1497V14.298C19.6059 14.0993 19.6848 13.9088 19.8252 13.7684C19.9657 13.6279 20.1562 13.549 20.3548 13.549C20.5534 13.549 20.7439 13.6279 20.8844 13.7684C21.0248 13.9088 21.1037 14.0993 21.1037 14.298V18.1497C21.1037 19.1145 20.7205 20.0397 20.0383 20.7219C19.3561 21.4041 18.4309 21.7873 17.4661 21.7873H9.76258C8.79784 21.7873 7.8726 21.4041 7.19042 20.7219C6.50824 20.0397 6.125 19.1145 6.125 18.1497V10.4462Z" fill="white" />
                                                <path fillRule="evenodd" clipRule="evenodd" d="M15.9607 15.2095L14.3093 16.2056L13.5356 14.9227L15.187 13.9266L15.1893 13.9251C15.2526 13.887 15.3109 13.8412 15.363 13.7888L19.1152 10.0171C19.1528 9.97925 19.189 9.94003 19.2238 9.89956C19.4717 9.61047 19.8387 9.03828 19.3946 8.59191C19.0193 8.21445 18.4816 8.57094 18.1333 8.87726C18.0399 8.95961 17.95 9.04582 17.8637 9.13564L17.8383 9.16111L14.1385 12.8796C14.0507 12.9669 13.9818 13.0714 13.9363 13.1866L13.3192 14.7392C13.3075 14.7684 13.3053 14.8006 13.3129 14.8311C13.3205 14.8616 13.3375 14.889 13.3616 14.9093C13.3856 14.9296 13.4154 14.9418 13.4468 14.9442C13.4782 14.9466 13.5088 14.9391 13.5356 14.9227L14.3093 16.2056C12.9574 17.0204 11.3435 15.6514 11.9277 14.185L12.5455 12.6332C12.6658 12.3299 12.8468 12.0544 13.0773 11.8236L16.7763 8.10436L16.798 8.08264C16.9081 7.9703 17.2781 7.59134 17.7267 7.31872C17.9716 7.17118 18.3625 6.97571 18.8456 6.93826C19.3998 6.89408 19.9915 7.06858 20.4558 7.53517C20.8112 7.88626 21.0347 8.34914 21.0886 8.8458C21.1257 9.23292 21.0666 9.62321 20.9164 9.98194C20.6992 10.5189 20.3367 10.9136 20.1772 11.0731L16.425 14.8448C16.2852 14.9851 16.1304 15.1067 15.9607 15.2095ZM19.2957 9.8726C19.2957 9.8726 19.2927 9.87484 19.286 9.87709L19.2957 9.8726Z" fill="white" />
                                            </svg>
                                        </button>
                                    </Tooltip>
                                )}
                                {(isInfoMode || isEditMode) && (
                                    <Tooltip content="Delete File" side="bottom">
                                        <button
                                            type="button"
                                            onClick={() => setIsDeleteModalOpen(true)}
                                            className={cn(
                                                "cursor-pointer w-[27.676px] h-[27.676px] flex items-center justify-center rounded-full bg-[#D93025] text-white hover:bg-[#C62828] transition",
                                            )}
                                            aria-label="Delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
                                                <circle cx="13.8378" cy="13.8378" r="13.8378" fill="#D93025" />
                                                <path d="M10.6498 8.15668H10.4938C10.5796 8.15668 10.6498 8.08927 10.6498 8.00689V8.15668ZM10.6498 8.15668H16.5789V8.00689C16.5789 8.08927 16.6491 8.15668 16.7349 8.15668H16.5789V9.50476H17.9832V8.00689C17.9832 7.34596 17.4234 6.80859 16.7349 6.80859H10.4938C9.80532 6.80859 9.24557 7.34596 9.24557 8.00689V9.50476H10.6498V8.15668ZM20.4796 9.50476H6.74911C6.4039 9.50476 6.125 9.77251 6.125 10.1039V10.7031C6.125 10.7854 6.19521 10.8528 6.28103 10.8528H7.45904L7.94078 20.6452C7.97199 21.2837 8.52199 21.7873 9.18706 21.7873H18.0417C18.7087 21.7873 19.2567 21.2855 19.2879 20.6452L19.7697 10.8528H20.9477C21.0335 10.8528 21.1037 10.7854 21.1037 10.7031V10.1039C21.1037 9.77251 20.8248 9.50476 20.4796 9.50476ZM17.8915 20.4392H9.33723L8.86525 10.8528H18.3635L17.8915 20.4392Z" fill="white" />
                                            </svg>
                                        </button>
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Title Field */}
                    <DrawerInput
                        label={isNewFolder ? 'Folder Name' : 'Title'}
                        required={true}
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
                        }}
                        placeholder={isNewFolder ? "Add a clear, concise file title" : "Add a clear, concise file title"}
                        disabled={!isEditable}
                        error={errors.title}
                    />

                    {/* Category Field */}
                    <DrawerCategorySelect
                        label="Category"
                        required
                        categories={categories.filter((cat) => cat.id !== 'all')}
                        selectedCategory={selectedCategory}
                        onCategoryChange={(catId) => {
                            setSelectedCategory(catId);
                            if (errors.category) setErrors(prev => ({ ...prev, category: undefined }));
                        }}
                        onAddCategory={handleAddCategory}
                        placeholder={isAddMode ? 'Choose a relevant category' : 'Select category'}
                        disabled={!isEditable}
                        error={errors.category}
                    />

                    {/* Audience Field */}
                    <DrawerAudienceSelect
                        label="Audience"
                        required
                        individualUsers={individualUsers}
                        projectGroups={projectGroups as any}
                        selectedAudience={selectedAudience}
                        onAudienceChange={(selection) => {
                            handleAudienceChange(selection);
                            if (errors.audience) setErrors(prev => ({ ...prev, audience: undefined }));
                        }}
                        placeholder="Select audience"
                        disabled={!isEditable}
                        error={errors.audience}
                    />

                    {/* Description Field */}
                    <DrawerTextarea
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Write the full update here..."
                        disabled={!isEditable}
                        rows={4}
                        className="resize-none min-h-[105px]"
                    />

                    {/* Upload File Section */}
                    {((isAddMode && !isNewFolder) || (isEditMode && isFileRemoved)) && (
                        <DrawerFileUpload
                            label="Upload File"
                            file={selectedFile}
                            onFileSelect={(file) => {
                                handleFileSelect(file);
                                if (errors.file) setErrors(prev => ({ ...prev, file: undefined }));
                            }}
                            onFileRemove={handleFileRemove}
                            disabled={attachments.length > 0}
                            error={errors.file}
                        />
                    )}

                    {/* Or Separator */}
                    {((isAddMode && !isNewFolder) || (isEditMode && isFileRemoved)) && (
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1" />
                            <div className="flex items-center justify-center w-[419px]">
                                <div className="px-4 text-[#535352] font-semibold text-[15px]">Or</div>
                            </div>
                        </div>
                    )}

                    {/* Attachments Section */}
                    {((isAddMode && !isNewFolder) || (isEditMode && isFileRemoved)) && (
                        <DrawerAttachments
                            label="Attachments"
                            attachments={attachments}
                            onAttachmentsChange={(newAttachments) => {
                                handleAttachmentsChange(newAttachments);
                                if (newAttachments.length > 0 && errors.file) {
                                    setErrors(prev => ({ ...prev, file: undefined }));
                                }
                            }}
                            options={attachmentOptions}
                            disabled={!!selectedFile}
                        />
                    )}


                    {/* Uploaded File Preview - Only show in info/edit mode when file is not removed */}
                    {
                        !isAddMode && resource && !isFileRemoved && (
                            <div className="flex items-start justify-between mb-6">
                                <label className="text-[15px] font-semibold text-black mt-2.5 block">
                                    Uploaded File
                                </label>
                                <div className="w-[399px]">
                                    <div className="relative border border-[#E6E6E6] rounded-[5px]">
                                        {resource.type === 'PNG' || resource.type === 'PDF' ? (
                                            <div className="relative py-4">
                                                {isEditMode && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsFileRemoved(true);
                                                            setSelectedFile(null);
                                                        }}
                                                        className="absolute top-[5px] right-[5px] flex items-center justify-center cursor-pointer z-5"
                                                        aria-label="Remove file"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
                                                            <mask id="mask0_1571_25277" style={{ maskType: 'luminance' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="22">
                                                                <path d="M11 21C16.523 21 21 16.523 21 11C21 5.477 16.523 1 11 1C5.477 1 1 5.477 1 11C1 16.523 5.477 21 11 21Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round" />
                                                                <path d="M13.8289 8.17188L8.17188 13.8289M8.17188 8.17188L13.8289 13.8289" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                                            </mask>
                                                            <g mask="url(#mask0_1571_25277)">
                                                                <path d="M-1 -1H23V23H-1V-1Z" fill="#232725" />
                                                            </g>
                                                        </svg>
                                                    </button>
                                                )}
                                                {resource.previewImage ? (
                                                    <div className="w-full max-h-[400px] overflow-auto">
                                                        <img
                                                            src={resource.previewImage}
                                                            alt={resource.title}
                                                            className="w-full h-auto rounded-[5px] object-contain"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center min-h-[200px]">
                                                        <div className="text-[15px] text-[#535352] text-center">
                                                            <div className="mb-2">File Preview</div>
                                                            <div className="text-sm text-[#999]">
                                                                {resource.title} ({resource.size})
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center min-h-[100px]">
                                                <div className="text-[15px] text-[#535352] text-center">
                                                    <div className="mb-2">File: {resource.title}</div>
                                                    <div className="text-sm text-[#999]">Type: {resource.type} | Size: {resource.size}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* File Information Grid - Only show in info/edit mode */}
                    {
                        !isAddMode && resource && (
                            <div className="mb-6 relative">
                                {isLoadingDetails && (
                                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-[5px]">
                                        <div className="w-5 h-5 border-2 border-[#1E88E5] border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                                <div className="flex items-center gap-4 justify-between rounded-[5px] border border-[#E6E6E6] p-[15px]">
                                    <div className="flex flex-col items-start gap-[15px]">
                                        <div className="text-[14px] leading-normal font-semibold text-black">Type</div>
                                        <div className="text-[15px] text-[#535352]">
                                            {fetchedResource?.fileTypeName || resource.type}
                                        </div>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="2" height="33" viewBox="0 0 2 33" fill="none">
                                        <path d="M1 1L1 32" stroke="#CACACA" stroke-width="2" stroke-linecap="round" />
                                    </svg>
                                    <div className="flex flex-col items-start gap-[15px]">
                                        <div className="text-[14px] leading-normal font-semibold text-black">Size</div>
                                        <div className="text-[15px] text-[#535352]">
                                            {fetchedResource && fetchedResource.fileSize > 0
                                                ? (fetchedResource.fileSize > 1024 * 1024
                                                    ? `${(fetchedResource.fileSize / (1024 * 1024)).toFixed(2)} MB`
                                                    : `${(fetchedResource.fileSize / 1024).toFixed(2)} KB`)
                                                : resource.size}
                                        </div>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="2" height="33" viewBox="0 0 2 33" fill="none">
                                        <path d="M1 1L1 32" stroke="#CACACA" stroke-width="2" stroke-linecap="round" />
                                    </svg>
                                    <div className="flex flex-col items-start gap-[15px]">
                                        <div className="text-[14px] leading-normal font-semibold text-black">Uploaded On</div>
                                        <div className="text-[15px] text-[#535352]">
                                            {fetchedResource ? formatDate(new Date(fetchedResource.createdOn)) : formatDate(resource.uploadedOn)}
                                        </div>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="2" height="33" viewBox="0 0 2 33" fill="none">
                                        <path d="M1 1L1 32" stroke="#CACACA" stroke-width="2" stroke-linecap="round" />
                                    </svg>
                                    <div className="flex flex-col items-start gap-[15px]">
                                        <div className="text-[14px] leading-normal font-semibold text-black">Last Modified On</div>
                                        <div className="text-[15px] text-[#535352]">
                                            {fetchedResource ? formatDate(new Date(fetchedResource.updatedOn)) : formatDate(resource.lastModifiedOn)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </DrawerContent>
            </CommonDrawer>

            {/* Category Success Toast */}
            <CustomToast
                title="Category Added"
                message="Your new category has been successfully created and added to the list."
                show={showSuccessToast}
                onClose={() => setShowSuccessToast(false)}
                iconType="check"
            />

            {/* General Action Toast */}
            {toastMessage && (
                <CustomToast
                    title={toastMessage.title}
                    message={toastMessage.message}
                    show={true}
                    onClose={() => setToastMessage(null)}
                    iconType={toastMessage.type === 'success' ? 'check' : 'error'}
                />
            )}

            {/* Delete File Modal */}
            {resource && (
                <DeleteFileModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={async () => {
                        if (onDelete) {
                            await onDelete(resource);
                        }
                        setIsDeleteModalOpen(false);
                        onClose();
                    }}
                    fileName={resource.title}
                />
            )}
        </>
    );
};

export default ResourceDrawer;




