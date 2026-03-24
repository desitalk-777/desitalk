import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function UserHoverCard({ username, name, avatar, children }) {
  const [show, setShow] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user: me, isAuthenticated } = useAuthStore();
  const timerRef = useRef(null);
  const cardRef = useRef(null);

  const loadProfile = async () => {
    if (profile) return;
    try {
      const res = await userAPI.getProfile(username);
      setProfile(res.data.data);
      setIsFollowing(res.data.data.isFollowing);
    } catch {}
  };

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setShow(true);
      loadProfile();
    }, 400);
  };

  const handleMouseLeave = () => {
    clearTimeout(timerRef.current);
    setTimeout(() => setShow(false), 200);
  };

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Login to follow'); return; }
    setLoading(true);
    try {
      await userAPI.toggleFollow(profile._id);
      setIsFollowing(prev => !prev);
      toast.success(isFollowing ? 'Unfollowed' : 'Following! 🎉');
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  return (
    <span className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {show && (
        <div ref={cardRef} className="user-hover-card absolute left-0 top-6 z-50" style={{ minWidth: '220px' }}>
          <div className="flex items-center gap-3 mb-3">
            {(profile?.avatar || avatar) ? (
              <img src={profile?.avatar || avatar} alt={name} className="w-12 h-12 rounded-full object-cover ring-2" style={{ ringColor: 'var(--saffron)' }} />
            ) : (
              <div className="w-12 h-12 rounded-full gradient-saffron flex items-center justify-center text-white font-bold text-lg">
                {(name || username)?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-bold text-sm flex items-center gap-1">
                {profile?.name || name}
                {profile?.isPremium && <span className="text-xs">⭐</span>}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>u/{username}</div>
            </div>
          </div>

          {profile && (
            <div className="flex gap-3 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              <span><strong className="text-[var(--text-primary)]">{profile.karma || 0}</strong> karma</span>
              <span><strong className="text-[var(--text-primary)]">{profile.followerCount || 0}</strong> followers</span>
              <span><strong className="text-[var(--text-primary)]">{profile.postCount || 0}</strong> posts</span>
            </div>
          )}

          {profile?.bio && (
            <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{profile.bio}</p>
          )}

          <div className="flex gap-2">
            <Link to={`/u/${username}`}
              className="flex-1 text-center text-xs font-bold py-1.5 rounded-full border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              View Profile
            </Link>
            {me && me.username !== username && (
              <button onClick={handleFollow} disabled={loading}
                className={`flex-1 text-xs font-bold py-1.5 rounded-full transition-all ${isFollowing ? 'follow-mini-btn following' : 'follow-mini-btn'}`}>
                {loading ? '...' : isFollowing ? 'Following ✓' : '+ Follow'}
              </button>
            )}
          </div>
        </div>
      )}
    </span>
  );
}
