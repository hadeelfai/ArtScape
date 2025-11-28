import express from 'express';
import Notification from '../models/Notification.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// All notification routes require auth
router.use(authMiddleware);

// GET /notifications -> list notifications for logged-in user
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;


    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('fromUser', 'name username profileImage')
      .populate('post', 'text image');

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to load notifications' });
  }
});

export default router;
