const express = require('express');
const router = express.Router();
const {
  getComments, addComment, rateComment, voteComment, deleteComment
} = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middleware/auth');
const { filterCommentContent } = require('../middleware/moderation');

router.get('/post/:postId', optionalAuth, getComments);
router.post('/', protect, filterCommentContent, addComment);
router.post('/:id/rate', protect, rateComment);
router.post('/:id/vote', protect, voteComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;
