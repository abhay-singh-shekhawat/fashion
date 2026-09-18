import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import {api_error} from "../utils/errorHandler.js";
import asyncHandler from "../utils/asyncHandler.js";

export const authMiddleware = asyncHandler(async (req, res, next) => {
  // Accept token from Authorization header or cookie fallback
  const headerToken = req.headers.authorization?.split(' ')[1];
  const cookieToken = req.cookies?.accessToken || req.cookies?.token;
  const token = headerToken || cookieToken;

  if (!token) {
    // Directly respond with 401 instead of throwing to avoid connection reset
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userDoc = await User.findById(decoded.userId).select('_id name email');
    if (!userDoc) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    req.user = {
      id: userDoc._id.toString(),
      email: userDoc.email,
      name: userDoc.name,
    };
    next();
  } catch (err) {
    // Handle JWT errors uniformly
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ error: `Unauthorized: ${msg}` });
  }
});
