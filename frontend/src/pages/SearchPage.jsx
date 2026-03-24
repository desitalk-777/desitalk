import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAPI, userAPI } from '../services/api';
import PostCard from '../components/post/PostCard';
import { FiSearch, FiUser } from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

function UserCard({ u }) {
  const { user: me, isAuthenticated } = useAuthStore();
  const [following, setFollowing] = useState(u.isFollowing || false);
  const [loading, setLoading] = useState(false);

  const handleFollow = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Login to follow'); return; }
    setLoading(true);
    try {
      await userAPI.toggleFollow(u._id);
      setFollowing(prev => !prev);
      toast.success(following ? 'Unfollowed' : 'Following! 🎉');
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="card p-4 flex items-center gap-3 hover:border-[var(--saffron)] transition-all">
      <Link to={`/u/${u.username}`} className="flex items-center gap-3 flex-1 min-w-0">
        {u.avatar ? <img src={u.avatar} alt="" className="w-11 h-11 rounded-full object-cover avatar-hover flex-shrink-0" /> :
          <div className="w-11 h-11 rounded-full gradient-saffron flex items-center justify-center text-white font-bold flex-shrink-0">{u.name?.[0]}</div>}
        <div className="min-w-0">
          <div className="font-bold text-sm flex items-center gap-1 truncate">
            {u.name} {u.isPremium && '⭐'} {u.isVerified && <span className="verified-badge">✓</span>}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>u/{u.username} · {u.karma || 0} karma · {u.followerCount || 0} followers</div>
        </div>
      </Link>
      {me && me._id !== u._id && (
        <button onClick={handleFollow} disabled={loading}
          className={`flex-shrink-0 text-xs font-bold px-4 py-1.5 rounded-full transition-all ${following ? 'btn-outline py-1.5' : 'btn-primary py-1.5'}`}>
          {loading ? '...' : following ? 'Following' : '+ Follow'}
        </button>
      )}
    </div>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const [results, setResults] = useState({ posts: [], communities: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [inputVal, setInputVal] = useState(query);

  useEffect(() => {
    setInputVal(query);
    if (!query) return;
    setLoading(true);
    searchAPI.search({ q: query, type }).then(r => {
      setResults(r.data.data || { posts: [], communities: [], users: [] });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [query, type]);

  const tabs = ['all', 'posts', 'communities', 'users'];
  const totalResults = (results.posts?.length || 0) + (results.communities?.length || 0) + (results.users?.length || 0);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputVal.trim()) setSearchParams({ q: inputVal.trim(), type });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 page-enter" style={{ paddingBottom: '80px' }}>
      <form onSubmit={handleSearch} className="relative mb-4">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ color: 'var(--text-muted)' }} size={18} />
        <input
          type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
          placeholder="Search posts, u/username, communities..."
          className="input py-3 text-base"
          style={{ paddingLeft: '3rem', borderRadius: '999px' }}
        />
      </form>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setSearchParams({ q: query, type: t })}
            className={`px-4 py-2 text-sm font-bold capitalize transition-colors border-b-2 -mb-px whitespace-nowrap ${
              type === t ? 'border-[var(--saffron)]' : 'border-transparent'
            }`}
            style={{ color: type === t ? 'var(--saffron)' : 'var(--text-muted)' }}>
            {t} {t !== 'all' && results[t]?.length > 0 && `(${results[t].length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : !query ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-bold text-lg mb-2">Search DesiTalk</p>
          <p style={{ color: 'var(--text-muted)' }}>Search for posts, communities, or users by their username</p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Tip: Type u/username to find a specific person</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Users section */}
          {(type === 'all' || type === 'users') && results.users?.length > 0 && (
            <div>
              {type === 'all' && <h2 className="font-bold mb-3 flex items-center gap-2"><FiUser size={16} /> People</h2>}
              <div className="space-y-2">
                {results.users.map(u => <UserCard key={u._id} u={u} />)}
              </div>
            </div>
          )}

          {/* Posts */}
          {(type === 'all' || type === 'posts') && results.posts?.length > 0 && (
            <div>
              {type === 'all' && <h2 className="font-bold mb-3">Posts</h2>}
              <div className="space-y-3">
                {results.posts.map(post => <PostCard key={post._id} post={post} />)}
              </div>
            </div>
          )}

          {/* Communities */}
          {(type === 'all' || type === 'communities') && results.communities?.length > 0 && (
            <div>
              {type === 'all' && <h2 className="font-bold mb-3">Communities</h2>}
              <div className="space-y-2">
                {results.communities.map(c => (
                  <Link key={c._id} to={`/c/${c.name}`} className="card p-4 flex items-center gap-3 hover:border-[var(--saffron)] transition-all block">
                    {c.avatar ? <img src={c.avatar} alt="" className="w-10 h-10 rounded-full" /> :
                      <div className="w-10 h-10 rounded-full gradient-saffron flex items-center justify-center text-white font-bold">{c.name[0].toUpperCase()}</div>}
                    <div>
                      <div className="font-bold text-sm">c/{c.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.memberCount?.toLocaleString()} members · {c.category}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {totalResults === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">😕</div>
              <p className="font-bold mb-1">No results for "{query}"</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Try searching with different keywords</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
