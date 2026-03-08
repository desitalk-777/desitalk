// NotificationsPage.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.getAll({ limit: 50 }).then(r => r.data.data)
  });

  const markAll = useMutation({
    mutationFn: notificationAPI.markAllRead,
    onSuccess: () => qc.invalidateQueries(['notifications'])
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button onClick={() => markAll.mutate()} className="btn-outline text-sm py-1.5 px-4">Mark all read</button>
      </div>
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-16"><div className="text-4xl mb-3">🔔</div><p style={{ color: 'var(--text-muted)' }}>No notifications yet</p></div>
        ) : notifications.map(n => (
          <div key={n._id} className={`card p-4 flex gap-3 ${!n.isRead ? 'border-l-2 border-l-[var(--saffron)]' : ''}`}>
            {n.sender?.avatar ? <img src={n.sender.avatar} alt="" className="w-9 h-9 rounded-full flex-shrink-0" /> :
              <div className="w-9 h-9 rounded-full gradient-saffron flex items-center justify-center text-white flex-shrink-0">🔔</div>}
            <div className="flex-1">
              <p className="text-sm">{n.message}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
            </div>
            {!n.isRead && <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: 'var(--saffron)' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
