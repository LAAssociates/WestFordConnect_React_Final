// Validation utility functions for form inputs

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export type FormErrors = {
  email?: string;
  password?: string;
};

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, message: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }

  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }

  return { isValid: true };
};


// Validate entire login form
export const validateLoginForm = (email: string, password: string): FormErrors => {
  const errors: FormErrors = {};

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
  }

  return errors;
};

// Check if form is valid
export const isFormValid = (errors: FormErrors): boolean => {
  return !errors.email && !errors.password;
};

// Forgot password validation types
export type ForgotPasswordErrors = {
  email?: string;
};

// Validate forgot password form (email only)
export const validateForgotPasswordForm = (email: string): ForgotPasswordErrors => {
  const errors: ForgotPasswordErrors = {};

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
  }

  return errors;
};

// Check if forgot password form is valid
export const isForgotPasswordFormValid = (errors: ForgotPasswordErrors): boolean => {
  return !errors.email;
};
