import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { User } from './types';
import UserListItem from './UserListItem';
import SearchInput from './SearchInput';
import BackButtonHeader from './BackButtonHeader';
import EmptyState from './EmptyState';
import PrimaryButton from './PrimaryButton';
import { MacScrollbar } from 'mac-scrollbar';

interface AddGroupMembersViewProps {
  staff: User[];
  selectedMembers: User[];
  onSelectMember: (user: User) => void;
  onDeselectMember: (userId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const AddGroupMembersView: React.FC<AddGroupMembersViewProps> = ({
  staff,
  selectedMembers,
  onSelectMember,
  onDeselectMember,
  onNext,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [fadingOutUserId, setFadingOutUserId] = useState<string | null>(null);

  const filteredStaff = useMemo(() => {
    // Filter out selected members
    let availableStaff = staff.filter(
      (member) => !selectedMembers.some((selected) => selected.id === member.id)
    );

    // Exclude fading out user to trigger exit animation
    if (fadingOutUserId) {
      availableStaff = availableStaff.filter((member) => member.id !== fadingOutUserId);
    }

    if (!searchQuery.trim()) {
      return availableStaff;
    }
    const query = searchQuery.toLowerCase();
    return availableStaff.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.position.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query)
    );
  }, [staff, searchQuery, selectedMembers, fadingOutUserId]);

  const isSelected = (userId: string) => {
    return selectedMembers.some((m) => m.id === userId);
  };

  const handleMemberClick = (member: User) => {
    if (isSelected(member.id)) {
      onDeselectMember(member.id);
    } else {
      setFadingOutUserId(member.id);
      // Wait for animation to complete before calling onSelectMember
      setTimeout(() => {
        onSelectMember(member);
        setFadingOutUserId(null);
      }, 300); // Match animation duration
    }
  };

  return (
    <div className="relative w-[475px] bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-[15px] p-5 pb-[30px]">
        <BackButtonHeader title="Add Group Members" onBack={onBack} />

        {/* Search Bar */}
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search staff"
          selectedMembers={selectedMembers}
          onRemoveMember={onDeselectMember}
        />
      </div>

      {/* Staff List */}
      <div className="flex-1 overflow-hidden">
        <MacScrollbar className="h-full">
          <div>
            {filteredStaff.length === 0 ? (
              <EmptyState message="No staff found" />
            ) : (
              <AnimatePresence>
                {filteredStaff.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <UserListItem
                      user={member}
                      isSelected={isSelected(member.id)}
                      onClick={() => handleMemberClick(member)}
                      searchQuery={searchQuery}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </MacScrollbar>
      </div>

      {/* Next Button */}
      {selectedMembers.length > 0 && (
        <div className="absolute bottom-[50px] left-1/2 -translate-x-1/2">
          <PrimaryButton onClick={onNext} icon={
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 7L9 1M15 7L9 13M15 7L1 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          } iconPosition="right">
            Next
          </PrimaryButton>
        </div>
      )}
    </div>
  );
};

export default AddGroupMembersView;





