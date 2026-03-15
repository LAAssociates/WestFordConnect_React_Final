import {
  MoreVertical,
  Share2,
  Star,
  Edit,
  Download,
  Info,
  Trash2,
  Loader2
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import BrochurePlaceholderImage from '../../assets/images/brochures-placeholder.png';
import { cn } from '../../lib/utils/cn';
import type { Brochure } from './types';
import { downloadFile } from '../../lib/utils/file';
import HighlightText from '../common/HighlightText';


export type BrochureCardProps = {
  brochure: Brochure;
  onShare: (brochure: Brochure) => void;
  onToggleFavorite: (id: string) => void;
  onEdit?: (brochureId: string, mode?: 'edit' | 'view') => void;
  onDelete?: (brochureId: string) => void;
  onError?: (message: string) => void;
  searchTerm?: string;
};



const DEFAULT_PROGRAM_TAG_STYLE = { background: '#1C2745' };

const BrochureCard: React.FC<BrochureCardProps> = ({ brochure, onShare, onToggleFavorite, onEdit, onDelete, onError, searchTerm = '' }) => {
  const programTagStyle = brochure.categoryColor
    ? { background: brochure.categoryColor }
    : DEFAULT_PROGRAM_TAG_STYLE;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const OFFSET_PX = 8;

    setMenuPosition({
      top: rect.bottom + OFFSET_PX,
      right: window.innerWidth - rect.right,
    });
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) {
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
  }, [isDropdownOpen, updateMenuPosition]);

  useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setIsDropdownOpen(false);
      setMenuPosition(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => {
      const next = !prev;

      if (next) {
        updateMenuPosition();
      } else {
        setMenuPosition(null);
      }

      return next;
    });
  };



  async function downloadBrochure() {
    if (isDownloading) return;
    const downloadUrl = brochure.link;

    if (!downloadUrl) {
      if (onError) onError('Download URL not available');
      return;
    }

    setIsDownloading(true);
    try {
      await downloadFile(downloadUrl, brochure.title);
    } catch (error) {
      if (onError) onError('Download failed');
    } finally {
      setIsDownloading(false);
      setIsDropdownOpen(false);
      setMenuPosition(null);
    }
  }

  const menuItems = [
    { id: 'edit', label: 'Edit', icon: Edit, onClick: () => { if (onEdit) onEdit(String(brochure.brochureId || brochure.id), 'edit'); } },
    { id: 'download', label: isDownloading ? 'Downloading...' : 'Download', icon: isDownloading ? Loader2 : Download, onClick: () => downloadBrochure() },
    { id: 'file-info', label: 'File Information', icon: Info, onClick: () => { if (onEdit) onEdit(String(brochure.brochureId || brochure.id), 'view'); } },
    { id: 'delete', label: 'Delete', icon: Trash2, onClick: () => { if (onDelete) onDelete(String(brochure.brochureId || brochure.id)); }, className: 'text-[#D93025]' },
  ];

  return (
    <article className="flex flex-col gap-4 p-[20px] hover:bg-[#E6E6E6] border-b border-[#E6E6E6] lg:flex-row lg:items-stretch">
      <div className="flex w-full justify-center sm:w-[122.875px] sm:justify-start">
        <img
          src={brochure.thumbnailUrl || BrochurePlaceholderImage}
          alt={brochure.title}
          className="h-auto w-40 object-cover sm:h-[175px] sm:w-[122.875px]"
          onError={(e) => {
            // Fallback to placeholder if thumbnail fails to load
            const target = e.target as HTMLImageElement;
            if (target.src !== BrochurePlaceholderImage) {
              target.src = BrochurePlaceholderImage;
            }
          }}
        />
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <header className="flex flex-col gap-[10px] sm:flex-row sm:items-start sm:justify-between flex-1">
          <div className="flex flex-col gap-[10px]">
            <h3 className="text-[16px] font-semibold text-[#111827]">
              <HighlightText text={brochure.title} highlight={searchTerm} />
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="inline-flex items-center rounded-full px-[10px] py-[2px] text-xs font-semibold text-white"
                style={{
                  backgroundColor: programTagStyle.background,
                }}
              >
                {brochure.program}
              </span>
            </div>
            <p className="text-sm text-[#535352] line-clamp-3 ">
              <HighlightText text={brochure.description} highlight={searchTerm} />
            </p>
          </div>

          <div className="relative self-end sm:self-auto">
            <button
              ref={triggerRef}
              type="button"
              onClick={toggleDropdown}
              className="cursor-pointer flex h-4 w-4 items-center justify-center text-[#344054] transition hover:bg-[#E6E6E6]"
              aria-label="More options"
              aria-expanded={isDropdownOpen}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isDropdownOpen && menuPosition &&
              createPortal(
                <div
                  ref={menuRef}
                  className="bg-[#232725] rounded-[10px] shadow-[0px_2px_20px_0px_rgba(0,0,0,0.25)] z-50 overflow-hidden"
                  style={{
                    position: 'fixed',
                    top: menuPosition.top,
                    right: menuPosition.right,
                    width: '180px',
                  }}
                >
                  <div className="p-2.5 flex flex-col">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            item.onClick();
                            if (item.id !== 'download') {
                              setIsDropdownOpen(false);
                              setMenuPosition(null);
                            }
                          }}
                          disabled={item.id === 'download' && isDownloading}
                          className={cn(
                            'cursor-pointer flex items-center gap-2 h-[40px] pl-2.5 pr-2.5 rounded-[5px] text-sm font-medium text-white transition-colors hover:bg-[#2F3432] w-full',
                            item.className,
                            item.id === 'download' && isDownloading && 'cursor-not-allowed opacity-70 hover:bg-transparent'
                          )}
                        >
                          <Icon className={cn("w-5 h-5 flex-shrink-0", item.id === 'download' && isDownloading && "animate-spin")} />
                          <span className="whitespace-nowrap">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>,
                document.body
              )
            }
          </div>
        </header>

        <footer className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleFavorite(brochure.id)}
            className={cn(
              'inline-flex w-full cursor-pointer items-center gap-[5px] rounded-full border border-[#CACACA] px-[15px] py-[5px] text-sm font-semibold text-black transition sm:w-auto'
            )}
          >
            <Star className={cn(
              "w-5 h-5 text-[#FFB74D]",
              !brochure.isFavorite && 'text-black'
            )} fill={brochure.isFavorite ? '#FFB74D' : 'none'} />
            Favorites
          </button>

          <button
            type="button"
            onClick={() => onShare(brochure)}
            className="inline-flex w-full cursor-pointer items-center gap-[5px] rounded-full border border-[#CACACA] px-[15px] py-[5px] text-sm font-semibold text-black transition sm:w-auto"
          >
            <Share2 className="w-5 h-5" />
            Share
          </button>
        </footer>
      </div>
    </article>
  );
};

export default BrochureCard;
