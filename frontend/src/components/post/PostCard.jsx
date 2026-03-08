import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  FiArrowUp, FiArrowDown, FiMessageSquare, FiShare2,
  FiBookmark, FiMoreHorizontal, FiFlag, FiTrash2, FiExternalLink
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { postAPI, notificationAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function PostCard({ post: initialPost, compact = false, onDelete }) {
  const [post, setPost] = useState(initialPost);
  const [showMenu, setShowMenu] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handleVote = async (type) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      const currentVote = post.userVote;
      const newVote = currentVote === type ? null : type;

      // Optimistic update
      setPost(prev => ({
        ...prev,
        userVote: newVote,
        voteScore: prev.voteScore +
          (newVote === 'up' ? 1 : newVote === 'down' ? -1 : 0) -
          (currentVote === 'up' ? 1 : currentVote === 'down' ? -1 : 0)
      }));

      const res = await postAPI.vote(post._id, newVote || 'remove');
      setPost(prev => ({ ...prev, ...res.data.data }));
    } catch {
      toast.error('Failed to vote');
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      setIsBookmarked(prev => !prev);
      await postAPI.bookmark(post._id);
      toast.success(isBookmarked ? 'Bookmark removed' : '🔖 Bookmarked!');
    } catch {
      setIsBookmarked(prev => !prev);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/posts/${post.slug || post._id}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'));
  };

  const handleReport = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      await notificationAPI.report({ targetType: 'post', targetId: post._id, reason: 'spam' });
      toast.success('Report submitted');
    } catch {
      toast.error('Failed to report');
    }
    setShowMenu(false);
  };

  const canDelete = user && (user._id === post.author?._id || user.role === 'admin');

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await postAPI.delete(post._id);
      toast.success('Post deleted');
      onDelete?.(post._id);
    } catch {
      toast.error('Failed to delete');
    }
    setShowMenu(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card hover:border-[var(--text-muted)] transition-all duration-150 overflow-hidden"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Vote bar on left */}
      <div className="flex">
        <div className="flex flex-col items-center gap-1 px-2 py-3 rounded-l-lg"
          style={{ background: 'var(--bg-hover)', minWidth: '40px' }}>
          <button
            onClick={() => handleVote('up')}
            className={`vote-btn flex-col ${post.userVote === 'up' ? 'active' : ''}`}
          >
            <FiArrowUp size={18} />
          </button>
          <span className="text-xs font-bold"
            style={{ color: post.userVote === 'up' ? 'var(--saffron)' : post.userVote === 'down' ? '#7193ff' : 'var(--text-primary)' }}>
            {post.voteScore || 0}
          </span>
          <button
            onClick={() => handleVote('down')}
            className={`vote-btn downvote flex-col ${post.userVote === 'down' ? 'active' : ''}`}
          >
            <FiArrowDown size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 min-w-0">
          {/* Meta line */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {post.community && (
              <Link to={`/c/${post.community.name}`}
                className="flex items-center gap-1.5 hover:underline">
                {post.community.avatar ? (
                  <img src={post.community.avatar} alt="" className="w-4 h-4 rounded-full" />
                ) : (
                  <div className="w-4 h-4 rounded-full gradient-saffron" />
                )}
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  c/{post.community.name}
                </span>
              </Link>
            )}
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Posted by{' '}
              <Link to={`/u/${post.author?.username}`} className="hover:underline">
                u/{post.author?.username}
                {post.author?.isPremium && ' ⭐'}
                {post.author?.isVerified && ' ✓'}
              </Link>
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
            {post.isPinned && (
              <span className="text-xs px-1.5 py-0.5 rounded text-green-400" style={{ background: 'rgba(19, 136, 8, 0.1)' }}>
                📌 Pinned
              </span>
            )}
          </div>

          {/* Title */}
          <Link to={`/posts/${post.slug || post._id}`}>
            <h2 className="font-bold text-base leading-snug mb-2 hover:text-[var(--saffron)] transition-colors">
              {post.isNSFW && <span className="text-red-400 text-xs mr-1 font-bold">[NSFW]</span>}
              {post.isSpoiler && <span className="text-yellow-400 text-xs mr-1 font-bold">[Spoiler]</span>}
              {post.title}
            </h2>
          </Link>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {post.tags.map(tag => (
                <Link key={tag} to={`/search?q=${tag}&type=posts`}
                  className="text-xs px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                  style={{ background: 'rgba(255, 107, 53, 0.1)', color: 'var(--saffron)' }}>
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Content preview */}
          {!compact && post.content && (
            <p className="text-sm mb-2 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
              {post.content}
            </p>
          )}

          {/* Images */}
          {post.images?.length > 0 && (
            <div className={`grid gap-2 mb-2 ${post.images.length === 1 ? '' : 'grid-cols-2'}`}>
              {post.images.slice(0, 4).map((img, i) => (
                <Link key={i} to={`/posts/${post.slug || post._id}`}>
                  <img
                    src={img.url} alt={img.alt || post.title}
                    className="w-full rounded-lg object-cover max-h-80"
                    loading="lazy"
                  />
                </Link>
              ))}
            </div>
          )}

          {/* External link */}
          {post.externalLink?.url && (
            <a href={post.externalLink.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg text-sm hover:opacity-80 mb-2"
              style={{ background: 'var(--bg-hover)', color: 'var(--saffron)' }}>
              <FiExternalLink size={14} />
              <span className="truncate">{post.externalLink.title || post.externalLink.url}</span>
            </a>
          )}

          {/* Action bar */}
          <div className="flex items-center gap-1 flex-wrap mt-2">
            <Link to={`/posts/${post.slug || post._id}`}
              className="vote-btn gap-1.5 px-2 py-1.5">
              <FiMessageSquare size={14} />
              <span className="text-xs">{post.commentCount || 0} Comments</span>
            </Link>

            <button onClick={handleShare} className="vote-btn gap-1.5 px-2 py-1.5">
              <FiShare2 size={14} />
              <span className="text-xs">Share</span>
            </button>

            <button onClick={handleBookmark}
              className={`vote-btn gap-1.5 px-2 py-1.5 ${isBookmarked ? 'active' : ''}`}>
              <FiBookmark size={14} />
              <span className="text-xs">{isBookmarked ? 'Saved' : 'Save'}</span>
            </button>

            {/* More menu */}
            <div className="relative ml-auto">
              <button onClick={() => setShowMenu(!showMenu)}
                className="vote-btn p-1.5">
                <FiMoreHorizontal size={14} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 card shadow-lg z-20 overflow-hidden">
                  <button onClick={handleReport}
                    className="flex items-center gap-2 px-3 py-2 text-xs w-full hover:bg-[var(--bg-hover)] transition-colors text-left"
                    style={{ color: 'var(--text-primary)' }}>
                    <FiFlag size={12} /> Report
                  </button>
                  {canDelete && (
                    <button onClick={handleDelete}
                      className="flex items-center gap-2 px-3 py-2 text-xs w-full hover:bg-[var(--bg-hover)] transition-colors text-left text-red-400">
                      <FiTrash2 size={12} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
