import express from 'express';
import Artwork from '../models/Artwork.js';
import imageFeatureExtractor from '../services/imageFeatureExtractor.js';
//for the tensorflow model
const router = express.Router();

// Extract embedding for an artwork
router.post('/extract', async (req, res) => {
  try {
    const { artworkId } = req.body;
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });

    const embedding = await imageFeatureExtractor.getEmbedding(artwork.image);
    artwork.embedding = embedding;
    await artwork.save();

    res.json({ message: 'Embedding saved', embedding });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recommended artworks based on embedding similarity
router.get('/recommend/:artworkId', async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.artworkId);
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });

    const allArtworks = await Artwork.find({ _id: { $ne: artwork._id } });
    const recommendations = allArtworks
      .map(a => ({
        artwork: a,
        score: cosineSimilarity(artwork.embedding, a.embedding)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(r => r.artwork);

    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simple cosine similarity function
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export default router;
