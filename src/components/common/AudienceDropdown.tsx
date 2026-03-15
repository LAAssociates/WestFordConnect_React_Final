import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, Users, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import AvatarPlaceholder from '../../assets/images/default-group-icon.png';
import BuildingIcon from '../../assets/icons/building.svg';
import MacScrollbar from './MacScrollbar';
import {
  audienceSegments,
  getAudienceSearchPlaceholder,
  AUDIENCE_EMPTY_STATE_MESSAGE,
  AUDIENCE_ALL_STAFF_MESSAGE,
  type AudienceSegmentId,
} from './audienceOptions';
import { courseService } from '../../services/courseService';
import type { GroupMemberDetail } from '../../types/courseBrochure';

export type IndividualUser = {
  id: string;
  name: string;
  position: string;
  email?: string;
  avatar?: string;
};

export type GroupMember = {
  id: string;
  name: string;
  position: string;
};

export type ProjectGroup = {
  id: string;
  name: string;
  avatar?: string;
  iconUrl?: string;
  members: GroupMember[];
  memberCount?: number;
};

export type AudienceSelection = {
  allStaff: boolean;
  individualIds: string[];
  groupIds: string[];
};

interface AudienceDropdownProps {
  individualUsers: IndividualUser[];
  projectGroups?: ProjectGroup[];
  selectedAudience: AudienceSelection;
  onAudienceChange: (selection: AudienceSelection) => void;
  placeholder?: string;
  width?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  inline?: boolean;
}

const AudienceDropdown: React.FC<AudienceDropdownProps> = ({
  individualUsers,
  projectGroups = [],
  selectedAudience,
  onAudienceChange,
  placeholder = 'Who is this brochure for?',
  width = 'w-full',
  className,
  disabled = false,
  error,
  inline = false,
}) => {
  const [audienceMenuOpen, setAudienceMenuOpen] = useState(false);
  const [activeAudienceSegment, setActiveAudienceSegment] = useState<AudienceSegmentId>(audienceSegments[0].id);
  const [audienceSearch, setAudienceSearch] = useState('');
  const [activeGroupMembersId, setActiveGroupMembersId] = useState<string | null>(null);
  const [groupMembersData, setGroupMembersData] = useState<Record<string, GroupMemberDetail[]>>({});
  const [loadingGroupMembers, setLoadingGroupMembers] = useState<Record<string, boolean>>({});
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const audiencePopoverRef = useRef<HTMLDivElement>(null);
  const membersDropdownRef = useRef<HTMLDivElement>(null);
  const membersToggleButtonRef = useRef<HTMLDivElement | null>(null);

  // Auto-select appropriate segment based on selectedAudience when menu opens or if inline
  useEffect(() => {
    if (audienceMenuOpen || inline) {
      if (selectedAudience.individualIds.length > 0 && !selectedAudience.allStaff) {
        setActiveAudienceSegment('individual-users');
      } else if (selectedAudience.groupIds.length > 0 && !selectedAudience.allStaff) {
        setActiveAudienceSegment('project-groups');
      } else if (selectedAudience.allStaff) {
        setActiveAudienceSegment('all');
      }
    }
  }, [audienceMenuOpen, inline, selectedAudience]);

  const selectedAudienceItems = useMemo(() => {
    const items: Array<{ type: 'all-staff' | 'individual' | 'group'; label: string; avatar?: string | null; id?: string }> = [];

    if (selectedAudience.allStaff) {
      items.push({ type: 'all-staff', label: 'All Staff' });
    }

    selectedAudience.individualIds.forEach((id) => {
      const user = individualUsers.find((item) => item.id === id);
      if (user) {
        items.push({
          type: 'individual',
          label: user.name,
          avatar: user.avatar || AvatarPlaceholder,
          id: user.id,
        });
      }
    });

    selectedAudience.groupIds.forEach((id) => {
      const group = projectGroups.find((item) => item.id === id);
      if (group) {
        items.push({
          type: 'group',
          label: group.name,
          avatar: group.iconUrl || group.avatar || null,
          id: group.id,
        });
      }
    });

    return items;
  }, [selectedAudience, individualUsers, projectGroups]);

  const selectedAudienceSummary = useMemo(() => {
    if (selectedAudienceItems.length === 0) {
      return placeholder;
    }

    if (selectedAudienceItems.length <= 2) {
      return selectedAudienceItems;
    }

    const [first, second] = selectedAudienceItems;
    return [first, second, { type: 'more' as const, label: `+${selectedAudienceItems.length - 2} more` }];
  }, [selectedAudienceItems, placeholder]);

  const audienceSearchPlaceholder = useMemo(() => {
    return getAudienceSearchPlaceholder(activeAudienceSegment);
  }, [activeAudienceSegment]);

  const filteredIndividuals = useMemo(() => {
    if (activeAudienceSegment !== 'individual-users') {
      return [];
    }

    if (!audienceSearch.trim()) {
      return individualUsers;
    }

    const query = audienceSearch.trim().toLowerCase();
    return individualUsers.filter((user) => {
      return (
        (user.name && user.name.toLowerCase().includes(query)) ||
        (user.email && user.email.toLowerCase().includes(query)) ||
        (user.position && user.position.toLowerCase().includes(query))
      );
    });
  }, [activeAudienceSegment, audienceSearch, individualUsers]);

  const filteredGroups = useMemo(() => {
    if (activeAudienceSegment !== 'project-groups') {
      return [];
    }

    if (!audienceSearch.trim()) {
      return projectGroups;
    }

    const query = audienceSearch.trim().toLowerCase();
    return projectGroups.filter((group) => {
      const matchesGroup = group.name.toLowerCase().includes(query);
      const matchesMember = group.members.some((member) => member.name.toLowerCase().includes(query));
      return matchesGroup || matchesMember;
    });
  }, [activeAudienceSegment, audienceSearch, projectGroups]);

  useEffect(() => {
    if (!audienceMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!audiencePopoverRef.current?.contains(event.target as Node)) {
        setAudienceMenuOpen(false);
        setAudienceSearch('');
        setActiveGroupMembersId(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAudienceMenuOpen(false);
        setAudienceSearch('');
        setActiveGroupMembersId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [audienceMenuOpen]);

  // Handle click outside for members dropdown (when it's open independently of main dropdown)
  useEffect(() => {
    if (activeGroupMembersId === null) {
      return;
    }

    const handleClickOutsideMembers = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideMembersDropdown = membersDropdownRef.current?.contains(target);
      const isInsideToggleButton = membersToggleButtonRef.current?.contains(target);

      if (!isInsideMembersDropdown && !isInsideToggleButton) {
        setActiveGroupMembersId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideMembers);

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideMembers);
    };
  }, [activeGroupMembersId]);

  // Fetch group members when member count is clicked
  const fetchGroupMembers = async (groupId: string, event: React.MouseEvent | React.KeyboardEvent) => {
    if (groupMembersData[groupId]) {
      // Already loaded
      if (groupMembersData[groupId].length > 0) {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom,
          left: rect.left
        });
        setActiveGroupMembersId(activeGroupMembersId === groupId ? null : groupId);
      }
      return;
    }

    // Set active group ID immediately to show loading state
    setActiveGroupMembersId(groupId);
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom,
      left: rect.left
    });

    setLoadingGroupMembers(prev => ({ ...prev, [groupId]: true }));

    try {
      const response = await courseService.getProjectGroupMembers(groupId);
      if (response.success && response.result && response.result.length > 0) {
        setGroupMembersData(prev => ({
          ...prev,
          [groupId]: response.result
        }));
        setActiveGroupMembersId(groupId);
      } else {
        setActiveGroupMembersId(null);
      }
    } catch (error) {
      console.error('Failed to fetch group members:', error);
    } finally {
      setLoadingGroupMembers(prev => ({ ...prev, [groupId]: false }));
    }
  };

  const toggleIndividualSelection = (userId: string) => {
    const newSelection: AudienceSelection = {
      ...selectedAudience,
      individualIds: selectedAudience.individualIds.includes(userId)
        ? selectedAudience.individualIds.filter((id) => id !== userId)
        : [...selectedAudience.individualIds, userId],
    };
    onAudienceChange(newSelection);
  };

  const toggleGroupSelection = (groupId: string) => {
    const newSelection: AudienceSelection = {
      ...selectedAudience,
      groupIds: selectedAudience.groupIds.includes(groupId)
        ? selectedAudience.groupIds.filter((id) => id !== groupId)
        : [...selectedAudience.groupIds, groupId],
    };
    onAudienceChange(newSelection);
  };

  const handleAudienceSegmentChange = (segmentId: AudienceSegmentId) => {
    if (segmentId === activeAudienceSegment) {
      return;
    }

    setActiveAudienceSegment(segmentId);
    setAudienceSearch('');
    setActiveGroupMembersId(null);

    if (segmentId === 'all') {
      const newSelection: AudienceSelection = {
        allStaff: true,
        individualIds: [],
        groupIds: [],
      };
      onAudienceChange(newSelection);
      return;
    }

    const newSelection: AudienceSelection = {
      ...selectedAudience,
      allStaff: false,
      // Clear opposite type when switching
      individualIds: segmentId === 'individual-users' ? selectedAudience.individualIds : [],
      groupIds: segmentId === 'project-groups' ? selectedAudience.groupIds : [],
    };
    onAudienceChange(newSelection);
  };


  const menuContent = (
    <div className={cn(
      "rounded-[5px] border border-[#E6E6E6] bg-white",
      !inline && "absolute right-0 z-50 mt-2 w-full",
      inline && "flex flex-col border-none"
    )}>
      <div className="px-2.5 pt-4">
        <div className="flex gap-2 w-full">
          {audienceSegments.map((segment) => {
            const isActive = activeAudienceSegment === segment.id;
            return (
              <button
                key={segment.id}
                type="button"
                onClick={() => handleAudienceSegmentChange(segment.id)}
                className={cn(
                  "flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition cursor-pointer whitespace-nowrap text-center",
                  isActive
                    ? "bg-[#1E88E5] text-white"
                    : "bg-[#232725] text-white"
                )}
              >
                {segment.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-[13px] mx-2.5">
        {activeAudienceSegment === 'all' ? (
          <div className="mb-[13px] aspect-square rounded-[5px] border border-[#E6E6E6] flex flex-col items-center justify-center gap-5">
            <img src={BuildingIcon} className="w-[102px] h-[92px]" alt="Building" />
            <p className="text-[#535352] text-sm font-medium">{AUDIENCE_ALL_STAFF_MESSAGE}</p>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
              <input
                type="search"
                value={audienceSearch}
                onChange={(event) => setAudienceSearch(event.target.value)}
                placeholder={audienceSearchPlaceholder}
                className="w-full h-[38px] rounded-[5px] border border-[#E2E8F0] bg-[#232725] py-0 pl-11 pr-4 text-sm text-white font-medium placeholder:text-white outline-none"
              />
            </div>

            <div className="mt-3 px-2.5 pb-4">
              {activeAudienceSegment === 'individual-users' ? (
                filteredIndividuals.length === 0 ? (
                  <div className="px-3 py-10 text-center text-sm text-[#64748B]">
                    {AUDIENCE_EMPTY_STATE_MESSAGE}
                  </div>
                ) : (
                  <MacScrollbar key="scrollbar-individuals" className="max-h-[300px]">
                    <div>
                      {filteredIndividuals.map((user, index) => {
                        const isSelected = selectedAudience.individualIds.includes(user.id);
                        return (
                          <button
                            key={`user-${user.id}-${index}`}
                            type="button"
                            onClick={() => toggleIndividualSelection(user.id)}
                            className={cn(
                              'flex w-full items-center gap-4 border-b border-[#E6E6E6] p-2.5 text-left transition cursor-pointer',
                              isSelected ? 'bg-[#E1E6EE]' : 'bg-white hover:bg-[#E1E6EE]'
                            )}
                          >
                            <img
                              src={user.avatar || AvatarPlaceholder}
                              alt={`${user.name} avatar`}
                              className="h-10 w-10 rounded-full object-cover"
                              loading="lazy"
                              onError={(e) => { e.currentTarget.src = AvatarPlaceholder; }}
                            />
                            <div className="flex flex-1 flex-col">
                              <span className="text-base font-semibold text-black">{user.name}</span>
                              <span className="text-sm font-normal text-[#535352]">{user.position}</span>
                            </div>
                            {isSelected && (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#9A9A9A]">
                                <X className="h-4 w-4 text-[#9A9A9A]" strokeWidth={2.5} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </MacScrollbar>
                )
              ) : filteredGroups.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm text-[#64748B]">
                  {AUDIENCE_EMPTY_STATE_MESSAGE}
                </div>
              ) : (
                <MacScrollbar key="scrollbar-groups" className="max-h-[300px]">
                  <div>
                    {filteredGroups.map((group, index) => {
                      const isSelected = selectedAudience.groupIds.includes(group.id);
                      const count = group.memberCount !== undefined ? group.memberCount : group.members.length;
                      const memberCountLabel = `${count} ${count === 1 ? 'Member' : 'Members'}`;
                      const showMembers = activeGroupMembersId === group.id;

                      return (
                        <div key={`group-${group.id}-${index}`} className="relative">
                          <button
                            type="button"
                            onClick={() => toggleGroupSelection(group.id)}
                            className={cn(
                              'flex w-full items-center gap-4 border-b border-[#E6E6E6] p-2.5 text-left transition cursor-pointer',
                              isSelected ? 'bg-[#E1E6EE]' : 'bg-white hover:bg-[#E1E6EE]'
                            )}
                          >
                            <div className="h-10 w-10 rounded-full border border-[#E6E6E6] flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
                              <img
                                src={group.iconUrl || group.avatar || AvatarPlaceholder}
                                alt={`${group.name} avatar`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                onError={(e) => { e.currentTarget.src = AvatarPlaceholder; }}
                              />
                            </div>
                            <div className="flex flex-1 items-center justify-between gap-4">
                              <div className="flex flex-col">
                                <span className="text-base font-semibold text-[#0F172A]">{group.name}</span>
                                <div
                                  ref={showMembers ? (el) => { membersToggleButtonRef.current = el; } : null}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    fetchGroupMembers(group.id, event);
                                  }}
                                  className="flex items-center gap-1 mt-1 w-max text-xs text-[#535352] cursor-pointer hover:text-[#2563EB] transition-colors"
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      fetchGroupMembers(group.id, event);
                                    }
                                  }}
                                >
                                  {loadingGroupMembers[group.id] ? (
                                    <Loader2 className="w-[14px] h-[14px] animate-spin" />
                                  ) : (
                                    <Users className="w-[14px] h-[14px]" />
                                  )}
                                  {memberCountLabel}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#9A9A9A]">
                                <X className="h-4 w-4 text-[#9A9A9A]" strokeWidth={2.5} />
                              </span>
                            )}
                          </button>

                          {showMembers && groupMembersData[group.id] && groupMembersData[group.id].length > 0 && createPortal(
                            <div
                              ref={membersDropdownRef}
                              style={{
                                position: 'fixed',
                                top: `${dropdownPosition.top}px`,
                                left: `${dropdownPosition.left}px`,
                                transform: 'translateY(10px)'
                              }}
                              className="rounded-[10px] border-[5px] border-[#E6E6E6] bg-[#2D3857] px-2.5 z-[9999] w-[350px]"
                            >
                              <div className="max-h-48 overflow-y-auto">
                                {groupMembersData[group.id].map((member) => (
                                  <div key={member.userId} className="flex items-center gap-3 border-b border-b-[#E6E6E6] py-2.5">
                                    <div className="h-8 w-8 rounded-full border border-[#E6E6E6] flex items-center justify-center bg-white/10 overflow-hidden shrink-0">
                                      {member.profileUrl ? (
                                        <img
                                          src={member.profileUrl}
                                          alt={`${member.fullName} avatar`}
                                          className="h-full w-full object-cover"
                                          loading="lazy"
                                          onError={(e) => { e.currentTarget.src = AvatarPlaceholder; }}
                                        />
                                      ) : (
                                        <div className="text-[10px] text-white font-bold">{member.fullName.charAt(0)}</div>
                                      )}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                      <span className="text-sm font-semibold text-white">{member.fullName}</span>
                                      <span className="text-xs text-white">{member.designationName}, {member.departmentName}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>,
                            document.body
                          )}
                        </div>
                      );
                    })}
                  </div>
                </MacScrollbar>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (inline) {
    return menuContent;
  }

  return (
    <div className={cn('relative', width, className)} ref={audiencePopoverRef}>
      <button
        type="button"
        onClick={() => !disabled && setAudienceMenuOpen((prev) => !prev)}
        disabled={disabled}
        className={cn(
          width,
          'min-h-[38px] flex items-center justify-between gap-3 rounded-[5px] border px-4 py-2.5 text-left text-sm font-normal not-italic leading-normal transition focus:outline-none',
          disabled ? 'bg-gray-100 cursor-not-allowed border-[#E6E6E6]' : 'cursor-pointer border-[#E6E6E6]',
          error && 'border-red-500',
          Array.isArray(selectedAudienceSummary) && 'px-[7px] py-1'
        )}
        aria-haspopup="dialog"
        aria-expanded={audienceMenuOpen}
      >
        <div className="flex flex-wrap items-center gap-x-[7px] gap-y-[4px]">
          {Array.isArray(selectedAudienceSummary) ? (
            selectedAudienceSummary.map((item, index) => {
              // Handle "more" item
              if (item.type === 'more') {
                return (
                  <span
                    key={`more-${index}`}
                    className="inline-flex items-center gap-1 rounded-[5px] border border-[#E6E6E6] px-[5px] py-[3px] text-xs font-semibold text-black"
                  >
                    {item.label}
                  </span>
                );
              }

              // Handle regular items (all-staff, individual, group)
              const avatar = item.type === 'all-staff' ? null : item.avatar;
              const isGroup = item.type === 'group';

              return (
                <span
                  key={`${item.type}-${item.id || item.label}-${index}`}
                  className="inline-flex items-center gap-1 rounded-[5px] border border-[#E6E6E6] px-[5px] py-[3px] text-xs font-semibold text-black"
                >
                  <div className="flex items-center justify-center rounded-full border-[1.5px] border-[#E6E6E6] w-6 h-6 overflow-hidden bg-gray-50">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={item.label}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = AvatarPlaceholder; }}
                      />
                    ) : isGroup ? (
                      <Users className="w-3.5 h-3.5 text-[#DE4A2C]" />
                    ) : (
                      <svg width="13" height="16" viewBox="0 0 13 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M9.53308 5.71694H13V6.25728C12.0161 6.41815 11.7643 6.65326 11.3653 7.96494C11.0322 8.93426 10.1684 11.6484 8.91716 16H8.13468C7.31734 13.6613 6.55036 11.4174 5.70203 9.02501H5.66716C4.88468 11.4174 4.1177 13.7355 3.40107 16H2.61859C2.16538 14.4161 1.03427 10.5512 0 6.97499V0C0.499702 1.83552 3.19964 11.075 3.71484 12.7992H3.7497C4.46633 10.6089 5.21394 8.21655 5.91508 5.80768H6.63171C7.48391 8.17943 8.31675 10.5883 9.14958 12.8528H9.18445C9.78099 10.9142 10.3814 8.45166 10.5828 7.56896C10.7998 6.65326 10.7339 6.38515 9.53308 6.25728V5.71694Z"
                          fill="#DE4A2C"
                        />
                      </svg>
                    )}
                  </div>
                  {item.label}
                </span>
              );
            })
          ) : (
            <span className={cn('text-sm', selectedAudienceItems.length > 0 ? 'text-black' : 'text-[#535352]')}>
              {selectedAudienceSummary}
            </span>
          )}
        </div>
      </button>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      {audienceMenuOpen && menuContent}
    </div>
  );
};

export default AudienceDropdown;
