import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import BackButtonHeader from './BackButtonHeader';
import PrimaryButton from './PrimaryButton';
import defaultGroupIcon from '../../assets/images/default-group-icon.png';

interface NewProjectGroupViewProps {
  onBack: () => void;
  onCreateGroup: (groupName: string, groupImage?: File | null) => void | Promise<void>;
}

const NewProjectGroupView: React.FC<NewProjectGroupViewProps> = ({
  onBack,
  onCreateGroup,
}) => {
  const [groupName, setGroupName] = useState('');
  const [groupNameError, setGroupNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groupImageFile, setGroupImageFile] = useState<File | null>(null);
  const [groupIcon, setGroupIcon] = useState<string | undefined>(undefined);

  const handleCreate = async () => {
    const trimmed = groupName.trim();
    if (!trimmed) {
      setGroupNameError('Group subject is required');
      return;
    }
    setGroupNameError('');
    setIsSubmitting(true);
    try {
      const result = onCreateGroup(trimmed, groupImageFile);
      if (result && typeof (result as Promise<void>).then === 'function') {
        await (result as Promise<void>);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupName(e.target.value);
    if (groupNameError) setGroupNameError('');
  };

  const handleIconClick = () => {
    // TODO: Implement actual file upload
    // For now, just a placeholder
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setGroupImageFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          setGroupIcon(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="w-[475px] bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-[15px] p-5 pb-[30px]">
        <BackButtonHeader title="New Project Group" onBack={onBack} />
      </div>

      {/* Content */}
      <div className="relative pt-[30px] px-[38px]">
        {/* Group Icon */}
        <div className="flex flex-col items-center mb-[50px]">
          <button
            type="button"
            onClick={handleIconClick}
            className="size-[180px] rounded-full flex items-center justify-center transition-colors relative overflow-hidden bg-cover bg-center"
            aria-label="Add group icon"
            style={{ backgroundImage: `url(${defaultGroupIcon})` }}
          >
            {groupIcon ? (
              <img
                src={groupIcon}
                alt="Group icon"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col gap-[5px] items-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M15.4286 1.92857H2.57143C2.40093 1.92857 2.23742 1.9963 2.11686 2.11686C1.9963 2.23742 1.92857 2.40093 1.92857 2.57143V15.4286C1.92857 15.5991 1.9963 15.7626 2.11686 15.8831C2.23742 16.0037 2.40093 16.0714 2.57143 16.0714H15.4286C15.5991 16.0714 15.7626 16.0037 15.8831 15.8831C16.0037 15.7626 16.0714 15.5991 16.0714 15.4286V2.57143C16.0714 2.40093 16.0037 2.23742 15.8831 2.11686C15.7626 1.9963 15.5991 1.92857 15.4286 1.92857ZM2.57143 0C1.88944 0 1.23539 0.270918 0.753154 0.753154C0.270918 1.23539 0 1.88944 0 2.57143V15.4286C0 16.1106 0.270918 16.7646 0.753154 17.2468C1.23539 17.7291 1.88944 18 2.57143 18H15.4286C16.1106 18 16.7646 17.7291 17.2468 17.2468C17.7291 16.7646 18 16.1106 18 15.4286V2.57143C18 1.88944 17.7291 1.23539 17.2468 0.753154C16.7646 0.270918 16.1106 0 15.4286 0H2.57143ZM14.1429 12.6733L10.9286 9L7.74514 12.6386L5.78571 10.2857L3.85714 12.6V14.1429H14.1429V12.6733ZM7.07143 9C7.58292 9 8.07346 8.79681 8.43513 8.43513C8.79681 8.07346 9 7.58292 9 7.07143C9 6.55994 8.79681 6.0694 8.43513 5.70772C8.07346 5.34605 7.58292 5.14286 7.07143 5.14286C6.55994 5.14286 6.0694 5.34605 5.70772 5.70772C5.34605 6.0694 5.14286 6.55994 5.14286 7.07143C5.14286 7.58292 5.34605 8.07346 5.70772 8.43513C6.0694 8.79681 6.55994 9 7.07143 9Z" fill="white" />
                </svg>

                <span className="text-sm font-semibold text-white">Add Group Icon</span>
              </div>
            )}
          </button>
        </div>

        {/* Group Subject Input */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-[10px]">
            <label htmlFor="group-subject" className="block text-base font-semibold text-black shrink-0">
              Group Subject <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="group-subject"
                type="text"
                placeholder="e.g. Marketing Strategy Team"
                value={groupName}
                onChange={handleGroupNameChange}
                aria-invalid={!!groupNameError}
                aria-describedby={groupNameError ? 'group-subject-error' : undefined}
                className={`w-full px-4 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-0 ${groupNameError
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-[#E6E6E6]'
                  }`}
              />
              {groupNameError && (
                <p id="group-subject-error" className="text-sm text-red-500 pl-1 absolute -bottom-6 left-0">
                  {groupNameError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Selected Members Count */}
        {/* <div className="text-sm text-gray-600">
          <span className="font-medium">{selectedMembers.length}</span> member{selectedMembers.length !== 1 ? 's' : ''} selected
        </div> */}

        {/* Create Button */}
        <div className="absolute -bottom-[100px] left-1/2 -translate-x-1/2">
          <PrimaryButton
            onClick={handleCreate}
            disabled={isSubmitting}
            icon={
              isSubmitting ? (
                <Loader2 className="w-[17px] h-[17px] text-white shrink-0 animate-spin" />
              ) : (
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.5 0C10.7543 0 12.9163 0.895533 14.5104 2.48959C16.1045 4.08365 17 6.24566 17 8.5C17 10.7543 16.1045 12.9163 14.5104 14.5104C12.9163 16.1045 10.7543 17 8.5 17C6.24566 17 4.08365 16.1045 2.48959 14.5104C0.895533 12.9163 0 10.7543 0 8.5C0 6.24566 0.895533 4.08365 2.48959 2.48959C4.08365 0.895533 6.24566 0 8.5 0ZM7.44114 10.1769L5.55293 8.2875C5.48524 8.21981 5.40487 8.16611 5.31643 8.12948C5.22799 8.09284 5.13319 8.07399 5.03746 8.07399C4.94173 8.07399 4.84694 8.09284 4.7585 8.12948C4.67005 8.16611 4.58969 8.21981 4.522 8.2875C4.38529 8.42421 4.30849 8.60963 4.30849 8.80296C4.30849 8.9963 4.38529 9.18172 4.522 9.31843L6.92629 11.7227C6.99378 11.7907 7.07408 11.8447 7.16255 11.8816C7.25102 11.9185 7.34591 11.9374 7.44175 11.9374C7.53759 11.9374 7.63248 11.9185 7.72095 11.8816C7.80942 11.8447 7.88972 11.7907 7.95721 11.7227L12.9358 6.74293C13.0044 6.67552 13.059 6.59519 13.0963 6.50659C13.1337 6.41798 13.1532 6.32284 13.1537 6.22667C13.1541 6.1305 13.1355 6.03518 13.099 5.94623C13.0624 5.85728 13.0086 5.77645 12.9406 5.70841C12.8726 5.64036 12.7919 5.58645 12.703 5.54977C12.614 5.51309 12.5188 5.49438 12.4226 5.49472C12.3264 5.49505 12.2313 5.51442 12.1426 5.55171C12.054 5.58901 11.9736 5.64348 11.9061 5.712L7.44114 10.1769Z" fill="white" />
                </svg>
              )
            }
            iconPosition="right"
          >
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </PrimaryButton>
        </div>
      </div>

    </div>
  );
};

export default NewProjectGroupView;




