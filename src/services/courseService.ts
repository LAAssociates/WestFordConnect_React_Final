import { apiClient } from './apiClient';
import type { GetBrochureInfoRequest, GetBrochureInfoResponse, BrochureBootstrapResponse, GetSingleBrochureInfoResponse, GetCategoriesSideMenuResponse, GetLookupResponse, CreateFileShareRequest, CreateFileShareApiResponse, GetProjectGroupMembersResponse, ShareBrochureRequest, ShareBrochureResponse, BrochureDto } from '../types/courseBrochure';
import type { ApiResponse } from '../types/auth';

class CourseService {
    /**
     * Get details of a single brochure by id (for Edit)
     */
    async getSingleBrochureInfo(brochureId: number | string): Promise<GetSingleBrochureInfoResponse> {
        try {
            const numericId = typeof brochureId === 'string' ? parseInt(brochureId, 10) : brochureId;
            const data = await apiClient.get<GetSingleBrochureInfoResponse>(`/api/Brochure/GetSingle?brochureId=${numericId}`);

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch brochure info');
            }
            return data;
        } catch (error) {
            console.error('Get single brochure info error:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch single brochure info');
        }
    }

    /**
     * Get course brochures/info based on search and filters
     */
    async getBrochureInfo(request: GetBrochureInfoRequest, signal?: AbortSignal): Promise<GetBrochureInfoResponse> {
        try {
            // Ensure categories is never null/undefined for the API
            const safeRequest = {
                ...request,
                categories: request.categories || ['']
            };

            const data = await apiClient.post<GetBrochureInfoResponse>('/api/Brochure/GetAll', safeRequest, { signal });

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch brochure information');
            }

            return data;
        } catch (error) {
            console.error('Get brochure info error:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch brochure information');
        }
    }

    private bootstrapCacheData: BrochureBootstrapResponse | null = null;
    private bootstrapPromise: Promise<BrochureBootstrapResponse> | null = null;

    /**
     * Get bootstrap data for brochure upload (categories, users, groups)
     */
    async getBrochureBootstrap(signal?: AbortSignal, forceRefresh = false): Promise<BrochureBootstrapResponse> {
        if (!forceRefresh && this.bootstrapCacheData) {
            return this.bootstrapCacheData;
        }

        if (!forceRefresh && this.bootstrapPromise) {
            return this.bootstrapPromise;
        }

        this.bootstrapPromise = (async () => {
            try {
                const data = await apiClient.get<BrochureBootstrapResponse>('/api/Brochure/bootstrap/initialload', { signal });

                if (!data.success) {
                    throw new Error(data.message || 'Failed to fetch brochure bootstrap data');
                }

                this.bootstrapCacheData = data;
                return data;
            } catch (error) {
                this.bootstrapPromise = null;
                // Don't log AbortError/CanceledError as they're expected during component unmount
                if (error instanceof Error && error.name !== 'AbortError' && error.name !== 'CanceledError') {
                    console.error('Get brochure bootstrap error:', error);
                }
                throw error instanceof Error ? error : new Error('Failed to fetch brochure bootstrap data');
            }
        })();

        return this.bootstrapPromise;
    }
    /**
     * Upload a new brochure
     */
    async uploadBrochure(formData: FormData): Promise<ApiResponse<{ items: BrochureDto[] }>> {
        try {
            const data = await apiClient.post<ApiResponse<{ items: BrochureDto[] }>>('/api/Brochure/Save', formData);

            if (!data.success) {
                throw new Error(data.message || 'Failed to upload brochure');
            }

            return data;
        } catch (error) {
            console.error('Upload brochure error:', error);
            throw error instanceof Error ? error : new Error('Failed to upload brochure');
        }
    }

    /**
     * Delete a brochure by id
     */
    async deleteBrochure(brochureId: number | string): Promise<ApiResponse<null>> {
        try {
            const numericId = typeof brochureId === 'string' ? parseInt(brochureId, 10) : brochureId;
            const data = await apiClient.post<ApiResponse<null>>(`/api/Brochure/Delete?brochureId=${numericId}`, {});

            if (!data.success) {
                throw new Error(data.message || 'Failed to delete brochure');
            }

            return data;
        } catch (error) {
            console.error('Delete brochure error:', error);
            throw error instanceof Error ? error : new Error('Failed to delete brochure');
        }
    }

    /**
     * Toggle favorite status for a brochure
     */
    async setFavourite(brochureId: number | string, isFavourite: boolean): Promise<ApiResponse<null>> {
        try {
            const numericId = typeof brochureId === 'string' ? parseInt(brochureId, 10) : brochureId;
            const data = await apiClient.post<ApiResponse<null>>('/api/Brochure/ToggleFavourite', {
                entityId: numericId,
                isFavourite: isFavourite
            });

            if (!data.success) {
                throw new Error(data.message || 'Failed to toggle favorite');
            }

            return data;
        } catch (error) {
            console.error('Set favourite error:', error);
            throw error instanceof Error ? error : new Error('Failed to toggle favorite');
        }
    }

    /**
     * Get dynamic categories for side menu
     */
    async getCategoriesSideMenu(): Promise<GetCategoriesSideMenuResponse> {
        try {
            const data = await apiClient.get<GetCategoriesSideMenuResponse>('/api/Brochure/GetCategorySideMenu');

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch categories');
            }

            return data;
        } catch (error) {
            console.error('Get categories side menu error:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch categories');
        }
    }

    /**
     * Get lookup data by type
     */
    async getLookup(type: string): Promise<GetLookupResponse> {
        try {
            const data = await apiClient.get<GetLookupResponse>(`/api/Common/lookup/${type}`);

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch lookup data');
            }

            return data;
        } catch (error) {
            console.error('Get lookup error:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch lookup data');
        }
    }

    /**
     * Create a share link for a brochure
     */
    async createShareLink(request: CreateFileShareRequest): Promise<CreateFileShareApiResponse> {
        try {
            const data = await apiClient.post<CreateFileShareApiResponse>('/api/File/ShareLink', request);

            if (!data.success) {
                throw new Error(data.message || 'Failed to create share link');
            }

            return data;
        } catch (error) {
            console.error('Create share link error:', error);
            throw error instanceof Error ? error : new Error('Failed to create share link');
        }
    }

    /**
     * Get project group members
     */
    async getProjectGroupMembers(groupId: string | number): Promise<GetProjectGroupMembersResponse> {
        try {
            const data = await apiClient.get<GetProjectGroupMembersResponse>(`/api/Common/GetProjectGroupMembers?groupId=${groupId}`);

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch group members');
            }

            return data;
        } catch (error) {
            console.error('Get project group members error:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch group members');
        }
    }

    /**
     * Get download URL for a brochure
     */
    async downloadBrochure(brochureId: number | string): Promise<ApiResponse<{ url: string }>> {
        try {
            const numericId = typeof brochureId === 'string' ? parseInt(brochureId, 10) : brochureId;
            const data = await apiClient.get<ApiResponse<{ url: string }>>(`/api/Brochure/${numericId}/download`);

            if (!data.success) {
                throw new Error(data.message || 'Failed to get download URL');
            }

            return data;
        } catch (error) {
            console.error('Download brochure error:', error);
            throw error instanceof Error ? error : new Error('Failed to get download URL');
        }
    }

    /**
     * Add a new category
     */
    async addCategory(formData: FormData): Promise<ApiResponse<{ categoryId: number; categoryName: string }>> {
        try {
            const data = await apiClient.post<ApiResponse<{ categoryId: number; categoryName: string }>>('/api/Brochure/AddCategory', formData);

            if (!data.success) {
                throw new Error(data.message || 'Failed to add category');
            }

            // Optimistically update bootstrapCache if present
            if (this.bootstrapCacheData && this.bootstrapCacheData.result && data.result) {
                this.bootstrapCacheData.result.categories.push({
                    id: data.result.categoryId,
                    code: data.result.categoryId, // assuming code is same
                    name: data.result.categoryName,
                    colourCode: '', // or data.result.colourCode if added
                    tranxCount: 0
                });
            }

            return data;
        } catch (error) {
            console.error('Add category error:', error);
            throw error instanceof Error ? error : new Error('Failed to add category');
        }
    }

    /**
     * Share a brochure link
     */
    async shareBrochure(request: ShareBrochureRequest): Promise<ShareBrochureResponse> {
        try {
            const data = await apiClient.post<ShareBrochureResponse>('/api/Brochure/ShareLink', request);

            if (!data.success) {
                throw new Error(data.message || 'Failed to share brochure');
            }

            return data;
        } catch (error) {
            console.error('Share brochure error:', error);
            throw error instanceof Error ? error : new Error('Failed to share brochure');
        }
    }
}

export const courseService = new CourseService();
