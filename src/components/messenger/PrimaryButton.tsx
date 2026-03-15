import React from 'react';
import { cn } from '../../lib/utils/cn';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  onClick,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full px-[25px] py-2.5 bg-[#008080] text-white rounded-[25px] font-medium leading-none hover:bg-[#008080/80] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2',
        className
      )}
    >
      {iconPosition === 'left' && Icon}
      <span>{children}</span>
      {iconPosition === 'right' && Icon}
    </button>
  );
};

export default PrimaryButton;





