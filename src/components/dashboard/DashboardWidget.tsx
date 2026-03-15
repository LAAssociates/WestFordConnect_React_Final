import React from 'react';
import { cn } from '../../lib/utils/cn';

interface DashboardWidgetProps {
  title: string | React.ReactNode;
  children: React.ReactNode;
  showFilter?: boolean;
  onFilterClick?: () => void;
  className?: string;
}

const DashboardWidget = React.forwardRef<HTMLButtonElement | null, DashboardWidgetProps>(({
  title,
  children,
  showFilter = false,
  onFilterClick,
  className,
}, ref) => {
  return (
    <div className={cn(className, "relative")}>
      {/* Header */}
      <h2 className="text-[18px] font-semibold text-black leading-normal mb-3.5 pl-1">{title}</h2>
      {showFilter && (
        <button
          ref={ref}
          type="button"
          onClick={onFilterClick}
          className="cursor-pointer absolute top-0 right-0"
          aria-label="Filter"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#DE4A2C" />
            <path d="M9.61274 9.6L14.8403 16.0808C15.0691 16.3647 15.1937 16.7173 15.1935 17.0808V22.4L16.8065 21.2V17.08C16.8065 16.7168 16.9311 16.3644 17.1597 16.0808L22.3873 9.6H9.61274ZM9.61274 8H22.3873C22.6911 8.00004 22.9888 8.08522 23.246 8.24573C23.5032 8.40625 23.7094 8.63556 23.841 8.90727C23.9725 9.17898 24.0241 9.48202 23.9896 9.7815C23.9551 10.081 23.8361 10.3647 23.6462 10.6L18.4194 17.08V21.2C18.4194 21.4484 18.3611 21.6934 18.2491 21.9155C18.1371 22.1377 17.9746 22.331 17.7742 22.48L16.1613 23.68C15.9217 23.8583 15.6367 23.9669 15.3384 23.9935C15.04 24.0202 14.7401 23.964 14.4722 23.8311C14.2043 23.6982 13.979 23.4939 13.8215 23.2412C13.664 22.9884 13.5806 22.6971 13.5806 22.4V17.08L8.35384 10.6C8.16393 10.3647 8.04488 10.081 8.01041 9.7815C7.97594 9.48202 8.02745 9.17898 8.15901 8.90727C8.29057 8.63556 8.49683 8.40625 8.75402 8.24573C9.01121 8.08522 9.30888 8.00004 9.61274 8Z" fill="white" />
          </svg>
        </button>
      )}
      {children}
    </div>
  );
});

DashboardWidget.displayName = 'DashboardWidget';

export default DashboardWidget;



