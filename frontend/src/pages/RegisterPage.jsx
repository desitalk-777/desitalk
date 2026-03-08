import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiAtSign } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const checkUsername = async (val) => {
    if (val.length < 3) { setUsernameAvailable(null); return; }
    try {
      const res = await api.get(`/auth/check-username/${val}`);
      setUsernameAvailable(res.data.available);
    } catch {}
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'username') checkUsername(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Welcome to DesiTalk! 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-saffron flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">DT</div>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--saffron)' }}>DesiTalk</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Join millions of Indians</p>
        </div>
        <div className="card p-8">
          <h2 className="text-xl font-bold mb-6">Create Account 🚀</h2>
          <a href="/api/auth/google"
            className="flex items-center justify-center gap-3 w-full border rounded-lg py-3 text-sm font-semibold mb-4 hover:bg-[var(--bg-hover)] transition-colors"
            style={{ borderColor: 'var(--border)' }}>
            <FcGoogle size={20} /> Sign up with Google
          </a>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>OR</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { name: 'name', label: 'Full Name', icon: FiUser, placeholder: 'Rahul Sharma', type: 'text' },
              { name: 'email', label: 'Email', icon: FiMail, placeholder: 'rahul@email.com', type: 'email' },
            ].map(({ name, label, icon: Icon, placeholder, type }) => (
              <div key={name}>
                <label className="text-sm font-semibold block mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                  <input type={type} name={name} value={form[name]} onChange={handleChange}
                    placeholder={placeholder} className="input pl-10" required />
                </div>
              </div>
            ))}
            <div>
              <label className="text-sm font-semibold block mb-1.5">Username</label>
              <div className="relative">
                <FiAtSign className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                <input type="text" name="username" value={form.username} onChange={handleChange}
                  placeholder="rahul_desi" className="input pl-10 pr-8" required
                  pattern="[a-z0-9_]{3,30}" />
                {usernameAvailable !== null && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                    {usernameAvailable ? '✅' : '❌'}
                  </span>
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>3-30 characters, letters, numbers and underscore only</p>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1.5">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                <input type="password" name="password" value={form.password} onChange={handleChange}
                  placeholder="Min 8 characters" className="input pl-10" required minLength={8} />
              </div>
            </div>
            <button type="submit" disabled={loading || usernameAvailable === false}
              className="btn-primary w-full py-3 disabled:opacity-60">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
            By signing up, you agree to our Terms and Privacy Policy
          </p>
          <p className="text-sm text-center mt-3" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--saffron)' }} className="font-bold hover:underline">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
