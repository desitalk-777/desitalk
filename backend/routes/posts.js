const express = require('express');
const router = express.Router();
const {
  getPosts, getPost, createPost, updatePost, deletePost,
  votePost, bookmarkPost, getTrending
} = require('../controllers/postController');
const { protect, optionalAuth } = require('../middleware/auth');
const { filterPostContent } = require('../middleware/moderation');
const { uploadPost } = require('../config/cloudinary');

router.get('/trending', optionalAuth, getTrending);
router.get('/', optionalAuth, getPosts);
router.get('/:id', optionalAuth, getPost);

router.post('/',
  protect,
  uploadPost.array('images', 4),
  filterPostContent,
  createPost
);

router.put('/:id', protect, filterPostContent, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/vote', protect, votePost);
router.post('/:id/bookmark', protect, bookmarkPost);

module.exports = router;
