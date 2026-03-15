import React from 'react';
import type { Post } from './types';
import PostCard from './PostCard';

interface PinnedPostsSidebarProps {
    pinnedPosts: Post[];
    onViewPost?: (postId: string) => void;
    onPinToggle?: (postId: string) => void;
    pinningPostId?: string | null;
}

const PinnedPostsSidebar: React.FC<PinnedPostsSidebarProps> = ({
    pinnedPosts,
    onViewPost,
    onPinToggle,
    pinningPostId,
}) => {
    return (
        <aside className="flex-1 flex flex-col bg-transparent overflow-y-auto">
            <div className="flex-1 pb-2">
                <div className="flex flex-col gap-5">
                    {pinnedPosts.length > 0 ? (
                        pinnedPosts.map((post) => (
                            <PostCard
                                compact={true}
                                key={post.id}
                                post={post}
                                isPinning={pinningPostId === post.id}
                                onViewPost={onViewPost}
                                onPinToggle={onPinToggle}
                            />
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-[#535352] text-sm">No pinned posts</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default PinnedPostsSidebar;

