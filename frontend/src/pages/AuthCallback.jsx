// AuthCallback - handles Google OAuth redirect
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    if (token) {
      loginWithToken(token);
      navigate('/');
    } else {
      navigate('/login?error=' + (error || 'oauth_failed'));
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p>Logging you in...</p>
      </div>
    </div>
  );
}
