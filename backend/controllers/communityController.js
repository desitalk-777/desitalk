const Community = require('../models/Community');
const User = require('../models/User');
const Post = require('../models/Post');
const { asyncHandler, ErrorResponse, paginate, sendSuccess } = require('../middleware/utils');

// @desc    Get all communities
// @route   GET /api/communities
// @access  Public
exports.getCommunities = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sort = 'popular', category } = req.query;
  const { skip, limit: lim, page: pageNum } = paginate(page, limit);

  let query = { isRemoved: false };
  if (category) query.category = category;

  const sortObj = sort === 'new' ? { createdAt: -1 } : { memberCount: -1 };

  const [communities, total] = await Promise.all([
    Community.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(lim)
      .populate('creator', 'name username avatar'),
    Community.countDocuments(query)
  ]);

  // Add membership status
  const result = communities.map(c => {
    const obj = c.toObject();
    if (req.user) {
      obj.isMember = c.members.includes(req.user.id);
    }
    return obj;
  });

  sendSuccess(res, result, 200, {
    pagination: { total, page: pageNum, limit: lim, pages: Math.ceil(total / lim) }
  });
});

// @desc    Get community by name
// @route   GET /api/communities/:name
// @access  Public
exports.getCommunity = asyncHandler(async (req, res, next) => {
  const community = await Community.findOne({ name: req.params.name, isRemoved: false })
    .populate('creator', 'name username avatar')
    .populate('moderators.user', 'name username avatar');

  if (!community) return next(new ErrorResponse('Community not found', 404));

  const obj = community.toObject();
  if (req.user) {
    obj.isMember = community.members.includes(req.user.id);
    obj.isModerator = community.moderators.some(m => m.user?._id?.toString() === req.user.id);
  }

  sendSuccess(res, obj);
});

// @desc    Create community (Premium only)
// @route   POST /api/communities
// @access  Private + Premium
exports.createCommunity = asyncHandler(async (req, res, next) => {
  const { name, displayName, description, category, type, primaryLanguage } = req.body;

  if (!name || !displayName) {
    return next(new ErrorResponse('Community name and display name are required', 400));
  }

  const existing = await Community.findOne({ name: name.toLowerCase() });
  if (existing) return next(new ErrorResponse('Community name already taken', 400));

  let avatar = '', banner = '', avatarPublicId = '', bannerPublicId = '';
  if (req.files?.avatar?.[0]) {
    avatar = req.files.avatar[0].path;
    avatarPublicId = req.files.avatar[0].filename;
  }
  if (req.files?.banner?.[0]) {
    banner = req.files.banner[0].path;
    bannerPublicId = req.files.banner[0].filename;
  }

  const community = await Community.create({
    name: name.toLowerCase().trim(),
    displayName: displayName.trim(),
    description: description?.trim(),
    category: category || 'other',
    type: type || 'public',
    primaryLanguage: primaryLanguage || 'english',
    creator: req.user.id,
    moderators: [{ user: req.user.id }],
    members: [req.user.id],
    memberCount: 1,
    avatar,
    avatarPublicId,
    banner,
    bannerPublicId
  });

  await User.findByIdAndUpdate(req.user.id, { $addToSet: { communities: community._id } });

  sendSuccess(res, community, 201);
});

// @desc    Join/Leave community
// @route   POST /api/communities/:id/membership
// @access  Private
exports.toggleMembership = asyncHandler(async (req, res, next) => {
  const community = await Community.findById(req.params.id);
  if (!community) return next(new ErrorResponse('Community not found', 404));

  const userId = req.user.id;
  const isMember = community.members.includes(userId);

  if (isMember) {
    community.members.pull(userId);
    community.memberCount = Math.max(0, community.memberCount - 1);
    await User.findByIdAndUpdate(userId, { $pull: { communities: community._id } });
  } else {
    if (community.type === 'private') {
      return next(new ErrorResponse('This community is private', 403));
    }
    community.members.addToSet(userId);
    community.memberCount++;
    await User.findByIdAndUpdate(userId, { $addToSet: { communities: community._id } });
  }

  await community.save();
  sendSuccess(res, { joined: !isMember, memberCount: community.memberCount });
});

// @desc    Get popular communities
// @route   GET /api/communities/popular
// @access  Public
exports.getPopularCommunities = asyncHandler(async (req, res) => {
  const communities = await Community.find({ isRemoved: false })
    .sort({ memberCount: -1, weeklyActiveUsers: -1 })
    .limit(10)
    .select('name displayName avatar memberCount category description');

  sendSuccess(res, communities);
});

// @desc    Update community
// @route   PUT /api/communities/:id
// @access  Private (mod/admin)
exports.updateCommunity = asyncHandler(async (req, res, next) => {
  const community = await Community.findById(req.params.id);
  if (!community) return next(new ErrorResponse('Community not found', 404));

  const isMod = community.moderators.some(m => m.user?.toString() === req.user.id);
  if (!isMod && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }

  const allowed = ['displayName', 'description', 'longDescription', 'rules', 'type', 'isNSFW', 'flairs'];
  allowed.forEach(field => {
    if (req.body[field] !== undefined) community[field] = req.body[field];
  });

  await community.save();
  sendSuccess(res, community);
});
