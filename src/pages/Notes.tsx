import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { AppLayoutContext } from '../components/layout/AppLayout';
import NoteCard from '../components/notes/NoteCard';
import ReminderCard from '../components/notes/ReminderCard';
import NewNoteModal from '../components/notes/NewNoteModal';
import ReminderPopup from '../components/notes/ReminderPopup';
import SetReminderModal from '../components/notes/SetReminderModal';
import DeleteNoteModal from '../components/notes/DeleteNoteModal';
import CustomToast from '../components/common/CustomToast';
import CategorySkeleton from '../components/notes/CategorySkeleton';
import NoteCardSkeleton from '../components/notes/NoteCardSkeleton';
import ReminderCardSkeleton from '../components/notes/ReminderCardSkeleton';
import type { Note, NoteFilter, SharedPerson } from '../components/notes/types';
import type { Reminder, ReminderFilter } from '../components/notes/reminderTypes';
import { cn } from '../lib/utils/cn';
import { Search, Star, Share2, Plus, Edit, Loader2 } from 'lucide-react';
import notesIcon from '../assets/icons/navigation/notes.svg';
import avatarPlaceholder from '../assets/images/avatar-placeholder-2.png';
import reminderIcon from '../assets/icons/notes/reminders.png';
import FilterPopover, { type FilterState } from '../components/common/FilterPopover';
import SortPopover from '../components/common/SortPopover';
import { noteService } from '../services/noteService';
import { reminderService } from '../services/reminderService';
import { authService } from '../services/authService';
import type {
  NoteBootstrapResult,
  NoteCategoryMenuItem,
  NoteGetAllRequest,
} from '../types/note';
import { formatToDateTimeOffset } from '../utils/dateUtils';

const formatNoteDate = (d: Date) => `${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'short' })} ${d.getFullYear()} `;
const formatTime = (d: Date) => {
  const hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins} ${ampm} `;
};

const mapApiNoteToUI = (item: any): Note => {
  const createdDate = new Date(item.createdOn);
  return {
    id: item.noteId.toString(),
    title: item.title,
    content: item.notes,
    author: {
      id: item.createdBy.toString(),
      name: item.createdByName,
      avatar: item.loginUserProfileImageUrl || avatarPlaceholder,
    },
    createdAt: createdDate,
    formattedDate: formatNoteDate(createdDate),
    formattedTime: formatTime(createdDate),
    pinned: item.isPinned,
    favorited: item.isFavourite,
    hasReminder: item.hasReminder,
    reminderDate: item.reminderDateTime ? new Date(item.reminderDateTime) : undefined,
    isShared: item.isSharedNote
  };
};

const formatReminderDate = (d: Date) => `${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'short' })} `;
const mapApiNoteToUIReminder = (n: Note): Reminder => {
  const rDate = n.reminderDate || new Date();
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    author: n.author,
    dueDate: rDate,
    formattedDate: formatReminderDate(rDate),
    formattedTime: formatTime(rDate),
    status: (n.reminderDate && n.reminderDate < new Date()) ? 'missed' : 'upcoming',
    noteId: n.id,
    pinned: n.pinned,
    favorited: n.favorited,
    isShared: n.isShared
  };
};

const Notes: React.FC = () => {
  const { setPageTitle } = useOutletContext<AppLayoutContext>();
  const [activeTab, setActiveTab] = useState<'notes' | 'reminders'>('notes');
  const [activeFilter, setActiveFilter] = useState<NoteFilter>('all');
  const [activeReminderFilter, setActiveReminderFilter] = useState<ReminderFilter>('overdue');
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [bootstrapData, setBootstrapData] = useState<NoteBootstrapResult | null>(null);
  const [reminderBootstrapData, setReminderBootstrapData] = useState<any | null>(null);
  const [categories, setCategories] = useState<NoteCategoryMenuItem[]>([]);
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [isReminderPopupOpen, setIsReminderPopupOpen] = useState(false);
  const reminderButtonRefStore = useRef<React.RefObject<HTMLButtonElement | null> | null>(null);
  const reminderButtonPosition = useRef<{ top: number; left: number; width: number; height: number } | null>(null);
  const [isSetReminderModalOpen, setIsSetReminderModalOpen] = useState(false);
  const [isRescheduleReminderModalOpen, setIsRescheduleReminderModalOpen] = useState(false);
  const [reminderPopupTitle, setReminderPopupTitle] = useState('Reminder On (Rescheduled)');
  const [isDeleteNoteModalOpen, setIsDeleteNoteModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [sortBy, setSortBy] = useState<number>(1); // Default to Newest First (from API)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedReminderId, setSelectedReminderId] = useState<string | null>(null);

  const sortOptionsData = useMemo(() => {
    return bootstrapData?.sortBy?.map((opt) => ({
      value: opt.code.toString(),
      label: opt.description,
    })) || [];
  }, [bootstrapData]);

  const filterUsers = useMemo(() => {
    if (!bootstrapData) return [];
    const allUsers = [...(bootstrapData.createdBy || []), ...(bootstrapData.assignedTo || [])];
    const uniqueUsers = Array.from(new Map(allUsers.map(u => [u.id, u])).values());
    return uniqueUsers.map(u => ({
      id: u.id.toString(),
      name: u.name,
      position: u.designation,
      email: '',
      avatar: u.profileImageUrl || avatarPlaceholder
    }));
  }, [bootstrapData]);
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string; iconType?: 'check' | 'save' | 'reminder-set' | 'reminder-unset' }>({
    show: false,
    title: '',
    message: '',
    iconType: 'check',
  });
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);

  const userStr = authService.getUser();
  const currentUserId = userStr ? JSON.parse(userStr).id.toString() : 'user-1';

  const initialDataFetchedRef = useRef(false);

  React.useEffect(() => {
    setPageTitle(activeTab === 'notes' ? 'Notes' : 'Reminders');
  }, [setPageTitle, activeTab]);

  const fetchInitialData = useCallback(async () => {
    try {
      const [bootstrapRes, categoriesRes] = await Promise.all([
        noteService.getInitialLoad(),
        noteService.getCategorySideMenu()
      ]);

      if (bootstrapRes.success) {
        setBootstrapData(bootstrapRes.result);
      }
      if (categoriesRes.success) {
        setCategories(categoriesRes.result);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      setIsLoading(false); // Stop loading if bootstrap fails
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'reminders' && !reminderBootstrapData) {
      reminderService.getInitialLoad().then((res) => {
        if (res.success) {
          setReminderBootstrapData(res.result);
        }
      }).catch(console.error);
    }
  }, [activeTab, reminderBootstrapData]);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      // Map filters to category codes
      let category: number | undefined;
      if (activeTab === 'notes') {
        if (activeFilter === 'all') category = 1;
        else if (activeFilter === 'my-notes') category = 2;
        else if (activeFilter === 'shared-with-me') category = 3;
        else if (activeFilter === 'favorites') category = 4;
      } else {
        if (activeReminderFilter === 'overdue') category = 5;
        else if (activeReminderFilter === 'upcoming') category = 6;
      }

      const params: NoteGetAllRequest = {
        userId: parseInt(currentUserId),
        pageNumber: 1,
        pageSize: 100,
        searchQuery: searchTerm,
        onlyReminders: activeTab === 'reminders',
        category,
        sortBy,
        fromDate: filters?.dateRange?.from ? formatToDateTimeOffset(filters.dateRange.from) : undefined,
        toDate: filters?.dateRange?.to ? formatToDateTimeOffset(filters.dateRange.to) : undefined,
        createdBy: filters?.createdBy?.map(id => parseInt(id)).filter(id => !isNaN(id)),
        assignedTo: filters?.assignedTo?.map(id => parseInt(id)).filter(id => !isNaN(id))
      };

      const response = activeTab === 'reminders'
        ? await reminderService.getAll(params)
        : await noteService.getAll(params);
      if (response.success) {
        const mappedNotes: Note[] = response.result.items.map(mapApiNoteToUI);

        setNotes(mappedNotes);

        // Update reminders state if in reminders tab
        if (activeTab === 'reminders') {
          const mappedReminders: Reminder[] = mappedNotes.map(mapApiNoteToUIReminder);
          setReminders(mappedReminders);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setIsLoading(false);
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }
    }
  }, [activeTab, activeFilter, activeReminderFilter, searchTerm, sortBy, filters, categories]);

  useEffect(() => {
    if (initialDataFetchedRef.current) return;
    initialDataFetchedRef.current = true;
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    // Only fetch notes once categories are available
    if (categories.length > 0) {
      fetchNotes();
    }
  }, [fetchNotes, categories]);

  // Filter notes based on active filter and search term
  const filteredNotes = useMemo(() => {
    let filtered = [...notes];

    // Apply date range filter
    if (filters?.dateRange?.from) {
      const filterDate = new Date(filters.dateRange.from);
      filterDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((note) => {
        const noteDate = new Date(note.createdAt);
        noteDate.setHours(0, 0, 0, 0);
        return noteDate >= filterDate;
      });
    }

    // Apply search
    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.author.name.toLowerCase().includes(query)
      );
    }

    // Sort: pinned first, then by selected sort option
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      switch (sortBy) {
        case 1: // Newest
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 2: // Oldest
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 3: // Title A-Z
          return a.title.localeCompare(b.title);
        case 4: // Title Z-A
          return b.title.localeCompare(a.title);
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    return filtered;
  }, [notes, activeFilter, searchTerm, filters, sortBy]);

  const showToast = (title: string, message: string, iconType: 'check' | 'save' | 'reminder-set' | 'reminder-unset' = 'check') => {
    setToast({ show: true, title, message, iconType });
    setTimeout(() => {
      setToast({ show: false, title: '', message: '', iconType: 'check' });
    }, 3000);
  };

  const handlePinToggle = async (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    try {
      const response = await noteService.togglePinned({
        entityId: parseInt(noteId),
        isPinned: !note.pinned
      });

      if (response.success) {
        setNotes((prev) =>
          prev.map((note) => (note.id === noteId ? { ...note, pinned: !note.pinned } : note))
        );

        const wasPinned = note.pinned;
        if (wasPinned) {
          showToast('Note Unpinned', 'It will now appear in its regular position in the list.');
        } else {
          showToast('Note Pinned', 'This note is now pinned and will appear at the top.');
        }
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleFavoriteToggle = async (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    try {
      const response = await noteService.toggleFavourite({
        entityId: parseInt(noteId),
        isFavourite: !note.favorited
      });

      if (response.success) {
        setNotes((prev) =>
          prev.map((note) => (note.id === noteId ? { ...note, favorited: !note.favorited } : note))
        );

        const wasFavorited = note.favorited;
        if (wasFavorited) {
          showToast('Removed from Favorites', 'This note is no longer marked as favorite.');
        } else {
          showToast('Marked as Favorite', 'You can find this note anytime under the Favorites tab.');
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleDeleteNoteClick = (noteId: string) => {
    setSelectedNoteId(noteId);
    setIsDeleteNoteModalOpen(true);
  };

  const handleDeleteNoteConfirm = async () => {
    if (!selectedNoteId) return;
    try {
      const response = await noteService.deleteNote(selectedNoteId);
      if (response && response.success) {
        setNotes((prev) => prev.filter((note) => note.id !== selectedNoteId));
        setReminders((prev) => prev.filter((reminder) => reminder.id !== selectedNoteId));
        showToast('Item Deleted', 'The item has been permanently deleted.');
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
    setIsDeleteNoteModalOpen(false);
    setSelectedNoteId(null);
  };

  const handleReminderNote = (noteId: string, buttonRef: React.RefObject<HTMLButtonElement | null>) => {
    setSelectedNoteId(noteId);
    reminderButtonRefStore.current = buttonRef;
    // Capture button position before dropdown closes
    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      reminderButtonPosition.current = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
    }
    setIsReminderPopupOpen(true);
  };

  const handleSetReminder = async (dateTime: Date) => {
    if (selectedNoteId) {
      try {
        const response = await noteService.setReminder({
          noteId: parseInt(selectedNoteId),
          reminderDateTime: formatToDateTimeOffset(dateTime)
        });

        if (response.success) {
          fetchNotes(); // Refresh notes to get updated reminder info
          showToast('Reminder Set', "We'll notify you at the scheduled time.");
        }
      } catch (error) {
        console.error('Failed to set reminder:', error);
      }
    }
    setIsReminderPopupOpen(false);
    setSelectedNoteId(null);
    reminderButtonRefStore.current = null;
  };

  const handleSetReminderFromModal = async (reminderData: {
    noteId?: string;
    newNoteContent?: string;
    dateTime: Date;
    sharedWith?: SharedPerson[];
  }) => {
    try {
      if (reminderData.noteId) {
        // Link reminder to existing note
        const response = await noteService.setReminder({
          noteId: parseInt(reminderData.noteId),
          reminderDateTime: formatToDateTimeOffset(reminderData.dateTime)
        });
        if (response.success && response.result) {
          const newNote = mapApiNoteToUI(response.result);
          setNotes(prev => [newNote, ...prev]);
          if (newNote.hasReminder) {
            setReminders(prev => [mapApiNoteToUIReminder(newNote), ...prev]);
          }
          showToast('Reminder Set', "We'll notify you at the scheduled time.");
        }
      } else if (reminderData.newNoteContent) {
        // Create new note and reminder
        const sharedWith = reminderData.sharedWith || [];
        const hasAudience = sharedWith.length > 0;
        const canEdit = hasAudience ? sharedWith.some(p => p.permission === 'edit') : false;
        const userIds = hasAudience ? sharedWith.map(p => Number(p.id)) : [];

        const response = await noteService.saveNote({
          title: reminderData.newNoteContent.substring(0, 50) + (reminderData.newNoteContent.length > 50 ? '...' : ''),
          notes: reminderData.newNoteContent,
          canEditByAudience: canEdit,
          reminderDateTime: formatToDateTimeOffset(reminderData.dateTime),
          audience: {
            audienceType: hasAudience ? 2 : 1,
            userIds: userIds,
            groupIds: []
          },
          isFavourite: false,
          isPinned: false
        });
        if (response.success && response.result) {
          const newNote = mapApiNoteToUI(response.result);
          setNotes(prev => [newNote, ...prev]);
          if (newNote.hasReminder) {
            setReminders(prev => [mapApiNoteToUIReminder(newNote), ...prev]);
          }
          showToast('Reminder Set', "We'll notify you at the scheduled time.");
        }
      }
    } catch (error) {
      console.error('Failed to set reminder from modal:', error);
    }

    setIsSetReminderModalOpen(false);
    setSelectedNoteId(null);
  };

  // Filter reminders based on active filter and search term
  const filteredReminders = useMemo(() => {
    let filtered = [...reminders];

    // Apply filter
    switch (activeReminderFilter) {
      case 'overdue':
        filtered = filtered.filter((reminder) => reminder.status === 'missed');
        break;
      case 'upcoming':
        filtered = filtered.filter((reminder) => reminder.status === 'upcoming');
        break;
    }

    // Apply search
    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (reminder) =>
          reminder.title.toLowerCase().includes(query) ||
          reminder.content.toLowerCase().includes(query) ||
          reminder.author.name.toLowerCase().includes(query)
      );
    }

    // Sort: pinned first, then by date (newest first)
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.dueDate.getTime() - a.dueDate.getTime();
    });

    return filtered;
  }, [reminders, activeReminderFilter, searchTerm]);

  const handleReminderReschedule = (reminderId: string) => {
    setSelectedReminderId(reminderId);
    setReminderPopupTitle('Reminder On (Rescheduled)');
    setIsRescheduleReminderModalOpen(true);
  };

  const handleRescheduleReminder = async (dateTime: Date) => {
    if (!selectedReminderId) return;

    try {
      const response = await noteService.setReminder({
        noteId: parseInt(selectedReminderId),
        reminderDateTime: formatToDateTimeOffset(dateTime)
      });

      if (response.success) {
        fetchNotes();
        showToast('Reminder Rescheduled', 'Your reminder has been rescheduled successfully.');
      }
    } catch (error) {
      console.error('Failed to reschedule reminder:', error);
    }

    setIsRescheduleReminderModalOpen(false);
    setSelectedReminderId(null);
  };


  const handleReminderFavoriteToggle = async (reminderId: string) => {
    const reminder = reminders.find((r) => r.id === reminderId);
    if (!reminder) return;

    try {
      const response = await reminderService.toggleFavourite({
        entityId: parseInt(reminderId),
        isFavourite: !reminder.favorited
      });

      if (response && response.success) {
        setReminders((prev) =>
          prev.map((reminder) => (reminder.id === reminderId ? { ...reminder, favorited: !reminder.favorited } : reminder))
        );
        // Sync with notes list as well
        setNotes((prev) =>
          prev.map((note) => (note.id === reminderId ? { ...note, favorited: !note.favorited } : note))
        );

        const wasFavorited = reminder.favorited;
        if (wasFavorited) {
          showToast('Removed from Favorites', 'This reminder is no longer marked as favorite.');
        } else {
          showToast('Marked as Favorite', 'You can find this reminder anytime under the Favorites tab.');
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleReminderDelete = (reminderId: string) => {
    setSelectedNoteId(reminderId);
    setIsDeleteNoteModalOpen(true);
  };

  const handleSaveNote = async (noteData: { title: string; content: string; pinned?: boolean; favorited?: boolean; hasReminder?: boolean; sharedWith?: SharedPerson[] }) => {
    try {
      const sharedWith = noteData.sharedWith || [];
      const hasAudience = sharedWith.length > 0;
      const canEdit = hasAudience ? sharedWith.some(p => p.permission === 'edit') : false;
      const userIds = hasAudience ? sharedWith.map(p => Number(p.id)) : [];

      const response = await noteService.saveNote({
        title: noteData.title,
        notes: noteData.content,
        canEditByAudience: canEdit,
        audience: {
          audienceType: hasAudience ? 2 : 1, // 1 for All (default if no audience?), 2 for Individual Users
          userIds: userIds,
          groupIds: []
        },
        isFavourite: noteData.favorited || false,
        isPinned: noteData.pinned || false,
        // updatedBy: currentUserId
      });

      if (response.success && response.result) {
        const newNote = mapApiNoteToUI(response.result);
        setNotes(prev => [newNote, ...prev]);
        if (newNote.hasReminder) {
          setReminders(prev => [mapApiNoteToUIReminder(newNote), ...prev]);
        }
        showToast('Note Added', 'Your note has been saved and added to your list.');
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleSaveDraft = (noteData: { title: string; content: string }) => {
    // Save draft to localStorage or handle as needed
    console.log('Draft saved:', noteData);
  };

  return (
    <div className="bg-white rounded-[10px] shadow-[2px_2px_4px_0px_rgba(0,0,0,0.1)] h-full">
      {/* Header with Tabs and Search */}
      <div className="border-b-2 border-[#e6e6e6] py-[15px] flex items-center justify-between lg:justify-center flex-wrap gap-[15px] px-5 relative">
        {/* Tabs */}
        <div className="flex items-center gap-5 lg:absolute lg:left-5 lg:top-1/2 lg:-translate-y-1/2">
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={cn(
              'cursor-pointer flex items-center gap-[5px] px-[15px] py-[5px] rounded-[25px] transition text-white',
              activeTab === 'notes'
                ? 'bg-[#1e88e5]'
                : 'bg-[#232725]'
            )}
          >
            <img src={notesIcon} alt="Notes" className="w-5 h-5" />
            <span className="text-[14px] font-semibold">Notes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reminders')}
            className={cn(
              'cursor-pointer flex items-center gap-[5px] px-[15px] py-[5px] rounded-[25px] transition',
              activeTab === 'reminders'
                ? 'bg-[#1e88e5] text-white'
                : 'bg-[#232725] text-white hover:opacity-90'
            )}
          >
            <img src={reminderIcon} alt="Reminders" className={cn("w-5 h-5", activeTab === 'reminders' ? 'invert brightness-0' : '')} />
            <span className="text-[14px] font-semibold">Reminders</span>
          </button>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-[18px] h-[18px] text-black" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search through all your notes..."
              className="bg-[#e6e6e6] border border-[#cacaca] border-solid h-[40px] w-full lg:w-[399px] pl-10 pr-4 rounded-[25px] text-[14px] font-medium text-black placeholder:text-black focus:outline-none"
            />
            {isFirstLoad && activeTab === 'notes' && (
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Loader2 className="w-[18px] h-[18px] text-black animate-spin" />
              </div>
            )}
          </div>
          <button
            ref={filterButtonRef}
            type="button"
            onClick={() => {
              setIsFilterOpen((prev) => !prev);
              setIsSortOpen(false);
            }}
            className={cn(
              'shrink-0 rounded-full flex h-[32px] w-[32px] items-center justify-center cursor-pointer transition-colors',
              isFilterOpen ? 'bg-[#DE4A2C]' : 'bg-[#DE4A2C]'
            )}
            aria-label="Filter"
          >
            {isFirstLoad && activeTab === 'notes' ? (
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M1.61274 1.6L6.84029 8.0808C7.06912 8.36466 7.1937 8.71734 7.19353 9.0808V14.4L8.80647 13.2V9.08C8.80648 8.71682 8.93105 8.36445 9.15971 8.0808L14.3873 1.6H1.61274ZM1.61274 0H14.3873C14.6911 3.76005e-05 14.9888 0.0852189 15.246 0.245733C15.5032 0.406246 15.7094 0.635563 15.841 0.90727C15.9725 1.17898 16.0241 1.48202 15.9896 1.7815C15.9551 2.08097 15.8361 2.3647 15.6462 2.6L10.4194 9.08V13.2C10.4194 13.4484 10.3611 13.6934 10.2491 13.9155C10.1371 14.1377 9.97456 14.331 9.77424 14.48L8.16129 15.68C7.92166 15.8583 7.63671 15.9669 7.33838 15.9935C7.04005 16.0202 6.74012 15.964 6.47220 15.8311C6.20428 15.6982 5.97896 15.4939 5.82148 15.2412C5.664 14.9884 5.58058 14.6971 5.58058 14.4V9.08L0.353841 2.6C0.163928 2.3647 0.0448808 2.08097 0.010412 1.7815C-0.0240568 1.48202 0.0274547 1.17898 0.159013 0.90727C0.290572 0.635563 0.496826 0.406246 0.754019 0.245733C1.01121 0.0852189 1.30888 3.76005e-05 1.61274 0Z" fill="white" />
              </svg>
            )}
          </button>
          <button
            ref={sortButtonRef}
            type="button"
            onClick={() => {
              setIsSortOpen((prev) => !prev);
              setIsFilterOpen(false);
            }}
            className={cn(
              'shrink-0 rounded-full flex h-[32px] w-[32px] items-center justify-center cursor-pointer transition-colors',
              isSortOpen ? 'bg-[#CACACA]' : 'bg-[#CACACA]'
            )}
            aria-label="Sort"
          >
            {isFirstLoad && activeTab === 'notes' ? (
              <Loader2 className="h-4 w-4 text-black animate-spin" />
            ) : (
              <svg width="19" height="15" viewBox="0 0 19 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.24063 8.42789C0.394703 8.58196 0.603671 8.66852 0.821563 8.66852H6.84636C7.06425 8.66852 7.27322 8.58196 7.42729 8.42789C7.58136 8.27381 7.66792 8.06485 7.66792 7.84695C7.66792 7.62906 7.58136 7.42009 7.42729 7.26602C7.27322 7.11195 7.06425 7.02539 6.84636 7.02539H0.821563C0.603671 7.02539 0.394703 7.11195 0.24063 7.26602C0.0865571 7.42009 0 7.62906 0 7.84695C0 8.06485 0.0865571 8.27381 0.24063 8.42789Z" fill="black" />
                <path d="M0.821563 12.8111C0.603671 12.8111 0.394703 12.7245 0.24063 12.5705C0.0865571 12.4164 0 12.2074 0 11.9895C0 11.7716 0.0865571 11.5627 0.24063 11.4086C0.394703 11.2545 0.603671 11.168 0.821563 11.168H9.91907C10.137 11.168 10.3459 11.2545 10.5 11.4086C10.6541 11.5627 10.7406 11.7716 10.7406 11.9895C10.7406 12.2074 10.6541 12.4164 10.5 12.5705C10.3459 12.7245 10.137 12.8111 9.91907 12.8111H0.821563Z" fill="black" />
                <path d="M0.24063 4.28335C0.394703 4.43743 0.603671 4.52398 0.821563 4.52398H4.65552C4.87341 4.52398 5.08238 4.43743 5.23645 4.28335C5.39053 4.12928 5.47708 3.92031 5.47708 3.70242C5.47708 3.48453 5.39053 3.27556 5.23645 3.12149C5.08238 2.96742 4.87341 2.88086 4.65552 2.88086H0.821563C0.603671 2.88086 0.394703 2.96742 0.24063 3.12149C0.0865571 3.27556 0 3.48453 0 3.70242C0 3.92031 0.0865571 4.12928 0.24063 4.28335Z" fill="black" />
                <path d="M13.9991 13.9991C14.1532 13.845 14.2398 13.636 14.2398 13.4181V2.80354L16.6716 5.23537C16.8273 5.38049 17.0333 5.4595 17.2462 5.45574C17.459 5.45199 17.6621 5.36576 17.8126 5.21524C17.9631 5.06471 18.0493 4.86164 18.0531 4.6488C18.0569 4.43596 17.9779 4.22997 17.8327 4.07423L13.9988 0.240269C13.8447 0.0864168 13.6359 0 13.4182 0C13.2005 0 12.9917 0.0864168 12.8376 0.240269L9.00367 4.07423C8.92296 4.14944 8.85821 4.24014 8.81331 4.34092C8.76841 4.4417 8.74426 4.55049 8.74232 4.6608C8.74037 4.77111 8.76066 4.88068 8.80198 4.98298C8.8433 5.08528 8.9048 5.17821 8.98282 5.25622C9.06083 5.33424 9.15376 5.39574 9.25606 5.43706C9.35836 5.47838 9.46793 5.49867 9.57824 5.49673C9.68855 5.49478 9.79735 5.47064 9.89812 5.42573C9.9989 5.38083 10.0896 5.31609 10.1648 5.23537L12.5966 2.80354V13.4181C12.5966 13.636 12.6832 13.845 12.8373 13.9991C12.9913 14.1531 13.2003 14.2397 13.4182 14.2397C13.6361 14.2397 13.8451 14.1531 13.9991 13.9991Z" fill="black" />
              </svg>
            )}
          </button>

          {/* Filter Popover */}
          <FilterPopover
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            triggerRef={filterButtonRef}
            onApply={(newFilters) => {
              setFilters(newFilters);
              setIsFilterOpen(false);
            }}
            onReset={() => {
              setFilters(null);
              setIsFilterOpen(false);
            }}
            filterConfig={[
              { type: 'dateRange', title: 'Date Range' },
              { type: 'userSelection', title: 'Created By', id: 'created-by' },
              { type: 'userSelection', title: 'Assigned To', id: 'assigned-to' },
            ]}
            users={filterUsers}
            initialFilters={filters || undefined}
          />

          {/* Sort Popover */}
          <SortPopover
            isOpen={isSortOpen}
            onClose={() => setIsSortOpen(false)}
            triggerRef={sortButtonRef}
            selectedSort={sortBy.toString()}
            onSortChange={(sort) => {
              setSortBy(parseInt(sort));
              setIsSortOpen(false);
            }}
            sortOptions={sortOptionsData}
          />
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center justify-center flex-wrap gap-5 px-5 pt-[25px] pb-[5px]">
        {categories.length === 0 ? (
          <>
            {activeTab === 'notes' ? (
              Array.from({ length: 4 }).map((_, i) => <CategorySkeleton key={i} />)
            ) : (
              Array.from({ length: 2 }).map((_, i) => <CategorySkeleton key={i} />)
            )}
          </>
        ) : (
          categories
            .filter(cat => {
              if (activeTab === 'notes') return cat.categoryCode >= 1 && cat.categoryCode <= 4;
              return cat.categoryCode >= 5 && cat.categoryCode <= 6;
            })
            .map(cat => {
              const isActive = activeTab === 'notes'
                ? (cat.categoryCode === 1 && activeFilter === 'all') ||
                (cat.categoryCode === 2 && activeFilter === 'my-notes') ||
                (cat.categoryCode === 3 && activeFilter === 'shared-with-me') ||
                (cat.categoryCode === 4 && activeFilter === 'favorites')
                : (cat.categoryCode === 5 && activeReminderFilter === 'overdue') ||
                (cat.categoryCode === 6 && activeReminderFilter === 'upcoming');

              return (
                <button
                  key={cat.categoryCode}
                  type="button"
                  onClick={() => {
                    if (activeTab === 'notes') {
                      if (cat.categoryCode === 1) setActiveFilter('all');
                      else if (cat.categoryCode === 2) setActiveFilter('my-notes');
                      else if (cat.categoryCode === 3) setActiveFilter('shared-with-me');
                      else if (cat.categoryCode === 4) setActiveFilter('favorites');
                    } else {
                      if (cat.categoryCode === 5) setActiveReminderFilter('overdue');
                      else if (cat.categoryCode === 6) setActiveReminderFilter('upcoming');
                    }
                  }}
                  className={cn(
                    'cursor-pointer flex items-center gap-[8px] px-[15px] py-[5px] rounded-[25px] transition',
                    isActive
                      ? activeTab === 'notes' ? 'bg-[#1e88e5] text-white' : 'border-[1.5px] border-[#1e88e5] border-solid text-black'
                      : 'border border-[#cacaca] border-solid text-black'
                  )}
                >
                  {cat.categoryCode === 1 && <img src={notesIcon} alt={cat.categoryName} className={cn("w-5 h-5", !isActive && 'invert-0 brightness-0')} />}
                  {cat.categoryCode === 2 && <Edit className="w-5 h-5" />}
                  {cat.categoryCode === 3 && <Share2 className="w-5 h-5" />}
                  {cat.categoryCode === 4 && <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />}
                  {cat.categoryCode === 5 && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M5.32669 0C5.59158 0 5.84561 0.105226 6.03292 0.292528C6.22022 0.479831 6.32544 0.733868 6.32544 0.998754V2.66335H12.9838V0.998754C12.9838 0.733868 13.089 0.479831 13.2763 0.292528C13.4636 0.105226 13.7177 0 13.9826 0C14.2474 0 14.5015 0.105226 14.6888 0.292528C14.8761 0.479831 14.9813 0.733868 14.9813 0.998754V2.66335H17.3117C17.6649 2.66335 18.0036 2.80365 18.2534 3.05338C18.5031 3.30312 18.6434 3.64184 18.6434 3.99502V9.65463C18.6434 9.91951 18.5382 10.1735 18.3509 10.3609C18.1636 10.5482 17.9095 10.6534 17.6447 10.6534C17.3798 10.6534 17.1257 10.5482 16.9384 10.3609C16.7511 10.1735 16.6459 9.91951 16.6459 9.65463V8.65587H1.99751V16.6459H9.65463C9.91951 16.6459 10.1735 16.7511 10.3609 16.9384C10.5482 17.1257 10.6534 17.3798 10.6534 17.6447C10.6534 17.9095 10.5482 18.1636 10.3609 18.3509C10.1735 18.5382 9.91951 18.6434 9.65463 18.6434H1.33167C0.978491 18.6434 0.639775 18.5031 0.390038 18.2534C0.140301 18.0036 0 17.6649 0 17.3117V3.99502C0 3.64184 0.140301 3.30312 0.390038 3.05338C0.639775 2.80365 0 2.66335 1.33167 2.66335H4.32794V0.998754C4.32794 0.733868 4.43316 0.479831 4.62046 0.292528C4.80777 0.105226 5.0618 0 5.32669 0ZM1.99751 6.65836H16.6459V4.66085H1.99751V6.65836Z" fill="black" />
                      <path d="M13.3662 12.0474C13.4887 12.102 13.599 12.1807 13.6904 12.2788L15.9809 14.5693L18.2713 12.2788C18.3628 12.1807 18.473 12.102 18.5956 12.0474C18.7181 11.9928 18.8503 11.9635 18.9844 11.9611C19.1185 11.9587 19.2517 11.9834 19.3761 12.0336C19.5005 12.0839 19.6134 12.1586 19.7083 12.2535C19.8031 12.3483 19.8779 12.4613 19.9281 12.5856C19.9783 12.71 20.003 12.8432 20.0006 12.9773C19.9983 13.1114 19.9689 13.2437 19.9143 13.3662C19.8598 13.4887 19.781 13.599 19.6829 13.6904L17.3924 15.9809L19.6829 18.2713C19.781 18.3628 19.8598 18.473 19.9143 18.5956C19.9689 18.7181 19.9983 18.8503 20.0006 18.9844C20.003 19.1185 19.9783 19.2517 19.9281 19.3761C19.8779 19.5005 19.8031 19.6134 19.7083 19.7083C19.6134 19.8031 19.5005 19.8779 19.3761 19.9281C19.2517 19.9783 19.1185 20.003 18.9844 20.0006C18.8503 19.9983 18.7181 19.9689 18.5956 19.9143C18.473 19.8598 18.3628 19.781 18.2713 19.6829L15.9809 17.3924L13.6904 19.6829C13.599 19.781 13.4887 19.8598 13.3662 19.9143C13.2437 19.9689 13.1114 19.9983 12.9773 20.0006C12.8432 20.003 12.71 19.9783 12.5856 19.9281C12.4613 19.8779 12.3483 19.8031 12.2535 19.7083C12.1586 19.6134 12.0839 19.5005 12.0336 19.3761C11.9834 19.2517 11.9587 19.1185 11.9611 18.9844C11.9635 18.8503 11.9928 18.7181 12.0474 18.5956C12.102 18.473 12.1807 18.3628 12.2788 18.2713L14.5693 15.9809L12.2788 13.6904C12.1807 13.599 12.102 13.4887 12.0474 13.3662C11.9928 13.2437 11.9635 13.1114 11.9611 12.9773C11.9587 12.8432 11.9834 12.71 12.0336 12.5856C12.0839 12.4613 12.1586 12.3483 12.2535 12.2535C12.3483 12.1586 12.4613 12.0839 12.5856 12.0336C12.71 11.9834 12.8432 11.9587 12.9773 11.9611C13.1114 11.9635 13.2437 11.9928 13.3662 12.0474Z" fill="#8C2036" />
                    </svg>
                  )}
                  {cat.categoryCode === 6 && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M14.6733 0C14.4084 0 14.1544 0.105226 13.9671 0.292528C13.7798 0.479831 13.6746 0.733868 13.6746 0.998754V2.66335H7.01619V0.998754C7.01619 0.733868 6.91097 0.479831 6.72366 0.292528C6.53636 0.105226 6.28232 0 6.01744 0C5.75255 0 5.49852 0.105226 5.31121 0.292528C5.12391 0.479831 5.01868 0.733868 5.01868 0.998754V2.66335H2.68826C2.33508 2.66335 1.99636 2.80365 1.74662 3.05338C1.49689 3.30312 1.35658 3.64184 1.35658 3.99502V9.65463C1.35658 9.91951 1.46181 10.1735 1.64911 10.3609C1.83642 10.5482 2.09045 10.6534 2.35534 10.6534C2.62023 10.6534 2.87426 10.5482 3.06156 10.3609C3.24887 10.1735 3.35409 9.91951 3.35409 9.65463V8.65587H18.0025V16.6459H10.3454C10.0805 16.6459 9.82645 16.7511 9.63915 16.9384C9.45185 17.1257 9.34662 17.3798 9.34662 17.6447C9.34662 17.9095 9.45185 18.1636 9.63915 18.3509C9.82645 18.5382 10.0805 18.6434 10.3454 18.6434H18.6683C19.0215 18.6434 19.3602 18.5031 19.61 18.2534C19.8597 18.0036 20 17.6649 20 17.3117V3.99502C20 3.64184 19.8597 3.30312 19.61 3.05338C19.3602 2.80365 19.0215 2.66335 18.6683 2.66335H15.6721V0.998754C15.6721 0.733868 15.5668 0.479831 15.3795 0.292528C15.1922 0.105226 14.9382 0 14.6733 0ZM18.0025 6.65836H3.35409V4.66085H18.0025V6.65836Z" fill="black" />
                      <path d="M0.210032 15.4833C0.344512 15.3509 0.526909 15.2765 0.717093 15.2765H6.55296L4.43037 13.1871C4.3037 13.0533 4.23474 12.8763 4.23802 12.6934C4.24129 12.5106 4.31655 12.3361 4.44794 12.2067C4.57932 12.0774 4.75657 12.0033 4.94235 12.0001C5.12812 11.9969 5.30792 12.0648 5.44385 12.1894L8.79028 15.4836C8.92457 15.6159 9 15.7953 9 15.9824C9 16.1695 8.92457 16.3489 8.79028 16.4812L5.44385 19.7753C5.3782 19.8447 5.29904 19.9003 5.21108 19.9389C5.12311 19.9775 5.02816 19.9982 4.93187 19.9999C4.83559 20.0016 4.73995 19.9841 4.65066 19.9486C4.56137 19.9131 4.48026 19.8603 4.41216 19.7933C4.34407 19.7262 4.29039 19.6464 4.25432 19.5585C4.21826 19.4706 4.20054 19.3764 4.20224 19.2817C4.20394 19.1869 4.22502 19.0934 4.26421 19.0068C4.3034 18.9202 4.35991 18.8423 4.43037 18.7777L6.55296 16.6883H0.717093C0.526909 16.6883 0.344512 16.6139 0.210032 16.4815C0.0755501 16.3491 0 16.1696 0 15.9824C0 15.7952 0.0755501 15.6156 0.210032 15.4833Z" fill="#16A34A" />
                    </svg>
                  )}
                  <span className="text-[14px] font-semibold">{cat.categoryName}</span>
                </button>
              );
            })
        )}

        {activeTab === 'notes' ? (
          <button
            type="button"
            onClick={() => setIsNewNoteModalOpen(true)}
            className="cursor-pointer bg-[#008080] flex items-center gap-[5px] px-[15px] py-[5px] rounded-[25px] text-white hover:opacity-90 transition"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[14px] font-semibold">New Note</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setSelectedNoteId(null);
              setIsSetReminderModalOpen(true);
            }}
            className="bg-[#008080] flex items-center gap-[5px] px-[15px] py-[5px] rounded-[25px] text-white cursor-pointer hover:opacity-90 transition"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[14px] font-semibold">New Reminder</span>
          </button>
        )}
      </div>

      {/* Notes/Reminders Grid */}
      <div className="bg-[#e6e6e6] border-2 border-[#e6e6e6] border-solid rounded-[10px] p-5 h-[calc(100dvh-265px)] overflow-y-scroll m-5">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {activeTab === 'notes' ? (
              Array.from({ length: 4 }).map((_, i) => <NoteCardSkeleton key={i} />)
            ) : (
              Array.from({ length: 2 }).map((_, i) => <ReminderCardSkeleton key={i} />)
            )}
          </div>
        ) : activeTab === 'notes' ? (
          filteredNotes.length === 0 ? (
            <div className="mx-auto max-w-xl w-full rounded-[24px] border border-dashed border-[#CBD5E1] bg-white p-8 text-center sm:p-12 mt-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F1F5F9]">
                <Search className="h-7 w-7 text-[#94A3B8]" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-[#111827]">No notes found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#6B7280]">
                Try adjusting your filters or search terms. You can also create a new note.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('all');
                  setSearchTerm('');
                  setFilters(null);
                }}
                className={cn(
                  'mt-6 inline-flex items-center gap-2 rounded-2xl border border-[#E4E7EC] px-4 py-2.5 text-sm font-medium text-[#475467] transition hover:bg-[#F5F7FA] cursor-pointer'
                )}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  searchTerm={searchTerm}
                  onPinToggle={handlePinToggle}
                  onFavoriteToggle={handleFavoriteToggle}
                  onDelete={handleDeleteNoteClick}
                  onReminder={handleReminderNote}
                />
              ))}
            </div>
          )
        ) : (
          filteredReminders.length === 0 ? (
            <div className="mx-auto max-w-xl w-full rounded-[24px] border border-dashed border-[#CBD5E1] bg-white p-8 text-center sm:p-12 mt-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F1F5F9]">
                <Search className="h-7 w-7 text-[#94A3B8]" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-[#111827]">No reminders found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#6B7280]">
                Try adjusting your filters or search terms. You can also create a new reminder.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveReminderFilter('overdue');
                  setSearchTerm('');
                  setFilters(null);
                }}
                className={cn(
                  'mt-6 inline-flex items-center gap-2 rounded-2xl border border-[#E4E7EC] px-4 py-2.5 text-sm font-medium text-[#475467] transition hover:bg-[#F5F7FA] cursor-pointer'
                )}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredReminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  searchTerm={searchTerm}
                  currentUserId={currentUserId}
                  onReschedule={(id) => handleReminderReschedule(id)}
                  onReminderToggle={(id) => {
                    setSelectedReminderId(id);
                    setReminderPopupTitle('Reminder On');
                    setIsRescheduleReminderModalOpen(true);
                  }}
                  onFavoriteToggle={handleReminderFavoriteToggle}
                  onDelete={handleReminderDelete}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* New Note Modal */}
      <NewNoteModal
        isOpen={isNewNoteModalOpen}
        onClose={() => setIsNewNoteModalOpen(false)}
        onSave={handleSaveNote}
        onSaveDraft={handleSaveDraft}
        users={filterUsers}
      />

      {/* Reminder Popup */}
      {isReminderPopupOpen && selectedNoteId && (
        <ReminderPopup
          isOpen={isReminderPopupOpen}
          onClose={() => {
            setIsReminderPopupOpen(false);
            setSelectedNoteId(null);
            reminderButtonRefStore.current = null;
            reminderButtonPosition.current = null;
          }}
          onSet={handleSetReminder}
          noteId={selectedNoteId}
        />
      )}

      {/* Set Reminder Modal */}
      <SetReminderModal
        isOpen={isSetReminderModalOpen}
        onClose={() => {
          setIsSetReminderModalOpen(false);
          setSelectedNoteId(null);
        }}
        onSetReminder={handleSetReminderFromModal}
        currentUserId={currentUserId}
        users={filterUsers}
        apiNotes={reminderBootstrapData?.noteList || []}
      />

      {/* Reschedule/Toggle Reminder Modal */}
      {selectedReminderId && (
        <ReminderPopup
          isOpen={isRescheduleReminderModalOpen}
          onClose={() => {
            setIsRescheduleReminderModalOpen(false);
            setSelectedReminderId(null);
          }}
          onSet={handleRescheduleReminder}
          initialDate={reminders.find((r) => r.id === selectedReminderId)?.dueDate}
          title={reminderPopupTitle}
        />
      )}

      {/* Delete Note Modal */}
      {selectedNoteId && (
        <DeleteNoteModal
          isOpen={isDeleteNoteModalOpen}
          onClose={() => {
            setIsDeleteNoteModalOpen(false);
            setSelectedNoteId(null);
          }}
          onConfirm={handleDeleteNoteConfirm}
          isShared={notes.find((n) => n.id === selectedNoteId)?.isShared || false}
          sharedByName={notes.find((n) => n.id === selectedNoteId)?.author.name}
        />
      )}

      {/* Toast Notification */}
      <CustomToast
        title={toast.title}
        message={toast.message}
        show={toast.show}
        onClose={() => setToast({ show: false, title: '', message: '', iconType: 'check' })}
        iconType={toast.iconType}
      />
    </div>
  );
};

export default Notes;
