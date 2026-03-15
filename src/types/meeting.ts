export interface LookupItem {
  lookupType: string;
  code: number;
  description: string;
  iconUrl: string;
  sortOrder: number;
}

export interface AssignedToUser {
  id: number;
  name: string;
  email: string;
  department: string;
  departmentId: number;
  designation: string;
  designationId: number;
  profileImageUrl: string;
}

export interface Department {
  id: number;
  name: string;
  staffCount: number;
  status: string;
}

export interface MeetingInitialLoadResult {
  filterAssignedToType: LookupItem[];
  filterAssignedTo: AssignedToUser[];
  filterCreatedBy: AssignedToUser[];
  filterDepartments: Department[];
  filterPriorities: LookupItem[];
  filterSortBy: LookupItem[];
}

export interface MeetingInitialLoadResponse {
  success: boolean;
  message: string | null;
  result: MeetingInitialLoadResult;
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface MeetingItemResponse {
  id: number;
  title: string;
  description: string;
  dueStart: string;
  dueEnd: string | null;
  isAllDay: boolean;
  isEndOfDay: boolean;
  isScheduled: boolean;
  isMeeting: boolean;
  priorityId: number;
  statusId: number;
  addToCalendar: boolean;
  audience: {
    audienceType: number;
    userIds: number[] | null;
    groupIds: number[] | null;
  };
  createdById: number;
  createdByName: string;
  lastModifiedById: number | null;
  lastModifiedByName: string;
  lastModifiedOn: string | null;
  showComments: boolean;
  audienceCount: number;
  commentCount: number;
  comments: any[];
  onlineMeet: string | null;
}

export interface MeetingGroupResponse {
  items: MeetingItemResponse[];
  totalCount: number;
}

export interface GetAllMeetingsResult {
  toDo: MeetingGroupResponse;
  inProgress: MeetingGroupResponse;
  completed: MeetingGroupResponse;
  overdue: MeetingGroupResponse;
}

export interface GetAllMeetingsResponse {
  success: boolean;
  message: string;
  result: GetAllMeetingsResult;
  errors: any;
  requestId: string;
  timestamp: string;
}

export interface MeetingDetailsResult {
  taskId: number; // API uses taskId even for meetings
  title: string;
  description: string;
  dueStart: string;
  dueEnd: string;
  isAllDay: boolean;
  isEndOfDay: boolean;
  isScheduled: boolean;
  isMeeting: boolean;
  statusId: number;
  priorityId: number;
  addToCalendar: boolean;
  departmentId: number | null;
  audience: {
    audienceType: number;
    userIds: number[] | null;
    groupIds: number[] | null;
  };
  attachments: any[]; // Using any for now to match common attachment structure
  venueDesc?: string | null;
  participants?: any[];
  comments: any[];
  onlineMeet: string | null;
  createdById: number;
  createdByName: string;
  createdOn: string;
  updatedById: number | null;
  updatedByName: string | null;
  updatedOn: string | null;
}

export interface GetSingleMeetingResponse {
  success: boolean;
  message: string;
  result: MeetingDetailsResult;
  errors: any;
  requestId: string;
  timestamp: string;
}

export interface MeetingSaveRequest {
  isMeeting: boolean;
  taskId?: number;
  title: string;
  description?: string;
  dueStart: string;
  dueEnd: string;
  isScheduled: boolean;
  isAllDay: boolean;
  isEndOfDay: boolean;
  priorityId: number;
  statusId: number;
  addToCalendar: boolean;
  departmentId?: number;
  audience: {
    audienceType: number;
    userIds?: number[];
    groupIds?: number[];
  };
  attachments?: any[];
  venueId?: number | null;
  venueDesc?: string | null;
}

export interface ChangeStatusRequest {
  entityId: number;
  statusCode: number;
}
