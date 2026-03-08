const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { asyncHandler, ErrorResponse, paginate, sendSuccess } = require('../middleware/utils');

// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Public
exports.getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { sort = 'top', page = 1, limit = 50 } = req.query;
  const { skip, limit: lim } = paginate(page, limit, 50);

  let sortObj = {};
  switch (sort) {
    case 'top': sortObj = { averageRating: -1, voteScore: -1, createdAt: -1 }; break;
    case 'new': sortObj = { createdAt: -1 }; break;
    case 'old': sortObj = { createdAt: 1 }; break;
    default: sortObj = { averageRating: -1, voteScore: -1 };
  }

  // Get top-level comments
  const comments = await Comment.find({ post: postId, parent: null, isRemoved: false })
    .sort(sortObj)
    .skip(skip)
    .limit(lim)
    .populate('author', 'name username avatar isPremium isVerified role')
    .lean();

  // Get replies for each comment (2 levels deep)
  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const replies = await Comment.find({ post: postId, parent: comment._id, isRemoved: false })
        .sort({ averageRating: -1, createdAt: 1 })
        .limit(20)
        .populate('author', 'name username avatar isPremium isVerified')
        .lean();

      // Get nested replies
      const repliesWithNested = await Promise.all(
        replies.map(async (reply) => {
          const nested = await Comment.find({ parent: reply._id, isRemoved: false })
            .sort({ createdAt: 1 })
            .limit(10)
            .populate('author', 'name username avatar isPremium')
            .lean();
          return { ...reply, replies: nested };
        })
      );

      // Add user vote/rating status
      if (req.user) {
        comment.userVote = comment.upvotes?.includes(req.user.id) ? 'up' :
          comment.downvotes?.includes(req.user.id) ? 'down' : null;
        const userRating = comment.ratings?.find(r => r.user?.toString() === req.user.id);
        comment.userRating = userRating?.stars || null;
      }

      return { ...comment, replies: repliesWithNested };
    })
  );

  const total = await Comment.countDocuments({ post: postId, parent: null, isRemoved: false });
  sendSuccess(res, commentsWithReplies, 200, { total });
});

// @desc    Add comment
// @route   POST /api/comments
// @access  Private
exports.addComment = asyncHandler(async (req, res, next) => {
  const { postId, content, parentId } = req.body;

  if (!content?.trim()) {
    return next(new ErrorResponse('Comment content is required', 400));
  }

  const post = await Post.findById(postId);
  if (!post) return next(new ErrorResponse('Post not found', 404));
  if (post.isLocked) return next(new ErrorResponse('This post is locked', 403));

  let depth = 0;
  if (parentId) {
    const parent = await Comment.findById(parentId);
    if (!parent) return next(new ErrorResponse('Parent comment not found', 404));
    depth = Math.min((parent.depth || 0) + 1, 5);
  }

  const comment = await Comment.create({
    content: req.body.content.trim(),
    author: req.user.id,
    post: postId,
    parent: parentId || null,
    depth
  });

  // Update counts
  await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });
  if (parentId) {
    await Comment.findByIdAndUpdate(parentId, { $inc: { replyCount: 1 } });
  }
  await User.findByIdAndUpdate(req.user.id, { $inc: { commentCount: 1, karma: 2 } });

  const populated = await Comment.findById(comment._id)
    .populate('author', 'name username avatar isPremium isVerified role');

  // Send notifications
  const io = req.app.get('io');

  if (parentId) {
    // Notify comment author of reply
    const parentComment = await Comment.findById(parentId);
    if (parentComment && parentComment.author.toString() !== req.user.id) {
      await createNotification(io, {
        recipient: parentComment.author,
        sender: req.user.id,
        type: 'reply',
        message: `${req.user.name} replied to your comment`,
        post: postId,
        comment: comment._id,
        link: `/posts/${post.slug || postId}`
      });
    }
  } else {
    // Notify post author of comment
    if (post.author.toString() !== req.user.id) {
      await createNotification(io, {
        recipient: post.author,
        sender: req.user.id,
        type: 'comment',
        message: `${req.user.name} commented on your post: "${post.title.substring(0, 50)}"`,
        post: postId,
        comment: comment._id,
        link: `/posts/${post.slug || postId}`
      });
    }
  }

  // Handle @mentions in content
  const mentions = content.match(/@(\w+)/g);
  if (mentions) {
    for (const mention of mentions.slice(0, 5)) {
      const username = mention.substring(1);
      const mentionedUser = await User.findOne({ username });
      if (mentionedUser && mentionedUser._id.toString() !== req.user.id) {
        await createNotification(io, {
          recipient: mentionedUser._id,
          sender: req.user.id,
          type: 'mention',
          message: `${req.user.name} mentioned you in a comment`,
          post: postId,
          comment: comment._id,
          link: `/posts/${post.slug || postId}`
        });
      }
    }
  }

  // Emit real-time event
  io.to(`post:${postId}`).emit('comment:new', populated);

  sendSuccess(res, populated, 201);
});

// @desc    Rate a comment (1-5 stars)
// @route   POST /api/comments/:id/rate
// @access  Private
exports.rateComment = asyncHandler(async (req, res, next) => {
  const { stars } = req.body;

  if (!stars || stars < 1 || stars > 5) {
    return next(new ErrorResponse('Stars must be between 1 and 5', 400));
  }

  const comment = await Comment.findById(req.params.id);
  if (!comment) return next(new ErrorResponse('Comment not found', 404));

  if (comment.author.toString() === req.user.id) {
    return next(new ErrorResponse('You cannot rate your own comment', 403));
  }

  // Check existing rating
  const existingRatingIndex = comment.ratings.findIndex(
    r => r.user?.toString() === req.user.id
  );

  if (existingRatingIndex > -1) {
    comment.ratings[existingRatingIndex].stars = parseInt(stars);
  } else {
    comment.ratings.push({ user: req.user.id, stars: parseInt(stars) });
  }

  comment.calculateAverageRating();
  await comment.save();

  // Karma for comment author
  if (parseInt(stars) >= 4) {
    await User.findByIdAndUpdate(comment.author, { $inc: { karma: 1 } });
  }

  sendSuccess(res, {
    averageRating: comment.averageRating,
    ratingCount: comment.ratingCount,
    userRating: parseInt(stars)
  });
});

// @desc    Vote on comment
// @route   POST /api/comments/:id/vote
// @access  Private
exports.voteComment = asyncHandler(async (req, res, next) => {
  const { type } = req.body;
  const comment = await Comment.findById(req.params.id);
  if (!comment) return next(new ErrorResponse('Comment not found', 404));

  const userId = req.user.id;
  if (type === 'up') {
    if (comment.upvotes.includes(userId)) {
      comment.upvotes.pull(userId);
    } else {
      comment.upvotes.addToSet(userId);
      comment.downvotes.pull(userId);
    }
  } else {
    if (comment.downvotes.includes(userId)) {
      comment.downvotes.pull(userId);
    } else {
      comment.downvotes.addToSet(userId);
      comment.upvotes.pull(userId);
    }
  }

  comment.voteScore = comment.upvotes.length - comment.downvotes.length;
  await comment.save();

  sendSuccess(res, {
    voteScore: comment.voteScore,
    userVote: comment.upvotes.includes(userId) ? 'up' : comment.downvotes.includes(userId) ? 'down' : null
  });
});

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return next(new ErrorResponse('Comment not found', 404));

  if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }

  await Comment.findByIdAndUpdate(req.params.id, { isRemoved: true, removedBy: req.user.id });
  await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

  sendSuccess(res, { message: 'Comment deleted' });
});

// Helper
async function createNotification(io, data) {
  try {
    const { Notification } = require('../models/Notification');
    const n = await Notification.create(data);
    io.to(`user:${data.recipient}`).emit('notification:new', n);
  } catch (err) {}
}
