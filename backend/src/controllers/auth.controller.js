import User from "../models/user.model.js";
import  asyncHandeler  from "../utils/asyncHandler.js";
import BodyProfile from "../models/profile.model.js";
import UserProgress from "../models/userProgress.model.js";
import {api_error} from "../utils/errorHandler.js";
import bcrypt from "bcrypt"


export const register = asyncHandeler(async (req, res) => {
    const { name, email, password } = req.body;
    console.log('[Auth] register request for', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new api_error(400, "Email already in use");
    }
    const user = await User.create({ name, email, password });

    const userId = user._id.toString();

    await new BodyProfile({ userId }).save({ validateBeforeSave: false });
    await new UserProgress({ userId }).save({ validateBeforeSave: false });

    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()
    if (!Array.isArray(user.refreshToken)) {
        user.refreshToken = [];
    }
    user.refreshToken.push(refreshToken)
    await user.save({ validateBeforeSave: false })

    console.log('[Auth] register completed for', email);

    res.cookie(`refreshToken`,refreshToken,{
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
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
    console.log('[Auth] login attempt for', email);
    const user = await User.findOne({ email });
    if (!user) {
        console.log('[Auth] user not found', email);
        throw new api_error(401, "Invalid email or password");
    }
    console.log('[Auth] user found, checking password for', email);
    const isMatch = await user.comparePassword(password);
    console.log('[Auth] password check result for', email, isMatch);
    if (!isMatch) {
        throw new api_error(401, "Invalid email or password");
    }
    console.log('[Auth] generating tokens for', email);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    if (!Array.isArray(user.refreshToken)) {
        user.refreshToken = [];
    }
    user.refreshToken.push(refreshToken)
    await user.save({ validateBeforeSave: false })
    console.log('[Auth] tokens generated and saved for', email);

    res.cookie(`refreshToken`,refreshToken,{
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'Strict' })
    .status(200).json({
        message: "User logged in successfully",
        user : {
            id : user._id,
            name : user.name,
            email : user.email
        },
        accessToken
    });
});