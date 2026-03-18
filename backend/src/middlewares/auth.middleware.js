import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import {api_error} from "../utils/errorHandler.js";
import asyncHandler from "../utils/asyncHandler.js";

export const authMiddleware = asyncHandler(async(req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
          throw new api_error("Unauthorized: No token provided", 401);
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
          throw new api_error("Unauthorized: User not found", 401);
        }
        req.user = user;
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        if (error.name === "JsonWebTokenError") {
            return next(new api_error("Unauthorized: Invalid token", 401));
        }
        next(error);
    }
});