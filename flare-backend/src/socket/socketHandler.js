const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

// userId -> socketId, so we can push events / route calls to specific users
const onlineUsers = new Map();

function initSocket(io) {
  // Authenticate every socket connection with the same JWT used for REST
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.userId;
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);

    await prisma.user.update({ where: { id: userId }, data: { online: true } });
    socket.broadcast.emit('presence:update', { userId, online: true });

    // Join a room per chat so messages/typing broadcast only to participants
    socket.on('chat:join', (chatId) => socket.join(`chat:${chatId}`));
    socket.on('chat:leave', (chatId) => socket.leave(`chat:${chatId}`));

    // ---- Messaging ----
    // Client sends the message via REST first (so it's durably stored),
    // then emits this so other participants get it live.
    socket.on('message:new', ({ chatId, message }) => {
      socket.to(`chat:${chatId}`).emit('message:new', { chatId, message });
    });

    socket.on('message:delivered', ({ chatId, messageId }) => {
      io.to(`chat:${chatId}`).emit('message:delivered', { messageId, userId });
    });

    socket.on('message:read', ({ chatId, messageIds }) => {
      socket.to(`chat:${chatId}`).emit('message:read', { chatId, messageIds, userId });
    });

    // ---- Typing indicator ----
    socket.on('typing:start', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('typing:start', { chatId, userId });
    });
    socket.on('typing:stop', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('typing:stop', { chatId, userId });
    });

    // ---- WebRTC call signaling (voice/video) ----
    // The server never touches media - it only relays SDP offers/answers and
    // ICE candidates so two devices can establish a direct P2P connection.
    socket.on('call:invite', ({ chatId, toUserId, offer, isVideo }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call:invite', { chatId, fromUserId: userId, offer, isVideo });
      } else {
        socket.emit('call:unavailable', { toUserId });
      }
    });

    socket.on('call:answer', ({ toUserId, answer }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) io.to(targetSocketId).emit('call:answer', { fromUserId: userId, answer });
    });

    socket.on('call:ice-candidate', ({ toUserId, candidate }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) io.to(targetSocketId).emit('call:ice-candidate', { fromUserId: userId, candidate });
    });

    socket.on('call:reject', ({ toUserId }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) io.to(targetSocketId).emit('call:reject', { fromUserId: userId });
    });

    socket.on('call:end', ({ toUserId }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) io.to(targetSocketId).emit('call:end', { fromUserId: userId });
    });

    // ---- Disconnect / presence ----
    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      const lastSeen = new Date();
      await prisma.user.update({ where: { id: userId }, data: { online: false, lastSeen } });
      socket.broadcast.emit('presence:update', { userId, online: false, lastSeen });
    });
  });
}

module.exports = { initSocket, onlineUsers };