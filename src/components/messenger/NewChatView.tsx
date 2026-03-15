import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { User } from './types';
import UserListItem from './UserListItem';
import SearchInput from './SearchInput';
import BackButtonHeader from './BackButtonHeader';
import EmptyState from './EmptyState';
import { MacScrollbar } from 'mac-scrollbar';

interface NewChatViewProps {
  contacts: User[];
  onSelectContact: (user: User) => void;
  onCreateGroup: () => void;
  onBack: () => void;
}

const NewChatView: React.FC<NewChatViewProps> = ({
  contacts,
  onSelectContact,
  onCreateGroup,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [fadingOutUserId, setFadingOutUserId] = useState<string | null>(null);

  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (contact) =>
          contact.name.toLowerCase().includes(query) ||
          contact.position.toLowerCase().includes(query) ||
          contact.email.toLowerCase().includes(query)
      );
    }

    // Exclude fading out user to trigger exit animation
    if (fadingOutUserId) {
      filtered = filtered.filter((contact) => contact.id !== fadingOutUserId);
    }

    return filtered;
  }, [contacts, searchQuery, fadingOutUserId]);

  const handleContactClick = (contact: User) => {
    setFadingOutUserId(contact.id);
    // Wait for animation to complete before calling onSelectContact
    setTimeout(() => {
      onSelectContact(contact);
      setFadingOutUserId(null);
    }, 300); // Match animation duration
  };

  return (
    <div className="w-[475px] bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-[15px] p-5 pb-[30px]">
        <BackButtonHeader title="New Chat" onBack={onBack} />

        {/* Search Bar */}
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search staff or project groups..."
        />

        {/* New Group Button */}
        <button
          type="button"
          onClick={onCreateGroup}
          className="flex items-center gap-2.5 w-fit"
        >
          <div className="w-10 h-10 bg-[#1E88E5] rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M14.0833 12C14.7261 12 15.3545 11.8241 15.8889 11.4944C16.4234 11.1648 16.84 10.6962 17.0859 10.1481C17.3319 9.59987 17.3963 8.99667 17.2709 8.41473C17.1455 7.83279 16.836 7.29824 16.3814 6.87868C15.9269 6.45912 15.3478 6.1734 14.7174 6.05765C14.0869 5.94189 13.4335 6.0013 12.8396 6.22836C12.2458 6.45543 11.7382 6.83994 11.3811 7.33329C11.0239 7.82664 10.8333 8.40666 10.8333 9C10.8333 9.79565 11.1757 10.5587 11.7852 11.1213C12.3947 11.6839 13.2214 12 14.0833 12ZM14.0833 8C14.2976 8 14.507 8.05865 14.6852 8.16853C14.8634 8.27841 15.0022 8.43459 15.0842 8.61732C15.1662 8.80004 15.1877 9.00111 15.1459 9.19509C15.1041 9.38907 15.0009 9.56726 14.8494 9.70711C14.6979 9.84696 14.5048 9.9422 14.2947 9.98079C14.0845 10.0194 13.8667 9.99957 13.6688 9.92388C13.4708 9.84819 13.3016 9.72002 13.1826 9.55557C13.0635 9.39112 13 9.19778 13 9C13 8.73478 13.1141 8.48043 13.3173 8.29289C13.5205 8.10536 13.796 8 14.0833 8ZM18.5358 11.86C19.1696 11.021 19.5095 10.0228 19.5095 9C19.5095 7.97718 19.1696 6.97897 18.5358 6.14C18.8474 6.04726 19.1727 6.00002 19.5 6C20.362 6 21.1886 6.31607 21.7981 6.87868C22.4076 7.44129 22.75 8.20435 22.75 9C22.75 9.79565 22.4076 10.5587 21.7981 11.1213C21.1886 11.6839 20.362 12 19.5 12C19.1727 12 18.8474 11.9527 18.5358 11.86ZM14.0833 14C7.58333 14 7.58333 18 7.58333 18V20H20.5833V18C20.5833 18 20.5833 14 14.0833 14ZM9.75 18C9.75 17.71 10.0967 16 14.0833 16C17.875 16 18.3517 17.56 18.4167 18M26 18V20H22.75V18C22.7247 17.2566 22.5392 16.5254 22.2044 15.8489C21.8696 15.1724 21.3922 14.5643 20.8 14.06C26 14.55 26 18 26 18ZM8.66667 13H5.41667V16H3.25V13H0V11H3.25V8H5.41667V11H8.66667V13Z" fill="white" />
            </svg>
          </div>
          <span className="font-medium text-[#262626]">New Group</span>
        </button>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-hidden">
        <MacScrollbar className="h-full">
          <div>
            {filteredContacts.length === 0 ? (
              <EmptyState message="No contacts found" />
            ) : (
              <AnimatePresence>
                {filteredContacts.map((contact) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <UserListItem
                      user={contact}
                      onClick={() => handleContactClick(contact)}
                      searchQuery={searchQuery}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </MacScrollbar>
      </div>
    </div>
  );
};

export default NewChatView;





