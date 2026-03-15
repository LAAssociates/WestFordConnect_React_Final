import React from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils/cn';
import type { Lecture } from './types';

interface ScheduleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lecture: Lecture | null;
}

const ScheduleDetailsModal: React.FC<ScheduleDetailsModalProps> = ({ isOpen, onClose, lecture }) => {
  const getText = (value?: string | number | null) => (value === null || value === undefined ? '' : String(value));
  const scheduleDateText = lecture?.scheduleDate
    ? `${lecture.scheduleDate.getDate().toString().padStart(2, '0')}-${(lecture.scheduleDate.getMonth() + 1).toString().padStart(2, '0')}-${lecture.scheduleDate.getFullYear()}, ${lecture.scheduleDate.toLocaleDateString('en-US', { weekday: 'long' })}`
    : '';

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-end bg-black/40 transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClose}
    >
      <aside
        className={cn(
          'relative w-full max-w-[641px] bg-[#1C2745] text-white shadow-xl max-h-[calc(100dvh-64px)] overflow-hidden mt-16 transition-transform duration-300 ease-out flex flex-col border-t-[6px] border-t-[#232725]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {lecture && (
          <>
            {/* Header */}
            <div className="px-8 pt-4 pb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-px h-5 border-2 border-[#DE4A2C] rounded-full" />
                <h2 className="text-lg font-semibold text-white">Schedule Details</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-[26px] h-[26px] flex items-center justify-center rounded-full bg-white text-black hover:bg-[#F3F4F6] cursor-pointer transition"
                aria-label="Close"
              >
                <X className="w-3 h-3 stroke-3" />
              </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-[10px] mx-[15px] mb-[19px] px-[30px] pt-[35px] pb-[19px] max-h-full overflow-y-auto flex-1">
              <div className="flex flex-col gap-[25px]">
                {/* Level */}
                <div className='flex items-center'>
                  <label className="flex-1 text-[15px] font-semibold text-black mb-2 block">Level</label>
                  <div className="w-[71.5%] border border-[#e6e6e6] rounded-[5px] p-[10px]">
                    <p className="text-[15px] font-normal text-black">{getText(lecture.level)}</p>
                  </div>
                </div>

                {/* Program */}
                <div className='flex items-center'>
                  <label className="flex-1 text-[15px] font-semibold text-black mb-2 block">Program</label>
                  <div className="w-[71.5%] border border-[#e6e6e6] rounded-[5px] p-[10px]">
                    <p className="text-[15px] font-normal text-black">{getText(lecture.program)}</p>
                  </div>
                </div>

                {/* Module */}
                <div className='flex items-center'>
                  <label className="flex-1 text-[15px] font-semibold text-black mb-2 flex items-center gap-[10px]">
                    <span>Module</span>
                    <div className="w-5 h-5 rounded-[5px] bg-[#93c47d] shrink-0" />
                  </label>
                  <div className="w-[71.5%] border border-[#e6e6e6] rounded-[5px] p-[10px]">
                    <p className="text-[15px] font-normal text-black">{getText(lecture.module)}</p>
                  </div>
                </div>

                {/* Schedule Date */}
                <div className='flex items-center'>
                  <label className="flex-1 text-[15px] font-semibold text-black mb-2 block">Schedule Date</label>
                  <div className="w-[71.5%] border border-[#e6e6e6] rounded-[5px] p-[10px]">
                    <p className="text-[15px] font-normal text-black">{scheduleDateText}</p>
                  </div>
                </div>

                {/* Schedule Time */}
                <div className='flex items-center'>
                  <label className="flex-1 text-[15px] font-semibold text-black mb-2 block">Schedule Time</label>
                  <div className="w-[71.5%] border border-[#e6e6e6] rounded-[5px] p-[10px]">
                    <p className="text-[15px] font-normal text-black">{getText(lecture.scheduleTime)}</p>
                  </div>
                </div>

                {/* Days */}
                <div className='flex items-center'>
                  <label className="flex-1 text-[15px] font-semibold text-black mb-2 block">Days</label>
                  <div className="w-[71.5%] border border-[#e6e6e6] rounded-[5px] p-[10px]">
                    <p className="text-[15px] font-normal text-black">
                      {lecture.days?.join(' | ') || ''}
                    </p>
                  </div>
                </div>

                {/* Venue */}
                <div className='flex items-center'>
                  <label className="flex-1 text-[15px] font-semibold text-black mb-2 block">Venue</label>
                  <div className="w-[71.5%] border border-[#e6e6e6] rounded-[5px] p-[10px]">
                    <p className="text-[15px] font-normal text-black">{getText(lecture.venue)}</p>
                  </div>
                </div>

                {/* Mode */}
                <div className='flex items-center'>
                  <label className="flex-1 text-[15px] font-semibold text-black mb-2 block">Mode</label>
                  <div className="w-[71.5%] border border-[#e6e6e6] rounded-[5px] p-[10px]">
                    <p className="text-[15px] font-normal text-black">
                      {lecture.mode ? lecture.mode.charAt(0).toUpperCase() + lecture.mode.slice(1) : ''}
                    </p>
                  </div>
                </div>

                {/* Batch Code */}
                <div className='flex items-center'>
                  <label className="flex-1 text-[15px] font-semibold text-black mb-2 block">Batch Code</label>
                  <div className="w-[71.5%] border border-[#e6e6e6] rounded-[5px] p-[10px]">
                    <p className="text-[15px] font-normal text-black">{getText(lecture.batchCode)}</p>
                  </div>
                </div>

                {/* No. of Sessions */}
                <div className='flex items-center'>
                  <label className="flex-1 text-[15px] font-semibold text-black mb-2 block">No. of Sessions</label>
                  <div className="w-[71.5%] border border-[#e6e6e6] rounded-[5px] p-[10px]">
                    <p className="text-[15px] font-normal text-black">{getText(lecture.noOfSessions)}</p>
                  </div>
                </div>

                {/* No. of Students */}
                <div className='flex items-center'>
                  <label className="flex-1 text-[15px] font-semibold text-black mb-2 block">No. of Students</label>
                  <div className="w-[71.5%] border border-[#e6e6e6] rounded-[5px] p-[10px]">
                    <p className="text-[15px] font-normal text-black">{getText(lecture.noOfStudents)}</p>
                  </div>
                </div>

                {/* Course Admin */}
                <div className='flex items-center'>
                  <label className="flex-1 text-[15px] font-semibold text-black mb-2 block">Course Admin</label>
                  <div className="w-[71.5%] border border-[#e6e6e6] rounded-[5px] p-[10px]">
                    <p className="text-[15px] font-normal text-black">{getText(lecture.courseAdmin)}</p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-5 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#de4a2c] rounded-[25px] w-[130px] py-[10px] text-[14px] font-semibold text-white hover:bg-[#C62828] cursor-pointer transition"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>,
    document.body
  );
};

export default ScheduleDetailsModal;

