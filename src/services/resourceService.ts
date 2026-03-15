import { axiosClient } from './apiClient';
import type { InitialLoadResponse, GetCategorySideMenuResponse, GetAllResourceParams, GetAllResourceResponse, GetSingleResourceResponse, CreateFolderParams, AddCategoryResponse } from '../types/resource';

let bootstrapCache: InitialLoadResponse | null = null;

class ResourceService {
    /**
     * Get initial load data for resources page
     */
    async getInitialLoad(): Promise<InitialLoadResponse> {
        try {
            const response = await axiosClient.get<InitialLoadResponse>('/api/Resource/bootstrap/initialload');
            bootstrapCache = response.data;
            return response.data;
        } catch (error) {
            console.error('Get initial load error:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch initial load data');
        }
    }

    /**
     * Get category side menu for resources page
     */
    async getCategorySideMenu(): Promise<GetCategorySideMenuResponse> {
        try {
            const response = await axiosClient.get<GetCategorySideMenuResponse>('/api/Resource/GetCategorySideMenu');
            return response.data;
        } catch (error) {
            console.error('Get category side menu error:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch category side menu');
        }
    }

    /**
     * Get all resources with pagination and filtering
     */
    async getAllResources(params: GetAllResourceParams): Promise<GetAllResourceResponse> {
        try {
            const response = await axiosClient.post<GetAllResourceResponse>('/api/Resource/GetAll', params);
            return response.data;
        } catch (error) {
            console.error('Get all resources error:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch resources');
        }
    }

    /**
     * Get single resource by ID
     */
    async getSingleResource(resourceId: number): Promise<GetSingleResourceResponse> {
        try {
            const response = await axiosClient.get<GetSingleResourceResponse>(`/api/Resource/GetSingle?resourceId=${resourceId}`);
            return response.data;
        } catch (error) {
            console.error('Get single resource error:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch the resource details');
        }
    }

    /**
     * Download a single resource by ID
     */
    async downloadResource(resourceId: number): Promise<{ success: boolean; message: string; result: { url: string } | null; errors: any }> {
        try {
            const response = await axiosClient.get(`/api/Resource/${resourceId}/download`);
            return response.data;
        } catch (error) {
            console.error('Download resource error:', error);
            throw error instanceof Error ? error : new Error('Failed to download the resource');
        }
    }

    /**
     * Delete a single resource by ID
     */
    async deleteResource(resourceId: number): Promise<{ success: boolean; message: string; result: any; errors: any }> {
        try {
            const response = await axiosClient.post(`/api/Resource/Delete?resourceId=${resourceId}`);
            return response.data;
        } catch (error) {
            console.error('Delete resource error:', error);
            throw error instanceof Error ? error : new Error('Failed to delete the resource');
        }
    }

    /**
     * Save a resource file
     */
    async saveResource(formData: FormData): Promise<{ success: boolean; message: string; result: any; errors: any }> {
        try {
            const response = await axiosClient.post('/api/Resource/File/Save', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error: any) {
            console.error('Save resource error:', error);
            throw error instanceof Error ? error : new Error('Failed to save the resource');
        }
    }

    /**
     * Add a new category
     */
    async addCategory(formData: FormData): Promise<AddCategoryResponse> {
        try {
            const response = await axiosClient.post<AddCategoryResponse>('/api/Resource/AddCategory', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = response.data;
            if (!data.success) {
                throw new Error(data.message || 'Failed to add category');
            }

            // Optimistically update bootstrap cache if available
            if (bootstrapCache && bootstrapCache.result && bootstrapCache.result.categories) {
                const newCat = data.result;
                if (newCat) {
                    bootstrapCache.result.categories.push({
                        id: newCat.categoryId || Date.now(),
                        name: newCat.categoryName || formData.get('CategoryName') as string,
                        code: newCat.categoryId || Date.now(),
                        colourCode: newCat.colourCode || ''
                    });
                }
            }

            return data;
        } catch (error: any) {
            console.error('Add category error:', error);
            throw error instanceof Error ? error : new Error('Failed to add category');
        }
    }

    /**
     * Create a folder
     */
    async createFolder(params: CreateFolderParams): Promise<{ success: boolean; message: string; result: any; errors: any }> {
        try {
            const response = await axiosClient.post('/api/Resource/Folder/Create', params);
            return response.data;
        } catch (error: any) {
            console.error('Create folder error:', error);
            throw error instanceof Error ? error : new Error('Failed to create the folder');
        }
    }
}

export const resourceService = new ResourceService();
