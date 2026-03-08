const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadPost } = require('../config/cloudinary');
const { asyncHandler, sendSuccess } = require('../middleware/utils');

// Upload single image
router.post('/image', protect, uploadPost.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  sendSuccess(res, {
    url: req.file.path,
    publicId: req.file.filename
  });
}));

module.exports = router;
