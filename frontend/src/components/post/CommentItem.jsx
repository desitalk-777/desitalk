import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiArrowUp, FiArrowDown, FiMessageSquare, FiFlag, FiTrash2 } from 'react-icons/fi';
import { commentAPI, notificationAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

// Star Rating Component
function StarRating({ commentId, initialRating, ratingCount, averageRating, onRate }) {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [userRating, setUserRating] = useState(initialRating);
  const { isAuthenticated } = useAuthStore();

  const handleRate = async (stars) => {
    if (!isAuthenticated) { toast.error('Login to rate'); return; }
    try {
      await commentAPI.rate(commentId, stars);
      setUserRating(stars);
      onRate?.(stars);
      toast.success(`Rated ${stars} ⭐`);
    } catch {
      toast.error('Failed to rate');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => handleRate(star)}
            className="star-btn"
            style={{ color: star <= (hoveredStar || userRating || 0) ? '#f7931e' : 'var(--text-muted)' }}
          >
            ★
          </button>
        ))}
      </div>
      {averageRating > 0 && (
        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
          {averageRating.toFixed(1)} ({ratingCount})
        </span>
      )}
    </div>
  );
}

export default function CommentItem({ comment, postId, depth = 0, onReplyAdded }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [voteScore, setVoteScore] = useState(comment.voteScore || 0);
  const [userVote, setUserVote] = useState(comment.userVote);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  const maxDepth = 4;

  const handleVote = async (type) => {
    if (!isAuthenticated) return;
    try {
      const res = await commentAPI.vote(comment._id, type);
      setVoteScore(res.data.data.voteScore);
      setUserVote(res.data.data.userVote);
    } catch {}
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await commentAPI.create({
        postId,
        content: replyContent.trim(),
        parentId: comment._id
      });
      setReplyContent('');
      setShowReplyForm(false);
      onReplyAdded?.(res.data.data);
      toast.success('Reply added!');
    } catch {
      toast.error('Failed to add reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await commentAPI.delete(comment._id);
      toast.success('Comment deleted');
    } catch {}
  };

  const canDelete = user && (user._id === comment.author?._id || user.role === 'admin');
  const indentColors = ['#ff6b35', '#7193ff', '#44b66a', '#ff9033', '#c94aff'];
  const indentColor = indentColors[depth % indentColors.length];

  return (
    <div className={`${depth > 0 ? 'ml-4 pl-3 border-l-2' : ''} fade-in`}
      style={{ borderColor: depth > 0 ? `${indentColor}40` : 'transparent' }}>

      {/* Comment header */}
      <div className="flex items-start gap-2 py-2">
        <button onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-1 text-xs flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}>
          {isCollapsed ? '▶' : '▼'}
        </button>

        <div className="flex-1 min-w-0">
          {/* Author info */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link to={`/u/${comment.author?.username}`} className="flex items-center gap-1.5">
              {comment.author?.avatar ? (
                <img src={comment.author.avatar} alt="" className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full gradient-saffron" />
              )}
              <span className="text-xs font-bold hover:text-[var(--saffron)] transition-colors">
                u/{comment.author?.username}
                {comment.author?.isPremium && ' ⭐'}
              </span>
            </Link>

            {comment.averageRating > 0 && (
              <div className="trending-badge gap-0.5">
                {'★'.repeat(Math.round(comment.averageRating))}
                <span className="ml-1">{comment.averageRating.toFixed(1)}</span>
              </div>
            )}

            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
            {comment.isEdited && (
              <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>(edited)</span>
            )}
          </div>

          {!isCollapsed && (
            <>
              {/* Comment content */}
              <div className="text-sm post-body mb-2">{comment.content}</div>

              {/* Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Vote */}
                <div className="flex items-center gap-1">
                  <button onClick={() => handleVote('up')}
                    className={`vote-btn py-0.5 px-1 ${userVote === 'up' ? 'active' : ''}`}>
                    <FiArrowUp size={12} />
                  </button>
                  <span className="text-xs font-bold" style={{
                    color: userVote === 'up' ? 'var(--saffron)' : userVote === 'down' ? '#7193ff' : 'var(--text-muted)'
                  }}>
                    {voteScore}
                  </span>
                  <button onClick={() => handleVote('down')}
                    className={`vote-btn downvote py-0.5 px-1 ${userVote === 'down' ? 'active' : ''}`}>
                    <FiArrowDown size={12} />
                  </button>
                </div>

                {/* Star rating */}
                <StarRating
                  commentId={comment._id}
                  initialRating={comment.userRating}
                  ratingCount={comment.ratingCount}
                  averageRating={comment.averageRating}
                />

                {/* Reply button */}
                {depth < maxDepth && isAuthenticated && (
                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="vote-btn gap-1 text-xs px-1.5 py-0.5"
                  >
                    <FiMessageSquare size={11} /> Reply
                  </button>
                )}

                {canDelete && (
                  <button onClick={handleDelete} className="vote-btn text-xs px-1.5 py-0.5 text-red-400">
                    <FiTrash2 size={11} />
                  </button>
                )}
              </div>

              {/* Reply form */}
              {showReplyForm && (
                <form onSubmit={handleReply} className="mt-2 fade-in">
                  <textarea
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    placeholder={`Reply to u/${comment.author?.username}...`}
                    rows={3}
                    className="input text-sm resize-none mb-2"
                    maxLength={10000}
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={isSubmitting || !replyContent.trim()}
                      className="btn-primary text-xs py-1.5 px-4 disabled:opacity-50">
                      {isSubmitting ? 'Posting...' : 'Reply'}
                    </button>
                    <button type="button" onClick={() => setShowReplyForm(false)}
                      className="btn-outline text-xs py-1.5 px-4">
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Nested replies */}
              {comment.replies?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {comment.replies.map(reply => (
                    <CommentItem
                      key={reply._id}
                      comment={reply}
                      postId={postId}
                      depth={depth + 1}
                      onReplyAdded={onReplyAdded}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
