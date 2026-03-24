const Post = require('../models/Post');
const Community = require('../models/Community');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { asyncHandler, ErrorResponse, paginate, sendSuccess } = require('../middleware/utils');

exports.getPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sort = 'hot', community, tag } = req.query;
  const { skip, limit: lim, page: pageNum } = paginate(page, limit);
  let query = { isRemoved: false };
  if (community) query.community = community;
  if (tag) query.tags = tag.toLowerCase();
  let sortObj = {};
  switch (sort) {
    case 'hot': sortObj = { hotScore: -1, createdAt: -1 }; break;
    case 'new': sortObj = { createdAt: -1 }; break;
    case 'top': sortObj = { voteScore: -1, createdAt: -1 }; break;
    case 'rising': sortObj = { viewCount: -1, createdAt: -1 }; break;
    default: sortObj = { hotScore: -1 };
  }
  const [posts, total] = await Promise.all([
    Post.find(query).sort(sortObj).skip(skip).limit(lim)
      .populate('author', 'name username avatar isPremium isVerified role')
      .populate('community', 'name displayName avatar'),
    Post.countDocuments(query)
  ]);
  sendSuccess(res, posts, 200, { pagination: { total, page: pageNum, limit: lim, pages: Math.ceil(total / lim) } });
});

exports.getPost = asyncHandler(async (req, res, next) => {
  const post = await Post.findOne({ $or: [{ _id: req.params.id }, { slug: req.params.id }], isRemoved: false })
    .populate('author', 'name username avatar isPremium isVerified bio karma')
    .populate('community', 'name displayName avatar description');
  if (!post) return next(new ErrorResponse('Post not found', 404));
  await Post.findByIdAndUpdate(post._id, { $inc: { viewCount: 1 } });
  const postObj = post.toObject();
  if (req.user) {
    postObj.userVote = post.upvotes.includes(req.user.id) ? 'up' : post.downvotes.includes(req.user.id) ? 'down' : null;
    postObj.isBookmarked = req.user.bookmarks?.includes(post._id);
    postObj.canDelete = post.author.toString() === req.user.id || req.user.role === 'admin';
  }
  sendSuccess(res, postObj);
});

exports.createPost = asyncHandler(async (req, res, next) => {
  const { title, content, type, tags, communityId, externalLink, isNSFW, isSpoiler } = req.body;
  if (!title?.trim()) return next(new ErrorResponse('Post title required', 400));
  if (communityId) {
    const community = await Community.findById(communityId);
    if (!community) return next(new ErrorResponse('Community not found', 404));
    if (community.type === 'private' && !community.members.includes(req.user.id)) {
      return next(new ErrorResponse('Not a member', 403));
    }
  }
  if (externalLink?.url && !req.user.isPremium) return next(new ErrorResponse('Premium required', 403));
  let images = [];
  if (req.files?.length > 0) {
    images = req.files.map(f => ({ url: f.path, publicId: f.filename }));
  }
  const post = await Post.create({
    title: title.trim(),
    content: content?.trim(),
    type: type || (images.length > 0 ? 'image' : externalLink ? 'link' : 'text'),
    images,
    externalLink,
    author: req.user.id,
    community: communityId || null,
    tags: tags ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 5) : [],
    isNSFW: isNSFW === 'true',
    isSpoiler: isSpoiler === 'true'
  });
  post.calculateHotScore();
  await post.save();
  await User.findByIdAndUpdate(req.user.id, { $inc: { postCount: 1, karma: 5 } });
  if (communityId) await Community.findByIdAndUpdate(communityId, { $inc: { postCount: 1 } });
  const populated = await Post.findById(post._id)
    .populate('author', 'name username avatar isPremium isVerified')
    .populate('community', 'name displayName avatar');
  req.app.get('io').emit('post:new', populated);
  sendSuccess(res, populated, 201);
});

exports.updatePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse('Post not found', 404));
  if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }
  const { title, content, tags } = req.body;
  if (title) post.title = title.trim();
  if (content !== undefined) post.content = content?.trim();
  if (tags) post.tags = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 5);
  await post.save();
  const updated = await Post.findById(post._id)
    .populate('author', 'name username avatar')
    .populate('community', 'name displayName avatar');
  sendSuccess(res, updated);
});

exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse('Post not found', 404));
  if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }
  await Post.findByIdAndUpdate(req.params.id, {
    isRemoved: true,
    removedBy: req.user.id,
    removedReason: req.body.reason || 'Deleted by user',
    removedAt: new Date()
  });
  await User.findByIdAndUpdate(post.author, { $inc: { postCount: -1 } });
  sendSuccess(res, { message: 'Post deleted' });
});

exports.reportPost = asyncHandler(async (req, res, next) => {
  const { reason, description } = req.body;
  if (!reason) return next(new ErrorResponse('Reason required', 400));
  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse('Post not found', 404));
  if (post.reports?.some(r => r.reporter.toString() === req.user.id)) {
    return next(new ErrorResponse('Already reported', 400));
  }
  if (!post.reports) post.reports = [];
  post.reports.push({ reporter: req.user.id, reason, description, createdAt: new Date() });
  post.reportCount = post.reports.length;
  if (post.reportCount >= 3) {
    post.aiFlag = true;
    post.aiFlagReason = 'Multiple reports';
  }
  await post.save();
  const admins = await User.find({ role: 'admin' });
  admins.forEach(admin => {
    req.app.get('io').to(`user:${admin._id}`).emit('post:reported', {
      postId: post._id,
      reportCount: post.reportCount,
      reason,
      reportedBy: req.user.username
    });
  });
  sendSuccess(res, { message: 'Reported', reportCount: post.reportCount });
});

exports.votePost = asyncHandler(async (req, res, next) => {
  const { type } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse('Post not found', 404));
  const userId = req.user.id;
  const hasUpvoted = post.upvotes.includes(userId);
  const hasDownvoted = post.downvotes.includes(userId);
  if (type === 'up') {
    if (hasUpvoted) post.upvotes.pull(userId);
    else { post.upvotes.addToSet(userId); post.downvotes.pull(userId); }
  } else if (type === 'down') {
    if (hasDownvoted) post.downvotes.pull(userId);
    else { post.downvotes.addToSet(userId); post.upvotes.pull(userId); }
  }
  post.voteScore = post.upvotes.length - post.downvotes.length;
  post.calculateHotScore();
  await post.save();
  if (type === 'up' && !hasUpvoted && post.author.toString() !== userId) {
    await createNotification(req.app.get('io'), {
      recipient: post.author,
      sender: userId,
      type: 'upvote',
      message: `${req.user.name} upvoted: "${post.title.substring(0, 50)}"`,
      post: post._id,
      link: `/posts/${post.slug || post._id}`
    });
  }
  sendSuccess(res, {
    voteScore: post.voteScore,
    upvoteCount: post.upvotes.length,
    downvoteCount: post.downvotes.length
  });
});

exports.bookmarkPost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse('Post not found', 404));
  const user = await User.findById(req.user.id);
  const isBookmarked = user.bookmarks.includes(req.params.id);
  if (isBookmarked) {
    user.bookmarks.pull(req.params.id);
    await Post.findByIdAndUpdate(req.params.id, { $inc: { bookmarkCount: -1 } });
  } else {
    user.bookmarks.addToSet(req.params.id);
    await Post.findByIdAndUpdate(req.params.id, { $inc: { bookmarkCount: 1 } });
  }
  await user.save();
  sendSuccess(res, { bookmarked: !isBookmarked });
});

exports.getTrending = asyncHandler(async (req, res) => {
  const hours = parseInt(req.query.hours) || 24;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const posts = await Post.find({ isRemoved: false, createdAt: { $gte: since } })
    .sort({ hotScore: -1, viewCount: -1 })
    .limit(10)
    .populate('author', 'name username avatar isPremium')
    .populate('community', 'name displayName avatar');
  sendSuccess(res, posts);
});

async function createNotification(io, data) {
  try {
    const notification = await Notification.create(data);
    const populated = await Notification.findById(notification._id).populate('sender', 'name username avatar');
    io.to(`user:${data.recipient}`).emit('notification:new', populated);
  } catch (err) {
    console.error('Notification error:', err.message);
  }
}

exports.createNotification = createNotification;