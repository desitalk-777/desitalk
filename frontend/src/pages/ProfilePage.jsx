// ProfilePage.jsx
import { useState } from 'react';
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

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => userAPI.getProfile(username).then(r => { setIsFollowing(r.data.data.isFollowing); return r.data.data; })
  });

  const { data: posts } = useQuery({
    queryKey: ['user-posts', username],
    queryFn: () => userAPI.getUserPosts(username).then(r => r.data.data)
  });

  const handleFollow = async () => {
    try {
      await userAPI.toggleFollow(profile._id);
      setIsFollowing(prev => !prev);
      toast.success(isFollowing ? 'Unfollowed' : 'Following! 🎉');
    } catch { toast.error('Failed'); }
  };

  if (isLoading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;
  if (!profile) return <div className="text-center py-20">User not found</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="card p-6 mb-4">
        <div className="flex items-start gap-4">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.name} className="w-20 h-20 rounded-full object-cover ring-4" style={{ ringColor: 'var(--saffron)' }} />
          ) : (
            <div className="w-20 h-20 rounded-full gradient-saffron flex items-center justify-center text-white text-3xl font-bold">{profile.name[0]}</div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{profile.name}</h1>
              {profile.isVerified && <span className="verified-badge">✓</span>}
              {profile.isPremium && <span className="premium-badge text-sm">⭐ Premium</span>}
              {profile.role === 'admin' && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold">Admin</span>}
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>u/{profile.username}</p>
            {profile.bio && <p className="text-sm mt-2">{profile.bio}</p>}
            <div className="flex gap-4 mt-3 text-sm">
              <span><strong>{profile.karma || 0}</strong> <span style={{ color: 'var(--text-muted)' }}>karma</span></span>
              <span><strong>{profile.followerCount || 0}</strong> <span style={{ color: 'var(--text-muted)' }}>followers</span></span>
              <span><strong>{profile.postCount || 0}</strong> <span style={{ color: 'var(--text-muted)' }}>posts</span></span>
            </div>
            {me && me._id !== profile._id && (
              <button onClick={handleFollow} className={`mt-3 ${isFollowing ? 'btn-outline' : 'btn-primary'} text-sm py-1.5 px-5`}>
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
            {me && me._id === profile._id && (
              <Link to="/settings" className="btn-outline text-sm py-1.5 px-5 mt-3 inline-block">Edit Profile</Link>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {posts?.map(post => <PostCard key={post._id} post={post} />)}
        {posts?.length === 0 && <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No posts yet</div>}
      </div>
    </div>
  );
}
