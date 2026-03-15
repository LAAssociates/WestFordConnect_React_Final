import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import AddCategoryModal from './AddCategoryModal';

export type CategoryOption = {
  id: string;
  name: string;
  code: string;
};

interface CategoryDropdownProps {
  categories: CategoryOption[];
  selectedCategory?: string;
  onCategoryChange: (categoryId: string) => void;
  onAddCategory?: (categoryName: string, iconFile?: File) => Promise<boolean>;
  placeholder?: string;
  width?: string;
  className?: string;
  disabled?: boolean;
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  onAddCategory,
  placeholder = 'Choose a relevant category',
  width = 'w-full',
  className,
  disabled = false,
}) => {
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const selectedCategoryLabel = useMemo(() => {
    if (!selectedCategory) return '';
    return categories.find((category) => category.id === selectedCategory)?.name ?? '';
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (!categoryMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!categoryDropdownRef.current?.contains(event.target as Node)) {
        setCategoryMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categoryMenuOpen]);

  const handleAddCategory = async (categoryName: string, iconFile?: File) => {
    if (!onAddCategory) return;
    setIsAdding(true);
    try {
      const success = await onAddCategory(categoryName, iconFile);
      if (success) {
        setAddCategoryOpen(false);
        setCategoryMenuOpen(false);
      }
    } catch (error) {
      console.error('Failed to add category:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <div ref={categoryDropdownRef} className={cn('relative', width, className)}>
        <button
          type="button"
          onClick={() => !disabled && setCategoryMenuOpen(prev => !prev)}
          disabled={disabled}
          className={cn(
            'inline-flex items-center justify-between rounded-[5px] border border-[#E6E6E6] px-4 py-2.5 text-sm font-medium text-[#475467] transition',
            width,
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-[#F3F4F6]',
            className
          )}
        >
          <span className={selectedCategoryLabel ? 'text-black' : 'text-[#535352]'}>
            {selectedCategoryLabel || placeholder}
          </span>
          <ChevronDown className="w-4 h-4 text-[#475467]" />
        </button>

        {categoryMenuOpen && (
          <div className="absolute right-0 mt-2 w-full rounded-md border border-[#E2E8F0] bg-white shadow-lg z-10">
            {onAddCategory && (
              <button
                type="button"
                onClick={() => {
                  setCategoryMenuOpen(false);
                  setAddCategoryOpen(true);
                }}
                className="cursor-pointer w-full flex items-center gap-2 px-5 py-3 text-sm font-semibold text-black hover:bg-[#EFF6FF] border-b border-[#E6E6E6]"
              >
                <Plus className="w-4 h-4 text-[#1E88E5] stroke-3" />
                Add New Category
              </button>
            )}
            <div className="max-h-48 overflow-y-auto">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    onCategoryChange(category.id);
                    setCategoryMenuOpen(false);
                  }}
                  className={cn(
                    'cursor-pointer w-full text-left px-5 py-3 text-sm font-semibold hover:bg-[#F1F5F9] border-b border-[#E6E6E6]',
                    category.id === selectedCategory ? 'bg-[#EFF6FF] text-[#1C64F2] font-semibold' : 'text-[#111827]'
                  )}
                  role="option"
                  aria-selected={category.id === selectedCategory}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {onAddCategory && (
        <AddCategoryModal
          open={addCategoryOpen}
          onClose={() => {
            setAddCategoryOpen(false);
          }}
          onSave={handleAddCategory}
          loading={isAdding}
        />
      )}
    </>
  );
};

export default CategoryDropdown;












