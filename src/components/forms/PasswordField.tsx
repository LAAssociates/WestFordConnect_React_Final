import React from 'react';
import { EyeOff } from 'lucide-react';

import InputField, { type InputFieldProps } from './InputField';
import EyeIcon from '../../assets/icons/eye.svg';

type PasswordFieldProps = Omit<InputFieldProps, 'type' | 'endAdornment'>;

const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>((props, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);

    const toggleVisibility = () => {
        setIsVisible(previous => !previous);
    };

    return (
        <InputField
            {...props}
            ref={ref}
            type={isVisible ? 'text' : 'password'}
            endAdornment={
                <button
                    type="button"
                    onClick={toggleVisibility}
                    className="cursor-pointer flex h-full items-center justify-center rounded-full p-2 text-[#6D6D6D] transition-colors hover:text-[#DE4A2C]"
                    aria-pressed={isVisible}
                    aria-label={isVisible ? 'Hide password' : 'Show password'}
                >
                    {isVisible ? (
                        <EyeOff className="h-4 w-4" aria-hidden />
                    ) : (
                        <img src={EyeIcon} alt="" className="h-4 w-4" aria-hidden />
                    )}
                    <span className="sr-only">{isVisible ? 'Hide password' : 'Show password'}</span>
                </button>
            }
        />
    );
});

PasswordField.displayName = 'PasswordField';

export default PasswordField;