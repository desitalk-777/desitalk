const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['post', 'comment', 'user', 'community'], required: true },
  targetPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  targetComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetCommunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
  reason: {
    type: String,
    enum: ['spam', 'harassment', 'hate_speech', 'misinformation', 'nsfw', 'violence', 'illegal', 'other'],
    required: true
  },
  description: { type: String, maxlength: 1000 },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  resolution: { type: String }
}, { timestamps: true });

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporter: 1 });

module.exports = mongoose.model('Report', reportSchema);
