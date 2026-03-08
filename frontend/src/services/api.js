import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dt_token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// API helper functions
export const postAPI = {
  getAll: (params) => api.get('/posts', { params }),
  getOne: (id) => api.get(`/posts/${id}`),
  create: (data, config) => api.post('/posts', data, config),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
  vote: (id, type) => api.post(`/posts/${id}/vote`, { type }),
  bookmark: (id) => api.post(`/posts/${id}/bookmark`),
  trending: (params) => api.get('/posts/trending', { params })
};

export const commentAPI = {
  getByPost: (postId, params) => api.get(`/comments/post/${postId}`, { params }),
  create: (data) => api.post('/comments', data),
  rate: (id, stars) => api.post(`/comments/${id}/rate`, { stars }),
  vote: (id, type) => api.post(`/comments/${id}/vote`, { type }),
  delete: (id) => api.delete(`/comments/${id}`)
};

export const communityAPI = {
  getAll: (params) => api.get('/communities', { params }),
  getOne: (name) => api.get(`/communities/${name}`),
  create: (data, config) => api.post('/communities', data, config),
  update: (id, data) => api.put(`/communities/${id}`, data),
  toggleMembership: (id) => api.post(`/communities/${id}/membership`),
  getPopular: () => api.get('/communities/popular')
};

export const userAPI = {
  getProfile: (username) => api.get(`/users/${username}`),
  updateProfile: (data, config) => api.put('/users/profile', data, config),
  toggleFollow: (id) => api.post(`/users/${id}/follow`),
  getBookmarks: (params) => api.get('/users/bookmarks', { params }),
  getAnalytics: () => api.get('/users/analytics'),
  getUserPosts: (username, params) => api.get(`/users/${username}/posts`, { params })
};

export const searchAPI = {
  search: (params) => api.get('/search', { params }),
  autocomplete: (q) => api.get('/search/autocomplete', { params: { q } }),
  trendingTags: () => api.get('/search/trending-tags')
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/read/${id}`),
  markAllRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  report: (data) => api.post('/notifications/report', data)
};

export const premiumAPI = {
  getPlans: () => api.get('/premium/plans'),
  getStatus: () => api.get('/premium/status'),
  createOrder: () => api.post('/premium/create-order'),
  verifyPayment: (data) => api.post('/premium/verify-payment', data)
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  banUser: (id, data) => api.put(`/admin/users/${id}/ban`, data),
  unbanUser: (id) => api.put(`/admin/users/${id}/unban`),
  deletePost: (id) => api.delete(`/admin/posts/${id}`),
  deleteComment: (id) => api.delete(`/admin/comments/${id}`),
  getReports: (params) => api.get('/admin/reports', { params }),
  resolveReport: (id, data) => api.put(`/admin/reports/${id}/resolve`, data),
  getFlagged: () => api.get('/admin/flagged')
};
