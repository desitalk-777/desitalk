import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiImage, FiLink, FiX } from 'react-icons/fi';
import { postAPI, communityAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function CreatePostPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const { data: communities } = useQuery({
    queryKey: ['my-communities'],
    queryFn: () => communityAPI.getAll({ limit: 50 }).then(r => r.data.data)
  });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    setImages(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title is required'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      formData.append('tags', tags);
      if (communityId) formData.append('communityId', communityId);
      if (externalLink && user?.isPremium) formData.append('externalLink', JSON.stringify({ url: externalLink }));
      images.forEach(img => formData.append('images', img));

      const res = await postAPI.create(formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Post created! 🎉');
      navigate(`/posts/${res.data.data.slug || res.data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Create Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Community selector */}
        <div className="card p-4">
          <label className="text-sm font-semibold block mb-2">Post to Community (optional)</label>
          <select value={communityId} onChange={e => setCommunityId(e.target.value)} className="input">
            <option value="">My Profile</option>
            {communities?.map(c => (
              <option key={c._id} value={c._id}>c/{c.name}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="card p-4">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="An interesting title..." className="input text-lg font-semibold border-0 p-0 focus:ring-0"
            style={{ background: 'transparent' }} maxLength={300} required />
          <div className="text-xs mt-2 text-right" style={{ color: 'var(--text-muted)' }}>{title.length}/300</div>
        </div>

        {/* Content */}
        <div className="card p-4">
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind? Share your thoughts with the community... 🇮🇳"
            rows={6} className="input border-0 p-0 focus:ring-0 resize-none"
            style={{ background: 'transparent' }} maxLength={40000} />
        </div>

        {/* Tags */}
        <div className="card p-4">
          <label className="text-sm font-semibold block mb-2">Tags (comma separated)</label>
          <input type="text" value={tags} onChange={e => setTags(e.target.value)}
            placeholder="india, technology, cricket" className="input" />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Max 5 tags</p>
        </div>

        {/* Images */}
        <div className="card p-4">
          <label className="text-sm font-semibold block mb-2">
            <FiImage className="inline mr-1" /> Add Images (optional, max 4)
          </label>
          <input type="file" accept="image/*" multiple onChange={handleImageChange}
            className="text-sm" />
          {images.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={URL.createObjectURL(img)} alt="" className="w-20 h-20 rounded-lg object-cover" />
                  <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">
                    <FiX size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* External link (premium only) */}
        {user?.isPremium && (
          <div className="card p-4">
            <label className="text-sm font-semibold block mb-2">
              <FiLink className="inline mr-1" /> External Link <span className="premium-badge text-xs">⭐ Premium</span>
            </label>
            <input type="url" value={externalLink} onChange={e => setExternalLink(e.target.value)}
              placeholder="https://youtube.com/watch?v=..." className="input" />
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-outline flex-1 py-3">Cancel</button>
          <button type="submit" disabled={loading || !title.trim()} className="btn-primary flex-1 py-3 disabled:opacity-60">
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
