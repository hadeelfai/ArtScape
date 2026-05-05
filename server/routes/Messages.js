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

    // Get all messages involving this user
    const messages = await DirectMessage.find({
      $or: [
        { sender: userId },
        { recipient: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name profileImage username')
      .populate('recipient', 'name profileImage username')
      .lean();

    // Group by conversation (two-way between sender and recipient)
    const conversationMap = {};

    messages.forEach(msg => {
      // Determine the other participant
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

    // Parse conversationId (format: "userId1-userId2")
    const [user1, user2] = conversationId.split('-');
    
    // Verify the user is part of this conversation
    if (userId !== user1 && userId !== user2) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Mark messages as read for the current user first
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

    // Get all messages between these two users (with updated read status)
    const messages = await DirectMessage.find({
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 },
      ],
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

    // Validate input
    if (!recipientId || !content || !content.trim()) {
      return res.status(400).json({ error: 'Invalid message data' });
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Create the message
    const message = await DirectMessage.create({
      sender: senderId,
      recipient: recipientId,
      content: content.trim(),
      read: false,
    });

    // Populate sender and recipient info
    await message.populate('sender', '_id name profileImage');
    await message.populate('recipient', '_id name profileImage');

    // Create/update conversation ID
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

// GET /messages/unread-count - Get count of unread messages
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

// DELETE /messages/:conversationId - Delete all messages in a conversation
router.delete('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id.toString();

    // Parse conversationId (format: "userId1-userId2")
    const [user1, user2] = conversationId.split('-');
    
    // Verify the user is part of this conversation
    if (userId !== user1 && userId !== user2) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Convert string IDs to MongoDB ObjectIds for proper querying
    const user1Id = new mongoose.Types.ObjectId(user1);
    const user2Id = new mongoose.Types.ObjectId(user2);

    // Delete all messages in this conversation
    const result = await DirectMessage.deleteMany({
      $or: [
        { sender: user1Id, recipient: user2Id },
        { sender: user2Id, recipient: user1Id },
      ],
    });

    res.json({ success: true, message: 'Conversation deleted', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;
