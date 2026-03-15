import React, { useState, useEffect, useCallback } from 'react';
import { Share2, X, Loader2 } from 'lucide-react';
import type { Brochure } from './types';
import { courseService } from '../../services/courseService';

export type ShareBrochureModalProps = {
  brochure: Brochure | null;
  onClose: () => void;
  onCopy: (link: string) => void;
};

const ShareBrochureModal: React.FC<ShareBrochureModalProps> = ({ brochure, onClose, onCopy }) => {
  const [shareLink, setShareLink] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateShareLink = useCallback(async () => {
    if (!brochure) {
      setError('Invalid brochure');
      return;
    }

    // Use brochureId if available, otherwise try to parse id
    console.log(brochure);

    const entityId = brochure.brochureId || parseInt(brochure.id, 10);

    if (!entityId || isNaN(entityId)) {
      setError('Invalid brochure ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await courseService.shareBrochure({
        entityId: entityId
      });

      if (response.success && response.result) {
        setShareLink(response.result.shareLink);
      } else {
        setError('Failed to generate share link');
      }
    } catch (err) {
      console.error('Failed to generate share link:', err);
      setError('Failed to generate share link');
    } finally {
      setIsLoading(false);
    }
  }, [brochure]);

  useEffect(() => {
    if (brochure) {
      generateShareLink();
    }
  }, [brochure, generateShareLink]);

  if (!brochure) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 px-4" onClick={onClose}>
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md p-6 space-y-6" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start gap-2.5">
          <Share2 className="w-6 h-6 stroke-2" />
          <h2 className="text-lg font-semibold">Share this Brochure</h2>
        </header>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 h-6 w-6 inline-flex items-center justify-center rounded-full text-white bg-[#232725] hover:bg-[#1F2937] transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-3 h-3 stroke-3" />
        </button>

        <div className="flex flex-col gap-[5px]">
          <label className="text-[15px] font-semibold">
            Brochure Link
          </label>
          <div className="flex items-center gap-3">
            <input
              readOnly
              value={isLoading ? 'Generating link...' : error ? 'Error generating link' : shareLink}
              className="flex-1 rounded-[5px] border border-[#E6E6E6] p-2.5 text-[15px] text-[#535352] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40"
            />
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-[#535352]" />}
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2 px-[18px]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center rounded-full border border-[#E4E7EC] px-4 py-2.5 text-sm font-semibold text-[#475467] hover:bg-[#F3F4F6] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isLoading || !shareLink || !!error}
            onClick={() => shareLink && onCopy(shareLink)}
            className="flex-1 inline-flex items-center justify-center rounded-full bg-[#DE4A2C] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#C92A2E] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Copy Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareBrochureModal;
