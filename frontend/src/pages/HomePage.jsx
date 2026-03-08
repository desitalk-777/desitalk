import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Helmet } from 'react-helmet-async';
import PostCard from '../components/post/PostCard';
import Sidebar from '../components/common/Sidebar';
import { postAPI } from '../services/api';
import { FiHome, FiTrendingUp, FiClock, FiZap } from 'react-icons/fi';
import { motion } from 'framer-motion';

const SORTS = [
  { key: 'hot', label: 'Hot', icon: FiTrendingUp },
  { key: 'new', label: 'New', icon: FiClock },
  { key: 'top', label: 'Top', icon: FiZap },
  { key: 'rising', label: 'Rising', icon: FiHome }
];

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState('hot');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });

  const fetchPosts = async (pageNum = 1, sortType = sort, reset = false) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await postAPI.getAll({ page: pageNum, limit: 20, sort: sortType });
      const newPosts = res.data.data || [];
      setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      setHasMore(newPosts.length === 20);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    setIsInitialLoading(true);
    fetchPosts(1, sort, true);
  }, [sort]);

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      fetchPosts(page + 1, sort, false);
    }
  }, [inView]);

  const handleDeletePost = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  return (
    <>
      <Helmet>
        <title>DesiTalk - India's Discussion Platform</title>
      </Helmet>

      <div className="content-grid">
        {/* Main feed */}
        <main>
          {/* Sort tabs */}
          <div className="card p-2 mb-4 flex items-center gap-1">
            {SORTS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 flex-1 justify-center ${
                  sort === key
                    ? 'text-white'
                    : 'hover:bg-[var(--bg-hover)]'
                }`}
                style={sort === key ? {
                  background: 'var(--saffron)',
                  color: '#fff'
                } : { color: 'var(--text-muted)' }}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Posts */}
          <div className="space-y-3">
            {isInitialLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-10 rounded-lg bg-[var(--bg-hover)] h-20" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-[var(--bg-hover)] rounded w-1/4" />
                      <div className="h-5 bg-[var(--bg-hover)] rounded w-3/4" />
                      <div className="h-3 bg-[var(--bg-hover)] rounded w-full" />
                      <div className="h-3 bg-[var(--bg-hover)] rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🇮🇳</div>
                <h2 className="text-xl font-bold mb-2">No posts yet</h2>
                <p style={{ color: 'var(--text-muted)' }}>Be the first to post something!</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  onDelete={handleDeletePost}
                />
              ))
            )}

            {/* Load more trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center py-4">
                {isLoading && (
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <div className="spinner w-5 h-5 border-2" />
                    <span className="text-sm">Loading more...</span>
                  </div>
                )}
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  🎉 You've seen all posts! You're all caught up.
                </p>
              </motion.div>
            )}
          </div>
        </main>

        {/* Sidebar */}
        <div className="sidebar-col">
          <div className="sidebar-sticky">
            <Sidebar />
          </div>
        </div>
      </div>
    </>
  );
}
