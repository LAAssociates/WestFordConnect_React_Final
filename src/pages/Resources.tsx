import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { AppLayoutContext } from '../components/layout/AppLayout';
import ResourceCategorySidebar from '../components/resources/ResourceCategorySidebar';
import { downloadFile } from '../lib/utils/file';
import ResourceSearchFilterBar from '../components/resources/ResourceSearchFilterBar';
import ResourceTable from '../components/resources/ResourceTable';
import ResourceGrid from '../components/resources/ResourceGrid';
import AddResourceButton from '../components/resources/AddResourceButton';
import ResourceDrawer from '../components/resources/ResourceDrawer';
import type { AttachmentOption } from '../components/common/drawer/inputs/DrawerAttachments';
import type { FilterState } from '../components/common/FilterPopover';
import type { Resource, ViewMode, ResourceCategory } from '../components/resources/types';
import { resourceService } from '../services/resourceService';
import type { InitialLoadResult, SideMenuCategory, GetAllResourceParams, ResourceItem, CategoryItem } from '../types/resource';
import CustomToast from '../components/common/CustomToast';
import { formatToDateTimeOffset } from '../utils/dateUtils';

const Resources: React.FC = () => {
    const { setPageTitle } = useOutletContext<AppLayoutContext>();
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<string>('date-newest');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [filters, setFilters] = useState<FilterState | null>(null);
    const [sortColumn, setSortColumn] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [isAddResourceDrawerOpen, setIsAddResourceDrawerOpen] = useState(false);
    const [isNewFolderDrawerOpen, setIsNewFolderDrawerOpen] = useState(false);
    const [isSavingResource, setIsSavingResource] = useState(false);

    const [initialData, setInitialData] = useState<InitialLoadResult | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [sidebarCategories, setSidebarCategories] = useState<SideMenuCategory[]>([]);
    const [isSidebarLoading, setIsSidebarLoading] = useState(true);

    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoadingResources, setIsLoadingResources] = useState(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [toastMessage, setToastMessage] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null);

    // Pagination state
    const [pageNumber] = useState(1);
    const [pageSize] = useState(20);

    const hasFetched = useRef(false);

    const fetchInitialData = useCallback(async () => {
        try {
            const [initialRes, sidebarRes] = await Promise.all([
                resourceService.getInitialLoad(),
                resourceService.getCategorySideMenu()
            ]);

            if (initialRes.success) {
                setInitialData(initialRes.result);
                if (initialRes.result.sortBy && initialRes.result.sortBy.length > 0) {
                    setSortBy(initialRes.result.sortBy[0].code.toString());
                }
            }
            if (sidebarRes.success) {
                setSidebarCategories(sidebarRes.result);
                if (sidebarRes.result.length > 0) {
                    setActiveCategory(sidebarRes.result[0].categoryCode.toString());
                }
            }
        } catch (error) {
            console.error('Error fetching resource data:', error);
        } finally {
            setIsInitialLoading(false);
            setIsSidebarLoading(false);
        }
    }, []);

    useEffect(() => {
        setPageTitle('Resources');

        if (hasFetched.current) return;
        hasFetched.current = true;

        fetchInitialData();
    }, [setPageTitle, fetchInitialData]);

    const handleCategoryAdded = useCallback((newCategory: CategoryItem | any) => {
        setInitialData(prev => {
            if (!prev) return prev;
            // Ensure code and name map correctly for drawerCategories mapping down the tree
            const mappedCat: CategoryItem = {
                ...newCategory,
                id: newCategory.id || newCategory.categoryId,
                code: newCategory.code || newCategory.categoryId || newCategory.id,
                name: newCategory.name || newCategory.categoryName,
                colourCode: newCategory.colourCode || ''
            };

            // If it was already pushed by the service layer mutably, we STILL need to clone prev so React triggers a re-render
            const exists = prev.categories && prev.categories.some(c => c.id === mappedCat.id);
            if (exists) {
                return { ...prev, categories: [...(prev.categories || [])] };
            }

            return {
                ...prev,
                categories: [...(prev.categories || []), mappedCat]
            };
        });

        // Refetch sidebar categories
        resourceService.getCategorySideMenu()
            .then(sidebarRes => {
                if (sidebarRes.success) {
                    setSidebarCategories(sidebarRes.result);
                }
            })
            .catch(error => {
                console.error('Error fetching sidebar categories:', error);
            });
    }, []);

    // Prepare departments for filter (from categories)
    const departmentsForFilter = useMemo(() => {
        if (initialData?.categories) {
            return initialData.categories.map(cat => ({
                id: cat.code.toString(),
                name: cat.name,
                count: cat.tranxCount || parseInt(cat.name.match(/\((\d+)\)$/)?.[1] || '0', 10)
            }));
        }
        return [];
    }, [initialData]);

    // Prepare users for filter (unique users from resources)
    const usersForFilter = useMemo(() => {
        if (initialData?.uploadedBy) {
            return initialData.uploadedBy.map(user => ({
                id: user.id.toString(),
                name: user.name,
                position: user.designation || '',
                email: user.email || '',
                avatar: user.profileImageUrl || undefined
            }));
        }

        return [];
    }, [initialData]);

    // Prepare project groups for filter
    const projectGroupsForFilter = useMemo(() => {
        if (initialData?.groups) {
            return initialData.groups.map((group: any) => ({
                id: group.id?.toString() || group.groupId?.toString() || '',
                name: group.name || group.groupName || 'Unknown Group',
                iconUrl: group.iconUrl,
                avatar: group.iconUrl || group.avatar,
                memberCount: group.memberCount || group.members?.length || 0,
                members: group.members || []
            }));
        }
        return [];
    }, [initialData]);

    // Prepare file types for filter with display names
    const fileTypesForFilter = useMemo(() => {
        if (initialData?.fileType) {
            return initialData.fileType;
        }
        return [];
    }, [initialData]);

    // Sort options from API
    const sortOptions = useMemo(() => {
        if (initialData?.sortBy) {
            return initialData.sortBy.map(s => ({
                value: s.code.toString(),
                label: s.description
            }));
        }
        return [
            { value: 'date-newest', label: 'Newest First' },
            { value: 'date-oldest', label: 'Oldest First' },
            { value: 'title-az', label: 'Title A-Z' },
            { value: 'title-za', label: 'Title Z-A' },
        ];
    }, [initialData]);

    // Map sidebar categories to the format ResourceCategorySidebar expects
    const mappedSidebarCategories: ResourceCategory[] = useMemo(() => {
        return sidebarCategories.map(cat => {
            let icon = 'folder';
            if (cat.categoryName === 'All Files' || cat.categoryCode === 1) icon = 'all-files';
            // Example mapping could be expanded
            return {
                id: cat.categoryId.toString(),
                name: cat.categoryName,
                code: cat.categoryCode.toString(),
                icon,
                count: cat.tranxCount
            };
        });
    }, [sidebarCategories]);

    // Prepare categories for dropdowns (ResourceDrawer, etc) from InitialLoad API
    const drawerCategories = useMemo(() => {
        if (initialData?.categories) {
            return initialData.categories.map((cat: any) => ({
                id: cat.code?.toString() || cat.categoryId?.toString(),
                name: cat.name || cat.categoryName,
                code: cat.code?.toString() || cat.categoryId?.toString()
            }));
        }
        return [];
    }, [initialData]);

    const attachmentOptions = useMemo(() => {
        if (initialData?.attachmentType) {
            return initialData.attachmentType.map(at => {
                let type: AttachmentOption['type'] = 'file';
                const description = at.description.toLowerCase();
                if (description.includes('cloud') || at.code === 1) type = 'cloud';
                else if (description.includes('link') || at.code === 3) type = 'link';
                else if (description.includes('file') || description.includes('upload')) type = 'file';

                return {
                    type,
                    label: at.description
                };
            });
        }
        return undefined; // Fallback to defaults in DrawerAttachments
    }, [initialData]);

    // Map items to UI Resource type
    const mapResourceItemToUI = useCallback((item: ResourceItem): Resource => {
        let rType: any = item.fileTypeName;
        // Default to Fldr if no type string or if folder logic is needed
        if (!rType) {
            rType = item.fileType === 0 ? 'Fldr' : 'URL';
        }

        return {
            id: item.resourceId.toString(),
            title: item.title,
            category: item.categoryDesc || initialData?.categories?.find(c => c.id.toString() === item.categoryId.toString())?.name || `Category ${item.categoryId}`,
            type: rType,
            // Convert bytes to readable string placeholder (e.g., MB/KB)
            size: item.fileSize > 1024 * 1024 ? `${(item.fileSize / (1024 * 1024)).toFixed(2)} MB`
                : item.fileSize > 1024 ? `${(item.fileSize / 1024).toFixed(2)} KB`
                    : `${item.fileSize} B`,
            uploadedOn: new Date(item.createdOn),
            uploadedBy: {
                id: item.createdByName, // Usually an ID but we use name for UI or find an id mapping
                name: item.createdByName,
                avatar: item.userProfileImageUrl
            },
            lastModifiedOn: new Date(item.updatedOn),
            description: item.description,
            previewImage: item.thumbnailUrl,
        };
    }, [initialData]);

    // Filter and fetch resources
    useEffect(() => {
        // Skip fetching until initial metadata is loaded
        if (isInitialLoading) return;

        const fetchResources = async () => {
            setIsLoadingResources(true);
            try {
                // Build params
                const params: GetAllResourceParams = {
                    pageNumber,
                    pageSize
                };

                // Category (Sidebar selection)
                if (activeCategory !== 'all' && activeCategory !== '') {
                    params.category = [parseInt(activeCategory, 10)];
                }

                // Search
                if (searchTerm.trim()) {
                    params.searchQuery = searchTerm.trim();
                }

                // Date Filter
                if (filters?.singleDate) {
                    const filterDate = new Date(filters.singleDate);
                    filterDate.setHours(0, 0, 0, 0);
                    params.fromDate = formatToDateTimeOffset(filterDate);

                    const filterDateEnd = new Date(filterDate);
                    filterDateEnd.setHours(23, 59, 59, 0);
                    params.toDate = formatToDateTimeOffset(filterDateEnd);
                }

                // Uploaded By
                if (filters?.createdBy && filters.createdBy.length > 0) {
                    params.uploadedBy = filters.createdBy.map(id => parseInt(id, 10));
                }

                // Departments (Filter Popover selection)
                if (filters?.departments && filters.departments.length > 0) {
                    params.category = filters.departments.map(id => parseInt(id, 10));
                }

                // File Types
                if (filters?.fileTypes && filters.fileTypes.length > 0) {
                    params.fileType = filters.fileTypes.map(id => parseInt(id, 10)).filter(code => !isNaN(code));
                }

                // Audience
                if (filters?.audience && filters.audience.length > 0) {
                    const audienceArray = filters.audience.map(id => ({ id }));
                    params.audience = buildAudience(audienceArray);
                }

                // Sort
                if (sortBy) {
                    const sortNum = parseInt(sortBy, 10);
                    if (!isNaN(sortNum)) {
                        params.sortBy = sortNum;
                    }
                }

                const response = await resourceService.getAllResources(params);
                if (response.success && response.result) {
                    const mappedResources: Resource[] = response.result.items.map(mapResourceItemToUI);
                    setResources(mappedResources);
                }
            } catch (error) {
                console.error("Failed to fetch resources", error);
            } finally {
                setIsLoadingResources(false);
                if (isFirstLoad) {
                    setIsFirstLoad(false);
                }
            }
        };

        fetchResources();
    }, [activeCategory, searchTerm, filters, sortBy, sortColumn, sortDirection, pageNumber, pageSize, isInitialLoading, fileTypesForFilter, initialData, refreshTrigger]);

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const handleResourceClick = (resource: Resource) => {
        // Handle resource click - can open a modal or navigate to detail page
        console.log('Resource clicked:', resource);
    };

    const handleDownload = async (resource: Resource) => {
        try {
            const response = await resourceService.downloadResource(parseInt(resource.id, 10));
            if (response.success && response.result?.url) {
                await downloadFile(response.result.url, resource.title);
            } else {
                setToastMessage({
                    title: 'Download Failed',
                    message: response.message || 'Unable to generate download link.',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Failed to download resource', error);
            setToastMessage({
                title: 'Download Failed',
                message: 'An error occurred while downloading the resource.',
                type: 'error'
            });
        }
    };

    const handleDelete = async (resource: Resource) => {
        try {
            const response = await resourceService.deleteResource(parseInt(resource.id, 10));
            if (response.success) {
                setToastMessage({
                    title: 'Resource Deleted',
                    message: 'The resource was successfully deleted.',
                    type: 'success'
                });
                setRefreshTrigger(prev => prev + 1);
            } else {
                setToastMessage({
                    title: 'Delete Failed',
                    message: response.message || 'Unable to delete the resource.',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Failed to delete resource', error);
            setToastMessage({
                title: 'Delete Failed',
                message: 'An error occurred while deleting the resource.',
                type: 'error'
            });
        }
    };

    const handleNewFolder = () => {
        setIsNewFolderDrawerOpen(true);
    };

    const handleUploadFile = () => {
        setIsAddResourceDrawerOpen(true);
    };

    const handleUploadFolder = (files: FileList) => {
        // TODO: Implement folder upload
        console.log('Upload folder:', files);
    };

    const buildAudience = (audienceArray: Array<{ id: string }>) => {
        const isAllStaff = audienceArray.some(a => a.id === 'all-staff');
        if (isAllStaff) {
            return { audienceType: 1, userIds: [], groupIds: [] };
        }
        const userIds: number[] = [];
        const groupIds: number[] = [];
        audienceArray.forEach(a => {
            if (a.id.startsWith('u-')) {
                userIds.push(parseInt(a.id.substring(2), 10));
            } else if (a.id.startsWith('g-')) {
                groupIds.push(parseInt(a.id.substring(2), 10));
            } else {
                // Compatibility for cases where no prefix exists (e.g. from drawer or state not through FilterPopover)
                if (usersForFilter.some(u => u.id === a.id)) {
                    userIds.push(parseInt(a.id, 10));
                } else if (projectGroupsForFilter.some(g => g.id === a.id)) {
                    groupIds.push(parseInt(a.id, 10));
                }
            }
        });

        let type = 1; // Default to All
        if (userIds.length > 0 && groupIds.length === 0) type = 2; // Individuals
        if (groupIds.length > 0 && userIds.length === 0) type = 3; // Groups
        if (userIds.length > 0 && groupIds.length > 0) type = 1; // Multiple/All

        return { audienceType: type, userIds, groupIds };
    };

    const handleNewFolderSubmit = async (data: any) => {
        setIsSavingResource(true);
        const audienceParams = buildAudience(data.audience);
        const payload = {
            folderName: data.folderName,
            categoryId: parseInt(data.category, 10),
            description: data.description,
            audience: audienceParams
        };

        try {
            const response = await resourceService.createFolder(payload);
            if (response.success) {
                if (response.result) {
                    const newFolder = mapResourceItemToUI(response.result);
                    setResources(prev => [newFolder, ...prev]);
                } else {
                    setRefreshTrigger(prev => prev + 1);
                }
            } else {
                throw new Error(response.message || 'Failed to create folder.');
            }
        } catch (error: any) {
            throw new Error(error.message || 'An error occurred while creating the folder.');
        } finally {
            setIsSavingResource(false);
        }
    };

    const handleAddResourceSubmit = async (data: {
        title: string;
        category: string;
        audience: Array<{ id: string; name: string; avatar?: string }>;
        description: string;
        file?: File;
        attachments?: File[];
        links?: Array<{ id: string; displayText: string; url: string }>;
    }) => {
        if (!data.file && (!data.attachments || data.attachments.length === 0) && (!data.links || data.links.length === 0)) {
            setToastMessage({ title: 'Error', message: 'Please select a file, attachments or links to upload.', type: 'error' });
            return;
        }

        setIsSavingResource(true);
        const audienceParams = buildAudience(data.audience);
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('categoryId', data.category);
        formData.append('description', data.description || '');

        // Flatten audience params
        formData.append('Audience.AudienceType', audienceParams.audienceType.toString());
        audienceParams.userIds?.forEach(id => formData.append('Audience.UserIds', id.toString()));
        audienceParams.groupIds?.forEach(id => formData.append('Audience.GroupIds', id.toString()));

        if (data.file) {
            const ext = data.file.name.split('.').pop()?.toLowerCase() || '';
            let fileTypeCode = 0;
            const ftMatch = fileTypesForFilter.find(ft => ft.description.toLowerCase().includes(ext));
            if (ftMatch) fileTypeCode = ftMatch.code;

            formData.append('fileType', fileTypeCode.toString());
            formData.append('fileSize', data.file.size.toString());
            formData.append('contentType', data.file.type || 'application/octet-stream');
            formData.append('ResourceFile', data.file);
        }

        if (data.attachments && data.attachments.length > 0) {
            data.attachments.forEach(file => {
                formData.append('Attachments', file);
            });
        }

        if (data.links && data.links.length > 0) {
            data.links.forEach((link, index) => {
                formData.append(`Links[${index}].DisplayText`, link.displayText);
                formData.append(`Links[${index}].Url`, link.url);
            });
        }

        try {
            const response = await resourceService.saveResource(formData);
            if (response.success) {
                if (response.result) {
                    const newResource = mapResourceItemToUI(response.result);
                    setResources(prev => [newResource, ...prev]);
                } else {
                    setRefreshTrigger(prev => prev + 1);
                }
            } else {
                throw new Error(response.message || 'Failed to upload resource.');
            }
        } catch (error: any) {
            throw new Error(error.message || 'An error occurred while uploading the file.');
        } finally {
            setIsSavingResource(false);
        }
    };

    const handleEditSave = async (updatedResource: any) => {
        setIsSavingResource(true);
        const audienceParams = buildAudience(updatedResource.audience || []);
        const formData = new FormData();
        formData.append('resourceId', updatedResource.id);
        formData.append('title', updatedResource.title);
        formData.append('categoryId', updatedResource.category);
        formData.append('description', updatedResource.description || '');

        // Flatten audience params
        formData.append('Audience.AudienceType', audienceParams.audienceType.toString());
        audienceParams.userIds?.forEach(id => formData.append('Audience.UserIds', id.toString()));
        audienceParams.groupIds?.forEach(id => formData.append('Audience.GroupIds', id.toString()));

        try {
            const response = await resourceService.saveResource(formData);
            if (response.success) {
                if (response.result) {
                    const updatedResource = mapResourceItemToUI(response.result);
                    setResources(prev => prev.map(r => r.id === updatedResource.id ? updatedResource : r));
                } else {
                    setRefreshTrigger(prev => prev + 1);
                }
            } else {
                throw new Error(response.message || 'Failed to update resource.');
            }
        } catch (error: any) {
            throw new Error(error.message || 'An error occurred while updating the resource.');
        } finally {
            setIsSavingResource(false);
        }
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilters(null);
        if (sidebarCategories.length > 0) {
            setActiveCategory(sidebarCategories[0].categoryCode.toString());
        } else {
            setActiveCategory('all');
        }
        if (initialData?.sortBy && initialData.sortBy.length > 0) {
            setSortBy(initialData.sortBy[0].code.toString());
        }
    };

    // Prepare available users for audience selection
    const availableUsersForDrawer = useMemo(() => {
        return usersForFilter.map((user) => ({
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            position: user.position,
        }));
    }, [usersForFilter]);

    // Removed full page loader in favor of skeleton loading

    return (
        <div className="bg-white rounded-[10px] shadow-[2px_2px_4px_0px_rgba(0,0,0,0.1)] w-full h-full flex">
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search and Filter Bar */}
                <div className="px-[30px] py-[15px] border-b-2 border-[#E6E6E6]">
                    <ResourceSearchFilterBar
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        onFilterApply={setFilters}
                        onFilterReset={handleResetFilters}
                        onSortChange={setSortBy} // @ts-ignore
                        selectedSort={sortBy}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        departments={departmentsForFilter}
                        users={usersForFilter}
                        fileTypes={fileTypesForFilter}
                        projectGroups={projectGroupsForFilter}
                        sortOptions={sortOptions}
                        isLoading={isFirstLoad}
                        initialFilters={filters || undefined}
                    />
                </div>

                {/* Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar with Add Resource Button */}
                    <div className="min-w-[230px] w-[18%] border-r-2 border-[#E6E6E6] flex flex-col">
                        <AddResourceButton
                            onNewFolder={handleNewFolder}
                            onUploadFile={handleUploadFile}
                            onUploadFolder={handleUploadFolder}
                            isLoading={isFirstLoad}
                        />

                        {/* Seperator */}
                        <div className="h-px bg-[#E6E6E6] shrink-0"></div>

                        {/* Category Sidebar */}
                        <ResourceCategorySidebar
                            activeCategory={activeCategory}
                            onCategoryChange={setActiveCategory}
                            categories={mappedSidebarCategories}
                            isLoading={isSidebarLoading}
                        />
                    </div>

                    {/* Resources Table/Grid */}
                    <div className="flex-1 overflow-auto p-[25px]">
                        {isInitialLoading || isLoadingResources ? (
                            viewMode === 'list' ? (
                                <div className="w-full">
                                    <div className="h-12 bg-[#F2F7FA] rounded-t-[25px] mb-2 flex items-center px-5">
                                        <div className="w-1/4 h-4 bg-gray-200 animate-pulse rounded"></div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {Array.from({ length: 7 }).map((_, idx) => (
                                            <div key={idx} className="h-16 bg-gray-100 animate-pulse rounded border-b border-[#E6E6E6] flex items-center px-5 gap-4">
                                                <div className="w-8 h-8 bg-gray-200 animate-pulse rounded"></div>
                                                <div className="w-1/3 h-4 bg-gray-200 animate-pulse rounded"></div>
                                                <div className="w-1/6 h-4 bg-gray-200 animate-pulse rounded"></div>
                                                <div className="w-1/6 h-4 bg-gray-200 animate-pulse rounded"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-[25px]">
                                    {Array.from({ length: 8 }).map((_, idx) => (
                                        <div key={idx} className="bg-gray-100 animate-pulse rounded-[10px] h-[220px] w-full"></div>
                                    ))}
                                </div>
                            )
                        ) : resources.length === 0 ? (
                            <div className="mx-auto max-w-xl w-full rounded-[24px] border border-dashed border-[#CBD5E1] bg-white p-8 text-center sm:p-12 mt-10">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F1F5F9]">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#94A3B8]"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                </div>
                                <h3 className="mt-6 text-lg font-semibold text-[#111827]">No resources found</h3>
                                <p className="mx-auto mt-2 max-w-md text-sm text-[#6B7280]">
                                    Try adjusting your filters or search terms. You can also upload a new resource to keep the library fresh.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-[#E4E7EC] px-4 py-2.5 text-sm font-medium text-[#475467] transition hover:bg-[#F5F7FA] cursor-pointer"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : viewMode === 'list' ? (
                            <ResourceTable
                                resources={resources}
                                searchTerm={searchTerm}
                                onResourceClick={handleResourceClick}
                                sortColumn={sortColumn}
                                sortDirection={sortDirection}
                                onSort={handleSort}
                                onDownload={handleDownload}
                                onDelete={handleDelete}
                                onSave={handleEditSave}
                                isSaving={isSavingResource}
                                categories={drawerCategories}
                                availableUsers={availableUsersForDrawer}
                                projectGroups={projectGroupsForFilter}
                                attachmentOptions={attachmentOptions}
                            />
                        ) : (
                            <ResourceGrid
                                resources={resources}
                                searchTerm={searchTerm}
                                onResourceClick={handleResourceClick}
                                onDownload={handleDownload}
                                onDelete={handleDelete}
                                onSave={handleEditSave}
                                isSaving={isSavingResource}
                                categories={drawerCategories}
                                availableUsers={availableUsersForDrawer}
                                projectGroups={projectGroupsForFilter}
                                attachmentOptions={attachmentOptions}
                            />
                        )}
                    </div>
                </div>
            </div>

            <ResourceDrawer
                isOpen={isAddResourceDrawerOpen}
                onClose={() => setIsAddResourceDrawerOpen(false)}
                resource={null}
                onSubmit={handleAddResourceSubmit}
                onCategoryAdded={handleCategoryAdded}
                availableUsers={availableUsersForDrawer}
                categories={drawerCategories}
                projectGroups={projectGroupsForFilter}
                attachmentOptions={attachmentOptions}
                isSaving={isSavingResource}
            />

            <ResourceDrawer
                isOpen={isNewFolderDrawerOpen}
                onClose={() => setIsNewFolderDrawerOpen(false)}
                resource={null}
                isNewFolder={true}
                onNewFolder={handleNewFolderSubmit}
                onCategoryAdded={handleCategoryAdded}
                availableUsers={availableUsersForDrawer}
                categories={drawerCategories}
                projectGroups={projectGroupsForFilter}
                attachmentOptions={attachmentOptions}
                isSaving={isSavingResource}
            />

            {toastMessage && (
                <CustomToast
                    title={toastMessage.title}
                    message={toastMessage.message}
                    show={true}
                    onClose={() => setToastMessage(null)}
                    iconType={toastMessage.type === 'success' ? 'check' : 'error'}
                />
            )}
        </div>
    );
};

export default Resources;
