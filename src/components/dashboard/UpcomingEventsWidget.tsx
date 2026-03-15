import React, { useState, useMemo } from 'react';
import DashboardWidget from './DashboardWidget';
import { MacScrollbar } from 'mac-scrollbar';
import { calendarTasks, calendarMeetings } from '../calendar/mockData';
import { mockUpcomingEvents } from './mockData';

export interface UpcomingEvent {
  id: string;
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  timeRange?: string; // e.g., "09:00 AM - 1:00 PM"
  location?: string;
  type: 'task' | 'meeting' | 'holiday' | 'birthday';
  assignedTo?: string; // For filtering "My Events"
}

interface UpcomingEventsWidgetProps {
  events?: UpcomingEvent[];
  variant?: 'default' | 'with-events' | 'scrolled';
  onFilterClick?: () => void;
  onEventClick?: (eventId: string) => void;
  onEventManagementClick?: () => void;
  filterButtonRef?: React.RefObject<HTMLButtonElement | null>;
  filters?: { viewType: string; timeFrame: string };
  currentUserId?: string; // For filtering "My Events"
}

// Design variables extracted from Figma design (node-id: 329-7969)
// Reference: https://www.figma.com/design/ekD3vfFZkc41SAoKEmHIrN/Westford-Connect-_-HRMS---Dev?node-id=329-7969&m=dev
export const DESIGN_VARIABLES = {
  // Button styles
  button: {
    backgroundColor: '#008080',
    hoverBackgroundColor: '#006666',
    textColor: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '600',
    paddingX: '25px',
    paddingY: '10px',
    borderRadius: '25px',
    gap: '10px',
  },
  // Event card styles
  eventCard: {
    backgroundColor: '#f6f6f6',
    borderColor: '#e6e6e6',
    borderRadius: '5px',
    shadow: '0px 2px 4px rgba(0,0,0,0.1)',
    padding: '10px',
    gap: '10px',
  },
  // Calendar badge styles
  calendarBadge: {
    width: '56px',
    height: '63px',
    backgroundColor: '#008080',
    dayFontSize: '18px',
    dayFontWeight: '600',
    monthFontSize: '12px',
    monthFontWeight: '400',
    textColor: '#FFFFFF',
  },
  // Text styles
  text: {
    titleFontSize: '16px',
    titleFontWeight: '600',
    titleColor: '#000000',
    timeFontSize: '14px',
    timeFontWeight: '400',
    timeColor: '#535352',
    locationFontSize: '14px',
    locationFontWeight: '400',
    locationColor: '#535352',
    emptyStateFontSize: '16px',
    emptyStateFontWeight: '400',
    emptyStateColor: '#535352',
  },
  // Icon sizes
  icons: {
    clockSize: '14px',
    locationSize: '14px',
    arrowSize: '14px',
    buttonArrowWidth: '16px',
    buttonArrowHeight: '14px',
  },
  // Spacing
  spacing: {
    eventItemGap: '10px',
    eventListGap: '10px',
    buttonBottomOffset: '15px',
  },
} as const;

// Convert tasks and meetings to events for display
const convertToEvents = (): UpcomingEvent[] => {
  const events: UpcomingEvent[] = [];

  // Add tasks
  calendarTasks.forEach((task) => {
    // Format time range if dueTime exists
    let timeRange: string | undefined;
    if (task.dueTime) {
      if (task.dueTime === 'EOD') {
        timeRange = undefined; // Don't show EOD as a time range
      } else {
        timeRange = task.dueTime;
      }
    }

    // Get location from venue
    let location: string | undefined;
    if (task.venue && task.venue !== 'N/A') {
      location = task.venue;
    }

    events.push({
      id: task.id,
      title: task.title,
      date: task.dueDate,
      timeRange,
      location,
      type: 'task',
    });
  });

  // Add meetings
  calendarMeetings.forEach((meeting) => {
    events.push({
      id: meeting.id,
      title: meeting.title,
      date: meeting.date,
      timeRange: meeting.time,
      location: meeting.location,
      type: 'meeting',
    });
  });

  // Sort by date and return first 7 events
  return events
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 7);
};

// Calendar Date Badge Component
const CalendarDateBadge: React.FC<{ date: Date }> = ({ date }) => {
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

  return (
    <div className="relative flex-shrink-0 w-[56px] h-fit">
      {/* Calendar background */}
      <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52" fill="none">
        <path d="M13.9981 0C14.5285 0 15.0372 0.210713 15.4123 0.585786C15.7874 0.960859 15.9982 1.46957 15.9982 2V2.67467C16.9138 2.66756 17.9085 2.66489 18.9823 2.66667H33.015C34.0889 2.66667 35.0836 2.66933 35.9992 2.67467V2C35.9992 1.46957 36.2099 0.960859 36.585 0.585786C36.9601 0.210713 37.4688 0 37.9993 0C38.5297 0 39.0385 0.210713 39.4136 0.585786C39.7887 0.960859 39.9994 1.46957 39.9994 2V2.80267C40.0314 2.80267 40.0625 2.80533 40.0927 2.81067C41.9862 2.95467 43.5836 3.26133 45.0423 3.96267C47.4011 5.08502 49.3452 6.92355 50.5973 9.216C51.3626 10.6347 51.6907 12.184 51.848 13.9973C52 15.7627 52 17.9493 52 20.6907V33.9733C52 36.7173 52 38.9067 51.848 40.6693C51.688 42.4827 51.3626 44.032 50.5973 45.448C49.3456 47.7414 47.4015 49.5809 45.0423 50.704C43.5836 51.4053 41.9862 51.712 40.0927 51.856C38.2366 52 35.9325 52 33.015 52H18.985C16.0675 52 13.7634 52 11.9073 51.856C10.0138 51.7093 8.41643 51.4053 6.95769 50.704C4.59892 49.5816 2.65483 47.7431 1.40274 45.4507C0.637366 44.032 0.30935 42.4827 0.152008 40.6693C4.27189e-07 38.904 0 36.7173 0 33.976V20.6933C0 17.9493 4.27189e-07 15.76 0.152008 13.9973C0.312016 12.184 0.637366 10.6347 1.40274 9.21867C2.65439 6.92522 4.59852 5.08572 6.95769 3.96267C8.41643 3.26133 10.0138 2.95467 11.9073 2.81067L11.9979 2.8V2C11.9979 1.46957 12.2087 0.960859 12.5838 0.585786C12.9589 0.210713 13.4676 0 13.9981 0ZM11.9979 6.816C10.4592 6.94933 9.47515 7.18933 8.69111 7.568C7.09212 8.3238 5.77249 9.56498 4.92025 11.1147C4.61624 11.68 4.39756 12.3573 4.25355 13.3333H47.7465C47.5998 12.3573 47.3811 11.68 47.0771 11.1173C46.226 9.56707 44.9073 8.32496 43.3089 7.568C42.5222 7.18933 41.5381 6.94933 39.9994 6.816V7.33333C39.9994 7.86377 39.7887 8.37247 39.4136 8.74755C39.0385 9.12262 38.5297 9.33333 37.9993 9.33333C37.4688 9.33333 36.9601 9.12262 36.585 8.74755C36.2099 8.37247 35.9992 7.86377 35.9992 7.33333V6.67467C35.0907 6.66756 34.0684 6.66489 32.9324 6.66667H19.065C17.9289 6.66667 16.9066 6.66933 15.9982 6.67467V7.33333C15.9982 7.86377 15.7874 8.37247 15.4123 8.74755C15.0372 9.12262 14.5285 9.33333 13.9981 9.33333C13.4676 9.33333 12.9589 9.12262 12.5838 8.74755C12.2087 8.37247 11.9979 7.86377 11.9979 7.33333V6.816Z" fill="#9A9A9A" />
      </svg>
      {/* Day number */}
      <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2">
        <span className="text-[18px] font-semibold text-white leading-normal">{day}</span>
      </div>
      {/* Month abbreviation */}
      <div className="absolute left-1/2 top-[calc(50%+14px)] -translate-y-1/2 -translate-x-1/2">
        <span className="text-[12px] font-normal text-white leading-normal">{month}</span>
      </div>
    </div>
  );
};

// Event Card Component
const EventCard: React.FC<{
  event: UpcomingEvent;
  onClick?: () => void;
}> = ({ event, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="relative bg-[#F6F6F6] border border-[#E6E6E6] rounded-[5px] shadow-[0_2px_4px_0_rgba(0,0,0,0.10)] p-[10px] hover:bg-[#f0f0f0] transition-colors"
    >
      <div className="flex items-start gap-[9px]">
        {/* Calendar Date Badge */}
        <div className="flex-shrink-0">
          <CalendarDateBadge date={event.date} />
        </div>

        {/* Event Details */}
        <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
          <h3 className="text-[16px] font-semibold text-black leading-normal line-clamp-1">
            {event.title}
          </h3>

          {/* Time Range */}
          {event.timeRange && (
            <div className="flex items-center gap-[10px]">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 0C10.8661 0 14 3.1339 14 7C14 10.8661 10.8661 14 7 14C3.1339 14 0 10.8661 0 7C0 3.1339 3.1339 0 7 0ZM7 1.4C5.51479 1.4 4.09041 1.99 3.0402 3.0402C1.99 4.09041 1.4 5.51479 1.4 7C1.4 8.48521 1.99 9.90959 3.0402 10.9598C4.09041 12.01 5.51479 12.6 7 12.6C8.48521 12.6 9.90959 12.01 10.9598 10.9598C12.01 9.90959 12.6 8.48521 12.6 7C12.6 5.51479 12.01 4.09041 10.9598 3.0402C9.90959 1.99 8.48521 1.4 7 1.4ZM7 2.8C7.17145 2.80002 7.33694 2.86297 7.46506 2.9769C7.59318 3.09083 7.67504 3.24782 7.6951 3.4181L7.7 3.5V6.7102L9.5949 8.6051C9.72044 8.73107 9.79333 8.9001 9.79876 9.07787C9.80419 9.25563 9.74175 9.4288 9.62413 9.56219C9.5065 9.69559 9.34251 9.77921 9.16547 9.79608C8.98842 9.81295 8.81159 9.76179 8.6709 9.653L8.6051 9.5949L6.5051 7.4949C6.39631 7.38601 6.32643 7.2443 6.3063 7.0917L6.3 7V3.5C6.3 3.31435 6.37375 3.1363 6.50503 3.00503C6.6363 2.87375 6.81435 2.8 7 2.8Z" fill="#DE4A2C" />
              </svg>
              <span className="text-[14px] font-normal text-[#535352] leading-normal">
                {event.timeRange}
              </span>
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-[10px]">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="15" viewBox="0 0 13 15" fill="none">
                <path d="M6.08392 8.08386C7.18846 8.08386 8.08386 7.18846 8.08386 6.08392C8.08386 4.97939 7.18846 4.08398 6.08392 4.08398C4.97939 4.08398 4.08398 4.97939 4.08398 6.08392C4.08398 7.18846 4.97939 8.08386 6.08392 8.08386Z" stroke="#1C2745" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M6.08317 0.75C4.66873 0.75 3.31221 1.31189 2.31205 2.31205C1.31189 3.31221 0.75 4.66873 0.75 6.08317C0.75 7.34447 1.01799 8.16977 1.74997 9.08308L6.08317 14.0829L10.4164 9.08308C11.1483 8.16977 11.4163 7.34447 11.4163 6.08317C11.4163 4.66873 10.8545 3.31221 9.85429 2.31205C8.85413 1.31189 7.49762 0.75 6.08317 0.75Z" stroke="#1C2745" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span className="text-[14px] font-normal text-[#535352] leading-normal">
                {event.location}
              </span>
            </div>
          )}
        </div>

        {/* Arrow Icon */}
        <div className="absolute right-2.5 bottom-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.52778 1.55556C1.99111 1.55556 1.55556 1.99111 1.55556 2.52778V11.4722C1.55556 12.0089 1.99111 12.4444 2.52778 12.4444H11.4722C12.0089 12.4444 12.4444 12.0089 12.4444 11.4722V8.55556C12.4444 8.34928 12.5264 8.15145 12.6722 8.00558C12.8181 7.85972 13.0159 7.77778 13.2222 7.77778C13.4285 7.77778 13.6263 7.85972 13.7722 8.00558C13.9181 8.15145 14 8.34928 14 8.55556V11.4722C14 12.1426 13.7337 12.7856 13.2596 13.2596C12.7856 13.7337 12.1426 14 11.4722 14H2.52778C1.85737 14 1.21442 13.7337 0.740369 13.2596C0.266319 12.7856 0 12.1426 0 11.4722V2.52778C0 1.85737 0.266319 1.21442 0.740369 0.740369C1.21442 0.266319 1.85737 0 2.52778 0H5.44444C5.65072 0 5.84855 0.0819442 5.99442 0.227806C6.14028 0.373667 6.22222 0.571498 6.22222 0.777778C6.22222 0.984057 6.14028 1.18189 5.99442 1.32775C5.84855 1.47361 5.65072 1.55556 5.44444 1.55556H2.52778ZM8.55556 1.55556C8.34928 1.55556 8.15145 1.47361 8.00558 1.32775C7.85972 1.18189 7.77778 0.984057 7.77778 0.777778C7.77778 0.571498 7.85972 0.373667 8.00558 0.227806C8.15145 0.0819442 8.34928 0 8.55556 0H13.2222C13.4285 0 13.6263 0.0819442 13.7722 0.227806C13.9181 0.373667 14 0.571498 14 0.777778V5.44444C14 5.65072 13.9181 5.84855 13.7722 5.99442C13.6263 6.14028 13.4285 6.22222 13.2222 6.22222C13.0159 6.22222 12.8181 6.14028 12.6722 5.99442C12.5264 5.84855 12.4444 5.65072 12.4444 5.44444V2.65533L9.10544 5.99433C8.95875 6.13601 8.76229 6.21441 8.55836 6.21264C8.35442 6.21086 8.15935 6.12907 8.01514 5.98486C7.87093 5.84065 7.78914 5.64558 7.78736 5.44165C7.78559 5.23771 7.86399 5.04125 8.00567 4.89456L11.3447 1.55556H8.55556Z" fill="#008080" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const UpcomingEventsWidget: React.FC<UpcomingEventsWidgetProps> = ({
  events,
  variant: _variant = 'default',
  onFilterClick,
  onEventClick,
  onEventManagementClick,
  filterButtonRef,
  filters = { viewType: 'myEvents', timeFrame: 'today' },
  currentUserId = 'user-1', // Default user ID
}) => {
  const [isListExpanded, setIsListExpanded] = useState(false);
  // Use provided events, or mock data from Figma, or convert from calendar data
  const baseEvents = events || mockUpcomingEvents || convertToEvents();

  // Filter events based on filters
  const filteredEvents = useMemo(() => {
    let filtered = [...baseEvents];

    // Filter by viewType
    if (filters.viewType === 'myEvents') {
      // In a real app, this would filter by currentUserId
      // For now, we'll keep all events as mock data doesn't have assignedTo
      // filtered = filtered.filter((event) => event.assignedTo === currentUserId);
    }

    // Filter by timeFrame
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    switch (filters.timeFrame) {
      case 'today': {
        const today = new Date(now);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filtered = filtered.filter((event) => {
          const eventDate = new Date(event.date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today && eventDate < tomorrow;
        });
        break;
      }
      case 'thisWeek': {
        const startOfWeek = new Date(now);
        const dayOfWeek = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        filtered = filtered.filter((event) => {
          const eventDate = new Date(event.date);
          return eventDate >= startOfWeek && eventDate < endOfWeek;
        });
        break;
      }
      case 'thisMonth': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        filtered = filtered.filter((event) => {
          const eventDate = new Date(event.date);
          return eventDate >= startOfMonth && eventDate < endOfMonth;
        });
        break;
      }
    }

    // Sort by date
    return filtered.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [baseEvents, filters, currentUserId]);

  const hasEvents = filteredEvents.length > 0;

  const handleEventManagementClick = () => {
    setIsListExpanded(!isListExpanded);
    onEventManagementClick?.();
  };

  return (
    <DashboardWidget
      title="Upcoming Events"
      showFilter={true}
      onFilterClick={onFilterClick}
      className="h-[430px] flex flex-col"
      ref={filterButtonRef}
    >
      <div className="flex-1 overflow-hidden bg-[#FFFFFF] rounded-[10px] p-2.5 relative flex flex-col shadow-[0_2px_4px_0_rgba(0,0,0,0.10)]">
        {!hasEvents || (!isListExpanded && hasEvents) ? (
          // Empty State - shown when no events or when list is collapsed
          <div className="flex flex-col items-center justify-center flex-1 pb-[60px]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="67"
              height="67"
              viewBox="0 0 67 67"
              fill="none"
              className="mb-6"
            >
              <path
                d="M60.0208 5.58333H50.25V0H47.4583V5.58333H19.5417V0H16.75V5.58333H6.97917C3.13225 5.58333 0 8.71558 0 12.5625V67H35.5128C34.5413 66.1458 33.6424 65.2161 32.8328 64.2083H2.79167V25.125H64.2083V32.8663C65.2105 33.6731 66.1513 34.5469 67 35.5128V12.5625C67 8.71558 63.8678 5.58333 60.0208 5.58333ZM2.79167 22.3333V12.5625C2.79167 10.2538 4.67046 8.375 6.97917 8.375H60.0208C62.3295 8.375 64.2083 10.2538 64.2083 12.5625V22.3333H2.79167Z"
                fill="#1C2745"
              />
              <circle cx="50" cy="50" r="15.65" stroke="#1C2745" strokeWidth="2.7" />
              <path
                d="M45.9522 55.8251L49.9995 53.269L54.0467 55.8587L52.9867 51.0157L56.5522 47.787L51.8625 47.3498L49.9995 42.7758L48.1364 47.3161L43.4467 47.7534L47.0122 51.0157L45.9522 55.8251ZM49.9995 56.4305L44.6673 59.7937C44.4318 59.9507 44.1855 60.0179 43.9285 59.9955C43.6716 59.9731 43.4467 59.8834 43.254 59.7264C43.0613 59.5695 42.9114 59.3735 42.8043 59.1385C42.6972 58.9036 42.6758 58.6399 42.74 58.3475L44.1534 51.991L39.4316 47.7197C39.2174 47.5179 39.0838 47.2879 39.0307 47.0296C38.9776 46.7713 38.9934 46.5193 39.0782 46.2735C39.163 46.0278 39.2915 45.826 39.4637 45.6682C39.6358 45.5103 39.8714 45.4094 40.1703 45.3655L46.4019 44.7937L48.811 38.8072C48.918 38.5381 49.0842 38.3363 49.3095 38.2018C49.5348 38.0673 49.7648 38 49.9995 38C50.2342 38 50.4641 38.0673 50.6894 38.2018C50.9147 38.3363 51.0809 38.5381 51.1879 38.8072L53.597 44.7937L59.8286 45.3655C60.1284 45.4103 60.3639 45.5112 60.5352 45.6682C60.7065 45.8251 60.835 46.0269 60.9207 46.2735C61.0063 46.5202 61.0226 46.7726 60.9695 47.0309C60.9164 47.2892 60.7824 47.5188 60.5674 47.7197L55.8455 51.991L57.2589 58.3475C57.3231 58.639 57.3017 58.9027 57.1946 59.1385C57.0876 59.3744 56.9377 59.5704 56.7449 59.7264C56.5522 59.8825 56.3273 59.9722 56.0704 59.9955C55.8134 60.0188 55.5671 59.9516 55.3316 59.7937L49.9995 56.4305Z"
                fill="#1C2745"
              />
            </svg>
            <p className="text-[16px] font-normal text-[#535352] leading-normal">
              No upcoming events for today
            </p>
          </div>
        ) : (
          // Events List - shown when list is expanded and events exist
          <div className="flex-1 overflow-hidden rounded-[5px] mb-[60px]">
            <MacScrollbar className="h-full">
              <div className="space-y-[12px]">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => onEventClick?.(event.id)}
                  />
                ))}
              </div>
            </MacScrollbar>
          </div>
        )}

        {/* Event Management Button */}
        <button
          type="button"
          onClick={handleEventManagementClick}
          className="absolute bottom-[15px] left-1/2 -translate-x-1/2 bg-[#008080] hover:bg-[#006666] text-white font-semibold text-[14px] px-[25px] py-[10px] rounded-[25px] flex items-center gap-[10px] transition-colors cursor-pointer z-10"
        >
          <span className="whitespace-nowrap">Event Management</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="14"
            viewBox="0 0 16 14"
            fill="none"
          >
            <path d="M15 7L9 1M15 7L9 13M15 7L1 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </DashboardWidget>
  );
};

export default UpcomingEventsWidget;
