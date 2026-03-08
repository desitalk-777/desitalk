import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { communityAPI, postAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import PostCard from '../components/post/PostCard';
import toast from 'react-hot-toast';

export default function CommunityPage() {
  const { name } = useParams();
  const { user } = useAuthStore();
  const [isMember, setIsMember] = useState(false);
  const [posts, setPosts] = useState([]);

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', name],
    queryFn: () => communityAPI.getOne(name).then(r => { setIsMember(r.data.data.isMember); return r.data.data; })
  });

  useQuery({
    queryKey: ['community-posts', name],
    queryFn: () => postAPI.getAll({ community: community?._id, limit: 20 }).then(r => { setPosts(r.data.data); return r.data.data; }),
    enabled: !!community?._id
  });

  const handleJoin = async () => {
    if (!user) { toast.error('Please login first'); return; }
    try {
      await communityAPI.toggleMembership(community._id);
      setIsMember(prev => !prev);
      toast.success(isMember ? 'Left community' : 'Joined! 🎉');
    } catch { toast.error('Failed'); }
  };

  if (isLoading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;
  if (!community) return <div className="text-center py-20">Community not found</div>;

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Banner */}
      <div className="h-32 rounded-b-lg overflow-hidden mb-4" style={{ background: community.banner ? undefined : 'linear-gradient(135deg,#ff6b35,#f7931e)' }}>
        {community.banner && <img src={community.banner} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="content-grid">
        <main>
          <div className="space-y-3">
            {posts.map(post => <PostCard key={post._id} post={post} />)}
            {posts.length === 0 && <div className="text-center py-12 card" style={{ color: 'var(--text-muted)' }}>No posts yet. Be the first!</div>}
          </div>
        </main>
        <aside className="sidebar-col">
          <div className="sidebar-sticky">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                {community.avatar ? (
                  <img src={community.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full gradient-saffron flex items-center justify-center text-white text-xl font-bold">{community.name[0].toUpperCase()}</div>
                )}
                <div>
                  <h2 className="font-bold">c/{community.name}</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{community.memberCount?.toLocaleString()} members</p>
                </div>
              </div>
              {community.description && <p className="text-sm mb-4">{community.description}</p>}
              <button onClick={handleJoin} className={`w-full py-2.5 rounded-full font-bold text-sm ${isMember ? 'btn-outline' : 'btn-primary'}`}>
                {isMember ? 'Joined ✓' : 'Join Community'}
              </button>
              {community.rules?.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-bold text-sm mb-2">Community Rules</h3>
                  {community.rules.map((rule, i) => (
                    <div key={i} className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                      <strong>{i+1}. {rule.title}</strong>
                      {rule.description && <p className="mt-0.5">{rule.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
