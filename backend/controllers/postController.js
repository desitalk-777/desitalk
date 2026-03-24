// Existing content above line 31...

<<<<<<< HEAD
// @desc    Get feed posts (FIXED: Shows ALL posts on New/Rising/Hot)
// @route   GET /api/posts
// @access  Public
exports.getPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sort = 'hot', community, tag } = req.query;
  const { skip, limit: lim, page: pageNum } = paginate(page, limit);

  // Build query - shows ALL posts by default
  let query = { isRemoved: false };
  
  // Only filter by community if explicitly requested
  if (community) {
    query.community = community;
  }
  
  // Filter by tag if specified
  if (tag) {
    query.tags = tag.toLowerCase();
  }

  // Determine sort order based on feed type
  let sortObj = {};
  switch (sort) {
    case 'hot':
      sortObj = { hotScore: -1, createdAt: -1 };
      break;
    case 'new':
      sortObj = { createdAt: -1 }; // Newest posts first
      break;
    case 'top':
      sortObj = { voteScore: -1, createdAt: -1 }; // Highest upvotes first
      break;
    case 'rising':
      sortObj = { viewCount: -1, createdAt: -1 }; // Most viewed first
      break;
    default:
      sortObj = { hotScore: -1 };
  }

  // Fetch posts and total count
  const [posts, total] = await Promise.all([
    Post.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(lim)
      .populate('author', 'name username avatar isPremium isVerified role')
      .populate('community', 'name displayName avatar'),
    Post.countDocuments(query)
  ]);

  sendSuccess(res, posts, 200, {
    pagination: { 
      total, 
      page: pageNum, 
      limit: lim, 
      pages: Math.ceil(total / lim) 
    }
  });
});

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
exports.getPost = asyncHandler(async (req, res, next) => {
  const post = await Post.findOne({
    $or: [{ _id: req.params.id }, { slug: req.params.id }],
    isRemoved: false
  })
    .populate('author', 'name username avatar isPremium isVerified bio karma')
    .populate('community', 'name displayName avatar description');

  if (!post) return next(new ErrorResponse('Post not found', 404));

  // Increment view count
  await Post.findByIdAndUpdate(post._id, { $inc: { viewCount: 1 } });

  // Add vote status for current user
  const postObj = post.toObject();
  if (req.user) {
    postObj.userVote = post.upvotes.includes(req.user.id) ? 'up' :
      post.downvotes.includes(req.user.id) ? 'down' : null;
    postObj.isBookmarked = req.user.bookmarks?.includes(post._id);
    // Check if user can delete this post
    postObj.canDelete = post.author.toString() === req.user.id || req.user.role === 'admin';
  }

  sendSuccess(res, postObj);
});

// @desc    Create post
// @route   POST /api/posts
// @access  Private
exports.createPost = asyncHandler(async (req, res, next) => {
  const { title, content, type, tags, communityId, externalLink, isNSFW, isSpoiler } = req.body;

  // Validate title
  if (!title?.trim()) {
    return next(new ErrorResponse('Post title is required', 400));
  }

  // Validate community if provided
  if (communityId) {
    const community = await Community.findById(communityId);
    if (!community) return next(new ErrorResponse('Community not found', 404));
    if (community.type === 'private' && !community.members.includes(req.user.id)) {
      return next(new ErrorResponse('You must be a member to post in this community', 403));
    }
  }

  // Check if external link requires premium
  if (externalLink?.url && !req.user.isPremium) {
    return next(new ErrorResponse('External links require a Premium subscription', 403));
  }

  // Handle images
  let images = [];
  if (req.files?.length > 0) {
    images = req.files.map(f => ({ url: f.path, publicId: f.filename }));
  }

  // Create post
  const post = await Post.create({
    title: title.trim(),
    content: content?.trim(),
    type: type || (images.length > 0 ? 'image' : externalLink ? 'link' : 'text'),
    images,
    externalLink,
    author: req.user.id,
    community: communityId || null, // Can be null for profile posts
    tags: tags ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 5) : [],
    isNSFW: isNSFW === 'true',
    isSpoiler: isSpoiler === 'true',
    aiFlag: req.body.aiFlag || false,
    aiFlagReason: req.body.aiFlagReason
  });

  // Calculate initial hot score
  post.calculateHotScore();
  await post.save();

  // Update user post count and karma
  await User.findByIdAndUpdate(req.user.id, { $inc: { postCount: 1, karma: 5 } });

  // Update community post count
  if (communityId) {
    await Community.findByIdAndUpdate(communityId, { $inc: { postCount: 1 } });
  }

  // Populate and return
  const populated = await Post.findById(post._id)
    .populate('author', 'name username avatar isPremium isVerified')
    .populate('community', 'name displayName avatar');

  // Emit real-time event to all connected clients
  req.app.get('io').emit('post:new', populated);

  // Also emit to community if applicable
  if (communityId) {
    req.app.get('io').to(`community:${communityId}`).emit('post:new', populated);
  }

  sendSuccess(res, populated, 201);
});

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse('Post not found', 404));

  // Only author or admin can update
  if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to edit this post', 403));
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

// @desc    Delete post (SOFT DELETE - marks as removed)
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse('Post not found', 404));

  // Only author or admin can delete
  if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Only author or admin can delete this post', 403));
  }

  // Soft delete - mark as removed
  await Post.findByIdAndUpdate(req.params.id, {
    isRemoved: true,
    removedBy: req.user.id,
    removedReason: req.body.reason || 'Deleted by user',
    removedAt: new Date()
  });

  // Decrement user post count
  await User.findByIdAndUpdate(post.author, { $inc: { postCount: -1 } });

  sendSuccess(res, { message: 'Post deleted successfully' });
});

// @desc    Report post (NEW FEATURE)
// @route   POST /api/posts/:id/report
// @access  Private
exports.reportPost = asyncHandler(async (req, res, next) => {
  const { reason, description } = req.body;

  if (!reason) {
    return next(new ErrorResponse('Report reason is required', 400));
  }

  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse('Post not found', 404));

  // Prevent duplicate reports from same user
  if (post.reports?.some(r => r.reporter.toString() === req.user.id)) {
    return next(new ErrorResponse('You have already reported this post', 400));
  }

  // Initialize reports array if not exists
  if (!post.reports) post.reports = [];

  // Add report
  post.reports.push({
    reporter: req.user.id,
    reason,
    description,
    createdAt: new Date()
  });

  post.reportCount = post.reports.length;

  // Auto-flag post if multiple reports
  if (post.reportCount >= 3) {
    post.aiFlag = true;
    post.aiFlagReason = 'Multiple user reports';
  }

  await post.save();

  // Notify all admins of the report
  const admins = await User.find({ role: 'admin' });
  admins.forEach(admin => {
    req.app.get('io').to(`user:${admin._id}`).emit('post:reported', {
      postId: post._id,
      reportCount: post.reportCount,
      reason,
      reportedBy: req.user.username,
      timestamp: new Date()
    });
  });

  sendSuccess(res, { 
    message: 'Post reported successfully', 
    reportCount: post.reportCount 
  });
});

// @desc    Vote on post
// @route   POST /api/posts/:id/vote
// @access  Private
exports.votePost = asyncHandler(async (req, res, next) => {
  const { type } = req.body; // 'up' | 'down' | 'remove'
  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse('Post not found', 404));

  const userId = req.user.id;
  const hasUpvoted = post.upvotes.includes(userId);
  const hasDownvoted = post.downvotes.includes(userId);

  if (type === 'up') {
    if (hasUpvoted) {
      // Remove upvote
      post.upvotes.pull(userId);
    } else {
      // Add upvote and remove downvote if exists
      post.upvotes.addToSet(userId);
      post.downvotes.pull(userId);
    }
  } else if (type === 'down') {
    if (hasDownvoted) {
      // Remove downvote
      post.downvotes.pull(userId);
    } else {
      // Add downvote and remove upvote if exists
      post.downvotes.addToSet(userId);
      post.upvotes.pull(userId);
    }
  } else {
    // Remove all votes
    post.upvotes.pull(userId);
    post.downvotes.pull(userId);
  }

  // Recalculate vote score and hot score
  post.voteScore = post.upvotes.length - post.downvotes.length;
  post.calculateHotScore();
  await post.save();

  // Notify author of upvote
  if (type === 'up' && !hasUpvoted && post.author.toString() !== userId) {
    await createNotification(req.app.get('io'), {
      recipient: post.author,
      sender: userId,
      type: 'upvote',
      message: `${req.user.name} upvoted your post: "${post.title.substring(0, 50)}"`,
      post: post._id,
      link: `/posts/${post.slug || post._id}`
    });
  }

  sendSuccess(res, {
    voteScore: post.voteScore,
    upvoteCount: post.upvotes.length,
    downvoteCount: post.downvotes.length,
    userVote: post.upvotes.includes(userId) ? 'up' : post.downvotes.includes(userId) ? 'down' : null
  });
});

// @desc    Bookmark post
// @route   POST /api/posts/:id/bookmark
// @access  Private
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

// @desc    Get trending posts
// @route   GET /api/posts/trending
// @access  Public
exports.getTrending = asyncHandler(async (req, res) => {
  const hours = parseInt(req.query.hours) || 24;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const posts = await Post.find({
    isRemoved: false,
    createdAt: { $gte: since }
  })
    .sort({ hotScore: -1, viewCount: -1 })
    .limit(10)
    .populate('author', 'name username avatar isPremium')
    .populate('community', 'name displayName avatar');

  sendSuccess(res, posts);
});

// Helper: Create notification
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
=======
query.community = { $in: [...user.communities, null] };

// Existing content below line 31...
>>>>>>> 0682740deff4d21331c31817c7375ac9879afac9
