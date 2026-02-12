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

    // SECURITY: Load role field from DB for authorization checks
    const user = await User.findById(decoded.id).select("name email avatar role accountStatus");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    // Check if account is active
    if (user.accountStatus !== 'active') {
      return res.status(403).json({ error: `Account is ${user.accountStatus}` });
    }

    // Attach full user to request (includes role for RBAC checks)
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role, // ✅ Added for role-based access control
    };

    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};

// admin-only middleware for protected endpoints
export const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  next();
};
