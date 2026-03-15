export interface DashboardProjectGroupMemberPreview {
  userId: number;
  name: string;
  avatarUrl?: string | null;
}

export interface DashboardProjectGroupCard {
  chatId: number;
  chatType: 'group';
  title: string;
  avatarUrl?: string | null;
  lastMessageId?: number | null;
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  lastMessageSenderId?: number | null;
  lastMessageSenderName?: string | null;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isLeft?: boolean;
  leftOn?: string | null;
  memberCount: number;
  memberPreview: DashboardProjectGroupMemberPreview[];
}

export interface DashboardProjectGroupsResponse {
  success: boolean;
  message: string;
  result: DashboardProjectGroupCard[];
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface DashboardUserItem {
  id: number;
  name: string;
  designation: string;
  profileImageUrl: string;
  availabilityStatus?: number | null;
  isOnline?: boolean | null;
  lastSeen?: string | null;
}

export interface DashboardTaskApiAttachment {
  attachmentId?: number;
  attachmentType?: string;
  displayText?: string;
  fileName?: string;
  url?: string;
}

export interface DashboardTaskApiItem {
  id: number;
  title: string;
  description?: string | null;
  dueStart?: string | null;
  dueEnd?: string | null;
  priorityId?: number | null;
  audienceCount?: number | null;
  commentCount?: number | null;
  attachments?: DashboardTaskApiAttachment[] | null;
  createdById?: number | null;
  createdByName?: string | null;
  lastModifiedById?: number | null;
  lastModifiedByName?: string | null;
  lastModifiedOn?: string | null;
}

export interface DashboardTaskSectionResult {
  totalCount: number;
  items: DashboardTaskApiItem[];
}

export interface DashboardTaskResult {
  toDo: DashboardTaskSectionResult;
  inProgress: DashboardTaskSectionResult;
  completed: DashboardTaskSectionResult;
  overdue: DashboardTaskSectionResult;
}

export interface DashboardTaskCounts {
  todo: number;
  'in-progress': number;
  completed: number;
  overdue: number;
}

export interface DashboardNewsItem {
  newsId: number;
  title?: string | null;
  categoryId?: number | null;
  categoryDesc?: string | null;
  description?: string | null;
  publishDate?: string | null;
  status?: string | null;
  isPinned?: boolean | null;
  createdOn?: string | null;
  updatedOn?: string | null;
  lastModified?: string | null;
}

export interface DashboardTodayInfo {
  wish?: string | null;
  userName?: string | null;
  currentDate?: string | null;
  totalDaysAt?: number | null;
  workedSeconds?: number | null;
  isCheckedIn?: boolean | null;
  inTime?: string | null;
  outTime?: string | null;
}

export interface DashboardGetAllResult {
  users: DashboardUserItem[];
  myTask?: DashboardTaskResult | null;
  newsInfo?: DashboardNewsItem[] | null;
  todayInfo?: DashboardTodayInfo | null;
}

export interface DashboardGetAllResponse {
  success: boolean;
  message: string;
  result: DashboardGetAllResult;
  errors: any | null;
  requestId: string;
  timestamp: string;
}


export interface DashboardMyTasksResponse {
  success: boolean;
  message: string;
  result: DashboardTaskResult;
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface DashboardTodayResponse {
  success: boolean;
  message: string;
  result: DashboardTodayInfo;
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface DashboardLookupItem {
  lookupType?: string;
  code?: number | null;
  description: string;
  iconUrl?: string;
  sortOrder?: number | null;
}

export interface DashboardDepartmentItem {
  id: number;
  name: string;
  staffCount?: number | null;
  status?: string | null;
}

export interface DashboardBootstrapResult {
  eventsFilterViewType: DashboardLookupItem[];
  filterTimeFrame: DashboardLookupItem[];
  peopleMomentsFilterViewType: DashboardLookupItem[];
  atWorkFilterDepartment: DashboardDepartmentItem[];
}

export interface DashboardBootstrapResponse {
  success: boolean;
  message: string;
  result: DashboardBootstrapResult;
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface DashboardPeopleMomentItem {
  id: number;
  employeeName: string;
  position: string;
  profileImageUrl?: string | null;
  ProfileImageUrl?: string | null;
  avatarUrl?: string | null;
  date: string;
  eventType: 'birthday' | 'work-anniversary';
  years?: number | null;
  eventDate?: string | null;
}

export interface DashboardPeopleMomentsResult {
  period: string;
  birthdayCount: number;
  anniversaryCount: number;
  totalCount: number;
  items: DashboardPeopleMomentItem[];
}

export interface DashboardPeopleMomentsResponse {
  success: boolean;
  message: string;
  result: DashboardPeopleMomentsResult;
  errors: any | null;
  requestId: string;
  timestamp: string;
}
