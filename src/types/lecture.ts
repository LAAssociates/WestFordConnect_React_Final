export interface LectureFilterRequest {
  venueIds?: number[] | null;
  moduleIds?: number[] | null;
  batchCodes?: string[] | null;
  filterStartDate?: string | null;
  filterEndDate?: string | null;
}

export interface LectureRequest {
  viewStart: string;
  viewEnd: string;
  searchText?: string | null;
  filter?: LectureFilterRequest | null;
}

export interface LectureCalendarEventItem {
  id: string;
  title: string;
  start: string;
  end: string;
  facultyName: string;
  color: string;
  batch_info: string;
}

export interface LectureResult {
  viewStart: string;
  viewEnd: string;
  events: LectureCalendarEventItem[];
}

export interface LectureResponse {
  success: boolean;
  message: string;
  result: LectureResult;
  errors: any;
  requestId: string;
  timestamp: string;
}

export interface ScheduleDto {
  scheduleId: string;
  scheduleCode?: string | null;
  scheduleFrom: string;
  scheduleTo: string;
  status: string;
  totalTimeMinutes: string;
  description?: string | null;
  eventTitle: string;
  facultyId: string;
  batchId: string;
  moduleId: string;
  campusId?: string | null;
  facultyName: string;
  batchCode: string;
  moduleName: string;
}

export interface LectureScheduleResult {
  schedule: ScheduleDto;
}

export interface LectureScheduleResponse {
  success: boolean;
  message: string;
  result: LectureScheduleResult;
  errors: any;
  requestId: string;
  timestamp: string;
}
