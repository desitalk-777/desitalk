const Post = require('../models/Post');
const Community = require('../models/Community');
const User = require('../models/User');
const { asyncHandler, sendSuccess } = require('../middleware/utils');

// @desc    Global search
// @route   GET /api/search?q=keyword&type=all|posts|communities|users
// @access  Public
exports.search = asyncHandler(async (req, res) => {
  const { q, type = 'all', page = 1, limit = 10 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.json({ success: true, data: { posts: [], communities: [], users: [] } });
  }

  const query = q.trim();
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const lim = parseInt(limit);

  const results = {};

  if (type === 'all' || type === 'posts') {
    results.posts = await Post.find({
      $text: { $search: query },
      isRemoved: false
    }, {
      score: { $meta: 'textScore' }
    })
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(lim)
      .populate('author', 'name username avatar isPremium')
      .populate('community', 'name displayName avatar')
      .select('title content type voteScore commentCount viewCount createdAt community author slug');
  }

  if (type === 'all' || type === 'communities') {
    results.communities = await Community.find({
      $text: { $search: query },
      isRemoved: false
    }, {
      score: { $meta: 'textScore' }
    })
      .sort({ score: { $meta: 'textScore' } })
      .limit(lim)
      .select('name displayName avatar description memberCount category');
  }

  if (type === 'all' || type === 'users') {
    const userQuery = new RegExp(query, 'i');
    results.users = await User.find({
      $or: [
        { username: userQuery },
        { name: userQuery }
      ],
      isBanned: false
    })
      .limit(lim)
      .select('name username avatar bio isPremium isVerified karma followerCount');
  }

  // Also search by tags if posts
  if (type === 'all' || type === 'posts') {
    const tagPosts = await Post.find({
      tags: query.toLowerCase(),
      isRemoved: false
    })
      .limit(5)
      .populate('author', 'name username avatar')
      .populate('community', 'name displayName avatar')
      .select('title content type voteScore commentCount viewCount createdAt community author slug');

    // Merge and deduplicate
    const postIds = new Set(results.posts?.map(p => p._id.toString()) || []);
    tagPosts.forEach(p => {
      if (!postIds.has(p._id.toString())) {
        results.posts = results.posts || [];
        results.posts.push(p);
      }
    });
  }

  sendSuccess(res, results);
});

// @desc    Autocomplete suggestions
// @route   GET /api/search/autocomplete?q=keyword
// @access  Public
exports.autocomplete = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 1) return res.json({ success: true, data: [] });

  const regex = new RegExp('^' + q, 'i');

  const [communities, users] = await Promise.all([
    Community.find({ name: regex, isRemoved: false })
      .limit(3)
      .select('name displayName avatar memberCount'),
    User.find({ username: regex, isBanned: false })
      .limit(3)
      .select('name username avatar isPremium')
  ]);

  const suggestions = [
    ...communities.map(c => ({ type: 'community', id: c._id, name: c.name, displayName: c.displayName, avatar: c.avatar, subtitle: `${c.memberCount} members` })),
    ...users.map(u => ({ type: 'user', id: u._id, name: u.name, username: u.username, avatar: u.avatar, subtitle: `u/${u.username}` }))
  ];

  sendSuccess(res, suggestions);
});

// @desc    Get trending tags
// @route   GET /api/search/trending-tags
// @access  Public
exports.getTrendingTags = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const tags = await Post.aggregate([
    { $match: { isRemoved: false, createdAt: { $gte: since } } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);

  sendSuccess(res, tags.map(t => ({ tag: t._id, count: t.count })));
});
