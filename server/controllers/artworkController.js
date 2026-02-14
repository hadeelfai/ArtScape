/**
 * Artwork Controller
 * Handles artwork CRUD operations
 */

import mongoose from 'mongoose'
import Artwork from '../models/Artwork.js'
import User from '../models/User.js'
import { generateEmbeddingHook } from '../middleware/recommendationMiddleware.js'

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

/**
 * Create new artwork
 * Generate embedding asynchronously (doesn't block response)
 */
export const createArtwork = async (req, res) => {
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
        })
        await artwork.save()

        // Generate embedding asynchronously (doesn't block response)
        generateEmbeddingHook(artwork._id.toString(), image)

        res.status(201).json({ message: 'Artwork created successfully', artwork })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Update artwork
 * Regenerate embedding if image changed
 */
export const updateArtwork = async (req, res) => {
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
        let imageUpdated = false
        if (title !== undefined) artwork.title = title
        if (image !== undefined) {
            artwork.image = image
            imageUpdated = true
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

        // Regenerate embedding if image was updated (doesn't block response)
        if (imageUpdated) {
            generateEmbeddingHook(artwork._id.toString(), image)
        }

        res.json({ message: 'Artwork updated successfully', artwork })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Get all artworks for a user
 */
export const getUserArtworks = async (req, res) => {
    try {
        const artworks = await Artwork.find({ artist: req.params.userId })
        res.json(artworks)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Get user's liked and saved artworks
 */
export const getLikesSaves = async (req, res) => {
    try {
        const userId = req.params.userId
        
        const likedArtworks = await Artwork.find({ likes: userId }).select('_id')
        const savedArtworks = await Artwork.find({ savedBy: userId }).select('_id')
        
        res.json({
            liked: likedArtworks.map(art => art._id.toString()),
            saved: savedArtworks.map(art => art._id.toString())
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Get all artworks
 */
export const getAllArtworks = async (req, res) => {
    try {
        const artworks = await Artwork.find()
        res.json(artworks)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Get single artwork by ID
 */
export const getArtworkById = async (req, res) => {
    try {
        const artwork = await Artwork.findById(req.params.id)
        if (!artwork) {
            return res.status(404).json({ error: 'Artwork not found' })
        }
        res.json(artwork)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Like/Unlike artwork
 * Track user interactions for recommendations
 */
export const likeArtwork = async (req, res) => {
    try {
        const userIdObj = new mongoose.Types.ObjectId(req.user.id)

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

        if (isLiked) {
            // Remove like from artwork
            await Artwork.updateOne(
                { _id: req.params.id },
                { $pull: { likes: userIdObj } }
            )
            // Remove from user's liked artworks
            await User.findByIdAndUpdate(
                req.user.id,
                { $pull: { likedArtworks: req.params.id } }
            )
        } else {
            // Add like to artwork
            await Artwork.updateOne(
                { _id: req.params.id },
                { $push: { likes: userIdObj } }
            )
            // Add to user's liked artworks (for recommendations)
            await User.findByIdAndUpdate(
                req.user.id,
                { $addToSet: { likedArtworks: req.params.id } }
            )
        }

        res.json({ message: isLiked ? 'Unliked' : 'Liked', isLiked: !isLiked })
    } catch (error) {
        console.error('Like endpoint error:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Save/Unsave artwork
 * Track user interactions for recommendations
 */
export const saveArtwork = async (req, res) => {
    try {
        const userIdObj = new mongoose.Types.ObjectId(req.user.id)

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

        if (isSaved) {
            // Remove save from artwork
            await Artwork.updateOne(
                { _id: req.params.id },
                { $pull: { savedBy: userIdObj } }
            )
            // Remove from user's saved artworks (for recommendations)
            await User.findByIdAndUpdate(
                req.user.id,
                { $pull: { savedArtworks: req.params.id } }
            )
        } else {
            // Add save to artwork
            await Artwork.updateOne(
                { _id: req.params.id },
                { $push: { savedBy: userIdObj } }
            )
            // Add to user's saved artworks (for recommendations)
            await User.findByIdAndUpdate(
                req.user.id,
                { $addToSet: { savedArtworks: req.params.id } }
            )
        }

        res.json({ message: isSaved ? 'Unsaved' : 'Saved', isSaved: !isSaved })
    } catch (error) {
        console.error('Save endpoint error:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Delete artwork
 */
export const deleteArtwork = async (req, res) => {
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
}

/**
 * Track artwork view (duration) for recommendations
 * Persists to User.viewedArtworks
 */
export const trackArtworkView = async (req, res) => {
    try {
        const { id } = req.params
        const { duration } = req.body
        const userId = req.user?.id
        if (!userId) return res.status(401).json({ error: 'Authentication required' })
        const artwork = await Artwork.findById(id)
        if (!artwork) return res.status(404).json({ error: 'Artwork not found' })
        const durationSeconds = Math.round(Number(duration) || 0)
        if (durationSeconds <= 0) return res.status(200).json({ ok: true })
        await User.findByIdAndUpdate(userId, {
            $push: {
                viewedArtworks: {
                    $each: [{ artwork: id, durationSeconds, viewedAt: new Date() }],
                    $slice: -100
                }
            }
        })
        res.status(200).json({ ok: true })
    } catch (error) {
        console.error('Track view error:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Purchase artwork
 * Track user interactions for recommendations
 * Called when user completes a purchase through checkout
 */
export const purchaseArtwork = async (req, res) => {
    try {
        const { artworkId } = req.params
        const userId = req.user.id

        const artwork = await Artwork.findById(artworkId)
        if (!artwork) {
            return res.status(404).json({ error: 'Artwork not found' })
        }

        // Add to user's purchased artworks (for recommendations)
        await User.findByIdAndUpdate(
            userId,
            { $addToSet: { purchasedArtworks: artworkId } }
        )

        res.json({ success: true, message: 'Purchase successful' })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
}
