import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { communityAPI, postAPI } from '../../services/api';
import { FiTrendingUp, FiUsers, FiStar } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';

export default function Sidebar() {
  const { user } = useAuthStore();

  const { data: popularCommunities } = useQuery({
    queryKey: ['popular-communities'],
    queryFn: () => communityAPI.getPopular().then(r => r.data.data),
    staleTime: 5 * 60 * 1000
  });

  const { data: trending } = useQuery({
    queryKey: ['trending-posts'],
    queryFn: () => postAPI.trending({ hours: 24 }).then(r => r.data.data),
    staleTime: 2 * 60 * 1000
  });

  return (
    <aside className="space-y-4">
      {/* Premium CTA */}
      {user && !user.isPremium && (
        <div className="card p-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 gradient-saffron" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <FiStar className="text-[var(--saffron)]" />
              <span className="font-bold text-sm">DesiTalk Premium</span>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Get verified badge, create communities, and more for just ₹89/month
            </p>
            <Link to="/premium" className="btn-primary text-xs w-full text-center block">
              Upgrade Now ✨
            </Link>
          </div>
        </div>
      )}

      {/* Popular Communities */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <FiUsers size={16} style={{ color: 'var(--saffron)' }} />
          <h3 className="font-bold text-sm">Popular Communities</h3>
        </div>
        <div className="space-y-2">
          {popularCommunities?.slice(0, 8).map((c, i) => (
            <Link
              key={c._id}
              to={`/c/${c.name}`}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors group"
            >
              <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--text-muted)' }}>
                {i + 1}
              </span>
              {c.avatar ? (
                <img src={c.avatar} alt={c.name} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full gradient-saffron flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {c.name[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate group-hover:text-[var(--saffron)] transition-colors">
                  c/{c.name}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {c.memberCount?.toLocaleString()} members
                </div>
              </div>
            </Link>
          ))}
        </div>
        <Link to="/communities" className="btn-outline text-xs w-full text-center block mt-3 py-2">
          View All
        </Link>
      </div>

      {/* Trending Posts */}
      {trending?.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <FiTrendingUp size={16} style={{ color: 'var(--saffron)' }} />
            <h3 className="font-bold text-sm">Trending Today</h3>
          </div>
          <div className="space-y-3">
            {trending.slice(0, 5).map((post, i) => (
              <Link key={post._id} to={`/posts/${post.slug || post._id}`}
                className="flex gap-2.5 group">
                <span className="text-xl font-display font-bold leading-none mt-0.5 w-5 text-center flex-shrink-0"
                  style={{ color: 'var(--saffron)', opacity: 1 - (i * 0.15) }}>
                  {i + 1}
                </span>
                <div>
                  <p className="text-xs font-semibold line-clamp-2 group-hover:text-[var(--saffron)] transition-colors leading-tight">
                    {post.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {post.voteScore} points · {post.commentCount} comments
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Footer links */}
      <div className="text-xs px-2" style={{ color: 'var(--text-muted)' }}>
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          {['Help', 'About', 'Careers', 'Privacy', 'Terms', 'Rules'].map(l => (
            <Link key={l} to="#" className="hover:underline">{l}</Link>
          ))}
        </div>
        <p className="mt-2">DesiTalk © 2025. Made with 🇮🇳 in India</p>
      </div>
    </aside>
  );
}
