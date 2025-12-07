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

// Create new artwork
router.post('/', async (req, res) => {
    try {
        const { title, image, price, artist, description, tags, artworkType, dimensions, year } = req.body
        const normalizedTags = normalizeTagsInput(tags)

        if (normalizedTags.length < 3) {
            return res.status(400).json({ error: 'Please provide at least three tags related to the artwork.' })
        }

        const artwork = new Artwork({ 
            title, 
            image, 
            price, 
            artist, 
            description,
            tags: normalizedTags,
            dimensions,
            year,
            artworkType: artworkType || 'Explore',
            embedding: null,//store empty then compute in background
        })
        await artwork.save()
        // Trigger background embedding computation *no waiting
        computeEmbeddingInBackground(artwork._id, image);

        res.status(201).json({ message: 'Artwork created successfully', artwork })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Update artwork
router.put('/:id', async (req, res) => {
    try {
        const { title, image, price, description, tags, artworkType, dimensions, year } = req.body
        const artwork = await Artwork.findById(req.params.id)
        
        if (!artwork) {
            return res.status(404).json({ error: 'Artwork not found' })
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

// Like/Unlike artwork
router.post('/:id/like', async (req, res) => {
    try {
        const { userId } = req.body
        
        // Convert userId string to ObjectId for proper comparison
        let userIdObj
        try {
            userIdObj = new mongoose.Types.ObjectId(userId)
        } catch (e) {
            return res.status(400).json({ error: 'Invalid userId format' })
        }

        // Get current artwork to check if liked
        const artwork = await Artwork.findById(req.params.id)
        if (!artwork)
            return res.status(404).json({ error: 'Artwork not found' })

        const isLiked = artwork.likes.some(id => {
            try {
                return id.equals(userIdObj)
            } catch {
                return id.toString() === userId
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

// Save/Unsave artwork
router.post('/:id/save', async (req, res) => {
    try {
        const { userId } = req.body
        
        // Convert userId string to ObjectId for proper comparison
        let userIdObj
        try {
            userIdObj = new mongoose.Types.ObjectId(userId)
        } catch (e) {
            return res.status(400).json({ error: 'Invalid userId format' })
        }

        // Get current artwork to check if saved
        const artwork = await Artwork.findById(req.params.id)
        if (!artwork)
            return res.status(404).json({ error: 'Artwork not found' })

        const isSaved = artwork.savedBy.some(id => {
            try {
                return id.equals(userIdObj)
            } catch {
                return id.toString() === userId
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

//deleting an artwork by id (for the admin page)
router.delete('/:id', async (req, res) => {
  try {
    const artwork = await Artwork.findByIdAndDelete(req.params.id)
    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' })
    }
    res.json({ message: 'Artwork deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

//NEW section
router.get("/:id/similar", getSimilarArtworks);
//get similarity


// personlized recommendation
router.get('/recommended/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).populate('likes'); // artworks liked

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Collect all tags from liked artworks
    const likedTags = user.likes.flatMap(art => art.tags?.split(',') || []);

    // Find artworks that match these tags and are not yet liked
    const recommended = await Artwork.find({
      artworkType: 'Explore',
      _id: { $nin: user.likes.map(a => a._id) },
      tags: { $in: likedTags },
    })
    .limit(50)
    .lean();

    res.json(recommended);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});



// to track views
router.post('/:id/view', async (req, res) => {
  try {
    const { userId, duration } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (!duration || isNaN(duration)) return res.status(400).json({ error: 'duration must be a number' });

    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });

    artwork.views.push({ 
      user: userId, 
      duration: Number(duration), 
      timestamp: new Date() 
    });

    await artwork.save();
    res.json({ message: 'View recorded' });
  } catch (err) {
    console.error('Error recording view:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



export default router