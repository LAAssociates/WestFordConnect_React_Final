import React from 'react';
import { Plus } from 'lucide-react';
import type { User } from '../my-work/types';
import Tooltip from '../ui/Tooltip';

interface PinnedStaffProps {
    pinnedStaff: User[];
    onAddStaff?: () => void;
}

const PinnedStaff: React.FC<PinnedStaffProps> = ({ pinnedStaff, onAddStaff }) => {
    return (
        <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
                        <circle cx="10.5" cy="10.5" r="10.5" fill="#D93025" />
                        <path d="M16 8.81407C15.8784 8.93568 15.7605 9.04623 15.6462 9.14573C15.532 9.24523 15.4122 9.33183 15.2869 9.40553C15.1616 9.47923 15.0271 9.53266 14.8834 9.56583C14.7397 9.599 14.5739 9.61926 14.3859 9.62663C14.2606 9.62663 14.1409 9.61558 14.0266 9.59347L11.9317 11.6884C11.9796 11.8285 12.0146 11.9722 12.0367 12.1196C12.0588 12.267 12.0698 12.4144 12.0698 12.5618C12.0698 12.8013 12.0459 13.0188 11.998 13.2141C11.9501 13.4094 11.8819 13.5936 11.7935 13.7668C11.705 13.94 11.5945 14.104 11.4618 14.2588C11.3291 14.4136 11.1836 14.5739 11.0251 14.7397L8.89146 12.606L5.75176 15.7513L5 16L5.24874 15.2482L8.39397 12.1085L6.2603 9.97487L6.50905 9.72613C6.767 9.46817 7.06181 9.27102 7.39347 9.13467C7.72513 8.99833 8.07521 8.93015 8.44372 8.93015C8.7459 8.93015 9.03518 8.97621 9.31156 9.06834L11.4065 6.97337C11.3844 6.85913 11.3734 6.73936 11.3734 6.61407C11.3734 6.4335 11.3918 6.27136 11.4286 6.12764C11.4655 5.98392 11.5208 5.84757 11.5945 5.71859C11.6682 5.58961 11.7529 5.46985 11.8487 5.3593C11.9446 5.24874 12.057 5.12898 12.1859 5L16 8.81407Z" fill="white" />
                    </svg>
                    <p className="text-[16px] font-semibold text-black leading-normal">Pinned</p>
                </div>
                <Tooltip content="Pin staff for quick access" side="bottom" delay={300}>
                    <button
                        type="button"
                        onClick={onAddStaff}
                        className="w-[24px] h-[24px] rounded-full bg-[#1C2745] flex items-center justify-center cursor-pointer hover:opacity-90 transition"
                        aria-label="Add pinned staff"
                    >
                        <Plus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </button>
                </Tooltip>
            </div>

            {/* Staff List */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
                {pinnedStaff.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {pinnedStaff.map((staff) => (
                            <div
                                key={staff.id}
                                className="flex items-center gap-[10px]"
                            >
                                <img
                                    src={staff.avatar || '/placeholder-avatar.png'}
                                    alt={staff.name}
                                    className="w-[28px] h-[28px] rounded-full shrink-0 object-cover"
                                />
                                <p className="text-[14px] font-semibold text-black leading-normal">
                                    {staff.name}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-[14px] font-normal text-[#535352]">No pinned staff</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PinnedStaff;

