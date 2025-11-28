import express from 'express';
import Comments from '../models/Comments.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import Post from '../models/Posts.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';


const router = express.Router();

// Add a comment to a post
router.post('/:postId', authMiddleware, async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Comment text is required' });
  }

  try {
    const comment = new Comments({
      text: text.trim(),
      user: req.user.id,             // store user as ObjectId reference
      post: req.params.postId,
      replies: []
    });

    await comment.save();

        // NEW: notify post owner when someone comments on their post
    const post = await Post.findById(req.params.postId).populate(
      'user',
      'name username'
    );

    if (post && post.user._id.toString() !== req.user.id.toString()) {
      const actor = await User.findById(req.user.id).select('name username');

      await Notification.create({
        user: post.user._id, // owner
        fromUser: req.user.id, // commenter
        post: post._id,
        type: 'comment',
        message: `${
          actor?.username || actor?.name || 'Someone'
        } commented on your post`,
      });
    }


    // Return comment with populated user fields (name, profileImage, username)
    const populatedComment = await Comments.findById(comment._id)
      .populate('user', 'name profileImage username')
      .populate('replies.user', 'name profileImage username');

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all comments for a post
router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comments.find({ post: req.params.postId })
      .sort({ createdAt: -1 })
      .populate('user', 'name profileImage username')
      .populate('replies.user', 'name profileImage username');

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a reply to a comment
router.post('/reply/:commentId', authMiddleware, async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Reply text is required' });
  }

  try {
    const comment = await Comments.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.replies.push({
      user: req.user.id,           // ObjectId ref to User
      text: text.trim(),
      createdAt: new Date()
    });

    await comment.save();

    // Return updated comment with populated user info
    const populatedComment = await Comments.findById(comment._id)
      .populate('user', 'name profileImage username')
      .populate('replies.user', 'name profileImage username');

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get number of comments for a post
router.get('/count/:postId', async (req, res) => {
  try {
    const count = await Comments.countDocuments({ post: req.params.postId });
    res.json({ count });
  } catch (error) {
    console.error('Count comments error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE a comment
router.delete('/:commentId', authMiddleware, async (req, res) => {
  try {
    const comment = await Comments.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // comment.user is an ObjectId, not an object with _id
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Comments.findByIdAndDelete(req.params.commentId);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE a reply from a comment
router.delete('/reply/:commentId/:replyId', authMiddleware, async (req, res) => {
  try {
    const comment = await Comments.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const reply = comment.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    // reply.user is also an ObjectId
    if (reply.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    reply.deleteOne();
    await comment.save();

    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Delete reply error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
