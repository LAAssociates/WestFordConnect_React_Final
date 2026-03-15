import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Logout: React.FC = () => {
    const { logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = React.useState(true);
    const hasCalledLogout = React.useRef(false);

    useEffect(() => {
        // Prevent double execution in React.StrictMode
        if (hasCalledLogout.current) {
            return;
        }

        const performLogout = async () => {
            hasCalledLogout.current = true;
            await logout();
            setIsLoggingOut(false);
        };
        performLogout();
    }, [logout]);

    if (isLoggingOut) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#DE4A2C]"></div>
            </div>
        );
    }

    return <Navigate to="/login" replace />;
};

export default Logout;
