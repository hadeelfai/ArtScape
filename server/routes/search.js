// routes/search.js
import express from "express";
import Artwork from "../models/Artwork.js";
import News from "../models/News.js";
import User from "../models/User.js";

const router = express.Router();

// GET /api/search/all
// returns a unified array of searchable items
router.get("/all", async (req, res) => {
  try {
    // Fetch minimal fields only
    const [artworks, news] = await Promise.all([
      Artwork.find({}, { title: 1 }).lean().limit(1000),
      News.find({}, { title: 1 }).lean().limit(1000),
    ]);

    // Normalize shape: id, title, type, path
    const mapped = [
      ...artworks.map(a => ({ 
        id: a._id.toString(), 
        title: a.title, 
        type: "Artwork", 
        path: `/artworks/${a._id}` 
      })),
      ...news.map(n => ({ 
        id: n._id.toString(), 
        title: n.title, 
        type: n.type === "article" ? "Article" : "News", 
        path: n.type === "article" ? `/news/${n._id}?type=article` : `/news/${n._id}` 
      })),
    ];

    res.json(mapped);
  } catch (err) {
    console.error("Search /all error:", err);
    res.status(500).json({ error: "Failed to load search data" });
  }
});

// GET /api/search?q=query
// Advanced search with query parameter
router.get("/", async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === "") {
      return res.json([]);
    }

    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escaped, "i");

    const [artworks, news, users] = await Promise.all([
      Artwork.find({ title: searchRegex }, { title: 1 }).lean().limit(50),
      News.find({ title: searchRegex }, { title: 1 }).lean().limit(50),
      User.find(
        {
          accountStatus: "active",
          $or: [
            { name: searchRegex },
            { username: searchRegex },
          ],
        },
        { name: 1, username: 1 }
      )
        .lean()
        .limit(50),
    ]);

    const mapped = [
      ...users.map((u) => ({
        id: u._id.toString(),
        title: u.name || u.username,
        subtitle: u.username ? `@${u.username}` : undefined,
        type: "User",
        path: `/profile/${u._id}`,
      })),
      ...artworks.map((a) => ({
        id: a._id.toString(),
        title: a.title,
        type: "Artwork",
        path: `/artworks/${a._id}`,
      })),
      ...news.map((n) => ({
        id: n._id.toString(),
        title: n.title,
        type: n.type === "article" ? "Article" : "News",
        path: n.type === "article" ? `/news/${n._id}?type=article` : `/news/${n._id}`,
      })),
    ];

    res.json(mapped);
  } catch (err) {
    console.error("Search query error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

export default router;
