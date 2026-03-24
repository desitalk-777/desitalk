// Async error handler wrapper
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

exports.ErrorResponse = ErrorResponse;

// Pagination helper
exports.paginate = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  return { skip, limit: limitNum, page: pageNum };
};

// Send success response
exports.sendSuccess = (res, data, statusCode = 200, meta = {}) => {
  res.status(statusCode).json({
    success: true,
    ...meta,
    data
  });
};

// Format user for public display
exports.formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  avatar: user.avatar,
  isPremium: user.isPremium,
  isVerified: user.isVerified,
  role: user.role,
  karma: user.karma
});

// Validate object ID
exports.isValidObjectId = (id) => {
  return id.match(/^[0-9a-fA-F]{24}$/) !== null;
};

// Generate slug
exports.generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
};