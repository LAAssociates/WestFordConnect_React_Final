import { apiClient } from './apiClient';
import { formatToDateTimeOffset, ensureDateTimeWithOffset } from '../utils/dateUtils';
import type { 
    MeetingInitialLoadResponse, 
    GetAllMeetingsResponse, 
    GetSingleMeetingResponse, 
    MeetingSaveRequest,
    ChangeStatusRequest
} from '../types/meeting';
import type { 
    TaskFilterRequest, 
    SaveTaskResponse,
    DownloadAttachmentResponse,
    AddTaskCommentRequest,
    AddTaskCommentResponse,
    AddTaskCommentReplyRequest,
    AddTaskCommentReplyResponse,
    ReactToTaskCommentRequest,
    ReactToTaskCommentResponse
} from './taskService';

class MeetingService {
    async getInitialLoad(): Promise<MeetingInitialLoadResponse> {
        try {
            const data = await apiClient.get<MeetingInitialLoadResponse>('/api/Meeting/bootstrap/initialload');
            return data;
        } catch (error) {
            console.error('Error fetching meeting initial load data:', error);
            throw error;
        }
    }

    async getAllMeetings(request: TaskFilterRequest): Promise<GetAllMeetingsResponse> {
        try {
            const data = await apiClient.post<GetAllMeetingsResponse>('/api/Meeting/GetAll', request);
            return data;
        } catch (error) {
            console.error('Error fetching all meetings:', error);
            throw error;
        }
    }

    async getSingleMeeting(meetingId: number): Promise<GetSingleMeetingResponse> {
        try {
            const data = await apiClient.get<GetSingleMeetingResponse>(`/api/Meeting/GetSingle?meetingId=${meetingId}`);
            return data;
        } catch (error) {
            console.error('Error fetching single meeting info:', error);
            throw error;
        }
    }

    async saveMeeting(request: MeetingSaveRequest, files?: File[]): Promise<SaveTaskResponse> {
        try {
            const formData = new FormData();
            
            formData.append('IsMeeting', 'true');
            if (request.taskId) formData.append('TaskId', request.taskId.toString());
            formData.append('Title', request.title);
            if (request.description) formData.append('Description', request.description);
            
            // Normalize dueStartValue and ensure datetime with offset is sent when provided
            let dueStartValue = request.dueStart;
            dueStartValue = ensureDateTimeWithOffset(dueStartValue) ?? dueStartValue;
            if (dueStartValue && !dueStartValue.includes('+') && !dueStartValue.includes('Z')) {
                const dt = new Date(dueStartValue);
                if (!Number.isNaN(dt.getTime())) {
                    dueStartValue = formatToDateTimeOffset(dt);
                }
            }
            const dueStartFinal = dueStartValue;
            formData.append('DueStart', dueStartFinal);
            // Debug: verify start value
            // eslint-disable-next-line no-console
            console.debug('Meeting Save - DueStart', { input: request.dueStart, final: dueStartFinal });
            let dueEndValue = request.dueEnd;
            dueEndValue = ensureDateTimeWithOffset(dueEndValue) ?? dueEndValue;
            if (!dueEndValue.includes('+') && !dueEndValue.includes('Z')) {
                const dtEnd = new Date(dueEndValue);
                if (!Number.isNaN(dtEnd.getTime())) {
                    dueEndValue = formatToDateTimeOffset(dtEnd);
                }
            }
            const dueEndFinal = dueEndValue;
            formData.append('DueEnd', dueEndFinal);
            // Debug: verify end value
            // eslint-disable-next-line no-console
            console.debug('Meeting Save - DueEnd', { input: request.dueEnd, final: dueEndFinal });
            
            formData.append('IsScheduled', request.isScheduled.toString());
            formData.append('IsAllDay', request.isAllDay.toString());
            formData.append('IsEndOfDay', request.isEndOfDay.toString());
            
            formData.append('PriorityId', request.priorityId.toString());
            formData.append('StatusId', request.statusId.toString());
            formData.append('AddToCalendar', request.addToCalendar.toString());
            if (request.departmentId) formData.append('DepartmentId', request.departmentId.toString());

            // Venue
            if (request.venueId) formData.append('VenueId', request.venueId.toString());
            if (request.venueDesc) formData.append('VenueDesc', request.venueDesc);

            // Audience
            formData.append('Audience.AudienceType', request.audience.audienceType.toString());
            if (request.audience.userIds) {
                request.audience.userIds.forEach((id, index) => {
                    formData.append(`Audience.UserIds[${index}]`, id.toString());
                });
            }
            if (request.audience.groupIds) {
                request.audience.groupIds.forEach((id, index) => {
                    formData.append(`Audience.GroupIds[${index}]`, id.toString());
                });
            }

            // Attachments (Metadata)
            if (request.attachments) {
                request.attachments.forEach((att, index) => {
                    formData.append(`Attachments[${index}].Type`, att.type);
                    formData.append(`Attachments[${index}].DisplayText`, att.displayText);
                    if (att.url) formData.append(`Attachments[${index}].Url`, att.url);
                    if (att.fileKey) formData.append(`Attachments[${index}].FileKey`, att.fileKey);
                    if (att.fileName) formData.append(`Attachments[${index}].FileName`, att.fileName);
                    if (att.contentType) formData.append(`Attachments[${index}].ContentType`, att.contentType);
                });
            }

            // Attachment Files
            if (files && files.length > 0) {
                files.forEach((file) => {
                    formData.append('attachmentFiles', file);
                });
            }

            const data = await apiClient.post<SaveTaskResponse>('/api/Meeting/Save', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return data;
        } catch (error) {
            console.error('Error saving meeting:', error);
            throw error;
        }
    }

    async deleteMeeting(meetingId: number): Promise<{ success: boolean; message: string }> {
        try {
            const data = await apiClient.post<{ success: boolean; message: string }>('/api/Meeting/Delete', { meetingId });
            return data;
        } catch (error) {
            console.error('Error deleting meeting:', error);
            throw error;
        }
    }

    async getComments(meetingId: number): Promise<any> {
        try {
            const data = await apiClient.get<any>(`/api/Meeting/${meetingId}/GetComments`);
            return data;
        } catch (error) {
            console.error('Error fetching meeting comments:', error);
            throw error;
        }
    }

    async addComment(meetingId: number, request: AddTaskCommentRequest): Promise<AddTaskCommentResponse> {
        try {
            const data = await apiClient.post<AddTaskCommentResponse>(`/api/Meeting/${meetingId}/AddComment`, request);
            return data;
        } catch (error) {
            console.error('Error adding meeting comment:', error);
            throw error;
        }
    }

    async addCommentReply(meetingId: number, request: AddTaskCommentReplyRequest): Promise<AddTaskCommentReplyResponse> {
        try {
            const data = await apiClient.post<AddTaskCommentReplyResponse>(`/api/Meeting/${meetingId}/AddCommentReply`, request);
            return data;
        } catch (error) {
            console.error('Error adding meeting comment reply:', error);
            throw error;
        }
    }

    async reactToComment(meetingId: number, request: ReactToTaskCommentRequest): Promise<ReactToTaskCommentResponse> {
        try {
            const data = await apiClient.post<ReactToTaskCommentResponse>(`/api/Meeting/${meetingId}/ReactToComment`, request);
            return data;
        } catch (error) {
            console.error('Error reacting to meeting comment:', error);
            throw error;
        }
    }

    async deleteComment(meetingId: number, commentId: number): Promise<any> {
        try {
            const data = await apiClient.post<any>(`/api/Meeting/${meetingId}/DeleteComment/${commentId}`, {});
            return data;
        } catch (error) {
            console.error('Error deleting meeting comment:', error);
            throw error;
        }
    }

    async deleteCommentReply(meetingId: number, replyId: number): Promise<any> {
        try {
            const data = await apiClient.post<any>(`/api/Meeting/${meetingId}/DeleteCommentReply/${replyId}`, {});
            return data;
        } catch (error) {
            console.error('Error deleting meeting comment reply:', error);
            throw error;
        }
    }

    async downloadMeetingAttachment(meetingId: number, attachmentId: number): Promise<DownloadAttachmentResponse> {
        try {
            const data = await apiClient.post<DownloadAttachmentResponse>(
                `/api/Meeting/${meetingId}/Attachment/${attachmentId}/Download`,
                {}
            );
            return data;
        } catch (error) {
            console.error('Error downloading meeting attachment:', error);
            throw error;
        }
    }

    async deleteMeetingAttachment(meetingId: number, attachmentId: number): Promise<{ success: boolean; message: string }> {
        try {
            const data = await apiClient.post<{ success: boolean; message: string }>(
                `/api/Meeting/${meetingId}/Attachment/${attachmentId}/Delete`,
                {}
            );
            return data;
        } catch (error) {
            console.error('Error deleting meeting attachment:', error);
            throw error;
        }
    }

    async changeMeetingStatus(request: ChangeStatusRequest): Promise<any> {
        try {
            const data = await apiClient.post<any>('/api/Meeting/ChangeStatus', request);
            return data;
        } catch (error) {
            console.error('Error changing meeting status:', error);
            throw error;
        }
    }
}

export const meetingService = new MeetingService();
