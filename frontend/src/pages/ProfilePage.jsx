import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { userAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import PostCard from '../components/post/PostCard';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: me } = useAuthStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const res = await userAPI.getProfile(username);
      setIsFollowing(res.data.data.isFollowing || false);
      setFollowerCount(res.data.data.followerCount || 0);
      return res.data.data;
    }
  });

  // Fix: use separate query for posts so they load independently
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', username],
    queryFn: async () => {
      const res = await userAPI.getUserPosts(username, { limit: 20 });
      return res.data.data || [];
    },
    enabled: !!username
  });

  const handleFollow = async () => {
    if (!me) { toast.error('Please login first'); return; }
    try {
      await userAPI.toggleFollow(profile._id);
      setIsFollowing(prev => !prev);
      setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);
      toast.success(isFollowing ? 'Unfollowed' : 'Following! 🎉');
    } catch { toast.error('Failed'); }
  };

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      {[1, 2].map(i => <div key={i} className="card p-6 h-24 skeleton" />)}
    </div>
  );

  if (!profile) return <div className="text-center py-20">User not found</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 page-enter" style={{ paddingBottom: '80px' }}>
      {/* Profile Card */}
      <div className="card p-5 sm:p-6 mb-4">
        <div className="flex items-start gap-4">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.name} className="w-16 sm:w-20 h-16 sm:h-20 rounded-full object-cover ring-4 avatar-hover flex-shrink-0" style={{ '--tw-ring-color': 'var(--saffron)' }} />
          ) : (
            <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full gradient-saffron flex items-center justify-center text-white text-2xl sm:text-3xl font-bold flex-shrink-0">
              {profile.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold">{profile.name}</h1>
              {profile.isVerified && <span className="verified-badge">✓</span>}
              {profile.isPremium && <span className="premium-badge text-sm">⭐ Premium</span>}
              {profile.role === 'admin' && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold">Admin</span>}
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>u/{profile.username}</p>
            {profile.bio && <p className="text-sm mt-2">{profile.bio}</p>}
            <div className="flex flex-wrap gap-3 sm:gap-4 mt-3 text-sm">
              <span><strong>{profile.karma || 0}</strong> <span style={{ color: 'var(--text-muted)' }}>karma</span></span>
              <span><strong>{followerCount}</strong> <span style={{ color: 'var(--text-muted)' }}>followers</span></span>
              <span><strong>{profile.followingCount || 0}</strong> <span style={{ color: 'var(--text-muted)' }}>following</span></span>
              <span><strong>{posts.length}</strong> <span style={{ color: 'var(--text-muted)' }}>posts</span></span>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {me && me._id !== profile._id && (
                <button onClick={handleFollow}
                  className={`text-sm py-1.5 px-5 rounded-full font-bold transition-all ${isFollowing ? 'btn-outline' : 'btn-primary'}`}>
                  {isFollowing ? 'Following ✓' : '+ Follow'}
                </button>
              )}
              {me && me._id === profile._id && (
                <Link to="/settings" className="btn-outline text-sm py-1.5 px-5">Edit Profile</Link>
              )}
              {profile.socialLinks?.youtube && (
                <a href={profile.socialLinks.youtube} target="_blank" rel="noreferrer"
                  className="text-xs px-3 py-1.5 rounded-full border font-semibold"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>▶ YouTube</a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold text-base">Posts</h2>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{posts.length} posts</span>
      </div>

      {postsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="card h-28 skeleton" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">📝</div>
          <p style={{ color: 'var(--text-muted)' }}>
            {me?._id === profile._id ? "You haven't posted yet. Create your first post!" : "No posts yet"}
          </p>
          {me?._id === profile._id && (
            <Link to="/create-post" className="btn-primary mt-4 inline-flex">+ Create Post</Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => <PostCard key={post._id} post={post} />)}
        </div>
      )}
    </div>
  );
}
