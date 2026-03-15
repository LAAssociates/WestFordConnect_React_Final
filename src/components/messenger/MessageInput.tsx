import React, { useMemo, useRef, useState } from 'react';
import { cn } from '../../lib/utils/cn';

interface MentionUser {
  id: string;
  name: string;
}

interface MessageInputProps {
  onSend: (content: string) => void;
  onAttachImage?: () => void;
  onAttachFile?: () => void;
  onTyping?: () => void; // New prop
  disabled?: boolean;
  disabledPlaceholder?: string;
  isGroup?: boolean;
  mentionUsers?: MentionUser[];
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  onAttachImage,
  onAttachFile,
  onTyping,
  disabled = false,
  disabledPlaceholder,
  isGroup = false,
  mentionUsers = [],
}) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [highlightedMentionIndex, setHighlightedMentionIndex] = useState(0);

  const mentionCandidates = useMemo(() => {
    const allCandidates: MentionUser[] = [{ id: 'all', name: 'All' }, ...mentionUsers];
    if (!isGroup || mentionStart === null) return [];

    const q = mentionQuery.trim().toLowerCase();
    if (!q) return allCandidates;

    return allCandidates.filter((user) => user.name.toLowerCase().includes(q));
  }, [isGroup, mentionQuery, mentionStart, mentionUsers]);

  const closeMentionPicker = () => {
    setMentionStart(null);
    setMentionQuery('');
    setHighlightedMentionIndex(0);
  };

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      closeMentionPicker();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (isGroup) {
      const caretPos = e.target.selectionStart ?? value.length;
      const beforeCursor = value.slice(0, caretPos);
      const mentionMatch = beforeCursor.match(/(?:^|\s)@([A-Za-z0-9_]*)$/);

      if (mentionMatch) {
        const query = mentionMatch[1] ?? '';
        const atIndex = caretPos - query.length - 1;
        setMentionStart(atIndex);
        setMentionQuery(query);
        setHighlightedMentionIndex(0);
      } else {
        closeMentionPicker();
      }
    }

    onTyping?.();
  };

  const selectMention = (mention: MentionUser) => {
    if (mentionStart === null) return;

    const inputEl = inputRef.current;
    const caretPos = inputEl?.selectionStart ?? message.length;
    const mentionToken = `@${mention.name.replace(/\s+/g, '')} `;
    const nextMessage = `${message.slice(0, mentionStart)}${mentionToken}${message.slice(caretPos)}`;

    setMessage(nextMessage);
    closeMentionPicker();

    requestAnimationFrame(() => {
      if (!inputEl) return;
      inputEl.focus();
      const nextCaret = mentionStart + mentionToken.length;
      inputEl.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionCandidates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedMentionIndex((prev) => (prev + 1) % mentionCandidates.length);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedMentionIndex((prev) => (prev - 1 + mentionCandidates.length) % mentionCandidates.length);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        selectMention(mentionCandidates[highlightedMentionIndex] || mentionCandidates[0]);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        closeMentionPicker();
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-3 px-5 py-[18px] bg-white">
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={disabled ? (disabledPlaceholder || 'Send Message') : 'Send Message'}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="w-full pl-5 pr-24 py-3 border border-[#CACACA] rounded-full text-sm placeholder:text-black text-black font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:opacity-50"
        />
        {mentionCandidates.length > 0 && (
          <div className="absolute bottom-[52px] left-0 right-0 z-20 max-h-56 overflow-y-auto rounded-xl border border-[#D9D9D9] bg-white shadow-lg">
            {mentionCandidates.map((user, index) => {
              const isActive = index === highlightedMentionIndex;
              return (
                <button
                  key={user.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectMention(user)}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm',
                    isActive ? 'bg-[#EAF3FF] text-[#1E88E5]' : 'hover:bg-[#F5F7FA] text-[#262626]'
                  )}
                >
                  {user.name}
                </button>
              );
            })}
          </div>
        )}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onAttachImage}
            disabled={disabled}
            aria-label="Attach image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M16.4286 2.92857H3.57143C3.40093 2.92857 3.23742 2.9963 3.11686 3.11686C2.9963 3.23742 2.92857 3.40093 2.92857 3.57143V16.4286C2.92857 16.5991 2.9963 16.7626 3.11686 16.8831C3.23742 17.0037 3.40093 17.0714 3.57143 17.0714H16.4286C16.5991 17.0714 16.7626 17.0037 16.8831 16.8831C17.0037 16.7626 17.0714 16.5991 17.0714 16.4286V3.57143C17.0714 3.40093 17.0037 3.23742 16.8831 3.11686C16.7626 2.9963 16.5991 2.92857 16.4286 2.92857ZM3.57143 1C2.88944 1 2.23539 1.27092 1.75315 1.75315C1.27092 2.23539 1 2.88944 1 3.57143V16.4286C1 17.1106 1.27092 17.7646 1.75315 18.2468C2.23539 18.7291 2.88944 19 3.57143 19H16.4286C17.1106 19 17.7646 18.7291 18.2468 18.2468C18.7291 17.7646 19 17.1106 19 16.4286V3.57143C19 2.88944 18.7291 2.23539 18.2468 1.75315C17.7646 1.27092 17.1106 1 16.4286 1H3.57143ZM15.1429 13.6733L11.9286 10L8.74514 13.6386L6.78571 11.2857L4.85714 13.6V15.1429H15.1429V13.6733ZM8.07143 10C8.58292 10 9.07346 9.79681 9.43513 9.43513C9.79681 9.07346 10 8.58292 10 8.07143C10 7.55994 9.79681 7.0694 9.43513 6.70772C9.07346 6.34605 8.58292 6.14286 8.07143 6.14286C7.55994 6.14286 7.0694 6.34605 6.70772 6.70772C6.34605 7.0694 6.14286 7.55994 6.14286 8.07143C6.14286 8.58292 6.34605 9.07346 6.70772 9.43513C7.0694 9.79681 7.55994 10 8.07143 10Z" fill="#535352" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onAttachFile}
            disabled={disabled}
            aria-label="Attach file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M11.4286 1C12.3758 1 13.2842 1.39509 13.954 2.09835C14.6237 2.80161 15 3.75544 15 4.75V13.75C15 14.4394 14.8707 15.1221 14.6194 15.7591C14.3681 16.396 13.9998 16.9748 13.5355 17.4623C13.0712 17.9498 12.52 18.3365 11.9134 18.6004C11.3068 18.8642 10.6566 19 10 19C9.34339 19 8.69321 18.8642 8.08658 18.6004C7.47995 18.3365 6.92876 17.9498 6.46447 17.4623C6.00017 16.9748 5.63188 16.396 5.3806 15.7591C5.12933 15.1221 5 14.4394 5 13.75V7.75H6.42857V13.75C6.42857 14.7446 6.80485 15.6984 7.47462 16.4017C8.14439 17.1049 9.0528 17.5 10 17.5C10.9472 17.5 11.8556 17.1049 12.5254 16.4017C13.1952 15.6984 13.5714 14.7446 13.5714 13.75V4.75C13.5714 4.45453 13.516 4.16194 13.4083 3.88896C13.3006 3.61598 13.1428 3.36794 12.9438 3.15901C12.7448 2.95008 12.5086 2.78434 12.2486 2.67127C11.9886 2.5582 11.71 2.5 11.4286 2.5C11.1472 2.5 10.8685 2.5582 10.6085 2.67127C10.3486 2.78434 10.1123 2.95008 9.91334 3.15901C9.71436 3.36794 9.55652 3.61598 9.44883 3.88896C9.34114 4.16194 9.28571 4.45453 9.28571 4.75V13.75C9.28571 13.9489 9.36097 14.1397 9.49492 14.2803C9.62888 14.421 9.81056 14.5 10 14.5C10.1894 14.5 10.3711 14.421 10.5051 14.2803C10.639 14.1397 10.7143 13.9489 10.7143 13.75V5.5H12.1429V13.75C12.1429 14.3467 11.9171 14.919 11.5152 15.341C11.1134 15.7629 10.5683 16 10 16C9.43168 16 8.88663 15.7629 8.48477 15.341C8.08291 14.919 7.85714 14.3467 7.85714 13.75V4.75C7.85714 3.75544 8.23342 2.80161 8.90319 2.09835C9.57296 1.39509 10.4814 1 11.4286 1Z" fill="#535352" />
            </svg>
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className={cn('transition-all', message.trim() && !disabled ? 'hover:scale-105' : 'cursor-not-allowed')}
        aria-label="Send message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="20" fill="#008080" />
          <path d="M26.7076 8.24511L9.75635 13.8955C9.08839 14.1195 8.50577 14.5441 8.08793 15.1114C7.67009 15.6786 7.43736 16.3609 7.42147 17.0652C7.40559 17.7696 7.60731 18.4617 7.99915 19.0472C8.39099 19.6327 8.95388 20.0831 9.61106 20.337L15.883 22.7344C16.0318 22.7953 16.1669 22.8851 16.2806 22.9988C16.3942 23.1124 16.4841 23.2476 16.5449 23.3963L18.9423 29.6683C19.1469 30.2011 19.4813 30.6743 19.9153 31.0449C20.3492 31.4155 20.8689 31.6718 21.4271 31.7905C21.9853 31.9092 22.5644 31.8865 23.1116 31.7246C23.6588 31.5626 24.1568 31.2664 24.5605 30.8629C24.9346 30.4812 25.2187 30.0206 25.3919 29.5149L31.0423 12.5637C31.2415 11.9611 31.2694 11.3151 31.1228 10.6977C30.9763 10.0803 30.6611 9.51571 30.2124 9.06699C29.7636 8.61828 29.1991 8.30306 28.5816 8.15651C27.9642 8.00996 27.3182 8.03784 26.7157 8.23704L26.7076 8.24511ZM28.8709 11.8452L23.2205 28.7965C23.1434 29.0162 23.0009 29.207 22.8122 29.3434C22.6236 29.4797 22.3977 29.5552 22.165 29.5596C21.9322 29.564 21.7037 29.4971 21.51 29.3679C21.3163 29.2388 21.1668 29.0535 21.0814 28.8369L18.676 22.573C18.643 22.4901 18.6053 22.4093 18.5629 22.3308L24.1246 16.7692C24.3387 16.5551 24.4589 16.2647 24.4589 15.962C24.4589 15.6592 24.3387 15.3689 24.1246 15.1548C23.9105 14.9407 23.6201 14.8204 23.3174 14.8204C23.0146 14.8204 22.7242 14.9407 22.5102 15.1548L16.9485 20.7164C16.8701 20.674 16.7892 20.6363 16.7064 20.6034L10.4425 18.1979C10.2259 18.1126 10.0406 17.963 9.91142 17.7693C9.78224 17.5757 9.71536 17.3471 9.71975 17.1144C9.72415 16.8816 9.7996 16.6558 9.93599 16.4671C10.0724 16.2784 10.2632 16.136 10.4828 16.0588L27.4341 10.4084C27.6341 10.3439 27.8479 10.3359 28.0522 10.3852C28.2564 10.4344 28.4431 10.5391 28.5917 10.6877C28.7402 10.8362 28.8449 11.0229 28.8942 11.2272C28.9435 11.4314 28.9354 11.6453 28.8709 11.8452Z" fill="white" />
        </svg>
      </button>
    </div>
  );
};

export default MessageInput;


