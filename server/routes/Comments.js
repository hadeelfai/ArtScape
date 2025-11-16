import express from 'express';
import Comments from '../models/Comments.js';
const router = express.Router();

// Add a comment (dummy user)
router.post('/:postId', async (req, res) => {
  const { text } = req.body;

  try {
    const comment = new Comments({
      text,
      user: {
        name: "Dummy User",
        avatar: "/avatar.png",
        _id: "dummy123"
      },
      post: req.params.postId,
      replies: [] // initialize empty
    });

    await comment.save();

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
    const comments = await Comments.find({ post: req.params.postId }).sort({ createdAt: -1 });
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

// Add a reply (dummy user)
router.post('/reply/:commentId', async (req, res) => {
  const { text } = req.body;

  try {
    const comment = await Comments.findById(req.params.commentId);

    if (!comment) return res.status(404).json({ error: "Comment not found" });

    comment.replies.push({
      user: {
        name: "Dummy User",
        avatar: "/avatar.png",
        _id: "dummy123"
      },
      text
    });

    await comment.save();

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
router.delete('/:commentId', async (req, res) => {
  try {
    const deleted = await Comments.findByIdAndDelete(req.params.commentId)

    if (!deleted)
      return res.status(404).json({ error: "Comment not found" })

    res.json({ message: "Comment deleted successfully" })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})


// DELETE a reply from a comment
router.delete('/reply/:commentId/:replyId', async (req, res) => {
  try {
    const comment = await Comments.findById(req.params.commentId)

    if (!comment)
      return res.status(404).json({ error: "Comment not found" })

    comment.replies = comment.replies.filter(
      r => r._id.toString() !== req.params.replyId
    )

    await comment.save()

    res.json({ message: "Reply deleted successfully" })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router;
