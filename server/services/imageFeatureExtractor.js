import axios from 'axios';

const AI_SERVER_URL = 'http://localhost:6000';

const imageFeatureExtractor = {
  initialize: async () => {
    console.log('AI service ready');
    // any startup logic here
  },

  getEmbedding: async (imageUrl) => {
    try {
      const response = await axios.post(`${AI_SERVER_URL}/embed`, { url: imageUrl });
      return response.data.embedding;
    } catch (err) {
      console.error('AI embedding error:', err.message);
      return [];
    }
  }
};

export default imageFeatureExtractor;
