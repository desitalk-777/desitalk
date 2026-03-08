// This file is a combined routes index
// Individual route files:

// routes/comments.js
const express = require('express');
const commentRouter = express.Router();
const {
  getComments, addComment, rateComment, voteComment, deleteComment
} = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middleware/auth');
const { filterCommentContent } = require('../middleware/moderation');

commentRouter.get('/post/:postId', optionalAuth, getComments);
commentRouter.post('/', protect, filterCommentContent, addComment);
commentRouter.post('/:id/rate', protect, rateComment);
commentRouter.post('/:id/vote', protect, voteComment);
commentRouter.delete('/:id', protect, deleteComment);

module.exports = { commentRouter };
