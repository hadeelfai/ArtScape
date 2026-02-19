import express from 'express';
import Order from '../models/Order.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';

const router = express.Router();
router.use(authMiddleware);

// GET /orders - where user is the buyer
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.artwork')
      .populate('items.artist')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (err) {
    console.error('Fetch orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /orders/sales - where user is the artist
router.get('/sales', async (req, res) => {
  try {
    const sales = await Order.find({ 'items.artist': req.user.id })
      .populate('items.artwork')
      .populate('items.artist')
      .sort({ createdAt: -1 });

    res.json({ sales });
  } catch (err) {
    console.error('Fetch sales error:', err);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

export default router;
