import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Automatically send cookies with every request
});

// Request queue for handling concurrent requests during refresh
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
}> = [];

// Process queued requests after refresh
const processQueue = (error: any = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve();
        }
    });
    failedQueue = [];
};

// Request interceptor to add global headers
axiosInstance.interceptors.request.use(
    (config) => {
        config.headers['X-User-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling token refresh
axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Don't intercept 401s for the refresh token endpoint or login endpoint
        // to avoid infinite loops/deadlocks if the refresh itself fails or credentials are wrong
        const isAuthRequest = originalRequest.url?.includes('/api/Auth/refresh') ||
            originalRequest.url?.includes('/api/Auth/login') ||
            originalRequest.url?.includes('/api/Auth/NormalLogin') ||
            originalRequest.url?.includes('/api/Auth/GoogleSignIn');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
            if (isRefreshing) {
                // If refresh is already in progress, queue the request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return axiosInstance(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Attempt to refresh the token
                const refreshResponse = await axiosInstance.post('/api/Auth/refresh');

                // Update access_token in local storage if present in response
                const newAccessToken = refreshResponse.data?.result?.accessToken || refreshResponse.data?.accessToken;
                if (newAccessToken) {
                    const userDataStr = localStorage.getItem('user');
                    if (userDataStr) {
                        try {
                            const userData = JSON.parse(userDataStr);
                            userData.accessToken = newAccessToken;
                            localStorage.setItem('user', JSON.stringify(userData));
                            window.dispatchEvent(new CustomEvent('auth:token-refreshed', { detail: { user: userData } }));
                        } catch (e) {
                            console.error('Failed to update access token in local storage:', e);
                        }
                    }
                }

                // If refresh succeeds, process queued requests and retry original request
                processQueue();
                return axiosInstance(originalRequest);

            } catch (refreshError) {
                // If refresh fails, process queue with error and redirect to login
                processQueue(refreshError);

                // Clear local user data and redirect to login
                localStorage.removeItem('user');
                window.location.href = '/login';

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // If it's an auth request that failed with 401, or any other error, just reject
        if (error.response?.status === 401 && isAuthRequest) {
            // If refresh itself failed, clear user and redirect
            if (originalRequest.url?.includes('/api/Auth/refresh')) {
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// Legacy fetch-based client (keeping for backward compatibility)
// NOTE: For new code, use axiosClient instead for automatic token refresh
interface RequestConfig extends RequestInit {
    data?: unknown;
}

export const apiClient = {
    async request<T>(endpoint: string, { data, ...customConfig }: RequestConfig = {}): Promise<T> {
        const isFormData = data instanceof FormData;

        const headers: HeadersInit = {
            'X-User-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            ...customConfig.headers,
        };

        if (!isFormData) {
            (headers as Record<string, string>)['Content-Type'] = 'application/json';
        }

        const config: RequestInit = {
            method: 'GET',
            headers,
            credentials: 'include', // Automatically send cookies with every request
            ...customConfig,
        };

        if (data) {
            config.body = isFormData ? (data as FormData) : JSON.stringify(data);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

            // Handle 401 Unauthorized globally if needed (e.g., redirect to login)
            if (response.status === 401) {
                // Clear local user data on 401s from any endpoint
                localStorage.removeItem('user');
                // Optional: window.location.href = '/login'; 
            }

            // Try to parse JSON, but handle cases where response might be empty
            const responseData = await response.json().catch(() => ({}));

            if (!response.ok) {
                console.error('API Error:', { status: response.status, statusText: response.statusText, data: responseData });
                throw new Error(responseData.message || response.statusText || 'API Request Failed');
            }

            // Return the full typed response
            return responseData as T;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Wrapper methods using axiosClient for automatic token refresh
    // These are the recommended methods for new API calls
    async get<T>(endpoint: string, config?: any): Promise<T> {
        const response = await axiosClient.get<T>(endpoint, config);
        return response.data;
    },

    async post<T>(endpoint: string, data?: unknown, config?: any): Promise<T> {
        const response = await axiosClient.post<T>(endpoint, data, config);
        return response.data;
    },

    async put<T>(endpoint: string, data?: unknown, config?: any): Promise<T> {
        const response = await axiosClient.put<T>(endpoint, data, config);
        return response.data;
    },

    async patch<T>(endpoint: string, data?: unknown, config?: any): Promise<T> {
        const response = await axiosClient.patch<T>(endpoint, data, config);
        return response.data;
    }
};

// Axios-based client with interceptors (recommended for new code)
export const axiosClient = {
    instance: axiosInstance,

    get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
        return axiosInstance.get(url, config);
    },

    post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
        return axiosInstance.post(url, data, config);
    },

    put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
        return axiosInstance.put(url, data, config);
    },

    patch<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
        return axiosInstance.patch(url, data, config);
    },

    delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
        return axiosInstance.delete(url, config);
    },

    // Helper method to make authenticated requests with automatic retry
    async request<T = any>(method: 'get' | 'post' | 'put' | 'patch' | 'delete', url: string, data?: any, config?: any): Promise<T> {
        try {
            let response: AxiosResponse<T>;

            switch (method) {
                case 'get':
                    response = await this.get<T>(url, config);
                    break;
                case 'post':
                    response = await this.post<T>(url, data, config);
                    break;
                case 'put':
                    response = await this.put<T>(url, data, config);
                    break;
                case 'patch':
                    response = await this.patch<T>(url, data, config);
                    break;
                case 'delete':
                    response = await this.delete<T>(url, config);
                    break;
                default:
                    throw new Error(`Unsupported method: ${method}`);
            }

            return response.data;
        } catch (error) {
            console.error('Axios API Error:', error);
            throw error;
        }
    }
};

// Auth helper functions
export const authHelpers = {
    // Check if user has valid authentication (by making a test request)
    async isAuthenticated(): Promise<boolean> {
        try {
            // Make a lightweight request to check authentication
            await axiosInstance.get('/api/Auth/verify', { timeout: 5000 });
            return true;
        } catch (error) {
            return false;
        }
    },

    // Manually trigger token refresh
    async refreshToken(): Promise<void> {
        try {
            await axiosInstance.post('/api/Auth/refresh');
        } catch (error) {
            console.error('Manual token refresh failed:', error);
            throw error;
        }
    },

    // Logout function
    async logout(): Promise<void> {
        try {
            await axiosInstance.post('/api/Auth/logout');
        } catch (error) {
            console.error('Logout request failed:', error);
        } finally {
            // Always clear local storage and redirect
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    }
};
