import mongoose from "mongoose";

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    badge: {
      // small label like "Event" or "Community"
      type: String,
      default: "",
    },
    text: {
  // short description
  type: String,
  required: true,
},
content: {
  // full article body
  type: String,
  default: "",
},
    date: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    type: {
      // "news" or "article"
      type: String,
      enum: ["news", "article"],
      required: true,
    },
    isHero: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // adds createdAt and updatedAt
);

export default mongoose.model("News", newsSchema);
