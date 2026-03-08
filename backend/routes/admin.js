const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getUsers, banUser, unbanUser,
  deletePost, deleteComment, getReports, resolveReport,
  getFlaggedContent, featureCommunity
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/unban', unbanUser);
router.delete('/posts/:id', deletePost);
router.delete('/comments/:id', deleteComment);
router.get('/reports', getReports);
router.put('/reports/:id/resolve', resolveReport);
router.get('/flagged', getFlaggedContent);
router.put('/communities/:id/feature', featureCommunity);

module.exports = router;
