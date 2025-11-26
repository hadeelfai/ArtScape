import jwt from "jsonwebtoken";
import User from "../models/User.js";



export const authMiddleware = async (req, res, next) => {
  try {
    const headerToken = req.headers.authorization?.replace("Bearer ", "");
    const cookieToken = req.cookies?.token;
    const token = headerToken || cookieToken;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load full user (name, email, avatar) from DB
    const user = await User.findById(decoded.id).select("name email avatar");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach full user to requist
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };

    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};
