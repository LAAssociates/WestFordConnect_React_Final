import type { AuthResponse, GoogleAuthResponse, LoginCredentials } from '../types/auth';
import { apiClient } from './apiClient';

class AuthService {
    /**
     * Authenticate user with Google OAuth authorization code
     */
    async loginWithGoogle(code: string): Promise<GoogleAuthResponse> {
        try {
            const data = await apiClient.post<GoogleAuthResponse>('/api/auth/GoogleSignIn', { code });

            if (!data.success) {
                throw new Error(data.message || 'Google authentication failed');
            }

            return data;
        } catch (error) {
            console.error('Google login error:', error);
            throw error instanceof Error ? error : new Error('Failed to authenticate with Google');
        }
    }

    /**
     * Authenticate user with email and password
     */
    async loginWithEmail(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const data = await apiClient.post<AuthResponse>('/api/Auth/NormalLogin', {
                username: credentials.email,
                password: credentials.password,
            });

            if (!data.success) {
                throw new Error(data.message || 'Login failed');
            }

            return data;
        } catch (error) {
            console.error('Email login error:', error);
            const apiMessage = (error as any)?.response?.data?.message;
            const fallbackMessage = error instanceof Error ? error.message : '';
            throw new Error(apiMessage || fallbackMessage || 'Failed to authenticate');
        }
    }

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        try {
            // Call backend to clear HttpOnly cookies
            await apiClient.post('/api/Auth/logout', {});
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local user data
            localStorage.removeItem('user');
        }
    }

    /**
     * Get stored user data
     */
    getUser(): string | null {
        return localStorage.getItem('user');
    }

    /**
     * Store user data
     */
    setUser(user: string): void {
        localStorage.setItem('user', user);
    }
}

export const authService = new AuthService();
