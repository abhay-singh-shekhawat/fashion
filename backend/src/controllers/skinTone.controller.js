import BodyProfile from "../models/profile.model.js"
import asyncHandeler from "../utils/asyncHandler.js"
import { api_error } from "../utils/errorHandler.js"
import { uploadImage } from "../utils/uploads/cloudinaryUpload.js"
import { skinToneQueue } from "../configs/queue.js"
import { setCache, getCache, deleteCache, generateCacheKey } from "../utils/cache.js"
import {
  emitSkinToneStart,
  emitSkinToneQueued,
  emitSkinToneProgress,
  emitSkinToneError,
} from "../services/socketService.js"

/**
 * POST /api/v1/skin-tone/scan
 * Upload a portrait image → Cloudinary → enqueue skin-tone job → 202 response
 */
export const scanSkinTone = asyncHandeler(async (req, res, next) => {
  const userId = req.user.id;
  if (!userId) {
    throw new api_error(400, "userId is required");
  }

  if (!req.file) {
    throw new api_error(400, "No image uploaded");
  }

  // Profile must exist — the worker stores the result into it
  const profile = await BodyProfile.findOne({ user: userId });
  if (!profile) {
    throw new api_error(404, "Profile not found — create one first");
  }

  try {
    // Socket: started
    await emitSkinToneStart(userId, {
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });

    // Upload to cloudinary
    const publicId = `skintone_${userId}_${Date.now()}`;
    const uploadResult = await uploadImage(req.file, {
      folder: 'fashion/skintone',
      publicId
    });

    // Socket: uploaded
    await emitSkinToneProgress(userId, 30, "Image uploaded to cloud storage");

    // Enqueue job
    const job = await skinToneQueue.add(`process-skintone`, {
      userId,
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      originalFileName: req.file.originalname,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    });

    // Socket: queued
    await emitSkinToneQueued(userId, job.id);
    await emitSkinToneProgress(userId, 50, "Processing job queued, starting analysis...");

    // Cache invalidation — remove stale skin tone cache so subsequent reads refetch
    const cacheKey = generateCacheKey("skin_tone", userId);
    await deleteCache(cacheKey);

    res.status(202).json({
      success: true,
      message: "Skin tone scan queued successfully. Processing in background...",
      jobId: job.id,
      uploadedImageUrl: uploadResult.secure_url,
      note: "You will be notified via WebSocket when analysis is complete.",
    });
  } catch (error) {
    console.error("[SkinTone] Error:", error.message);
    await emitSkinToneError(userId, error.message);
    throw error;
  }
});

/**
 * GET /api/v1/skin-tone
 * Fetch user's current skin tone (cached with Redis)
 */
export const getSkinTone = asyncHandeler(async (req, res, next) => {
  const userId = req.user.id;

  // Cache-aside pattern
  const cacheKey = generateCacheKey("skin_tone", userId);
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  const profile = await BodyProfile.findOne({ user: userId }).select('skinTone updatedAt');
  if (!profile) {
    throw new api_error(404, "Profile not found");
  }

  const responseData = {
    userId,
    skinTone: profile.skinTone,
    updatedAt: profile.updatedAt,
  };

  await setCache(cacheKey, responseData, 1800); // 30 min TTL

  res.status(200).json(responseData);
});