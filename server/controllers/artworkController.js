import Artwork from '../models/Artwork.js';
import { cosineSimilarity } from '../utils/recommend.js';

//gets similar artwork based on embeddings
export const getSimilarArtworks = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork || !artwork.embedding)
      return res.status(404).json({ error: "Artwork not found or no embedding" });

    const allArtworks = await Artwork.find({ _id: { $ne: artwork._id } });

    const similarities = allArtworks
      .filter(a => Array.isArray(a.embedding) && a.embedding.length > 0)

      .map(a => ({ artwork: a, score: cosineSimilarity(artwork.embedding, a.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);//top 4 similarity

    res.json(similarities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


