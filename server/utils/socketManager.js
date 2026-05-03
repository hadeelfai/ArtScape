import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import User from '../models/User.js';
import DirectMessage from '../models/DirectMessage.js';

let io = null;

export const initSocketServer = (httpServer, corsOrigins = []) => {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
    allowEIO3: true,
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new Error('Authentication required');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name accountStatus');
      if (!user || user.accountStatus !== 'active') {
        throw new Error('User not found or inactive');
      }

      socket.data.userId = user._id.toString();
      socket.data.userName = user.name || 'Unknown User';
      next();
    } catch (error) {
      console.error('Socket auth failed:', error.message);
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    if (userId) {
      socket.join(userId);
      socket.emit('dm:connected', { userId });
    }

    socket.on('dm:send', async (payload, callback) => {
      try {
        const { recipientId, content } = payload || {};
        const senderId = socket.data.userId;

        if (!recipientId || !content || !content.trim()) {
          throw new Error('Invalid message payload');
        }

        const recipient = await User.findById(recipientId).select('_id name profileImage');
        if (!recipient) {
          throw new Error('Recipient not found');
        }

        const message = await DirectMessage.create({
          sender: senderId,
          recipient: recipientId,
          content: content.trim(),
          read: false,
        });

        await message.populate('sender', '_id name profileImage');
        await message.populate('recipient', '_id name profileImage');

        const conversationId = [senderId, recipientId].sort().join('-');
        const responseMessage = message.toObject();

        const unreadCount = await DirectMessage.countDocuments({
          recipient: recipientId,
          read: false,
        });

        const senderSummary = {
          conversationId,
          participantId: recipientId,
          participantName: recipient.name || 'Unknown User',
          participantAvatar: recipient.profileImage,
          lastMessage: responseMessage.content,
          lastMessageTime: responseMessage.createdAt,
          unreadCount: 0,
        };

        const recipientSummary = {
          conversationId,
          participantId: senderId,
          participantName: socket.data.userName,
          participantAvatar: responseMessage.sender.profileImage,
          lastMessage: responseMessage.content,
          lastMessageTime: responseMessage.createdAt,
          unreadCount,
        };

        io.to(recipientId).emit('dm:new', {
          message: responseMessage,
          conversationId,
          senderId,
        });

        io.to(recipientId).emit('dm:conversation:update', {
          conversation: recipientSummary,
        });

        io.to(recipientId).emit('dm:unreadCount', {
          unreadCount,
        });

        io.to(senderId).emit('dm:conversation:update', {
          conversation: senderSummary,
        });

        if (typeof callback === 'function') {
          callback({
            success: true,
            message: responseMessage,
            conversationId,
            unreadCount,
          });
        }
      } catch (error) {
        console.error('Socket dm:send error:', error);
        if (typeof callback === 'function') {
          callback({
            success: false,
            error: error.message || 'Failed to send message',
          });
        }
      }
    });

    socket.on('dm:readConversation', async ({ conversationId }, callback) => {
      try {
        const userId = socket.data.userId;
        if (!conversationId || !userId) {
          throw new Error('Invalid conversation ID');
        }

        const [user1, user2] = conversationId.split('-');
        if (userId !== user1 && userId !== user2) {
          throw new Error('Unauthorized for conversation');
        }

        const otherUserId = userId === user1 ? user2 : user1;
        await DirectMessage.updateMany(
          {
            recipient: userId,
            sender: otherUserId,
            read: false,
          },
          { read: true }
        );

        const unreadCount = await DirectMessage.countDocuments({
          recipient: userId,
          read: false,
        });

        io.to(userId).emit('dm:unreadCount', { unreadCount });
        io.to(otherUserId).emit('dm:read', {
          conversationId,
          readerId: userId,
        });

        if (typeof callback === 'function') {
          callback({ success: true, unreadCount });
        }
      } catch (error) {
        console.error('Socket dm:readConversation error:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: error.message || 'Failed to mark conversation read' });
        }
      }
    });

    socket.on('disconnect', () => {
      if (userId) {
        socket.leave(userId);
      }
    });
  });

  return io;
};

export const getIo = () => io;
