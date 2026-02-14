import express from 'express';
import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Artwork from '../models/Artwork.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// All cart routes require auth (suspended/blocked users are rejected by authMiddleware)
router.use(authMiddleware);

// GET /cart - Get current user's cart with artwork details
router.get('/', async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items');
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    const items = (cart.items || []).map((artwork) => ({
      id: artwork._id.toString(),
      _id: artwork._id,
      title: artwork.title,
      image: artwork.image,
      price: artwork.price,
    }));
    res.json({ items });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /cart - Add artwork to cart
router.post('/', async (req, res) => {
  try {
    const { artworkId } = req.body;
    if (!artworkId) {
      return res.status(400).json({ error: 'artworkId is required' });
    }
    let artworkObj;
    try {
      artworkObj = new mongoose.Types.ObjectId(artworkId);
    } catch {
      return res.status(400).json({ error: 'Invalid artworkId format' });
    }
    const artwork = await Artwork.findById(artworkObj);
    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' });
    }
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    if (cart.items.some((id) => id.toString() === artworkId)) {
      return res.json({ message: 'Already in cart', items: cart.items });
    }
    cart.items.push(artworkObj);
    await cart.save();
    // Log cart addition for recommendations (User.cartAdditions)
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { cartAdditions: artworkObj }
    }).catch(() => {});
    const populated = await Cart.findById(cart._id).populate('items');
    const items = (populated.items || []).map((a) => ({
      id: a._id.toString(),
      _id: a._id,
      title: a.title,
      image: a.image,
      price: a.price,
    }));
    res.json({ message: 'Added to cart', items });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /cart - Clear entire cart (must be before /:artworkId)
router.delete('/', async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { $set: { items: [] } },
      { new: true }
    );
    res.json({ message: 'Cart cleared', items: [] });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /cart/:artworkId - Remove artwork from cart
router.delete('/:artworkId', async (req, res) => {
  try {
    const { artworkId } = req.params;
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.json({ items: [] });
    }
    cart.items = cart.items.filter((id) => id.toString() !== artworkId);
    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items');
    const items = (populated.items || []).map((a) => ({
      id: a._id.toString(),
      _id: a._id,
      title: a.title,
      image: a.image,
      price: a.price,
    }));
    res.json({ message: 'Removed from cart', items });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
