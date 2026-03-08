const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [10000, 'Comment cannot exceed 10000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  depth: { type: Number, default: 0, max: 5 }, // Max 5 levels deep
  
  // Star ratings (1–5)
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    stars: { type: Number, min: 1, max: 5 }
  }],
  averageRating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  
  // Upvotes for comments
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  voteScore: { type: Number, default: 0 },
  
  // Reply count
  replyCount: { type: Number, default: 0 },
  
  // Moderation
  isRemoved: { type: Boolean, default: false },
  removedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  removedReason: { type: String },
  
  // AI moderation
  aiFlag: { type: Boolean, default: false },
  
  reportCount: { type: Number, default: 0 },
  
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes
commentSchema.index({ post: 1, parent: 1, createdAt: -1 });
commentSchema.index({ post: 1, averageRating: -1 }); // For sorting by rating
commentSchema.index({ author: 1 });

// Calculate average rating
commentSchema.methods.calculateAverageRating = function () {
  if (!this.ratings || this.ratings.length === 0) {
    this.averageRating = 0;
    this.ratingCount = 0;
    return;
  }
  const total = this.ratings.reduce((sum, r) => sum + r.stars, 0);
  this.averageRating = Math.round((total / this.ratings.length) * 10) / 10;
  this.ratingCount = this.ratings.length;
};

module.exports = mongoose.model('Comment', commentSchema);
