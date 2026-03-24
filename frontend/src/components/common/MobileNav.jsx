import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiCompass, FiPlusSquare, FiBell, FiUser } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';

export default function MobileNav() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const path = location.pathname;

  const navItems = [
    { to: '/', icon: FiHome, label: 'Home' },
    { to: '/communities', icon: FiCompass, label: 'Explore' },
    { to: '/create-post', icon: FiPlusSquare, label: 'Post', isCreate: true },
    { to: '/notifications', icon: FiBell, label: 'Alerts' },
    { to: isAuthenticated ? `/u/${user?.username}` : '/login', icon: FiUser, label: 'Profile' },
  ];

  return (
    <div className="mobile-nav sm:hidden">
      {navItems.map(({ to, icon: Icon, label, isCreate }) => {
        const active = path === to;
        return (
          <Link key={to} to={to}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${active ? 'text-[var(--saffron)]' : ''}`}
            style={{ color: active ? 'var(--saffron)' : 'var(--text-muted)' }}>
            {isCreate ? (
              <div className="w-10 h-10 rounded-full gradient-saffron flex items-center justify-center shadow-lg -mt-2">
                <Icon size={22} color="white" />
              </div>
            ) : (
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            )}
            <span className="text-[10px] font-semibold">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
