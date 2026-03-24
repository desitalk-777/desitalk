import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      await login({ email, password });
      toast.success('Welcome back! 🇮🇳');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-saffron flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 float-anim">DT</div>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--saffron)' }}>DesiTalk</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>India's Discussion Platform</p>
        </div>

        <div className="card p-6 sm:p-8 page-enter">
          <h2 className="text-xl font-bold mb-6">Welcome Back 🙏</h2>

          {/* Google Login */}
          <a href={`${import.meta.env.VITE_API_URL || 'https://desitalk-backend.onrender.com'}/api/auth/google`}
            className="flex items-center justify-center gap-3 w-full border rounded-lg py-3 text-sm font-semibold mb-4 transition-all hover:scale-[1.01]"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-hover)' }}>
            <FcGoogle size={20} /> Continue with Google
          </a>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>OR</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email - Fixed icon overlap */}
            <div>
              <label className="text-sm font-semibold block mb-1.5">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            {/* Password - Fixed icon overlap */}
            <div>
              <label className="text-sm font-semibold block mb-1.5">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1"
                  style={{ color: 'var(--text-muted)' }}>
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-xs hover:underline" style={{ color: 'var(--saffron)' }}>
                Forgot password?
              </Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="text-sm text-center mt-5" style={{ color: 'var(--text-muted)' }}>
            New to DesiTalk?{' '}
            <Link to="/register" style={{ color: 'var(--saffron)' }} className="font-bold hover:underline">Sign Up Free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
