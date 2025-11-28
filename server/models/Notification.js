import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    // Who receives this notification
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Who triggered it (liked, commented, posted, etc.)
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Optional: related post
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },

    // "new_post", "like", "comment"
    type: {
      type: String,
      enum: ['new_post', 'like', 'comment'],
      required: true,
    },

    // Text shown to the user
    message: {
      type: String,
      required: true,
    },

    // For later if you want read/unread
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
