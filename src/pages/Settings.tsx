import React, { useState, useMemo } from 'react';
import PasswordField from '../components/forms/PasswordField';
import ResetPasswordConfirmationModal from '../components/settings/ResetPasswordConfirmationModal';
import PasswordUpdatedSuccessModal from '../components/settings/PasswordUpdatedSuccessModal';

type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

type PasswordErrors = {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
};

const Settings: React.FC = () => {
    const [values, setValues] = useState<Record<PasswordField, string>>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<PasswordErrors>({});
    const [touched, setTouched] = useState<Record<PasswordField, boolean>>({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [logoutAllDevices, setLogoutAllDevices] = useState(false);

    const validateField = (field: PasswordField, value: string) => {
        const fieldErrors: PasswordErrors = {};

        if (field === 'currentPassword') {
            if (!value.trim()) {
                fieldErrors.currentPassword = 'Current password is required';
            }
        }

        if (field === 'newPassword') {
            if (!value.trim()) {
                fieldErrors.newPassword = 'New password is required';
            } else if (value.length < 6) {
                fieldErrors.newPassword = 'Password must be at least 6 characters long';
            } else if (value === values.currentPassword) {
                fieldErrors.newPassword = 'New password must be different from current password';
            }
        }

        if (field === 'confirmPassword') {
            if (!value.trim()) {
                fieldErrors.confirmPassword = 'Please confirm your new password';
            } else if (value !== values.newPassword) {
                fieldErrors.confirmPassword = 'Passwords do not match';
            }
        }

        setErrors(previous => ({
            ...previous,
            ...fieldErrors
        }));
    };

    const handleFieldChange = (field: PasswordField) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setValues(previous => ({ ...previous, [field]: value }));

        if (touched[field]) {
            validateField(field, value);
        }

        // Also validate confirmPassword when newPassword changes
        if (field === 'newPassword' && touched.confirmPassword) {
            validateField('confirmPassword', values.confirmPassword);
        }
    };

    const handleBlur = (field: PasswordField) => {
        setTouched(previous => ({ ...previous, [field]: true }));
        validateField(field, values[field]);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isSubmitting) return;

        setTouched({
            currentPassword: true,
            newPassword: true,
            confirmPassword: true
        });

        const formErrors: PasswordErrors = {};

        if (!values.currentPassword.trim()) {
            formErrors.currentPassword = 'Current password is required';
        }

        if (!values.newPassword.trim()) {
            formErrors.newPassword = 'New password is required';
        } else if (values.newPassword.length < 6) {
            formErrors.newPassword = 'Password must be at least 6 characters long';
        } else if (values.newPassword === values.currentPassword) {
            formErrors.newPassword = 'New password must be different from current password';
        }

        if (!values.confirmPassword.trim()) {
            formErrors.confirmPassword = 'Please confirm your new password';
        } else if (values.confirmPassword !== values.newPassword) {
            formErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(formErrors);

        const isFormValid = !formErrors.currentPassword && !formErrors.newPassword && !formErrors.confirmPassword;

        if (isFormValid) {
            // Show confirmation modal instead of submitting directly
            setShowConfirmationModal(true);
        }
    };

    const handleConfirmReset = (logoutAllDevices: boolean) => {
        setLogoutAllDevices(logoutAllDevices);
        setShowConfirmationModal(false);
        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            console.log('Password reset submitted:', {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
                logoutAllDevices
            });
            setIsSubmitting(false);

            // Show success modal
            setShowSuccessModal(true);

            // Reset form
            setValues({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setTouched({
                currentPassword: false,
                newPassword: false,
                confirmPassword: false
            });
            setErrors({});
        }, 1000);
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        setLogoutAllDevices(false);
    };

    const handleCancel = () => {
        setValues({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setTouched({
            currentPassword: false,
            newPassword: false,
            confirmPassword: false
        });
        setErrors({});
    };

    const isSubmitDisabled = useMemo(() => {
        return isSubmitting || (Object.keys(errors).length > 0 && Object.values(errors).some(error => error !== undefined));
    }, [errors, isSubmitting]);

    return (
        <div className="h-full overflow-y-auto bg-white rounded-[10px] p-[15px]">
            <div className="bg-white rounded-[10px] border-2 border-[#E6E6E6] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.1)] p-[30px]">
                <form onSubmit={handleSubmit} noValidate>
                    {/* Reset Password Section Title */}
                    <div className="flex items-center gap-2.5 mb-6">
                        <div className="w-1 h-5 rounded-full bg-[#1E88E5]"></div>
                        <h2 className="text-lg font-normal">Reset Password</h2>
                    </div>

                    {/* Form Fields */}
                    <div className="flex flex-col gap-[30px]">
                        {/* Current Password - Full Width */}
                        <div className="md:max-w-[360px]">
                            <PasswordField
                                id="current-password"
                                name="currentPassword"
                                label={
                                    <>
                                        Current Password<span className="text-[#F00]">*</span>
                                    </>
                                }
                                placeholder="Enter your Current Password"
                                value={values.currentPassword}
                                onChange={handleFieldChange('currentPassword')}
                                onBlur={() => handleBlur('currentPassword')}
                                error={errors.currentPassword}
                                touched={touched.currentPassword}
                                required
                                className="rounded-[5px]"
                            />
                        </div>

                        {/* New Password and Confirm Password - Side by Side */}
                        <div className="flex flex-col md:flex-row gap-[94px]">
                            <div className="flex-1 md:max-w-[360px]">
                                <PasswordField
                                    id="new-password"
                                    name="newPassword"
                                    label={
                                        <>
                                            New Password<span className="text-[#F00]">*</span>
                                        </>
                                    }
                                    placeholder="Enter your New Password"
                                    value={values.newPassword}
                                    onChange={handleFieldChange('newPassword')}
                                    onBlur={() => handleBlur('newPassword')}
                                    error={errors.newPassword}
                                    touched={touched.newPassword}
                                    required
                                    className="rounded-[5px]"
                                />
                            </div>

                            <div className="flex-1 md:max-w-[360px]">
                                <PasswordField
                                    id="confirm-password"
                                    name="confirmPassword"
                                    label={
                                        <>
                                            Confirm New Password<span className="text-[#F00]">*</span>
                                        </>
                                    }
                                    placeholder="Re-enter your New Password"
                                    value={values.confirmPassword}
                                    onChange={handleFieldChange('confirmPassword')}
                                    onBlur={() => handleBlur('confirmPassword')}
                                    error={errors.confirmPassword}
                                    touched={touched.confirmPassword}
                                    required
                                    className="rounded-[5px]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-5 mt-8">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="cursor-pointer inline-flex items-center justify-center rounded-full border border-[#CACACA] px-[25px] py-[10px] text-sm leading-normal font-semibold text-black hover:bg-[#F3F4F6] transition min-w-[130px]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitDisabled}
                            className="cursor-pointer inline-flex items-center justify-center rounded-full bg-[#DE4A2C] px-[30px] py-[10px] text-sm leading-normal font-semibold text-white hover:bg-[#C62828] transition disabled:bg-gray-400 disabled:cursor-not-allowed min-w-[169px]"
                        >
                            {isSubmitting ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Modals */}
            <ResetPasswordConfirmationModal
                isOpen={showConfirmationModal}
                onClose={() => setShowConfirmationModal(false)}
                onConfirm={handleConfirmReset}
            />

            <PasswordUpdatedSuccessModal
                isOpen={showSuccessModal}
                onClose={handleSuccessModalClose}
                logoutAllDevices={logoutAllDevices}
            />
        </div>
    );
};

export default Settings;

