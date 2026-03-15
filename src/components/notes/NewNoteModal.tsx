import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, Share2, Search, Check, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import avatarPlaceholder from '../../assets/images/default-group-icon.png';
import { noteService } from '../../services/noteService';

interface Person {
    id: string;
    name: string;
    position: string;
    email: string;
    avatar?: string;
}

interface SharedPerson {
    id: string;
    permission: 'view' | 'edit';
}

interface NewNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (noteData: { title: string; content: string; pinned?: boolean; favorited?: boolean; hasReminder?: boolean; sharedWith?: SharedPerson[] }) => Promise<void> | void;
    onSaveDraft?: (noteData: { title: string; content: string }) => void;
    users?: Person[];
}

const NewNoteModal: React.FC<NewNoteModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onSaveDraft,
    users = [],
}) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [pinned, setPinned] = useState(false);
    const [favorited, setFavorited] = useState(false);
    const [hasReminder, setHasReminder] = useState(false);
    const [draftSaved, setDraftSaved] = useState(false);
    const [sharePanelOpen, setSharePanelOpen] = useState(false);
    const [peopleSearch, setPeopleSearch] = useState('');
    const [sharedPeople, setSharedPeople] = useState<SharedPerson[]>([]);
    const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
    const [isSaving, setIsSaving] = useState(false);
    
    // State for local users fetched via API if prop is empty
    const [fetchedUsers, setFetchedUsers] = useState<Person[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // Auto-save draft
    useEffect(() => {
        if (!isOpen) return;

        const draftTimer = setTimeout(() => {
            if (title.trim() || content.trim()) {
                onSaveDraft?.({ title, content });
                setDraftSaved(true);
            }
        }, 1000);

        return () => clearTimeout(draftTimer);
    }, [title, content, isOpen, onSaveDraft]);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setTitle('');
            setContent('');
            setPinned(false);
            setFavorited(false);
            setHasReminder(false);
            setDraftSaved(false);
            setSharePanelOpen(false);
            setPeopleSearch('');
            setSharedPeople([]);
            setErrors({});
            setFetchedUsers([]);
        }
    }, [isOpen]);

    // Fetch initial users if not provided
    useEffect(() => {
        if (isOpen && users.length === 0 && sharePanelOpen && fetchedUsers.length === 0 && !isLoadingUsers) {
            const fetchUsers = async () => {
                setIsLoadingUsers(true);
                try {
                    const res = await noteService.getInitialLoad();
                    if (res.success && res.result) {
                        const allUsers = [...(res.result.createdBy || []), ...(res.result.assignedTo || [])];
                        // Deduplicate by ID
                        const uniqueUsers = Array.from(new Map(allUsers.map(u => [u.id, u])).values());
                        const mappedUsers: Person[] = uniqueUsers.map(u => ({
                            id: u.id.toString(),
                            name: u.name,
                            position: u.designation,
                            email: '', // Email not provided in bootstrap data, but required by Person type
                            avatar: u.profileImageUrl || avatarPlaceholder
                        }));
                        setFetchedUsers(mappedUsers);
                    }
                } catch (error) {
                    console.error('Failed to load users:', error);
                } finally {
                    setIsLoadingUsers(false);
                }
            };
            fetchUsers();
        }
    }, [isOpen, users.length, sharePanelOpen, fetchedUsers.length, isLoadingUsers]);

    // Filter people based on search
    const filteredPeople = useMemo(() => {
        const sourceUsers = users.length > 0 ? users : fetchedUsers;
        
        if (!peopleSearch.trim()) {
            return sourceUsers;
        }

        const query = peopleSearch.trim().toLowerCase();
        return sourceUsers.filter((person) => {
            return (
                person.name.toLowerCase().includes(query) ||
                (person.email && person.email.toLowerCase().includes(query)) ||
                (person.position && person.position.toLowerCase().includes(query))
            );
        });
    }, [peopleSearch, users, fetchedUsers]);

    const togglePersonSelection = (personId: string) => {
        setSharedPeople((prev) => {
            const existing = prev.find((p) => p.id === personId);
            if (existing) {
                return prev.filter((p) => p.id !== personId);
            } else {
                return [...prev, { id: personId, permission: 'view' as const }];
            }
        });
    };

    const updatePersonPermission = (personId: string, permission: 'view' | 'edit') => {
        setSharedPeople((prev) => {
            const existing = prev.find((p) => p.id === personId);
            if (existing) {
                return prev.map((p) => (p.id === personId ? { ...p, permission } : p));
            } else {
                return [...prev, { id: personId, permission }];
            }
        });
    };

    const handleSave = async () => {
        const newErrors: { title?: string; content?: string } = {};
        if (!title.trim()) {
            newErrors.title = "Title is required";
        }
        if (!content.trim()) {
            newErrors.content = "Note is required";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSaving(true);
        try {
            await onSave?.({
                title: title.trim(),
                content: content.trim(),
                pinned,
                favorited,
                hasReminder,
                sharedWith: sharedPeople.length > 0 ? sharedPeople : undefined,
            });
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4" onClick={handleClose}>
            <div
                className={cn(
                    "relative bg-white rounded-[10px] shadow-xl transition-all duration-300 flex",
                    sharePanelOpen ? "w-full max-w-[924px]" : "w-full max-w-[485px]"
                )}
                onClick={(e) => e.stopPropagation()}
                style={{ minHeight: 'fit-content' }}
            >
                {/* Main Note Section */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-4 pr-10">
                        <div className="flex items-center gap-2.5">
                            <div className="size-[21px]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
                                    <path d="M1.72754 17.7725H7.6377C7.7231 18.4444 7.83459 19.039 7.93652 19.5H1.72754C1.26944 19.5 0.829786 19.3181 0.505859 18.9941C0.181933 18.6702 0 18.2306 0 17.7725V3.9541H1.72754V17.7725ZM19 5.68164V8.81348C17.3206 8.51674 11.8417 7.79977 9.21582 10.4902C7.81211 11.9285 7.46406 14.0954 7.50488 16.0459H5.18164C4.7236 16.0459 4.28482 15.8629 3.96094 15.5391C3.63705 15.2152 3.45415 14.7764 3.4541 14.3184V2.22754C3.4541 1.76944 3.63701 1.32979 3.96094 1.00586C4.2848 0.682141 4.72373 0.500047 5.18164 0.5H13.8184L19 5.68164ZM12.9541 6.5459H17.7041L12.9541 1.7959V6.5459Z" fill="#1E88E5" />
                                    <path d="M19 15.6429H15.1429V19.5H13.8571V15.6429H10V14.3571H13.8571V10.5H15.1429V14.3571H19V15.6429Z" fill="#1E88E5" />
                                </svg>
                            </div>
                            <h2 className="text-[18px] font-semibold text-black">New Note</h2>
                        </div>

                        {/* Action Icons */}
                        <div className="flex items-center gap-[15px]">
                            <button
                                type="button"
                                onClick={() => setPinned(!pinned)}
                                className={cn(
                                    'cursor-pointer size-[30px] flex items-center justify-center rounded-full transition',
                                    pinned ? 'bg-[#e6e6e6]' : 'hover:bg-[#f5f5f5]'
                                )}
                                aria-label="Pin note"
                            >
                                {pinned ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M3.4375 0.53125L18.9599 16.0537" stroke="black" stroke-width="1.5" />
                                        <path d="M12.7861 10.9404L11.1787 12.5479C11.2559 12.7736 11.313 13.0056 11.3486 13.2432C11.3843 13.4809 11.4014 13.7193 11.4014 13.957C11.4014 14.3432 11.3634 14.6939 11.2861 15.0088C11.2089 15.3238 11.0987 15.6211 10.9561 15.9004C10.8134 16.1797 10.6348 16.4438 10.4209 16.6934C10.207 16.9429 9.97228 17.2014 9.7168 17.4688L6.27539 14.0283L1.21191 19.1006L0 19.502L0.401367 18.2891L5.47363 13.2256L2.03223 9.78516L2.43359 9.38379C2.84961 8.96778 3.32548 8.64958 3.86035 8.42969C4.39511 8.20989 4.95955 8.09961 5.55371 8.09961C6.04102 8.09961 6.50742 8.17468 6.95312 8.32324L8.56055 6.71484L12.7861 10.9404ZM17.7402 7.91309C17.5441 8.1092 17.3532 8.28681 17.1689 8.44727C16.9848 8.60767 16.7918 8.74738 16.5898 8.86621C16.3879 8.98502 16.1711 9.07151 15.9395 9.125C15.7077 9.17849 15.4398 9.21175 15.1367 9.22363C14.9348 9.22362 14.7417 9.20554 14.5576 9.16992L14.4023 9.32422L10.1768 5.09863L10.332 4.94434C10.2964 4.76025 10.2783 4.56713 10.2783 4.36523C10.2783 4.07403 10.3078 3.81186 10.3672 3.58008C10.4266 3.34846 10.516 3.12878 10.6348 2.9209C10.7536 2.71289 10.8904 2.51911 11.0449 2.34082C11.1994 2.16256 11.3809 1.96968 11.5889 1.76172L17.7402 7.91309Z" fill="black" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                        <path d="M18 6.24121C17.801 6.4402 17.608 6.62111 17.4211 6.78392C17.2342 6.94673 17.0382 7.08844 16.8332 7.20904C16.6281 7.32965 16.408 7.41709 16.1729 7.47136C15.9377 7.52563 15.6663 7.55879 15.3588 7.57085C15.1538 7.57085 14.9578 7.55276 14.7709 7.51658L11.3427 10.9447C11.4211 11.1739 11.4784 11.409 11.5146 11.6503C11.5508 11.8915 11.5688 12.1327 11.5688 12.3739C11.5688 12.7658 11.5296 13.1216 11.4513 13.4412C11.3729 13.7608 11.2613 14.0623 11.1166 14.3457C10.9719 14.6291 10.791 14.8975 10.5739 15.1508C10.3568 15.404 10.1186 15.6663 9.8593 15.9377L6.36784 12.4462L1.23015 17.593L0 18L0.407035 16.7698L5.55377 11.6322L2.06231 8.1407L2.46935 7.73367C2.89146 7.31156 3.37387 6.98895 3.91658 6.76583C4.4593 6.54271 5.03216 6.43116 5.63518 6.43116C6.12965 6.43116 6.60301 6.50653 7.05528 6.65729L10.4834 3.22915C10.4472 3.04221 10.4291 2.84623 10.4291 2.64121C10.4291 2.34573 10.4593 2.0804 10.5196 1.84523C10.5799 1.61005 10.6704 1.38693 10.791 1.17588C10.9116 0.964824 11.0503 0.768844 11.207 0.58794C11.3638 0.407035 11.5477 0.211055 11.7588 0L18 6.24121Z" fill="black" />
                                    </svg>
                                )}
                                {/* <Pin className={cn('w-[18px] h-[18px]', pinned ? 'fill-black text-black' : 'text-black')} /> */}
                            </button>
                            <button
                                type="button"
                                onClick={() => setHasReminder(!hasReminder)}
                                className={cn(
                                    'cursor-pointer size-[30px] flex items-center justify-center rounded-full transition relative',
                                    hasReminder ? 'bg-[#e6e6e6]' : 'hover:bg-[#f5f5f5]'
                                )}
                                aria-label="Set reminder"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
                                    <path d="M23.625 20.075L22.25 19.3875V17.75C22.2484 16.7761 21.9025 15.8341 21.2734 15.0905C20.6444 14.347 19.7727 13.8498 18.8125 13.6869V12.25H17.4375V13.6869C16.4773 13.8498 15.6056 14.347 14.9766 15.0905C14.3475 15.8341 14.0016 16.7761 14 17.75V19.3875L12.625 20.075V23.25H16.75V24.625H19.5V23.25H23.625V20.075ZM22.25 21.875H14V20.925L15.375 20.2375V17.75C15.375 17.0207 15.6647 16.3212 16.1805 15.8055C16.6962 15.2897 17.3957 15 18.125 15C18.8543 15 19.5538 15.2897 20.0695 15.8055C20.5853 16.3212 20.875 17.0207 20.875 17.75V20.2375L22.25 20.925V21.875Z" fill="#DE4A2C" />
                                    <path d="M22.25 8.125C22.25 7.76033 22.1051 7.41059 21.8473 7.15273C21.5894 6.89487 21.2397 6.75 20.875 6.75H18.125V5.375H16.75V6.75H11.25V5.375H9.875V6.75H7.125C6.76033 6.75 6.41059 6.89487 6.15273 7.15273C5.89487 7.41059 5.75 7.76033 5.75 8.125V21.875C5.75 22.2397 5.89487 22.5894 6.15273 22.8473C6.41059 23.1051 6.76033 23.25 7.125 23.25H9.875V21.875H7.125V8.125H9.875V9.5H11.25V8.125H16.75V9.5H18.125V8.125H20.875V12.25H22.25V8.125Z" fill="black" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFavorited(!favorited)}
                                className={cn(
                                    'cursor-pointer size-[30px] flex items-center justify-center rounded-full transition',
                                    favorited ? 'bg-[#e6e6e6]' : 'hover:bg-[#f5f5f5]'
                                )}
                                aria-label="Favorite note"
                            >
                                <Star className={cn('w-[18px] h-[18px]', favorited ? 'fill-yellow-400 text-yellow-400' : 'text-black')} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setSharePanelOpen(!sharePanelOpen)}
                                className={cn(
                                    'cursor-pointer size-[30px] flex items-center justify-center rounded-full transition',
                                    sharePanelOpen ? 'bg-[#e6e6e6]' : 'hover:bg-[#f5f5f5]'
                                )}
                                aria-label="Share note"
                            >
                                <Share2 className="w-[18px] h-[18px] text-black stroke-3" />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            className="size-[20px] flex items-center justify-center rounded-full bg-black text-white hover:opacity-90 transition cursor-pointer absolute top-1.5 right-1.5"
                            aria-label="Close"
                        >
                            <X className="w-3 h-3 stroke-3" />
                        </button>

                    </div>
                    {/* Form Fields */}
                    <div className="px-5 pb-5 flex-1 flex flex-col">
                        {/* Title Field */}
                        <div className="mb-4">
                            <label className="block text-[15px] font-semibold text-black mb-[5px]">
                                Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    if (errors.title) setErrors({ ...errors, title: undefined });
                                }}
                                placeholder="Add a title..."
                                className={cn(
                                    "w-full border border-solid rounded-[5px] px-[10px] py-[10px] text-[15px] font-normal focus:outline-none focus:border-[#1e88e5]",
                                    errors.title ? "border-red-500 text-red-900 focus:border-red-500" : "border-[#e6e6e6] text-[#535352] placeholder:text-[#535352]"
                                )}
                            />
                            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                        </div>

                        {/* Note Field */}
                        <div className="flex-1">
                            <label className="block text-[15px] font-semibold text-black mb-[5px]">
                                Note
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => {
                                    setContent(e.target.value);
                                    if (errors.content) setErrors({ ...errors, content: undefined });
                                }}
                                placeholder="Start typing your note..."
                                rows={10}
                                className={cn(
                                    "w-full border border-solid rounded-[5px] px-[10px] py-[10px] text-[15px] font-normal focus:outline-none focus:border-[#1e88e5] resize-none",
                                    errors.content ? "border-red-500 text-red-900 focus:border-red-500" : "border-[#e6e6e6] text-[#535352] placeholder:text-[#535352]"
                                )}
                            />
                            {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
                        </div>

                        {/* Footer */}
                        {draftSaved ? (
                            <div className="pt-[10px] pb-[22px]">
                                <p className="text-[12px] font-medium italic text-[#535352]">
                                    Draft saved
                                </p>
                            </div>
                        ) : (
                            <div className="py-9"></div>
                        )}
                        <div className="absolute bottom-5 right-5 flex items-center gap-5 ml-auto">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="border border-[#cacaca] border-solid px-[25px] py-[10px] rounded-[25px] text-[14px] font-semibold text-black hover:bg-[#f5f5f5] transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-[#de4a2c] flex items-center justify-center w-[133px] px-[25px] py-[10px] rounded-[25px] text-[14px] font-semibold text-white hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>

                {/* Share Panel */}
                <div
                    className={cn(
                        "overflow-hidden transition-[width,max-width] duration-300 bg-white rounded-br-[10px] rounded-tr-[10px] flex flex-col",
                        sharePanelOpen
                            ? "w-[439px] max-w-[439px] border-l-2 border-[#e6e6e6]"
                            : "w-0 max-w-0 pointer-events-none border-l-0"
                    )}
                >
                    <div className="w-[439px] px-5 py-1.5 flex flex-col h-full">
                        {/* Search Section */}
                        <div className="px-2.5 py-3 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-[15px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white pointer-events-none" />
                                <input
                                    type="text"
                                    value={peopleSearch}
                                    onChange={(e) => setPeopleSearch(e.target.value)}
                                    placeholder="Search people by name or email"
                                    className="w-full h-[40px] bg-[#232725] border border-[#cacaca] rounded-[5px] px-[15px] pl-[43px] py-[10px] text-[14px] font-medium text-white placeholder:text-white outline-none"
                                />
                            </div>
                        </div>

                        {/* People List */}
                        <div className="flex-1 overflow-y-auto px-2.5 max-h-[324px]">
                            {isLoadingUsers ? (
                                <div className="px-3 py-10 text-center text-sm flex flex-col items-center justify-center text-[#64748B]">
                                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                    <span>Loading users...</span>
                                </div>
                            ) : filteredPeople.length === 0 ? (
                                <div className="px-3 py-10 text-center text-sm text-[#64748B]">
                                    No matches found. Try a different search term.
                                </div>
                            ) : (
                                <div className="rounded-[3px]">
                                    {filteredPeople.map((person, index) => {
                                        const isSelected = sharedPeople.some((p) => p.id === person.id);
                                        return (
                                            <div key={person.id}>
                                                {index > 0 && (
                                                    <div className="h-px bg-[#E6E6E6] w-full" />
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => togglePersonSelection(person.id)}
                                                    className={cn(
                                                        'relative w-full flex items-center gap-[10px] p-[10px] text-left transition cursor-pointer',
                                                        isSelected ? 'bg-[#E1E6EE]' : 'bg-white hover:bg-[#E1E6EE]'
                                                    )}
                                                >
                                                    <div className="relative shrink-0">
                                                        <img
                                                            src={person.avatar || avatarPlaceholder}
                                                            alt={`${person.name} avatar`}
                                                            className="h-12 w-12 rounded-full object-cover"
                                                            onError={(e) => { e.currentTarget.src = avatarPlaceholder; }}
                                                        />
                                                        {person.id === 'user-1' && (
                                                            <div className="absolute bottom-0 right-0 size-[13px] bg-green-500 rounded-full border-2 border-white" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-1 flex-col min-w-0">
                                                        <span className="text-[16px] font-semibold text-black truncate">
                                                            {person.name}
                                                        </span>
                                                        <span className="text-[14px] font-normal text-[#535352] truncate">
                                                            {person.position}
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                                            <path d="M12 0C5.31429 0 0 5.31429 0 12C0 18.6857 5.31429 24 12 24C18.6857 24 24 18.6857 24 12C24 5.31429 18.6857 0 12 0ZM12 22.2857C6.34286 22.2857 1.71429 17.6571 1.71429 12C1.71429 6.34286 6.34286 1.71429 12 1.71429C17.6571 1.71429 22.2857 6.34286 22.2857 12C22.2857 17.6571 17.6571 22.2857 12 22.2857Z" fill="#9A9A9A" />
                                                            <path d="M16.6286 18L12 13.3714L7.37143 18L6 16.6286L10.6286 12L6 7.37143L7.37143 6L12 10.6286L16.6286 6L18 7.37143L13.3714 12L18 16.6286L16.6286 18Z" fill="#9A9A9A" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Permissions Section */}
                        <div className="px-[10px] pt-[20px] pb-[35px] shrink-0">
                            <div className="flex items-center gap-[25px]">
                                <p className="text-[15px] font-semibold text-black">Permissions:</p>
                                <div className="flex items-center gap-[25px]">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            sharedPeople.forEach((sp) => {
                                                updatePersonPermission(sp.id, 'view');
                                            });
                                        }}
                                        className={cn(
                                            'flex items-center gap-1 text-[14px] font-medium transition cursor-pointer',
                                            sharedPeople.length > 0 && sharedPeople.every((sp) => sp.permission === 'view')
                                                ? 'text-[#535352]'
                                                : 'text-[#535352] hover:text-black'
                                        )}
                                    >
                                        <div className={cn(
                                            'size-[17px] rounded-full flex items-center justify-center transition-colors',
                                            sharedPeople.length > 0 && sharedPeople.every((sp) => sp.permission === 'view')
                                                ? 'bg-[#0198F1]'
                                                : 'bg-[#D9D9D9]'
                                        )}>
                                            {sharedPeople.length > 0 && sharedPeople.every((sp) => sp.permission === 'view') && (
                                                <Check className="text-white w-4 h-4" strokeWidth={3} />
                                            )}
                                        </div>
                                        View
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            sharedPeople.forEach((sp) => {
                                                updatePersonPermission(sp.id, 'edit');
                                            });
                                        }}
                                        className={cn(
                                            'flex items-center gap-1 text-[14px] font-medium transition cursor-pointer',
                                            sharedPeople.length > 0 && sharedPeople.every((sp) => sp.permission === 'edit')
                                                ? 'text-[#535352]'
                                                : 'text-[#535352] hover:text-black'
                                        )}
                                    >
                                        <div className={cn(
                                            'size-[17px] rounded-full flex items-center justify-center transition-colors',
                                            sharedPeople.length > 0 && sharedPeople.every((sp) => sp.permission === 'edit')
                                                ? 'bg-[#0198F1]'
                                                : 'bg-[#D9D9D9]'
                                        )}>
                                            {sharedPeople.length > 0 && sharedPeople.every((sp) => sp.permission === 'edit') && (
                                                <Check className="text-white w-4 h-4" strokeWidth={3} />
                                            )}
                                        </div>
                                        Edit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default NewNoteModal;

