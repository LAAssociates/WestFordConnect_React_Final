import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/auth';
import type {
    NewsBootstrapResponse,
    GetCategoriesSideMenuResponse,
    SaveNewsResponse,
    NewsRequest,
    GetAllNewsResponse,
    GetNewsFlashResponse,
    NewsItem,
    SetPinnedRequest,
    TogglePinnedRequest,
    TogglePinnedResponse,
    GetPinnedResponse,
    GetDraftsResponse,
    GetSingleNewsResponse,
    AddCategoryResponse
} from '../types/news';

let bootstrapCache: NewsBootstrapResponse | null = null;
let bootstrapPromise: Promise<NewsBootstrapResponse> | null = null;

export const newsService = {
    async getNewsBootstrap(signal?: AbortSignal, forceRefresh = false): Promise<NewsBootstrapResponse> {
        if (!forceRefresh && bootstrapCache) {
            return bootstrapCache;
        }

        if (!forceRefresh && bootstrapPromise) {
            return bootstrapPromise;
        }

        bootstrapPromise = (async () => {
            try {
                const data = await apiClient.get<NewsBootstrapResponse>('/api/News/bootstrap/initialload', { signal });

                if (!data.success) {
                    throw new Error(data.message || 'Failed to fetch news bootstrap data');
                }

                bootstrapCache = data;
                return data;
            } catch (error) {
                bootstrapPromise = null;
                // Don't log AbortError/CanceledError as they're expected during component unmount
                if (error instanceof Error && error.name !== 'AbortError' && error.name !== 'CanceledError') {
                    console.error('Get news bootstrap error:', error);
                }
                throw error instanceof Error ? error : new Error('Failed to fetch news bootstrap data');
            }
        })();

        return bootstrapPromise;
    },

    async getCategoriesSideMenu(signal?: AbortSignal): Promise<GetCategoriesSideMenuResponse> {
        try {
            const data = await apiClient.get<GetCategoriesSideMenuResponse>('/api/News/GetCategorySideMenu', { signal });

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch categories');
            }

            return data;
        } catch (error) {
            // Don't log AbortError/CanceledError as they're expected during component unmount
            if (error instanceof Error && error.name !== 'AbortError' && error.name !== 'CanceledError') {
                console.error('Get categories side menu error:', error);
            }
            throw error instanceof Error ? error : new Error('Failed to fetch categories');
        }
    },

    async saveUploadNews(formData: FormData): Promise<SaveNewsResponse> {
        try {
            const data = await apiClient.post<SaveNewsResponse>('/api/News/Save', formData);

            if (!data.success) {
                throw new Error(data.message || 'Failed to save news');
            }

            return data;
        } catch (error) {
            console.error('Save upload news error:', error);
            throw error instanceof Error ? error : new Error('Failed to save news');
        }
    },

    async getAllNewsInfo(request: NewsRequest, signal?: AbortSignal): Promise<GetAllNewsResponse> {
        try {
            const data = await apiClient.post<GetAllNewsResponse>('/api/News/GetAll', request, { signal });

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch news');
            }

            return data;
        } catch (error) {
            console.error('Get all news info error:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch news');
        }
    },

    async getNewsFlashInfo(dateIso: string, signal?: AbortSignal): Promise<GetNewsFlashResponse> {
        try {
            const data = await apiClient.get<GetNewsFlashResponse>('/api/News/GetNewsFlash', {
                params: { date: dateIso },
                signal,
            });

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch news flash');
            }

            return data;
        } catch (error) {
            console.error('Get news flash error:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch news flash');
        }
    },

    async setPinned(request: SetPinnedRequest): Promise<ApiResponse<null>> {
        try {
            const data = await apiClient.post<ApiResponse<null>>('/api/Common/SetPinned', request);

            if (!data.success) {
                throw new Error(data.message || 'Failed to pin item');
            }

            return data;
        } catch (error) {
            console.error('Set pinned error:', error);
            throw error instanceof Error ? error : new Error('Failed to pin item');
        }
    },

    async getNewsList(status: string, isPinned: boolean, signal?: AbortSignal): Promise<ApiResponse<NewsItem[]>> {
        try {
            const data = await apiClient.get<ApiResponse<NewsItem[]>>(`/api/News/GetNewsList?status=${status}&isPinned=${isPinned}`, { signal });

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch news list');
            }

            return data;
        } catch (error) {
            console.error('Get news list error:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch news list');
        }
    },

    async togglePinned(request: TogglePinnedRequest): Promise<TogglePinnedResponse> {
        try {
            const data = await apiClient.post<TogglePinnedResponse>('/api/News/TogglePinned', request);

            if (!data.success) {
                throw new Error(data.message || 'Failed to toggle pin status');
            }

            return data;
        } catch (error) {
            console.error('Toggle pinned error:', error);
            throw error instanceof Error ? error : new Error('Failed to toggle pin status');
        }
    },

    async getPinned(signal?: AbortSignal): Promise<GetPinnedResponse> {
        try {
            const data = await apiClient.get<GetPinnedResponse>('/api/News/GetPinned', { signal });

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch pinned news');
            }

            return data;
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError' && error.name !== 'CanceledError') {
                console.error('Get pinned news error:', error);
            }
            throw error instanceof Error ? error : new Error('Failed to fetch pinned news');
        }
    },

    async getDrafts(signal?: AbortSignal): Promise<GetDraftsResponse> {
        try {
            const data = await apiClient.get<GetDraftsResponse>('/api/News/GetDrafts', { signal });

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch drafted news');
            }

            return data;
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError' && error.name !== 'CanceledError') {
                console.error('Get drafted news error:', error);
            }
            throw error instanceof Error ? error : new Error('Failed to fetch drafted news');
        }
    },

    async getSingleNews(newsId: number, signal?: AbortSignal): Promise<GetSingleNewsResponse> {
        try {
            const data = await apiClient.get<GetSingleNewsResponse>(`/api/News/GetSingle?NewsId=${newsId}`, { signal });

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch news details');
            }

            return data;
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError' && error.name !== 'CanceledError') {
                console.error('Get single news details error:', error);
            }
            throw error instanceof Error ? error : new Error('Failed to fetch news details');
        }
    },

    async addCategory(formData: FormData): Promise<AddCategoryResponse> {
        try {
            const data = await apiClient.post<AddCategoryResponse>('/api/News/AddCategory', formData, {
                // Let the browser set the boundary in Content-Type header when passing FormData
            });

            if (!data.success) {
                throw new Error(data.message || 'Failed to add category');
            }

            // Optimistically update bootstrap cache if available
            if (bootstrapCache && bootstrapCache.result && bootstrapCache.result.categories) {
                const newCat = data.result as any;
                if (newCat) {
                    bootstrapCache.result.categories.push({
                        id: newCat.categoryId || newCat.id || Date.now(),
                        name: newCat.categoryName || newCat.name || formData.get('CategoryName') as string,
                        code: newCat.code,
                        colourCode: newCat.colourCode
                    });
                }
            }

            return data;
        } catch (error) {
            console.error('Add category error:', error);
            throw error instanceof Error ? error : new Error('Failed to add category');
        }
    }
};
