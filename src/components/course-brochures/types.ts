export type BrochureDto = {
  id: string;
  brochureId?: number;
  brochureCode?: string;
  title: string;
  category?: string; // Kept optional for backward compatibility if needed, but API sends categoryDesc
  categoryDesc: string; // New field from API
  categoryId: number; // Changed from optional to required based on API response
  description: string;
  thumbnailUrl: string;
  downloadUrl: string;
  fileKey?: string;
  pageCount?: number;
  isFavorite?: boolean; // Kept for backward compat if needed
  isFavourite: boolean; // Field from API
  publishedDate: string;
};

// Internal model used by UI components
export type Brochure = {
  id: string;
  brochureId?: number; // Numeric ID for API calls
  title: string;
  program: string; // Mapped from category
  categoryId: string; // Mapped from category (sluggified)
  description: string;
  highlights: string[]; // Generated or empty
  link: string; // Mapped from downloadUrl
  fileKey?: string; // For download functionality
  thumbnailUrl?: string; // Thumbnail image URL from API
  audience: string; // Derived or static
  format: string; // Derived
  lastUpdated: string; // Derived from publishedDate
  updatedAt: number; // Derived from publishedDate
  theme: {
    accent: string;
    accentDark: string;
  };
  statusTag?: {
    label: string;
    tone: 'success' | 'info';
  };
  isFavorite: boolean;
  categoryColor?: string;
};

export type FilterCategory = {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  isStatic?: boolean;
};
