import jwt from "jsonwebtoken";
/** 
export const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.token; // Read from HTTPcookie

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};
*/


export const authMiddleware = (req, res, next) => {
  try {
    const headerToken = req.headers.authorization?.replace("Bearer ", "");
    const cookieToken = req.cookies?.token;
    const token = headerToken || cookieToken;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};
 
