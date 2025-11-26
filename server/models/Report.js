import mongoose from "mongoose";

// report DB
const reportSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now },
  seen: { type: Boolean, default: false }, // for admin notifications
});

export default mongoose.model("Report", reportSchema);
