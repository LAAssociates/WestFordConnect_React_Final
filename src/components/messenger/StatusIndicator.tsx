import React from 'react';

type StatusIndicatorStatus = 'active' | 'away' | 'do-not-disturb';
type LegacyStatus = 'online' | 'offline' | 'away' | 'busy';

interface StatusIndicatorProps {
  status?: StatusIndicatorStatus | LegacyStatus;
}

// Helper function to map legacy status types to new status types
const mapStatus = (status?: StatusIndicatorStatus | LegacyStatus): StatusIndicatorStatus | undefined => {
  if (!status) return undefined;

  switch (status) {
    case 'online':
      return 'active';
    case 'away':
      return 'away';
    case 'busy':
      return 'do-not-disturb';
    case 'offline':
      return undefined;
    case 'active':
    case 'do-not-disturb':
      return status;
    default:
      return undefined;
  }
};

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const mappedStatus = mapStatus(status);

  if (!mappedStatus) {
    return null;
  }

  switch (mappedStatus) {
    case 'active':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6.5" cy="6.5" r="5.75" fill="#16A34A" stroke="white" strokeWidth="1.5" />
        </svg>
      );
    case 'away':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6.5" cy="6.5" r="5.75" fill="#FFB74D" stroke="white" strokeWidth="1.5" />
          <path d="M3.37109 6.37642H9.30789M3.37109 6.37642L5.1978 4.54971M3.37109 6.37642L5.1978 8.20312" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'do-not-disturb':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6.5" cy="6.5" r="5.75" fill="#D93025" stroke="white" strokeWidth="1.5" />
          <path d="M3.5 6.5H9" stroke="white" strokeWidth="2" />
        </svg>
      );
    default:
      return null;
  }
};

export default StatusIndicator;





