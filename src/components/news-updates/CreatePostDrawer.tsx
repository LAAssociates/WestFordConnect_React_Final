import { X, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import CustomToast from '../common/CustomToast';
import AudienceDropdown, { type AudienceSelection, type IndividualUser, type ProjectGroup } from '../common/AudienceDropdown';
import { cn } from '../../lib/utils/cn';
import type { PostCategory } from './types';
import type { DraftData } from './DraftsDrawer';
import { newsService } from '../../services/newsService';
import type { CategoryMenuItem, NewsOption } from '../../types/news';
import AvatarPlaceholder from '../../assets/images/default-group-icon.png';
import { formatToDateTimeOffset } from '../../utils/dateUtils';
import CommonDrawer from '../common/drawer/CommonDrawer';
import DrawerDateTimePicker from '../common/drawer/inputs/DrawerDateTimePicker';
import DrawerSwitch from '../common/drawer/inputs/DrawerSwitch';
import DrawerCTAInput from '../common/drawer/inputs/DrawerCTAInput';
import type { CategoryOption } from '../common/CategoryDropdown';
import DrawerCategorySelect from '../common/drawer/inputs/DrawerCategorySelect';
import DrawerAttachments, { type AttachmentItem } from '../common/drawer/inputs/DrawerAttachments';

export type CreatePostDrawerProps = {
    open: boolean;
    onClose: () => void;
    onSubmit?: (postItem?: any) => void;
    onSaveDraft?: (postData: {
        title: string;
        content: string;
        category: PostCategory;
        audience: any;
        attachments?: any[];
        allowReactions: boolean;
        showOnDashboard: boolean;
        sendEmailNotification: boolean;
        ctaLabel?: string;
        ctaLink?: string;
        publishDate?: string;
    }, draftId?: string) => void;
    initialData?: DraftData | null;
    draftId?: string;
    onCategoryAdded?: (categories?: CategoryMenuItem[]) => void;
};



const defaultAttachmentOptions: NewsOption[] = [
    { code: 'CLOUD', description: 'Attach from Cloud' },
    { code: 'FILE', description: 'Upload File' },
    { code: 'LINK', description: 'Add Link' }
];


const CreatePostDrawer: React.FC<CreatePostDrawerProps> = ({ open, onClose, onSubmit, onSaveDraft, initialData, draftId }) => {
    const [title, setTitle] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
    const [content, setContent] = useState('');
    const [publishDate, setPublishDate] = useState('');
    const [ctaLabel, setCtaLabel] = useState('');
    const [ctaLink, setCtaLink] = useState('');
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
    const [allowReactions, setAllowReactions] = useState(false);
    const [showOnDashboard, setShowOnDashboard] = useState(true);
    const [sendEmailNotification, setSendEmailNotification] = useState(true);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [successToastTitle, setSuccessToastTitle] = useState('');
    const [successToastMessage, setSuccessToastMessage] = useState('');
    const [successToastIconType, setSuccessToastIconType] = useState<'check' | 'save'>('check');
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [errorToastTitle, setErrorToastTitle] = useState('');
    const [errorToastMessage, setErrorToastMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [individualUsers, setIndividualUsers] = useState<IndividualUser[]>([]);
    const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
    const [attachmentOptions, setAttachmentOptions] = useState<NewsOption[]>(defaultAttachmentOptions);
    const [ctaOptions, setCtaOptions] = useState<NewsOption[]>([]);
    const [audienceTypeOptions, setAudienceTypeOptions] = useState<NewsOption[]>([]);
    // bannerImage/ctaFile/ctaLinkFile are removed as per new requirement
    // only attachments are standard now using the attachments state below
    // Removed duplicate attachments declaration here

    // Audience selection state
    const [selectedAudience, setSelectedAudience] = useState<AudienceSelection>({
        allStaff: true,
        individualIds: [],
        groupIds: [],
    });

    useEffect(() => {
        if (!open) {
            // Reset form when drawer closes
            setTitle('');
            setContent('');
            setSelectedCategory(undefined);
            setPublishDate('');
            setCtaLabel('');
            setCtaLink('');
            setAttachments([]);
            setAllowReactions(false);
            setShowOnDashboard(true);
            setSendEmailNotification(true);
            setSelectedAudience({ allStaff: true, individualIds: [], groupIds: [] });
            setErrors({});
            // Don't reset toast state here - let it show after drawer closes
        } else {
            if (initialData) {
                // Populate form with draft data
                const { title, category, content, allowReactions, showOnDashboard, sendEmailNotification, attachments } = initialData;
                setTitle(title || '');
                setContent(content || '');
                setSelectedCategory(category);
                setAttachments(attachments?.map(a => ({
                    type: a.type?.toLowerCase() === 'link' ? 'link' : 'file',
                    title: a.title || '',
                    url: a.url,
                    id: String(Math.random())
                })) || []);
                setAllowReactions(allowReactions || false);
                setShowOnDashboard(showOnDashboard !== undefined ? showOnDashboard : true);
                setSendEmailNotification(sendEmailNotification !== undefined ? sendEmailNotification : true);

                // ctaLabel and ctaLink are still used for standard fields
                setCtaLabel(initialData.ctaLabel || '');
                setCtaLink(initialData.ctaLink || '');

                // Handle audience
                if (initialData.audience) {
                    setSelectedAudience({
                        allStaff: initialData.audience.allStaff !== undefined ? initialData.audience.allStaff : true,
                        individualIds: initialData.audience.individuals || [],
                        groupIds: initialData.audience.groups || [],
                    });
                } else {
                    setSelectedAudience({ allStaff: true, individualIds: [], groupIds: [] });
                }
            }

            if (draftId && !isNaN(Number(draftId))) {
                const fetchDetails = async () => {
                    setIsLoadingDetails(true);
                    try {
                        const response = await newsService.getSingleNews(Number(draftId));
                        if (response.success && response.result) {
                            const data = response.result;
                            setTitle(data.title || '');
                            setContent(data.description || '');
                            setSelectedCategory(data.categoryId ? String(data.categoryId) : undefined);
                            setPublishDate(data.publishDate || '');
                            setCtaLabel(data.cta || '');
                            setCtaLink(data.ctaLink || data.catLink || '');
                            setAllowReactions(data.allowReactions || false);
                            setShowOnDashboard(data.showOnDashboard !== undefined ? data.showOnDashboard : true);
                            setSendEmailNotification(data.sendAsEmail !== undefined ? data.sendAsEmail : true);

                            // Handle audience
                            if (data.audience) {
                                const isAll = data.audience.audienceType === 'ALL' || String(data.audience.audienceType) === '1';
                                setSelectedAudience({
                                    allStaff: isAll,
                                    individualIds: data.audience.userIds?.map(String) || [],
                                    groupIds: data.audience.groupIds?.map(String) || [],
                                });
                            }

                            if (data.attachments && data.attachments.length > 0) {
                                setAttachments(data.attachments.map((a: any) => ({
                                    type: a.type?.toLowerCase() === 'link' ? 'link' : 'file',
                                    title: a.displayText || a.fileName || '',
                                    url: a.url,
                                    id: String(Math.random())
                                })));
                            }
                        }
                    } catch (error) {
                        console.error('Failed to fetch draft details:', error);
                    } finally {
                        setIsLoadingDetails(false);
                    }
                };
                fetchDetails();
            }
        }
    }, [open, initialData]);

    // Fetch bootstrap data when drawer opens
    useEffect(() => {
        if (open) {
            const fetchBootstrapData = async () => {
                try {
                    const response = await newsService.getNewsBootstrap();
                    if (response.success && response.result) {
                        const { categories: apiCategories, individualUsers: apiUsers, groups: apiGroups, attachment, audienceType: apiAudienceTypes } = response.result;

                        // Map categories - if we have API categories, use them
                        if (apiCategories && apiCategories.length > 0) {
                            const mappedCategories: CategoryOption[] = apiCategories.map((c: any) => ({
                                id: String(c.code || c.id),
                                name: c.name,
                                code: String(c.code || c.id)
                            }));
                            setCategories(mappedCategories);
                        }

                        // Map individual users
                        const mappedUsers: IndividualUser[] = apiUsers.map(u => ({
                            id: String(u.id),
                            name: u.name,
                            position: u.designation,
                            avatar: u.profileImageUrl || AvatarPlaceholder
                        }));
                        setIndividualUsers(mappedUsers);

                        // Map project groups
                        // Filter out project groups that match an individual user's name
                        const userNames = new Set(apiUsers.map(u => u.name));
                        const mappedGroups: ProjectGroup[] = apiGroups
                            .filter(g => !userNames.has(g.groupName))
                            .map(g => ({
                                id: g.groupId.toString(),
                                name: g.groupName,
                                iconUrl: g.iconUrl,
                                members: [],
                                memberCount: g.memberCount
                            }));
                        setProjectGroups(mappedGroups);

                        // Map options - use API response if available, otherwise keep defaults
                        if (attachment && attachment.length > 0) {
                            setAttachmentOptions(attachment);
                        }
                        if (response.result.cta && response.result.cta.length > 0) {
                            setCtaOptions(response.result.cta);
                        }
                        if (apiAudienceTypes && apiAudienceTypes.length > 0) {
                            setAudienceTypeOptions(apiAudienceTypes);
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch news bootstrap data:', error);
                } finally {
                    // Added to ensure bootstrap data is handled
                }
            };

            fetchBootstrapData();
        }
    }, [open]);

    const handleAddCategory = async (categoryName: string, iconFile?: File) => {
        try {
            const formData = new FormData();
            formData.append('CategoryName', categoryName);
            formData.append('CategoryType', 'NEWS'); // Default type for news
            formData.append('ColourCode', '#DE4A2C'); // Default color or from a picker if we had one
            if (iconFile) {
                formData.append('IconFile', iconFile);
            }

            const response = await newsService.addCategory(formData);
            if (response.success) {
                // Refresh categories from bootstrap to get the new one with its proper ID/code
                const bootstrap = await newsService.getNewsBootstrap(undefined, true);
                if (bootstrap.success && bootstrap.result.categories) {
                    const mappedCategories: CategoryOption[] = bootstrap.result.categories.map((c: any) => ({
                        id: String(c.code || c.id),
                        name: c.name,
                        code: String(c.code || c.id)
                    }));
                    setCategories(mappedCategories);

                    // Find the newly added category to select it
                    // The API response might contain the new category info
                    const newCat = bootstrap.result.categories.find((c: any) => c.name === categoryName);
                    if (newCat) {
                        setSelectedCategory(String(newCat.code || newCat.id));
                    }
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to add category:', error);
            return false;
        }
    };







    const formatDateTimeForInput = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handleSubmit = async () => {
        const newErrors: Record<string, string> = {};

        // Validation
        if (!title.trim()) {
            newErrors.title = 'Please enter a title for the post.';
        }
        if (!selectedCategory) {
            newErrors.category = 'Please select a category for the post.';
        }
        if (!content.trim()) {
            newErrors.content = 'Please enter the content for the post.';
        }

        // Audience Validation
        if (!selectedAudience.allStaff && selectedAudience.individualIds.length === 0 && selectedAudience.groupIds.length === 0) {
            newErrors.audience = 'Please select at least one user or group for the specific audience.';
        }

        // CTA Validation
        if (ctaLabel.trim() && !ctaLink.trim()) {
            newErrors.cta = 'Please provide a link for the CTA button.';
        }
        if (!ctaLabel.trim() && ctaLink.trim()) {
            newErrors.cta = 'Please provide a label for the CTA link.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsSubmitting(true);
        try {
            const formData = new FormData();

            // newsId for updating existing draft if publishing
            if (draftId) {
                formData.append('newsId', String(Number(draftId)));
            }

            // Basic fields
            formData.append('Title', title.trim());
            formData.append('Description', content.trim());

            // Category
            let categoryLabel = '';
            let categoryId = 0;

            if (selectedCategory) {
                const foundCategory = categories.find(c => c.id === selectedCategory);
                if (foundCategory) {
                    categoryLabel = foundCategory.name;
                    categoryId = Number(foundCategory.id);
                }
            }

            formData.append('Category', categoryLabel);
            formData.append('CategoryId', String(categoryId));

            // Publish date
            const publishDateValue = publishDate || formatDateTimeForInput(new Date());
            formData.append('PublishDate', formatToDateTimeOffset(new Date(publishDateValue)));

            // Audience mapping based on API codes (1=All, 2=Users, 3=Groups)
            let audienceType = '1'; // Default: All
            if (!selectedAudience.allStaff) {
                if (selectedAudience.individualIds.length > 0) {
                    const userType = audienceTypeOptions.find(t => t.description.toLowerCase().includes('individual') || String(t.code) === '2');
                    audienceType = userType ? String(userType.code) : '2';
                } else if (selectedAudience.groupIds.length > 0) {
                    const groupType = audienceTypeOptions.find(t => t.description.toLowerCase().includes('group') || String(t.code) === '3');
                    audienceType = groupType ? String(groupType.code) : '3';
                }
            } else {
                const allType = audienceTypeOptions.find(t => t.description.toLowerCase() === 'all' || String(t.code) === '1');
                audienceType = allType ? String(allType.code) : '1';
            }
            formData.append('Audience.AudienceType', audienceType);

            if (!selectedAudience.allStaff) {
                selectedAudience.individualIds.forEach((id, index) => {
                    formData.append(`Audience.UserIds[${index}]`, id);
                });
                selectedAudience.groupIds.forEach((id, index) => {
                    formData.append(`Audience.GroupIds[${index}]`, id);
                });
            }

            // CTA fields
            if (ctaLabel.trim()) {
                formData.append('CTA', ctaLabel.trim());
            }
            if (ctaLink.trim()) {
                formData.append('CTALink', ctaLink.trim());
            }

            // Status
            formData.append('Status', 'P');

            // Boolean flags
            formData.append('IsPinned', String(showOnDashboard));
            formData.append('AllowReactions', String(allowReactions));
            formData.append('SendAsEmail', String(sendEmailNotification));
            formData.append('ShowOnDashboard', String(showOnDashboard));

            // Attachments
            attachments.forEach((attachment, index) => {
                formData.append(`Attachments[${index}].Type`, attachment.type.toUpperCase());
                formData.append(`Attachments[${index}].DisplayText`, attachment.title);
                if (attachment.type === 'link' && attachment.url) {
                    formData.append(`Attachments[${index}].Url`, attachment.url);
                } else if (attachment.file) {
                    formData.append(`Attachments[${index}].FileName`, attachment.file.name);
                    formData.append('attachmentFiles', attachment.file);
                }
            });

            // Call API
            const response = await newsService.saveUploadNews(formData);

            if (response.success) {
                // Reset form
                setTitle('');
                setContent('');
                setSelectedCategory(undefined);
                setPublishDate('');
                setCtaLabel('');
                setCtaLink('');
                setCtaLabel('');
                setCtaLink('');
                setAttachments([]);
                setAllowReactions(false);
                setShowOnDashboard(true);
                setSendEmailNotification(true);
                setSelectedAudience({ allStaff: true, individualIds: [], groupIds: [] });
                onClose();

                // Show success toast after drawer closes
                setTimeout(() => {
                    setSuccessToastTitle('Post Published');
                    setSuccessToastMessage('Your announcement is now live and visible to the selected audience.');
                    setSuccessToastIconType('check');
                    setShowSuccessToast(true);
                }, 100);

                // Call onSubmit callback if provided (for parent component to refresh data)
                if (response.result && response.result.items && response.result.items.length > 0) {
                    onSubmit?.(response.result.items[0]);
                } else {
                    onSubmit?.();
                }
            }
        } catch (error) {
            console.error('Failed to publish post:', error);
            setErrorToastTitle('Publish Error');
            setErrorToastMessage('Failed to publish post. Please check your connection and try again.');
            setShowErrorToast(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveDraft = async () => {
        const newErrors: Record<string, string> = {};

        if (!selectedCategory) {
            newErrors.category = 'Please select a category before saving a draft.';
        }

        if (!title.trim()) {
            newErrors.title = 'Please enter at least a title before saving a draft.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsSubmitting(true);
        try {
            const formData = new FormData();

            // newsId for updating existing draft
            if (draftId) {
                formData.append('newsId', String(Number(draftId)));
            }

            // Basic fields
            formData.append('Title', title.trim());
            formData.append('Description', content.trim());

            // Category
            let categoryLabel = '';
            let categoryId = 0;

            if (selectedCategory) {
                const foundCategory = categories.find(c => c.id === selectedCategory);
                if (foundCategory) {
                    categoryLabel = foundCategory.name;
                    categoryId = Number(foundCategory.id);
                }
            }

            formData.append('Category', categoryLabel);
            formData.append('CategoryId', String(categoryId));

            // Publish date
            const publishDateValue = publishDate || formatDateTimeForInput(new Date());
            formData.append('PublishDate', formatToDateTimeOffset(new Date(publishDateValue)));

            // Audience mapping based on API codes (1=All, 2=Users, 3=Groups)
            let audienceType = '1'; // Default: All
            if (!selectedAudience.allStaff) {
                if (selectedAudience.individualIds.length > 0) {
                    const userType = audienceTypeOptions.find(t => t.description.toLowerCase().includes('individual') || String(t.code) === '2');
                    audienceType = userType ? String(userType.code) : '2';
                } else if (selectedAudience.groupIds.length > 0) {
                    const groupType = audienceTypeOptions.find(t => t.description.toLowerCase().includes('group') || String(t.code) === '3');
                    audienceType = groupType ? String(groupType.code) : '3';
                }
            } else {
                const allType = audienceTypeOptions.find(t => t.description.toLowerCase() === 'all' || String(t.code) === '1');
                audienceType = allType ? String(allType.code) : '1';
            }
            formData.append('Audience.AudienceType', audienceType);

            if (!selectedAudience.allStaff) {
                selectedAudience.individualIds.forEach((id, index) => {
                    formData.append(`Audience.UserIds[${index}]`, id);
                });
                selectedAudience.groupIds.forEach((id, index) => {
                    formData.append(`Audience.GroupIds[${index}]`, id);
                });
            }

            // CTA fields
            if (ctaLabel.trim()) {
                formData.append('CTA', ctaLabel.trim());
            }
            if (ctaLink.trim()) {
                formData.append('CTALink', ctaLink.trim());
            }

            // Status - DRAFTED for save draft
            formData.append('Status', 'D');

            // Boolean flags
            formData.append('IsPinned', String(showOnDashboard));
            formData.append('AllowReactions', String(allowReactions));
            formData.append('SendAsEmail', String(sendEmailNotification));
            formData.append('ShowOnDashboard', String(showOnDashboard));

            // Attachments
            attachments.forEach((attachment, index) => {
                formData.append(`Attachments[${index}].Type`, attachment.type.toUpperCase());
                formData.append(`Attachments[${index}].DisplayText`, attachment.title);
                if (attachment.type === 'link' && attachment.url) {
                    formData.append(`Attachments[${index}].Url`, attachment.url);
                } else if (attachment.file) {
                    formData.append(`Attachments[${index}].FileName`, attachment.file.name);
                    formData.append('attachmentFiles', attachment.file);
                }
            });

            // Call API
            const response = await newsService.saveUploadNews(formData);

            if (response.success) {
                onClose();

                // Show success toast after drawer closes
                setTimeout(() => {
                    setSuccessToastTitle('Draft Saved');
                    setSuccessToastMessage('Your progress has been saved. You can continue editing anytime.');
                    setSuccessToastIconType('save');
                    setShowSuccessToast(true);
                }, 100);

                // Call onSaveDraft callback if provided
                onSaveDraft?.({
                    title: title.trim(),
                    category: selectedCategory as PostCategory,
                    content: content.trim(),
                    publishDate: publishDateValue || undefined,
                    ctaLabel: ctaLabel.trim() || undefined,
                    ctaLink: ctaLink.trim() || undefined,
                    attachments: attachments.length > 0 ? attachments : undefined,
                    allowReactions,
                    showOnDashboard,
                    sendEmailNotification,
                    audience: {
                        allStaff: selectedAudience.allStaff,
                        individuals: selectedAudience.individualIds.length > 0 ? selectedAudience.individualIds : undefined,
                        groups: selectedAudience.groupIds.length > 0 ? selectedAudience.groupIds : undefined,
                    },
                }, draftId);
            }
        } catch (error) {
            console.error('Failed to save draft:', error);
            alert('Failed to save draft. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeDrawer = () => {
        onClose();
    };

    return (
        <>
            {/* Success Toast - Render outside drawer so it shows even when drawer is closed */}
            <CustomToast
                show={showSuccessToast}
                title={successToastTitle}
                message={successToastMessage}
                onClose={() => setShowSuccessToast(false)}
                iconType={successToastIconType}
                type="success"
            />

            <CustomToast
                show={showErrorToast}
                title={errorToastTitle}
                message={errorToastMessage}
                onClose={() => setShowErrorToast(false)}
                type="error"
            />

            <CommonDrawer
                isOpen={open}
                onClose={closeDrawer}
                width="max-w-[641px]"
            >
                <header className="px-[15px] py-6 flex items-center justify-between shrink-0 bg-[#1C2745]">
                    <div className="flex items-center gap-2.5">
                        <div className="border-2 border-[#DE4A2C] rounded-full h-5 w-px ml-[17px]"></div>
                        <h2 className="text-lg font-semibold text-white">Create Post</h2>
                    </div>
                    <button
                        type="button"
                        onClick={closeDrawer}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-white text-black hover:bg-[#F3F4F6] transition cursor-pointer"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" strokeWidth={3} />
                    </button>
                </header>

                <div className="relative flex-1 overflow-hidden bg-[#1C2745] px-[15px] pb-[15px]">
                    {isLoadingDetails && (
                        <div className="absolute inset-x-[15px] inset-y-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-[5px]">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-[#DE4A2C]" />
                                <p className="text-sm font-medium text-[#1C2745]">Loading post details...</p>
                            </div>
                        </div>
                    )}
                    <div className="flex-1 h-full overflow-y-auto px-[38px] py-9 bg-white rounded-[5px]">
                        {/* Audience */}
                        <div className="flex items-center justify-between mb-6">
                            <label className="text-[15px] font-semibold text-black">Audience</label>
                            <AudienceDropdown
                                individualUsers={individualUsers}
                                projectGroups={projectGroups}
                                selectedAudience={selectedAudience}
                                onAudienceChange={(selection) => {
                                    setSelectedAudience(selection);
                                    if (errors.audience) setErrors(prev => ({ ...prev, audience: '' }));
                                }}
                                placeholder="Select audience"
                                width="w-[419px]"
                                error={errors.audience}
                            />
                        </div>

                        {/* Category */}
                        <DrawerCategorySelect
                            label="Category"
                            required
                            categories={categories}
                            selectedCategory={selectedCategory}
                            onCategoryChange={(catId) => {
                                setSelectedCategory(catId);
                                if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
                            }}
                            onAddCategory={handleAddCategory}
                            placeholder="Select category (e.g. HR Update)"
                            error={errors.category}
                        />

                        {/* Publish Date */}
                        <DrawerDateTimePicker
                            label="Publish Date"
                            required
                            value={publishDate}
                            onChange={setPublishDate}
                        />

                        {/* Title */}
                        <div className="flex items-start justify-between mb-6">
                            <label className="text-[15px] font-semibold text-black mt-3">
                                Title<span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-col">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                                    }}
                                    placeholder="e.g. Important LMS Update"
                                    className={cn(
                                        "w-[419px] rounded-[5px] border border-[#E6E6E6] px-4 py-3 text-sm text-[#111827] placeholder:text-[#535352] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40",
                                        errors.title && "border-red-500"
                                    )}
                                />
                                {errors.title && <span className="text-red-500 text-sm mt-1">{errors.title}</span>}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="flex items-start justify-between mb-6">
                            <label className="text-[15px] font-semibold text-black mt-3">Description<span className="text-red-500">*</span></label>
                            <div className="flex flex-col">
                                <textarea
                                    rows={6}
                                    value={content}
                                    onChange={(e) => {
                                        setContent(e.target.value);
                                        if (errors.content) setErrors(prev => ({ ...prev, content: '' }));
                                    }}
                                    placeholder="Write the full update here..."
                                    className={cn(
                                        "w-[419px] rounded-[5px] border border-[#E6E6E6] px-4 py-3 text-sm text-[#111827] placeholder:text-[#535352] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 resize-none",
                                        errors.content && "border-red-500"
                                    )}
                                />
                                {errors.content && <span className="text-red-500 text-sm mt-1">{errors.content}</span>}
                            </div>
                        </div>

                        {/* Attachments */}
                        <DrawerAttachments
                            attachments={attachments}
                            onAttachmentsChange={setAttachments}
                            options={attachmentOptions.map(opt => ({
                                type: String(opt.code) === '3' || opt.code === 'LINK' ? 'link' : String(opt.code) === '1' || opt.code === 'CLOUD' ? 'cloud' : 'file',
                                label: opt.description
                            }))}
                        />

                        <DrawerCTAInput
                            ctaLabel={ctaLabel}
                            ctaLink={ctaLink}
                            onCtaLabelChange={(label) => {
                                setCtaLabel(label);
                                if (errors.cta) setErrors(prev => ({ ...prev, cta: '' }));
                            }}
                            onCtaLinkChange={(link) => {
                                setCtaLink(link);
                                if (errors.cta) setErrors(prev => ({ ...prev, cta: '' }));
                            }}
                            options={ctaOptions.map(opt => ({
                                type: String(opt.code) === '3' || opt.code === 'LINK' ? 'link' : String(opt.code) === '1' || opt.code === 'CLOUD' ? 'cloud' : 'file',
                                label: opt.description
                            }))}
                            error={errors.cta}
                        />

                        {/* Allow Reactions & Greeting Field */}
                        <div className="flex items-center justify-start gap-5 mb-6">
                            <DrawerSwitch
                                label="Allow Reactions & Greeting Field"
                                checked={allowReactions}
                                onChange={setAllowReactions}
                                id="allow-reactions"
                                hintText="Enables Celebrate, Clap, and Heart reactions along with a greeting text box on the post."
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M7.0005 0C8.85715 0 10.6378 0.737551 11.9506 2.0504C13.2634 3.36325 14.001 5.14385 14.001 7.0005C14.001 8.85715 13.2634 10.6378 11.9506 11.9506C10.6378 13.2634 8.85715 14.001 7.0005 14.001C5.14385 14.001 3.36325 13.2634 2.0504 11.9506C0.73755 10.6378 0 8.85715 0 7.0005C0 5.14385 0.73755 3.36325 2.0504 2.0504C3.36325 0.737551 5.14385 0 7.0005 0ZM8.0505 4.298C8.5705 4.298 8.9925 3.937 8.9925 3.402C8.9925 2.867 8.5695 2.506 8.0505 2.506C7.5305 2.506 7.1105 2.867 7.1105 3.402C7.1105 3.937 7.5305 4.298 8.0505 4.298ZM8.2335 9.925C8.2335 9.818 8.2705 9.54 8.2495 9.382L7.4275 10.328C7.2575 10.507 7.0445 10.631 6.9445 10.598C6.89913 10.5813 6.86121 10.549 6.83756 10.5068C6.81391 10.4646 6.80609 10.4154 6.8155 10.368L8.1855 6.04C8.2975 5.491 7.9895 4.99 7.3365 4.926C6.6475 4.926 5.6335 5.625 5.0165 6.512C5.0165 6.618 4.9965 6.882 5.0175 7.04L5.8385 6.093C6.0085 5.916 6.2065 5.791 6.3065 5.825C6.35577 5.84268 6.39614 5.87898 6.41895 5.92609C6.44176 5.97321 6.44519 6.02739 6.4285 6.077L5.0705 10.384C4.9135 10.888 5.2105 11.382 5.9305 11.494C6.9905 11.494 7.6165 10.812 8.2345 9.925H8.2335Z" fill="#1E88E5" />
                                    </svg>
                                }
                            />
                        </div>

                        {/* Show on Dashboard Widget */}
                        <div className="flex items-center justify-start gap-5 mb-6">
                            <DrawerSwitch
                                label="Show on Dashboard Widget"
                                checked={showOnDashboard}
                                onChange={setShowOnDashboard}
                                id="show-dashboard"
                            />
                        </div>

                        {/* Send as Email Notification */}
                        <div className="flex items-center justify-start gap-5 mb-6">
                            <DrawerSwitch
                                label="Send as Email Notification"
                                checked={sendEmailNotification}
                                onChange={setSendEmailNotification}
                                id="send-email"
                            />
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex items-center justify-between gap-5 mt-8">
                            <button
                                type="button"
                                onClick={closeDrawer}
                                className="cursor-pointer inline-flex items-center justify-center rounded-full border border-[#CACACA] px-[25px] py-[10px] text-sm leading-normal font-semibold text-black hover:bg-[#F3F4F6] transition min-w-[130px]"
                            >
                                Cancel
                            </button>
                            <div className="flex items-center gap-5">
                                <button
                                    type="button"
                                    onClick={handleSaveDraft}
                                    disabled={isSubmitting}
                                    className="cursor-pointer inline-flex items-center justify-center rounded-full bg-[#008080] px-[25px] py-[10px] text-sm leading-normal font-semibold text-white hover:opacity-90 transition min-w-[130px] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save as Draft'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="cursor-pointer inline-flex items-center justify-center rounded-full bg-[#DE4A2C] px-[25px] py-[10px] text-sm leading-normal font-semibold text-white hover:bg-[#C62828] transition min-w-[130px] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </CommonDrawer >
        </>
    );
};

export default CreatePostDrawer;
