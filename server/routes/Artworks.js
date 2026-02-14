import express from 'express'
import nodemailer from 'nodemailer'
import { authMiddleware } from '../middleware/AuthMiddleware.js'
import Artwork from '../models/Artwork.js'
import User from '../models/User.js'
import {
    createArtwork,
    updateArtwork,
    getUserArtworks,
    getLikesSaves,
    getAllArtworks,
    getArtworkById,
    likeArtwork,
    saveArtwork,
    deleteArtwork,
    purchaseArtwork,
    trackArtworkView
} from '../controllers/artworkController.js'

const router = express.Router()

// Get user's liked and saved artworks (must come before /user/:userId to avoid route conflicts)
router.get('/user/:userId/likes-saves', getLikesSaves)

// Get all artworks for a user
router.get('/user/:userId', getUserArtworks)

// Create new artwork (requires auth)
router.post('/', authMiddleware, createArtwork)

// Update artwork (requires auth + must be owner)
router.put('/:id', authMiddleware, updateArtwork)

// Like/Unlike artwork (requires auth)
router.post('/:id/like', authMiddleware, likeArtwork)

// Save/Unsave artwork (requires auth)
router.post('/:id/save', authMiddleware, saveArtwork)

//getting all artworks (for admin page)
router.get('/', getAllArtworks)

// Get a single artwork by ID
router.get('/:id', getArtworkById)

// Track artwork view (duration) - requires auth
router.post('/:id/view', authMiddleware, trackArtworkView)

// Report artwork
router.post('/:id/report', authMiddleware, async (req, res) => {
  try {
    const { reason, details } = req.body;
    const artworkId = req.params.id;

    const artwork = await Artwork.findById(artworkId).populate('artist');
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });

    // Email setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"${req.user.name}" <x.artscape.x@gmail.com>`,
      to: 'x.artscape.x@gmail.com',
      subject: 'Reported Artwork',
      text: `
        An artwork has been reported:
        Reported Artwork ID: ${artworkId}
        Artwork Title: ${artwork.title}
        Reported By User: ${req.user.name} (${req.user.email})
        Reason: ${reason}
        ${details ? `Additional details:\n${details}\n` : ''}
        Artwork Image URL: ${artwork.image}
        Artist: ${artwork.artist?.name || 'Unknown'}
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Report sent to admin email.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send report', details: err.message });
  }
});

// Purchase artwork (requires auth)
router.post('/:id/purchase', authMiddleware, purchaseArtwork)

// Delete artwork (requires auth + must be owner or admin)
router.delete('/:id', authMiddleware, deleteArtwork)

export default router