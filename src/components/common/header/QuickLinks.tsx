import { Plus } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Group from '../../../assets/icons/navigation/quick-links/group.svg';
import Notes from '../../../assets/icons/navigation/quick-links/notes.svg';
import Proposal from '../../../assets/icons/navigation/quick-links/proposal.svg';
import Reminder from '../../../assets/icons/navigation/quick-links/reminder.svg';
import Send from '../../../assets/icons/navigation/quick-links/send.svg';
import TaskIcon from '../../../assets/icons/navigation/quick-links/task.svg';
import { cn } from '../../../lib/utils/cn';
import Tooltip from '../../ui/Tooltip';
import SendDirectMessageModal from './SendDirectMessageModal';
import TaskDrawer from '../../my-work/TaskDrawer';
import type { Task } from '../../my-work/types';
import SetReminderModal from '../../notes/SetReminderModal';
import NewNoteModal from '../../notes/NewNoteModal';
import SubmitProposalDrawer from './SubmitProposalDrawer';

interface NavigateAction {
  type: 'navigate';
  path: string;
  params?: Record<string, string>;
}

interface ModalAction {
  type: 'modal';
  handler: () => void;
}

interface CallbackAction {
  type: 'callback';
  handler: () => void;
}

type Action = NavigateAction | ModalAction | CallbackAction;

interface StatusOption {
  id: number;
  label: string;
  icon: React.ReactNode;
  action: Action;
}

const StatusDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isSendDmModalOpen, setIsSendDmModalOpen] = useState(false);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [isSetReminderModalOpen, setIsSetReminderModalOpen] = useState(false);
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [isSubmitProposalDrawerOpen, setIsSubmitProposalDrawerOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

  const handleAction = useCallback((action: Action) => {
    if (action.type === 'modal') {
      action.handler();
    } else if (action.type === 'navigate') {
      const params = new URLSearchParams(action.params);
      const queryString = params.toString();
      const path = queryString ? `${action.path}?${queryString}` : action.path;
      navigate(path);
    } else if (action.type === 'callback') {
      action.handler();
    }

    // Close menu after action
    setIsOpen(false);
    setMenuPosition(null);
  }, [navigate]);

  const statusOptions: StatusOption[] = [
    {
      id: 1,
      label: 'Send Direct Message',
      icon: <img src={Send} alt="Send Direct Message" className='h-5 w-5' />,
      action: {
        type: 'modal',
        handler: () => setIsSendDmModalOpen(true)
      }
    },
    {
      id: 2,
      label: 'Create Group',
      icon: <img src={Group} alt="Create Group" className='h-5 w-5' />,
      action: {
        type: 'navigate',
        path: '/messenger',
        params: { view: 'add-members' }
      }
    },
    {
      id: 3,
      label: 'Create Task',
      icon: <img src={TaskIcon} alt="Create Task" className='h-5 w-5' />,
      action: {
        type: 'modal',
        handler: () => setIsTaskDrawerOpen(true)
      }
    },
    {
      id: 4,
      label: 'Set Reminder',
      icon: <img src={Reminder} alt="Set Reminder" className='h-5 w-5' />,
      action: {
        type: 'modal',
        handler: () => setIsSetReminderModalOpen(true)
      }
    },
    {
      id: 5,
      label: 'Take Notes',
      icon: <img src={Notes} alt="Take Notes" className='h-5 w-5' />,
      action: {
        type: 'modal',
        handler: () => setIsNewNoteModalOpen(true)
      }
    },
    {
      id: 6,
      label: 'Submit Proposal',
      icon: <img src={Proposal} alt="Submit Proposal" className='h-5 w-5' />,
      action: {
        type: 'modal',
        handler: () => setIsSubmitProposalDrawerOpen(true)
      }
    },
  ];

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const OFFSET_PX = 13;

    setMenuPosition({
      top: rect.bottom + OFFSET_PX,
      right: window.innerWidth - rect.right
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    updateMenuPosition();

    const handleWindowChange = () => {
      updateMenuPosition();
    };

    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [isOpen, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
      setMenuPosition(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => {
      const next = !prev;

      if (next) {
        updateMenuPosition();
      } else {
        setMenuPosition(null);
      }

      return next;
    });
  }, [updateMenuPosition]);

  return (
    <div className="flex items-center gap-4 relative">
      <Tooltip content="Quick Links" side="bottom" delay={100} disabled={isOpen}>
        <button
          ref={triggerRef}
          onClick={toggleMenu}
          className="cursor-pointer flex items-center bg-[#1C2745] rounded-full w-[38px] h-[38px]"
        >
          <Plus className="text-white mx-auto w-5 h-5" />
        </button>
      </Tooltip>

      {isOpen && menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            className="p-2.5 w-[216px] rounded-[10px] bg-[#232725] shadow-lg overflow-hidden z-50"
            style={{
              position: 'fixed',
              top: menuPosition.top,
              right: menuPosition.right
            }}
          >
            {statusOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAction(option.action)}
                className={cn(
                  "cursor-pointer w-full flex items-center gap-3 p-2.5 text-sm font-medium text-white hover:bg-[#42484B] transition-colors"
                )}
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )
      }

      {/* Send Direct Message Modal */}
      <SendDirectMessageModal
        isOpen={isSendDmModalOpen}
        onClose={() => setIsSendDmModalOpen(false)}
      />

      {/* Task Drawer */}
      <TaskDrawer
        isOpen={isTaskDrawerOpen}
        onClose={() => setIsTaskDrawerOpen(false)}
        onSubmit={(_taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
          setIsTaskDrawerOpen(false);
          navigate('/my-work');
        }}
      />

      {/* Set Reminder Modal */}
      <SetReminderModal
        isOpen={isSetReminderModalOpen}
        onClose={() => setIsSetReminderModalOpen(false)}
        onSetReminder={(_reminderData) => {
          // Handle reminder creation - could navigate to notes page or show success message
          setIsSetReminderModalOpen(false);
          navigate('/notes');
        }}
        currentUserId="user-1"
      />

      {/* New Note Modal */}
      <NewNoteModal
        isOpen={isNewNoteModalOpen}
        onClose={() => setIsNewNoteModalOpen(false)}
        onSave={(_noteData) => {
          // Handle note creation - could navigate to notes page or show success message
          setIsNewNoteModalOpen(false);
          navigate('/notes');
        }}
        onSaveDraft={(_noteData) => {
          // Handle draft save for quick-link notes.
          // Intentionally keep the modal open so autosave doesn't close it while typing.
          console.log('Quick link note draft saved:', _noteData);
        }}
      />

      {/* Submit Proposal Drawer */}
      <SubmitProposalDrawer
        isOpen={isSubmitProposalDrawerOpen}
        onClose={() => setIsSubmitProposalDrawerOpen(false)}
        onSubmit={(proposalData) => {
          // Handle proposal submission - could navigate to my-work page or show success message
          console.log('Proposal submitted:', proposalData);
          setIsSubmitProposalDrawerOpen(false);
          navigate('/my-work');
        }}
        onSaveDraft={(proposalData) => {
          // Handle draft save - could show a toast or just close
          console.log('Proposal saved as draft:', proposalData);
          setIsSubmitProposalDrawerOpen(false);
        }}
      />
    </div>
  );
};

export default StatusDropdown;
