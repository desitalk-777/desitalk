import { useQuery } from '@tanstack/react-query';
import { userAPI } from '../services/api';
import PostCard from '../components/post/PostCard';

export default function BookmarksPage() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => userAPI.getBookmarks().then(r => r.data.data)
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-5">🔖 Saved Posts</h1>
      {posts.length === 0 ? (
        <div className="text-center py-16"><div className="text-4xl mb-3">🔖</div><p style={{ color: 'var(--text-muted)' }}>No saved posts yet</p></div>
      ) : (
        <div className="space-y-3">{posts.map(post => <PostCard key={post._id} post={post} />)}</div>
      )}
    </div>
  );
}
