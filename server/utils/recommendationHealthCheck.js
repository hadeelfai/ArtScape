/**
 * Utility to check recommendation service health
 */

import { checkRecommendationServiceHealth } from '../middleware/recommendationMiddleware.js'

export const testRecommendationService = async () => {
  console.log('Testing recommendation service health...')
  
  try {
    const health = await checkRecommendationServiceHealth()
    console.log('Recommendation service health:', health)
    
    if (health.status === 'healthy') {
      console.log('✅ Recommendation service is running and accessible')
    } else {
      console.log('❌ Recommendation service is not healthy')
    }
  } catch (error) {
    console.error('❌ Failed to check recommendation service health:', error.message)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testRecommendationService()
}
