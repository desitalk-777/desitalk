import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAPI } from '../services/api';
import PostCard from '../components/post/PostCard';
import { FiSearch } from 'react-icons/fi';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const [results, setResults] = useState({ posts: [], communities: [], users: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    searchAPI.search({ q: query, type }).then(r => {
      setResults(r.data.data || { posts: [], communities: [], users: [] });
    }).finally(() => setLoading(false));
  }, [query, type]);

  const tabs = ['all', 'posts', 'communities', 'users'];
  const totalResults = (results.posts?.length || 0) + (results.communities?.length || 0) + (results.users?.length || 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="relative mb-4">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} size={18} />
        <input
          type="text"
          defaultValue={query}
          onKeyDown={e => { if (e.key === 'Enter') setSearchParams({ q: e.target.value, type }); }}
          placeholder="Search posts, communities, users..."
          className="input pl-12 py-3 text-base"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setSearchParams({ q: query, type: t })}
            className={`px-4 py-2 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
              type === t ? 'border-[var(--saffron)] text-[var(--saffron)]' : 'border-transparent'
            }`}
            style={{ color: type === t ? 'var(--saffron)' : 'var(--text-muted)' }}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : !query ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔍</div>
          <p style={{ color: 'var(--text-muted)' }}>Search for posts, communities, or users</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Posts */}
          {(type === 'all' || type === 'posts') && results.posts?.length > 0 && (
            <div>
              {type === 'all' && <h2 className="font-bold mb-2">Posts</h2>}
              <div className="space-y-3">
                {results.posts.map(post => <PostCard key={post._id} post={post} compact />)}
              </div>
            </div>
          )}

          {/* Communities */}
          {(type === 'all' || type === 'communities') && results.communities?.length > 0 && (
            <div>
              {type === 'all' && <h2 className="font-bold mb-2">Communities</h2>}
              <div className="space-y-2">
                {results.communities.map(c => (
                  <Link key={c._id} to={`/c/${c.name}`} className="card p-4 flex items-center gap-3 hover:border-[var(--saffron)] transition-colors block">
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

          {/* Users */}
          {(type === 'all' || type === 'users') && results.users?.length > 0 && (
            <div>
              {type === 'all' && <h2 className="font-bold mb-2">Users</h2>}
              <div className="space-y-2">
                {results.users.map(u => (
                  <Link key={u._id} to={`/u/${u.username}`} className="card p-4 flex items-center gap-3 hover:border-[var(--saffron)] transition-colors block">
                    {u.avatar ? <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover" /> :
                      <div className="w-10 h-10 rounded-full gradient-saffron flex items-center justify-center text-white font-bold">{u.name[0]}</div>}
                    <div>
                      <div className="font-bold text-sm">{u.name} {u.isPremium && '⭐'}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>u/{u.username} · {u.karma} karma</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {totalResults === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">😕</div>
              <p style={{ color: 'var(--text-muted)' }}>No results found for "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
