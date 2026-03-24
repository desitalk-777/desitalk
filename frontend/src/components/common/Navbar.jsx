import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiSun, FiMoon, FiPlus, FiUser, FiSettings, FiLogOut, FiShield } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import NotificationBell from '../notification/NotificationBell';
import { searchAPI } from '../../services/api';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 1) {
        try {
          const res = await searchAPI.autocomplete(query);
          setSuggestions(res.data.data || []);
          setShowSuggestions(true);
        } catch {}
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false);
      setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="sticky top-0 z-30 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="tricolor-bar" />
      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 h-14 max-w-[1400px] mx-auto">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="w-8 h-8 rounded-lg gradient-saffron flex items-center justify-center text-white font-bold text-sm transition-transform group-hover:scale-110">DT</div>
          <span className="hidden sm:block font-display font-bold text-lg" style={{ color: 'var(--saffron)' }}>DesiTalk</span>
        </Link>

        {/* Search Bar */}
        <div ref={searchRef} className="flex-1 max-w-xl relative">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text" value={query} onChange={e => setQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search posts, users, communities..."
                className="input py-2 text-sm"
                style={{ paddingLeft: '2.25rem', paddingRight: '1rem', borderRadius: '999px' }}
              />
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 card overflow-hidden z-50 slide-up">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => {
                  setQuery(s.text || s.username || s.name || '');
                  setShowSuggestions(false);
                  if (s.type === 'user') navigate(`/u/${s.username}`);
                  else if (s.type === 'community') navigate(`/c/${s.name}`);
                  else navigate(`/search?q=${encodeURIComponent(s.text || s.name)}`);
                }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--bg-hover)] transition-colors">
                  {s.type === 'user' ? (
                    <>
                      {s.avatar ? <img src={s.avatar} alt="" className="w-7 h-7 rounded-full" /> :
                        <div className="w-7 h-7 rounded-full gradient-saffron flex items-center justify-center text-white text-xs font-bold">{s.name?.[0] || s.username?.[0]}</div>}
                      <div>
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>u/{s.username}</div>
                      </div>
                    </>
                  ) : s.type === 'community' ? (
                    <>
                      <div className="w-7 h-7 rounded-full gradient-saffron flex items-center justify-center text-white text-xs font-bold">{s.name?.[0]?.toUpperCase()}</div>
                      <div>
                        <div className="font-semibold">c/{s.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.memberCount} members</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <FiSearch size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{s.text}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Theme Toggle */}
          <button onClick={toggle} className="p-2 rounded-full transition-all hover:bg-[var(--bg-hover)] hover:scale-110" title="Toggle theme">
            {isDark ? <FiSun size={18} style={{ color: 'var(--saffron)' }} /> : <FiMoon size={18} />}
          </button>

          {isAuthenticated ? (
            <>
              <NotificationBell />

              {/* Create Post */}
              <Link to="/create-post"
                className="btn-primary text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-4 gap-1">
                <FiPlus size={16} />
                <span className="hidden sm:inline">Post</span>
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--bg-hover)] transition-all">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-[var(--saffron)] avatar-hover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full gradient-saffron flex items-center justify-center text-white font-bold text-sm">
                      {user?.name?.[0]}
                    </div>
                  )}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 card w-52 overflow-hidden slide-up z-50">
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                      <div className="font-bold text-sm">{user?.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>u/{user?.username}</div>
                      {user?.isPremium && <div className="text-xs mt-0.5 premium-badge">⭐ Premium</div>}
                    </div>
                    {[
                      { to: `/u/${user?.username}`, icon: FiUser, label: 'My Profile' },
                      { to: '/settings', icon: FiSettings, label: 'Settings' },
                      ...(user?.role === 'admin' ? [{ to: '/admin', icon: FiShield, label: 'Admin Panel' }] : []),
                    ].map(({ to, icon: Icon, label }) => (
                      <Link key={to} to={to} onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--bg-hover)] transition-colors">
                        <Icon size={15} style={{ color: 'var(--text-muted)' }} /> {label}
                      </Link>
                    ))}
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left hover:bg-[var(--bg-hover)] transition-colors text-red-400">
                      <FiLogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-outline text-xs sm:text-sm py-1.5 px-3 sm:px-4">Login</Link>
              <Link to="/register" className="btn-primary text-xs sm:text-sm py-1.5 px-3 sm:px-4">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
