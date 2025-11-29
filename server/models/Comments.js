import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
  post: {type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true},
  replies: [
  new mongoose.Schema(
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      text: { type: String, required: true }
    },
    { timestamps: true } //adds createdAt to each reply
  )
]
}, { timestamps: true });

export default mongoose.model("Comments", commentSchema);
