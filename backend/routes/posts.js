const express = require('express');
const router = express.Router();
const { 
  getPosts, 
  getPost, 
  createPost, 
  updatePost, 
  deletePost, 
  votePost, 
  bookmarkPost,
  reportPost,
  getTrending
} = require('../controllers/postController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Specific routes FIRST (before dynamic :id routes)
router.get('/trending', getTrending);

// General routes
router.get('/', getPosts);
router.get('/:id', getPost);
router.post('/', auth, upload.array('images', 4), createPost);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.post('/:id/vote', auth, votePost);
router.post('/:id/bookmark', auth, bookmarkPost);
router.post('/:id/report', auth, reportPost);

module.exports = router;