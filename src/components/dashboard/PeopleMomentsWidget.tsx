import { MacScrollbar } from 'mac-scrollbar';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import drRamanSubramanianAvatar from '../../assets/images/avatars/raman.png';
import shazinAbdullaAvatar from '../../assets/images/avatars/shazin.png';
import backgroundImage from '../../assets/images/Graffiti.png';
import { cn } from '../../lib/utils/cn';
import { mockUsers } from '../messenger/mockData';
import Tooltip from '../ui/Tooltip';
import DashboardWidget from './DashboardWidget';
import { mockAvailabilityItems } from './mockData';

export interface PeopleMoment {
  id: string;
  employeeName: string;
  position: string;
  avatar: string;
  date: string;
  eventType: 'work-anniversary' | 'birthday';
  years?: number; // for anniversaries
  eventDate?: Date; // For filtering by timeFrame
}

interface PeopleMomentsWidgetProps {
  moments?: PeopleMoment[];
  isLoading?: boolean;
  onFilterClick?: () => void;
  filterButtonRef?: React.RefObject<HTMLButtonElement | null>;
  filters?: { viewType: string; timeFrame: string };
}

const defaultMoments: PeopleMoment[] = [
  {
    id: 'moment-1',
    employeeName: 'Shazin Abdulla',
    position: 'Officer- Admissions',
    avatar: shazinAbdullaAvatar,
    date: 'May 10',
    eventType: 'work-anniversary',
    years: 1,
  },
  {
    id: 'moment-2',
    employeeName: 'Dr. Raman Subramanian',
    position: 'Associate Dean & Head of Institutional Relations',
    avatar: drRamanSubramanianAvatar,
    date: 'May 10',
    eventType: 'birthday',
  },
];

const PeopleMomentsWidget: React.FC<PeopleMomentsWidgetProps> = ({
  moments = defaultMoments,
  isLoading = false,
  onFilterClick,
  filterButtonRef,
  filters = { viewType: 'both', timeFrame: 'today' },
}) => {
  const navigate = useNavigate();

  // Helper function to find user ID by employee name
  const findUserIdByName = (employeeName: string): string | null => {
    // First try to find in mockUsers
    const user = mockUsers.find((u) => u.name.toLowerCase() === employeeName.toLowerCase());
    if (user) {
      return user.id;
    }

    // Then try to find in mockAvailabilityItems
    const availabilityItem = mockAvailabilityItems.find(
      (item) => item.name.toLowerCase() === employeeName.toLowerCase()
    );
    if (availabilityItem) {
      return availabilityItem.id;
    }

    return null;
  };

  // Filter moments based on filters
  const filteredMoments = useMemo(() => {
    let filtered = [...moments];

    // Filter by viewType
    if (filters.viewType === 'birthdays') {
      filtered = filtered.filter((moment) => moment.eventType === 'birthday');
    } else if (filters.viewType === 'anniversaries') {
      filtered = filtered.filter((moment) => moment.eventType === 'work-anniversary');
    }
    // If 'both', keep all moments

    // Filter by timeFrame
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    switch (filters.timeFrame) {
      case 'today': {
        const today = new Date(now);
        // Parse date string (e.g., "May 10") and check if it's today
        // For simplicity, we'll filter based on eventDate if available
        // Otherwise, keep all (since we don't have full date info in mock data)
        if (moments[0]?.eventDate) {
          filtered = filtered.filter((moment) => {
            if (!moment.eventDate) return true;
            const eventDate = new Date(moment.eventDate);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === today.getTime();
          });
        }
        break;
      }
      case 'thisWeek': {
        if (moments[0]?.eventDate) {
          const startOfWeek = new Date(now);
          const dayOfWeek = startOfWeek.getDay();
          startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 7);
          filtered = filtered.filter((moment) => {
            if (!moment.eventDate) return true;
            const eventDate = new Date(moment.eventDate);
            return eventDate >= startOfWeek && eventDate < endOfWeek;
          });
        }
        break;
      }
      case 'thisMonth': {
        if (moments[0]?.eventDate) {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          filtered = filtered.filter((moment) => {
            if (!moment.eventDate) return true;
            const eventDate = new Date(moment.eventDate);
            return eventDate >= startOfMonth && eventDate < endOfMonth;
          });
        }
        break;
      }
    }

    return filtered;
  }, [moments, filters]);

  return (
    <DashboardWidget
      title="People Moments"
      showFilter={true}
      onFilterClick={onFilterClick}
      className="h-[430px] flex flex-col"
      ref={filterButtonRef}
    >
      <div className="flex-1 overflow-hidden relative bg-white rounded-[10px] p-2.5 shadow-[0_2px_4px_0_rgba(0,0,0,0.10)]">
        <img src={backgroundImage} alt="Graffiti" className="absolute inset-0 object-cover w-full h-full" />

        <MacScrollbar className="h-full">
          <div className="space-y-[10px] relative z-10">
            {isLoading ? (
              <div className="h-full min-h-[250px] flex items-center justify-center">
                <div className="w-8 h-8 border-[3px] border-[#CFCFCF] border-t-[#232725] rounded-full animate-spin" />
              </div>
            ) : filteredMoments.length === 0 ? (
              <div className="text-center py-8 text-[#535352]">No moments to celebrate</div>
            ) : (
              filteredMoments.map((moment) => (
                <div
                  key={moment.id}
                  className="bg-[#FBFBFB] rounded-[10px] border border-[#EBEBEB] overflow-hidden"
                >
                  <div className="px-[5px] pt-[10px] pb-[5px]">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <img
                          src={moment.avatar}
                          alt={moment.employeeName}
                          className="w-12 h-12 rounded-full object-cover border-[1.5px] border-[#808080]"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[16px] font-semibold text-black leading-snug mb-1">
                          {moment.employeeName}
                        </h3>
                        <p className="text-[14px] font-normal text-[#535352] leading-snug line-clamp-2">
                          {moment.position}
                        </p>
                      </div>
                      {moment.employeeName !== 'You' && (
                        <div className="flex-shrink-0">
                          <Tooltip content="Send a greeting!" side="left">
                            <button
                              type="button"
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                const userId = findUserIdByName(moment.employeeName);
                                if (userId) {
                                  navigate(`/messenger?user=${userId}`);
                                }
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
                                <path d="M16.8957 0.159224L2.04641 5.10897C1.46128 5.30521 0.950907 5.67713 0.58488 6.17403C0.218853 6.67093 0.0149824 7.26863 0.00106507 7.88563C-0.0128522 8.50263 0.16386 9.10891 0.50711 9.62181C0.85036 10.1347 1.34344 10.5293 1.91913 10.7517L7.41335 12.8518C7.54366 12.9051 7.66205 12.9838 7.7616 13.0834C7.86116 13.1829 7.93988 13.3013 7.99318 13.4316L10.0933 18.9258C10.2725 19.3925 10.5655 19.8071 10.9456 20.1317C11.3257 20.4564 11.781 20.6809 12.27 20.7849C12.7589 20.8889 13.2662 20.869 13.7455 20.7271C14.2249 20.5852 14.6612 20.3258 15.0147 19.9724C15.3425 19.638 15.5914 19.2345 15.7431 18.7915L20.6928 3.94225C20.8673 3.41445 20.8917 2.84855 20.7634 2.30769C20.635 1.76682 20.3589 1.27226 19.9658 0.87919C19.5727 0.486115 19.0781 0.209985 18.5373 0.0816059C17.9964 -0.0467727 17.4305 -0.0223488 16.9027 0.152153L16.8957 0.159224ZM18.7907 3.31292L13.8409 18.1622C13.7734 18.3546 13.6486 18.5217 13.4833 18.6412C13.3181 18.7607 13.1202 18.8268 12.9163 18.8306C12.7124 18.8345 12.5122 18.7759 12.3426 18.6627C12.1729 18.5496 12.0419 18.3872 11.9671 18.1975L9.85994 12.7104C9.83111 12.6378 9.79806 12.567 9.76094 12.4982L14.6329 7.62627C14.8204 7.43874 14.9258 7.18438 14.9258 6.91917C14.9258 6.65395 14.8204 6.3996 14.6329 6.21206C14.4454 6.02452 14.191 5.91917 13.9258 5.91917C13.6606 5.91917 13.4062 6.02452 13.2187 6.21206L8.34673 11.084C8.27801 11.0469 8.20718 11.0139 8.1346 10.985L2.64745 8.87785C2.45773 8.80306 2.2954 8.67206 2.18224 8.5024C2.06909 8.33275 2.0105 8.13255 2.01435 7.92866C2.0182 7.72476 2.08429 7.52692 2.20377 7.36165C2.32325 7.19638 2.4904 7.07159 2.6828 7.00402L17.532 2.05427C17.7072 1.99778 17.8946 1.99073 18.0735 2.0339C18.2524 2.07706 18.4159 2.16876 18.5461 2.2989C18.6762 2.42904 18.7679 2.59257 18.8111 2.77149C18.8542 2.9504 18.8472 3.13776 18.7907 3.31292Z" fill="#008080" />
                              </svg>
                            </button>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={cn("flex items-center justify-between gap-2 text-[14px] font-normal text-white px-[10px] py-[7px] border-t border-t-[#EBEBEB]", moment.eventType === 'work-anniversary' ? 'bg-[#7C62C4]' : 'bg-[#535352]')}>
                    <div className={cn("flex items-center gap-2 text-[14px] font-normal text-white")}>
                      <span>{moment.date}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="1" height="17" viewBox="0 0 1 17" fill="none">
                        <path d="M0.5 0.5L0.500001 16.5" stroke="white" stroke-linecap="round" />
                      </svg>
                      <span>
                        {moment.eventType === 'work-anniversary'
                          ? `${moment.years || 1} - Work Anniversary`
                          : 'Birthday'}
                      </span>
                    </div>
                    {moment.eventType === 'work-anniversary' ? (
                      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.26578 0L5.36185 1.23834L4.4181 2.04521L5.62746 2.33795L6.10216 3.48456L6.75204 2.42685L7.984 2.32776L7.18153 1.38159L7.46974 0.174398L6.32255 0.647197L5.26578 0ZM24.5533 0.491485C24.3135 0.491485 24.0835 0.586934 23.9139 0.756835C23.7444 0.926736 23.6491 1.15717 23.6491 1.39745C23.6491 1.63772 23.7444 1.86816 23.9139 2.03806C24.0835 2.20796 24.3135 2.30341 24.5533 2.30341C24.7931 2.30341 25.0231 2.20796 25.1927 2.03806C25.3622 1.86816 25.4575 1.63772 25.4575 1.39745C25.4575 1.15717 25.3622 0.926736 25.1927 0.756835C25.0231 0.586934 24.7931 0.491485 24.5533 0.491485ZM11.8833 1.08602C11.6435 1.08602 11.4135 1.18147 11.244 1.35137C11.0744 1.52127 10.9791 1.75171 10.9791 1.99199C10.9791 2.23226 11.0744 2.4627 11.244 2.6326C11.4135 2.8025 11.6435 2.89795 11.8833 2.89795C12.1231 2.89795 12.3531 2.8025 12.5227 2.6326C12.6923 2.4627 12.7875 2.23226 12.7875 1.99199C12.7875 1.75171 12.6923 1.52127 12.5227 1.35137C12.3531 1.18147 12.1231 1.08602 11.8833 1.08602ZM22.2759 1.47332C21.756 1.57185 21.2756 1.87987 20.8122 2.28189C20.3827 2.65164 19.9815 3.11198 19.6424 3.6097C18.58 3.78013 17.5176 4.21386 16.8055 4.80613C15.8957 5.55355 15.0876 6.83323 14.6468 8.15253C14.2286 8.32806 13.833 8.53757 13.5109 8.76406C12.6349 9.38124 12.1828 10.5647 11.8494 11.5952C11.516 12.6314 11.3521 13.5373 11.3521 13.5373L12.358 13.7185C12.358 13.7185 12.5106 12.8692 12.8158 11.9123C13.1266 10.9554 13.6521 9.9135 14.0986 9.60207C14.1721 9.55111 14.2681 9.49449 14.3529 9.44353C14.319 9.76628 14.319 10.089 14.3698 10.3948C14.4716 11.0403 14.8219 11.6575 15.4436 11.9916C15.8844 12.2294 16.3817 12.1727 16.7999 12.0029C17.218 11.8273 17.591 11.5386 17.9131 11.1988C18.2353 10.8591 18.5009 10.4571 18.6591 10.0324C18.8173 9.60774 18.8738 9.12644 18.6704 8.67912H18.6648C18.4444 8.20349 18.0205 7.89773 17.5684 7.7675C17.1163 7.63727 16.6303 7.64293 16.1443 7.71654C16.0596 7.72786 15.9804 7.75617 15.8957 7.77316C16.3139 6.87852 16.9129 6.03484 17.4497 5.58753C17.8001 5.29875 18.3878 5.0213 19.0151 4.81746C18.936 5.03262 18.8738 5.24779 18.8456 5.46862C18.7552 6.06316 18.8852 6.70865 19.3598 7.15031C19.7046 7.4674 20.168 7.51836 20.5749 7.45041C20.9761 7.38246 21.366 7.20127 21.7164 6.96912C22.0668 6.7313 22.3776 6.43687 22.598 6.09147C22.8184 5.74607 22.9653 5.30441 22.824 4.86276V4.85709C22.6375 4.2869 22.1741 3.89507 21.6599 3.70935C21.4395 3.63008 21.2078 3.58535 20.9704 3.55874C21.1343 3.37415 21.3039 3.20145 21.4734 3.05366C21.8577 2.72298 22.2476 2.51575 22.468 2.47441L22.2759 1.47332ZM8.21005 3.45795L7.35107 3.99926L9.30073 7.12766L6.11346 7.29187L7.61102 10.5647L8.53782 10.1343L7.66188 8.2318L11.0865 8.05627L8.21005 3.45795ZM20.4392 4.55133C20.784 4.54567 21.0891 4.5853 21.3152 4.67024C21.6203 4.77782 21.7729 4.91372 21.852 5.16852C21.8746 5.2308 21.8633 5.35537 21.7447 5.54223C21.6203 5.73474 21.3999 5.94991 21.1513 6.11978C20.897 6.28965 20.6144 6.40856 20.4053 6.44253C20.1906 6.48216 20.0945 6.44253 20.0493 6.40289C19.8515 6.2217 19.795 5.99521 19.8515 5.61584C19.8967 5.31007 20.038 4.94203 20.2471 4.56266C20.3149 4.56266 20.3771 4.55133 20.4392 4.55133ZM3.69983 5.64415C3.46003 5.64415 3.23004 5.7396 3.06048 5.9095C2.89091 6.0794 2.79564 6.30983 2.79564 6.55011C2.79564 6.79039 2.89091 7.02082 3.06048 7.19072C3.23004 7.36062 3.46003 7.45607 3.69983 7.45607C3.81862 7.45615 3.93626 7.43277 4.04603 7.38727C4.15579 7.34178 4.25554 7.27506 4.33956 7.19092C4.42358 7.10679 4.49023 7.00689 4.53571 6.89694C4.58118 6.78699 4.60459 6.66913 4.60459 6.55011C4.60459 6.43109 4.58118 6.31324 4.53571 6.20328C4.49023 6.09333 4.42358 5.99343 4.33956 5.9093C4.25554 5.82516 4.15579 5.75844 4.04603 5.71295C3.93626 5.66745 3.81862 5.64407 3.69983 5.64415ZM23.8243 7.75051L23.0105 8.69045L21.7786 8.58853L22.4228 9.65303L21.9424 10.7968L23.1518 10.5137L24.0899 11.3234L24.1973 10.0834L25.254 9.43787L24.1125 8.95657L23.8243 7.75051ZM16.8451 8.68479C17.009 8.69045 17.1615 8.7131 17.2802 8.74707C17.5232 8.81502 17.6532 8.91694 17.7436 9.10946C17.7945 9.21704 17.8001 9.41522 17.7041 9.67568C17.608 9.94181 17.4102 10.2476 17.1728 10.5024C16.9355 10.7572 16.6473 10.961 16.4099 11.0573C16.1726 11.1535 16.0256 11.1479 15.9296 11.0969H15.9239C15.5962 10.9157 15.4379 10.6553 15.3758 10.2362C15.3192 9.87952 15.3588 9.42654 15.4775 8.93959C15.7544 8.84333 16.0313 8.76406 16.2969 8.72442C16.4947 8.69611 16.6755 8.68479 16.8451 8.68479ZM5.40706 11.6235C5.00017 11.6122 4.74587 11.7084 4.58764 11.867C4.4294 12.0255 4.33333 12.2803 4.34464 12.688C4.35594 13.1014 4.49157 13.6449 4.75152 14.2508C5.27143 15.4682 6.2943 16.9347 7.66754 18.3163C9.04077 19.6922 10.5101 20.7114 11.7251 21.2324C12.3241 21.4928 12.8666 21.6287 13.2792 21.6401C13.6917 21.657 13.9404 21.5551 14.0986 21.3966C14.2568 21.238 14.3585 20.9889 14.3416 20.5755C14.3303 20.1622 14.1947 19.6186 13.9347 19.0128C13.4148 17.801 12.3976 16.3288 11.0243 14.9529C9.6511 13.5713 8.18179 12.5521 6.96679 12.0312C6.36211 11.7707 5.8196 11.6348 5.40706 11.6235ZM18.5178 13.3958L16.6529 16.4534L15.0084 14.8736L14.3077 15.6097L16.8564 18.0615L18.7665 14.9359L20.9535 16.7648L26 14.6019L25.6044 13.6619L21.123 15.5871L18.5178 13.3958ZM3.61168 14.1149L2.61481 17.3934C4.95496 20.1735 7.68449 21.7363 10.6457 22.7555L11.8664 22.3818C11.6912 22.3195 11.5047 22.2459 11.3182 22.1666C9.93931 21.5778 8.39654 20.4906 6.94983 19.0354C5.49748 17.5802 4.41245 16.0344 3.82247 14.6528C3.74278 14.4716 3.67271 14.2904 3.61168 14.1149ZM2.26556 18.5428L1.47383 21.1474C3.10646 22.6762 4.80803 23.367 6.59381 23.9899L9.04643 23.2425C6.60511 22.2459 4.29943 20.7907 2.26556 18.5428ZM19.1282 18.6107C18.8883 18.6107 18.6584 18.7062 18.4888 18.8761C18.3192 19.046 18.224 19.2764 18.224 19.5167C18.224 19.757 18.3192 19.9874 18.4888 20.1573C18.6584 20.3272 18.8883 20.4227 19.1282 20.4227C19.368 20.4227 19.5979 20.3272 19.7675 20.1573C19.9371 19.9874 20.0323 19.757 20.0323 19.5167C20.0323 19.2764 19.9371 19.046 19.7675 18.8761C19.5979 18.7062 19.368 18.6107 19.1282 18.6107ZM1.14663 22.2289L0 26L4.98887 24.4769C3.7021 23.9616 2.40176 23.3048 1.14663 22.2289Z" fill="white" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="25" height="26" viewBox="0 0 25 26" fill="none">
                        <path d="M12.5 0L11.7183 1.15469C11.7183 1.15469 11.2 1.88658 10.6971 2.76426C10.4452 3.20456 10.2087 3.6643 10.0058 4.13084C9.80289 4.59738 9.61539 5.02699 9.61539 5.58879C9.61539 7.18766 10.9183 8.50467 12.5 8.50467C14.0817 8.50467 15.3846 7.18766 15.3846 5.58879C15.3846 5.02699 15.1971 4.59738 14.9942 4.13084C14.7913 3.6643 14.5548 3.20456 14.3029 2.76426C13.8 1.88658 13.2808 1.15372 13.2808 1.15372L12.5 0ZM12.5 8.50467H9.61539V12.3925H3.84616C1.72116 12.3925 1.2601e-05 14.1323 1.2601e-05 16.2804C-0.00239285 17.2308 0.339666 18.1491 0.96155 18.8619V26H24.0385V18.8619C24.6603 18.1491 25.0024 17.2308 25 16.2804C25 14.1323 23.2788 12.3925 21.1538 12.3925H15.3846V8.50467H12.5ZM12.5 3.52336C12.5635 3.63028 12.5567 3.6225 12.6202 3.73622C12.849 4.13473 13.0933 4.55948 13.251 4.92007C13.4087 5.28164 13.4615 5.61503 13.4615 5.58879C13.4615 6.12822 13.0337 6.56075 12.5 6.56075C11.9663 6.56075 11.5385 6.12822 11.5385 5.58879C11.5385 5.61503 11.5913 5.28164 11.749 4.92007C11.9067 4.56045 12.151 4.13473 12.3798 3.73622C12.4433 3.6225 12.4365 3.62931 12.5 3.52336ZM11.5385 10.4486H13.4615V12.3925H11.5385V10.4486ZM3.84616 14.3364H21.1538C22.299 14.3364 23.0769 15.1228 23.0769 16.2804C23.0769 17.438 22.299 18.2243 21.1538 18.2243C20.0086 18.2243 19.2308 17.438 19.2308 16.2804H17.3077C17.3077 17.438 16.5298 18.2243 15.3846 18.2243C14.2394 18.2243 13.4615 17.438 13.4615 16.2804H11.5385C11.5385 17.438 10.7606 18.2243 9.61539 18.2243C8.4702 18.2243 7.69231 17.438 7.69231 16.2804H5.76924C5.76924 17.438 4.99135 18.2243 3.84616 18.2243C2.70097 18.2243 1.92309 17.438 1.92309 16.2804C1.92309 15.1228 2.70097 14.3364 3.84616 14.3364ZM6.73077 18.8619C7.09261 19.2738 7.53689 19.6032 8.03419 19.8284C8.53149 20.0537 9.07046 20.1695 9.61539 20.1682C10.1603 20.1695 10.6993 20.0537 11.1966 19.8284C11.6939 19.6032 12.1382 19.2738 12.5 18.8619C12.8618 19.2738 13.3061 19.6032 13.8034 19.8284C14.3007 20.0537 14.8397 20.1695 15.3846 20.1682C15.9295 20.1695 16.4685 20.0537 16.9658 19.8284C17.4631 19.6032 17.9074 19.2738 18.2692 18.8619C18.6311 19.2738 19.0753 19.6032 19.5726 19.8284C20.0699 20.0537 20.6089 20.1695 21.1538 20.1682C21.4885 20.1682 21.8077 20.0963 22.1154 20.0166V24.0561H2.88462V20.0166C3.19232 20.0963 3.51155 20.1682 3.84616 20.1682C4.39109 20.1695 4.93006 20.0537 5.42736 19.8284C5.92466 19.6032 6.36894 19.2738 6.73077 18.8619Z" fill="white" />
                      </svg>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </MacScrollbar>
      </div>
    </DashboardWidget>
  );
};

export default PeopleMomentsWidget;
