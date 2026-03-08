const User = require('../models/User');
const Post = require('../models/Post');
const { asyncHandler, ErrorResponse, sendSuccess, paginate } = require('../middleware/utils');
const Notification = require('../models/Notification');

// @desc    Get user profile
// @route   GET /api/users/:username
// @access  Public
exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() })
    .select('-password -resetPasswordToken -emailVerificationToken -googleId')
    .populate('communities', 'name displayName avatar memberCount');

  if (!user) return next(new ErrorResponse('User not found', 404));
  if (user.isBanned) return next(new ErrorResponse('This account has been suspended', 404));

  const obj = user.toObject();
  if (req.user) {
    obj.isFollowing = user.followers.includes(req.user.id);
    obj.isFollowedBy = user.following.includes(req.user.id);
  }

  sendSuccess(res, obj);
});

// @desc    Update profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, bio, location, website, socialLinks } = req.body;

  const updates = {};
  if (name) updates.name = name.trim();
  if (bio !== undefined) updates.bio = bio?.trim() || '';
  if (location !== undefined) updates.location = location?.trim() || '';
  if (website !== undefined) updates.website = website?.trim() || '';
  if (socialLinks) updates.socialLinks = socialLinks;

  if (req.file) {
    updates.avatar = req.file.path;
    updates.avatarPublicId = req.file.filename;
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true
  }).select('-password');

  sendSuccess(res, user);
});

// @desc    Update password
// @route   PUT /api/users/update-password
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('Please provide current and new password', 400));
  }

  if (newPassword.length < 8) {
    return next(new ErrorResponse('New password must be at least 8 characters', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  if (user.password) {
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return next(new ErrorResponse('Current password is incorrect', 400));
  }

  user.password = newPassword;
  await user.save();

  sendSuccess(res, { message: 'Password updated successfully' });
});

// @desc    Follow/Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
exports.toggleFollow = asyncHandler(async (req, res, next) => {
  if (req.params.id === req.user.id) {
    return next(new ErrorResponse('You cannot follow yourself', 400));
  }

  const targetUser = await User.findById(req.params.id);
  if (!targetUser) return next(new ErrorResponse('User not found', 404));

  const currentUser = await User.findById(req.user.id);
  const isFollowing = currentUser.following.includes(req.params.id);

  if (isFollowing) {
    currentUser.following.pull(req.params.id);
    targetUser.followers.pull(req.user.id);
  } else {
    currentUser.following.addToSet(req.params.id);
    targetUser.followers.addToSet(req.user.id);

    // Send notification
    await Notification.create({
      recipient: targetUser._id,
      sender: req.user.id,
      type: 'follow',
      message: `${req.user.name} started following you`,
      link: `/u/${req.user.username}`
    });
    req.app.get('io').to(`user:${targetUser._id}`).emit('notification:new', {
      type: 'follow',
      message: `${req.user.name} started following you`
    });
  }

  await currentUser.save();
  await targetUser.save();

  sendSuccess(res, {
    following: !isFollowing,
    followerCount: targetUser.followers.length
  });
});

// @desc    Get user's posts
// @route   GET /api/users/:username/posts
// @access  Public
exports.getUserPosts = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  const { page = 1, limit = 20 } = req.query;
  const { skip, limit: lim, page: pageNum } = paginate(page, limit);

  const [posts, total] = await Promise.all([
    Post.find({ author: user._id, isRemoved: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim)
      .populate('community', 'name displayName avatar'),
    Post.countDocuments({ author: user._id, isRemoved: false })
  ]);

  sendSuccess(res, posts, 200, {
    pagination: { total, page: pageNum, limit: lim, pages: Math.ceil(total / lim) }
  });
});

// @desc    Get user bookmarks
// @route   GET /api/users/bookmarks
// @access  Private
exports.getBookmarks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { skip, limit: lim, page: pageNum } = paginate(page, limit);

  const user = await User.findById(req.user.id).select('bookmarks');
  const total = user.bookmarks.length;

  const posts = await Post.find({ _id: { $in: user.bookmarks }, isRemoved: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(lim)
    .populate('author', 'name username avatar isPremium')
    .populate('community', 'name displayName avatar');

  sendSuccess(res, posts, 200, {
    pagination: { total, page: pageNum, limit: lim, pages: Math.ceil(total / lim) }
  });
});

// @desc    Get creator analytics
// @route   GET /api/users/analytics
// @access  Private + Premium
exports.getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalPosts,
    recentPosts,
    totalComments,
    followerCount,
    totalViews,
    totalVotes
  ] = await Promise.all([
    Post.countDocuments({ author: userId, isRemoved: false }),
    Post.find({ author: userId, isRemoved: false, createdAt: { $gte: last30Days } })
      .sort({ voteScore: -1 })
      .limit(5)
      .select('title voteScore viewCount commentCount createdAt'),
    User.findById(userId).select('commentCount karma followers following'),
    User.findById(userId).select('followers').then(u => u.followers.length),
    Post.aggregate([
      { $match: { author: require('mongoose').Types.ObjectId(userId), isRemoved: false } },
      { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
    ]),
    Post.aggregate([
      { $match: { author: require('mongoose').Types.ObjectId(userId), isRemoved: false } },
      { $group: { _id: null, totalVotes: { $sum: '$voteScore' } } }
    ])
  ]);

  sendSuccess(res, {
    totalPosts,
    recentPosts,
    followerCount,
    karma: req.user.karma,
    totalViews: totalViews[0]?.totalViews || 0,
    totalVotes: totalVotes[0]?.totalVotes || 0
  });
});

// @desc    Get user followers
// @route   GET /api/users/:id/followers
// @access  Public
exports.getFollowers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('followers', 'name username avatar isPremium isVerified bio');
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  sendSuccess(res, user.followers);
});

// @desc    Get user following
// @route   GET /api/users/:id/following
// @access  Public
exports.getFollowing = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('following', 'name username avatar isPremium isVerified bio');
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  sendSuccess(res, user.following);
});
