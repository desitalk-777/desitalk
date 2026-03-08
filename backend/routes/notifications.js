const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const { protect } = require('../middleware/auth');
const { asyncHandler, sendSuccess, paginate } = require('../middleware/utils');

// Get notifications
router.get('/', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { skip, limit: lim, page: pageNum } = paginate(page, limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim)
      .populate('sender', 'name username avatar'),
    Notification.countDocuments({ recipient: req.user.id }),
    Notification.countDocuments({ recipient: req.user.id, isRead: false })
  ]);

  sendSuccess(res, notifications, 200, { total, unreadCount, page: pageNum });
}));

// Mark as read
router.put('/read/:id', protect, asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { isRead: true, readAt: new Date() }
  );
  sendSuccess(res, { message: 'Marked as read' });
}));

// Mark all as read
router.put('/read-all', protect, asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user.id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  sendSuccess(res, { message: 'All notifications marked as read' });
}));

// Get unread count
router.get('/unread-count', protect, asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
  sendSuccess(res, { count });
}));

// Submit report
router.post('/report', protect, asyncHandler(async (req, res) => {
  const { targetType, targetId, reason, description } = req.body;

  const reportData = {
    reporter: req.user.id,
    targetType,
    reason,
    description
  };

  if (targetType === 'post') reportData.targetPost = targetId;
  else if (targetType === 'comment') reportData.targetComment = targetId;
  else if (targetType === 'user') reportData.targetUser = targetId;
  else if (targetType === 'community') reportData.targetCommunity = targetId;

  await Report.create(reportData);

  // Update report count
  if (targetType === 'post') {
    const Post = require('../models/Post');
    await Post.findByIdAndUpdate(targetId, { $inc: { reportCount: 1 } });
  }

  sendSuccess(res, { message: 'Report submitted. Our team will review it.' }, 201);
}));

module.exports = router;
