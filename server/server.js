import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import User from './routes/Users.js'
import Post from './routes/Posts.js'
import Comment from './routes/Comments.js'
import Artwork from './routes/Artworks.js'
import cookieParser from 'cookie-parser'


dotenv.config()

//express app
const app = express()
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true  
    }) 
)
app.use(express.json())

//routes
app.use(cookieParser())
app.use('/users',User)
app.use('/posts',Post)
app.use('/comments',Comment)
app.use('/artworks', Artwork)

//connect to db

//console.log("PORT:", process.env.PORT);
//console.log("MONGO_URL:", process.env.MONGO_URL);

mongoose.connect(process.env.MONGO_URL)
    .then(()=>{
        app.listen(process.env.PORT, () =>{
    console.log('\n******connected to db & listening to port*******',process.env.PORT)
});
    })
    .catch((error)=> {
        console.log(error)
    })
//listening for the requist


