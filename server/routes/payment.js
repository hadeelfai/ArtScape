import express from 'express';
import axios from 'axios';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { getPayPalAccessToken, PAYPAL_BASE_URL } from '../config/paypal.js';

/** Create notifications for buyer and seller(s) with order number. Buyer gets order_placed → /orders; sellers get sale → /sales. */
async function createOrderNotifications(order, buyerId) {
  const orderNum = order._id ? order._id.toString().slice(-6).toUpperCase() : '—';
  const notifications = [];

  // Buyer: "You've received a new order #XXX" → My Orders
  notifications.push({
    user: buyerId,
    fromUser: buyerId,
    order: order._id,
    type: 'order_placed',
    message: `You've received a new order #${orderNum}`,
  });

  // Each seller: "You've received a new order #XXX" → My Sales
  const artistIds = [...new Set(order.items.map((i) => i.artist?.toString()).filter(Boolean))];
  for (const artistId of artistIds) {
    if (artistId === buyerId.toString()) continue;
    notifications.push({
      user: artistId,
      fromUser: buyerId,
      order: order._id,
      type: 'sale',
      message: `You've received a new order #${orderNum}`,
    });
  }

  if (notifications.length > 0) await Notification.insertMany(notifications);
}

const router = express.Router();
router.use(authMiddleware);

// CREATE PAYPAL ORDER
router.post('/paypal/create', async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate('items');
  if (!cart || cart.items.length === 0)
    return res.status(400).json({ error: 'Cart is empty' });

  const total = cart.items.reduce((sum, i) => sum + Number(i.price), 0);
  const token = await getPayPalAccessToken();

  const response = await axios.post(
    `${PAYPAL_BASE_URL}/v2/checkout/orders`,
    {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: total.toFixed(2),
          },
        },
      ],
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  res.json(response.data);
});

// CAPTURE PAYPAL ORDER
router.post('/paypal/capture', async (req, res) => {
  const { orderID } = req.body;
  const token = await getPayPalAccessToken();

  const capture = await axios.post(
    `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const cart = await Cart.findOne({ user: req.user.id }).populate('items');

  const order = await Order.create({
    user: req.user.id,
    items: cart.items.map(a => ({
      artwork: a._id,
      price: a.price,
      artist: a.artist,
    })),
    totalAmount: capture.data.purchase_units[0].payments.captures[0].amount.value,
    paymentMethod: 'PAYPAL',
    status: 'PAID',
    paypalOrderId: orderID,
  });

  await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });
  await createOrderNotifications(order, req.user.id);

  res.json({ success: true });
});

// CASH ON DELIVERY
router.post('/cod', authMiddleware,async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate('items');
  if (!cart || cart.items.length === 0)
    return res.status(400).json({ error: 'Cart is empty' });

  const total = cart.items.reduce((sum, i) => sum + Number(i.price), 0);

  const order = await Order.create({
    user: req.user.id,
    items: cart.items.map(a => ({
      artwork: a._id,
      price: a.price,
      artist: a.artist,
    })),
    totalAmount: total,
    paymentMethod: 'COD',
    status: 'PENDING',
  });

  await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });
  await createOrderNotifications(order, req.user.id);

  res.json({ success: true });
});

export default router;
