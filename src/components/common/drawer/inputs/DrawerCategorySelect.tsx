import React from 'react';
import CategoryDropdown, { type CategoryOption } from '../../CategoryDropdown';
import { cn } from '../../../../lib/utils/cn';

interface DrawerCategorySelectProps {
    label: string;
    required?: boolean;
    categories: CategoryOption[];
    selectedCategory?: string;
    onCategoryChange: (categoryId: string) => void;
    onAddCategory?: (categoryName: string, iconFile?: File) => Promise<boolean>;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    containerClassName?: string;
}

const DrawerCategorySelect: React.FC<DrawerCategorySelectProps> = ({
    label,
    required,
    categories,
    selectedCategory,
    onCategoryChange,
    onAddCategory,
    placeholder,
    disabled,
    error,
    containerClassName,
}) => {
    return (
        <div className={cn("flex items-start justify-between mb-6", containerClassName)}>
            <label className="text-[15px] font-semibold text-black mt-3">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex flex-col">
                <CategoryDropdown
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onCategoryChange={onCategoryChange}
                    onAddCategory={onAddCategory}
                    placeholder={placeholder}
                    width="w-[419px]"
                    disabled={disabled}
                />
                {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
            </div>
        </div>
    );
};

export default DrawerCategorySelect;
