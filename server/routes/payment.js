import express from 'express';
import axios from 'axios';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { getPayPalAccessToken, PAYPAL_BASE_URL } from '../config/paypal.js';
import Artwork from '../models/Artwork.js';

/** Notify only seller(s) when a new order is placed. Buyer is not notified here; they get notified when seller updates status. */
async function createOrderNotifications(order, buyerId) {
  const orderNum = order._id ? order._id.toString().slice(-6).toUpperCase() : '—';
  const notifications = [];

  // Each seller: "You've received a new order #XXX" to My Sales (buyer does not get a notification on place order)
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

/** Build shipping + top-level recipient/phone/addressDetails for Order.create from request shippingData. */
function buildShippingData(shippingData) {
  if (!shippingData || typeof shippingData !== 'object') return {};
  const s = shippingData;
  const shipping = {
    recipientName: s.recipientName,
    phone: s.phone,
    streetName: s.streetName,
    additionalDetails: s.additionalDetails,
    district: s.district,
    city: s.city,
    state: s.state,
    zipCode: s.zipCode,
    country: s.country,
  };
  const addressDetails = {
    streetName: s.streetName,
    additionalDetails: s.additionalDetails,
    district: s.district,
    city: s.city,
    state: s.state,
    zipCode: s.zipCode,
    country: s.country,
  };
  return {
    recipientName: s.recipientName,
    phone: s.phone,
    addressDetails,
    shipping,
  };
}

const router = express.Router();
router.use(authMiddleware);

const isArtworkSold = (artwork) => {
  if (!artwork) return false;
  if (artwork.isSold) return true;
  const normalizedStatus = String(artwork.status || '').trim().toLowerCase();
  return normalizedStatus === 'sold out' || normalizedStatus === 'sold';
};

const getUnavailableItems = (cartItems = []) =>
  cartItems.filter((item) => isArtworkSold(item));

const REQUIRED_SHIPPING_FIELDS = ['recipientName', 'phone', 'streetName', 'district', 'city'];

function validateShippingPayload(shippingData) {
  if (!shippingData || typeof shippingData !== 'object') {
    return { valid: false, missing: REQUIRED_SHIPPING_FIELDS };
  }
  const missing = REQUIRED_SHIPPING_FIELDS.filter((field) => {
    const value = shippingData[field];
    return typeof value !== 'string' || !value.trim();
  });
  return { valid: missing.length === 0, missing };
}

async function reserveArtworkStock(cartItems = []) {
  for (const item of cartItems) {
    const artworkId = item?._id;
    if (!artworkId) continue;
    const currentStock =
      typeof item.stockQuantity === 'number'
        ? item.stockQuantity
        : (item.isSold ? 0 : 1);
    const nextStock = Math.max(0, currentStock - 1);
    await Artwork.findByIdAndUpdate(artworkId, {
      $set: {
        stockQuantity: nextStock,
        isSold: nextStock <= 0,
        status: nextStock <= 0 ? 'Sold Out' : 'Available',
      },
    });
  }
}

// CREATE PAYPAL ORDER
router.post('/paypal/create', async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate('items');
  if (!cart || cart.items.length === 0)
    return res.status(400).json({ error: 'Cart is empty' });

  const unavailableItems = getUnavailableItems(cart.items);
  if (unavailableItems.length > 0) {
    return res.status(409).json({
      error: 'Some artworks are already sold out',
      soldArtworkIds: unavailableItems.map((item) => item._id),
    });
  }

  const total = cart.items.reduce((sum, i) => sum + Number(i.price), 0);
  if (total <= 0)
    return res.status(400).json({ error: 'Order total must be greater than 0 to use PayPal.' });

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
  try {
    const { orderID, shipping: shippingData, giftMessage } = req.body;
    const shippingValidation = validateShippingPayload(shippingData);
    if (!shippingValidation.valid) {
      return res.status(400).json({
        error: 'Shipping address is incomplete',
        missingFields: shippingValidation.missing,
      });
    }

    const token = await getPayPalAccessToken();
    const capture = await axios.post(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const cart = await Cart.findOne({ user: req.user.id }).populate('items');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const unavailableItems = getUnavailableItems(cart.items);
    if (unavailableItems.length > 0) {
      return res.status(409).json({
        error: 'Some artworks are already sold out',
        soldArtworkIds: unavailableItems.map((item) => item._id),
      });
    }

    const shippingFields = buildShippingData(shippingData);
    const order = await Order.create({
      user: req.user.id,
      items: cart.items.map((a) => ({
        artwork: a._id,
        price: a.price,
        artist: a.artist,
      })),
      totalAmount: capture.data.purchase_units[0].payments.captures[0].amount.value,
      paymentMethod: 'PAYPAL',
      status: 'PAID',
      paypalOrderId: orderID,
      ...shippingFields,
      giftMessage: typeof giftMessage === 'string' ? giftMessage : undefined,
    });

    await reserveArtworkStock(cart.items);
    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });
    await createOrderNotifications(order, req.user.id);

    return res.json({ success: true });
  } catch (error) {
    console.error('PayPal capture error:', error);
    return res.status(500).json({ error: 'Failed to capture payment' });
  }
});

// CASH ON DELIVERY
router.post('/cod', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const unavailableItems = getUnavailableItems(cart.items);
    if (unavailableItems.length > 0) {
      return res.status(409).json({
        error: 'Some artworks are already sold out',
        soldArtworkIds: unavailableItems.map((item) => item._id),
      });
    }

    const total = cart.items.reduce((sum, i) => sum + Number(i.price), 0);
    const { shipping: shippingData, giftMessage } = req.body;
    const shippingValidation = validateShippingPayload(shippingData);
    if (!shippingValidation.valid) {
      return res.status(400).json({
        error: 'Shipping address is incomplete',
        missingFields: shippingValidation.missing,
      });
    }

    const shippingFields = buildShippingData(shippingData);
    const order = await Order.create({
      user: req.user.id,
      items: cart.items.map((a) => ({
        artwork: a._id,
        price: a.price,
        artist: a.artist,
      })),
      totalAmount: total,
      paymentMethod: 'COD',
      status: 'PENDING',
      ...shippingFields,
      giftMessage: typeof giftMessage === 'string' ? giftMessage : undefined,
    });

    await reserveArtworkStock(cart.items);
    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });
    await createOrderNotifications(order, req.user.id);

    return res.json({ success: true });
  } catch (error) {
    console.error('COD order error:', error);
    return res.status(500).json({ error: 'Failed to place order' });
  }
});

export default router;
