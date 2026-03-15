import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import type { User } from '../my-work/types';
import avatarPlaceholder from '../../assets/images/default-group-icon.png';

interface AddStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectStaff: (staff: User) => void;
    staff: User[];
    pinnedStaffIds?: string[];
}

const AddStaffModal: React.FC<AddStaffModalProps> = ({
    isOpen,
    onClose,
    onSelectStaff,
    staff,
    pinnedStaffIds = [],
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    // Filter staff - exclude already pinned staff and filter by search
    const filteredStaff = useMemo(() => {
        let filtered = staff.filter((user) => !pinnedStaffIds.includes(user.id));

        if (searchTerm.trim()) {
            const query = searchTerm.trim().toLowerCase();
            filtered = filtered.filter(
                (user) =>
                    user.name.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query) ||
                    user.position.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [staff, searchTerm, pinnedStaffIds]);

    const handleStaffClick = (staff: User) => {
        onSelectStaff(staff);
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={onClose}
        >
            <div
                className="relative bg-white border border-[#e6e6e6] rounded-[5px] w-full max-w-[419px] shadow-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-0.5 right-0.5 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-[#1C2745] transition-colors cursor-pointer"
                    aria-label="Close"
                >
                    <X className="w-3 h-3 text-white" strokeWidth="3" />
                </button>

                {/* Search Bar */}
                <div className="h-[65px] px-[10px] pt-[28px] pb-[12px]">
                    <div className="relative">
                        <Search className="absolute left-[15px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search people by name or email"
                            className="w-full h-[40px] bg-[#232725] border border-[#cacaca] rounded-[5px] px-[15px] pl-[43px] py-[10px] text-[14px] font-medium text-white placeholder:text-white outline-none"
                        />
                    </div>
                </div>

                {/* Staff List */}
                <div className="max-h-[433px] overflow-y-auto">
                    {filteredStaff.length > 0 ? (
                        filteredStaff.map((staff, index) => (
                            <React.Fragment key={staff.id}>
                                <button
                                    type="button"
                                    onClick={() => handleStaffClick(staff)}
                                    className="w-full px-[10px] py-[10px] flex items-center gap-[10px] hover:bg-[#F3F4F6] transition-colors cursor-pointer relative"
                                >
                                    <div className="relative shrink-0">
                                        <img
                                            src={staff.avatar || avatarPlaceholder}
                                            alt={staff.name}
                                            className="w-[48px] h-[48px] rounded-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = avatarPlaceholder;
                                            }}
                                        />
                                        {/* Availability indicator - small green dot */}
                                        <div className="absolute bottom-0 right-0 w-[13px] h-[13px] bg-[#16A34A] rounded-full border-2 border-white"></div>
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="text-[16px] font-semibold text-black leading-normal truncate">
                                            {staff.name}
                                        </p>
                                        <p className="text-[14px] font-normal text-[#535352] leading-normal truncate">
                                            {staff.position}
                                        </p>
                                    </div>
                                </button>
                                {index < filteredStaff.length - 1 && (
                                    <div className="h-px bg-[#e6e6e6] mx-[10px]" />
                                )}
                            </React.Fragment>
                        ))
                    ) : (
                        <div className="px-[10px] py-[20px] text-center">
                            <p className="text-[14px] font-normal text-[#535352]">
                                {searchTerm.trim() ? 'No staff found' : 'No staff available'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AddStaffModal;
