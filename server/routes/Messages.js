import express from 'express';
import mongoose from 'mongoose';
import DirectMessage from '../models/DirectMessage.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { getIo } from '../utils/socketManager.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /messages/conversations - Get all conversations for the logged-in user
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await DirectMessage.find({
      $or: [
        { sender: userId },
        { recipient: userId },
      ],
      deletedBy: { $ne: userId },
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name profileImage username')
      .populate('recipient', 'name profileImage username')
      .lean();

    const conversationMap = {};

    messages.forEach(msg => {
      const otherParticipantId = msg.sender._id.toString() === userId
        ? msg.recipient._id
        : msg.sender._id;

      const otherParticipant = msg.sender._id.toString() === userId
        ? msg.recipient
        : msg.sender;

      const conversationKey = [userId, otherParticipantId.toString()].sort().join('-');

      if (!conversationMap[conversationKey]) {
        conversationMap[conversationKey] = {
          conversationId: conversationKey,
          participantId: otherParticipantId.toString(),
          participantName: otherParticipant.name || 'Unknown User',
          participantAvatar: otherParticipant.profileImage,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: 0,
        };
      }

      if (msg.recipient._id.toString() === userId && msg.read === false) {
        conversationMap[conversationKey].unreadCount += 1;
      }
    });

    const conversations = Object.values(conversationMap).sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );

    res.json({ success: true, conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET /messages/:conversationId - Get messages in a specific conversation
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const [user1, user2] = conversationId.split('-');

    if (userId !== user1 && userId !== user2) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await DirectMessage.updateMany(
      {
        recipient: userId,
        sender: userId === user1 ? user2 : user1,
        read: false,
      },
      { read: true }
    );

    const io = getIo();
    if (io) {
      const otherUserId = userId === user1 ? user2 : user1;
      const unreadCount = await DirectMessage.countDocuments({
        recipient: userId,
        read: false,
      });

      io.to(userId).emit('dm:unreadCount', { unreadCount });
      io.to(otherUserId).emit('dm:read', {
        conversationId,
        readerId: userId,
      });
    }

    const messages = await DirectMessage.find({
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 },
      ],
      deletedBy: { $ne: userId },
    })
      .sort({ createdAt: 1 })
      .populate('sender', '_id name profileImage')
      .populate('recipient', '_id name profileImage')
      .lean();

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /messages/send - Send a new message
router.post('/send', async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user.id;

    if (!recipientId || !content || !content.trim()) {
      return res.status(400).json({ error: 'Invalid message data' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
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
    const messageObject = message.toObject();

    const io = getIo();
    if (io) {
      const unreadCount = await DirectMessage.countDocuments({
        recipient: recipientId,
        read: false,
      });

      io.to(recipientId).emit('dm:new', {
        message: messageObject,
        conversationId,
        senderId,
      });

      io.to(recipientId).emit('dm:conversation:update', {
        conversation: {
          conversationId,
          participantId: senderId,
          participantName: messageObject.sender.name,
          participantAvatar: messageObject.sender.profileImage,
          lastMessage: messageObject.content,
          lastMessageTime: messageObject.createdAt,
          unreadCount,
        },
      });

      io.to(recipientId).emit('dm:unreadCount', { unreadCount });
      io.to(senderId).emit('dm:conversation:update', {
        conversation: {
          conversationId,
          participantId: recipientId,
          participantName: messageObject.recipient.name,
          participantAvatar: messageObject.recipient.profileImage,
          lastMessage: messageObject.content,
          lastMessageTime: messageObject.createdAt,
          unreadCount: 0,
        },
      });
    }

    res.json({
      success: true,
      message: messageObject,
      conversationId,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /messages/unread/count - Get count of unread messages
router.get('/unread/count', async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await DirectMessage.countDocuments({
      recipient: userId,
      read: false,
    });

    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// DELETE /messages/:conversationId - Delete conversation for current user only
router.delete('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id.toString();

    const [user1, user2] = conversationId.split('-');

    if (userId !== user1 && userId !== user2) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user1Id = new mongoose.Types.ObjectId(user1);
    const user2Id = new mongoose.Types.ObjectId(user2);

    const result = await DirectMessage.updateMany(
      {
        $or: [
          { sender: user1Id, recipient: user2Id },
          { sender: user2Id, recipient: user1Id },
        ],
      },
      { $addToSet: { deletedBy: userId } }
    );

    res.json({ success: true, message: 'Conversation deleted', updatedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;