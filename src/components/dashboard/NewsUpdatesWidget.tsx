import React from 'react';
import DashboardWidget from './DashboardWidget';
import { MacScrollbar } from 'mac-scrollbar';
import { Loader2 } from 'lucide-react';
import PostCard from '../news-updates/PostCard';
import { mockPosts } from '../news-updates/mockData';
import type { Post } from '../news-updates/types';

interface NewsUpdatesWidgetProps {
  posts?: Post[];
  isLoading?: boolean;
  onPostClick?: (postId: string) => void;
  onPinToggle?: (postId: string) => void;
  onReactionClick?: (postId: string, reactionType: 'celebrate' | 'applaud' | 'support') => void;
  onCommentSubmit?: (postId: string, comment: string) => void;
}

const NewsUpdatesWidget: React.FC<NewsUpdatesWidgetProps> = ({
  posts = mockPosts.slice(0, 3), // Show first 3 posts
  isLoading = false,
  onPostClick,
  onPinToggle,
  onReactionClick,
  onCommentSubmit,
}) => {
  return (
    <DashboardWidget title="News & Updates" className="h-[430px] flex flex-col">
      <div className="flex-1 overflow-hidden bg-[#BEC9E3] rounded-[10px] p-2.5 shadow-[0_2px_4px_0_rgba(0,0,0,0.10)]">
        <MacScrollbar className="h-full rounded-[10px]">
          <div className="space-y-2.5">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#008080]" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 text-[#535352]">No posts available</div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  compact={true}
                  onPinToggle={onPinToggle}
                  onReactionClick={onReactionClick}
                  onCommentSubmit={onCommentSubmit}
                  onViewPost={onPostClick}
                />
              ))
            )}
          </div>
        </MacScrollbar>
      </div>
    </DashboardWidget>
  );
};

export default NewsUpdatesWidget;



