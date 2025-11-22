import express from 'express'
import Artwork from '../models/Artwork.js'

const router = express.Router()

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
        const { title, image, price, artist, description, tags, artworkType } = req.body
        const artwork = new Artwork({ 
            title, 
            image, 
            price, 
            artist, 
            description,
            tags,
            artworkType: artworkType || 'Explore'
        })
        await artwork.save()
        res.status(201).json({ message: 'Artwork created successfully', artwork })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Like/Unlike artwork
router.post('/:id/like', async (req, res) => {
    try {
        const { userId } = req.body
        const artwork = await Artwork.findById(req.params.id)
        
        if (!artwork)
            return res.status(404).json({ error: 'Artwork not found' })

        const isLiked = artwork.likes.includes(userId)

        if (isLiked) {
            artwork.likes = artwork.likes.filter(id => id.toString() !== userId)
        } else {
            artwork.likes.push(userId)
        }

        await artwork.save()
        res.json({ message: isLiked ? 'Unliked' : 'Liked', isLiked: !isLiked })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Save/Unsave artwork
router.post('/:id/save', async (req, res) => {
    try {
        const { userId } = req.body
        const artwork = await Artwork.findById(req.params.id)
        
        if (!artwork)
            return res.status(404).json({ error: 'Artwork not found' })

        const isSaved = artwork.savedBy.includes(userId)

        if (isSaved) {
            artwork.savedBy = artwork.savedBy.filter(id => id.toString() !== userId)
        } else {
            artwork.savedBy.push(userId)
        }

        await artwork.save()
        res.json({ message: isSaved ? 'Unsaved' : 'Saved', isSaved: !isSaved })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router