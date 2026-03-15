import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import draftIcon from '../../assets/icons/draft-icon.png';

export type CustomToastProps = {
  title?: string;
  message: string;
  show: boolean;
  onClose: () => void;
  iconType?: 'check' | 'save' | 'reminder-unset' | 'reminder-set' | 'error';
  type?: 'success' | 'error';
  duration?: number;
};

const CustomToast: React.FC<CustomToastProps> = ({
  title,
  message,
  show,
  onClose,
  iconType = 'check',
  type = 'success',
  duration = 3000
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, onClose, duration]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-hidden={!show}
      className={cn(
        'fixed inset-0 z-100 flex h-full w-full items-center justify-center bg-black/30 transition-opacity duration-300',
        show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className={cn(
          "relative inline-flex w-96 flex-col gap-3 rounded-[10px] p-6 text-sm text-white shadow-lg transition-colors",
          type === 'error' ? 'bg-[#D93025]' : 'bg-[#16A34A]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#232725] text-white transition hover:bg-[#1F2937] cursor-pointer"
          aria-label="Close"
        >
          <X className="h-3 w-3 stroke-3" />
        </button>
        <div className="flex items-center gap-[5px]">
          {title && (
            <h3 className="text-[18px] font-semibold text-white whitespace-nowrap">{title}</h3>
          )}
          <div className="relative shrink-0 size-[24px]">
            {type === 'error' ? (
              <div className="size-[24px] rounded-full bg-white flex items-center justify-center">
                <X className="h-4 w-4 stroke-[#D93025] stroke-3" />
              </div>
            ) : iconType === 'save' ? (
              <img src={draftIcon} alt="Draft saved" className="h-6 w-6" />
            ) : iconType === 'reminder-set' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M16.7633 13.5679L15.5258 12.9491V11.4754C15.5243 10.5989 15.213 9.75106 14.6469 9.08187C14.0807 8.41269 13.2962 7.96523 12.432 7.81858V6.52539H11.1945V7.81858C10.3303 7.96523 9.54584 8.41269 8.9797 9.08187C8.41355 9.75106 8.10224 10.5989 8.10078 11.4754V12.9491L6.86328 13.5679V16.4254H10.5758V17.6629H13.0508V16.4254H16.7633V13.5679ZM15.5258 15.1879H8.10078V14.3329L9.33828 13.7142V11.4754C9.33828 10.819 9.59904 10.1895 10.0632 9.7253C10.5273 9.26115 11.1569 9.00039 11.8133 9.00039C12.4697 9.00039 13.0992 9.26115 13.5634 9.7253C14.0275 10.1895 14.2883 10.819 14.2883 11.4754V13.7142L15.5258 14.3329V15.1879Z" fill="white" />
                <path d="M15.5258 2.81289C15.5258 2.48469 15.3954 2.16992 15.1633 1.93785C14.9312 1.70577 14.6165 1.57539 14.2883 1.57539H11.8133V0.337891H10.5758V1.57539H5.62578V0.337891H4.38828V1.57539H1.91328C1.58508 1.57539 1.27031 1.70577 1.03824 1.93785C0.80616 2.16992 0.675781 2.48469 0.675781 2.81289V15.1879C0.675781 15.5161 0.80616 15.8309 1.03824 16.0629C1.27031 16.295 1.58508 16.4254 1.91328 16.4254H4.38828V15.1879H1.91328V2.81289H4.38828V4.05039H5.62578V2.81289H10.5758V4.05039H11.8133V2.81289H14.2883V6.52539H15.5258V2.81289Z" fill="white" />
              </svg>
            ) : iconType === 'reminder-unset' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.7633 16.5679L18.5258 15.9491V14.4754C18.5243 13.5989 18.213 12.7511 17.6469 12.0819C17.0807 11.4127 16.2962 10.9652 15.432 10.8186V9.52539H14.1945V10.8186C13.3303 10.9652 12.5458 11.4127 11.9797 12.0819C11.4136 12.7511 11.1022 13.5989 11.1008 14.4754V15.9491L9.86328 16.5679V19.4254H13.5758V20.6629H16.0508V19.4254H19.7633V16.5679ZM18.5258 18.1879H11.1008V17.3329L12.3383 16.7142V14.4754C12.3383 13.819 12.599 13.1895 13.0632 12.7253C13.5273 12.2611 14.1569 12.0004 14.8133 12.0004C15.4697 12.0004 16.0992 12.2611 16.5634 12.7253C17.0275 13.1895 17.2883 13.819 17.2883 14.4754V16.7142L18.5258 17.3329V18.1879Z" fill="white" />
                <path d="M18.5258 5.81289C18.5258 5.48469 18.3954 5.16992 18.1633 4.93785C17.9312 4.70577 17.6165 4.57539 17.2883 4.57539H14.8133V3.33789H13.5758V4.57539H8.62578V3.33789H7.38828V4.57539H4.91328C4.58508 4.57539 4.27031 4.70577 4.03824 4.93785C3.80616 5.16992 3.67578 5.48469 3.67578 5.81289V18.1879C3.67578 18.5161 3.80616 18.8309 4.03824 19.0629C4.27031 19.295 4.58508 19.4254 4.91328 19.4254H7.38828V18.1879H4.91328V5.81289H7.38828V7.05039H8.62578V5.81289H13.5758V7.05039H14.8133V5.81289H17.2883V9.52539H18.5258V5.81289Z" fill="white" />
                <path d="M2 4L21 20.1191" stroke="white" stroke-width="1.5" />
              </svg>
            ) : iconType === 'error' ? (
              <div className="size-[24px] rounded-full bg-white flex items-center justify-center">
                <X className="h-4 w-4 stroke-[#D93025] stroke-3" />
              </div>
            ) : (
              <div className="size-[24px] rounded-full bg-white flex items-center justify-center">
                <Check className="h-4 w-4 stroke-[#16A34A] stroke-3" />
              </div>
            )}
          </div>
        </div>
        <p className="text-[16px] font-normal text-white leading-normal">{message}</p>
      </div>
    </div>,
    document.body
  );
};

export default CustomToast;