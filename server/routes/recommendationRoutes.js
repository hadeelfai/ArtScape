import express from 'express'
import {
    getRecommendations,
    searchByText,
    getPersonalizedRecommendations,
    checkRecommendationServiceHealth
} from '../middleware/recommendationMiddleware.js'
import { authMiddleware } from '../middleware/AuthMiddleware.js'

const router = express.Router()

/**
 * Get service health status
 */
router.get('/health', async (req, res) => {
    try {
        const health = await checkRecommendationServiceHealth()
        console.log('[Health] Recommendation service health check:', health)
        res.json(health)
    } catch (error) {
        console.error('[Health] Error checking recommendation service:', error.message)
        res.status(500).json({ error: error.message, status: 'error' })
    }
})

/**
 * Get similar artworks
 * GET /api/recommendations/similar?artworkId=xxx&topK=10
 */
router.get('/similar', async (req, res) => {
    try {
        const { artworkId, topK } = req.query
        if (!artworkId) {
            return res.status(400).json({ error: 'artworkId is required' })
        }
        const recommendations = await getRecommendations(artworkId, parseInt(topK) || 20)
        res.json(recommendations || { recommendations: [] })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * Search artworks by text
 * POST /api/recommendations/search
 */
router.post('/search', async (req, res) => {
    try {
        const { query, topK } = req.body
        if (!query) {
            return res.status(400).json({ error: 'query is required' })
        }
        const results = await searchByText(query, topK || 20)
        res.json(results || { recommendations: [] })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * Get personalized recommendations for logged-in user
 * GET /api/recommendations/personalized
 */
router.get('/personalized', authMiddleware, async (req, res) => {
    try {
        const { topK } = req.query
        const recommendations = await getPersonalizedRecommendations(req.user.id, parseInt(topK) || 20)
        res.json(recommendations || { recommendations: [] })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
