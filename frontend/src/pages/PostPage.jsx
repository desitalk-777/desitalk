import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { formatDistanceToNow } from 'date-fns';
import { FiArrowUp, FiArrowDown, FiMessageSquare, FiShare2, FiBookmark, FiArrowLeft } from 'react-icons/fi';
import { postAPI, commentAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import CommentItem from '../components/post/CommentItem';
import Sidebar from '../components/common/Sidebar';
import toast from 'react-hot-toast';
import { joinPost, leavePost } from '../services/socket';

export default function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentSort, setCommentSort] = useState('top');
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPost();
    loadComments();
    joinPost(id);
    return () => leavePost(id);
  }, [id]);

  useEffect(() => { if (post) loadComments(); }, [commentSort]);

  const loadPost = async () => {
    try {
      const res = await postAPI.getOne(id);
      setPost(res.data.data);
    } catch { navigate('/'); }
    finally { setIsLoading(false); }
  };

  const loadComments = async () => {
    try {
      const res = await commentAPI.getByPost(id, { sort: commentSort });
      setComments(res.data.data || []);
    } catch {}
  };

  const handleVote = async (type) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const res = await postAPI.vote(post._id, type);
    setPost(prev => ({ ...prev, ...res.data.data }));
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await commentAPI.create({ postId: post._id, content: newComment.trim() });
      setComments(prev => [res.data.data, ...prev]);
      setPost(prev => ({ ...prev, commentCount: (prev.commentCount || 0) + 1 }));
      setNewComment('');
      toast.success('Comment posted! 🎉');
    } catch { toast.error('Failed to post comment'); }
    finally { setIsSubmitting(false); }
  };

  if (isLoading) return (
    <div className="content-grid">
      <div className="space-y-4">
        {[1, 2].map(i => <div key={i} className="card p-6 animate-pulse space-y-3"><div className="h-4 bg-[var(--bg-hover)] rounded w-1/4" /><div className="h-8 bg-[var(--bg-hover)] rounded w-3/4" /><div className="h-24 bg-[var(--bg-hover)] rounded" /></div>)}
      </div>
      <div className="sidebar-col"><Sidebar /></div>
    </div>
  );

  if (!post) return null;

  return (
    <>
      <Helmet>
        <title>{post.title} - DesiTalk</title>
        <meta name="description" content={post.content?.substring(0, 160)} />
      </Helmet>
      <div className="content-grid">
        <main>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 text-sm hover:text-[var(--saffron)] transition-colors" style={{ color: 'var(--text-muted)' }}>
            <FiArrowLeft size={16} /> Back
          </button>

          {/* Post */}
          <div className="card mb-4 overflow-hidden">
            <div className="flex">
              <div className="flex flex-col items-center gap-2 px-3 py-4" style={{ background: 'var(--bg-hover)', minWidth: '52px' }}>
                <button onClick={() => handleVote('up')} className={`vote-btn p-1.5 ${post.userVote === 'up' ? 'active' : ''}`}><FiArrowUp size={20} /></button>
                <span className="text-sm font-bold" style={{ color: post.userVote === 'up' ? 'var(--saffron)' : 'var(--text-primary)' }}>{post.voteScore || 0}</span>
                <button onClick={() => handleVote('down')} className={`vote-btn downvote p-1.5 ${post.userVote === 'down' ? 'active' : ''}`}><FiArrowDown size={20} /></button>
              </div>
              <div className="flex-1 p-5">
                <div className="flex items-center gap-2 flex-wrap mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {post.community && (
                    <Link to={`/c/${post.community.name}`} className="font-bold hover:text-[var(--saffron)] flex items-center gap-1">
                      {post.community.avatar && <img src={post.community.avatar} alt="" className="w-4 h-4 rounded-full" />}
                      c/{post.community.name}
                    </Link>
                  )}
                  <span>Posted by <Link to={`/u/${post.author?.username}`} className="hover:underline">u/{post.author?.username}{post.author?.isPremium && ' ⭐'}</Link></span>
                  <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                  <span>{post.viewCount} views</span>
                </div>
                <h1 className="text-xl font-bold mb-3 leading-snug">{post.title}</h1>
                {post.content && <div className="post-body mb-4">{post.content}</div>}
                {post.images?.length > 0 && (
                  <div className={`grid gap-3 mb-4 ${post.images.length > 1 ? 'grid-cols-2' : ''}`}>
                    {post.images.map((img, i) => <img key={i} src={img.url} alt={post.title} className="w-full rounded-lg object-contain max-h-[500px]" />)}
                  </div>
                )}
                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map(tag => <Link key={tag} to={`/search?q=${tag}&type=posts`} className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--saffron)' }}>#{tag}</Link>)}
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="vote-btn gap-1.5"><FiMessageSquare size={14} /> {post.commentCount} Comments</span>
                  <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Copied!'); }} className="vote-btn gap-1.5"><FiShare2 size={14} /> Share</button>
                  <button onClick={() => postAPI.bookmark(post._id)} className="vote-btn gap-1.5"><FiBookmark size={14} /> Save</button>
                </div>
              </div>
            </div>
          </div>

          {/* Comment form */}
          <div className="card p-4 mb-4">
            {isAuthenticated ? (
              <form onSubmit={handleSubmitComment}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                  Commenting as <span style={{ color: 'var(--saffron)' }}>u/{user?.username}</span>
                </p>
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                  placeholder="Share your thoughts... 🇮🇳" rows={4} className="input resize-none mb-3" maxLength={10000} />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setNewComment('')} className="btn-outline text-sm py-1.5 px-4">Clear</button>
                  <button type="submit" disabled={isSubmitting || !newComment.trim()} className="btn-primary text-sm py-1.5 px-5 disabled:opacity-60">
                    {isSubmitting ? 'Posting...' : 'Comment'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Login to join the conversation</p>
                <Link to="/login" className="btn-primary text-sm">Login to Comment</Link>
              </div>
            )}
          </div>

          {/* Sort comments */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Sort by:</span>
            {['top', 'new', 'old'].map(s => (
              <button key={s} onClick={() => setCommentSort(s)}
                className={`text-xs font-bold px-3 py-1 rounded-full capitalize transition-colors ${commentSort === s ? 'text-white' : ''}`}
                style={{ background: commentSort === s ? 'var(--saffron)' : 'var(--bg-hover)', color: commentSort === s ? '#fff' : 'var(--text-muted)' }}>
                {s}
              </button>
            ))}
            <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>★ = Answer quality rating</span>
          </div>

          {/* Comments */}
          <div className="space-y-1">
            {comments.length === 0 ? (
              <div className="card text-center py-10" style={{ color: 'var(--text-muted)' }}>
                <div className="text-3xl mb-2">💬</div>
                <p>No comments yet. Be the first!</p>
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment._id} className="card px-3 py-2">
                  <CommentItem comment={comment} postId={post._id} depth={0}
                    onReplyAdded={() => loadComments()} />
                </div>
              ))
            )}
          </div>
        </main>

        <div className="sidebar-col">
          <div className="sidebar-sticky"><Sidebar /></div>
        </div>
      </div>
    </>
  );
}
