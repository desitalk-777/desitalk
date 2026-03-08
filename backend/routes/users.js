const express = require('express');
const router = express.Router();
const {
  getProfile, updateProfile, updatePassword, toggleFollow,
  getUserPosts, getBookmarks, getAnalytics, getFollowers, getFollowing
} = require('../controllers/userController');
const { protect, optionalAuth, requirePremium } = require('../middleware/auth');
const { uploadAvatar } = require('../config/cloudinary');

router.get('/bookmarks', protect, getBookmarks);
router.get('/analytics', protect, requirePremium, getAnalytics);
router.put('/profile', protect, uploadAvatar.single('avatar'), updateProfile);
router.put('/update-password', protect, updatePassword);
router.get('/:username', optionalAuth, getProfile);
router.get('/:username/posts', optionalAuth, getUserPosts);
router.post('/:id/follow', protect, toggleFollow);
router.get('/:id/followers', optionalAuth, getFollowers);
router.get('/:id/following', optionalAuth, getFollowing);

module.exports = router;
