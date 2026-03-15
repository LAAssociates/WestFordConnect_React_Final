import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

const GoogleCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState<string>('');
    const hasProcessed = useRef(false);

    const getGoogleAuthSource = (): string =>
        sessionStorage.getItem('googleAuthSource') || '';

    const clearGoogleAuthState = () => {
        sessionStorage.removeItem('googleAuthSource');
        sessionStorage.removeItem('googlePostAuthRedirect');
    };

    const redirectToLoginWithError = (message: string) => {
        setTimeout(() => {
            navigate(`/login?error=${encodeURIComponent(message)}`, { replace: true });
        }, 3000);
    };

    const redirectToCalendarWithError = (message: string) => {
        setTimeout(() => {
            navigate(`/calendar?calendarConnectError=${encodeURIComponent(message)}`, { replace: true });
        }, 3000);
    };

    const redirectAfterError = (message: string) => {
        const authSource = getGoogleAuthSource();
        clearGoogleAuthState();

        if (authSource === 'calendar_connect') {
            redirectToCalendarWithError(message);
            return;
        }

        redirectToLoginWithError(message);
    };

    const redirectAfterSuccess = () => {
        const redirectTarget = sessionStorage.getItem('googlePostAuthRedirect');
        const authSource = getGoogleAuthSource();
        clearGoogleAuthState();

        if (authSource === 'calendar_connect' && redirectTarget) {
            navigate(redirectTarget, { replace: true });
            return;
        }

        navigate('/dashboard');
    };

    const extractErrorMessage = (err: unknown): string => {
        if (err && typeof err === 'object') {
            const apiError = err as {
                response?: {
                    data?: {
                        message?: string;
                        errors?: Array<{ message?: string }>;
                    };
                };
                message?: string;
            };

            const responseMessage = apiError.response?.data?.message;
            if (responseMessage && responseMessage.trim().length > 0) {
                return responseMessage;
            }

            const fieldErrorMessage = apiError.response?.data?.errors?.[0]?.message;
            if (fieldErrorMessage && fieldErrorMessage.trim().length > 0) {
                return fieldErrorMessage;
            }

            if (apiError.message && apiError.message.trim().length > 0) {
                return apiError.message;
            }
        }

        return 'Failed to authenticate with Google.';
    };

    useEffect(() => {
        // Prevent double execution in React.StrictMode
        if (hasProcessed.current) {
            return;
        }

        const handleCallback = async () => {
            hasProcessed.current = true;

            // Get the authorization code from URL
            const code = searchParams.get('code');
            const errorParam = searchParams.get('error');

            if (errorParam) {
                const message = 'Google authentication was cancelled or failed.';
                setError(message);
                redirectAfterError(message);
                return;
            }

            if (!code) {
                const message = 'No authorization code received from Google.';
                setError(message);
                redirectAfterError(message);
                return;
            }

            try {
                // Send the code to your backend API
                const response = await authService.loginWithGoogle(code);

                // Extract data from the result object
                const { user, accessToken } = response.result;

                if (accessToken) {
                    user.accessToken = accessToken;
                }

                // Store user data (tokens are handled by HttpOnly cookies)
                login(user);

                redirectAfterSuccess();
            } catch (err) {
                console.error('Google login failed:', err);
                const message = extractErrorMessage(err);
                setError(message);
                redirectAfterError(message);
            }
        };

        handleCallback();
    }, [searchParams, navigate, login]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
                {error ? (
                    <div className="text-center">
                        <div className="mb-4">
                            <svg
                                className="mx-auto h-12 w-12 text-red-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Authentication Failed
                        </h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <p className="text-sm text-gray-500">Redirecting...</p>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="mb-4">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#DE4A2C]"></div>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Completing Sign In
                        </h2>
                        <p className="text-gray-600">Please wait while we authenticate you...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoogleCallback;
