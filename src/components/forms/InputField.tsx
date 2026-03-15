import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: React.ReactNode;
    error?: string;
    touched?: boolean;
    containerClassName?: string;
    inputClassName?: string;
    helperText?: React.ReactNode;
    endAdornment?: React.ReactNode;
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>((props, ref) => {
    const {
        label,
        name,
        id,
        error,
        touched,
        containerClassName,
        inputClassName,
        className,
        helperText,
        endAdornment,
        ...rest
    } = props;

    const inputId = id ?? name;
    const showError = Boolean(error && touched);

    const inputClasses = twMerge(
        'block w-full rounded-[15px] border py-3 px-5 text-[15px] outline-0 placeholder:text-[#6D6D6D] placeholder:font-normal focus:border-[#DE4A2C]',
        showError ? 'border-red-500 focus:border-red-500' : 'border-[#E6E6E6]',
        endAdornment ? 'pr-12' : '',
        inputClassName,
        className
    );

    return (
        <div className={clsx('flex flex-col gap-[15px]', containerClassName)}>
            <label htmlFor={inputId} className="block text-base font-medium leading-none">
                {label}
            </label>
            <div>
                <div className="relative">
                    <input id={inputId} ref={ref} className={inputClasses} name={name} {...rest} />
                    {endAdornment ? (
                        <div className="absolute inset-y-0 right-0 flex h-full items-center pr-3">
                            {endAdornment}
                        </div>
                    ) : null}
                </div>
                {showError ? <p className="mt-1 text-sm text-red-500">{error}</p> : helperText}
            </div>
        </div>
    );
});

InputField.displayName = 'InputField';

export default InputField;