import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import InputField from '../../components/forms/InputField';
import AuthLayout from '../../components/layout/AuthLayout';
import { isForgotPasswordFormValid, validateForgotPasswordForm } from '../../utils/validation';
import type { ForgotPasswordErrors } from '../../utils/validation';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<ForgotPasswordErrors>({});
    const [touched, setTouched] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setEmail(value);

        if (touched) {
            setErrors(validateForgotPasswordForm(value));
        }
    };

    const handleBlur = () => {
        setTouched(true);
        setErrors(validateForgotPasswordForm(email));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isSubmitting) return;

        setTouched(true);
        const validationErrors = validateForgotPasswordForm(email);
        setErrors(validationErrors);

        if (isForgotPasswordFormValid(validationErrors)) {
            setIsSubmitting(true);
            // Simulate API call
            setTimeout(() => {
                setIsSubmitted(true);
                setIsSubmitting(false);
                console.log('Password reset email sent to:', email);
            }, 1000);
        }
    };

    const isSubmitDisabled = useMemo(() => {
        // Only disable if there are actual validation errors (not just empty fields initially)
        // or if currently submitting
        return isSubmitting || (Object.keys(errors).length > 0 && Object.values(errors).some(error => error !== undefined));
    }, [errors, isSubmitting]);

    if (isSubmitted) {
        return (
            <AuthLayout
                heading={
                    <div className="font-light text-white text-4xl leading-tight sm:text-5xl">
                        <h1 className="text-balance">
                            Check <span className="font-bold">your</span>
                        </h1>
                        <h1 className="text-balance">Email.</h1>
                    </div>
                }
            >
                <div className="text-center">
                    <div className="mb-8">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="sr-only">Success</span>
                        </div>
                        <h2 className="mb-2 text-2xl font-semibold text-gray-900">Email Sent!</h2>
                        <p className="mb-6 text-gray-600">
                            We've sent a password reset link to <strong>{email}</strong>
                        </p>
                        <p className="mb-8 text-sm text-gray-500">
                            Please check your email and click the link to reset your password. If you don't see the email, check your spam
                            folder.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-[19px]">
                        <Link
                            to="/login"
                            className="flex-1 rounded-full border border-[#DE4A2C] py-[6.5px] text-center text-black transition-colors hover:bg-[#FDEDEC] cursor-pointer"
                        >
                            Back to Login
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                setIsSubmitted(false);
                                setEmail('');
                                setErrors({});
                                setTouched(false);
                            }}
                            className="cursor-pointer flex-1 rounded-[25px] bg-[#DE4A2C] py-[6.5px] text-center font-semibold text-white transition-colors hover:bg-[#C0392B]"
                        >
                            Send Another Email
                        </button>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            heading={
                <div className="font-light text-white text-4xl leading-tight sm:text-5xl">
                    <h1 className="text-balance">
                        Reset <span className="font-bold">your</span>
                    </h1>
                    <h1 className="text-balance">Password.</h1>
                </div>
            }
        >
            <form onSubmit={handleSubmit} noValidate>
                <div className="flex flex-col gap-[30px]">
                    <p className="font-light leading-normal text-[#535352]">
                        Forgot your password?
                        <br />
                        <br />
                        No worries! Please enter the email address associated with your account, and we'll send you a link to reset your
                        password.
                    </p>

                    <InputField
                        id="email-address"
                        name="email"
                        type="email"
                        label="Email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={handleEmailChange}
                        onBlur={handleBlur}
                        error={errors.email}
                        touched={touched}
                        required
                    />
                </div>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-[19px]">
                    <Link
                        to="/login"
                        className="flex-1 rounded-full border border-[#DE4A2C] py-[6.5px] text-center text-black transition-colors hover:bg-[#FDEDEC] cursor-pointer"
                    >
                        Back to Login
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitDisabled}
                        className="cursor-pointer flex-1 rounded-[25px] bg-[#DE4A2C] py-[6.5px] text-center font-semibold text-white transition-colors hover:bg-[#C0392B] disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                        {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
};

export default ForgotPassword;