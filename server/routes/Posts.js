import express from 'express'
import Post from '../models/Posts.js'
//import {authMiddleware} from '../middleware/AuthMiddleware.js'
import cloudinary from '../utils/cloudinary.js'
import { authMiddleware } from '../middleware/AuthMiddleware.js'

const router = express.Router()

router.post('/' ,async (req,res)=>{
    try { 
        const {image, text} =req.body

        const newPost = new Post({
            user: req.user ? req.user.id : null,
            text,
            image
        })
        await newPost.save()
        res.status(201).json(newPost)
    }catch (error){
        res.status(500).json({error: error.message})
    }
})

router.get('/' , async (req,res)=>{
    try {
        const posts = await Post.find().populate('user', 'name email avatar')
        .populate('likes').sort({createdAt: -1})
        
        res.json(posts)
    }catch (error){
        res.status(500).json({error: error.message})
    }
})

//to edit posts
router.put('/:id' , async (req,res)=>{
    try {
        const post = await Post.findById(req.params.id)
        if(post.user.toString() !== req.body.id ){
            return res.status(403).json({error: "not autharized"})
        }
        
        post.text = req.body.text || post.text
        post.image = req.body.image || post.image
        await post.save()

        res.json(post)
        
    }catch (error){
        res.status(500).json({error: error.message})
    }
})

//to delete posts
router.delete('/:id'  , async (req,res)=>{
    try {
        const post = await Post.findById(req.params.id)
        
       // if(post.user.toString() !== req.body.id ){
         //   return res.status(403).json({error: "not autharized"})
        //}
                
        await post.deleteOne()

        res.json({message: 'post deleted successfully'})
        
    }catch (error){
        res.status(500).json({error: error.message})
    }
})


router.post("/like/:id" , async( req,res) => {

    try {
    const {id} = req.params
    const userId = null

    const post = await Post.findById(id)
    const hasLiked = post.likes.includes(userId)
    if(hasLiked) {
        post.likes.pull(userId)
    }else{
        post.likes.push(userId)
    }

    await post.save()

    res.json({
        id: post._id,
        liked: !hasLiked,
        likesCount : post.likes.length
    })
    } catch (error) {
        res.status(500).json({ error: error.message})
    }
})



export default router