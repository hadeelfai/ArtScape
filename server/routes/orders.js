import express from 'express';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import Artwork from '../models/Artwork.js';

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
      .populate('user', 'name username profileImage')
      .populate('items.artwork')
      .populate('items.artist')
      .sort({ createdAt: -1 });

    res.json({ sales });
  } catch (err) {
    console.error('Fetch sales error:', err);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// PATCH /orders/:id/status - seller only: update order status; notifies the buyer
router.patch('/:id/status', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Ensure only seller can update
    const isSeller = order.items.some(
      (item) => item.artist && item.artist.toString() === req.user.id
    );

    if (!isSeller) {
      return res.status(403).json({
        error: 'Only the seller can update this order status',
      });
    }

    const rawStatus = (req.body.status || '')
      .toString()
      .trim()
      .toUpperCase();

    const allowedStatuses = [
      'PENDING',
      'ACCEPTED',
      'SHIPPED',
      'DELIVERED',
      'PAYMENT_RECEIVED',
      'DECLINED',
    ];

    if (!allowedStatuses.includes(rawStatus)) {
      return res.status(400).json({
        error: 'Invalid status',
      });
    }

    const oldStatus = order.status;

    // Update artwork visibility based on seller decision
    if (rawStatus === 'ACCEPTED') {
      for (const item of order.items) {
        await Artwork.findByIdAndUpdate(item.artwork, {
          isSold: true,
          soldOut: true,
          status: 'SOLD',
        });
      }
    }

    if (rawStatus === 'DECLINED') {
      for (const item of order.items) {
        await Artwork.findByIdAndUpdate(item.artwork, {
          isSold: false,
          soldOut: false,
          status: 'AVAILABLE',
        });
      }
    }

    // Update order status
    order.status = rawStatus;
    await order.save();

    const updated = await Order.findById(order._id)
      .populate('user', 'name username profileImage')
      .populate('items.artwork')
      .populate('items.artist');

    // Notify buyer
    const buyerId = order.user?.toString();

    if (buyerId && oldStatus !== rawStatus) {
      const orderNum = order._id
        ? order._id.toString().slice(-6).toUpperCase()
        : '—';

      const messages = {
        ACCEPTED: `Your order #${orderNum} has been accepted.`,
        DECLINED: `Your order #${orderNum} has been declined.`,
        SHIPPED: `Your order #${orderNum} has been shipped.`,
        DELIVERED: `Your order #${orderNum} has been delivered.`,
        PAYMENT_RECEIVED: `Payment received for order #${orderNum}.`,
      };

      const message = messages[rawStatus];

      if (message) {
        await Notification.create({
          user: buyerId,
          fromUser: req.user.id,
          order: order._id,
          type: 'order_placed',
          message,
        });
      }
    }

    res.json({ order: updated });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({
      error: 'Failed to update status',
    });
  }
});

export default router;