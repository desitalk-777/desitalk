import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiSearch, FiPlus, FiBell, FiUser } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';

export default function MobileNav() {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="mobile-nav sm:hidden">
      {[
        { icon: FiHome, path: '/', label: 'Home' },
        { icon: FiSearch, path: '/search', label: 'Search' },
        { icon: FiPlus, path: '/create', label: 'Create', primary: true },
        { icon: FiBell, path: '/notifications', label: 'Alerts' },
        { icon: FiUser, path: isAuthenticated ? `/u/${user?.username}` : '/login', label: 'Profile' }
      ].map(item => (
        <Link
          key={item.label}
          to={item.path}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
            item.primary ? 'relative' : ''
          }`}
          style={{ color: isActive(item.path) ? 'var(--saffron)' : 'var(--text-muted)' }}
        >
          {item.primary ? (
            <div className="gradient-saffron w-10 h-10 rounded-full flex items-center justify-center -mt-5 shadow-lg shadow-[var(--saffron)]/20">
              <item.icon size={20} className="text-white" />
            </div>
          ) : (
            <item.icon size={22} />
          )}
          <span className="text-[10px] font-semibold">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
