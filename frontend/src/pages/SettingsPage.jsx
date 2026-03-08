import { useState } from 'react';
import { userAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || '', bio: user?.bio || '', location: user?.location || '',
    website: user?.website || '',
    socialLinks: { youtube: user?.socialLinks?.youtube || '', instagram: user?.socialLinks?.instagram || '', twitter: user?.socialLinks?.twitter || '' }
  });
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, typeof v === 'object' ? JSON.stringify(v) : v));
      if (avatar) fd.append('avatar', avatar);
      const res = await userAPI.updateProfile(fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(res.data.data);
      toast.success('Profile updated! ✅');
    } catch { toast.error('Failed to update'); }
    finally { setLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwLoading(true);
    try {
      await userAPI.updateProfile(pwForm);
      toast.success('Password updated!');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setPwLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">⚙️ Settings</h1>

      {/* Profile */}
      <form onSubmit={handleSave} className="card p-6 mb-4 space-y-4">
        <h2 className="font-bold text-lg">Edit Profile</h2>
        <div className="flex items-center gap-4">
          {(avatar ? URL.createObjectURL(avatar) : user?.avatar) ? (
            <img src={avatar ? URL.createObjectURL(avatar) : user.avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : <div className="w-16 h-16 rounded-full gradient-saffron flex items-center justify-center text-white text-2xl font-bold">{user?.name?.[0]}</div>}
          <div>
            <input type="file" accept="image/*" onChange={e => setAvatar(e.target.files[0])} className="text-sm" />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>JPG, PNG, WEBP · Max 5MB</p>
          </div>
        </div>
        {[
          { key: 'name', label: 'Display Name', placeholder: 'Your name' },
          { key: 'bio', label: 'Bio', placeholder: 'Tell us about yourself...', textarea: true },
          { key: 'location', label: 'Location', placeholder: 'Mumbai, India' },
          { key: 'website', label: 'Website', placeholder: 'https://yourwebsite.com' },
        ].map(f => (
          <div key={f.key}>
            <label className="text-sm font-semibold block mb-1.5">{f.label}</label>
            {f.textarea ? (
              <textarea value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder} className="input resize-none" rows={3} maxLength={300} />
            ) : (
              <input type="text" value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder} className="input" />
            )}
          </div>
        ))}
        <div>
          <label className="text-sm font-semibold block mb-2">Social Links</label>
          {['youtube', 'instagram', 'twitter'].map(s => (
            <input key={s} type="text" value={form.socialLinks[s]}
              onChange={e => setForm(p => ({ ...p, socialLinks: { ...p.socialLinks, [s]: e.target.value } }))}
              placeholder={`${s.charAt(0).toUpperCase() + s.slice(1)} URL`} className="input mb-2" />
          ))}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 disabled:opacity-60">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Password */}
      {user && !user.googleId && (
        <form onSubmit={handlePasswordChange} className="card p-6 space-y-4">
          <h2 className="font-bold text-lg">Change Password</h2>
          <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
            placeholder="Current password" className="input" />
          <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
            placeholder="New password (min 8 chars)" className="input" minLength={8} />
          <button type="submit" disabled={pwLoading} className="btn-primary w-full py-2.5 disabled:opacity-60">
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  );
}
