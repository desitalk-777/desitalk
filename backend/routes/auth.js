// routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  register, login, logout, getMe, verifyEmail,
  forgotPassword, resetPassword, googleCallback, checkUsername
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map(v => v.run(req)));
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

router.post('/register', validate([
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 chars'),
  body('username').trim().matches(/^[a-z0-9_]{3,30}$/i).withMessage('Invalid username format'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
]), register);

router.post('/login', validate([
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
]), login);

router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/check-username/:username', checkUsername);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` }),
  googleCallback
);

module.exports = router;
