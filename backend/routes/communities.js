// routes/communities.js
const express = require('express');
const router = express.Router();
const {
  getCommunities, getCommunity, createCommunity, toggleMembership,
  getPopularCommunities, updateCommunity
} = require('../controllers/communityController');
const { protect, optionalAuth, requirePremium } = require('../middleware/auth');
const { uploadCommunity } = require('../config/cloudinary');

router.get('/popular', optionalAuth, getPopularCommunities);
router.get('/', optionalAuth, getCommunities);
router.get('/:name', optionalAuth, getCommunity);
router.post('/', protect, requirePremium, uploadCommunity.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), createCommunity);
router.post('/:id/membership', protect, toggleMembership);
router.put('/:id', protect, updateCommunity);

module.exports = router;
