import User from "../models/user.model.js";
import  asyncHandeler  from "../utils/asyncHandler.js";
import BodyProfile from "../models/profile.model.js";
import UserProgress from "../models/userProgress.model.js";
import {api_error} from "../utils/errorHandler.js";
import bcrypt from "bcrypt"


export const register = asyncHandeler(async (req, res) => {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new api_error(400, "Email already in use");
    }
    const user = await User.create({ name, email, password });

    const userId = user._id.toString();

    await new BodyProfile({ userId }).save();
    await new UserProgress({ userId }).save();

    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    res.cookie(`refreshToken`,refreshToken,{
        httpOnly: true, 
        secure: true, 
        sameSite: 'Strict' })
    .status(201).json({ 
        message: "User registered successfully",
        user : {
            id : user._id,
            name : user.name,
            email : user.email
        },
        accessToken
     });
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
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    res.cookie(`refreshToken`,refreshToken,{
        httpOnly: true, 
        secure: true, 
        sameSite: 'Strict' })
    .status(200).json({
        message: "User registered successfully",
        user : {
            id : user._id,
            name : user.name,
            email : user.email
        },
        accessToken
});
});