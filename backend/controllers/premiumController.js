const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { asyncHandler, ErrorResponse, sendSuccess } = require('../middleware/utils');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const PREMIUM_PRICE = parseInt(process.env.PREMIUM_PRICE_INR) || 8900; // ₹89 in paise

// @desc    Create Razorpay order
// @route   POST /api/premium/create-order
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
  const options = {
    amount: PREMIUM_PRICE,
    currency: 'INR',
    receipt: `order_${req.user.id}_${Date.now()}`,
    notes: {
      userId: req.user.id.toString(),
      username: req.user.username,
      plan: 'monthly'
    }
  };

  try {
    const order = await razorpay.orders.create(options);

    // Store pending subscription
    await Subscription.create({
      user: req.user.id,
      razorpayOrderId: order.id,
      amount: PREMIUM_PRICE,
      currency: 'INR',
      status: 'created',
      planType: 'monthly'
    });

    sendSuccess(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      user: {
        name: req.user.name,
        email: req.user.email
      }
    }, 201);
  } catch (err) {
    return next(new ErrorResponse('Payment gateway error. Please try again.', 500));
  }
});

// @desc    Verify payment and activate premium
// @route   POST /api/premium/verify-payment
// @access  Private
exports.verifyPayment = asyncHandler(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new ErrorResponse('Invalid payment data', 400));
  }

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return next(new ErrorResponse('Payment verification failed', 400));
  }

  // Activate premium
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 1);

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      isPremium: true,
      premiumExpiry: expiryDate,
      isVerified: true
    },
    { new: true }
  ).select('-password');

  // Update subscription record
  await Subscription.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'paid',
      startDate: new Date(),
      endDate: expiryDate,
      isActive: true
    }
  );

  sendSuccess(res, {
    message: '🎉 Premium activated! Welcome to DesiTalk Premium.',
    premiumExpiry: expiryDate,
    user: {
      isPremium: user.isPremium,
      isVerified: user.isVerified,
      premiumExpiry: user.premiumExpiry
    }
  });
});

// @desc    Get premium status
// @route   GET /api/premium/status
// @access  Private
exports.getPremiumStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('isPremium premiumExpiry isVerified');

  // Check if premium expired
  if (user.isPremium && user.premiumExpiry && user.premiumExpiry < new Date()) {
    await User.findByIdAndUpdate(req.user.id, { isPremium: false });
    user.isPremium = false;
  }

  const subscription = await Subscription.findOne({
    user: req.user.id,
    status: 'paid'
  }).sort({ createdAt: -1 });

  sendSuccess(res, {
    isPremium: user.isPremium,
    premiumExpiry: user.premiumExpiry,
    isVerified: user.isVerified,
    lastPayment: subscription?.createdAt,
    amount: subscription?.amount ? (subscription.amount / 100).toFixed(0) : null
  });
});

// @desc    Get premium plans info
// @route   GET /api/premium/plans
// @access  Public
exports.getPlans = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    plans: [
      {
        id: 'monthly',
        name: 'DesiTalk Premium',
        price: 89,
        currency: 'INR',
        period: 'month',
        features: [
          '✅ Verified badge on profile',
          '✅ Create communities',
          '✅ Post clickable external links',
          '✅ Promote YouTube, Instagram & more',
          '✅ Creator analytics dashboard',
          '✅ Priority support',
          '✅ Exclusive premium flair',
          '✅ Early access to new features'
        ]
      }
    ]
  });
});

// @desc    Razorpay webhook handler
// @route   POST /api/premium/webhook
// @access  Public (webhook)
exports.webhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const { event, payload } = req.body;

  if (event === 'payment.failed') {
    const orderId = payload.payment.entity.order_id;
    await Subscription.findOneAndUpdate(
      { razorpayOrderId: orderId },
      { status: 'failed' }
    );
  }

  res.json({ received: true });
});
