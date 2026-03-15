import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Share2, Search, Check, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import DateTimePicker from './DateTimePicker';
import avatarPlaceholder from '../../assets/images/default-group-icon.png';
import { type ReminderNoteListDto, reminderService } from '../../services/reminderService';

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

interface SetReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetReminder: (reminderData: {
    noteId?: string;
    newNoteContent?: string;
    dateTime: Date;
    sharedWith?: SharedPerson[];
  }) => Promise<void> | void;
  currentUserId?: string;
  users?: Person[];
  apiNotes?: ReminderNoteListDto[];
}

const SetReminderModal: React.FC<SetReminderModalProps> = ({
  isOpen,
  onClose,
  onSetReminder,
  currentUserId = 'user-1',
  users = [],
  apiNotes = [],
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isNotesDropdownOpen, setIsNotesDropdownOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [sharePanelOpen, setSharePanelOpen] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState('');
  const [sharedPeople, setSharedPeople] = useState<SharedPerson[]>([]);
  const [errors, setErrors] = useState<{ noteSelection?: string; dateTime?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // State for local users fetched via API if prop is empty
  const [fetchedUsers, setFetchedUsers] = useState<Person[]>([]);
  const [fetchedNotes, setFetchedNotes] = useState<ReminderNoteListDto[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const notesDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedNoteId(null);
      setIsNotesDropdownOpen(false);
      setNewNoteContent('');
      setSelectedDateTime(null);
      setShowDateTimePicker(false);
      setSharePanelOpen(false);
      setPeopleSearch('');
      setSharedPeople([]);
      setErrors({});
      setFetchedUsers([]);
      setFetchedNotes([]);
    }
  }, [isOpen]);

  // Fetch initial users and notes if not provided
  useEffect(() => {
    if (isOpen && (users.length === 0 || apiNotes.length === 0) && fetchedUsers.length === 0 && fetchedNotes.length === 0 && !isLoadingUsers) {
      const fetchUsersAndNotes = async () => {
        setIsLoadingUsers(true);
        try {
          const res = await reminderService.getInitialLoad();
          if (res.success && res.result) {
            const allUsers = [...(res.result.individualUsers || [])];
            // Deduplicate by ID
            const uniqueUsers = Array.from(new Map(allUsers.map(u => [u.id, u])).values());
            const mappedUsers: Person[] = uniqueUsers.map(u => ({
              id: u.id.toString(),
              name: u.name,
              position: u.designation,
              email: '',
              avatar: u.profileImageUrl || avatarPlaceholder
            }));

            setFetchedUsers(mappedUsers);
            if (res.result.noteList) {
              setFetchedNotes(res.result.noteList);
            }
          }
        } catch (error) {
          console.error('Failed to load initial data:', error);
        } finally {
          setIsLoadingUsers(false);
        }
      };
      fetchUsersAndNotes();
    }
  }, [isOpen, users.length, apiNotes.length, fetchedUsers.length, fetchedNotes.length, isLoadingUsers]);

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

  const handleDateTimeSet = (date: Date) => {
    setSelectedDateTime(date);
    setShowDateTimePicker(false);
    if (errors.dateTime) setErrors({ ...errors, dateTime: undefined });
  };

  const handleSetReminder = async () => {
    const isUsingExisting = selectedNoteId !== null && newNoteContent.trim() === '';
    const isUsingNew = newNoteContent.trim() !== '' && selectedNoteId === null;
    const newErrors: { noteSelection?: string; dateTime?: string } = {};

    if (!selectedDateTime) {
      newErrors.dateTime = 'Date & Time is required';
    }

    if (!isUsingExisting && !isUsingNew) {
      newErrors.noteSelection = 'Please select a note or write a new one';
    } else if (isUsingExisting && !selectedNoteId) {
      newErrors.noteSelection = 'Please select an existing note';
    } else if (isUsingNew && !newNoteContent.trim()) {
      newErrors.noteSelection = 'Please type a valid note';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      await onSetReminder({
        noteId: isUsingExisting ? selectedNoteId || undefined : undefined,
        newNoteContent: isUsingNew ? newNoteContent.trim() : undefined,
        dateTime: selectedDateTime!,
        sharedWith: sharedPeople.length > 0 ? sharedPeople : undefined,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateTime = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${day} ${month}, ${displayHours}:${displayMinutes} ${ampm}`;
  };

  if (!isOpen) return null;

  const notesToDisplay = apiNotes.length > 0 ? apiNotes : fetchedNotes;
  const selectedNote = notesToDisplay.find((note) => note.noteId.toString() === selectedNoteId);

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className={cn(
          'relative bg-white rounded-[10px] shadow-xl transition-all duration-300 flex',
          sharePanelOpen || showDateTimePicker ? 'w-full max-w-[924px]' : 'w-full max-w-[485px]'
        )}
        onClick={(e) => e.stopPropagation()}
        style={{ minHeight: 'fit-content' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="size-[20px] flex items-center justify-center rounded-full bg-black text-white hover:opacity-90 transition cursor-pointer absolute top-1.5 right-1.5"
          aria-label="Close"
        >
          <X className="w-3 h-3 stroke-3" />
        </button>

        {/* Main Content */}
        <div className={cn("flex-1 flex flex-col pb-16 min-h-0 transition-all duration-300 ease-in-out", showDateTimePicker && 'relative')}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 pr-10">
            <div className="flex items-center gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
                <path d="M19.875 15.2L18.5 14.5125V12.875C18.4984 11.9011 18.1525 10.9591 17.5234 10.2155C16.8944 9.472 16.0227 8.97482 15.0625 8.81188V7.375H13.6875V8.81188C12.7273 8.97482 11.8556 9.472 11.2266 10.2155C10.5975 10.9591 10.2516 11.9011 10.25 12.875V14.5125L8.875 15.2V18.375H13V19.75H15.75V18.375H19.875V15.2ZM18.5 17H10.25V16.05L11.625 15.3625V12.875C11.625 12.1457 11.9147 11.4462 12.4305 10.9305C12.9462 10.4147 13.6457 10.125 14.375 10.125C15.1043 10.125 15.8038 10.4147 16.3195 10.9305C16.8353 11.4462 17.125 12.1457 17.125 12.875V15.3625L18.5 16.05V17Z" fill="#DE4A2C" />
                <path d="M18.5 3.25C18.5 2.88533 18.3551 2.53559 18.0973 2.27773C17.8394 2.01987 17.4897 1.875 17.125 1.875H14.375V0.5H13V1.875H7.5V0.5H6.125V1.875H3.375C3.01033 1.875 2.66059 2.01987 2.40273 2.27773C2.14487 2.53559 2 2.88533 2 3.25V17C2 17.3647 2.14487 17.7144 2.40273 17.9723C2.66059 18.2301 3.01033 18.375 3.375 18.375H6.125V17H3.375V3.25H6.125V4.625H7.5V3.25H13V4.625H14.375V3.25H17.125V7.375H18.5V3.25Z" fill="black" />
              </svg>
              <h2 className="text-[18px] font-semibold text-black">Set Reminder</h2>
            </div>

            <div className="flex items-center gap-[15px]">
              <button
                type="button"
                onClick={() => {
                  setSharePanelOpen(!sharePanelOpen);
                  if (!sharePanelOpen) {
                    setShowDateTimePicker(false);
                  }
                }}
                className={cn(
                  'cursor-pointer size-[30px] flex items-center justify-center rounded-full transition',
                  sharePanelOpen ? 'bg-[#e6e6e6]' : 'hover:bg-[#f5f5f5]'
                )}
                aria-label="Share reminder"
              >
                <Share2 className="w-[18px] h-[18px] text-black stroke-3" />
              </button>
            </div>
          </div>

          {/* Use Existing Note Section */}
          <div className="px-5 pb-4">
            <p className="text-[15px] font-semibold text-black mb-2">Use Existing Note</p>
            <div className="relative" ref={notesDropdownRef}>
              <button
                type="button"
                onClick={() => setIsNotesDropdownOpen(!isNotesDropdownOpen)}
                className={cn("cursor-pointer w-full bg-white border border-solid rounded-[5px] px-[10px] py-[10px] text-left flex items-center justify-between", errors.noteSelection ? "border-red-500" : "border-[#e6e6e6]")}
              >
                <span className={cn('text-[15px]', selectedNote ? 'text-black' : 'text-[#535352]')}>
                  {selectedNote ? selectedNote.title : 'Choose from your notes...'}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="7"
                  viewBox="0 0 12 7"
                  fill="none"
                  className={cn('transition-transform', isNotesDropdownOpen && 'rotate-180')}
                >
                  <path d="M0.264138 0.267679C0.433317 0.0962844 0.662742 0 0.901961 0C1.14118 0 1.37061 0.0962844 1.53978 0.267679L6.00545 4.7932L10.4711 0.267679C10.6413 0.101142 10.8691 0.00899124 11.1057 0.0110741C11.3422 0.0131569 11.5685 0.109307 11.7358 0.278816C11.903 0.448325 11.9979 0.67763 12 0.917343C12.002 1.15706 11.9111 1.388 11.7468 1.56042L6.64327 6.73232C6.47409 6.90372 6.24467 7 6.00545 7C5.76623 7 5.5368 6.90372 5.36762 6.73232L0.264138 1.56042C0.0950107 1.38898 0 1.15648 0 0.914052C0 0.671627 0.0950107 0.439126 0.264138 0.267679Z" fill="black" />
                </svg>
              </button>

              {isNotesDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e6e6e6] border-solid rounded-[10px] shadow-lg z-[70] max-h-[360px] overflow-y-auto">
                  <div className="space-y-0">
                    {isLoadingUsers ? (
                      <div className="px-[25px] py-[20px] text-[14px] text-[#535352] flex flex-col items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin mb-2" />
                        <span>Loading notes...</span>
                      </div>
                    ) : notesToDisplay.length === 0 ? (
                      <div className="px-[25px] py-[10px] text-[14px] text-[#535352]">
                        No notes available
                      </div>
                    ) : (
                      notesToDisplay.map((note, index) => (
                        <React.Fragment key={note.noteId}>
                          {index > 0 && <div className="h-px bg-[#E6E6E6] w-full" />}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedNoteId(note.noteId.toString());
                              setNewNoteContent('');
                              setIsNotesDropdownOpen(false);
                              if (errors.noteSelection) setErrors({ ...errors, noteSelection: undefined });
                            }}
                            className={cn(
                              'w-full flex items-center gap-[10px] px-[25px] py-[10px] text-left transition cursor-pointer rounded-[3px]',
                              selectedNoteId === note.noteId.toString() ? 'bg-[#E1E6EE]' : 'bg-white hover:bg-[#E1E6EE]'
                            )}
                          >
                            <span className="text-[14px] font-semibold text-black">{note.title || 'Untitled Note'}</span>
                          </button>
                        </React.Fragment>
                      ))
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>

          <p className="text-[12px] font-medium italic text-[#535352] px-5 mb-4">Or</p>

          {/* New Reminder Note Section */}
          <div className="px-5 pb-4">
            <p className="text-[15px] font-semibold text-black mb-2">New Reminder Note</p>
            <textarea
              value={newNoteContent}
              onChange={(e) => {
                setNewNoteContent(e.target.value);
                if (e.target.value.trim()) {
                  setSelectedNoteId(null);
                }
                if (errors.noteSelection) setErrors({ ...errors, noteSelection: undefined });
              }}
              onFocus={() => {
                if (newNoteContent.trim()) {
                  setSelectedNoteId(null);
                }
              }}
              placeholder="Type your reminder note..."
              rows={6}
              className={cn("w-full border border-solid rounded-[5px] px-[10px] py-[10px] text-[15px] font-normal focus:outline-none focus:border-[#1e88e5] resize-none", errors.noteSelection ? "border-red-500 text-red-900 focus:border-red-500" : "border-[#e6e6e6] text-[#535352] placeholder:text-[#535352]")}
            />
            {errors.noteSelection && <p className="text-red-500 text-xs mt-1">{errors.noteSelection}</p>}
          </div>

          {/* Date & Time Section */}
          <div className="px-5 pb-4 flex items-center gap-[15px]">
            <p className="text-[15px] font-semibold text-black mb-2">
              Reminder Date & Time <span className="text-red-500">*</span>
            </p>
            <div className="relative">
              <div

                className={cn("w-[230px] relative rounded-[5px] border py-[10px] px-[10px] pr-10 text-left flex items-center justify-between", errors.dateTime ? "border-red-500" : "border-[#E6E6E6]")}
              >
                <span className={cn('text-[15px]', selectedDateTime ? 'text-black' : 'text-[#535352]')}>
                  {selectedDateTime ? formatDateTime(selectedDateTime) : '07 Apr, 09:30 AM'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowDateTimePicker(!showDateTimePicker);
                    if (!showDateTimePicker) {
                      setSharePanelOpen(false);
                    }
                  }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDateTimePicker(!showDateTimePicker);
                      if (!showDateTimePicker) {
                        setSharePanelOpen(false);
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    <path d="M4.10156 8.09961H5.90156V9.89961H4.10156V8.09961ZM4.10156 11.6996H5.90156V13.4996H4.10156V11.6996ZM7.70156 8.09961H9.50156V9.89961H7.70156V8.09961ZM7.70156 11.6996H9.50156V13.4996H7.70156V11.6996ZM11.3016 8.09961H13.1016V9.89961H11.3016V8.09961ZM11.3016 11.6996H13.1016V13.4996H11.3016V11.6996Z" fill="#008080" />
                    <path d="M2.3 18H14.9C15.8927 18 16.7 17.1927 16.7 16.2V3.6C16.7 2.6073 15.8927 1.8 14.9 1.8H13.1V0H11.3V1.8H5.9V0H4.1V1.8H2.3C1.3073 1.8 0.5 2.6073 0.5 3.6V16.2C0.5 17.1927 1.3073 18 2.3 18ZM14.9 5.4L14.9009 16.2H2.3V5.4H14.9Z" fill="#008080" />
                  </svg>
                </button>
              </div>
              {errors.dateTime && <p className="text-red-500 text-xs mt-1 absolute -bottom-5 left-0 whitespace-nowrap">{errors.dateTime}</p>}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 flex items-center justify-end gap-5 transition-all duration-300 ease-in-out">
            <button
              type="button"
              onClick={onClose}
              className="border border-[#cacaca] border-solid py-[10px] rounded-[25px] text-[14px] font-semibold text-black hover:bg-[#f5f5f5] transition-all duration-300 ease-in-out cursor-pointer w-[133px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSetReminder}
              disabled={isSaving}
              className="bg-[#de4a2c] py-[10px] rounded-[25px] text-[14px] font-semibold text-white hover:opacity-90 transition-all duration-300 ease-in-out cursor-pointer flex items-center justify-center w-[133px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Set Reminder
            </button>
          </div>
        </div>

        {/* Calendar Panel */}
        <div
          className={cn(
            "overflow-hidden transition-[width,max-width] duration-300 bg-white rounded-br-[10px] rounded-tr-[10px] flex flex-col items-center justify-center",
            showDateTimePicker
              ? "w-[439px] max-w-[439px] border-l-2 border-[#e6e6e6]"
              : "w-0 max-w-0 pointer-events-none border-l-0"
          )}
        >
          <div className="w-[439px] px-5 py-1.5 flex flex-col items-center justify-center">
            <div className="w-full max-w-[399px]">
              <DateTimePicker
                selectedDate={selectedDateTime || undefined}
                onSet={handleDateTimeSet}
                onCancel={() => setShowDateTimePicker(false)}
              />
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
          <div className="w-[439px] px-5 py-1.5 flex flex-col">
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
                        {index > 0 && <div className="h-px bg-[#E6E6E6] w-full" />}
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
                            {person.id === currentUserId && (
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
                    <div
                      className={cn(
                        'size-[17px] rounded-full flex items-center justify-center transition-colors',
                        sharedPeople.length > 0 && sharedPeople.every((sp) => sp.permission === 'view')
                          ? 'bg-[#0198F1]'
                          : 'bg-[#D9D9D9]'
                      )}
                    >
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
                    <div
                      className={cn(
                        'size-[17px] rounded-full flex items-center justify-center transition-colors',
                        sharedPeople.length > 0 && sharedPeople.every((sp) => sp.permission === 'edit')
                          ? 'bg-[#0198F1]'
                          : 'bg-[#D9D9D9]'
                      )}
                    >
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

export default SetReminderModal;

