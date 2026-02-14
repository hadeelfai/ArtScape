/**
 * Recommendation Middleware
 * Handles asynchronous embedding generation and recommendation operations
 */

const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:5001'

/**
 * Generate embedding asynchronously (doesn't block response)
 * Calls the recommendation service in the background using setImmediate
 */
export const generateEmbeddingHook = (artworkId, imageUrl) => {
    // Fire and forget - don't await, don't block response
    setImmediate(async () => {
        try {
            const response = await fetch(`${RECOMMENDATION_SERVICE_URL}/generate-embedding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    artwork_id: artworkId,
                    image_url: imageUrl
                })
            })
            
            if (!response.ok) {
                const error = await response.json()
                console.error(`[Embedding] Failed for artwork ${artworkId}:`, error)
            } else {
                const data = await response.json()
                console.log(`[Embedding] ✓ Generated for artwork ${artworkId}`)
            }
        } catch (error) {
            console.error(`[Embedding] Error generating embedding for ${artworkId}:`, error.message)
        }
    })
}

/**
 * Batch regenerate embeddings for all artworks
 * Useful for one-time migration or updates
 */
export const batchGenerateEmbeddings = async () => {
    try {
        console.log('[Batch] Starting batch embedding generation...')
        const response = await fetch(`${RECOMMENDATION_SERVICE_URL}/batch-generate-embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                force_regenerate: false,
                limit: 100
            })
        })
        
        if (!response.ok) {
            const error = await response.json()
            console.error('[Batch] Error:', error)
            return null
        }
        
        const data = await response.json()
        console.log(`[Batch] ✓ Processed ${data.processed} artworks, ${data.failed} failed`)
        return data
    } catch (error) {
        console.error('[Batch] Error:', error.message)
        return null
    }
}

/**
 * Get recommendations for an artwork
 */
export const getRecommendations = async (artworkId, topK = 20) => {
    try {
        const response = await fetch(`${RECOMMENDATION_SERVICE_URL}/recommend/similar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                artwork_id: artworkId,
                top_k: topK
            })
        })
        
        if (!response.ok) {
            const error = await response.json()
            console.error(`[Recommendations] Error for ${artworkId}:`, error)
            return null
        }
        
        return await response.json()
    } catch (error) {
        console.error(`[Recommendations] Error:`, error.message)
        return null
    }
}

/**
 * Search artworks by text
 */
export const searchByText = async (query, topK = 20) => {
    try {
        const response = await fetch(`${RECOMMENDATION_SERVICE_URL}/recommend/text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: query,
                top_k: topK
            })
        })
        
        if (!response.ok) {
            const error = await response.json()
            console.error(`[Search] Error for query "${query}":`, error)
            return null
        }
        
        return await response.json()
    } catch (error) {
        console.error(`[Search] Error:`, error.message)
        return null
    }
}

/**
 * Get personalized recommendations for a user
 */
export const getPersonalizedRecommendations = async (userId, topK = 20) => {
    try {
        const response = await fetch(`${RECOMMENDATION_SERVICE_URL}/recommend/personalized`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                top_k: topK
            })
        })
        
        if (!response.ok) {
            const error = await response.json()
            console.error(`[Personalized] Error for user ${userId}:`, error)
            return null
        }
        
        return await response.json()
    } catch (error) {
        console.error(`[Personalized] Error:`, error.message)
        return null
    }
}

/**
 * Check recommendation service health
 */
export const checkRecommendationServiceHealth = async () => {
    try {
        const response = await fetch(`${RECOMMENDATION_SERVICE_URL}/health`)
        if (response.ok) {
            return await response.json()
        }
        return { status: 'unhealthy' }
    } catch (error) {
        console.error('[Health] Recommendation service unreachable:', error.message)
        return { status: 'unreachable' }
    }
}
