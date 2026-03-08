const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id username name avatar');
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.username}`);

    // Join personal notification room
    socket.join(`user:${socket.userId}`);

    // Join community rooms
    socket.on('join:community', (communityId) => {
      socket.join(`community:${communityId}`);
    });

    socket.on('leave:community', (communityId) => {
      socket.leave(`community:${communityId}`);
    });

    // Join post room for live comments
    socket.on('join:post', (postId) => {
      socket.join(`post:${postId}`);
    });

    socket.on('leave:post', (postId) => {
      socket.leave(`post:${postId}`);
    });

    // Typing indicator
    socket.on('typing:start', ({ postId }) => {
      socket.to(`post:${postId}`).emit('typing:update', {
        userId: socket.userId,
        username: socket.user.username,
        isTyping: true
      });
    });

    socket.on('typing:stop', ({ postId }) => {
      socket.to(`post:${postId}`).emit('typing:update', {
        userId: socket.userId,
        username: socket.user.username,
        isTyping: false
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user.username}`);
    });
  });
};
