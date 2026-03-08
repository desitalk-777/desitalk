import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiSun, FiMoon, FiBell, FiPlus, FiUser, FiLogOut,
  FiSettings, FiBookmark, FiShield, FiStar, FiMenu, FiX
} from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { searchAPI } from '../../services/api';
import NotificationBell from '../notification/NotificationBell';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const searchRef = useRef(null);
  const menuRef = useRef(null);

  // Autocomplete
  useEffect(() => {
    if (searchQuery.length < 1) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await searchAPI.autocomplete(searchQuery);
        setSuggestions(res.data.data || []);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSuggestions([]);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSuggestions([]);
      setShowSearch(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      
      {/* Tricolor accent bar */}
      <div className="tricolor-bar" />

      <div className="flex items-center gap-3 px-4 py-2.5 max-w-[1400px] mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 mr-2">
          <div className="w-8 h-8 rounded-lg gradient-saffron flex items-center justify-center text-white font-bold text-sm">
            DT
          </div>
          <span className="font-display font-bold text-xl hidden sm:block"
            style={{ color: 'var(--saffron)' }}>
            DesiTalk
          </span>
        </Link>

        {/* Search bar */}
        <div ref={searchRef} className="flex-1 max-w-2xl relative">
          <form onSubmit={handleSearch} className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search DesiTalk..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              className="input pl-9 py-2 text-sm rounded-full"
              style={{ background: 'var(--bg-hover)' }}
            />
          </form>

          {/* Autocomplete dropdown */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden shadow-xl z-50 card"
              >
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      navigate(s.type === 'community' ? `/c/${s.name}` : `/u/${s.username}`);
                      setSuggestions([]);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--bg-hover)] transition-colors text-left"
                  >
                    {s.avatar ? (
                      <img src={s.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full gradient-saffron flex items-center justify-center text-white text-xs font-bold">
                        {s.type === 'community' ? 'c' : 'u'}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {s.type === 'community' ? `c/${s.name}` : `u/${s.username}`}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.subtitle}</div>
                    </div>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                      {s.type}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className="p-2 rounded-full transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-muted)' }}>
            {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>

          {isAuthenticated ? (
            <>
              {/* Create post */}
              <Link to="/create"
                className="btn-primary hidden sm:flex text-xs px-4 py-2">
                <FiPlus size={14} /> Create
              </Link>

              {/* Notifications */}
              <NotificationBell />

              {/* User menu */}
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name}
                      className="w-8 h-8 rounded-full object-cover ring-2"
                      style={{ ringColor: user.isPremium ? 'var(--saffron)' : 'transparent' }} />
                  ) : (
                    <div className="w-8 h-8 rounded-full gradient-saffron flex items-center justify-center text-white text-sm font-bold">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-2 w-56 card shadow-xl overflow-hidden z-50"
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                        <div className="font-bold text-sm">{user?.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>u/{user?.username}</div>
                        {user?.isPremium && (
                          <span className="premium-badge text-xs">⭐ Premium</span>
                        )}
                      </div>

                      {[
                        { icon: FiUser, label: 'Profile', path: `/u/${user?.username}` },
                        { icon: FiBookmark, label: 'Bookmarks', path: '/bookmarks' },
                        { icon: FiStar, label: 'Premium', path: '/premium' },
                        { icon: FiSettings, label: 'Settings', path: '/settings' },
                        ...(user?.role === 'admin' ? [{ icon: FiShield, label: 'Admin Panel', path: '/admin' }] : [])
                      ].map(item => (
                        <Link
                          key={item.label}
                          to={item.path}
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--bg-hover)] transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          <item.icon size={16} style={{ color: 'var(--text-muted)' }} />
                          {item.label}
                        </Link>
                      ))}

                      <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--bg-hover)] transition-colors text-red-400"
                        >
                          <FiLogOut size={16} /> Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-outline text-sm hidden sm:flex">Log In</Link>
              <Link to="/register" className="btn-primary text-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
