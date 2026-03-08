// ForgotPasswordPage
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md card p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-xl font-bold">Forgot Password</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Enter your email to get a reset link</p>
        </div>
        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-3">📧</div>
            <p className="font-semibold">Check your email!</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>A reset link has been sent to {email}</p>
            <Link to="/login" className="btn-primary inline-block mt-4">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" className="input" required />
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <div className="text-center"><Link to="/login" className="text-sm" style={{ color: 'var(--saffron)' }}>Back to Login</Link></div>
          </form>
        )}
      </div>
    </div>
  );
}
