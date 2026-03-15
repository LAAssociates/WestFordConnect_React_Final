import React from 'react';
import { cn } from '../../../../lib/utils/cn';

interface DrawerSwitchProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    id: string;
    hintText?: string;
    icon?: React.ReactNode;
    containerClassName?: string;
}

const DrawerSwitch: React.FC<DrawerSwitchProps> = ({
    label,
    checked,
    onChange,
    id,
    hintText,
    icon,
    containerClassName,
}) => {
    return (
        <div className={cn(containerClassName)}>
            <div className="flex items-center justify-start gap-5">
                <label className="text-[15px] font-semibold text-black">
                    {label}
                </label>
                <button
                    type="button"
                    id={id}
                    onClick={() => onChange(!checked)}
                    className={cn(
                        'relative w-10 h-6 rounded-full transition-colors duration-300 cursor-pointer',
                        checked ? 'bg-[#008080]' : 'bg-gray-300'
                    )}
                    role="switch"
                    aria-checked={checked}
                >
                    <span
                        className={cn(
                            'absolute top-1/2 -translate-y-1/2 left-0 w-3 h-3 bg-white rounded-full transition-transform duration-300',
                            checked ? 'translate-x-5' : 'translate-x-1'
                        )}
                    />
                </button>
            </div>
            {hintText && (
                <div className="flex items-start gap-2 ml-0 mt-2">
                    {icon && <div className="mt-0.5">{icon}</div>}
                    <p className="text-[12px] text-[#535352]">
                        {hintText}
                    </p>
                </div>
            )}
        </div>
    );
};

export default DrawerSwitch;
