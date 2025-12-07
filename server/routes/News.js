import express from "express";
import News from "../models/News.js";
import { authMiddleware } from "../middleware/AuthMiddleware.js"; // ✅ SECURITY FIX: Add auth import

const router = express.Router();

// GET /news  → all items (news + articles)
router.get("/", async (req, res) => {
  try {
    const items = await News.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error("GET /news error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /news/type/:type → filter by type ("news" or "article")
router.get("/type/:type", async (req, res) => {
  try {
    const { type } = req.params; // "news" or "article"
    const items = await News.find({ type }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error("GET /news/type/:type error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /news/:id → single item for detail page
router.get("/:id", async (req, res) => {
  try {
    const item = await News.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "News item not found" });
    res.json(item);
  } catch (error) {
    console.error("GET /news/:id error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ SECURITY FIX: Protect POST with authMiddleware (admin-only intended)
// POST /news → create new
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, badge, text, content, date, image, type, isHero } = req.body;

    const newItem = new News({
      title,
      badge,
      text,                      // short description
      content: content || "",    // full article body
      date: date || "",
      image: image || "",
      type,                      // "news" or "article"
      isHero: !!isHero,
    });

    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("POST /news error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ SECURITY FIX: Protect PUT with authMiddleware (admin-only intended)
// PUT /news/:id → update existing
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, badge, text, content, date, image, type, isHero } = req.body;

    const updated = await News.findByIdAndUpdate(
      req.params.id,
      {
        title,
        badge,
        text,
        content: content || "",
        date: date || "",
        image: image || "",
        type,
        isHero: !!isHero,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "News item not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("PUT /news/:id error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ SECURITY FIX: Protect DELETE with authMiddleware (admin-only intended)
// DELETE /news/:id → delete
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const item = await News.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "News item not found" });

    res.json({ message: "News item deleted successfully" });
  } catch (error) {
    console.error("DELETE /news/:id error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
