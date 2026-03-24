const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    maxlength: [300, 'Title cannot exceed 300 characters']
  },
  content: {
    type: String,
    maxlength: [40000, 'Content cannot exceed 40000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'link', 'question', 'opinion', 'discussion'],
    default: 'text'
  },
  images: [{
    url: String,
    publicId: String,
    alt: { type: String, default: '' }
  }],
  externalLink: {
    url: String,
    title: String,
    description: String,
    thumbnail: String
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null
  },
  tags: [{ type: String, lowercase: true, trim: true }],
  
  // Voting/Rating
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  voteScore: { type: Number, default: 0, index: true },
  
  // Comments
  commentCount: { type: Number, default: 0 },
  
  // Engagement
  viewCount: { type: Number, default: 0, index: true },
  shareCount: { type: Number, default: 0 },
  bookmarkCount: { type: Number, default: 0 },
  
  // Trending score
  hotScore: { type: Number, default: 0, index: true },
  
  // Moderation
  isRemoved: { type: Boolean, default: false, index: true },
  removedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  removedReason: { type: String },
  removedAt: { type: Date },
  
  isNSFW: { type: Boolean, default: false },
  isSpoiler: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  
  // NEW: Reports/Flags
  reports: [{
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    description: String,
    createdAt: { type: Date, default: Date.now }
  }],
  reportCount: { type: Number, default: 0 },
  aiFlag: { type: Boolean, default: false },
  aiFlagReason: { type: String },
  
  // SEO
  slug: { type: String, index: true },
  metaDescription: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ community: 1, createdAt: -1 });
postSchema.index({ hotScore: -1, createdAt: -1 });
postSchema.index({ viewCount: -1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Virtual: upvote count
postSchema.virtual('upvoteCount').get(function () {
  return this.upvotes?.length || 0;
});

postSchema.virtual('downvoteCount').get(function () {
  return this.downvotes?.length || 0;
});

// Calculate hot score (Reddit-style algorithm)
postSchema.methods.calculateHotScore = function () {
  const score = (this.upvotes?.length || 0) - (this.downvotes?.length || 0);
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const seconds = (this.createdAt - new Date('2024-01-01')) / 1000;
  this.hotScore = Math.round(sign * order + seconds / 45000);
  return this;
};

// Generate slug
postSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100) + '-' + Date.now().toString(36);
  }
  next();
});

module.exports = mongoose.model('Post', postSchema);