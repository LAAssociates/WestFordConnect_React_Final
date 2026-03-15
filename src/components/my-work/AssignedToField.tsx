import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Search, Users } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import type { User } from './types';
import { mockUsers, mockProjectGroups, type ProjectGroup } from './mockData';
import avatarPlaceholder from '../../assets/images/default-group-icon.png';
import { taskService, type ProjectGroupMember } from '../../services/taskService';

interface AssignedToFieldProps {
    assignedTo: User[];
    onAssignedToChange: (users: User[]) => void;
    readOnly?: boolean;
    className?: string;
    users?: User[];
    groups?: ProjectGroup[];
    selectedGroups?: string[];
    onSelectedGroupsChange?: (groups: string[]) => void;
    activeTab?: 'individual' | 'project-groups';
    onActiveTabChange?: (tab: 'individual' | 'project-groups') => void;
}

const AssignedToField: React.FC<AssignedToFieldProps> = ({
    assignedTo,
    onAssignedToChange,
    readOnly = false,
    className = 'w-[399px]',
    users: propUsers,
    groups: propGroups,
    selectedGroups: propSelectedGroups,
    onSelectedGroupsChange,
    activeTab: propActiveTab,
    onActiveTabChange,
}) => {
    const users = propUsers || mockUsers;
    const projectGroups = propGroups || mockProjectGroups;
    const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
    const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
    
    // Internal state as fallback if props are not provided
    const [internalActiveTab, setInternalActiveTab] = useState<'individual' | 'project-groups'>('individual');
    const [internalSelectedGroups, setInternalSelectedGroups] = useState<string[]>([]);
    
    // Use props if provided, otherwise use internal state
    const activeTab = propActiveTab !== undefined ? propActiveTab : internalActiveTab;
    const selectedProjectGroups = propSelectedGroups !== undefined ? propSelectedGroups : internalSelectedGroups;

    const setActiveTab = (tab: 'individual' | 'project-groups') => {
        if (onActiveTabChange) {
            onActiveTabChange(tab);
        } else {
            setInternalActiveTab(tab);
        }
    };

    const setSelectedProjectGroups = (groups: string[] | ((prev: string[]) => string[])) => {
        if (onSelectedGroupsChange) {
            if (typeof groups === 'function') {
                onSelectedGroupsChange(groups(selectedProjectGroups));
            } else {
                onSelectedGroupsChange(groups);
            }
        } else {
            setInternalSelectedGroups(groups);
        }
    };
    const [activeGroupMembersId, setActiveGroupMembersId] = useState<string | null>(null);
    const [groupMembers, setGroupMembers] = useState<Record<string, ProjectGroupMember[]>>({});
    const [isFetchingMembers, setIsFetchingMembers] = useState<Record<string, boolean>>({});
    const assigneeInputRef = useRef<HTMLDivElement>(null);
    const assigneeDropdownRef = useRef<HTMLDivElement>(null);
    const membersDropdownRef = useRef<HTMLDivElement>(null);

    // Sync selectedProjectGroups when assignedTo changes (only if not controlled externally)
    useEffect(() => {
        if (propSelectedGroups !== undefined) return;

        // Determine which project groups are selected based on assignedTo
        const selectedGroups: string[] = [];
        projectGroups.forEach((group) => {
            // Check if all members of this group are in assignedTo
            const allMembersInAssignedTo = group.members.length > 0 && group.members.every((member) => {
                // Try to find by ID first, then by name as fallback
                return assignedTo.some((user) => {
                    if (user.id === member.id) return true;
                    // Also check by name in case IDs don't match
                    return user.name === member.name;
                });
            });
            if (allMembersInAssignedTo) {
                selectedGroups.push(group.id);
            }
        });
        setInternalSelectedGroups(selectedGroups);
    }, [assignedTo, propSelectedGroups, projectGroups]);

    // Close assignee dropdown when clicking outside
    useEffect(() => {
        if (!assigneeDropdownOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                assigneeInputRef.current &&
                !assigneeInputRef.current.contains(event.target as Node) &&
                assigneeDropdownRef.current &&
                !assigneeDropdownRef.current.contains(event.target as Node)
            ) {
                setAssigneeDropdownOpen(false);
                setActiveGroupMembersId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [assigneeDropdownOpen]);

    // Close members dropdown when clicking outside
    useEffect(() => {
        if (!activeGroupMembersId) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // Don't close if clicking inside the members dropdown
            if (membersDropdownRef.current?.contains(target)) {
                return;
            }

            // Don't close if clicking on the Members button
            // The Members button is a button inside a project group item that contains a Users icon
            const clickedButton = target.closest('button');
            if (clickedButton) {
                const buttonText = clickedButton.textContent || '';
                const hasUsersIcon = clickedButton.querySelector('svg');
                const isInProjectGroupItem = clickedButton.closest('.relative'); // Project group items have relative positioning

                // Check if it's the Members button (has Users icon, is in project group, and has member count text)
                if (hasUsersIcon && isInProjectGroupItem && (buttonText.includes('Member'))) {
                    return;
                }
            }

            // Close if clicking anywhere else
            setActiveGroupMembersId(null);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeGroupMembersId]);

    const fetchGroupMembers = async (groupId: string) => {
        // Set loading state immediately for the specific group
        setIsFetchingMembers(prev => ({ ...prev, [groupId]: true }));
        try {
            const response = await taskService.getProjectGroupMembers(parseInt(groupId, 10));
            if (response.success) {
                setGroupMembers(prev => ({ ...prev, [groupId]: response.result }));
            }
        } catch (error) {
            console.error('Failed to fetch group members:', error);
        } finally {
            setIsFetchingMembers(prev => ({ ...prev, [groupId]: false }));
        }
    };

    // Filter users based on search query
    const filteredUsers = users.filter((user) => {
        const query = assigneeSearchQuery.toLowerCase();
        return (
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            (user.position && user.position.toLowerCase().includes(query))
        );
    });

    // Filter project groups based on search query
    const filteredProjectGroups = projectGroups.filter((group) => {
        const query = assigneeSearchQuery.toLowerCase();
        return (
            group.name.toLowerCase().includes(query) ||
            group.members.some((member) =>
                member.name.toLowerCase().includes(query) ||
                member.position.toLowerCase().includes(query)
            )
        );
    });

    const toggleUserSelection = (user: User) => {
        if (assignedTo.find((u) => u.id === user.id)) {
            onAssignedToChange(assignedTo.filter((u) => u.id !== user.id));
        } else {
            onAssignedToChange([...assignedTo, user]);
        }
    };

    const toggleProjectGroupSelection = (group: ProjectGroup) => {
        // Close members dropdown when clicking on a project group
        setActiveGroupMembersId(null);

        const isSelected = isProjectGroupSelected(group);

        if (isSelected) {
            // Remove group - remove all members from assignedTo
            // Check by both ID and name since members might have been matched by name
            const memberIdentifiers = new Set([
                ...group.members.map(m => m.id),
                ...group.members.map(m => m.name)
            ]);

            onAssignedToChange(assignedTo.filter((u) => {
                // Remove if ID or name matches any member
                return !memberIdentifiers.has(u.id) && !memberIdentifiers.has(u.name);
            }));
            setSelectedProjectGroups(selectedProjectGroups.filter(id => id !== group.id));
        } else {
            // Add group - add all members to assignedTo (avoid duplicates)
            const newMembers = group.members
                .map(member => {
                    // Try to find existing user by name first (preferred), then by ID
                    const existingUser = users.find(u =>
                        u.name === member.name || u.id === member.id
                    );
                    if (existingUser) {
                        return existingUser;
                    }
                    // Create a temporary user object for group members not in mockUsers
                    return {
                        id: member.id,
                        name: member.name,
                        position: member.position,
                        email: `${member.name.toLowerCase().replace(/\s+/g, '.')}@westford.edu`,
                        avatar: avatarPlaceholder,
                    } as User;
                })
                .filter(member => {
                    // Check if already in assignedTo by both ID and name
                    return !assignedTo.some(u =>
                        u.id === member.id || u.name === member.name
                    );
                });

            onAssignedToChange([...assignedTo, ...newMembers]);
            setSelectedProjectGroups([...selectedProjectGroups, group.id]);
        }
    };

    const isUserSelected = (user: User) => {
        return assignedTo.some((u) => u.id === user.id);
    };

    const isProjectGroupSelected = (group: ProjectGroup) => {
        // If controlled externally, use the selectedProjectGroups array
        if (propSelectedGroups !== undefined) {
            return propSelectedGroups.includes(group.id);
        }

        // Check if all members of this group are in assignedTo
        if (group.members.length === 0) return false;
        return group.members.every((member) => {
            // Try to find by ID first, then by name as fallback
            return assignedTo.some((user) => {
                if (user.id === member.id) return true;
                // Also check by name in case IDs don't match
                return user.name === member.name;
            });
        });
    };

    // Calculate display items: groups first, then individual users not in groups
    const displayItems = useMemo(() => {
        const items: Array<{ type: 'group'; group: ProjectGroup } | { type: 'user'; user: User }> = [];

        // Add selected groups first
        selectedProjectGroups.forEach((groupId) => {
            const group = projectGroups.find(g => g.id === groupId);
            if (group) {
                items.push({ type: 'group', group });
            }
        });

        // Add individual users that are not part of any selected group
        assignedTo.forEach((user) => {
            // Check if this user is part of any selected group
            const isInGroup = selectedProjectGroups.some((groupId) => {
                const group = projectGroups.find(g => g.id === groupId);
                if (!group) return false;
                return group.members.some((member) =>
                    member.id === user.id || member.name === user.name
                );
            });

            if (!isInGroup) {
                items.push({ type: 'user', user });
            }
        });

        return items;
    }, [selectedProjectGroups, assignedTo]);

    // Show max 3 chips, then "+X more"
    const maxVisibleChips = 3;
    const visibleChips = displayItems.slice(0, maxVisibleChips);
    const remainingCount = displayItems.length - maxVisibleChips;

    if (readOnly) {
        return (
            <div className={cn('flex flex-wrap gap-[7px] border border-[#E6E6E6] rounded-[5px] px-[7px] py-[4px] min-h-[38px]', className)}>
                {visibleChips.map((item) => (
                    <div
                        key={item.type === 'group' ? item.group.id : item.user.id}
                        className="flex items-center gap-[5px] bg-white border border-[#E6E6E6] rounded-[3px] px-[5px] py-[3px]"
                    >
                        {item.type === 'group' ? (
                            <>
                                <div className="flex items-center justify-center rounded-full border-[1.5px] border-[#E6E6E6] w-6 h-6 overflow-hidden bg-gray-50 shrink-0">
                                    {(item.group.iconUrl || item.group.avatar) ? (
                                        <img
                                            src={item.group.iconUrl || item.group.avatar}
                                            alt={item.group.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.currentTarget.src = avatarPlaceholder; }}
                                        />
                                    ) : (
                                        <Users className="w-3.5 h-3.5 text-[#DE4A2C]" />
                                    )}
                                </div>
                                <span className="text-[15px] font-medium text-black">{item.group.name}</span>
                            </>
                        ) : (
                            <>
                                <img
                                    src={item.user.avatar || avatarPlaceholder}
                                    alt={item.user.name}
                                    className="w-6 h-6 rounded-full"
                                    onError={(e) => { e.currentTarget.src = avatarPlaceholder; }}
                                />
                                <span className="text-[15px] font-medium text-black">{item.user.name.split(' ')[0]}</span>
                            </>
                        )}
                    </div>
                ))}
                {remainingCount > 0 && (
                    <div className="flex items-center gap-[5px] bg-white border border-[#E6E6E6] rounded-[3px] px-[5px] py-[3px]">
                        <span className="text-[15px] font-medium text-black">+{remainingCount} more</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={cn('relative', className)}>
            <div
                ref={assigneeInputRef}
                className="flex items-center flex-wrap gap-[7px] border border-[#E6E6E6] rounded-[5px] px-[7px] py-[4px] min-h-[38px] cursor-pointer"
                onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
            >
                {displayItems.length === 0 ? (
                    <span className="text-[15px] text-[#535352]">Select assignee(s)</span>
                ) : (
                    <>
                        {visibleChips.map((item) => (
                            <div
                                key={item.type === 'group' ? item.group.id : item.user.id}
                                className="flex items-center gap-[5px] bg-white border border-[#E6E6E6] rounded-[3px] px-[5px] py-[3px]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {item.type === 'group' ? (
                                    <>
                                        <div className="flex items-center justify-center rounded-full border-[1.5px] border-[#E6E6E6] w-6 h-6 overflow-hidden bg-gray-50 shrink-0">
                                            {(item.group.iconUrl || item.group.avatar) ? (
                                                <img
                                                    src={item.group.iconUrl || item.group.avatar}
                                                    alt={item.group.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.currentTarget.src = avatarPlaceholder; }}
                                                />
                                            ) : (
                                                <Users className="w-3.5 h-3.5 text-[#DE4A2C]" />
                                            )}
                                        </div>
                                        <span className="text-[15px] font-medium text-black">{item.group.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <img
                                            src={item.user.avatar || avatarPlaceholder}
                                            alt={item.user.name}
                                            className="w-6 h-6 rounded-full"
                                            onError={(e) => { e.currentTarget.src = avatarPlaceholder; }}
                                        />
                                        <span className="text-[15px] font-medium text-black">{item.user.name}</span>
                                    </>
                                )}
                            </div>
                        ))}
                        {remainingCount > 0 && (
                            <div
                                className="flex items-center gap-[5px] bg-white border border-[#E6E6E6] rounded-[3px] px-[5px] py-[3px]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span className="text-[15px] font-medium text-black">+{remainingCount} more</span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Dropdown */}
            {assigneeDropdownOpen && (
                <div
                    ref={assigneeDropdownRef}
                    className="absolute top-full mt-1 left-0 bg-white border border-[#E6E6E6] rounded-[5px] shadow-lg z-50 w-full"
                >
                    {/* Tabs */}
                    <div className="flex justify-center items-center gap-[8px] pt-[12px] pb-0">
                        <button
                            type="button"
                            onClick={() => {
                                if (activeTab === 'project-groups') {
                                    // Switching from project-groups to individual - remove all project groups
                                    let newAssignedTo = [...assignedTo];
                                    selectedProjectGroups.forEach((groupId) => {
                                        const group = projectGroups.find(g => g.id === groupId);
                                        if (group) {
                                            const memberIdentifiers = new Set([
                                                ...group.members.map(m => m.id),
                                                ...group.members.map(m => m.name)
                                            ]);
                                            newAssignedTo = newAssignedTo.filter((u) => {
                                                return !memberIdentifiers.has(u.id) && !memberIdentifiers.has(u.name);
                                            });
                                        }
                                    });
                                    onAssignedToChange(newAssignedTo);
                                }
                                setActiveTab('individual');
                            }}
                            className={cn(
                                'px-[15px] py-[5px] rounded-[25px] text-[14px] font-semibold text-white tracking-[0.7px] transition-colors',
                                activeTab === 'individual' ? 'bg-[#1e88e5]' : 'bg-[#232725] cursor-pointer hover:opacity-90'
                            )}
                        >
                            Individual Users
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (activeTab === 'individual') {
                                    // Switching from individual to project-groups - remove all individual users
                                    // Keep only users that are part of selected groups
                                    const usersInGroups = new Set<string>();
                                    selectedProjectGroups.forEach((groupId) => {
                                        const group = projectGroups.find(g => g.id === groupId);
                                        if (group) {
                                            group.members.forEach((member) => {
                                                usersInGroups.add(member.id);
                                                usersInGroups.add(member.name);
                                            });
                                        }
                                    });
                                    const newAssignedTo = assignedTo.filter((u) => {
                                        return usersInGroups.has(u.id) || usersInGroups.has(u.name);
                                    });
                                    onAssignedToChange(newAssignedTo);
                                }
                                setActiveTab('project-groups');
                            }}
                            className={cn(
                                'px-[15px] py-[5px] rounded-[25px] text-[14px] font-semibold text-white tracking-[0.7px] transition-colors',
                                activeTab === 'project-groups' ? 'bg-[#1e88e5]' : 'bg-[#232725] cursor-pointer hover:opacity-90'
                            )}
                        >
                            Project Groups
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="px-[10px] pt-[13px] pb-[12px]">
                        <div className="bg-[#232725] border border-[#CACACA] rounded-[5px] px-[15px] py-[10px] flex items-center gap-[10px]">
                            <Search className="w-[18px] h-[18px] text-white shrink-0" />
                            <input
                                type="text"
                                value={assigneeSearchQuery}
                                onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                                placeholder={activeTab === 'individual' ? 'Search people by name or email' : 'Search project groups'}
                                className="bg-transparent border-none outline-none text-[14px] font-medium text-white placeholder:text-white flex-1"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* User List */}
                    {activeTab === 'individual' && (
                        <div className="max-h-[340px] overflow-y-auto px-[9px] pb-[9px]">
                            {filteredUsers.map((user, index) => {
                                const isSelected = isUserSelected(user);
                                return (
                                    <div key={user.id} className="relative">
                                        <button
                                            type="button"
                                            onClick={() => toggleUserSelection(user)}
                                            className={cn(
                                                'w-full flex items-center gap-[10px] px-[10px] py-[10px] transition-colors cursor-pointer',
                                                isSelected ? 'bg-[#E1E6EE]' : 'hover:bg-gray-50'
                                            )}
                                        >
                                            <img
                                                src={user.avatar || avatarPlaceholder}
                                                alt={user.name}
                                                className="w-12 h-12 rounded-full shrink-0"
                                                onError={(e) => { e.currentTarget.src = avatarPlaceholder; }}
                                            />
                                            <div className="flex-1 text-left">
                                                <div className="text-[16px] font-semibold text-black">{user.name === 'You' ? 'You' : user.name}</div>
                                                <div className="text-[14px] font-normal text-[#535352]">{user.position}</div>
                                            </div>
                                            <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                                {isSelected && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleUserSelection(user);
                                                        }}
                                                        className="cursor-pointer flex items-center justify-center"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                            <path d="M12 0C5.31429 0 0 5.31429 0 12C0 18.6857 5.31429 24 12 24C18.6857 24 24 18.6857 24 12C24 5.31429 18.6857 0 12 0ZM12 22.2857C6.34286 22.2857 1.71429 17.6571 1.71429 12C1.71429 6.34286 6.34286 1.71429 12 1.71429C17.6571 1.71429 22.2857 6.34286 22.2857 12C22.2857 17.6571 17.6571 22.2857 12 22.2857Z" fill="#9A9A9A" />
                                                            <path d="M16.6286 18L12 13.3714L7.37143 18L6 16.6286L10.6286 12L6 7.37143L7.37143 6L12 10.6286L16.6286 6L18 7.37143L13.3714 12L18 16.6286L16.6286 18Z" fill="#9A9A9A" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </button>
                                        {index < filteredUsers.length - 1 && (
                                            <div className="absolute bottom-0 left-0 right-0 h-px bg-[#CACACA]" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'project-groups' && (
                        <div className="max-h-[340px] overflow-y-auto px-[9px] pb-[9px]">
                            {filteredProjectGroups.length === 0 ? (
                                <div className="text-[14px] text-[#535352] px-[10px] py-[20px] text-center">
                                    No project groups found
                                </div>
                            ) : (
                                filteredProjectGroups.map((group) => {
                                    const isSelected = isProjectGroupSelected(group);
                                    const count = group.memberCount ?? group.members.length;
                                    const memberCountLabel = `${count} ${count === 1 ? 'Member' : 'Members'}`;
                                    const showMembers = activeGroupMembersId === group.id;

                                    return (
                                        <div key={group.id} className="relative">
                                            <div
                                                onClick={async () => {
                                                    console.log('Project group clicked:', group.id);
                                                    toggleProjectGroupSelection(group);
                                                }}
                                                className={cn(
                                                    'flex w-full items-center gap-4 border-b border-[#E6E6E6] p-2.5 text-left transition cursor-pointer',
                                                    isSelected ? 'bg-[#E1E6EE]' : 'bg-white hover:bg-[#E1E6EE]'
                                                )}
                                            >
                                                <div className="flex items-center justify-center rounded-full border-[1.5px] border-[#E6E6E6] h-10 w-10 overflow-hidden bg-gray-50 shrink-0">
                                                    {(group.iconUrl || group.avatar) ? (
                                                        <img
                                                            src={group.iconUrl || group.avatar}
                                                            alt={group.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.currentTarget.src = avatarPlaceholder; }}
                                                        />
                                                    ) : (
                                                        <Users className="w-5 h-5 text-[#DE4A2C]" />
                                                    )}
                                                </div>
                                                <div className="flex flex-1 items-center justify-between gap-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-base font-semibold text-[#0F172A]">{group.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={async (event) => {
                                                                event.stopPropagation();
                                                                console.log('Member count clicked for group:', group.id);
                                                                if (activeGroupMembersId === group.id) {
                                                                    setActiveGroupMembersId(null);
                                                                } else {
                                                                    setActiveGroupMembersId(group.id);
                                                                    if (!groupMembers[group.id]) {
                                                                        await fetchGroupMembers(group.id);
                                                                    }
                                                                }
                                                            }}
                                                            className="flex items-center gap-1 mt-1 w-max text-xs text-[#535352] cursor-pointer"
                                                        >
                                                            <Users className='w-[14px] h-[14px]' />
                                                            {memberCountLabel}
                                                        </button>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#9A9A9A]">
                                                        <X className="h-4 w-4 text-[#9A9A9A]" strokeWidth={2.5} />
                                                    </span>
                                                )}
                                            </div>

                                            {showMembers && (
                                                <div
                                                    ref={membersDropdownRef}
                                                    className="absolute left-0 rounded-[10px] border-[5px] border-[#E6E6E6] bg-[#2D3857] px-2.5 z-50 w-[300px]"
                                                >
                                                    <div className="max-h-48 overflow-y-auto">
                                                        {isFetchingMembers[group.id] ? (
                                                            <div className="py-2.5 text-center text-xs text-white">Loading...</div>
                                                        ) : (groupMembers[group.id] || []).length === 0 ? (
                                                            <div className="py-2.5 text-center text-xs text-white">No members found</div>
                                                        ) : (
                                                            (groupMembers[group.id] || []).map((member) => (
                                                                <div key={member.userId} className="flex items-center gap-3 border-b border-b-[#E6E6E6] py-2.5 last:border-0">
                                                                    <img
                                                                        src={member.profileUrl || avatarPlaceholder}
                                                                        alt={`${member.fullName} avatar`}
                                                                        className="h-8 w-8 rounded-full object-cover"
                                                                        onError={(e) => { e.currentTarget.src = avatarPlaceholder; }}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-semibold text-white">{member.fullName}</span>
                                                                        <span className="text-xs text-white">{member.designationName} - {member.departmentName}</span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AssignedToField;

