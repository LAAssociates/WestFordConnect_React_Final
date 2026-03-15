import {
  Search, Upload, Loader2
} from 'lucide-react';
import React from 'react';
import { useOutletContext } from 'react-router-dom';

import BrochureCard from '../components/course-brochures/BrochureCard';
import CustomToast from '../components/common/CustomToast';
import DeleteConfirmationModal from '../components/course-brochures/DeleteConfirmationModal';
import FilterSidebar, { type FilterSection } from '../components/course-brochures/FilterSidebar';
import ShareBrochureModal from '../components/course-brochures/ShareBrochureModal';
import SortPopover, { type SortOption } from '../components/common/SortPopover';
import SortIcon from '../assets/icons/brochures/sort.svg';
import type { Brochure } from '../components/course-brochures/types';
import UploadBrochureDrawer from '../components/course-brochures/UploadBrochureDrawer';
import BrochureSkeleton from '../components/course-brochures/BrochureSkeleton';
import type { AppLayoutContext } from '../components/layout/AppLayout';
import { cn } from '../lib/utils/cn';
import { courseService } from '../services/courseService';
import type { BrochureBootstrapResult, CategoryMenuItem, BrochureDto } from '../types/courseBrochure';

const PAGE_SIZE = 5;

// Helper to map DTO to internal Brochure model
const mapBrochureDtoToModel = (dto: BrochureDto, categoryColors: Record<string, string> = {}): Brochure => {
  const publishedDate = new Date(dto.publishedDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - publishedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let lastUpdated = '';
  if (diffDays === 0) lastUpdated = 'Today';
  else if (diffDays === 1) lastUpdated = 'Yesterday';
  else if (diffDays < 7) lastUpdated = `${diffDays} days ago`;
  else if (diffDays < 30) lastUpdated = `${Math.floor(diffDays / 7)} weeks ago`;
  else lastUpdated = `${Math.floor(diffDays / 30)} months ago`;

  // Deterministic color assignment based on title length
  const colors = [
    { accent: '#f97316', accentDark: '#c2410c' }, // Orange
    { accent: '#8b5cf6', accentDark: '#6d28d9' }, // Violet
    { accent: '#22c55e', accentDark: '#15803d' }, // Green
    { accent: '#0ea5e9', accentDark: '#0369a1' }, // Blue
  ];
  const colorIndex = dto.title.length % colors.length;

  return {
    id: dto.id,
    brochureId: dto.brochureId || parseInt(dto.id, 10),
    title: dto.title,
    program: dto.categoryDesc || dto.category || '',
    categoryId: (dto.categoryDesc || dto.category || '').toLowerCase().replace(/\s+/g, '-'),
    description: dto.description || '',
    highlights: [], // API doesn't provide highlights yet
    link: dto.downloadUrl,
    fileKey: dto.fileKey,
    thumbnailUrl: dto.thumbnailUrl, // Use actual thumbnail URL from API
    audience: 'All Students', // API doesn't provide audience yet
    format: 'pdf', // Assuming default format
    lastUpdated: lastUpdated,
    updatedAt: publishedDate.getTime(),
    theme: colors[colorIndex],
    isFavorite: dto.isFavourite || dto.isFavorite || false,
    categoryColor: categoryColors[dto.categoryDesc || dto.category || ''],
    // Add status tag only for very new items
    statusTag: diffDays < 14 ? { label: 'New', tone: 'success' } : undefined
  };
};

const CourseBrochures: React.FC = () => {
  const [drawerMode, setDrawerMode] = React.useState<'upload' | 'edit'>('upload');
  const [editBrochureId, setEditBrochureId] = React.useState<string | undefined>(undefined);
  const [drawerReadonly, setDrawerReadonly] = React.useState(false);
  const [filterSections, setFilterSections] = React.useState<FilterSection[]>([]);
  const [sortOptions, setSortOptions] = React.useState<SortOption[]>([]);
  const [sortOptionsLoading, setSortOptionsLoading] = React.useState(true);
  const [bootstrapData, setBootstrapData] = React.useState<BrochureBootstrapResult | null>(null);
  const [isBootstrapLoaded, setIsBootstrapLoaded] = React.useState(false);
  const [categoriesLoading, setCategoriesLoading] = React.useState(true);
  const dataFetchedRef = React.useRef(false);

  const { setPageTitle } = useOutletContext<AppLayoutContext>();
  const [brochures, setBrochures] = React.useState<Brochure[]>([]);
  const [activeFilter, setActiveFilter] = React.useState('all'); // Default to 'all' or specific ID if needed
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState('NF'); // Default to Newest First
  const [shareTarget, setShareTarget] = React.useState<Brochure | null>(null);
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [toastTitle, setToastTitle] = React.useState('');
  const [toastMessage, setToastMessage] = React.useState('');
  const [toastIconType, setToastIconType] = React.useState<'check' | 'save' | 'reminder-unset' | 'reminder-set'>('check');
  const [toastType, setToastType] = React.useState<'success' | 'error'>('success');
  const [isSortOpen, setIsSortOpen] = React.useState(false);
  const sortButtonRef = React.useRef<HTMLButtonElement>(null);

  // Pagination State
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [loadingInitial, setLoadingInitial] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const categoryColorsRef = React.useRef<Record<string, string>>({});

  React.useEffect(() => {
    setPageTitle('Course Brochures');
  }, [setPageTitle]);

  // Reset pagination when filters change
  React.useEffect(() => {
    setPage(1);
    setHasMore(true);
    setBrochures([]);
    setLoadingInitial(true);
  }, [activeFilter, searchTerm]);

  // Combined Initial Data Loading
  const initPageData = React.useCallback(async (force?: boolean) => {
    if (dataFetchedRef.current && !force) return;
    dataFetchedRef.current = true;

    try {
      setCategoriesLoading(true);

      const [sidebarResponse, bootstrapResponse] = await Promise.all([
        courseService.getCategoriesSideMenu(),
        courseService.getBrochureBootstrap(undefined, force)
      ]);

      // 1. Process Sidebar Data
      if (sidebarResponse.success && sidebarResponse.result) {
        const categories = sidebarResponse.result.map((item: CategoryMenuItem) => {
          // Use categoryCode as the ID for filtering as per requirement
          let id = item.categoryCode.toString();

          return {
            id,
            label: item.categoryName,
            icon: item.iconUrl ? <img src={item.iconUrl} alt="" className="w-5 h-5 object-contain" /> : null,
            isStatic: false,
            count: item.tranxCount,
            // Store original ID to identify specific items if needed (like "All")
            _originalId: item.categoryId
          };
        });

        // Extract colors
        const colors: Record<string, string> = {};
        sidebarResponse.result.forEach((item: CategoryMenuItem) => {
          if (item.categoryName && item.colourCode) {
            colors[item.categoryName] = item.colourCode;
          }
        });
        categoryColorsRef.current = colors;

        setFilterSections([{
          id: 'categories',
          title: '',
          categories: categories
        }]);

        // Set active filter to "All" if present (assuming ID 1 is All based on previous context)
        // or just default to the first available category if not set
        const allCategory = categories.find(c => c._originalId === 1);
        if (allCategory) {
          setActiveFilter(allCategory.id);
        } else if (categories.length > 0) {
          setActiveFilter(categories[0].id);
        }
      }

      // 2. Process Bootstrap Data
      if (bootstrapResponse.success && bootstrapResponse.result) {
        setBootstrapData(bootstrapResponse.result);

        if (bootstrapResponse.result.sortBy) {
          const dynamicSort = bootstrapResponse.result.sortBy.map((item) => ({
            value: item.code.toString(),
            label: item.description
          }));
          setSortOptions(dynamicSort);
          if (dynamicSort.length > 0 && sortBy === 'NF') {
            setSortBy(dynamicSort[0].value);
          }
        }
        setSortOptionsLoading(false);
      }

      setIsBootstrapLoaded(true);
    } catch (error) {
      setError('Failed to load initial data.');
    } finally {
      setCategoriesLoading(false);
    }
  }, [sortBy]);

  const refreshCategories = React.useCallback(async () => {
    try {
      const sidebarResponse = await courseService.getCategoriesSideMenu();
      if (sidebarResponse.success && sidebarResponse.result) {
        const categories = sidebarResponse.result.map((item: CategoryMenuItem) => {
          let id = item.categoryCode.toString();
          return {
            id,
            label: item.categoryName,
            icon: item.iconUrl ? <img src={item.iconUrl} alt="" className="w-5 h-5 object-contain" /> : null,
            isStatic: false,
            count: item.tranxCount,
            _originalId: item.categoryId
          };
        });

        const colors: Record<string, string> = {};
        sidebarResponse.result.forEach((item: CategoryMenuItem) => {
          if (item.categoryName && item.colourCode) {
            colors[item.categoryName] = item.colourCode;
          }
        });
        categoryColorsRef.current = colors;

        setFilterSections([{
          id: 'categories',
          title: '',
          categories: categories
        }]);
      }
    } catch (error) {
      console.error('Failed to refresh categories:', error);
    }
  }, []);

  // Updated fetchBrochures to accept optional categoryIds override
  const fetchBrochures = React.useCallback(async (pageToFetch: number, signal?: AbortSignal, overrideCategoryIds?: string[]) => {
    // Determine which loading state to set based on page
    if (pageToFetch === 1) {
      setLoadingInitial(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    // Wait for bootstrap data before fetching brochures
    if (!isBootstrapLoaded && pageToFetch === 1 && !overrideCategoryIds) {
      // If logic allows, we can just return or wait. 
      // With the new flow, fetchBrochures shouldn't be called until isBootstrapLoaded is true anyway 
      // due to the effect dependency, but good to have a guard.
      setLoadingInitial(true); // Keep loading state
      return;
    }

    try {
      let categories: string[] = [''];

      if (overrideCategoryIds) {
        categories = overrideCategoryIds;
      } else {
        // Use activeFilter directly as it now holds the categoryCode
        categories = activeFilter ? [activeFilter] : [];
      }


      const response = await courseService.getBrochureInfo({
        pageNumber: pageToFetch,
        pageSize: PAGE_SIZE, // Smaller page size for infinite scroll
        searchQuery: searchTerm || null,
        categories: categories,
        userId: 1,
        sortBy: sortBy || null
      }, signal);

      const fetchedItems = response.result.items || [];
      const totalCount = response.result.totalCount;

      const mappedBrochures = fetchedItems.map(item => mapBrochureDtoToModel(item, categoryColorsRef.current));

      setBrochures(prev => {
        if (pageToFetch === 1) {
          return mappedBrochures;
        }
        return [...prev, ...mappedBrochures];
      });

      // Update hasMore based on total count
      // If we have fetched less than total, there are more
      setHasMore(() => {
        // This simple check works if valid totalCount is returned
        // Or we can check if returned items < pageSize
        return (pageToFetch * PAGE_SIZE) < totalCount && fetchedItems.length > 0;
      });

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      // Only set error if it's the initial load
      if (pageToFetch === 1) setError('Failed to load brochures. Please try again.');
    } finally {
      if (!signal?.aborted) {
        setLoadingInitial(false);
        setLoadingMore(false);
      }
    }
  }, [activeFilter, searchTerm, sortBy, isBootstrapLoaded]);

  // 1. Search/Filter Effect (Debounced) - Reset to page 1
  React.useEffect(() => {
    const controller = new AbortController();

    // Only debounce if there is a search term, strict filter changes can be immediate or debounced. 
    // Consistent UX: Debounce everything that resets the view.
    const timer = setTimeout(() => {
      // If raw initial load (no categories), don't fetch yet, wait for bootstrap
      // We can check if filters are loaded. 
      const hasDynamic = filterSections.some(s => s.categories.some(c => !c.isStatic));
      // If filters are loaded or we have active filter...
      if (hasDynamic || activeFilter) {
        setPage(1);
        fetchBrochures(1, controller.signal);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm, activeFilter, sortBy, fetchBrochures, isBootstrapLoaded]);

  // 2. Pagination Effect (Immediate) - Load more pages
  React.useEffect(() => {
    const controller = new AbortController();

    // Only trigger for pages > 1. Page 1 is handled by the search/filter effect (or bootstrap).
    if (page > 1) {
      fetchBrochures(page, controller.signal);
    }

    return () => controller.abort();
  }, [page, fetchBrochures]);

  // Load dynamic categories and sort options on mount
  React.useEffect(() => {
    initPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    // Triggers when 50px near bottom
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (!loadingMore && !loadingInitial && hasMore) {
        setPage(prev => prev + 1);
      }
    }
  }, [loadingMore, loadingInitial, hasMore]);

  const visibleBrochures = React.useMemo(() => {
    // Sorting is now done server-side via API
    return brochures;
  }, [brochures]);

  const handleToggleFavorite = React.useCallback(async (id: string) => {
    try {
      // Find the brochure to get the brochureId
      const brochure = brochures.find(b => b.id === id);
      if (!brochure) return;

      // Optimistically update UI first
      setBrochures((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
              ...item,
              isFavorite: !item.isFavorite,
            }
            : item
        )
      );

      // Call API to set favorite using brochureId
      // Pass the new favorite state (toggled from current state)
      await courseService.setFavourite(brochure.brochureId || id, !brochure.isFavorite);

    } catch (error) {
      // Revert optimistic update on error
      setBrochures((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
              ...item,
              isFavorite: !item.isFavorite,
            }
            : item
        )
      );

      setToastTitle('Error');
      setToastMessage('Failed to toggle favorite. Please try again.');
      setToastIconType('save');
      setToastType('error');
      setShowToast(true);
    }
  }, [brochures]);

  const handleCopyLink = React.useCallback((link: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(link).catch(() => {
        // fallback is not essential for mock data
      });
    }

    setToastTitle('Link Copied');
    setToastMessage('The link to the Brochure has been successfully copied! Share it with others to explore the program details.');
    setToastIconType('check');
    setToastType('success');
    setShowToast(true);
  }, []);

  const handleDeleteBrochure = React.useCallback(async (brochureId: string) => {
    setIsDeleting(true);
    try {
      await courseService.deleteBrochure(brochureId);

      // Refresh the entire list after successful deletion
      setPage(1);
      setHasMore(true);
      setBrochures([]);
      setLoadingInitial(true);

      // Fetch the first page
      fetchBrochures(1);

      setDeleteTargetId(null);
      setToastTitle('Brochure Deleted');
      setToastMessage('The brochure has been successfully deleted.');
      setToastIconType('check');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      setToastTitle('Error');
      setToastMessage('Failed to delete brochure. Please try again.');
      setToastIconType('save');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsDeleting(false);
    }
  }, [fetchBrochures]);

  const handleRefreshList = React.useCallback((type?: 'FULL' | 'SIDEBAR_ONLY', data?: BrochureDto[]) => {
    if (type === 'SIDEBAR_ONLY') {
      refreshCategories(); // Only reload sidebar categories without full bootstrap or brochure refetch
      return;
    }

    if (data && data.length > 0) {
      const mappedNewBrochures = data.map(item => mapBrochureDtoToModel(item, categoryColorsRef.current));

      setBrochures(prev => {
        const existingIds = prev.map(p => p.id);
        const toAdd = mappedNewBrochures.filter(mb => !existingIds.includes(mb.id));
        const toUpdate = mappedNewBrochures.filter(mb => existingIds.includes(mb.id));

        let newList = [...prev];

        toUpdate.forEach(u => {
          newList = newList.map(item => item.id === u.id ? u : item);
        });

        return [...toAdd, ...newList];
      });
      return;
    }

    // Refresh the entire list after successful save/update (for full updates) - Fallback
    // We don't call initPageData(true) here to avoid double API calls and redundant sidebar refreshes
    setPage(1);
    setHasMore(true);
    setBrochures([]);
    setLoadingInitial(true);
    fetchBrochures(1);
  }, [fetchBrochures, refreshCategories]);


  return (
    <div className='h-full'>
      <div className="flex w-full flex-col overflow-hidden rounded-[10px] bg-white h-full lg:w-[calc(100dvw-91px)] shadow-[2px_2px_4px_0_rgba(0,0,0,0.10)]">
        <div className="border-b border-[#E6E6E6] px-4 py-4 sm:px-5 lg:py-[15px]">
          <div className="flex flex-row gap-3 sm:items-center sm:justify-between lg:justify-center lg:flex-row lg:gap-[15px]">
            <div className="relative max-lg:flex-1 lg:w-[399px]">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Find a brochure by title or keyword..."
                className="w-full rounded-full border border-[#CACACA] bg-[#E6E6E6] py-3 pl-14 pr-4 text-sm text-[#111827] placeholder:text-black outline-none lg:w-[399px]"
              />
            </div>
            <div className="flex items-center justify-end sm:justify-center sm:gap-2 lg:justify-end">
              <button
                ref={sortButtonRef}
                type="button"
                onClick={() => !sortOptionsLoading && setIsSortOpen((prev) => !prev)}
                disabled={sortOptionsLoading}
                className="inline-flex items-center gap-2 rounded-full hover:bg-[#F3F4F6] transition cursor-pointer my-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sortOptionsLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <img src={SortIcon} alt="Sort Icon" className="w-8 h-8" />
                )}
              </button>
              <SortPopover
                isOpen={isSortOpen}
                onClose={() => setIsSortOpen(false)}
                triggerRef={sortButtonRef}
                selectedSort={sortBy}
                onSortChange={setSortBy}
                sortOptions={sortOptions}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col lg:flex-row lg:items-start">
          <div className="border-b border-[#E6E6E6] lg:w-[280px] lg:flex-shrink-0 lg:border-b-0 lg:border-r-2">
            <div className="border-b border-[#E6E6E6] px-4 py-4 lg:border-b lg:px-5 lg:py-6">
              <button
                type="button"
                onClick={() => {
                  setDrawerMode('upload');
                  setEditBrochureId(undefined);
                  setDrawerOpen(true);
                }}
                className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#008080] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B5F59]"
              >
                <Upload className="h-4 w-4" />
                Upload Brochure
              </button>
            </div>
            <FilterSidebar
              sections={filterSections}
              activeCategory={activeFilter}
              onSelect={setActiveFilter}
              loading={categoriesLoading}
            />
          </div>
          <div
            className="flex-1 overflow-y-auto p-4 sm:p-5 lg:h-[calc(100dvh-171px)] lg:p-[15px]"
            onScroll={handleScroll}
          >
            {loadingInitial ? (
              <div className="flex flex-col">
                {[1, 2, 3, 4].map((i) => (
                  <BrochureSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center text-red-500">
                <p>{error}</p>
              </div>
            ) : visibleBrochures.length > 0 ? (
              <>
                {visibleBrochures.map((brochure) => (
                  <BrochureCard
                    key={brochure.id}
                    brochure={brochure}
                    onShare={setShareTarget}
                    onToggleFavorite={handleToggleFavorite}
                    onEdit={(id, mode = 'edit') => {
                      setDrawerMode(mode === 'view' ? 'edit' : mode);
                      setEditBrochureId(id);
                      setDrawerReadonly(mode === 'view');
                      setDrawerOpen(true);
                    }}
                    onDelete={(id) => {
                      setDeleteTargetId(id);
                    }}
                    onError={(message) => {
                      setToastTitle('Error');
                      setToastMessage(message);
                      setToastIconType('save');
                      setToastType('error');
                      setShowToast(true);
                    }}
                    searchTerm={searchTerm}
                  />
                ))}
                {loadingMore && (
                  <div className="py-4">
                    <BrochureSkeleton />
                  </div>
                )}
              </>
            ) : (

              <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center sm:p-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F1F5F9]">
                  <Search className="h-7 w-7 text-[#94A3B8]" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-[#111827]">No brochures found</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-[#6B7280]">
                  Try adjusting your filters or search terms. You can also upload a new brochure to keep the library fresh.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const categories = filterSections[0]?.categories || [];
                    const firstCategory = categories[0];
                    if (firstCategory) {
                      setActiveFilter(firstCategory.id);
                    } else {
                      setActiveFilter('');
                    }
                    setSearchTerm('');
                  }}
                  className={cn(
                    'mt-6 inline-flex items-center gap-2 rounded-2xl border border-[#E4E7EC] px-4 py-2.5 text-sm font-medium text-[#475467] transition hover:bg-[#F5F7FA] cursor-pointer'
                  )}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CustomToast
        title={toastTitle}
        message={toastMessage}
        iconType={toastIconType}
        type={toastType}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
      <UploadBrochureDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditBrochureId(undefined);
          setDrawerMode('upload');
          setDrawerReadonly(false);
        }}
        mode={drawerMode}
        brochureId={editBrochureId}
        readonly={drawerReadonly}
        onEdit={() => {
          setDrawerMode('edit');
          setDrawerReadonly(false);
        }}
        onSuccess={handleRefreshList}
        onDelete={() => {
          if (editBrochureId) {
            setDeleteTargetId(editBrochureId);
            setDrawerOpen(false);
          }
        }}
        onError={(message) => {
          setToastTitle('Error');
          setToastMessage(message);
          setToastIconType('save');
          setToastType('error');
          setShowToast(true);
        }}
        bootstrapData={bootstrapData}
        downloadUrl={
          editBrochureId
            ? visibleBrochures.find(
              (b) => b.id === editBrochureId || b.brochureId?.toString() === editBrochureId
            )?.link
            : undefined
        }
      />
      <ShareBrochureModal
        brochure={shareTarget}
        onClose={() => setShareTarget(null)}
        onCopy={(link) => {
          handleCopyLink(link);
          setShareTarget(null);
        }}
      />
      <DeleteConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => deleteTargetId && handleDeleteBrochure(deleteTargetId)}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default CourseBrochures;
