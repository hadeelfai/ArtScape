import express from 'express';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// POST /api/tracking/browse - Log Explore/Marketplace tab click and optional filter usage
router.post('/browse', authMiddleware, async (req, res) => {
  try {
    const { type, filter } = req.body;
    const inc = {};

    if (type === 'explore') inc['browsingPreferences.exploreClicks'] = 1;
    else if (type === 'marketplace') inc['browsingPreferences.marketplaceClicks'] = 1;

    if (filter && typeof filter === 'object') {
      for (const [key] of Object.entries(filter)) {
        if (key && /^[a-zA-Z0-9_]+$/.test(key)) {
          inc[`browsingPreferences.filterUsage.${key}`] = 1;
        }
      }
    }

    if (Object.keys(inc).length > 0) {
      await User.findByIdAndUpdate(req.user.id, { $inc: inc });
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Track browse error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
