import express from 'express'
import Post from '../models/Posts.js'
import { authMiddleware } from '../middleware/AuthMiddleware.js'
import cloudinary from '../utils/cloudinary.js'
import nodemailer from "nodemailer";
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const router = express.Router();

/* ---------------------------------------------
   CREATE A POST + NOTIFY FOLLOWERS
---------------------------------------------- */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { image, text } = req.body;

    const newPost = new Post({
      user: req.user.id,
      text,
      image
    });

    await newPost.save();

    // 🔔 Notify all followers of the author
    const author = await User.findById(req.user.id).select(
      'followersArray name username'
    );

    if (author && Array.isArray(author.followersArray)) {
      const notificationsToInsert = author.followersArray
        .filter(id => id.toString() !== author._id.toString()) // skip self
        .map(followerId => ({
          user: followerId,        // receiver
          fromUser: author._id,    // who triggered the notification
          post: newPost._id,
          type: 'new_post',
          message: `${author.username || author.name || 'Someone'} posted in the community`,
        }));

      if (notificationsToInsert.length > 0) {
        await Notification.insertMany(notificationsToInsert);
      }
    }

    return res.status(201).json(newPost);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* ---------------------------------------------
   GET ALL POSTS FOR FEED
---------------------------------------------- */
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name username profileImage')
      .populate('likes', 'name username profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* ---------------------------------------------
   DELETE POST
---------------------------------------------- */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* ---------------------------------------------
   LIKE A POST + NOTIFY OWNER
---------------------------------------------- */
router.post("/like/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    // 🔔 Notify post owner if someone else likes it
    if (post.user.toString() !== req.user.id.toString() && !hasLiked) {
      const actor = await User.findById(req.user.id).select('name username');

      await Notification.create({
        user: post.user,      // owner
        fromUser: req.user.id,
        post: post._id,
        type: 'like',
        message: `${actor?.username || actor?.name || 'Someone'} liked your post`,
      });
    }

    res.json({
      id: post._id,
      liked: !hasLiked,
      likesCount: post.likes.length
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* ---------------------------------------------
   EDIT POST
---------------------------------------------- */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    post.text = req.body.text || post.text;
    post.image = req.body.image || post.image;

    await post.save();
    res.json(post);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* ---------------------------------------------
   REPORT POST (SEND EMAIL)
---------------------------------------------- */
router.post("/:postId/report", authMiddleware, async (req, res) => {
  try {
    const { reason, details } = req.body;
    const postId = req.params.postId;

    const post = await Post.findById(postId).populate("user");
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Email setup
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
        ${details ? `Additional details:\n${details}\n` : ""}
        Post Content: ${post.text}
        Image URL: ${post.image}
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Report sent to admin email." });

  } catch (err) {
    res.status(500).json({ error: "Failed to send report", details: err.message });
  }
});

export default router;
