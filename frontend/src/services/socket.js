import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(window.location.origin, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => console.log('🔌 Socket connected'));
  socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinPost = (postId) => socket?.emit('join:post', postId);
export const leavePost = (postId) => socket?.emit('leave:post', postId);
export const joinCommunity = (communityId) => socket?.emit('join:community', communityId);
export const leaveCommunity = (communityId) => socket?.emit('leave:community', communityId);
