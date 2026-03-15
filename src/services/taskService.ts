import { apiClient } from './apiClient';
import { formatToDateTimeOffset, ensureDateTimeWithOffset } from '../utils/dateUtils';

export const AudienceType = {
    Individual: 2,
    ProjectGroup: 3
} as const;

export type AudienceType = typeof AudienceType[keyof typeof AudienceType];

export interface AudienceInfo {
    audienceType: AudienceType;
    userIds?: number[];
    groupIds?: number[];
}

export interface ProjectGroupMember {
    userId: number;
    fullName: string;
    profileUrl: string | null;
    departmentName: string;
    designationName: string;
}

export interface GetProjectGroupMembersResponse {
    success: boolean;
    message: string;
    result: ProjectGroupMember[];
    errors: any | null;
    requestId: string;
    timestamp: string;
}

export interface CommonAttachmentRequest {
    type: string;
    displayText: string;
    url?: string;
    fileKey?: string;
    fileName?: string;
    contentType?: string;
}

export interface TaskSaveRequest {
    isMeeting?: boolean;
    taskId?: number;
    title: string;
    description?: string;
    dueStart: string; // ISO string
    dueEnd?: string | null; // ISO string
    isScheduled: boolean;
    isAllDay: boolean;
    isEndOfDay: boolean;
    priorityId: number;
    statusId: number;
    addToCalendar: boolean;
    departmentId?: number;
    audience: AudienceInfo;
    attachments?: CommonAttachmentRequest[];
    venueId?: number | null;
    venueDesc?: string | null;
}

export interface SaveTaskResponse {
    success: boolean;
    message: string | null;
    result: any;
    errors: any;
}

export interface AssignedToType {
    id: number;
    description: string;
}

export interface AttachmentOption {
    id: number;
    description: string;
}

export interface IndividualUser {
    id: number;
    name: string;
    department: string;
    departmentId: number;
    designation: string;
    designationId: number;
    profileImageUrl: string;
}

export interface Group {
    groupId: number;
    groupName: string;
    memberCount: number;
    iconUrl?: string | null;
}

export interface StatusOption {
    id: number;
    description: string;
}

export interface PriorityOption {
    id: number;
    description: string;
}

export interface BootstrapDrawerResult {
    assignedToType: AssignedToType[];
    attachments: AttachmentOption[];
    individualUsers: IndividualUser[];
    groups: Group[];
    status: StatusOption[];
    priority: PriorityOption[];
    venue?: StatusOption[];
}

export interface BootstrapDrawerResponse {
    success: boolean;
    message: string | null;
    result: BootstrapDrawerResult;
    errors: null;
    requestId: string;
    timestamp: string;
}

export interface TaskFilterRequest {
    searchQuery?: string | null;
    pageNumber: number;
    pageSize: number;
    sortBy?: number | null;
    departmentIds?: number[] | null;
    assignedToIds?: number[] | null;
    createdByIds?: number[] | null;
    priorities?: number[] | null;
    dueFrom?: string | null;
    dueTo?: string | null;
}

export interface TaskItemResponse {
    id: string;
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
}

export interface TaskGroupResponse {
    items: TaskItemResponse[];
    totalCount: number;
}

export interface GetAllTasksResult {
    toDo: TaskGroupResponse;
    inProgress: TaskGroupResponse;
    completed: TaskGroupResponse;
    overdue: TaskGroupResponse;
}

export interface GetAllTasksResponse {
    success: boolean;
    message: string;
    result: GetAllTasksResult;
    errors: any;
    requestId: string;
    timestamp: string;
}

export interface TaskParticipant {
    id: number;
    name: string;
    designation: string;
    imageUrl: string;
}

export interface TaskAttachmentResponse {
    attachmentId: number;
    attachmentType: 'FILE' | 'LINK';
    displayText: string;
    fileKey: string;
    fileName: string;
    contentType: string;
    url: string;
}

export interface DownloadAttachmentRequest {
    entityType: string;
    entityId: number;
    attachmentId: number;
}

export interface DownloadAttachmentResponse {
    success: boolean;
    message: string;
    result: {
        url: string;
    } | null;
    errors: any;
    requestId: string;
    timestamp: string;
}

export interface SingleTaskResult {
    taskId: number;
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
    attachments: TaskAttachmentResponse[];
    participants?: TaskParticipant[];
    comments: any[];
    createdById: number;
    createdByName: string;
    createdOn: string;
    updatedById: number | null;
    updatedByName: string | null;
    updatedOn: string | null;
}

export interface GetSingleTaskResponse {
    success: boolean;
    message: string;
    result: SingleTaskResult;
    errors: any;
    requestId: string;
    timestamp: string;
}

export interface AddTaskCommentRequest {
    entityType: string | null;
    entityId: number | null;
    commentText: string;
}

export interface AddTaskCommentResponse {
    success: boolean;
    message: string;
    result: any;
    errors: any;
    requestId: string;
    timestamp: string;
}

export interface TaskHistoryResponse {
    success: boolean;
    message: string;
    result: any[];
    errors: any;
    requestId: string;
    timestamp: string;
}

export interface AddTaskCommentReplyRequest {
    commentId: number;
    replyText: string;
    replyToReplyId: number | null;
    replyToUserId: number | null;
}

export interface AddTaskCommentReplyResponse {
    success: boolean;
    message: string;
    result: any;
    errors: any;
    requestId: string;
    timestamp: string;
}

export interface ReactToTaskCommentRequest {
    commentId: number;
    replyId?: number | null;
    reaction: number;
}

export interface ReactToTaskCommentResponse {
    success: boolean;
    message: string;
    result: null;
    errors: any;
    requestId: string;
    timestamp: string;
}

class TaskService {
    async getInitialLoad(): Promise<any> {
        try {
            const data = await apiClient.get<any>('/api/Task/bootstrap/initialload');
            return data;
        } catch (error) {
            console.error('Error fetching task initial load data:', error);
            throw error;
        }
    }

    async getBootstrapDrawer(): Promise<BootstrapDrawerResponse> {
        try {
            const data = await apiClient.get<BootstrapDrawerResponse>('/api/Task/bootstrap/drawer');
            return data;
        } catch (error) {
            console.error('Error fetching bootstrap drawer data:', error);
            throw error;
        }
    }

    async saveTask(request: TaskSaveRequest, files?: File[]): Promise<SaveTaskResponse> {
        try {
            const formData = new FormData();
            
            // Append the request object as nested fields for [FromForm]
            formData.append('Title', request.title);
            if (request.isMeeting !== undefined) formData.append('IsMeeting', request.isMeeting.toString());
            if (request.taskId) formData.append('TaskId', request.taskId.toString());
            if (request.description) formData.append('Description', request.description);
            
            // Normalize and ensure datetime with offset is sent when provided
            let dueStartValue = request.dueStart;
            dueStartValue = ensureDateTimeWithOffset(dueStartValue) ?? dueStartValue;
            if (dueStartValue && !dueStartValue.includes('+') && !dueStartValue.includes('Z')) {
                const dt = new Date(dueStartValue);
                if (!Number.isNaN(dt.getTime())) {
                    dueStartValue = formatToDateTimeOffset(dt);
                }
            }
            formData.append('DueStart', dueStartValue);
            if (request.dueEnd) {
                let dueEndValue = request.dueEnd as string;
                dueEndValue = ensureDateTimeWithOffset(dueEndValue) ?? dueEndValue;
                if (!dueEndValue.includes('+') && !dueEndValue.includes('Z')) {
                    const dtEnd = new Date(dueEndValue);
                    if (!Number.isNaN(dtEnd.getTime())) {
                        dueEndValue = formatToDateTimeOffset(dtEnd);
                    }
                }
                formData.append('DueEnd', dueEndValue);
            }
            
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

            // Attachment Files (Actual files)
            if (files && files.length > 0) {
                files.forEach((file) => {
                    formData.append('attachmentFiles', file);
                });
            }

            const data = await apiClient.post<SaveTaskResponse>('/api/Task/Save', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return data;
        } catch (error) {
            console.error('Error saving task:', error);
            throw error;
        }
    }

    async getAllTasks(request: TaskFilterRequest): Promise<GetAllTasksResponse> {
        try {
            const data = await apiClient.post<GetAllTasksResponse>('/api/Task/GetAll', request);
            return data;
        } catch (error) {
            console.error('Error fetching all tasks:', error);
            throw error;
        }
    }

    async getSingleTaskInfo(taskId: number): Promise<GetSingleTaskResponse> {
        try {
            const data = await apiClient.get<GetSingleTaskResponse>(`/api/Task/GetSingle?taskId=${taskId}`);
            return data;
        } catch (error) {
            console.error('Error fetching single task info:', error);
            throw error;
        }
    }

    async getTaskComments(taskId: number): Promise<any> {
        try {
            const data = await apiClient.get<any>(`/api/Task/${taskId}/GetComments`);
            return data;
        } catch (error) {
            console.error('Error fetching task comments:', error);
            throw error;
        }
    }

    async addTaskComment(taskId: number, request: AddTaskCommentRequest): Promise<AddTaskCommentResponse> {
        try {
            const data = await apiClient.post<AddTaskCommentResponse>(`/api/Task/${taskId}/AddComment`, request);
            return data;
        } catch (error) {
            console.error('Error adding task comment:', error);
            throw error;
        }
    }

    async addTaskCommentReply(taskId: number, request: AddTaskCommentReplyRequest): Promise<AddTaskCommentReplyResponse> {
        try {
            const data = await apiClient.post<AddTaskCommentReplyResponse>(`/api/Task/${taskId}/AddCommentReply`, request);
            return data;
        } catch (error) {
            console.error('Error adding task comment reply:', error);
            throw error;
        }
    }

    async reactToTaskComment(taskId: number, request: ReactToTaskCommentRequest): Promise<ReactToTaskCommentResponse> {
        try {
            const data = await apiClient.post<ReactToTaskCommentResponse>(`/api/Task/${taskId}/ReactToComment`, request);
            return data;
        } catch (error) {
            console.error('Error reacting to task comment:', error);
            throw error;
        }
    }

    async deleteTask(taskId: number): Promise<{ success: boolean; message: string }> {
        try {
            const data = await apiClient.post<{ success: boolean; message: string }>('/api/Task/Delete', { taskId });
            return data;
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    }

    async deleteTaskComment(taskId: number, commentId: number): Promise<any> {
        try {
            const data = await apiClient.post<any>(`/api/Task/${taskId}/DeleteComment/${commentId}`, {});
            return data;
        } catch (error) {
            console.error('Error deleting task comment:', error);
            throw error;
        }
    }

    async deleteTaskCommentReply(taskId: number, replyId: number): Promise<any> {
        try {
            const data = await apiClient.post<any>(`/api/Task/${taskId}/DeleteCommentReply/${replyId}`, {});
            return data;
        } catch (error) {
            console.error('Error deleting task comment reply:', error);
            throw error;
        }
    }

    async downloadAttachment(request: DownloadAttachmentRequest): Promise<DownloadAttachmentResponse> {
        try {
            const data = await apiClient.post<DownloadAttachmentResponse>('/api/Common/DownloadAttachment', request);
            return data;
        } catch (error) {
            console.error('Error downloading attachment:', error);
            throw error;
        }
    }

    async downloadTaskAttachment(taskId: number, attachmentId: number): Promise<DownloadAttachmentResponse> {
        try {
            const data = await apiClient.post<DownloadAttachmentResponse>(
                `/api/Task/${taskId}/Attachment/${attachmentId}/Download`,
                {}
            );
            return data;
        } catch (error) {
            console.error('Error downloading task attachment:', error);
            throw error;
        }
    }

    async deleteTaskAttachment(taskId: number, attachmentId: number): Promise<{ success: boolean; message: string }> {
        try {
            const data = await apiClient.post<{ success: boolean; message: string }>(
                `/api/Task/${taskId}/Attachment/${attachmentId}/Delete`,
                {}
            );
            return data;
        } catch (error) {
            console.error('Error deleting task attachment:', error);
            throw error;
        }
    }

    async getTaskHistory(taskId: number): Promise<TaskHistoryResponse> {
        try {
            const data = await apiClient.post<TaskHistoryResponse>('/api/Task/GetHistory', {
                taskId
            });
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch task history');
            }
            return data;
        } catch (error) {
            console.error('Task history error:', error);
            throw error;
        }
    }

    async getProjectGroupMembers(groupId: number): Promise<GetProjectGroupMembersResponse> {
        try {
            const data = await apiClient.get<GetProjectGroupMembersResponse>(`/api/Common/GetProjectGroupMembers?groupId=${groupId}`);
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch group members');
            }
            return data;
        } catch (error) {
            console.error('Fetch group members error:', error);
            throw error;
        }
    }
}

export const taskService = new TaskService();
