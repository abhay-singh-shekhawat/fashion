import BodyProfile from "../models/profile.model.js"
import asyncHandeler from "../utils/asyncHandler.js"
import {api_error} from "../utils/errorHandler.js"
import { awardPoints } from "./progress.controller.js"
import cloudinary from "../configs/cloudinary.js"
import crypto from "crypto"
import { scanQueue } from "../configs/queue.js"

const detectOutfit = async(imagePath)=>{
    // Possible fake types
    const possibleTypes = ['t-shirt', 'jeans', 'kurti', 'salwar', 'jacket', 'saree'];
    const possibleColors = ['blue', 'white', 'red', 'black', 'green', 'yellow'];

    return {
        detectedItems: [
        { type: possibleTypes[Math.floor(Math.random() * possibleTypes.length)], color: possibleColors[Math.floor(Math.random() * possibleColors.length)], confidence: 0.92 },
        { type: possibleTypes[Math.floor(Math.random() * possibleTypes.length)], color: possibleColors[Math.floor(Math.random() * possibleColors.length)], confidence: 0.87 }
        ],
        formalityLevel: Math.random() > 0.6 ? 'casual' : 'semi-formal',
        layers: Math.random() > 0.7 ? 2 : 1,
        note: 'This is a FAKE detection for Phase 1 testing'
    };
};

export const scanOutfit = asyncHandeler(async(req,res,next)=>{
    const userId  = req.user.id;
    if (!userId) {
        throw new api_error(400,"userId is required")
    }
    const profile = await BodyProfile.findOne({ userId });
    if (!profile) {
        throw new api_error(404,"Profile not found — create one first")
    }
    if (!req.file) {
        throw new api_error(400,"No image uploaded")
    }

    const publicId = `scan_${userId}_${Date.now()}`
    const uploadResult = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
      {
        folder: 'fashion/scan',
        public_id: publicId,
        overwrite: false,
      }
    );

    const imageHash = crypto
        .createHash('sha256')
        .update(req.file.buffer)
        .digest('hex');

    await scanQueue.add(`process-scan`,{
        userId,
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        imageHash: imageHash,
        originalFileName: req.file.originalname
    },{
        attempts: 3,
        backoff: {type: `exponential` , delay: 5000},
        removeOnComplete: true,
        removeOnFail: false
    })

    // Award points for scan uploading
    await awardPoints(userId, 8, 'scan_uploaded');

    res.status(200).json({
        success: true,
        message: "Scan job queued successfully. Processing in background...",
        jobId: publicId,
        uploadedImageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        note: "You will be notified when processing is complete. Real YOLOv8 coming soon."
    });
})