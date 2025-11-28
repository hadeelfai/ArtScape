import express from 'express';
import Notification from '../models/Notification.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';

const router = express.Router();

//User must be logged in
router.use(authMiddleware);

//GET the notififcation
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not found in request' });
    }

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('fromUser', 'name username profileImage')
      .populate('post', 'text image');

    return res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ message: 'Failed to load notifications' });
  }
});

export default router;
