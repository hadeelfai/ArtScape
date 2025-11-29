import express from 'express'
import { authMiddleware } from '../middleware/AuthMiddleware.js'
import multer from 'multer'
import Artwork from '../models/Artwork.js'
import ImageFeatureExtractor from '../services/imageFeatureExtractor.js'

const router = express.Router()
//Fully new
// Multer setup for image upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files allowed'))
  }
})

// AI Upload route
router.post('/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' })

    const { title, description, tags, category } = req.body

    const processed = await ImageFeatureExtractor.processUpload(req.file.buffer)
    if (!processed.success) return res.status(500).json({ error: 'Failed to process image' })

    const timestamp = Date.now()
    const imageUrl = `/uploads/artworks/${timestamp}.jpg`
    const thumbnailUrl = `/uploads/thumbnails/${timestamp}.jpg`

    const artwork = new Artwork({
      title,
      description,
      artist: req.user.id,
      image: imageUrl,
      thumbnailUrl,
      tags: tags ? tags.split(',').map(t => t.trim().toLowerCase()) : [],
      category,
      dominantColors: processed.dominantColors,
      featureVector: processed.featureVector
    })

    await artwork.save()
    res.status(201).json({ success: true, artwork })

  } catch (err) {
    console.error('Upload Error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Find similar artworks
router.get('/:id/similar', async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
    if (!artwork || !artwork.featureVector) return res.status(404).json({ error: 'Artwork not found' })

    const all = await Artwork.find({ _id: { $ne: artwork._id }, featureVector: { $exists: true, $ne: null } }).limit(100)

    const scored = all.map(other => ({
      artwork: other,
      similarity: ImageFeatureExtractor.cosineSimilarity(artwork.featureVector, other.featureVector)
    }))

    const similar = scored.sort((a,b)=> b.similarity - a.similarity).slice(0,6).map(s=> s.artwork)

    res.json({ success: true, data: similar })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
