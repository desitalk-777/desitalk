const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Community = require('../models/Community');
const Report = require('../models/Report');
const { asyncHandler, sendSuccess, paginate } = require('../middleware/utils');

// @desc    Admin dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, newUsersToday, newUsersWeek,
    totalPosts, newPostsToday,
    totalCommunities,
    pendingReports,
    bannedUsers,
    premiumUsers
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: last24h } }),
    User.countDocuments({ createdAt: { $gte: last7d } }),
    Post.countDocuments({ isRemoved: false }),
    Post.countDocuments({ isRemoved: false, createdAt: { $gte: last24h } }),
    Community.countDocuments({ isRemoved: false }),
    Report.countDocuments({ status: 'pending' }),
    User.countDocuments({ isBanned: true }),
    User.countDocuments({ isPremium: true })
  ]);

  sendSuccess(res, {
    users: { total: totalUsers, today: newUsersToday, thisWeek: newUsersWeek },
    posts: { total: totalPosts, today: newPostsToday },
    communities: { total: totalCommunities },
    reports: { pending: pendingReports },
    moderation: { banned: bannedUsers, premium: premiumUsers }
  });
});

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Admin
exports.getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role, status } = req.query;
  const { skip, limit: lim, page: pageNum } = paginate(page, limit);

  let query = {};
  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [{ username: regex }, { email: regex }, { name: regex }];
  }
  if (role) query.role = role;
  if (status === 'banned') query.isBanned = true;
  if (status === 'premium') query.isPremium = true;

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim)
      .select('-password -resetPasswordToken'),
    User.countDocuments(query)
  ]);

  sendSuccess(res, users, 200, {
    pagination: { total, page: pageNum, limit: lim, pages: Math.ceil(total / lim) }
  });
});

// @desc    Ban user
// @route   PUT /api/admin/users/:id/ban
// @access  Admin
exports.banUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  if (user.role === 'admin') return res.status(403).json({ success: false, error: 'Cannot ban an admin' });

  const { reason } = req.body;

  await User.findByIdAndUpdate(req.params.id, {
    isBanned: true,
    banReason: reason || 'Violation of community guidelines',
    bannedAt: new Date(),
    bannedBy: req.user.id
  });

  sendSuccess(res, { message: `User ${user.username} has been banned.` });
});

// @desc    Unban user
// @route   PUT /api/admin/users/:id/unban
// @access  Admin
exports.unbanUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, {
    isBanned: false,
    banReason: null,
    bannedAt: null,
    bannedBy: null
  });
  sendSuccess(res, { message: 'User unbanned successfully.' });
});

// @desc    Delete post (admin)
// @route   DELETE /api/admin/posts/:id
// @access  Admin
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findByIdAndUpdate(req.params.id, {
    isRemoved: true,
    removedBy: req.user.id,
    removedReason: req.body.reason || 'Admin removal',
    removedAt: new Date()
  });
  if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
  sendSuccess(res, { message: 'Post removed.' });
});

// @desc    Delete comment (admin)
// @route   DELETE /api/admin/comments/:id
// @access  Admin
exports.deleteComment = asyncHandler(async (req, res) => {
  await Comment.findByIdAndUpdate(req.params.id, {
    isRemoved: true,
    removedBy: req.user.id
  });
  sendSuccess(res, { message: 'Comment removed.' });
});

// @desc    Get reports
// @route   GET /api/admin/reports
// @access  Admin
exports.getReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status = 'pending' } = req.query;
  const { skip, limit: lim, page: pageNum } = paginate(page, limit);

  const query = status === 'all' ? {} : { status };

  const [reports, total] = await Promise.all([
    Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim)
      .populate('reporter', 'name username avatar')
      .populate('targetPost', 'title content author')
      .populate('targetUser', 'name username avatar')
      .populate('targetComment', 'content author'),
    Report.countDocuments(query)
  ]);

  sendSuccess(res, reports, 200, {
    pagination: { total, page: pageNum, limit: lim, pages: Math.ceil(total / lim) }
  });
});

// @desc    Resolve report
// @route   PUT /api/admin/reports/:id/resolve
// @access  Admin
exports.resolveReport = asyncHandler(async (req, res) => {
  await Report.findByIdAndUpdate(req.params.id, {
    status: req.body.action === 'dismiss' ? 'dismissed' : 'resolved',
    resolvedBy: req.user.id,
    resolvedAt: new Date(),
    resolution: req.body.resolution
  });
  sendSuccess(res, { message: 'Report resolved.' });
});

// @desc    Get flagged content
// @route   GET /api/admin/flagged
// @access  Admin
exports.getFlaggedContent = asyncHandler(async (req, res) => {
  const [flaggedPosts, flaggedComments] = await Promise.all([
    Post.find({ aiFlag: true, isRemoved: false })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('author', 'name username avatar'),
    Comment.find({ aiFlag: true, isRemoved: false })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('author', 'name username avatar')
  ]);

  sendSuccess(res, { flaggedPosts, flaggedComments });
});

// @desc    Feature/unfeature community
// @route   PUT /api/admin/communities/:id/feature
// @access  Admin
exports.featureCommunity = asyncHandler(async (req, res) => {
  const community = await Community.findByIdAndUpdate(
    req.params.id,
    { isFeatured: req.body.featured },
    { new: true }
  );
  sendSuccess(res, community);
});
