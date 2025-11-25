import express from 'express';
import Comments from '../models/Comments.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
const router = express.Router();

// Add a comment 
router.post('/:postId', authMiddleware,async (req, res) => {
  const { text } = req.body;

  try {
    const comment = new Comments({
      text,
      user: {
        _id: req.user.id,
        name: req.user.name,
        avatar: "/avatar.png"   
      },
      post: req.params.postId,
      replies: [] 
    });

    await comment.save();

    //const populated = await comment.populate("user", "name profileImage");

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//comment to a post 
/*router.post ('/:postId' , async(req,res) => 
    { const {text} = req.body try { 
//const post = await Comments.findById(res.params.postId) 
// const comment = new Comments({ text, user: req.user.id, post: req.params.postId }) 
// await comment.save() 
// const populated = await Comments.populate("user" , "name avatar") res.status(201).json(populated) } 
// catch (error) { 
// res.status(500).json({error: error.message}) } }) */


// Get all comments for a post
router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comments.find({ post: req.params.postId })
    .sort({ createdAt: -1 })
    //
    .populate("user", "name avatar")             
      .populate("replies.user", "name avatar"); 
      //
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/** //retrieve all comment on posts 
 * router.get('/:postId' , async (req,res) => { 
 * try { const comment = await Comments.find( req.params.postId) 
 * .populate("user", "name avatar") 
 * .populate("replies.user","name avatar") 
 * .sort({createdAt: -1}) res.json(comment) } 
 * catch (error) 
 * { res.status(500).json({error: error.message}) } }) */

// Add a reply 
router.post('/reply/:commentId',authMiddleware, async (req, res) => {
  const { text } = req.body;

  try {
    const comment = await Comments.findById(req.params.commentId);

    if (!comment) return res.status(404).json({ error: "Comment not found" });
    comment.replies.push({
      user: {
      _id: req.user.id
    },
      text
    });
//
    await comment.save();
    const populatedComment = await comment
      .populate("user", "name avatar")
      .populate("replies.user", "name avatar");
//
    res.json(populatedComment);

    res.json(comment);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/count/:postId" , async (req,res) => {

  try {
    const count = await Comments.countDocuments({post:req.params.postId})
    res.json({count})
  } catch (error) {
    res.status(500).json({error: error.message})
  }
})


// DELETE a comment
router.delete('/:commentId', authMiddleware,async (req, res) => {
  try {
    const comment = await Comments.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (comment.user._id.toString() !== req.user.id)
     return res.status(403).json({ error: "Not authorized" });

  await Comments.findByIdAndDelete(req.params.commentId);
  res.json({ message: "Comment deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})


// DELETE a reply from a comment
router.delete('/reply/:commentId/:replyId', authMiddleware,async (req, res) => {
  try {
    const comment = await Comments.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const reply = comment.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ error: "Reply not found" });

    if (reply.user._id.toString() !== req.user.id)
     return res.status(403).json({ error: "Not authorized" });

    reply.deleteOne();
    await comment.save();
    res.json({ message: "Reply deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router;
