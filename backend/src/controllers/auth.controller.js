import User from "../models/user.model.js";
import  asyncHandeler  from "../utils/asyncHandler.js";
import BodyProfile from "../models/profile.model.js";
import UserProgress from "../models/userProgress.model.js";
import {api_error} from "../utils/errorHandler.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";
import bcrypt from "bcrypt"
import crypto from "crypto"


export const register = asyncHandeler(async (req, res) => {
    const { name, email, password } = req.body;
    console.log('[Auth] register request for', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new api_error(400, "Email already in use");
    }
    const user = await User.create({ name, email, password });

    const userId = user._id.toString();

    await new BodyProfile({ user: userId }).save({ validateBeforeSave: false });
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

/* The name lives on the user, not on the body profile, so the edit-profile
   screen has a second save target. */
export const updateMe = asyncHandeler(async (req, res) => {
    const userId = req.user?.id;
    const name = String(req.body?.name ?? "").trim();

    if (!name) {
        throw new api_error(400, "Name is required");
    }
    if (name.length > 60) {
        throw new api_error(400, "Name must be 60 characters or fewer");
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: { name } },
        { new: true, runValidators: true }
    ).select("name email");

    if (!user) {
        throw new api_error(404, "User not found");
    }

    res.status(200).json({
        message: "Profile updated",
        user: { id: user._id, name: user.name, email: user.email }
    });
});

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/**
 * Starts a password reset. The answer is identical whether or not the address
 * has an account — otherwise this endpoint becomes a way to harvest emails.
 */
export const forgotPassword = asyncHandeler(async (req, res) => {
    const email = String(req.body?.email ?? "").trim();
    if (!email) {
        throw new api_error(400, "Email is required");
    }

    const response = {
        message: "If that email has an account, a reset link is on its way."
    };

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(200).json(response);
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";
    const link = `${clientUrl}/auth/reset?token=${token}`;

    const { delivered } = await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        link
    });

    /* No mail provider configured: hand the link back so the flow can be
       exercised locally. Never in production. */
    if (!delivered && process.env.NODE_ENV !== "production") {
        response.devResetLink = link;
    }

    res.status(200).json(response);
});

export const resetPassword = asyncHandeler(async (req, res) => {
    const token = String(req.body?.token ?? "").trim();
    const password = String(req.body?.password ?? "");

    if (!token) {
        throw new api_error(400, "Reset token is required");
    }
    if (password.length < 6) {
        throw new api_error(400, "Password must be at least 6 characters");
    }

    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken: hashed,
        resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
        throw new api_error(400, "That reset link is invalid or has expired");
    }

    /* The pre-save hook hashes the new password; unsetting the reset fields
       makes the link single-use, and dropping the refresh tokens signs the
       other sessions out. */
    user.password = password;
    user.set("resetPasswordToken", undefined);
    user.set("resetPasswordExpires", undefined);
    user.refreshToken = [];
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: "Password updated. Sign in with your new password." });
});