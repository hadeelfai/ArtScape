import express from 'express'
import mongoose from 'mongoose'
import Artwork from '../models/Artwork.js'
import nodemailer from 'nodemailer'
import { authMiddleware } from '../middleware/AuthMiddleware.js'
import { computeEmbeddingInBackground } from '../utils/embedQueue.js';
import { getSimilarArtworks } from '../controllers/artworkController.js';
import User from '../models/User.js';


const router = express.Router()

const normalizeTagsInput = (tags) => {
    if (!tags) return []
    if (Array.isArray(tags)) {
        return tags
            .map(tag => typeof tag === 'string' ? tag.trim() : '')
            .filter(Boolean)
    }
    if (typeof tags === 'string') {
        return tags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean)
    }
    return []
}

// Get user's liked and saved artworks (must come before /user/:userId to avoid route conflicts)
router.get('/user/:userId/likes-saves', async (req, res) => {
    try {
        const userId = req.params.userId
        
        // Find all artworks where the user has liked or saved
        const likedArtworks = await Artwork.find({ likes: userId }).select('_id')
        const savedArtworks = await Artwork.find({ savedBy: userId }).select('_id')
        
        res.json({
            liked: likedArtworks.map(art => art._id.toString()),
            saved: savedArtworks.map(art => art._id.toString())
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get all artworks for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const artworks = await Artwork.find({ artist: req.params.userId })
        res.json(artworks)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Create new artwork (requires auth + active account)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, image, price, description, tags, artworkType, dimensions, year } = req.body
        const normalizedTags = normalizeTagsInput(tags)

        if (normalizedTags.length < 3) {
            return res.status(400).json({ error: 'Please provide at least three tags related to the artwork.' })
        }

        const artwork = new Artwork({ 
            title, 
            image, 
            price, 
            artist: req.user.id,
            description,
            tags: normalizedTags,
            dimensions,
            year,
            artworkType: artworkType || 'Explore',
            embedding: null,
        })
        await artwork.save()
        // Trigger background embedding computation *no waiting
        computeEmbeddingInBackground(artwork._id, image);

        res.status(201).json({ message: 'Artwork created successfully', artwork })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Update artwork (requires auth + must be owner)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, image, price, description, tags, artworkType, dimensions, year } = req.body
        const artwork = await Artwork.findById(req.params.id)
        
        if (!artwork) {
            return res.status(404).json({ error: 'Artwork not found' })
        }

        if (artwork.artist.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to update this artwork' })
        }

        // Update fields
        if (title !== undefined) artwork.title = title
        if (image !== undefined && image !== artwork.image) {
            artwork.image = image;
            computeEmbeddingInBackground(artwork._id, image);
            // recompute embedding for update
}
        if (price !== undefined) artwork.price = price
        if (description !== undefined) artwork.description = description
        if (tags !== undefined) {
            const normalizedTags = normalizeTagsInput(tags)
            if (normalizedTags.length < 3) {
                return res.status(400).json({ error: 'Please provide at least three tags related to the artwork.' })
            }
            artwork.tags = normalizedTags
        }
        if (artworkType !== undefined) artwork.artworkType = artworkType
        if (dimensions !== undefined) artwork.dimensions = dimensions
        if (year !== undefined) artwork.year = year

        await artwork.save()
        res.json({ message: 'Artwork updated successfully', artwork })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Like/Unlike artwork (requires auth + active account)
router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const userIdObj = new mongoose.Types.ObjectId(req.user.id)

        // Get current artwork to check if liked
        const artwork = await Artwork.findById(req.params.id)
        if (!artwork)
            return res.status(404).json({ error: 'Artwork not found' })

        const isLiked = artwork.likes.some(id => {
            try {
                return id.equals(userIdObj)
            } catch {
                return id.toString() === req.user.id
            }
        })

        // Use updateOne to avoid full validation
        if (isLiked) {
            await Artwork.updateOne(
                { _id: req.params.id },
                { $pull: { likes: userIdObj } }
            )
        } else {
            await Artwork.updateOne(
                { _id: req.params.id },
                { $push: { likes: userIdObj } }
            )
        }

        res.json({ message: isLiked ? 'Unliked' : 'Liked', isLiked: !isLiked })
    } catch (error) {
        console.error('Like endpoint error:', error)
        res.status(500).json({ error: error.message })
    }
})

// Save/Unsave artwork (requires auth + active account)
router.post('/:id/save', authMiddleware, async (req, res) => {
    try {
        const userIdObj = new mongoose.Types.ObjectId(req.user.id)

        // Get current artwork to check if saved
        const artwork = await Artwork.findById(req.params.id)
        if (!artwork)
            return res.status(404).json({ error: 'Artwork not found' })

        const isSaved = artwork.savedBy.some(id => {
            try {
                return id.equals(userIdObj)
            } catch {
                return id.toString() === req.user.id
            }
        })

        // Use updateOne to avoid full validation
        if (isSaved) {
            await Artwork.updateOne(
                { _id: req.params.id },
                { $pull: { savedBy: userIdObj } }
            )
        } else {
            await Artwork.updateOne(
                { _id: req.params.id },
                { $push: { savedBy: userIdObj } }
            )
        }

        res.json({ message: isSaved ? 'Unsaved' : 'Saved', isSaved: !isSaved })
    } catch (error) {
        console.error('Save endpoint error:', error)
        res.status(500).json({ error: error.message })
    }
})

//getting all artworks (for admin page)
router.get('/', async (req, res) => {
  try {
    const artworks = await Artwork.find()
    res.json(artworks)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get a single artwork by ID
router.get('/:id', async (req, res) => {
    try {
        const artwork = await Artwork.findById(req.params.id);
        if (!artwork) {
            return res.status(404).json({ error: 'Artwork not found' });
        }
        res.json(artwork);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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

// Delete artwork (requires auth + must be owner or admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' })
    }
    const isOwner = artwork.artist.toString() === req.user.id
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this artwork' })
    }
    await Artwork.findByIdAndDelete(req.params.id)
    res.json({ message: 'Artwork deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

//NEW section
router.get("/:id/similar", getSimilarArtworks);
//get similarity


export default router