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
  reportPost 
} = require('../controllers/postController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getPosts);
router.get('/:id', getPost);
router.post('/', auth, upload.array('images', 4), createPost);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.post('/:id/vote', auth, votePost);
router.post('/:id/bookmark', auth, bookmarkPost);
router.post('/:id/report', auth, reportPost); // NEW

module.exports = router;