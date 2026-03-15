import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { createPortal } from 'react-dom';

export interface ConversationDropdownRef {
  isOpen: boolean;
}

interface ConversationDropdownProps {
  conversationId: string;
  conversationType: 'individual' | 'group';
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  isMuted?: boolean;
  isPinned?: boolean;
  unreadCount?: number;
  onMuteNotifications?: (conversationId: string) => void;
  onPinGroup?: (conversationId: string) => void;
  onMarkAsRead?: (conversationId: string) => void;
  onExitGroup?: (conversationId: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

const ConversationDropdown = forwardRef<ConversationDropdownRef, ConversationDropdownProps>(({
  conversationId,
  conversationType,
  buttonRef,
  isMuted = false,
  isPinned = false,
  unreadCount = 0,
  onMuteNotifications,
  onPinGroup,
  onMarkAsRead,
  onExitGroup,
  onOpenChange,
}, ref) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = 180;
    const OFFSET_PX = 8;
    const padding = 10;

    // Position dropdown to the right of the button, aligned to the right edge
    let menuLeft = rect.right - dropdownWidth;

    // Ensure menu stays within viewport bounds
    const maxLeft = window.innerWidth - dropdownWidth - padding;
    const minLeft = padding;

    if (menuLeft < minLeft) {
      menuLeft = minLeft;
    } else if (menuLeft > maxLeft) {
      menuLeft = maxLeft;
    }

    setMenuPosition({
      top: rect.bottom + OFFSET_PX,
      left: menuLeft,
    });
  }, [buttonRef]);

  useEffect(() => {
    if (!isDropdownOpen) return;

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
  }, [isDropdownOpen, updateMenuPosition]);

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (
        buttonRef.current?.contains(target) ||
        dropdownMenuRef.current?.contains(target)
      ) {
        return;
      }

      setIsDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen, buttonRef]);

  const handleMenuAction = (event: React.MouseEvent<HTMLButtonElement>, action: () => void) => {
    event.preventDefault();
    event.stopPropagation();
    action();
    setIsDropdownOpen(false);
  };

  // Expose isOpen state via ref
  useImperativeHandle(ref, () => ({
    isOpen: isDropdownOpen,
  }), [isDropdownOpen]);

  // Notify parent of open state changes
  useEffect(() => {
    onOpenChange?.(isDropdownOpen);
  }, [isDropdownOpen, onOpenChange]);

  // Listen to button clicks to toggle dropdown
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleButtonClick = (e: MouseEvent) => {
      e.stopPropagation();
      setIsDropdownOpen((prev) => !prev);
    };

    button.addEventListener('click', handleButtonClick);

    return () => {
      button.removeEventListener('click', handleButtonClick);
    };
  }, [buttonRef]);

  return (
    <>
      {isDropdownOpen && menuPosition && createPortal(
        <div
          ref={dropdownMenuRef}
          className="bg-[#232725] rounded-[10px] shadow-lg z-50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          <div className="p-2.5 flex flex-col">
            <button
              type="button"
              onClick={(e) => onMuteNotifications && handleMenuAction(e, () => onMuteNotifications(conversationId))}
              className="cursor-pointer flex items-center gap-2 h-[40px] pl-2.5 pr-2.5 rounded-[5px] text-sm font-medium text-white transition-colors hover:bg-[#2F3432] w-full"
            >
              {isMuted ? (
                <svg width="18" height="14" viewBox="0 0 18.5 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3.00001C12 3.00001 14 4.50001 14 7.00001C14 9.50001 12 11 12 11" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M15 1.00001C15 1.00001 17.5 3.25001 17.5 7.00001C17.5 10.75 15 13 15 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M10 12.4064C10 12.4064 10 12.9073 9.5 13.4073C9 13.9073 7.68244 13.987 7 13.4073L3.25391 10.4073H2C1.50001 10.4073 0.999992 10.4073 0.5 9.90733C6.76513e-06 9.40733 1.49123e-08 8.90732 0 7.90733C0.00298046 7.3604 0.000141762 6.92961 0 6.90733H10V12.4064Z" fill="white" />
                  <path d="M10 1.40635C9.99996 1.39813 9.99585 0.901221 9.5 0.405375C8.99996 -0.0945282 7.68242 -0.174232 7 0.405375L3.25391 3.40537H2C1.50003 3.40537 0.999965 3.40546 0.5 3.90537C3.0905e-05 4.40534 1.68101e-08 4.9055 0 5.90537C0.00297316 6.45096 0.000153652 6.88115 0 6.90537H10V1.40635Z" fill="white" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.3363 3.246C4.16656 3.08637 3.93921 2.99804 3.70324 3.00003C3.46726 3.00203 3.24153 3.09419 3.07466 3.25668C2.9078 3.41916 2.81314 3.63896 2.81109 3.86873C2.80904 4.09851 2.89976 4.31987 3.0637 4.48515L15.6637 16.754C15.8334 16.9136 16.0608 17.002 16.2968 17C16.5327 16.998 16.7585 16.9058 16.9253 16.7433C17.0922 16.5808 17.1869 16.361 17.1889 16.1313C17.191 15.9015 17.1002 15.6801 16.9363 15.5148L16.9327 15.5105C18.613 13.9418 19 11.6984 19 10C19.0015 8.84896 18.7693 7.70898 18.3169 6.64556C17.8645 5.58214 17.2008 4.61624 16.3639 3.80336C16.2809 3.71966 16.1816 3.6529 16.0718 3.60697C15.962 3.56104 15.8439 3.53686 15.7244 3.53585C15.6049 3.53484 15.4863 3.55701 15.3757 3.60108C15.2651 3.64514 15.1646 3.71021 15.0801 3.79249C14.9956 3.87478 14.9288 3.97262 14.8836 4.08032C14.8383 4.18802 14.8155 4.30342 14.8166 4.41978C14.8176 4.53614 14.8424 4.65113 14.8896 4.75805C14.9368 4.86497 15.0053 4.96167 15.0913 5.04251C15.7611 5.69268 16.2922 6.4654 16.6541 7.31621C17.016 8.16701 17.2015 9.07911 17.2 10C17.2 11.5354 16.8373 13.1864 15.6592 14.2704L14.3695 13.0146C15.0544 12.0769 15.4 10.9701 15.4 10C15.4 8.52949 14.779 7.19832 13.78 6.24486C13.696 6.16238 13.5961 6.09697 13.4859 6.05244C13.3758 6.00791 13.2576 5.98514 13.1383 5.98546C13.0191 5.98578 12.901 6.00918 12.7911 6.05431C12.6812 6.09943 12.5816 6.16537 12.4982 6.2483C12.4147 6.33123 12.3489 6.42949 12.3048 6.53738C12.2606 6.64526 12.2389 6.76062 12.2409 6.87674C12.243 6.99286 12.2687 7.10743 12.3166 7.21379C12.3645 7.32014 12.4336 7.41617 12.52 7.49628C12.862 7.82269 13.1337 8.21225 13.3191 8.64217C13.5046 9.07208 13.6 9.5337 13.6 10C13.6 10.5311 13.4245 11.1699 13.069 11.7492L10.9 9.63719V4.86023C10.9 3.37395 9.1198 2.56245 7.948 3.51416L6.1282 4.99081L4.3372 3.246H4.3363ZM2.8 6.49462H3.3274L10.9 13.8682V15.1398C10.9 16.6261 9.1198 17.4375 7.948 16.4858L4.2742 13.5054H2.8C2.32261 13.5054 1.86477 13.3207 1.52721 12.992C1.18964 12.6633 1 12.2175 1 11.7527V8.24731C1 7.78246 1.18964 7.33666 1.52721 7.00797C1.86477 6.67927 2.32261 6.49462 2.8 6.49462Z" fill="white" />
                </svg>
              )}
              <span className="whitespace-nowrap">{isMuted ? 'Allow Notifications' : 'Mute Notifications'}</span>
            </button>
            <button
              type="button"
              onClick={(e) => onPinGroup && handleMenuAction(e, () => onPinGroup(conversationId))}
              className="cursor-pointer flex items-center gap-2 h-[40px] pl-2.5 pr-2.5 rounded-[5px] text-sm font-medium text-white transition-colors hover:bg-[#2F3432] w-full"
            >
              {isPinned ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="5.03033" y1="0.96967" x2="19.0303" y2="14.9697" stroke="white" strokeWidth="1.5" />
                  <path d="M13.4053 10.4053L12.082 11.7285C12.1517 11.9321 12.2032 12.1412 12.2354 12.3555C12.2675 12.5699 12.2832 12.7846 12.2832 12.999C12.2832 13.3473 12.2483 13.6633 12.1787 13.9473C12.109 14.2313 12.0105 14.5 11.8818 14.752C11.7532 15.0039 11.5924 15.2426 11.3994 15.4678C11.2065 15.6929 10.9941 15.9258 10.7637 16.167L7.66016 13.0635L3.09375 17.6387L2 18L2.36133 16.9062L6.93652 12.3398L3.83301 9.23633L4.19531 8.87402C4.57044 8.49898 4.99918 8.21194 5.48145 8.01367C5.96373 7.81543 6.47293 7.71683 7.00879 7.7168C7.44832 7.7168 7.86947 7.78397 8.27148 7.91797L9.59375 6.59375L13.4053 10.4053ZM18 7.54785C17.8231 7.72471 17.6515 7.88557 17.4854 8.03027C17.3192 8.17496 17.1451 8.30102 16.9629 8.4082C16.7807 8.5154 16.585 8.59336 16.376 8.6416C16.167 8.68984 15.9257 8.71877 15.6523 8.72949C15.4702 8.72949 15.296 8.71377 15.1299 8.68164L14.9658 8.84473L11.1543 5.0332L11.3184 4.87012C11.2862 4.70403 11.2705 4.5298 11.2705 4.34766C11.2705 4.08523 11.2971 3.84954 11.3506 3.64062C11.4042 3.43158 11.4846 3.23253 11.5918 3.04492C11.699 2.85738 11.8226 2.68322 11.9619 2.52246C12.1012 2.36171 12.2646 2.18753 12.4521 2L18 7.54785Z" fill="white" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 7.54774C17.8231 7.72462 17.6516 7.88543 17.4854 8.03015C17.3193 8.17487 17.1451 8.30084 16.9628 8.40804C16.7806 8.51524 16.5849 8.59297 16.3759 8.64121C16.1668 8.68945 15.9256 8.71893 15.6523 8.72965C15.47 8.72965 15.2958 8.71357 15.1296 8.68141L12.0824 11.7286C12.1521 11.9323 12.203 12.1414 12.2352 12.3558C12.2673 12.5702 12.2834 12.7846 12.2834 12.999C12.2834 13.3474 12.2486 13.6637 12.1789 13.9477C12.1092 14.2318 12.0101 14.4998 11.8814 14.7518C11.7528 15.0037 11.592 15.2422 11.399 15.4673C11.206 15.6925 10.9943 15.9256 10.7638 16.1668L7.6603 13.0633L3.09347 17.6382L2 18L2.36181 16.9065L6.93668 12.3397L3.83317 9.23618L4.19497 8.87437C4.57018 8.49916 4.999 8.2124 5.48141 8.01407C5.96382 7.81575 6.47303 7.71658 7.00905 7.71658C7.44858 7.71658 7.86935 7.78358 8.27136 7.91759L11.3186 4.87035C11.2864 4.70419 11.2704 4.52998 11.2704 4.34774C11.2704 4.08509 11.2972 3.84925 11.3508 3.6402C11.4044 3.43116 11.4848 3.23283 11.592 3.04523C11.6992 2.85762 11.8224 2.68342 11.9618 2.52261C12.1012 2.36181 12.2647 2.1876 12.4523 2L18 7.54774Z" fill="white" />
                </svg>
              )}
              <span className="whitespace-nowrap">{isPinned ? `Unpin ${conversationType === 'group' ? 'Group' : 'Chat'}` : `Pin ${conversationType === 'group' ? 'Group' : 'Chat'}`}</span>
            </button>
            <button
              type="button"
              onClick={(e) => onMarkAsRead && handleMenuAction(e, () => onMarkAsRead(conversationId))}
              className="cursor-pointer flex items-center gap-2 h-[40px] pl-2.5 pr-2.5 rounded-[5px] text-sm font-medium text-white transition-colors hover:bg-[#2F3432] w-full"
            >
              {unreadCount === 0 ? (
                <svg width="18" height="15" viewBox="0 0 18.5002 14.6749" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.5002 2.5554C18.5009 2.0638 18.3596 1.58246 18.0933 1.16926C17.827 0.756053 17.4469 0.428582 16.9989 0.226219C16.5509 0.0238566 16.054 -0.0447824 15.5678 0.0285561C15.0817 0.101895 14.6272 0.314088 14.2588 0.639621C14.0594 0.815536 13.8884 1.02132 13.7521 1.24964V1.25203C13.7305 1.28792 13.7102 1.3246 13.6903 1.36128L13.6807 1.38081C13.6639 1.41231 13.6484 1.44421 13.6332 1.4765C13.6285 1.48647 13.6241 1.49644 13.6197 1.50641C13.6065 1.53551 13.5938 1.56502 13.5818 1.59492C13.5766 1.60728 13.5718 1.61964 13.5671 1.632C13.5563 1.65991 13.5459 1.68782 13.536 1.71613L13.5216 1.75839C13.5128 1.7855 13.5045 1.81301 13.4965 1.84052C13.4917 1.85607 13.4873 1.87122 13.4833 1.88677C13.4757 1.91349 13.4694 1.9406 13.463 1.96651C13.459 1.98286 13.455 1.99921 13.4514 2.01555C13.4458 2.04267 13.4407 2.07018 13.4359 2.0953C13.4327 2.11204 13.4295 2.12879 13.4267 2.14553C13.4223 2.17344 13.4187 2.20175 13.4151 2.23006C13.4132 2.2464 13.4108 2.26275 13.4088 2.2795C13.4056 2.3102 13.4036 2.3409 13.4012 2.372C13.4012 2.38635 13.3988 2.4007 13.398 2.41506C13.3956 2.46051 13.394 2.50596 13.394 2.55221C13.394 2.59208 13.394 2.63195 13.3972 2.66943V2.69495C13.3993 2.73243 13.4021 2.7699 13.4056 2.80738L13.408 2.82652C13.4116 2.86041 13.4155 2.8939 13.4207 2.92699C13.4207 2.93377 13.4207 2.94095 13.4235 2.94773C13.4291 2.98401 13.4359 3.01989 13.4431 3.05578C13.4431 3.06455 13.4466 3.07292 13.4482 3.08169C13.4554 3.11598 13.4634 3.15027 13.4722 3.18416V3.19173C13.4813 3.22722 13.4913 3.26191 13.5021 3.29659L13.5104 3.32371C13.5212 3.3576 13.5324 3.39069 13.5443 3.42378C13.5467 3.43096 13.5495 3.43813 13.5523 3.44531C13.5631 3.47362 13.5742 3.50193 13.5858 3.52984C13.589 3.53821 13.5922 3.54618 13.5958 3.55416C13.6093 3.58566 13.6233 3.61715 13.638 3.64825L13.6512 3.67497C13.6651 3.70288 13.6791 3.73078 13.6938 3.7583C13.902 4.14509 14.2059 4.47196 14.5766 4.70761C14.6739 4.76979 14.7754 4.82508 14.8804 4.87308L14.8959 4.88025C14.9666 4.91215 15.0388 4.94086 15.1124 4.96637L15.1503 4.97913L15.2101 4.99787C15.2281 5.00345 15.246 5.00824 15.2643 5.01342L15.3409 5.03336L15.4099 5.0493L15.4557 5.05847L15.5287 5.07163L15.5662 5.07761C15.602 5.0828 15.6383 5.08758 15.6746 5.09157L15.7053 5.09436C15.7344 5.09675 15.7639 5.09914 15.7934 5.10074L15.8277 5.10273C15.8676 5.10273 15.9051 5.10592 15.9441 5.10592C15.9904 5.10592 16.0358 5.10592 16.0813 5.10193L16.1243 5.09874C16.1554 5.09635 16.1861 5.09436 16.2168 5.09117L16.2667 5.08479C16.2946 5.0812 16.3229 5.07761 16.3508 5.07323L16.401 5.06406C16.4282 5.05927 16.4557 5.05409 16.4808 5.04851L16.5298 5.03694C16.5569 5.03056 16.5841 5.02419 16.6096 5.01661C16.6251 5.01262 16.6403 5.00824 16.6558 5.00345C16.6833 4.99548 16.7108 4.98711 16.738 4.97833L16.7802 4.96398C16.8085 4.95401 16.8364 4.94365 16.8643 4.93288L16.9014 4.91813C16.9313 4.90617 16.9608 4.89341 16.9899 4.88025L17.0198 4.8667C17.0521 4.85155 17.084 4.836 17.1155 4.81925L17.1351 4.80968C17.1717 4.78975 17.2084 4.76981 17.2443 4.74788H17.2467C17.4769 4.6126 17.6845 4.44231 17.8623 4.24312C18.274 3.77739 18.501 3.17702 18.5002 2.5554Z" fill="#008080" />
                  <path d="M13.5313 5.52576L9.32253 8.79913C9.21058 8.88617 9.07281 8.93341 8.931 8.93341C8.7892 8.93341 8.65143 8.88617 8.53947 8.79913L2.79812 4.33363C2.73066 4.28269 2.674 4.21885 2.63143 4.14582C2.58886 4.07279 2.56123 3.99203 2.55014 3.90824C2.53905 3.82444 2.54473 3.73927 2.56684 3.65768C2.58895 3.5761 2.62706 3.49972 2.67894 3.43299C2.73083 3.36625 2.79546 3.3105 2.86908 3.26896C2.9427 3.22742 3.02384 3.20093 3.10778 3.19102C3.19173 3.18111 3.27681 3.18799 3.35808 3.21125C3.43934 3.2345 3.51518 3.27368 3.58117 3.3265L8.931 7.48739L12.6876 4.56568C12.3241 3.97765 12.1269 3.30205 12.117 2.61082C12.1071 1.91959 12.2849 1.23862 12.6314 0.640421H2.23275C1.64078 0.641054 1.07324 0.876493 0.654657 1.29508C0.236072 1.71366 0.000633234 2.2812 0 2.87317V12.4421C0.000633234 13.0341 0.236072 13.6016 0.654657 14.0202C1.07324 14.4388 1.64078 14.6742 2.23275 14.6749H15.6293C16.2212 14.6742 16.7888 14.4388 17.2073 14.0202C17.6259 13.6016 17.8614 13.0341 17.862 12.4421V5.87104C17.1905 6.26002 16.4164 6.43533 15.6428 6.37366C14.8692 6.31198 14.1327 6.01623 13.5313 5.52576Z" fill="white" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.929 2.30261C9.25034 2.10484 9.62138 2 10 2C10.3786 2 10.7497 2.10484 11.071 2.30261L18.046 6.5985C18.1156 6.64117 18.1819 6.68769 18.2449 6.73806L10 11.0224L1.7506 6.74072C1.8148 6.69035 1.8823 6.64295 1.9531 6.5985L8.929 2.30261ZM1.0432 7.87936C1.01444 8.0162 0.999965 8.15559 1 8.29535V15.1112C1 15.8773 1.30817 16.6121 1.85671 17.1539C2.40526 17.6956 3.14924 18 3.925 18H16.075C16.4591 18 16.8395 17.9253 17.1943 17.7801C17.5492 17.6349 17.8717 17.4221 18.1433 17.1539C18.4149 16.8856 18.6304 16.5672 18.7773 16.2167C18.9243 15.8662 19 15.4905 19 15.1112V8.29535C19 8.15254 18.985 8.01269 18.955 7.87581L10.315 12.3646C10.2181 12.4152 10.1102 12.4417 10.0006 12.4418C9.89095 12.442 9.78295 12.4158 9.6859 12.3655L1.0432 7.87936Z" fill="white" />
                </svg>
              )}
              <span className="whitespace-nowrap">{unreadCount === 0 ? 'Mark as unread' : 'Mark as read'}</span>
            </button>
          </div>
          {conversationType === 'group' && (
            <>
              <div className="h-px bg-[#E6E6E6]" />
              <div className="p-2.5">
                <button
                  type="button"
                  onClick={(e) => onExitGroup && handleMenuAction(e, () => onExitGroup(conversationId))}
                  className="cursor-pointer flex items-center gap-2 h-[40px] pl-2.5 pr-2.5 rounded-[5px] text-sm font-medium text-white transition-colors hover:bg-[#2F3432] w-full"
                >
                  <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M7.34878 0.11424C7.75326 -0.00709581 8.1805 -0.032196 8.5964 0.0409427C9.01229 0.114081 9.40534 0.283433 9.74415 0.535481C10.083 0.787528 10.3582 1.11529 10.5478 1.49261C10.7374 1.86992 10.8362 2.28634 10.8363 2.70862V15.9144C10.8362 16.3367 10.7374 16.7531 10.5478 17.1304C10.3582 17.5077 10.083 17.8355 9.74415 18.0875C9.40534 18.3396 9.01229 18.5089 8.5964 18.5821C8.1805 18.6552 7.75326 18.6301 7.34878 18.5088L1.93066 16.8833C1.37268 16.716 0.883524 16.3732 0.535746 15.9058C0.187967 15.4385 9.55299e-05 14.8715 0 14.289V4.33406C9.55299e-05 3.75152 0.187967 3.18452 0.535746 2.71718C0.883524 2.24985 1.37268 1.90706 1.93066 1.73968L7.34878 0.11424ZM11.7393 2.08734C11.7393 1.84784 11.8344 1.61816 12.0038 1.44881C12.1731 1.27946 12.4028 1.18432 12.6423 1.18432H15.3514C16.0698 1.18432 16.7589 1.46974 17.267 1.97779C17.775 2.48583 18.0604 3.17489 18.0604 3.89338V4.7964C18.0604 5.0359 17.9653 5.26559 17.7959 5.43494C17.6266 5.60428 17.3969 5.69942 17.1574 5.69942C16.9179 5.69942 16.6882 5.60428 16.5189 5.43494C16.3495 5.26559 16.2544 5.0359 16.2544 4.7964V3.89338C16.2544 3.65389 16.1592 3.4242 15.9899 3.25485C15.8205 3.0855 15.5909 2.99036 15.3514 2.99036H12.6423C12.4028 2.99036 12.1731 2.89522 12.0038 2.72587C11.8344 2.55652 11.7393 2.32684 11.7393 2.08734ZM17.1574 12.9236C17.3969 12.9236 17.6266 13.0187 17.7959 13.1881C17.9653 13.3574 18.0604 13.5871 18.0604 13.8266V14.7296C18.0604 15.4481 17.775 16.1372 17.267 16.6452C16.7589 17.1533 16.0698 17.4387 15.3514 17.4387H12.6423C12.4028 17.4387 12.1731 17.3436 12.0038 17.1742C11.8344 17.0049 11.7393 16.7752 11.7393 16.5357C11.7393 16.2962 11.8344 16.0665 12.0038 15.8971C12.1731 15.7278 12.4028 15.6327 12.6423 15.6327H15.3514C15.5909 15.6327 15.8205 15.5375 15.9899 15.3682C16.1592 15.1988 16.2544 14.9691 16.2544 14.7296V13.8266C16.2544 13.5871 16.3495 13.3574 16.5189 13.1881C16.6882 13.0187 16.9179 12.9236 17.1574 12.9236ZM6.32115 8.40849C6.08165 8.40849 5.85196 8.50363 5.68261 8.67298C5.51327 8.84233 5.41813 9.07201 5.41813 9.31151C5.41813 9.551 5.51327 9.78069 5.68261 9.95004C5.85196 10.1194 6.08165 10.2145 6.32115 10.2145H6.32205C6.56155 10.2145 6.79123 10.1194 6.96058 9.95004C7.12993 9.78069 7.22507 9.551 7.22507 9.31151C7.22507 9.07201 7.12993 8.84233 6.96058 8.67298C6.79123 8.50363 6.56155 8.40849 6.32205 8.40849H6.32115Z" fill="white" />
                    <path d="M12.6426 9.30995H17.1577M17.1577 9.30995L15.3516 7.50391M17.1577 9.30995L15.3516 11.116" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="whitespace-nowrap">Exit Group</span>
                </button>
              </div>
            </>
          )}
        </div>,
        document.body
      )}
    </>
  );
});

ConversationDropdown.displayName = 'ConversationDropdown';

export default ConversationDropdown;
