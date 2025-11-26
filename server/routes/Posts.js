import express from 'express'
import Post from '../models/Posts.js'
import {authMiddleware} from '../middleware/AuthMiddleware.js'
import cloudinary from '../utils/cloudinary.js'
import nodemailer from "nodemailer";


const router = express.Router()

// create a post
router.post('/' , authMiddleware,async (req,res)=>{
    try { 
        const {image, text} =req.body

        const newPost = new Post({
            user: req.user.id ,
            text,
            image
        })
        await newPost.save()
        res.status(201).json(newPost)
    }catch (error){
        res.status(500).json({error: error.message})
    }
})
// get all posts for feed
router.get('/' , async (req,res)=>{
    try {
        const posts = await Post.find()
        .populate('user', 'name email avatar')
        .populate('likes', 'name email avatar')
        .sort({createdAt: -1})
        
        res.status(200).json(posts)
    }catch (error){
        res.status(500).json({error: error.message})
    }
})


//to delete posts
router.delete('/:id'  ,authMiddleware, async (req,res)=>{
    try {
        const post = await Post.findById(req.params.id)
        
        if(post.user.toString() !== req.user.id ){
           return res.status(403).json({error: "Not autharized"})
        }
                
        await post.deleteOne()
        res.json({message: 'post deleted successfully'})
        
    }catch (error){
        res.status(500).json({error: error.message})
    }
})

//like a post
router.post("/like/:id" ,authMiddleware, async( req,res) => {

    try {
    const {id} = req.params
    const userId = req.user.id

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


//to edit posts
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        if (!post) return res.status(404).json({ error: "Post not found" })

        if (post.user.toString() !== req.user.id) {
            return res.status(403).json({ error: "Not authorized" })
        }

        post.text = req.body.text || post.text
        post.image = req.body.image || post.image
        await post.save()

        res.json(post)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

//send email for post report
router.post("/:postId/report", authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const postId = req.params.postId;

    const post = await Post.findById(postId).populate("user");

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    // EMAIL SETUP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"${req.user.name}" <x.artscape.x@gmail.com>`,
      to: "x.artscape.x@gmail.com", 
      subject: "Reported Post",
      text: `
        A post has been reported:
        Reported Post ID: ${postId}
        Reported By User: ${req.user.name} (${req.user.email})
        Reason: ${reason}
        Post Content:
        ${post.text}
        Image URL:
        ${post.image}
      `,
    };
    await transporter.sendMail(mailOptions);
    return res.json({ message: "Report sent to admin email." });
  } catch (err) {
    console.error("Email sending failed:", err);
    res.status(500).json({ error: "Failed to send report", details: err.message });
}
});




export default router