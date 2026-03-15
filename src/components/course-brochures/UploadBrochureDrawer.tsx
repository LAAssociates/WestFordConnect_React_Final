import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { downloadFile } from '../../lib/utils/file';
import AvatarPlaceholder from '../../assets/images/avatar-placeholder-2.png';
import type { CategoryOption } from '../common/CategoryDropdown';
import { type IndividualUser as DropdownUser, type ProjectGroup } from '../common/AudienceDropdown';
import type { AudienceSelection } from '../common/AudienceDropdown';
import { courseService } from '../../services/courseService';
import type { MetricLookupItem, BrochureBootstrapResult, BrochureDto } from '../../types/courseBrochure';
import CommonDrawer from '../common/drawer/CommonDrawer';
import DrawerHeader from '../common/drawer/DrawerHeader';
import DrawerContent from '../common/drawer/DrawerContent';
import DrawerFooter from '../common/drawer/DrawerFooter';
import Tooltip from '../ui/Tooltip';
import DrawerInput from '../common/drawer/inputs/DrawerInput';
import DrawerTextarea from '../common/drawer/inputs/DrawerTextarea';
import DrawerCategorySelect from '../common/drawer/inputs/DrawerCategorySelect';
import DrawerAudienceSelect from '../common/drawer/inputs/DrawerAudienceSelect';
import DrawerFileUpload from '../common/drawer/inputs/DrawerFileUpload';
import DrawerAttachments, { type AttachmentItem } from '../common/drawer/inputs/DrawerAttachments';

export type UploadBrochureDrawerProps = {
  open: boolean;
  onClose: () => void;
  mode?: 'upload' | 'edit';
  brochureId?: string | number;
  readonly?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onSuccess?: (type?: 'FULL' | 'SIDEBAR_ONLY', data?: BrochureDto[]) => void;
  onError?: (message: string) => void;
  bootstrapData: BrochureBootstrapResult | null;
  downloadUrl?: string;
};

const UploadBrochureDrawer: React.FC<UploadBrochureDrawerProps> = ({
  open,
  onClose,
  mode = 'upload',
  brochureId,
  readonly = false,
  onEdit,
  onDelete,
  onSuccess,
  onError,
  bootstrapData,
  downloadUrl
}) => {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [individualUsers, setIndividualUsers] = useState<DropdownUser[]>([]);
  const [groups, setGroups] = useState<ProjectGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form State
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAudience, setSelectedAudience] = useState<AudienceSelection>({
    allStaff: true,
    individualIds: [],
    groupIds: [],
  });
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [existingFile, setExistingFile] = useState<{ fileName: string; fileKey: string } | null>(null);

  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [attachmentOptions, setAttachmentOptions] = useState<MetricLookupItem[]>([]);
  const [audienceTypeOptions, setAudienceTypeOptions] = useState<MetricLookupItem[]>([]);

  // Reset form when drawer opens/closes
  useEffect(() => {
    if (!open) {
      setTitle('');
      setSelectedCategory('');
      setSelectedAudience({ allStaff: true, individualIds: [], groupIds: [] });
      setDescription('');
      setFile(null);
      setExistingFile(null);
      setIsUploading(false);
      setIsDownloading(false);
      setAttachments([]);
      setErrors({});
      // Options are now controlled by props/bootstrapData, don't clear them here
    }
  }, [open]);



  async function handleDownloadFile() {
    if (isDownloading) return;
    const urlToUse = downloadUrl || existingFile?.fileKey;

    if (!urlToUse) {
      if (onError) onError('Download URL not available');
      return;
    }

    setIsDownloading(true);
    try {
      await downloadFile(urlToUse, title || 'brochure');
    } catch (error) {
      if (onError) onError('Download failed');
    } finally {
      setIsDownloading(false);
    }
  }

  const handleUpload = async () => {
    if (!readonly) {
      // Validation
      const newErrors: Record<string, string> = {};

      if (!title.trim()) {
        newErrors.title = 'Title is required';
      }
      if (!selectedCategory) {
        newErrors.category = 'Category is required';
      }
      const hasFile = !!(file || existingFile);
      if (!hasFile && attachments.length === 0) {
        newErrors.file = 'File or attachments are required';
      }
      if (hasFile && attachments.length > 0) {
        newErrors.file = 'Only one of File or Attachments is allowed';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors({});

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('Title', title);

        // Find the category code from bootstrapData
        const selectedCatObj = bootstrapData?.categories.find(c => c.id.toString() === selectedCategory);
        const categoryValueToPass = selectedCatObj ? selectedCatObj.code.toString() : selectedCategory;

        // formData.append('Category', categoryObj ? categoryObj.name : ''); // Removed as not in curl
        formData.append('CategoryId', categoryValueToPass);

        formData.append('Description', description);

        let audienceType = 'ALL'; // Default fallback

        // Helper to find matching code from bootstrap options
        const findAudienceCode = (criteria: (desc: string, code: number) => boolean, defaultCode: number) => {
          const match = audienceTypeOptions.find(opt => criteria(opt.description.toLowerCase(), opt.code));
          return match ? match.code : defaultCode;
        };

        const ALL_CODE = 1; // Assuming 1 is ALL based on typical lookup
        const USERS_CODE = 2;
        const GROUPS_CODE = 3;

        // Try to find dynamic codes if available, otherwise fallback
        const dynamicAll = findAudienceCode((d, _c) => d === 'all', ALL_CODE);
        const dynamicUsers = findAudienceCode((d, _c) => d.includes('individual') || d.includes('user'), USERS_CODE);
        const dynamicGroups = findAudienceCode((d, _c) => d.includes('project') || d.includes('group'), GROUPS_CODE);

        if (selectedAudience.allStaff) {
          audienceType = dynamicAll.toString();
        } else if (selectedAudience.individualIds.length > 0) {
          audienceType = dynamicUsers.toString();
        } else if (selectedAudience.groupIds.length > 0) {
          audienceType = dynamicGroups.toString();
        }

        formData.append('Audience.AudienceType', audienceType);

        // API expects comma-separated strings for IDs as per curl example
        // API expects multiple entries for IDs as per latest requirement (array format)
        selectedAudience.individualIds.forEach((id) => {
          formData.append('Audience.UserIds', id);
        });
        selectedAudience.groupIds.forEach((id) => {
          formData.append('Audience.GroupIds', id);
        });

        if (mode === 'edit' && brochureId) {
          formData.append('BrochureId', String(brochureId));
        }

        if (file) {
          formData.append('FileName', file.name);
          formData.append('ContentType', file.type);
          formData.append('FileSize', file.size.toString());
          formData.append('file', file);
        } else if (existingFile) {
          // If editing and no new file, we still might need to send file info or common fields
          // based on curl, but since 'file' is often the Actual File object, we skip if null.
          // However, curl shows file="string", which might be the key or just a placeholder.
          // We'll stick to actual file upload logic.
        }

        formData.append('attachmentFiles', ''); // As per curl example

        // Add attachments
        attachments.forEach((attachment, index) => {
          formData.append(`Attachments[${index}].Type`, attachment.type.toUpperCase());
          formData.append(`Attachments[${index}].DisplayText`, attachment.title);
          if (attachment.type === 'link' && attachment.url) {
            formData.append(`Attachments[${index}].Url`, attachment.url);
          }
          // FILE type handling can be added here when cloud attachment is implemented
        });

        const response = await courseService.uploadBrochure(formData);

        if (response.success) {
          onSuccess?.('FULL', response.result?.items);
          onClose();
        }
      } catch (error) {
        if (onError) onError('Upload failed. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleAddCategory = async (categoryName: string, iconFile?: File): Promise<boolean> => {
    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      return false;
    }

    try {
      // Make API call to add category
      const formData = new FormData();
      formData.append('CategoryType', 'BROCHURE');
      formData.append('CategoryName', trimmedName);
      if (iconFile) {
        formData.append('IconFile', iconFile);
      }

      const response = await courseService.addCategory(formData);

      if (response.success && response.result) {
        // Optimistically update local categories since we don't re-fetch bootstrap here
        const newCategory: CategoryOption = {
          id: response.result.categoryId.toString(),
          name: response.result.categoryName,
          code: response.result.categoryId.toString()
        };

        setCategories(prev => [...prev, newCategory]);
        setSelectedCategory(newCategory.id);

        // Notify parent to refresh if needed
        onSuccess?.('SIDEBAR_ONLY');
        return true;

      } else {
        if (onError) onError(`Failed to add category: ${response.message}`);
        return false;
      }
    } catch (error) {
      if (onError) onError('Failed to add category. Please try again.');
      return false;
    }
  };

  const handleAudienceChange = (selection: AudienceSelection) => {
    setSelectedAudience(selection);
  };



  useEffect(() => {
    if (open && bootstrapData) {
      const initializeData = async () => {
        setIsLoading(true);
        try {
          const result = bootstrapData;

          const mappedCategories: CategoryOption[] = result.categories.map(c => ({
            id: c.id.toString(),
            name: c.name,
            code: c.code ? c.code.toString() : c.id.toString()
          }));
          setCategories(mappedCategories);

          const mappedIndividualUsers: DropdownUser[] = result.individualUsers.map(u => ({
            id: u.id.toString(),
            name: u.name || '',
            position: u.designation || '',
            email: '',
            avatar: u.profileImageUrl || AvatarPlaceholder
          }));
          setIndividualUsers(mappedIndividualUsers);

          const mappedGroups: ProjectGroup[] = result.groups.map(g => ({
            id: g.groupId.toString(),
            name: g.groupName,
            iconUrl: g.iconUrl,
            members: [],
            memberCount: g.memberCount
          }));
          setGroups(mappedGroups);

          if (result.attachment && Array.isArray(result.attachment)) {
            setAttachmentOptions(result.attachment);
          }

          if (result.audienceType && Array.isArray(result.audienceType)) {
            setAudienceTypeOptions(result.audienceType);
          }

          if (mode === 'edit' && brochureId) {
            const response = await courseService.getSingleBrochureInfo(brochureId);
            const brochureData = response.result;

            setTitle(brochureData.title);
            
            // In getSingle API, categoryId contains the category code.
            // Map it back to the internal id used by the dropdown.
            const matchedCategory = result.categories.find(c => c.code === brochureData.categoryId);
            setSelectedCategory(matchedCategory ? matchedCategory.id.toString() : brochureData.categoryId.toString());
            setDescription(brochureData.description || '');

            const fileData = {
              fileName: brochureData.fileName || brochureData.file?.fileName || 'Unknown file',
              fileKey: brochureData.fileKey || brochureData.file?.fileKey || ''
            };
            setExistingFile(fileData);

            if (brochureData.attachments) {
              const loadedAttachments: AttachmentItem[] = brochureData.attachments.map(att => ({
                type: (att.attachmentType.toLowerCase() === 'link' || att.attachmentType.toLowerCase() === 'cloud' || att.attachmentType.toLowerCase() === 'file') ? att.attachmentType.toLowerCase() as any : 'link',
                title: att.displayText,
                url: att.url,
                id: Date.now().toString() + Math.random().toString(36).substring(7)
              }));
              setAttachments(loadedAttachments);
            }

            if (!brochureData.audience || brochureData.audience.audienceType === 'ALL') {
              setSelectedAudience({
                allStaff: true,
                individualIds: [],
                groupIds: []
              });
            } else {
              const validGroupIds = (brochureData.audience.groupIds || [])
                .map(String)
                .filter(groupId => mappedGroups.some(group => group.id === groupId));

              const validUserIds = (brochureData.audience.userIds || [])
                .map(String)
                .filter(userId => mappedIndividualUsers.some(user => user.id === userId));

              const shouldBeAll = validGroupIds.length === 0 && validUserIds.length === 0;

              setSelectedAudience({
                allStaff: shouldBeAll,
                individualIds: validUserIds,
                groupIds: validGroupIds
              });
            }
          }
        } catch (error) {
          if (onError) onError('Failed to load initial drawer data.');
        } finally {
          setIsLoading(false);
        }
      };

      initializeData();
    }
  }, [open, mode, brochureId, bootstrapData]);



  const closeDrawer = () => {
    onClose();
  };

  const drawerFooter = !isLoading && !readonly ? (
    <DrawerFooter>
      <button
        type="button"
        onClick={closeDrawer}
        className="cursor-pointer inline-flex items-center justify-center rounded-full border border-[#E6E6E6] px-10 py-2.5 text-sm font-medium text-[#475467] hover:bg-[#F3F4F6] transition"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={isUploading}
        onClick={handleUpload}
        className="cursor-pointer inline-flex items-center justify-center rounded-full bg-[#DE4A2C] px-10 py-2.5 text-sm font-semibold text-white hover:bg-[#C62828] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {mode === 'edit' ? 'Updating...' : 'Uploading...'}
          </>
        ) : mode === 'edit' ? 'Update' : 'Upload'}
      </button>
    </DrawerFooter>
  ) : null;

  // Action buttons moved down into content block.

  return (
    <CommonDrawer isOpen={open} onClose={closeDrawer}>
      <DrawerHeader
        title={readonly ? 'File Information' : mode === 'edit' ? 'Edit Brochure' : 'Upload Brochure'}
        onClose={closeDrawer}
      />

      {isLoading ? (
        <DrawerContent className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#DE4A2C]" />
        </DrawerContent>
      ) : (
        <DrawerContent footer={drawerFooter}>
          {/* Action Buttons - Show in view and edit modes */}
          {mode === 'edit' && (
            <div className="flex items-center justify-end gap-2.5 mb-6">
              <Tooltip content="Download File" side="bottom">
                <button
                  type="button"
                  onClick={handleDownloadFile}
                  disabled={isDownloading}
                  className={`cursor-pointer w-[27.676px] h-[27.676px] flex items-center justify-center rounded-full bg-black text-white transition ${isDownloading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  aria-label="Download"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="13.8378" cy="13.8378" r="13.8378" fill="#232725" />
                      <path d="M19.25 16.625V19.25H8.75V16.625H7V19.25C7 20.2125 7.7875 21 8.75 21H19.25C20.2125 21 21 20.2125 21 19.25V16.625H19.25Z" fill="white" />
                      <path d="M10.8587 11.8913L9.625 13.125L14 17.5L18.375 13.125L17.1413 11.8913L14.875 14.1488V7H13.125V14.1488L10.8587 11.8913Z" fill="white" />
                    </svg>
                  )}
                </button>
              </Tooltip>

              {readonly && onEdit && (
                <Tooltip content="Edit Brochure" side="bottom">
                  <button
                    type="button"
                    onClick={onEdit}
                    className="w-[27.676px] h-[27.676px] flex items-center justify-center rounded-full bg-[#1E88E5] text-black hover:bg-[#1372B2] cursor-pointer transition"
                    aria-label="Edit"
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M0 3.63758C0 2.67284 0.383244 1.7476 1.06542 1.06542C1.7476 0.383244 2.67284 0 3.63758 0H7.48936C7.68799 0 7.87849 0.0789055 8.01894 0.219358C8.15939 0.359811 8.2383 0.550306 8.2383 0.748936C8.2383 0.947567 8.15939 1.13806 8.01894 1.27851C7.87849 1.41897 7.68799 1.49787 7.48936 1.49787H3.63758C3.0701 1.49787 2.52585 1.72331 2.12458 2.12458C1.72331 2.52585 1.49787 3.0701 1.49787 3.63758V11.3411C1.49787 11.9086 1.72331 12.4529 2.12458 12.8541C2.52585 13.2554 3.0701 13.4809 3.63758 13.4809H11.3411C11.9086 13.4809 12.4529 13.2554 12.8541 12.8541C13.2554 12.4529 13.4809 11.9086 13.4809 11.3411V7.48936C13.4809 7.29073 13.5598 7.10024 13.7002 6.95978C13.8407 6.81933 14.0312 6.74043 14.2298 6.74043C14.4284 6.74043 14.6189 6.81933 14.7594 6.95978C14.8998 7.10024 14.9787 7.29073 14.9787 7.48936V11.3411C14.9787 12.3059 14.5955 13.2311 13.9133 13.9133C13.2311 14.5955 12.3059 14.9787 11.3411 14.9787H3.63758C2.67284 14.9787 1.7476 14.5955 1.06542 13.9133C0.383244 13.2311 0 12.3059 0 11.3411V3.63758Z" fill="white" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M9.83568 8.40092L8.18427 9.39701L7.41062 8.11408L9.06203 7.11799L9.06427 7.1165C9.12757 7.07838 9.18593 7.03259 9.23803 6.98019L12.9902 3.20855C13.0278 3.17065 13.064 3.13143 13.0988 3.09096C13.3467 2.80187 13.7137 2.22969 13.2696 1.78332C12.8943 1.40586 12.3566 1.76235 12.0083 2.06867C11.9149 2.15102 11.825 2.23722 11.7387 2.32705L11.7133 2.35251L8.01352 6.07098C7.92567 6.15831 7.85683 6.26285 7.8113 6.37804L7.19418 7.93059C7.18248 7.9598 7.18027 7.99196 7.18788 8.0225C7.19549 8.05304 7.21252 8.0804 7.23656 8.10071C7.2606 8.12102 7.29043 8.13324 7.32181 8.13564C7.35318 8.13804 7.38377 8.1305 7.41062 8.11408L8.18427 9.39701C6.83244 10.2118 5.21849 8.84279 5.80266 7.37638L6.42053 5.82458C6.54083 5.52134 6.72177 5.24584 6.95227 5.01498L10.6513 1.29576L10.673 1.27404C10.7831 1.1617 11.1531 0.782742 11.6017 0.510129C11.8466 0.362589 12.2375 0.167116 12.7206 0.129669C13.2748 0.085482 13.8665 0.259984 14.3308 0.726571C14.6862 1.07766 14.9097 1.54055 14.9636 2.03721C15.0007 2.42433 14.9416 2.81462 14.7914 3.17335C14.5742 3.71033 14.2117 4.10502 14.0522 4.26455L10.3 8.03619C10.1602 8.17649 10.0054 8.29807 9.83568 8.40092ZM13.1707 3.064C13.1707 3.064 13.1677 3.06625 13.161 3.0685L13.1707 3.064Z" fill="white" />
                    </svg>
                  </button>
                </Tooltip>
              )}

              {onDelete && (
                <Tooltip content="Delete Brochure" side="bottom">
                  <button
                    type="button"
                    onClick={onDelete}
                    className="w-[27.676px] h-[27.676px] flex items-center justify-center rounded-full bg-[#D93025] text-white hover:bg-[#C62828] cursor-pointer transition"
                    aria-label="Delete"
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.52482 1.34809H4.36879C4.45461 1.34809 4.52482 1.28068 4.52482 1.1983V1.34809ZM4.52482 1.34809H10.4539V1.1983C10.4539 1.28068 10.5241 1.34809 10.6099 1.34809H10.4539V2.69617H11.8582V1.1983C11.8582 0.537362 11.2984 0 10.6099 0H4.36879C3.68032 0 3.12057 0.537362 3.12057 1.1983V2.69617H4.52482V1.34809ZM14.3546 2.69617H0.624114C0.278901 2.69617 0 2.96392 0 3.29532V3.89447C0 3.97685 0.0702128 4.04426 0.156028 4.04426H1.33404L1.81578 13.8366C1.84699 14.4751 2.39699 14.9787 3.06206 14.9787H11.9167C12.5837 14.9787 13.1317 14.4769 13.1629 13.8366L13.6447 4.04426H14.8227C14.9085 4.04426 14.9787 3.97685 14.9787 3.89447V3.29532C14.9787 2.96392 14.6998 2.69617 14.3546 2.69617ZM11.7665 13.6306H3.21223L2.74025 4.04426H12.2385L11.7665 13.6306Z" fill="white" />
                    </svg>
                  </button>
                </Tooltip>
              )}
            </div>
          )}

          <DrawerInput
            label="Title"
            required
            value={title}
            onChange={(e) => {
              if (!readonly) setTitle(e.target.value);
              if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
            }}
            placeholder="Add a clear, concise file title"
            disabled={readonly}
            error={errors.title}
          />

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
            placeholder="Choose a relevant category"
            disabled={readonly}
            error={errors.category}
          />

          <DrawerAudienceSelect
            label="Audience"
            required
            individualUsers={individualUsers}
            projectGroups={groups}
            selectedAudience={selectedAudience}
            onAudienceChange={handleAudienceChange}
            placeholder="Who is this brochure for?"
            disabled={readonly}
            error={errors.audience}
          />

          <DrawerTextarea
            label="Description"
            rows={4}
            value={description}
            onChange={(e) => !readonly && setDescription(e.target.value)}
            placeholder="Write the full update here..."
            disabled={readonly}
          />

          <DrawerFileUpload
            label="Upload File"
            file={file}
            existingFileName={existingFile?.fileName}
            onFileSelect={(f) => {
              setFile(f);
              if (errors.file) setErrors(prev => ({ ...prev, file: '' }));
            }}
            onFileRemove={() => { setFile(null); setExistingFile(null); }}
            disabled={readonly || attachments.length > 0}
            error={errors.file}
          />

          {!readonly && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1"></div>
                <div className="w-[419px] text-[#535352] font-semibold text-[15px] text-center">Or</div>
              </div>

              <DrawerAttachments
                label="Attachments"
                attachments={attachments}
                onAttachmentsChange={(newAttachments) => {
                  setAttachments(newAttachments);
                  if (newAttachments.length > 0 && errors.file) {
                    setErrors(prev => ({ ...prev, file: '' }));
                  }
                }}
                options={attachmentOptions.map(opt => {
                  let type: 'link' | 'file' | 'cloud' = 'link';
                  if (opt.description.includes('Cloud')) type = 'cloud';
                  else if (opt.description.includes('File') || opt.description.includes('upload')) type = 'file';

                  return {
                    type,
                    label: opt.description
                  };
                })}
                disabled={readonly || !!(file || existingFile)}
              />
            </>
          )}
        </DrawerContent>
      )}
    </CommonDrawer>
  );
};

export default UploadBrochureDrawer;