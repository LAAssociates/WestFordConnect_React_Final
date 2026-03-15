import React from 'react';
import { cn } from '../../lib/utils/cn';
import type { Employee } from './types';
import Tooltip from '../ui/Tooltip';
import awayIcon from '../../assets/icons/away.svg';
import dndIcon from '../../assets/icons/dnd.svg';
import onlineIcon from '../../assets/icons/online.svg';
import defaultAvatar from '../../assets/images/default-group-icon.png';
import HighlightText from '../common/HighlightText';

interface EmployeeCardProps {
  employee: Employee;
  variant?: 'org-chart' | 'directory';
  showActions?: boolean;
  showAddDelete?: boolean;
  onViewProfile?: (employee: Employee) => void;
  onSendEmail?: (employee: Employee) => void;
  onCall?: (employee: Employee) => void;
  onSendMessage?: (employee: Employee) => void;
  onViewSOP?: (employee: Employee) => void;
  onAdd?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  searchTerm?: string;
}

const departmentColors: Record<string, { bg: string; text: string }> = {
  'Management': { bg: 'bg-[#008080]', text: 'text-white' },
  'Operations': { bg: 'bg-[#E0F2F2]', text: 'text-black' },
  'Operation': { bg: 'bg-[#E0F2F2]', text: 'text-black' },
  'Student Services': { bg: 'bg-[#BEDCFE]', text: 'text-black' },
  'Admin': { bg: 'bg-[#BEDCFE]', text: 'text-black' },
  'Faculty': { bg: 'bg-[#DCF763]', text: 'text-black' },
  'Academics': { bg: 'bg-[#DCF763]', text: 'text-black' },
  'Admissions / BD': { bg: 'bg-[#D4F1F4]', text: 'text-black' },
  'Sales': { bg: 'bg-[#D4F1F4]', text: 'text-black' },
  'Marcom': { bg: 'bg-[#EDB458]', text: 'text-black' },
  'Marketing': { bg: 'bg-[#EDB458]', text: 'text-black' },
  'Accounts': { bg: 'bg-[#D4E4BC]', text: 'text-black' },
  'Student Experience': { bg: 'bg-[#E7E5DF]', text: 'text-black' },
  'Support': { bg: 'bg-[#E7E5DF]', text: 'text-black' },
};

// Helper function to get status icon based on employee status
const getStatusIcon = (status: Employee['status']) => {
  switch (status) {
    case 'at-work':
      return onlineIcon;
    case 'away':
      return awayIcon;
    case 'offline':
      return dndIcon;
    default:
      return dndIcon;
  }
};

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  variant = 'org-chart',
  showActions = true,
  showAddDelete = false,
  onViewProfile,
  onSendEmail,
  onCall,
  onSendMessage,
  onAdd,
  onDelete,
  searchTerm = '',
}) => {
  const deptColor = departmentColors[employee.department] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  const statusIcon = getStatusIcon(employee.status);

  if (variant === 'directory') {
    showActions = employee.id !== 'emp-hanil-das';

    return (
      <div className="bg-white rounded-lg pt-[15px] border border-[#E6E6E6] z-[5]">
        <div className="flex flex-col items-center text-center">
          {/* Profile Picture with Status */}
          <div className="relative mb-[15px]">
            <img
              src={employee.avatar || defaultAvatar}
              alt={employee.name}
              loading="lazy"
              className="w-20 h-20 rounded-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = defaultAvatar;
              }}
            />
            <img
              src={statusIcon}
              alt={`${employee.status} status`}
              loading="lazy"
              className="absolute bottom-0 right-0 w-[22px] h-[22px]"
            />
          </div>

          {/* Name and Position */}
          <h3 className="font-semibold text-gray-900 mb-[5px] leading-normal line-clamp-1 hover:line-clamp-none">
            <HighlightText text={employee.name} highlight={searchTerm} />
          </h3>
          <p className="text-sm text-gray-600 leading-normal line-clamp-1 hover:line-clamp-none">
            <HighlightText text={employee.position} highlight={searchTerm} />
          </p>

          {/* Department Badge */}
          <div className={cn('px-3 py-[10px] text-sm leading-normal mt-[32px] w-full', deptColor.bg, deptColor.text, employee.department === 'Management' ? 'font-bold' : 'font-medium')}>
            {employee.department}
          </div>

          {/* Action Icons */}
          <div className="h-[40px] flex items-center justify-center">
            {showActions && (
              <div className="flex items-center gap-[35px] mt-auto">
                <Tooltip
                  content="Send Direct Message"
                  side="bottom"
                >
                  <button
                    onClick={() => onSendMessage?.(employee)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                    aria-label="Send message"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M12.5712 0.117169L1.52576 3.79898C1.09052 3.94494 0.710884 4.22159 0.438619 4.5912C0.166354 4.96082 0.0147076 5.40541 0.00435542 5.86436C-0.00599679 6.32331 0.125449 6.77428 0.380771 7.15579C0.636093 7.53731 1.00287 7.83079 1.43108 7.99624L5.51789 9.55837C5.61482 9.59802 5.70288 9.65658 5.77693 9.73063C5.85098 9.80468 5.90954 9.89274 5.94919 9.98967L7.51132 14.0765C7.64461 14.4236 7.86254 14.732 8.1453 14.9735C8.42806 15.215 8.76669 15.382 9.13042 15.4593C9.49414 15.5367 9.87143 15.5219 10.228 15.4163C10.5846 15.3108 10.9091 15.1178 11.1721 14.8549C11.4159 14.6062 11.601 14.3061 11.7138 13.9765L15.3957 2.93112C15.5255 2.53853 15.5436 2.11759 15.4481 1.71528C15.3526 1.31296 15.1472 0.94509 14.8549 0.652706C14.5625 0.360322 14.1946 0.154925 13.7923 0.059433C13.39 -0.036059 12.969 -0.0178917 12.5764 0.111909L12.5712 0.117169ZM13.9808 2.46301L10.299 13.5084C10.2487 13.6515 10.1559 13.7759 10.033 13.8648C9.91003 13.9536 9.76286 14.0028 9.6112 14.0056C9.45953 14.0085 9.31062 13.9649 9.18442 13.8808C9.05823 13.7966 8.96078 13.6758 8.90515 13.5347L7.33775 9.45318C7.31631 9.39919 7.29172 9.3465 7.26412 9.29539L10.8881 5.67144C11.0276 5.53194 11.1059 5.34274 11.1059 5.14547C11.1059 4.94819 11.0276 4.75899 10.8881 4.61949C10.7486 4.48 10.5594 4.40163 10.3621 4.40163C10.1648 4.40163 9.97562 4.48 9.83612 4.61949L6.21217 8.24344C6.16106 8.21584 6.10837 8.19125 6.05438 8.16981L1.97283 6.60241C1.83171 6.54678 1.71097 6.44933 1.6268 6.32314C1.54263 6.19694 1.49905 6.04803 1.50191 5.89636C1.50477 5.7447 1.55394 5.59753 1.64281 5.4746C1.73168 5.35167 1.85601 5.25885 1.99913 5.20858L13.0446 1.52677C13.1748 1.48476 13.3142 1.47951 13.4473 1.51162C13.5804 1.54373 13.702 1.61194 13.7988 1.70874C13.8956 1.80554 13.9638 1.92718 13.9959 2.06027C14.028 2.19335 14.0228 2.33271 13.9808 2.46301Z" fill="#008080" />
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip
                  content="Send Email"
                  side="bottom"
                >
                  <button
                    onClick={() => onSendEmail?.(employee)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                    aria-label="Send email"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M18 5.5C18 4.675 17.28 4 16.4 4H3.6C2.72 4 2 4.675 2 5.5V14.5C2 15.325 2.72 16 3.6 16H16.4C17.28 16 18 15.325 18 14.5V5.5ZM16.4 5.5L10 9.25L3.6 5.5H16.4ZM16.4 14.5H3.6V7L10 10.75L16.4 7V14.5Z" fill="#9A9A9A" />
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip
                  content={`Call: ${employee.phone}`}
                  side="bottom"
                >
                  <button
                    onClick={() => onCall?.(employee)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                    aria-label="Call"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M6.85573 3.30717L7.70193 3.06637C8.49392 2.84096 9.3409 3.20567 9.68033 3.91828L10.356 5.33789C10.6507 5.956 10.4872 6.68331 9.95218 7.13552L8.46485 8.39413C8.55651 9.14734 8.84041 9.88865 9.31655 10.6181C9.76932 11.3236 10.376 11.9412 11.1009 12.4346L12.8891 11.9026C13.5664 11.7017 14.3042 11.9334 14.7198 12.4773L15.6878 13.7443C16.1718 14.3771 16.0846 15.2493 15.4851 15.7855L14.8424 16.3602C14.2028 16.9321 13.2898 17.14 12.4444 16.9048C10.4498 16.3504 8.6157 14.7047 6.94216 11.9677C5.26652 9.22597 4.67515 6.90008 5.16805 4.98999C5.37547 4.18638 6.01818 3.54587 6.85731 3.30717" fill="#232725" />
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip
                  content="View Profile"
                  side="bottom"
                >
                  <button
                    onClick={() => onViewProfile?.(employee)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                    aria-label="View profile"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12.9119 7.81729C12.9119 8.58883 12.6054 9.32877 12.0599 9.87433C11.5143 10.4199 10.7744 10.7264 10.0028 10.7264C9.2313 10.7264 8.49136 10.4199 7.9458 9.87433C7.40024 9.32877 7.09375 8.58883 7.09375 7.81729C7.09375 7.04575 7.40024 6.30582 7.9458 5.76026C8.49136 5.2147 9.2313 4.9082 10.0028 4.9082C10.7744 4.9082 11.5143 5.2147 12.0599 5.76026C12.6054 6.30582 12.9119 7.04575 12.9119 7.81729ZM11.4574 7.81729C11.4574 8.20306 11.3041 8.57303 11.0314 8.84581C10.7586 9.11859 10.3886 9.27184 10.0028 9.27184C9.61707 9.27184 9.2471 9.11859 8.97432 8.84581C8.70154 8.57303 8.5483 8.20306 8.5483 7.81729C8.5483 7.43152 8.70154 7.06156 8.97432 6.78877C9.2471 6.51599 9.61707 6.36275 10.0028 6.36275C10.3886 6.36275 10.7586 6.51599 11.0314 6.78877C11.3041 7.06156 11.4574 7.43152 11.4574 7.81729Z" fill="#1E88E5" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.58182 2 2 5.58182 2 10C2 14.4182 5.58182 18 10 18C14.4182 18 18 14.4182 18 10C18 5.58182 14.4182 2 10 2ZM3.45455 10C3.45455 11.52 3.97309 12.9193 4.84218 14.0305C5.45268 13.2292 6.24011 12.5797 7.14301 12.1329C8.04591 11.686 9.03985 11.4539 10.0473 11.4545C11.0417 11.4534 12.0233 11.6793 12.9172 12.1152C13.811 12.551 14.5936 13.1852 15.2051 13.9695C15.8352 13.143 16.2595 12.1783 16.4428 11.1553C16.6261 10.1323 16.5632 9.08039 16.2593 8.08653C15.9553 7.09268 15.4191 6.18549 14.6949 5.44003C13.9707 4.69457 13.0795 4.13226 12.0948 3.79964C11.1102 3.46702 10.0605 3.37365 9.03263 3.52725C8.00474 3.68085 7.02821 4.07701 6.18383 4.68295C5.33945 5.28888 4.6515 6.08718 4.17689 7.01178C3.70229 7.93638 3.45468 8.9607 3.45455 10ZM10 16.5455C8.49739 16.5479 7.0401 16.031 5.87491 15.0822C6.34386 14.4106 6.96814 13.8623 7.6946 13.484C8.42106 13.1056 9.22819 12.9084 10.0473 12.9091C10.8561 12.9084 11.6535 13.1007 12.3731 13.47C13.0927 13.8394 13.7138 14.3751 14.1847 15.0327C13.0105 16.0124 11.5292 16.5478 10 16.5455Z" fill="#1E88E5" />
                    </svg>
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Org Chart variant
  return (
    <div className="relative bg-white rounded-lg border border-[#E6E6E6] w-[278px]">
      <div className="flex items-start gap-3 p-[15px]">
        {/* Profile Picture with Status */}
        <div className="relative flex-shrink-0">
          <img
            src={employee.avatar || defaultAvatar}
            alt={employee.name}
            loading="lazy"
            className="w-12 h-12 rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = defaultAvatar;
            }}
          />
          <img
            src={statusIcon}
            alt={`${employee.status} status`}
            loading="lazy"
            className="absolute bottom-0 right-0 w-[13px] h-[13px]"
          />
        </div>

        {/* Name and Position */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-black text-[16px] leading-normal mb-[5px] line-clamp-1 hover:line-clamp-none">
            <HighlightText text={employee.name} highlight={searchTerm} />
          </h3>
          <p className="text-sm text-[#535352] line-clamp-1 hover:line-clamp-none">
            <HighlightText text={employee.position} highlight={searchTerm} />
          </p>
        </div>
      </div>

      {/* Action Icons Row */}
      <div className="flex items-center justify-center gap-[35px] py-[7px] border-t border-gray-200">
        <Tooltip
          content="Send Direct Message"
          side="bottom"
        >
          <button
            onClick={() => onSendMessage?.(employee)}
            className="block transition cursor-pointer"
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M14.4931 2.72068L3.44763 6.40249C3.01239 6.54846 2.63276 6.82511 2.36049 7.19472C2.08823 7.56433 1.93658 8.00892 1.92623 8.46787C1.91588 8.92682 2.04732 9.3778 2.30265 9.75931C2.55797 10.1408 2.92474 10.4343 3.35296 10.5998L7.43976 12.1619C7.53669 12.2015 7.62476 12.2601 7.69881 12.3341C7.77286 12.4082 7.83142 12.4963 7.87106 12.5932L9.4332 16.68C9.56649 17.0271 9.78442 17.3355 10.0672 17.577C10.3499 17.8185 10.6886 17.9855 11.0523 18.0628C11.416 18.1402 11.7933 18.1254 12.1499 18.0199C12.5064 17.9143 12.831 17.7213 13.094 17.4584C13.3378 17.2097 13.5229 16.9096 13.6357 16.5801L17.3175 5.53464C17.4473 5.14204 17.4655 4.72111 17.37 4.31879C17.2745 3.91648 17.0691 3.54861 16.7767 3.25622C16.4843 2.96384 16.1165 2.75844 15.7142 2.66295C15.3118 2.56746 14.8909 2.58562 14.4983 2.71542L14.4931 2.72068ZM15.9027 5.06652L12.2209 16.1119C12.1706 16.2551 12.0778 16.3794 11.9548 16.4683C11.8319 16.5571 11.6847 16.6063 11.5331 16.6092C11.3814 16.612 11.2325 16.5684 11.1063 16.4843C10.9801 16.4001 10.8827 16.2794 10.827 16.1382L9.25963 12.0567C9.23819 12.0027 9.2136 11.95 9.18599 11.8989L12.8099 8.27495C12.9494 8.13546 13.0278 7.94626 13.0278 7.74898C13.0278 7.5517 12.9494 7.36251 12.8099 7.22301C12.6704 7.08351 12.4812 7.00514 12.284 7.00514C12.0867 7.00514 11.8975 7.08351 11.758 7.22301L8.13405 10.847C8.08293 10.8194 8.03025 10.7948 7.97626 10.7733L3.89471 9.20592C3.75359 9.1503 3.63284 9.05285 3.54867 8.92665C3.4645 8.80046 3.42092 8.65154 3.42379 8.49988C3.42665 8.34821 3.47581 8.20105 3.56468 8.07812C3.65355 7.95518 3.77789 7.86236 3.92101 7.8121L14.9664 4.13029C15.0967 4.08827 15.2361 4.08303 15.3692 4.11514C15.5023 4.14724 15.6239 4.21545 15.7207 4.31226C15.8175 4.40906 15.8857 4.5307 15.9178 4.66378C15.9499 4.79687 15.9447 4.93623 15.9027 5.06652Z" fill="#008080" />
            </svg>
          </button>
        </Tooltip>
        <Tooltip
          content="Send Email"
          side="bottom"
        >
          <button
            onClick={() => onSendEmail?.(employee)}
            className="block transition cursor-pointer"
            aria-label="Send email"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M18 5.5C18 4.675 17.28 4 16.4 4H3.6C2.72 4 2 4.675 2 5.5V14.5C2 15.325 2.72 16 3.6 16H16.4C17.28 16 18 15.325 18 14.5V5.5ZM16.4 5.5L10 9.25L3.6 5.5H16.4ZM16.4 14.5H3.6V7L10 10.75L16.4 7V14.5Z" fill="#9A9A9A" />
            </svg>
          </button>
        </Tooltip>
        <Tooltip
          content={`Call: ${employee.officialNumber}`}
          side="bottom"
        >
          <button
            onClick={() => onCall?.(employee)}
            className="block transition cursor-pointer"
            aria-label="Call"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6.85573 3.30717L7.70193 3.06637C8.49392 2.84096 9.3409 3.20567 9.68033 3.91828L10.356 5.33789C10.6507 5.956 10.4872 6.68331 9.95218 7.13552L8.46485 8.39413C8.55651 9.14734 8.84041 9.88865 9.31655 10.6181C9.76932 11.3236 10.376 11.9412 11.1009 12.4346L12.8891 11.9026C13.5664 11.7017 14.3042 11.9334 14.7198 12.4773L15.6878 13.7443C16.1718 14.3771 16.0846 15.2493 15.4851 15.7855L14.8424 16.3602C14.2028 16.9321 13.2898 17.14 12.4444 16.9048C10.4498 16.3504 8.6157 14.7047 6.94216 11.9677C5.26652 9.22597 4.67515 6.90008 5.16805 4.98999C5.37547 4.18638 6.01818 3.54587 6.85731 3.30717" fill="#232725" />
            </svg>
          </button>
        </Tooltip>
        <Tooltip
          content="View Profile"
          side="bottom"
        >
          <button
            onClick={() => onViewProfile?.(employee)}
            className="block transition cursor-pointer"
            aria-label="View Profile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M12.9119 7.81729C12.9119 8.58883 12.6054 9.32877 12.0599 9.87433C11.5143 10.4199 10.7744 10.7264 10.0028 10.7264C9.2313 10.7264 8.49136 10.4199 7.9458 9.87433C7.40024 9.32877 7.09375 8.58883 7.09375 7.81729C7.09375 7.04575 7.40024 6.30582 7.9458 5.76026C8.49136 5.2147 9.2313 4.9082 10.0028 4.9082C10.7744 4.9082 11.5143 5.2147 12.0599 5.76026C12.6054 6.30582 12.9119 7.04575 12.9119 7.81729ZM11.4574 7.81729C11.4574 8.20306 11.3041 8.57303 11.0314 8.84581C10.7586 9.11859 10.3886 9.27184 10.0028 9.27184C9.61707 9.27184 9.2471 9.11859 8.97432 8.84581C8.70154 8.57303 8.5483 8.20306 8.5483 7.81729C8.5483 7.43152 8.70154 7.06156 8.97432 6.78877C9.2471 6.51599 9.61707 6.36275 10.0028 6.36275C10.3886 6.36275 10.7586 6.51599 11.0314 6.78877C11.3041 7.06156 11.4574 7.43152 11.4574 7.81729Z" fill="#1E88E5" />
              <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.58182 2 2 5.58182 2 10C2 14.4182 5.58182 18 10 18C14.4182 18 18 14.4182 18 10C18 5.58182 14.4182 2 10 2ZM3.45455 10C3.45455 11.52 3.97309 12.9193 4.84218 14.0305C5.45268 13.2292 6.24011 12.5797 7.14301 12.1329C8.04591 11.686 9.03985 11.4539 10.0473 11.4545C11.0417 11.4534 12.0233 11.6793 12.9172 12.1152C13.811 12.551 14.5936 13.1852 15.2051 13.9695C15.8352 13.143 16.2595 12.1783 16.4428 11.1553C16.6261 10.1323 16.5632 9.08039 16.2593 8.08653C15.9553 7.09268 15.4191 6.18549 14.6949 5.44003C13.9707 4.69457 13.0795 4.13226 12.0948 3.79964C11.1102 3.46702 10.0605 3.37365 9.03263 3.52725C8.00474 3.68085 7.02821 4.07701 6.18383 4.68295C5.33945 5.28888 4.6515 6.08718 4.17689 7.01178C3.70229 7.93638 3.45468 8.9607 3.45455 10ZM10 16.5455C8.49739 16.5479 7.0401 16.031 5.87491 15.0822C6.34386 14.4106 6.96814 13.8623 7.6946 13.484C8.42106 13.1056 9.22819 12.9084 10.0473 12.9091C10.8561 12.9084 11.6535 13.1007 12.3731 13.47C13.0927 13.8394 13.7138 14.3751 14.1847 15.0327C13.0105 16.0124 11.5292 16.5478 10 16.5455Z" fill="#1E88E5" />
            </svg>
          </button>
        </Tooltip>
      </div>

      {/* Add/Delete Buttons */}
      {showAddDelete && (
        <div className="flex items-center justify-center gap-1.5 absolute -bottom-[23px] right-0">
          <Tooltip
            content="Assign New Reportee"
            side="bottom"
          >
            <button
              onClick={() => onAdd?.(employee)}
              className="w-5 h-5 rounded-full bg-[#1E88E5] text-white flex items-center justify-center hover:bg-[#1E88E5]/80 transition cursor-pointer"
              aria-label="Add subordinate"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.1622 5.80695H5.80695V10.1622H4.35521V5.80695H0V4.35521H4.35521V0H5.80695V4.35521H10.1622V5.80695Z" fill="white" />
              </svg>
            </button>
          </Tooltip>
          <Tooltip
            content="Remove Staff from Chart"
            side="bottom"
          >
            <button
              onClick={() => onDelete?.(employee)}
              className="w-5 h-5 rounded-full bg-[#D93025] text-white flex items-center justify-center hover:bg-[#D93025]/80 transition cursor-pointer"
              aria-label="Delete employee"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M3.06982 0.914595H2.96396C3.02218 0.914595 3.06982 0.868865 3.06982 0.812973V0.914595ZM3.06982 0.914595H7.09234V0.812973C7.09234 0.868865 7.13998 0.914595 7.1982 0.914595H7.09234V1.82919H8.04504V0.812973C8.04504 0.364568 7.66529 0 7.1982 0H2.96396C2.49687 0 2.11712 0.364568 2.11712 0.812973V1.82919H3.06982V0.914595ZM9.73874 1.82919H0.423423C0.189217 1.82919 0 2.01084 0 2.23568V2.64216C0 2.69805 0.0476351 2.74378 0.105856 2.74378H0.905067L1.2319 9.3873C1.25307 9.82046 1.62621 10.1622 2.07742 10.1622H8.08474C8.53727 10.1622 8.90909 9.82173 8.93026 9.3873L9.25709 2.74378H10.0563C10.1145 2.74378 10.1622 2.69805 10.1622 2.64216V2.23568C10.1622 2.01084 9.97294 1.82919 9.73874 1.82919ZM7.98285 9.24757H2.17931L1.85909 2.74378H8.30307L7.98285 9.24757Z" fill="white" />
              </svg>
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default EmployeeCard;
