import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import WelcomePopup from '../news-updates/WelcomePopup';
import type { UpdatesContent, UpdatesVariant } from '../news-updates/types';
import { MessengerProvider } from '../../contexts/MessengerContext';
import { newsService } from '../../services/newsService';
import { formatToDateTimeOffset } from '../../utils/dateUtils';

export type AppLayoutContext = {
  setPageTitle: React.Dispatch<React.SetStateAction<string>>;
};

const customTitles: Record<string, string> = {
  '/news-and-updates': 'News & Updates',
  '/settings': 'Settings',
};
const NEWS_FLASH_CACHE_KEY = 'news_flash_popup_cache_v1';

const titleFromPathname = (pathname: string) => {
  if (customTitles[pathname]) {
    return customTitles[pathname];
  }

  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments.pop();

  if (!lastSegment) {
    return 'Dashboard';
  }

  return lastSegment
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pageTitle, setPageTitle] = React.useState(() =>
    titleFromPathname(location.pathname)
  );
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [welcomePopupOpen, setWelcomePopupOpen] = React.useState(false);
  const [isWelcomePopupRefreshing, setIsWelcomePopupRefreshing] = React.useState(false);
  const [welcomePopupItems, setWelcomePopupItems] = React.useState<Array<{
    postId: string;
    content: UpdatesContent;
    allowReactions: boolean;
    ctaName?: string;
    ctaLink?: string;
  }>>([]);
  const [welcomePopupIndex, setWelcomePopupIndex] = React.useState(0);
  const newsFlashRequestAbortRef = React.useRef<AbortController | null>(null);

  const stripHtml = React.useCallback((value?: string | null): string => {
    if (!value) return '';
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }, []);

  const clampText = React.useCallback((value: string, max: number) => {
    if (!value) return '';
    if (value.length <= max) return value;
    return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}...`;
  }, []);

  const getSafeImageUrl = React.useCallback((raw?: string | null) => {
    if (!raw) return undefined;
    const value = raw.trim();
    if (!value) return undefined;

    // Allow absolute http(s), site-relative paths, blob, and data URIs.
    if (
      value.startsWith('http://') ||
      value.startsWith('https://') ||
      value.startsWith('/') ||
      value.startsWith('blob:') ||
      value.startsWith('data:image/')
    ) {
      return value;
    }
    return undefined;
  }, []);

  const loadWelcomePopupItems = React.useCallback(async () => {
    newsFlashRequestAbortRef.current?.abort();
    const controller = new AbortController();
    newsFlashRequestAbortRef.current = controller;
    setIsWelcomePopupRefreshing(true);

    try {
      const response = await newsService.getNewsFlashInfo(formatToDateTimeOffset(new Date()), controller.signal);
      const items = (response.result?.items || [])
        .map((item) => ({
          postId: String(item.newsId),
          content: {
            title: clampText(item.title || 'News & Updates', 80),
            content: clampText(
              stripHtml(item.description) || item.title || 'News & Updates',
              260
            ),
            userName: clampText(item.createdByName || item.createdBy || 'Westford Connect', 42),
            userRole: clampText(item.createdByDesignation || 'Staff', 32),
            avatar: getSafeImageUrl(
              (item as any).loginUserProfileImageUrl ||
              (item as any).authorImage ||
              (item as any).createdByProfileImageUrl ||
              (item as any).profileImageUrl ||
              null
            ),
          },
          allowReactions: item.allowReactions === true,
          ctaName: clampText((item as any).cta || (item as any).CTA || '', 18) || undefined,
          ctaLink: (item as any).catLink || (item as any).ctaLink || (item as any).CTALink || undefined,
        }));

      setWelcomePopupItems(items);
      setWelcomePopupIndex((prev) => {
        if (!items.length) return 0;
        return Math.min(prev, items.length - 1);
      });

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(NEWS_FLASH_CACHE_KEY, JSON.stringify(items));
      }
      return items;
    } catch (error) {
      if (!(error instanceof Error) || error.name !== 'CanceledError') {
        console.error('Failed to load news flash for sidebar popup:', error);
      }
      // Keep existing items to avoid flicker; do not reset list on fetch error.
      return [];
    } finally {
      if (newsFlashRequestAbortRef.current === controller) {
        newsFlashRequestAbortRef.current = null;
      }
      setIsWelcomePopupRefreshing(false);
    }
  }, [clampText, getSafeImageUrl, stripHtml]);

  const hasWelcomePopupItems = welcomePopupItems.length > 0;
  const hasWelcomePopupPrevious = welcomePopupIndex > 0;
  const hasWelcomePopupNext = welcomePopupIndex < welcomePopupItems.length - 1;
  const currentWelcomePopupItem = hasWelcomePopupItems ? welcomePopupItems[welcomePopupIndex] : undefined;
  const currentHasCta = Boolean(
    currentWelcomePopupItem?.ctaName &&
    currentWelcomePopupItem?.ctaLink
  );
  const welcomePopupVariant: UpdatesVariant = currentHasCta
    ? 'Variant3'
    : (hasWelcomePopupPrevious ? 'Variant2' : 'Default');

  const handleToggleSidebar = React.useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleCloseSidebar = React.useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleOpenWelcomePopup = React.useCallback(async () => {
    setIsSidebarOpen(false);
    setWelcomePopupOpen(true);
    setWelcomePopupIndex(0);

    await loadWelcomePopupItems();
  }, [loadWelcomePopupItems]);

  const handleWelcomePopupNext = React.useCallback(() => {
    setWelcomePopupIndex((prev) => {
      if (prev >= welcomePopupItems.length - 1) return prev;
      return prev + 1;
    });
  }, [welcomePopupItems.length]);

  const handleWelcomePopupPrevious = React.useCallback(() => {
    setWelcomePopupIndex((prev) => (prev <= 0 ? 0 : prev - 1));
  }, []);

  const handleWelcomePopupReaction = React.useCallback((type: 'celebrate' | 'applaud' | 'support') => {
    // TODO: Handle reaction
    console.log('Reaction clicked:', type);
  }, []);

  const handleWelcomePopupComment = React.useCallback((comment: string) => {
    // TODO: Handle comment submission
    console.log('Comment submitted:', comment);
  }, []);

  const getSafeHttpUrl = React.useCallback((raw?: string) => {
    if (!raw) return null;
    try {
      const url = new URL(raw);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return null;
      }
      return url.toString();
    } catch {
      return null;
    }
  }, []);

  const handleWelcomePopupLearnMore = React.useCallback(() => {
    if (!currentWelcomePopupItem) return;
    const safeUrl = getSafeHttpUrl(currentWelcomePopupItem.ctaLink);
    if (safeUrl) {
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setWelcomePopupOpen(false);
    navigate('/news-and-updates', {
      state: {
        focusPostId: currentWelcomePopupItem.postId,
      },
    });
  }, [currentWelcomePopupItem, getSafeHttpUrl, navigate]);

  React.useEffect(() => {
    setPageTitle(titleFromPathname(location.pathname));
  }, [location.pathname]);

  React.useEffect(() => {
    return () => {
      newsFlashRequestAbortRef.current?.abort();
    };
  }, []);

  React.useEffect(() => {
    void loadWelcomePopupItems();
  }, [loadWelcomePopupItems]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return () => undefined;
    }

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsSidebarOpen(false);
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const outletContext = React.useMemo<AppLayoutContext>(
    () => ({ setPageTitle }),
    [setPageTitle]
  );

  return (
    <MessengerProvider>
      <div className="relative h-screen overflow-hidden bg-[#E0E3E7] lg:flex">
        <Sidebar isMobileOpen={isSidebarOpen} onNavigate={handleCloseSidebar} onHamburgerClick={handleOpenWelcomePopup} />

      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden cursor-pointer"
          onClick={handleCloseSidebar}
        />
      ) : null}

      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <Header title={pageTitle} onToggleSidebar={handleToggleSidebar} />
        <main className="flex-1 px-4 py-3.5 sm:px-6 lg:px-[15px] max-h-[calc(100dvh-64px)]">
          <Outlet context={outletContext} />
        </main>
      </div>

      {/* Welcome Popup */}
      <WelcomePopup
        isOpen={welcomePopupOpen}
        onClose={() => setWelcomePopupOpen(false)}
        variant={welcomePopupVariant}
        content={currentWelcomePopupItem?.content}
        showReactions={currentWelcomePopupItem?.allowReactions}
        ctaLabel={isWelcomePopupRefreshing ? 'Updating...' : currentWelcomePopupItem?.ctaName}
        onNext={hasWelcomePopupNext ? handleWelcomePopupNext : undefined}
        onPrevious={hasWelcomePopupPrevious ? handleWelcomePopupPrevious : undefined}
        onReactionClick={handleWelcomePopupReaction}
        onCommentSubmit={handleWelcomePopupComment}
        onLearnMore={currentWelcomePopupItem ? handleWelcomePopupLearnMore : undefined}
        isLoading={isWelcomePopupRefreshing}
      />
      </div>
    </MessengerProvider>
  );
};

export default AppLayout;
