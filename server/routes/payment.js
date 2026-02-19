import express from 'express';
import axios from 'axios';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { getPayPalAccessToken, PAYPAL_BASE_URL } from '../config/paypal.js';

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

  await Order.create({
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

  res.json({ success: true });
});

// CASH ON DELIVERY
router.post('/cod', authMiddleware,async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate('items');
  if (!cart || cart.items.length === 0)
    return res.status(400).json({ error: 'Cart is empty' });

  const total = cart.items.reduce((sum, i) => sum + Number(i.price), 0);

  await Order.create({
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

  res.json({ success: true });
});

export default router;
