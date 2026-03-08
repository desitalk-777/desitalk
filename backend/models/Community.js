const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Community name is required'],
    unique: true,
    trim: true,
    match: [/^[a-zA-Z0-9_]{3,50}$/, 'Community name must be 3-50 chars, alphanumeric and underscore']
  },
  displayName: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  longDescription: {
    type: String,
    maxlength: 5000
  },
  avatar: { type: String, default: '' },
  avatarPublicId: { type: String },
  banner: { type: String, default: '' },
  bannerPublicId: { type: String },
  
  category: {
    type: String,
    enum: ['technology', 'entertainment', 'sports', 'news', 'education', 'food', 'travel', 'culture', 'politics', 'business', 'gaming', 'art', 'science', 'relationships', 'other'],
    default: 'other'
  },
  
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }],
  
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  memberCount: { type: Number, default: 0 },
  
  rules: [{
    title: String,
    description: String,
    order: Number
  }],
  
  type: {
    type: String,
    enum: ['public', 'restricted', 'private'],
    default: 'public'
  },
  
  isNSFW: { type: Boolean, default: false },
  isRemoved: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  
  postCount: { type: Number, default: 0 },
  
  // Allowed post types
  allowedPostTypes: [{
    type: String,
    enum: ['text', 'image', 'link', 'question', 'opinion', 'discussion']
  }],
  
  // Community flair tags
  flairs: [{ name: String, color: String }],
  
  // Weekly active users
  weeklyActiveUsers: { type: Number, default: 0 },
  
  tags: [String],
  
  primaryLanguage: {
    type: String,
    enum: ['hindi', 'english', 'tamil', 'telugu', 'bengali', 'marathi', 'gujarati', 'kannada', 'malayalam', 'punjabi', 'mixed'],
    default: 'english'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes
communitySchema.index({ name: 1 });
communitySchema.index({ memberCount: -1 });
communitySchema.index({ category: 1 });
communitySchema.index({ name: 'text', displayName: 'text', description: 'text' });

module.exports = mongoose.model('Community', communitySchema);
