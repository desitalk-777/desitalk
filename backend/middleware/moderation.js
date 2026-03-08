const Filter = require('bad-words');

const filter = new Filter();

// Add Indian language profanity patterns (Hinglish)
const indianProfanity = [
  'madarchod', 'bhosdike', 'bhosad', 'chutiya', 'chutiye', 'gandu', 'randi',
  'haramkhor', 'harami', 'kamina', 'kutiya', 'lavda', 'loda', 'lund', 'maderchod',
  'saala', 'saali', 'behenchod', 'bc', 'mc', 'bkl', 'bsdk'
];

indianProfanity.forEach(word => filter.addWords(word));

// Clean text content
exports.cleanContent = (text) => {
  if (!text) return text;
  try {
    return filter.clean(text);
  } catch {
    return text;
  }
};

// Check if content has profanity
exports.hasProfanity = (text) => {
  if (!text) return false;
  try {
    return filter.isProfane(text);
  } catch {
    return false;
  }
};

// Middleware to clean post content
exports.filterPostContent = (req, res, next) => {
  if (req.body.title) {
    req.body.title = exports.cleanContent(req.body.title);
  }
  if (req.body.content) {
    req.body.content = exports.cleanContent(req.body.content);
    // Flag for AI review if heavily filtered
    if (exports.hasProfanity(req.body.content)) {
      req.body.aiFlag = true;
      req.body.aiFlagReason = 'Profanity detected';
    }
  }
  next();
};

// Middleware to clean comment content
exports.filterCommentContent = (req, res, next) => {
  if (req.body.content) {
    const original = req.body.content;
    req.body.content = exports.cleanContent(req.body.content);
    if (original !== req.body.content) {
      req.body.wasFiltered = true;
    }
  }
  next();
};

// Check for spam patterns
exports.isSpam = (text) => {
  if (!text) return false;
  const spamPatterns = [
    /(.)\1{10,}/,              // Repeated characters
    /https?:\/\/[^\s]+/gi,     // Too many links
    /(\b\w+\b)(\s+\1){3,}/i,  // Repeated words
  ];
  const linkCount = (text.match(/https?:\/\//gi) || []).length;
  if (linkCount > 5) return true;
  return spamPatterns.slice(0, 2).some(p => p.test(text));
};

// XSS sanitize
exports.sanitizeHtml = (text) => {
  if (!text) return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};
