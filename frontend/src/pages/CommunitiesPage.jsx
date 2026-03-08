import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { communityAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function CommunitiesPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ['communities', category],
    queryFn: () => communityAPI.getAll({ limit: 50, category }).then(r => r.data.data)
  });

  const filtered = communities.filter(c =>
    !search || c.name.includes(search.toLowerCase()) || c.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const handleJoin = async (community) => {
    if (!user) { toast.error('Please login'); return; }
    try {
      await communityAPI.toggleMembership(community._id);
      toast.success('Done!');
    } catch { toast.error('Failed'); }
  };

  const categories = ['', 'technology', 'entertainment', 'sports', 'news', 'education', 'food', 'culture', 'gaming'];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Explore Communities</h1>
        {user?.isPremium && <Link to="/communities/create" className="btn-primary text-sm">+ Create</Link>}
      </div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search communities..." className="input flex-1 min-w-48" />
        <select value={category} onChange={e => setCategory(e.target.value)} className="input w-auto">
          {categories.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
        </select>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="card p-4 h-32 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c._id} className="card p-4 hover:border-[var(--saffron)] transition-colors">
              <div className="flex items-center gap-3 mb-3">
                {c.avatar ? (
                  <img src={c.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full gradient-saffron flex items-center justify-center text-white font-bold">{c.name[0].toUpperCase()}</div>
                )}
                <div className="flex-1 min-w-0">
                  <Link to={`/c/${c.name}`} className="font-bold text-sm hover:text-[var(--saffron)] truncate block">c/{c.name}</Link>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.memberCount?.toLocaleString()} members</p>
                </div>
              </div>
              {c.description && <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{c.description}</p>}
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>{c.category}</span>
                <button onClick={() => handleJoin(c)}
                  className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${c.isMember ? 'btn-outline py-1' : 'btn-primary py-1'}`}>
                  {c.isMember ? 'Joined' : 'Join'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>No communities found</div>
      )}
    </div>
  );
}
