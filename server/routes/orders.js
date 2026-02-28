import express from 'express';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
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
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const isSeller = order.items.some(
      (i) => i.artist && i.artist.toString() === req.user.id
    );
    if (!isSeller) return res.status(403).json({ error: 'Only the seller can update this order status' });

    const raw = (req.body.status || '').toString().trim().toUpperCase();
    const allowed = ['PENDING', 'ACCEPTED', 'SHIPPED', 'DELIVERED', 'PAYMENT_RECEIVED'];
    const status = allowed.includes(raw) ? raw : order.status;

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('user', 'name username profileImage')
      .populate('items.artwork')
      .populate('items.artist');

    // Notify the buyer when seller updates the order status
    const buyerId = order.user && order.user.toString();
    if (buyerId && status !== (order.status || '').toString()) {
      const orderNum = order._id ? order._id.toString().slice(-6).toUpperCase() : '—';
      const messages = {
        ACCEPTED: `Your order #${orderNum} has been accepted.`,
        SHIPPED: `Your order #${orderNum} has been shipped.`,
        DELIVERED: `Your order #${orderNum} has been delivered.`,
        PAYMENT_RECEIVED: `Payment received for order #${orderNum}.`,
      };
      const message = messages[status];
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
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;
