export interface CalendarEventsRequest {
  from: string;
  to: string;
}

export interface CalendarEventItem {
  eventId: string;
  title: string;
  start: string;
  end: string;
  isAllDay: boolean;
  sourceEntityType: string;
  sourceEntityId: number;
  personName?: string | null;
  personPosition?: string | null;
  profileImageUrl?: string | null;
  department?: string | null;
  personEmail?: string | null;
}

export interface CalendarResult {
  items: CalendarEventItem[];
}

export interface CalendarResponse {
  success: boolean;
  message: string;
  result: CalendarResult;
  errors: any;
  requestId: string;
  timestamp: string;
}

export interface CalendarStaffItem {
  id: number;
  name: string;
  email: string;
  designation: string;
  profileImageUrl?: string | null;
}

export interface CalendarBootstrapResult {
  staffs: CalendarStaffItem[];
  pinnedStaffIds: number[];
}

export interface CalendarBootstrapResponse {
  success: boolean;
  message: string;
  result: CalendarBootstrapResult;
  errors: any;
  requestId: string;
  timestamp: string;
}

export interface CalendarTogglePinnedRequest {
  staffUserId: number;
  isPinned: boolean;
}

export interface CalendarTogglePinnedResponse {
  success: boolean;
  message: string;
  result: any | null;
  errors: any;
  requestId: string;
  timestamp: string;
}

export interface CalendarStatusResult {
  isConnected: boolean;
}

export interface CalendarStatusResponse {
  success: boolean;
  message: string;
  result: CalendarStatusResult;
  errors: any;
  requestId: string;
  timestamp: string;
}
