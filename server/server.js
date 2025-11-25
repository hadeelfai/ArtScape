import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import User from './routes/Users.js'
import Post from './routes/Posts.js'
import Comment from './routes/Comments.js'
import Artwork from './routes/Artworks.js'
import cookieParser from 'cookie-parser'
import News from './routes/News.js'
import { authMiddleware } from './middleware/AuthMiddleware.js'


dotenv.config()

const app = express()

app.use(cors({
  origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/users', User);
app.use('/posts', Post);
app.use('/comments',authMiddleware, Comment);
app.use('/artworks', Artwork);
app.use('/news', News)

// Connect to DB
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log('\n****** connected to db & listening to port *******', process.env.PORT);
    });
  })
  .catch((error) => {
    console.log(error);
  });

  
