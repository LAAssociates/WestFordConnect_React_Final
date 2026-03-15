import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Loader2, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (categoryName: string, iconFile?: File) => Promise<void>;
  loading?: boolean;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ open, onClose, onSave, loading = false }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [errors, setErrors] = useState<{ name?: string; icon?: string }>({});
  const [iconFile, setIconFile] = useState<File | undefined>(undefined);
  const [iconPreview, setIconPreview] = useState<string | undefined>(undefined);
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setNewCategoryName('');
      setErrors({});
      setIconFile(undefined);
      if (iconPreview) {
        URL.revokeObjectURL(iconPreview);
      }
      setIconPreview(undefined);
    }
  }, [open, iconPreview]);

  const handleSave = () => {
    const newErrors: { name?: string; icon?: string } = {};
    const trimmedName = newCategoryName.trim();

    if (!trimmedName) {
      newErrors.name = 'Category name is required';
    }
    if (!iconFile) {
      newErrors.icon = 'Icon is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSave(trimmedName, iconFile);
    // Do not clear form here - wait for parent to close modal on success
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        // Optionally set an error for invalid file type
        setErrors((prev) => ({ ...prev, icon: 'Only image files are allowed' }));
        return;
      }
      setIconFile(file);
      setErrors((prev) => ({ ...prev, icon: undefined }));

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setIconPreview(previewUrl);
    }
  };



  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        ref={modalRef}
        className="relative w-full max-w-[480px] rounded-[10px] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-[25px] pt-[25px]">
          <div className="flex items-center gap-[5px]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20 13.1429H13.1429V20H10.8571V13.1429H4V10.8571H10.8571V4H13.1429V10.8571H20V13.1429Z" fill="#1E88E5" />
            </svg>
            <h3 className="text-[18px] font-semibold text-black">Add New Category</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-[5px] right-[5px] flex items-center justify-center cursor-pointer"
            aria-label="Close add category modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
              <mask id="mask0_1530_20414" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="22">
                <path d="M11 21C16.523 21 21 16.523 21 11C21 5.477 16.523 1 11 1C5.477 1 1 5.477 1 11C1 16.523 5.477 21 11 21Z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                <path d="M13.8289 8.17188L8.17188 13.8289M8.17188 8.17188L13.8289 13.8289" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </mask>
              <g mask="url(#mask0_1530_20414)">
                <path d="M-1 -1H23V23H-1V-1Z" fill="#232725" />
              </g>
            </svg>
          </button>
        </div>

        <div className="px-[25px] pt-6 pb-6">
          <div className="mb-[10px]">
            <label className="block mb-[5px] text-[15px] font-semibold text-black" htmlFor="new-category-name">
              Category Name<span className="text-red-500">*</span>
            </label>
            <input
              id="new-category-name"
              type="text"
              value={newCategoryName}
              onChange={(event) => {
                setNewCategoryName(event.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g., HR Policies, Course Materials"
              className={cn(
                "w-full h-[38px] rounded-[5px] border px-[10px] py-0 text-[15px] font-normal not-italic leading-normal text-black placeholder:text-[#535352] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40",
                errors.name ? "border-red-500 focus:ring-red-500/40" : "border-[#E6E6E6]"
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // We can't easily trigger submit here if icon is missing, but handleSave checks it.
                  handleSave();
                }
              }}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block mb-[5px] text-[15px] font-semibold text-black" htmlFor="new-category-icon">
              Icon<span className="text-red-500">*</span>
            </label>

            {iconPreview ? (
              <div
                className="flex items-center gap-[10px] rounded-[5px] border border-solid border-[#E6E6E6] p-[10px] cursor-pointer hover:bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <img
                  src={iconPreview}
                  alt="Icon preview"
                  className="w-[40px] h-[40px] object-cover rounded"
                />
                <div className="flex-1">
                  <p className="text-[14px] text-[#111827] font-medium">{iconFile?.name}</p>
                  <p className="text-[12px] text-[#535352]">Click to change icon</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIconFile(undefined);
                    setIconPreview(undefined);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                    setErrors((prev) => ({ ...prev, icon: undefined }));
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="new-category-icon"
                className={cn(
                  "flex items-center gap-[10px] rounded-[5px] border border-solid p-[10px] cursor-pointer hover:bg-gray-50",
                  errors.icon ? "border-red-500 bg-red-50" : "border-[#E6E6E6]"
                )}
              >
                <div className="size-[20px] flex items-center justify-center">
                  <Upload className={cn("w-5 h-5", errors.icon ? "text-red-500" : "text-[#535352]")} />
                </div>
                <span className={cn("text-[14px]", errors.icon ? "text-red-500" : "text-[#535352]")}>
                  Upload File
                </span>
                <input
                  id="new-category-icon"
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </label>
            )}
            {errors.icon && <p className="mt-1 text-sm text-red-500">{errors.icon}</p>}
          </div>
        </div>

        <div className="flex items-center justify-center gap-[10px] px-[25px] pb-[25px]">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-[25px] border border-[#CACACA] px-[15px] py-[10px] w-[130px] text-[14px] font-semibold text-black hover:bg-[#F8FAFC] cursor-pointer whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-[25px] bg-[#DE4A2C] px-[25px] py-[10px] w-[130px] text-[14px] font-semibold text-white hover:bg-[#C62828] transition cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              'Add Category'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddCategoryModal;
