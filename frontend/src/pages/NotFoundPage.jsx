import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center">
        <div className="text-8xl font-display font-bold mb-4" style={{ color: 'var(--saffron)' }}>404</div>
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="mb-6" style={{ color: 'var(--text-muted)' }}>This page doesn't exist or was removed.</p>
        <Link to="/" className="btn-primary">Go Home 🇮🇳</Link>
      </div>
    </div>
  );
}
