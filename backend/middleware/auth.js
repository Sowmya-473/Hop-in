import jwt from "jsonwebtoken";
import User from "../models/User.js";

export default async function auth(req, res, next) {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // ✅ Verify the JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Try both `decoded.id` and `decoded._id` for safety
    const userId = decoded.id || decoded._id;
    if (!userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // ✅ Fetch the user from DB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Normalize the user object for consistent downstream checks
    req.user = {
      id: user._id.toString(),     // always string
      _id: user._id.toString(),    // backward compatibility
      email: user.email,
      name: user.name || "",
      role: user.role || "user",   // optional, if you ever use roles
    };

    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
