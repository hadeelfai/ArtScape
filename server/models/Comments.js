import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  user: {
    name: { type: String },
    avatar: { type: String },
    _id: { type: String } // using string for dummy
  },
  post: { type: String, required: true }, // ObjectId normally, using string for dummy
  replies: [
    {
      user: {
        name: { type: String },
        avatar: { type: String },
        _id: { type: String }
      },
      text: { type: String }
    }
  ]
}, { timestamps: true });

export default mongoose.model("Comments", commentSchema);
