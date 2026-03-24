import { useState } from 'react';
import { FiMoreVertical, FiTrash2, FiFlag, FiShare } from 'react-icons/fi';
import { postAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PostCard({ post, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postAPI.delete(post._id);
        toast.success('Post deleted');
        onDelete(post._id);
      } catch (err) {
        toast.error('Failed to delete');
      }
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    try {
      await postAPI.report(post._id, { reason: reportReason });
      toast.success('Post reported successfully');
      setShowReportModal(false);
      setReportReason('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to report');
    }
  };

  return (
    <div className="card p-4 mb-3">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg">{post.title}</h3>
          <p className="text-sm text-gray-500">by {post.author?.name}</p>
        </div>
        
        {/* Menu Button */}
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded">
            <FiMoreVertical />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 bg-white border rounded shadow-lg z-10">
              {post.canDelete && (
                <button 
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
                >
                  <FiTrash2 /> Delete
                </button>
              )}
              <button 
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 w-full"
              >
                <FiFlag /> Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="mb-4">{post.content}</p>

      {/* Images */}
      {post.images?.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {post.images.map((img, i) => (
            <img key={i} src={img.url} alt="" className="rounded w-full h-48 object-cover" />
          ))}
        </div>
      )}

      {/* Engagement */}
      <div className="flex gap-4 text-sm text-gray-600 border-t pt-3">
        <button>👍 {post.upvoteCount}</button>
        <button>👎 {post.downvoteCount}</button>
        <button>💬 {post.commentCount}</button>
        <button>🔖 {post.bookmarkCount}</button>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Report Post</h3>
            <select 
              value={reportReason} 
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full border p-2 rounded mb-4"
            >
              <option value="">Select reason...</option>
              <option value="spam">Spam</option>
              <option value="harassment">Harassment</option>
              <option value="hate">Hate Speech</option>
              <option value="misinformation">Misinformation</option>
              <option value="other">Other</option>
            </select>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleReport}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}