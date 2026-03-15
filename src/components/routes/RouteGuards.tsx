import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ProtectedRoute - Only allows authenticated users
 * Redirects to /login if not authenticated
 */
export const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#DE4A2C]"></div>
            </div>
        );
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

/**
 * PublicRoute - Only allows unauthenticated users
 * Redirects to /dashboard if already authenticated
 */
export const PublicRoute: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#DE4A2C]"></div>
            </div>
        );
    }

    return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
};
