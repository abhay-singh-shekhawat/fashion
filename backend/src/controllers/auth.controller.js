import User from "../models/user.model.js";
import  asyncHandeler  from "../utils/asyncHandler.js";

import {api_error} from "../utils/errorHandler.js";

export const register = asyncHandeler(async (req, res) => {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new api_error(400, "Email already in use");
    }
    const user = User.create({ name, email, password });
    res.status(201).json({ message: "User registered successfully" });
});

export const login = asyncHandeler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        throw new api_error(401, "Invalid email or password");
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new api_error(401, "Invalid email or password");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    res.status(200).json({ accessToken, refreshToken });
});