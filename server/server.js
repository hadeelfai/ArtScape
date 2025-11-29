import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Routes
import UserRoutes from './routes/Users.js';
import PostRoutes from './routes/Posts.js';
import CommentRoutes from './routes/Comments.js';
import ArtworkRoutes from './routes/Artworks.js';
import NewsRoutes from './routes/News.js';
import NotificationsRoutes from './routes/Notification.js';
import ContactRoutes from './routes/contact.js';
import ArtworksAIRoutes from './routes/ArtworksAI.js';//for AI

// Middleware
import { authMiddleware } from './middleware/AuthMiddleware.js';
import imageFeatureExtractor from './services/imageFeatureExtractor.js';

dotenv.config();

const app = express();

// ----- Middleware -----
app.use(cors({
  origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ----- Routes -----
app.use('/users', UserRoutes);
app.use('/posts', PostRoutes);
app.use('/comments', authMiddleware, CommentRoutes);
app.use('/artworks', ArtworkRoutes);
app.use('/news', NewsRoutes);
app.use('/notifications', NotificationsRoutes);
app.use('/contact', ContactRoutes);
app.use('/artworks/ai', ArtworksAIRoutes);

// ----- AI Model Initialization -----
(async () => {
  try {
    console.log('Initializing AI models...');
    await imageFeatureExtractor.initialize();
    console.log('✅ AI Model Ready!');
  } catch (err) {
    console.error('AI Model Initialization Failed:', err);
  }
})();

// ----- MongoDB Connection and Server Start -----
const PORT = process.env.PORT || 5500;
const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => {
  app.listen(PORT, () => {
    console.log(`\n✅ Connected to DB & listening on port ${PORT}`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});

// ----- Error Handling -----
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});
