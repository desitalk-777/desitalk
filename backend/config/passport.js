const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Serialize/Deserialize user
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Local Strategy (Email/Password)
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user) return done(null, false, { message: 'Invalid email or password' });
      if (user.isBanned) return done(null, false, { message: 'Your account has been banned' });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return done(null, false, { message: 'Invalid email or password' });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (user) {
      if (user.isBanned) return done(null, false, { message: 'Account is banned' });
      return done(null, user);
    }

    // Check if email already exists
    user = await User.findOne({ email: profile.emails[0].value });
    if (user) {
      user.googleId = profile.id;
      if (!user.avatar && profile.photos[0]) {
        user.avatar = profile.photos[0].value;
      }
      await user.save();
      return done(null, user);
    }

    // Create new user
    const username = await generateUniqueUsername(profile.displayName);
    user = await User.create({
      name: profile.displayName,
      username,
      email: profile.emails[0].value,
      googleId: profile.id,
      avatar: profile.photos[0]?.value || '',
      isEmailVerified: true
    });

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Helper: Generate unique username from display name
async function generateUniqueUsername(displayName) {
  let base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);
  
  if (!base) base = 'user';
  
  let username = base;
  let count = 0;
  
  while (await User.findOne({ username })) {
    count++;
    username = `${base}${count}`;
  }
  
  return username;
}

module.exports = passport;
