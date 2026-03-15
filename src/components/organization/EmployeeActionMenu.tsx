import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mail, User, MessageSquare, Phone, FileText } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import type { Employee } from './types';

interface EmployeeActionMenuProps {
  employee: Employee;
  onSendEmail?: () => void;
  onViewProfile?: () => void;
  onSendDirectMessage?: () => void;
  onCall?: () => void;
  onViewSOP?: () => void;
  trigger: React.ReactNode;
  className?: string;
}

const EmployeeActionMenu: React.FC<EmployeeActionMenuProps> = ({
  employee,
  onSendEmail,
  onViewProfile,
  onSendDirectMessage,
  onCall,
  onViewSOP,
  trigger,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        const dropdown = document.getElementById('employee-action-menu');
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = (action: () => void | undefined) => {
    action?.();
    setIsOpen(false);
  };

  return (
    <>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn('cursor-pointer', className)}
      >
        {trigger}
      </div>

      {isOpen && position && typeof document !== 'undefined' && createPortal(
        <>
          {/* Arrow/Caret */}
          <div
            className="fixed z-[60]"
            style={{
              top: `${position.top - 4}px`,
              left: `${position.left + 10}px`,
            }}
          >
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-[#2C2C2C]" />
          </div>

          {/* Dropdown Menu */}
          <div
            id="employee-action-menu"
            className="fixed z-50 bg-[#2C2C2C] rounded-lg shadow-xl overflow-hidden min-w-[200px]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            {onSendEmail && (
              <button
                type="button"
                onClick={() => handleAction(onSendEmail)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#36363B] transition text-white text-left cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">Send Email</span>
              </button>
            )}

            {onViewProfile && (
              <button
                type="button"
                onClick={() => handleAction(onViewProfile)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#36363B] transition text-white text-left cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span className="text-sm">View Profile</span>
              </button>
            )}

            {onSendDirectMessage && (
              <button
                type="button"
                onClick={() => handleAction(onSendDirectMessage)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#36363B] transition text-white text-left cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">Send Direct Message</span>
              </button>
            )}

            {onCall && employee.officialNumber && (
              <button
                type="button"
                onClick={() => handleAction(onCall)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#36363B] transition text-white text-left cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">Call: {employee.officialNumber}</span>
              </button>
            )}

            {onViewSOP && (
              <button
                type="button"
                onClick={() => handleAction(onViewSOP)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#36363B] transition text-white text-left cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm">View SOP: Key Duties & Guidelines</span>
              </button>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default EmployeeActionMenu;
