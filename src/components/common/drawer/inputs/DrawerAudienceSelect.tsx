import React from 'react';
import AudienceDropdown, { type IndividualUser, type ProjectGroup, type AudienceSelection } from '../../AudienceDropdown';
import { cn } from '../../../../lib/utils/cn';

interface DrawerAudienceSelectProps {
    label: string;
    required?: boolean;
    individualUsers: IndividualUser[];
    projectGroups?: ProjectGroup[];
    selectedAudience: AudienceSelection;
    onAudienceChange: (selection: AudienceSelection) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    containerClassName?: string;
}

const DrawerAudienceSelect: React.FC<DrawerAudienceSelectProps> = ({
    label,
    required,
    individualUsers,
    projectGroups,
    selectedAudience,
    onAudienceChange,
    placeholder,
    disabled,
    error,
    containerClassName,
}) => {
    return (
        <div className={cn("flex items-center justify-between mb-6", containerClassName)}>
            <label className="text-[15px] font-semibold text-black">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex flex-col">
                <AudienceDropdown
                    individualUsers={individualUsers}
                    projectGroups={projectGroups}
                    selectedAudience={selectedAudience}
                    onAudienceChange={onAudienceChange}
                    placeholder={placeholder}
                    width="w-[419px]"
                    disabled={disabled}
                />
                {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
            </div>
        </div>
    );
};

export default DrawerAudienceSelect;
