import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [tab, setTab] = useState('stats');
  const [banReason, setBanReason] = useState('');
  const qc = useQueryClient();

  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminAPI.getStats().then(r => r.data.data), enabled: tab === 'stats' });
  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => adminAPI.getUsers().then(r => r.data.data), enabled: tab === 'users' });
  const { data: reports = [] } = useQuery({ queryKey: ['admin-reports'], queryFn: () => adminAPI.getReports({ status: 'pending' }).then(r => r.data.data), enabled: tab === 'reports' });
  const { data: flagged } = useQuery({ queryKey: ['admin-flagged'], queryFn: () => adminAPI.getFlagged().then(r => r.data.data), enabled: tab === 'flagged' });

  const banUser = useMutation({ mutationFn: ({ id, reason }) => adminAPI.banUser(id, { reason }), onSuccess: () => { toast.success('User banned'); qc.invalidateQueries(['admin-users']); } });
  const unbanUser = useMutation({ mutationFn: (id) => adminAPI.unbanUser(id), onSuccess: () => { toast.success('User unbanned'); qc.invalidateQueries(['admin-users']); } });
  const deletePost = useMutation({ mutationFn: (id) => adminAPI.deletePost(id), onSuccess: () => { toast.success('Post deleted'); qc.invalidateQueries(['admin-flagged']); } });
  const resolveReport = useMutation({ mutationFn: (id) => adminAPI.resolveReport(id, { action: 'resolve', resolution: 'Reviewed by admin' }), onSuccess: () => { toast.success('Report resolved'); qc.invalidateQueries(['admin-reports']); } });

  const tabs = ['stats', 'users', 'reports', 'flagged'];

  const StatCard = ({ label, value, color = 'var(--saffron)' }) => (
    <div className="card p-5">
      <div className="text-3xl font-bold" style={{ color }}>{value ?? '...'}</div>
      <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-5">🛡️ Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-colors ${tab === t ? 'text-white gradient-saffron' : 'btn-outline'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Stats */}
      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.users?.total} />
          <StatCard label="New Today" value={stats.users?.today} />
          <StatCard label="Total Posts" value={stats.posts?.total} />
          <StatCard label="Posts Today" value={stats.posts?.today} />
          <StatCard label="Communities" value={stats.communities?.total} />
          <StatCard label="Pending Reports" value={stats.reports?.pending} color="red" />
          <StatCard label="Banned Users" value={stats.moderation?.banned} color="red" />
          <StatCard label="Premium Users" value={stats.moderation?.premium} color="gold" />
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="space-y-2">
          {users.map?.(u => (
            <div key={u._id} className="card p-4 flex items-center gap-3 flex-wrap">
              {u.avatar ? <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover" /> :
                <div className="w-9 h-9 rounded-full gradient-saffron flex items-center justify-center text-white font-bold flex-shrink-0">{u.name?.[0]}</div>}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{u.name} <span style={{ color: 'var(--text-muted)' }}>@{u.username}</span></div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email} · {u.role} {u.isBanned && '· 🚫 BANNED'}</div>
              </div>
              <div className="flex gap-2">
                {u.isBanned ? (
                  <button onClick={() => unbanUser.mutate(u._id)} className="btn-outline text-xs py-1 px-3 text-green-400 border-green-400">Unban</button>
                ) : (
                  <button onClick={() => { const r = prompt('Ban reason:'); if (r) banUser.mutate({ id: u._id, reason: r }); }}
                    className="btn-outline text-xs py-1 px-3 text-red-400 border-red-400">Ban</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reports */}
      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.map?.(r => (
            <div key={r._id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold capitalize">{r.reason}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--saffron)' }}>{r.targetType}</span>
              </div>
              {r.description && <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{r.description}</p>}
              <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Reported by: {r.reporter?.username}</div>
              <div className="flex gap-2">
                <button onClick={() => resolveReport.mutate(r._id)} className="btn-primary text-xs py-1.5 px-4">Resolve</button>
                <button onClick={() => adminAPI.resolveReport(r._id, { action: 'dismiss' }).then(() => qc.invalidateQueries(['admin-reports']))}
                  className="btn-outline text-xs py-1.5 px-4">Dismiss</button>
              </div>
            </div>
          ))}
          {reports.length === 0 && <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>✅ No pending reports</div>}
        </div>
      )}

      {/* Flagged */}
      {tab === 'flagged' && flagged && (
        <div>
          <h2 className="font-bold mb-3">Flagged Posts ({flagged.flaggedPosts?.length})</h2>
          <div className="space-y-2">
            {flagged.flaggedPosts?.map(p => (
              <div key={p._id} className="card p-4 flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{p.title}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>by {p.author?.username} · {p.aiFlagReason}</div>
                </div>
                <button onClick={() => deletePost.mutate(p._id)} className="btn-outline text-xs py-1 px-3 text-red-400 border-red-400">Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
