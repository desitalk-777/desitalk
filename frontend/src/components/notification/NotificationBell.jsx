import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { notificationAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { getSocket } from '../../services/socket';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUnreadCount();

    // Real-time notifications via socket
    const socket = getSocket();
    if (socket) {
      socket.on('notification:new', (n) => {
        setNotifications(prev => [n, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
    }

    return () => {
      socket?.off('notification:new');
    };
  }, [isAuthenticated]);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationAPI.getUnreadCount();
      setUnreadCount(res.data.data.count);
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll({ limit: 10 });
      setNotifications(res.data.data || []);
    } catch {}
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
      // Mark all read
      setTimeout(() => {
        notificationAPI.markAllRead().then(() => setUnreadCount(0));
      }, 2000);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notifIcon = {
    comment: '💬', reply: '↩️', mention: '@', upvote: '⬆️',
    follow: '👤', system: '🔔', premium: '⭐', award: '🏆'
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <FiBell size={18} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
            style={{ background: 'var(--saffron)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 card shadow-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-bold text-sm">Notifications</h3>
              <Link to="/notifications" className="text-xs" style={{ color: 'var(--saffron)' }}
                onClick={() => setIsOpen(false)}>
                See all
              </Link>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">🔔</div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n._id}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors border-b last:border-b-0`}
                    style={{
                      borderColor: 'var(--border)',
                      background: !n.isRead ? 'rgba(255, 107, 53, 0.05)' : undefined
                    }}
                  >
                    <div className="w-8 h-8 rounded-full gradient-saffron flex items-center justify-center text-sm flex-shrink-0">
                      {n.sender?.avatar ? (
                        <img src={n.sender.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span>{notifIcon[n.type] || '🔔'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-snug">{n.message}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                        style={{ background: 'var(--saffron)' }} />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
