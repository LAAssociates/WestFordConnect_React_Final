import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import DashboardWidget from './DashboardWidget';
import { MacScrollbar } from 'mac-scrollbar';
import { Loader2 } from 'lucide-react';
import awayIcon from '../../assets/icons/away.svg';
import dndIcon from '../../assets/icons/dnd.svg';
import onlineIcon from '../../assets/icons/online.svg';

export interface AvailabilityItem {
  id: string;
  name: string;
  avatar: string;
  position: string;
  status: 'online' | 'away' | 'offline';
}

interface AvailabilityWidgetProps {
  items?: AvailabilityItem[];
  count?: number;
  isLoading?: boolean;
  currentUserId?: string | number;
  onFilterClick?: () => void;
  filterButtonRef?: React.RefObject<HTMLButtonElement | null>;
  selectedDepartments?: string[];
}

const getStatusIcon = (status: AvailabilityItem['status']) => {
  switch (status) {
    case 'online':
      return onlineIcon;
    case 'away':
      return awayIcon;
    case 'offline':
      return dndIcon;
    default:
      return dndIcon;
  }
};

// Helper function to extract department from position
export const getDepartmentFromPosition = (position: string): string => {
  const pos = position.toLowerCase();

  if (pos.includes('ceo') || pos.includes('founder') || pos.includes('management')) {
    return 'westford';
  }
  if (pos.includes('admissions') || pos.includes('bd')) {
    return 'admissions-bd';
  }
  if (pos.includes('operations')) {
    return 'operations';
  }
  if (pos.includes('student services')) {
    return 'student-services';
  }
  if (pos.includes('faculty') || pos.includes('dean')) {
    return 'faculty';
  }
  if (pos.includes('marcom') || pos.includes('creative')) {
    return 'marcom';
  }
  if (pos.includes('accounts')) {
    return 'accounts';
  }
  if (pos.includes('student experience')) {
    return 'student-experience';
  }

  // Default to westford if no match
  return 'westford';
};

const AvailabilityWidget: React.FC<AvailabilityWidgetProps> = ({
  items = [],
  count: _count,
  isLoading = false,
  currentUserId,
  onFilterClick,
  filterButtonRef,
  selectedDepartments = ['westford'],
}) => {
  const navigate = useNavigate();

  // State for status dropdown
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'online' | 'away'>('online');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width?: number } | null>(null);
  const titleButtonRef = useRef<HTMLButtonElement>(null);

  // Filter items based on selected departments first
  const departmentFilteredItems = useMemo(() => {
    if (!selectedDepartments || selectedDepartments.length === 0) {
      return items;
    }

    // If 'westford' is selected, show all items (it's the parent)
    if (selectedDepartments.includes('westford')) {
      return items;
    }

    return items.filter((item) => {
      const department = getDepartmentFromPosition(item.position);
      return selectedDepartments.includes(department);
    });
  }, [items, selectedDepartments]);

  // Filter items based on selected status
  // When "online" (At Work) is selected, show both "online" and "offline" (dnd) users
  const filteredItems = useMemo(() => {
    if (selectedStatus === 'online') {
      return departmentFilteredItems.filter((item) => item.status === 'online' || item.status === 'offline');
    }
    return departmentFilteredItems.filter((item) => item.status === selectedStatus);
  }, [departmentFilteredItems, selectedStatus]);

  const statusCounts = useMemo(() => {
    const atWork = departmentFilteredItems.filter((item) => item.status === 'online' || item.status === 'offline').length;
    const away = departmentFilteredItems.filter((item) => item.status === 'away').length;
    return { atWork, away };
  }, [departmentFilteredItems]);

  const displayCount = selectedStatus === 'online'
    ? statusCounts.atWork
    : statusCounts.away;

  // Get status label for display
  const getStatusLabel = (status: 'online' | 'away') => {
    return status === 'online' ? 'At Work' : 'Away';
  };

  // Update dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (!titleButtonRef.current) return;

    const rect = titleButtonRef.current.getBoundingClientRect();
    const widgetContainer = titleButtonRef.current.closest('.relative') as HTMLElement;
    const menuWidth = widgetContainer ? widgetContainer.offsetWidth : 335;

    // Position dropdown below the title button, aligned to left
    let menuLeft = rect.left;

    // Ensure menu stays within viewport bounds
    const padding = 10;
    const maxRight = window.innerWidth - padding;
    const menuRight = menuLeft + menuWidth;

    if (menuRight > maxRight) {
      menuLeft = maxRight - menuWidth;
    }

    if (menuLeft < padding) {
      menuLeft = padding;
    }

    setDropdownPosition({
      top: rect.bottom + 10,
      left: menuLeft,
      width: menuWidth,
    });
  }, []);

  // Handle title click to toggle dropdown
  const handleTitleClick = () => {
    if (!statusDropdownOpen) {
      updateDropdownPosition();
    }
    setStatusDropdownOpen((prev) => !prev);
  };

  // Handle status selection
  const handleStatusSelect = (status: 'online' | 'away') => {
    setSelectedStatus(status);
    setStatusDropdownOpen(false);
  };

  // Update position when dropdown opens or window changes
  useEffect(() => {
    if (!statusDropdownOpen) return;

    updateDropdownPosition();

    const handleWindowChange = () => {
      updateDropdownPosition();
    };

    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [statusDropdownOpen, updateDropdownPosition]);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!statusDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (titleButtonRef.current?.contains(target)) {
        return;
      }

      const dropdownPanel = document.querySelector('[data-status-dropdown="availability"]');
      if (dropdownPanel?.contains(target)) {
        return;
      }

      setStatusDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [statusDropdownOpen]);

  return (
    <>
      <DashboardWidget
        title={
          <button
            ref={titleButtonRef}
            type="button"
            onClick={handleTitleClick}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Select availability status"
            aria-expanded={statusDropdownOpen}
          >
            <span className="text-[18px] font-semibold text-black">{getStatusLabel(selectedStatus)}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="8"
              viewBox="0 0 14 8"
              fill="none"
              className={`transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`}
            >
              <path d="M0.292786 0.292464C0.480314 0.104993 0.734622 -0.000322819 0.999786 -0.000322819C1.26495 -0.000322819 1.51926 0.104993 1.70679 0.292464L6.65679 5.24246L11.6068 0.292464C11.7954 0.110306 12.048 0.00951147 12.3102 0.0117898C12.5724 0.0140681 12.8232 0.119237 13.0086 0.304645C13.194 0.490053 13.2992 0.740866 13.3015 1.00306C13.3037 1.26526 13.2029 1.51786 13.0208 1.70646L7.36379 7.36346C7.17626 7.55093 6.92195 7.65625 6.65679 7.65625C6.39162 7.65625 6.13731 7.55093 5.94979 7.36346L0.292786 1.70646C0.105315 1.51894 0 1.26463 0 0.999464C0 0.734299 0.105315 0.479991 0.292786 0.292464Z" fill="black" />
            </svg>
            <span className="text-[18px] font-semibold text-[#535352]">({displayCount})</span>
          </button>
        }
        showFilter={true}
        onFilterClick={onFilterClick}
        className="flex-1"
        ref={filterButtonRef}
      >
        <div className="h-[calc(627px-64px)] overflow-hidden bg-white rounded-[10px] p-2.5 shadow-[0_2px_4px_0_rgba(0,0,0,0.10)]">
          <MacScrollbar className="h-full">
            <div className="space-y-[10px]">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#008080]" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8 text-[#535352]">
                  {selectedStatus === 'online' ? 'No employees at work' : 'No employees away'}
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 border-b border-[#E6E6E6] pb-2.5 group">
                    <div className="relative flex-shrink-0">
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <img
                        src={getStatusIcon(item.status)}
                        alt={`${item.status} status`}
                        className="absolute bottom-0 right-0 w-[13px] h-[13px]"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] font-semibold text-black leading-normal truncate">
                        {item.name}
                      </p>
                      <p className="text-[14px] font-normal text-[#535352] leading-normal truncate">
                        {item.position}
                      </p>
                    </div>
                    {(item.name !== 'You' && (currentUserId === undefined || Number(item.id) !== Number(currentUserId))) && (
                      <button
                        className="cursor-pointer"
                        onClick={() => navigate(`/messenger?user=${item.id}`)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none" className="opacity-0 mr-5 group-hover:opacity-100 transition-opacity duration-300">
                          <path d="M16.8957 0.159224L2.04641 5.10897C1.46128 5.30521 0.950907 5.67713 0.58488 6.17403C0.218853 6.67093 0.0149824 7.26863 0.00106507 7.88563C-0.0128522 8.50263 0.16386 9.10891 0.50711 9.62181C0.85036 10.1347 1.34344 10.5293 1.91913 10.7517L7.41335 12.8518C7.54366 12.9051 7.66205 12.9838 7.7616 13.0834C7.86116 13.1829 7.93988 13.3013 7.99318 13.4316L10.0933 18.9258C10.2725 19.3925 10.5655 19.8071 10.9456 20.1317C11.3257 20.4564 11.781 20.6809 12.27 20.7849C12.7589 20.8889 13.2662 20.869 13.7455 20.7271C14.2249 20.5852 14.6612 20.3258 15.0147 19.9724C15.3425 19.638 15.5914 19.2345 15.7431 18.7915L20.6928 3.94225C20.8673 3.41445 20.8917 2.84855 20.7634 2.30769C20.635 1.76682 20.3589 1.27226 19.9658 0.87919C19.5727 0.486115 19.0781 0.209985 18.5373 0.0816059C17.9964 -0.0467727 17.4305 -0.0223488 16.9027 0.152153L16.8957 0.159224ZM18.7907 3.31292L13.8409 18.1622C13.7734 18.3546 13.6486 18.5217 13.4833 18.6412C13.3181 18.7607 13.1202 18.8268 12.9163 18.8306C12.7124 18.8345 12.5122 18.7759 12.3426 18.6627C12.1729 18.5496 12.0419 18.3872 11.9671 18.1975L9.85994 12.7104C9.83111 12.6378 9.79806 12.567 9.76094 12.4982L14.6329 7.62627C14.8204 7.43874 14.9258 7.18438 14.9258 6.91917C14.9258 6.65395 14.8204 6.3996 14.6329 6.21206C14.4454 6.02452 14.191 5.91917 13.9258 5.91917C13.6606 5.91917 13.4062 6.02452 13.2187 6.21206L8.34673 11.084C8.27801 11.0469 8.20718 11.0139 8.1346 10.985L2.64745 8.87785C2.45773 8.80306 2.2954 8.67206 2.18224 8.5024C2.06909 8.33275 2.0105 8.13255 2.01435 7.92866C2.0182 7.72476 2.08429 7.52692 2.20377 7.36165C2.32325 7.19638 2.4904 7.07159 2.6828 7.00402L17.532 2.05427C17.7072 1.99778 17.8946 1.99073 18.0735 2.0339C18.2524 2.07706 18.4159 2.16876 18.5461 2.2989C18.6762 2.42904 18.7679 2.59257 18.8111 2.77149C18.8542 2.9504 18.8472 3.13776 18.7907 3.31292Z" fill="#008080" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </MacScrollbar>
        </div>
      </DashboardWidget>

      {/* Status Dropdown */}
      {statusDropdownOpen && dropdownPosition && createPortal(
        <div
          data-status-dropdown="availability"
          className="fixed bg-[#232725] rounded-[10px] z-[9999] overflow-hidden"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: dropdownPosition.width ? `${dropdownPosition.width}px` : '335px',
          }}
        >
          {/* Status Options */}
          {(['online', 'away'] as const).map((status) => {
            if (status === selectedStatus) return null; // Don't show selected status in the list

            return (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusSelect(status)}
                className="w-full flex items-center gap-[15px] px-[21px] py-[17px] transition-colors hover:bg-[#43484B] cursor-pointer"
              >
                {
                  status === 'online'
                    ? <svg xmlns="http://www.w3.org/2000/svg" width="34" height="30" viewBox="0 0 34 30" fill="none">
                      <path d="M31.1987 0H2.2772C1.02474 0 0 1.02474 0 2.27727V20.8074C0 22.0408 0.999861 23.0406 2.23324 23.0406H2.8742H31.1966C32.43 23.0406 33.43 22.0406 33.43 20.807V2.23126C33.43 0.999013 32.4311 0 31.1987 0ZM32.0165 19.4361C32.0165 19.9044 31.6367 20.2842 31.1684 20.2842H2.26165C1.79328 20.2842 1.41353 19.9044 1.41353 19.4361V2.26165C1.41353 1.79328 1.79328 1.41353 2.26165 1.41353H31.1684C31.6367 1.41353 32.0165 1.79328 32.0165 2.26165V19.4361Z" fill="white" />
                      <path d="M26.8572 27.5647H22.2288C21.3497 27.5647 20.637 26.852 20.637 25.9729V24.1016H12.7919V25.9729C12.7919 26.852 12.0792 27.5647 11.2001 27.5647H6.64975C6.17961 27.5647 5.79492 27.9493 5.79492 28.4196V28.4374C5.79492 28.8922 6.16364 29.261 6.61845 29.261H26.8811C27.3341 29.261 27.7047 28.8904 27.7047 28.4374V28.4123C27.7047 27.9461 27.3233 27.5647 26.8572 27.5647Z" fill="white" />
                      <path d="M24.8278 5.51368L19.2889 5.52301L19.287 4.50795C19.2861 3.79037 18.671 3.20786 17.9164 3.20899L15.1818 3.21351C14.4269 3.21457 13.8135 3.79942 13.8148 4.51664L13.8166 5.53177L8.58853 5.54004C7.79002 5.54152 7.14354 6.18991 7.14453 6.98863L7.161 16.8505C7.16199 17.6492 7.81045 18.2956 8.60923 18.2944L24.8484 18.2679C25.6472 18.2666 26.2934 17.6182 26.2924 16.8194L26.2762 6.95767C26.275 6.15895 25.6265 5.51269 24.8278 5.51368ZM15.1828 3.97858L17.9173 3.97427C18.2502 3.97356 18.5215 4.21337 18.5218 4.5088L18.5234 5.52385L14.5818 5.53036L14.58 4.51537C14.5796 4.21994 14.85 3.97908 15.1828 3.97858ZM20.5885 9.78798L16.1735 14.9388C16.0454 15.0883 15.8608 15.1776 15.664 15.1851C15.655 15.1854 15.6459 15.1856 15.6369 15.1856C15.4499 15.1856 15.2699 15.1114 15.1372 14.9786L13.2276 13.069C12.9516 12.793 12.9515 12.3455 13.2276 12.0694C13.5036 11.7935 13.9511 11.7935 14.2271 12.0694L15.597 13.4393L19.5153 8.86799C19.7693 8.57157 20.2155 8.53729 20.5119 8.7913C20.8081 9.04553 20.8425 9.49164 20.5885 9.78798Z" fill="#4CAF50" />
                    </svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" width="34" height="29" viewBox="0 0 34 29" fill="none">
                      <path d="M30.9214 0H2.25696C1.01563 0 0 1.01563 0 2.25703V20.6224C0 21.8448 0.990973 22.8357 2.21339 22.8357H2.84865H30.9193C32.1418 22.8357 33.1329 21.8447 33.1329 20.6221V2.21143C33.1329 0.990133 32.1428 0 30.9214 0ZM31.7319 19.2633C31.7319 19.7275 31.3555 20.1039 30.8913 20.1039H2.24155C1.77734 20.1039 1.40097 19.7275 1.40097 19.2633V2.24155C1.40097 1.77734 1.77734 1.40097 2.24155 1.40097H30.8913C31.3555 1.40097 31.7319 1.77734 31.7319 2.24155V19.2633Z" fill="white" />
                      <path d="M26.6192 27.3191H22.032C21.1607 27.3191 20.4543 26.6127 20.4543 25.7414V23.8867H12.6789V25.7414C12.6789 26.6127 11.9726 27.3191 11.1012 27.3191H6.59137C6.12534 27.3191 5.74414 27.7003 5.74414 28.1664V28.184C5.74414 28.6349 6.10958 29.0002 6.56034 29.0002H26.6429C27.0919 29.0002 27.4591 28.633 27.4591 28.184V28.1591C27.4591 27.6971 27.0811 27.3191 26.6192 27.3191Z" fill="white" />
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M19.1175 5.47314L24.6071 5.4639C25.3988 5.46292 26.0415 6.10344 26.0427 6.89505L26.0588 16.6691C26.0597 17.4608 25.4193 18.1035 24.6276 18.1047L8.53274 18.131C7.74105 18.1322 7.09836 17.4915 7.09738 16.6999L7.08106 6.92573C7.08008 6.13412 7.72081 5.4915 8.51221 5.49002L13.6938 5.48183L13.692 4.47572C13.6908 3.76487 14.2987 3.18522 15.0469 3.18417L17.7572 3.17969C18.5051 3.17857 19.1147 3.75591 19.1156 4.46711L19.1175 5.47314ZM17.758 3.93817L15.0478 3.94245C14.718 3.94294 14.4501 4.18166 14.4503 4.47446L14.4522 5.48043L18.3588 5.47398L18.3572 4.46795C18.3569 4.17515 18.088 3.93747 17.758 3.93817ZM11.4697 11.136C11.1768 11.4289 11.1768 11.9038 11.4697 12.1967L14.1363 14.8633C14.4292 15.1562 14.9041 15.1562 15.197 14.8633C15.4899 14.5704 15.4899 14.0956 15.197 13.8027L13.8107 12.4163H20.6667C21.0809 12.4163 21.4167 12.0806 21.4167 11.6663C21.4167 11.2521 21.0809 10.9163 20.6667 10.9163H13.8107L15.197 9.53001C15.4899 9.23711 15.4899 8.76224 15.197 8.46935C14.9041 8.17645 14.4292 8.17645 14.1363 8.46935L11.4697 11.136Z" fill="#FFB74D" />
                    </svg>
                }
                <span className="text-[16px] font-medium text-white leading-normal">
                  {getStatusLabel(status)}
                </span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
};

export default AvailabilityWidget;
