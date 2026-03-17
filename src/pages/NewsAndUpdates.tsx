import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { AppLayoutContext } from '../components/layout/AppLayout';
import CategorySidebar from '../components/news-updates/CategorySidebar';
import CreatePostDrawer from '../components/news-updates/CreatePostDrawer';
import DraftsDrawer, { type DraftItem } from '../components/news-updates/DraftsDrawer';
import PinnedPostsSidebar from '../components/news-updates/PinnedPostsSidebar';
import PostCard from '../components/news-updates/PostCard';
import SearchFilterBar from '../components/news-updates/SearchFilterBar';
import type { FilterState, Person } from '../components/common/FilterPopover';
import type { Post, PostCategory } from '../components/news-updates/types';
import type { ProjectGroup } from '../components/common/AudienceDropdown';
import { newsService } from '../services/newsService';
import type { CategoryMenuItem, NewsRequest, NewsItem } from '../types/news';
import PostCardSkeleton from '../components/news-updates/PostCardSkeleton';
import { formatToDateTimeOffset } from '../utils/dateUtils';
import { useMessengerContext } from '../contexts/MessengerContext';


const NewsAndUpdates: React.FC = () => {
    const { setPageTitle } = useOutletContext<AppLayoutContext>();
    const { user } = useAuth();
    const { users: messengerUsers, fetchBootstrap: fetchMessengerBootstrap } = useMessengerContext();
    const location = useLocation();
    const [activeCategory, setActiveCategory] = useState<PostCategory>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<string>('');
    const [filters, setFilters] = useState<FilterState | null>(null);
    const [createPostOpen, setCreatePostOpen] = useState(false);
    const [draftsDrawerOpen, setDraftsDrawerOpen] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [loadingPinned, setLoadingPinned] = useState(false);
    const [loadingDrafts, setLoadingDrafts] = useState(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [pinningPostId, setPinningPostId] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        pageNumber: 1,
        pageSize: 10,
        hasNextPage: false,
    });
    const [drafts, setDrafts] = useState<DraftItem[]>([]);
    const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
    const scrollableContainerRef = useRef<HTMLDivElement>(null);
    const [dynamicCategories, setDynamicCategories] = useState<CategoryMenuItem[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [filterUsers, setFilterUsers] = useState<Person[]>([]);
    const [filterGroups, setFilterGroups] = useState<ProjectGroup[]>([]);
    const [sortOptions, setSortOptions] = useState<{ value: string; label: string }[]>([]);
    const [isFiltersLoaded, setIsFiltersLoaded] = useState(false);
    const [isSinglePostView, setIsSinglePostView] = useState(false);
    // Tracks the categoryId of the "All Updates" item so fetchPosts can send categories:[] for it
    const allCategoryIdRef = useRef<string | null>(null);

    useEffect(() => {
        setPageTitle('News & Updates');
    }, [setPageTitle]);

    useEffect(() => {
        void fetchMessengerBootstrap();
    }, [fetchMessengerBootstrap]);

    const liveStatusByUserId = React.useMemo(() => {
        const map: Record<string, 'online' | 'away' | 'busy' | 'offline'> = {};
        for (const u of messengerUsers) {
            map[u.id] = u.status ?? 'offline';
        }
        return map;
    }, [messengerUsers]);

    // Helper function to format lastModified as relative time
    const formatRelativeTime = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
        }
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    };

    // Map API NewsItem to UI Post
    const mapNewsItemToPost = (item: NewsItem): Post => {
        const isImage = (url: string) => {
            if (!url) return false;
            return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
        };

        const apiAttachments = item.attachments || [];
        const imageAttachments = apiAttachments
            .filter((a: any) => isImage(a.url))
            .map((a: any) => ({
                type: 'document' as const,
                url: a.url,
                alt: a.title || a.displayText || 'Image Attachment'
            }));

        const otherAttachments = apiAttachments
            .filter((a: any) => !isImage(a.url))
            .map((a: any, index: number) => ({
                id: `att-${item.newsId}-${index}`,
                type: (a.type?.toLowerCase() === 'link' ? 'link' : 'pdf') as 'link' | 'pdf',
                title: a.title || a.displayText || 'Attachment',
                url: a.url
            }));

        const formatDate = (dateStr: string) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;

            const day = date.getDate();
            const month = date.toLocaleString('en-GB', { month: 'short' });
            const time = date.toLocaleString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            return `${day} ${month}, ${time}`;
        };

        // The category field from the API may be null; use categoryDesc (human-readable label
        // e.g. "HR Update") as the display key so the badge renders correctly.
        // Also fall back to the slug `category` if categoryDesc is absent.
        const categoryKey = item.categoryDesc || item.category || 'general';

        // Resolve the CTA link — GetAll returns `ctaLink`, some endpoints use `catLink`.
        const resolvedCtaLink = item.ctaLink || item.catLink;

        return {
            id: item.newsId.toString(),
            author: {
                id: String(item.createdBy || '').trim() || 'unknown',
                name: item.createdByName || item.authorName || 'Unknown Author',
                role: item.createdByDesignation || 'Staff Member',
                avatar: item.loginUserProfileImageUrl || item.authorImage || '',
                availability: 'offline',
            },
            category: categoryKey as PostCategory,
            title: item.title,
            content: item.description,
            timestamp: item.publishDate,
            formattedDate: formatDate(item.publishDate || item.createdOn),
            formattedDateLong: new Date(item.publishDate || item.createdOn).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }),
            pinned: item.isPinned,
            images: [
                ...(item.bannerImage ? [{ type: 'banner' as const, url: item.bannerImage }] : []),
                ...imageAttachments
            ],
            reactions: item.allowReactions
                ? [
                    { type: 'celebrate', count: 0, userReacted: false },
                    { type: 'applaud', count: 0, userReacted: false },
                    { type: 'support', count: 0, userReacted: false },
                ]
                : [],
            commentCount: item.commentCount || 0,
            allowReactions: item.allowReactions,
            attachments: otherAttachments,
            cta: item.cta || undefined,
            ctaLink: resolvedCtaLink || undefined
        };
    };

    const applyLiveAuthorAvailability = React.useCallback((list: Post[]): Post[] => {
        return list.map((post) => {
            const mappedAvailability = post.author.id !== 'unknown'
                ? (liveStatusByUserId[post.author.id] ?? 'away')
                : 'away';

            if (post.author.availability === mappedAvailability) {
                return post;
            }

            return {
                ...post,
                author: {
                    ...post.author,
                    availability: mappedAvailability
                }
            };
        });
    }, [liveStatusByUserId]);

    const postsWithLiveStatus = React.useMemo(
        () => applyLiveAuthorAvailability(posts),
        [posts, applyLiveAuthorAvailability]
    );

    const pinnedPostsWithLiveStatus = React.useMemo(
        () => applyLiveAuthorAvailability(pinnedPosts),
        [pinnedPosts, applyLiveAuthorAvailability]
    );

    const fetchPosts = React.useCallback(async (page: number, append: boolean = false) => {
        try {
            setLoadingPosts(true);
            // Helper for mapping filter array of strings to correct AudienceModel structure
            const getAudiencePayload = (audienceIds: string[] | undefined) => {
                if (!audienceIds || audienceIds.length === 0) {
                    return undefined;
                }

                if (audienceIds.includes('all-staff')) {
                    return { audienceType: 1 as const, userIds: [], groupIds: [] };
                }

                const userIds: number[] = [];
                const groupIds: number[] = [];

                audienceIds.forEach(id => {
                    if (id.startsWith('u-')) {
                        const numId = parseInt(id.substring(2), 10);
                        if (!isNaN(numId)) userIds.push(numId);
                    } else if (id.startsWith('g-')) {
                        const numId = parseInt(id.substring(2), 10);
                        if (!isNaN(numId)) groupIds.push(numId);
                    } else {
                        const numId = parseInt(id, 10);
                        if (!isNaN(numId)) {
                            // We check if it's in the group list to separate users vs groups
                            const isGroup = filterGroups.some(g => g.id === id);
                            if (isGroup) {
                                groupIds.push(numId);
                            } else {
                                userIds.push(numId);
                            }
                        }
                    }
                });

                if (userIds.length > 0) {
                    return { audienceType: 2 as const, userIds, groupIds: [] };
                }

                if (groupIds.length > 0) {
                    return { audienceType: 3 as const, userIds: [], groupIds };
                }

                return undefined;
            };

            const request: NewsRequest = {
                userId: user?.id,
                searchQuery: searchTerm || null,
                // Always send the specific categoryId string.
                categories: activeCategory ? [activeCategory] : [],
                pageNumber: page,
                pageSize: 10,
                sortBy: sortBy ? String(sortBy) : null,
                fromDate: filters?.dateRange?.from ? formatToDateTimeOffset(filters.dateRange.from) : null,
                toDate: filters?.dateRange?.to ? formatToDateTimeOffset(filters.dateRange.to) : null,
                postedBy: filters?.postedBy?.filter(id => id !== 'all-staff').map(Number) || undefined,
                audience: getAudiencePayload(filters?.audience as string[] | undefined)
            };

            const response = await newsService.getAllNewsInfo(request);

            if (response.success && response.result) {
                const newPosts = response.result.items.map(mapNewsItemToPost);
                setPosts(prev => append ? [...prev, ...newPosts] : newPosts);
                setPagination({
                    pageNumber: response.result.pageNumber,
                    pageSize: response.result.pageSize,
                    hasNextPage: response.result.totalCount > page * 10
                });
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setLoadingPosts(false);
            if (isFirstLoad) {
                setIsFirstLoad(false);
            }
        }
    }, [activeCategory, searchTerm, sortBy, filters, filterGroups]);

    const fetchPinnedPosts = async () => {
        try {
            setLoadingPinned(true);
            const response = await newsService.getPinned();
            if (response.success && response.result) {
                const mappedPinned = response.result.map(mapNewsItemToPost);
                setPinnedPosts(mappedPinned);
            }
        } catch (error) {
            console.error('Failed to fetch pinned posts:', error);
        } finally {
            setLoadingPinned(false);
        }
    };

    const fetchDrafts = async () => {
        try {
            setLoadingDrafts(true);
            const response = await newsService.getDrafts();
            if (response.success && response.result) {
                const mappedDrafts: DraftItem[] = response.result.map(item => ({
                    id: item.newsId.toString(),
                    title: item.title,
                    category: (item.categoryDesc || item.category || 'general') as PostCategory,
                    content: item.description,
                    lastModified: item.lastModified || formatRelativeTime(new Date(item.updatedOn || item.createdOn)),
                    publishDate: item.publishDate,
                    ctaLabel: item.cta || undefined,
                    ctaLink: item.catLink || undefined,
                    allowReactions: item.allowReactions,
                    showOnDashboard: item.showOnDashboard,
                    sendEmailNotification: item.sendAsEmail,
                    attachments: item.attachments?.map((a: any) => ({
                        type: a.type?.toLowerCase() === 'link' ? 'link' : 'pdf',
                        title: a.title || a.displayText || 'Attachment',
                        url: a.url
                    }))
                }));
                setDrafts(mappedDrafts);
            }
        } catch (error) {
            console.error('Failed to fetch drafts:', error);
        } finally {
            setLoadingDrafts(false);
        }
    };

    const handleCategoryAdded = async (categories?: CategoryMenuItem[]) => {
        try {
            if (categories && categories.length > 0) {
                setDynamicCategories(categories);
                return;
            }

            const response = await newsService.getCategoriesSideMenu();
            if (response.success) {
                setDynamicCategories(response.result);
            }
        } catch (error) {
            console.error('Failed to refetch categories:', error);
        }
    };

    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const fetchCategories = async (): Promise<CategoryMenuItem[]> => {
            try {
                setCategoriesLoading(true);
                const response = await newsService.getCategoriesSideMenu();
                if (response.success && response.result) {
                    setDynamicCategories(response.result);
                    return response.result;
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            } finally {
                setCategoriesLoading(false);
            }
            return [];
        };

        const fetchFilterData = async (): Promise<string | null> => {
            try {
                const response = await newsService.getNewsBootstrap();
                if (response.success && response.result) {
                    const mappedUsers: Person[] = response.result.individualUsers.map(user => ({
                        id: user.id.toString(),
                        name: user.name,
                        position: user.designation,
                        email: '',
                        avatar: user.profileImageUrl || ''
                    }));

                    // Filter out project groups that match an individual user's name
                    const userNames = new Set(response.result.individualUsers.map(u => u.name));
                    const mappedGroups: ProjectGroup[] = response.result.groups
                        .filter(group => !userNames.has(group.groupName))
                        .map(group => ({
                            id: group.groupId.toString(),
                            name: group.groupName,
                            iconUrl: group.iconUrl,
                            members: [], // API doesn't provide members in bootstrap usually
                            memberCount: group.memberCount
                        }));

                    const mappedSortOptions = response.result.sortBy?.map(option => ({
                        value: option.code,
                        label: option.description
                    })) || [];

                    setFilterUsers(mappedUsers);
                    setFilterGroups(mappedGroups);

                    if (mappedSortOptions.length > 0) {
                        setSortOptions(mappedSortOptions);
                        // Return the first sort code so init() can pass it directly to fetchPosts
                        // Explicitly convert to string — the API may return code as a number at runtime
                        return String(mappedSortOptions[0].value);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch filter data:', error);
            }
            return null;
        };

        const init = async () => {
            const [categories, resolvedSortBy] = await Promise.all([fetchCategories(), fetchFilterData()]);
            // Default to the first category returned by the API (typically "All Updates").
            // Store its ID so fetchPosts knows to send categories:[] for it.
            if (categories.length > 0) {
                const first = categories[0];
                allCategoryIdRef.current = first.categoryCode.toString();
                setActiveCategory(first.categoryCode.toString() as PostCategory);
            }
            // Mark filters as loaded — the useEffect watching isFiltersLoaded will
            // trigger fetchPosts, but sortBy state may not have settled yet.
            // We pass resolvedSortBy directly to avoid the stale-closure race condition.
            if (resolvedSortBy) {
                setSortBy(resolvedSortBy);
            }
            setIsFiltersLoaded(true);
        };

        fetchPinnedPosts();
        init();
    }, []);

    useEffect(() => {
        const state = location.state as { focusPostId?: string } | null;
        if (state?.focusPostId) {
            handleViewPost(state.focusPostId);
            // Clear state after handling to prevent re-opening on每一次 render if something else changes
            window.history.replaceState({}, document.title);
        }
    }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

    // Immediate reset + fetch for category / sort / filter changes
    useEffect(() => {
        if (!isFiltersLoaded || isSinglePostView) return;
        // Before calling getAll: if no sort is selected but we have options, select the first one.
        if (!sortBy && sortOptions.length > 0) {
            setSortBy(String(sortOptions[0].value));
            return;
        }
        setLoadingPosts(true);
        setPosts([]);
        fetchPosts(1, false);
    }, [activeCategory, sortBy, filters, isFiltersLoaded, isSinglePostView, sortOptions]); // eslint-disable-line react-hooks/exhaustive-deps

    // Debounced fetch for search input only (avoids firing on every keystroke)
    useEffect(() => {
        if (!isFiltersLoaded || isSinglePostView) return;

        const timer = setTimeout(() => {
            fetchPosts(1, false);
        }, 500);

        setLoadingPosts(true); // Instant loading feedback

        return () => clearTimeout(timer);
    }, [searchTerm, isSinglePostView]); // eslint-disable-line react-hooks/exhaustive-deps

    // Removed the separate mount useEffect for fetchPinnedPosts()


    const handlePinToggle = async (postId: string) => {
        try {
            const post = posts.find(p => p.id === postId) || pinnedPosts.find(p => p.id === postId);
            if (!post) return;

            setPinningPostId(postId);

            // Optimistic update
            const newPinnedStatus = !post.pinned;

            await newsService.togglePinned({
                entityId: parseInt(postId),
                isPinned: newPinnedStatus
            });

            // Refresh both lists to ensure consistency
            await Promise.all([
                fetchPosts(pagination.pageNumber, false),
                fetchPinnedPosts()
            ]);
        } catch (error) {
            console.error('Failed to toggle pin:', error);
        } finally {
            setPinningPostId(null);
        }
    };

    const handleReactionClick = (postId: string, reactionType: 'celebrate' | 'applaud' | 'support') => {
        setPosts((prev) =>
            prev.map((post) => {
                if (post.id === postId) {
                    const reactions = post.reactions.map((reaction) => {
                        if (reaction.type === reactionType) {
                            return {
                                ...reaction,
                                userReacted: !reaction.userReacted,
                                count: reaction.userReacted ? Math.max(0, reaction.count - 1) : reaction.count + 1,
                            };
                        }
                        return reaction;
                    });
                    return { ...post, reactions };
                }
                return post;
            })
        );
    };

    const handleCommentSubmit = (postId: string) => {
        setPosts((prev) =>
            prev.map((post) => {
                if (post.id === postId) {
                    return { ...post, commentCount: post.commentCount + 1 };
                }
                return post;
            })
        );
    };

    const handleViewPost = async (postId: string) => {
        try {
            setLoadingPosts(true);
            setIsSinglePostView(true);
            setPosts([]); // Clear posts to show single loader
            setActiveCategory(null as any); // Deselect sidebar

            const response = await newsService.getSingleNews(Number(postId));
            if (response.success && response.result) {
                const mappedPost = mapNewsItemToPost(response.result);
                setPosts([mappedPost]);
                setPagination({
                    pageNumber: 1,
                    pageSize: 1,
                    hasNextPage: false
                });
            }
        } catch (error) {
            console.error('Failed to view post:', error);
            // Fallback to searching in current posts if fetch fails
            const post = posts.find(p => p.id === postId) || pinnedPosts.find(p => p.id === postId);
            if (post) {
                setPosts([post]);
            }
        } finally {
            setLoadingPosts(false);
            if (scrollableContainerRef.current) {
                scrollableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    const handleCreatePost = (postItem?: any) => {
        if (postItem) {
            const newPost = mapNewsItemToPost(postItem);
            setPosts(prev => [newPost, ...prev]);

            // If it was meant to be pinned, optionally add to pinnedPosts
            if (postItem.showOnDashboard) {
                setPinnedPosts(prev => [newPost, ...prev]);
            }
        } else {
            // Fallback if API didn't return an item
            fetchPosts(1, false);
        }
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilters(null);
        if (dynamicCategories.length > 0) {
            setActiveCategory(dynamicCategories[0].categoryCode.toString() as PostCategory);
        } else {
            setActiveCategory('all');
        }
        setIsSinglePostView(false);
    };

    const handleSaveDraft = (postData: any, draftId?: string) => {
        const now = new Date();
        const lastModified = formatRelativeTime(now);
        if (draftId) {
            setDrafts((prev) =>
                prev.map((draft) => (draft.id === draftId ? { ...draft, ...postData, lastModified } : draft))
            );
        } else {
            const newDraft: DraftItem = { id: `draft-${Date.now()}`, ...postData, lastModified };
            setDrafts((prev) => [newDraft, ...prev]);
        }
    };



    return (
        <div className="h-full flex flex-col bg-[#E0E3E7] rounded-[10px] overflow-hidden shadow-[2px_2px_4px_0_rgba(0,0,0,0.10)]">
            <div className="bg-white px-[25px] py-[15px] border-b-2 border-[#E6E6E6]">
                <div className="flex items-center justify-center">
                    <SearchFilterBar
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        onFilterApply={setFilters}
                        onFilterReset={handleResetFilters}
                        onSortChange={setSortBy as any}
                        selectedSort={sortBy as any}
                        users={filterUsers}
                        groups={filterGroups}
                        sortOptions={sortOptions}
                        isLoading={isFirstLoad}
                        className="relative"
                    />
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <CategorySidebar
                    activeCategory={activeCategory}
                    onCategoryChange={(cat) => {
                        setIsSinglePostView(false);
                        setActiveCategory(cat);
                    }}
                    onCreatePost={() => {
                        setEditingDraftId(null);
                        setCreatePostOpen(true);
                    }}
                    onOpenDrafts={() => {
                        fetchDrafts();
                        setDraftsDrawerOpen(true);
                    }}
                    dynamicCategories={dynamicCategories}
                    categoriesLoading={categoriesLoading}
                />

                <div className="flex-1 flex flex-col overflow-hidden bg-[#E6E6E6]">
                    <div ref={scrollableContainerRef} className="flex-1 overflow-y-auto p-[25px]">
                        <div className="flex flex-col gap-12">
                            {loadingPosts && posts.length === 0 ? (
                                <div className="flex flex-col gap-12">
                                    {(isSinglePostView ? [1] : [1, 2, 3]).map((i) => (
                                        <PostCardSkeleton key={i} />
                                    ))}
                                </div>
                            ) : postsWithLiveStatus.length > 0 ? (
                                <div className="flex flex-col gap-12">
                                    {isSinglePostView && (
                                        <button
                                            onClick={() => {
                                                setIsSinglePostView(false);
                                                setActiveCategory(allCategoryIdRef.current || 'all');
                                            }}
                                            className="flex items-center gap-2 text-[#008080] font-semibold text-sm hover:underline cursor-pointer mb-[-35px] w-fit"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m15 18-6-6 6-6" />
                                            </svg>
                                            Back to Posts
                                        </button>
                                    )}
                                    {postsWithLiveStatus.map((post) => {
                                        return (
                                            <div
                                                key={post.id}
                                                id={`post-${post.id}`}
                                                className="w-full"
                                            >
                                                <PostCard
                                                    post={post}
                                                    onPinToggle={handlePinToggle}
                                                    isPinning={pinningPostId === post.id}
                                                    onReactionClick={handleReactionClick}
                                                    onCommentSubmit={handleCommentSubmit}
                                                    onViewPost={handleViewPost}
                                                    searchTerm={searchTerm}
                                                />
                                            </div>
                                        );
                                    })}

                                    {pagination.hasNextPage && (
                                        <div className="flex justify-center mt-6">
                                            <button
                                                onClick={() => fetchPosts(pagination.pageNumber + 1, true)}
                                                disabled={loadingPosts}
                                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                {loadingPosts ? 'Loading...' : 'Load More'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="mx-auto max-w-xl w-full rounded-[24px] border border-dashed border-[#CBD5E1] bg-white p-8 text-center sm:p-12 my-12">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F1F5F9]">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#94A3B8]"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                    </div>
                                    <h3 className="mt-6 text-lg font-semibold text-[#111827]">No posts found</h3>
                                    <p className="mx-auto mt-2 max-w-md text-sm text-[#6B7280]">
                                        Try adjusting your filters or search terms. You can also create a new post to keep the news feed fresh.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-[#E4E7EC] px-4 py-2.5 text-sm font-medium text-[#475467] transition hover:bg-[#F5F7FA] cursor-pointer"
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white py-[26px] px-[25px] w-[26%] flex flex-col overflow-y-auto">
                    {loadingPinned && pinnedPosts.length === 0 ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3].map((i) => (
                                <PostCardSkeleton key={i} compact />
                            ))}
                        </div>
                    ) : (
                        <PinnedPostsSidebar
                            pinnedPosts={pinnedPostsWithLiveStatus}
                            onViewPost={handleViewPost}
                            onPinToggle={handlePinToggle}
                            pinningPostId={pinningPostId}
                        />
                    )}
                </div>
            </div>

            <CreatePostDrawer
                open={createPostOpen}
                onClose={() => {
                    setCreatePostOpen(false);
                    setEditingDraftId(null);
                }}
                onSubmit={handleCreatePost}
                onSaveDraft={handleSaveDraft}
                initialData={editingDraftId ? drafts.find((d) => d.id === editingDraftId) || null : null}
                draftId={editingDraftId || undefined}
                onCategoryAdded={handleCategoryAdded}
            />

            <DraftsDrawer
                open={draftsDrawerOpen}
                onClose={() => setDraftsDrawerOpen(false)}
                drafts={drafts}
                isLoading={loadingDrafts}
                onDraftClick={(draftId) => {
                    const draft = drafts.find((d) => d.id === draftId);
                    if (draft) {
                        setEditingDraftId(draftId);
                        setDraftsDrawerOpen(false);
                        setCreatePostOpen(true);
                    }
                }}
            />
        </div >
    );
};

export default NewsAndUpdates;
