import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types/auth';
import { authService } from '../services/authService';
import { dashboardService } from '../services/dashboardService';
import { presenceService } from '../services/presenceService';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: User) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing authentication on mount
        const storedUser = authService.getUser();

        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
                // Auto check-in on app open if already logged in
                performAutoCheckIn();
            } catch (error) {
                console.error('Failed to parse stored user:', error);
                authService.logout();
            }
        }
        setIsLoading(false);
    }, []);

    const performAutoCheckIn = async () => {
        window.dispatchEvent(new CustomEvent('check-in:loading', { detail: { isLoading: true } }));
        try {
            // First check if already checked in
            const statusResponse = await dashboardService.getToday();
            let finalTodayInfo = statusResponse.success ? statusResponse.result : null;

            if (statusResponse.success && (!finalTodayInfo || !finalTodayInfo.isCheckedIn)) {
                // Call check-in only if not already checked in
                const checkInResponse = await dashboardService.checkIn();
                if (checkInResponse.success) {
                    finalTodayInfo = checkInResponse.result;
                }
            }

            if (finalTodayInfo) {
                window.dispatchEvent(new CustomEvent('dashboard:today-updated', {
                    detail: finalTodayInfo
                }));

                // If checked in, set presence to Active (2)
                if (finalTodayInfo.isCheckedIn) {
                    await presenceService.setStatus(2);
                    window.dispatchEvent(new CustomEvent('presence:status-updated', {
                        detail: { statusCode: 2 }
                    }));
                }
            }
        } catch (error) {
            console.error('Failed to perform auto check-in:', error);
        } finally {
            window.dispatchEvent(new CustomEvent('check-in:loading', { detail: { isLoading: false } }));
        }
    };

    const login = (userData: User) => {
        authService.setUser(JSON.stringify(userData));
        setUser(userData);
        // Auto check-in on login
        performAutoCheckIn();
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
