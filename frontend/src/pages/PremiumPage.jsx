import { useQuery } from '@tanstack/react-query';
import { premiumAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function PremiumPage() {
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const { data: plans } = useQuery({ queryKey: ['premium-plans'], queryFn: () => premiumAPI.getPlans().then(r => r.data.data) });
  const { data: status } = useQuery({ queryKey: ['premium-status'], queryFn: () => isAuthenticated ? premiumAPI.getStatus().then(r => r.data.data) : null, enabled: isAuthenticated });

  const handleSubscribe = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      const orderRes = await premiumAPI.createOrder();
      const { orderId, amount, currency, keyId, user: userData } = orderRes.data.data;
      const options = {
        key: keyId, amount, currency, name: 'DesiTalk', description: 'Premium Subscription',
        order_id: orderId, prefill: { name: userData.name, email: userData.email },
        theme: { color: '#ff6b35' },
        handler: async (response) => {
          try {
            await premiumAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            updateUser({ isPremium: true, isVerified: true });
            toast.success('🎉 Premium activated! Welcome to DesiTalk Premium!');
          } catch { toast.error('Payment verification failed'); }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch { toast.error('Failed to create order'); }
  };

  const features = plans?.plans?.[0]?.features || [];

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">⭐</div>
        <h1 className="text-3xl font-display font-bold mb-2" style={{ color: 'var(--saffron)' }}>DesiTalk Premium</h1>
        <p style={{ color: 'var(--text-muted)' }}>Unlock the full DesiTalk experience</p>
      </div>

      {status?.isPremium ? (
        <div className="card p-6 text-center">
          <div className="text-4xl mb-3">👑</div>
          <h2 className="text-xl font-bold mb-2">You're Premium!</h2>
          <p style={{ color: 'var(--text-muted)' }}>Expires: {status.premiumExpiry ? new Date(status.premiumExpiry).toLocaleDateString('en-IN') : 'Active'}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="p-6 text-center gradient-saffron text-white">
            <div className="text-4xl font-display font-bold">₹89</div>
            <div className="text-sm opacity-80">per month</div>
          </div>
          <div className="p-6">
            <ul className="space-y-3 mb-6">
              {features.map((f, i) => (
                <li key={i} className="text-sm flex items-start gap-2">{f}</li>
              ))}
            </ul>
            <button onClick={handleSubscribe} className="btn-primary w-full py-3 text-base">
              Subscribe for ₹89/month
            </button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
              Secure payment via Razorpay · Cancel anytime
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
