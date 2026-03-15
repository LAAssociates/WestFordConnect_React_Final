import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import InputField from '../../components/forms/InputField';
import PasswordField from '../../components/forms/PasswordField';
import AuthLayout from '../../components/layout/AuthLayout';
import { isFormValid, validateLoginForm } from '../../utils/validation';
import type { FormErrors } from '../../utils/validation';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

type LoginField = 'email' | 'password';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();
    const [values, setValues] = useState<Record<LoginField, string>>({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [apiError, setApiError] = useState<string>('');
    const [touched, setTouched] = useState<Record<LoginField, boolean>>({
        email: false,
        password: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check if Google Client ID is configured
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const isGoogleEnabled = googleClientId && googleClientId !== 'your-google-client-id-here.apps.googleusercontent.com';

    useEffect(() => {
        const redirectedError = searchParams.get('error');

        if (redirectedError) {
            setApiError(redirectedError);
        }
    }, [searchParams]);

    const validateField = (field: LoginField, value: string) => {
        const fieldErrors = validateLoginForm(
            field === 'email' ? value : values.email,
            field === 'password' ? value : values.password
        );

        setErrors(previous => ({
            ...previous,
            [field]: fieldErrors[field]
        }));
    };

    const handleFieldChange = (field: LoginField) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setValues(previous => ({ ...previous, [field]: value }));
        setApiError('');

        if (touched[field]) {
            validateField(field, value);
        }
    };

    const handleBlur = (field: LoginField) => {
        setTouched(previous => ({ ...previous, [field]: true }));
        validateField(field, values[field]);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isSubmitting) return;

        setTouched({ email: true, password: true });

        const formErrors = validateLoginForm(values.email, values.password);
        setErrors(formErrors);
        setApiError('');

        if (!isFormValid(formErrors)) {
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await authService.loginWithEmail({
                email: values.email,
                password: values.password
            });

            login(response.result.user);
            navigate('/dashboard');
        } catch (error) {
            setApiError(error instanceof Error ? error.message : 'Login failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isSubmitDisabled = useMemo(() => {
        // Only disable if there are actual validation errors (not just empty fields initially)
        // or if currently submitting
        return isSubmitting || (Object.keys(errors).length > 0 && Object.values(errors).some(error => error !== undefined));
    }, [errors, isSubmitting]);

    return (
        <AuthLayout
            heading={
                <div className="font-light text-white text-4xl leading-tight sm:text-5xl">
                    <h1 className="text-balance">
                        Login <span className="font-bold">to your</span>
                    </h1>
                    <h1 className="text-balance">Account.</h1>
                </div>
            }
        >
            <form onSubmit={handleSubmit} noValidate>
                <div className="flex flex-col gap-[30px]">
                    <InputField
                        id="email-address"
                        name="email"
                        type="email"
                        label="Email"
                        placeholder="Enter your email"
                        value={values.email}
                        onChange={handleFieldChange('email')}
                        onBlur={() => handleBlur('email')}
                        error={errors.email}
                        touched={touched.email}
                        required
                    />

                    <PasswordField
                        id="password"
                        name="password"
                        label="Password"
                        placeholder="Enter your password"
                        value={values.password}
                        onChange={handleFieldChange('password')}
                        onBlur={() => handleBlur('password')}
                        error={errors.password}
                        touched={touched.password}
                        required
                    />
                </div>

                <div className="mt-3 text-end">
                    <Link
                        to="/forgot-password"
                        className="text-sm font-normal leading-none text-[#6D6D6D] transition-colors hover:text-[#DE4A2C] cursor-pointer"
                    >
                        Forgot your password?
                    </Link>
                </div>

                {apiError && (
                    <p className="mt-4 text-sm text-red-600">{apiError}</p>
                )}

                <button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="cursor-pointer mt-10 block w-full rounded-[25px] bg-[#DE4A2C] py-[6.5px] text-center font-poppins font-semibold text-white transition-colors hover:bg-[#C0392B] disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                    {isSubmitting ? 'Logging in...' : 'Login'}
                </button>

                {/* Google Sign-In Section - Only show if Google is enabled */}
                {isGoogleEnabled && <GoogleLoginButton disabled={isSubmitting} />}
            </form>
        </AuthLayout>
    );
};

export default Login;
