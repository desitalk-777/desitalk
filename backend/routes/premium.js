const express = require('express');
const router = express.Router();
const {
  createOrder, verifyPayment, getPremiumStatus, getPlans, webhook
} = require('../controllers/premiumController');
const { protect } = require('../middleware/auth');

router.get('/plans', getPlans);
router.get('/status', protect, getPremiumStatus);
router.post('/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);
router.post('/webhook', webhook);

module.exports = router;
