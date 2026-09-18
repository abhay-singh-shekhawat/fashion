import asyncHandler from "../utils/asyncHandler.js";
import { api_error } from "../utils/errorHandler.js";
import { scanQueuelite } from "../configs/queue.js";
import { uploadImage } from "../utils/uploads/cloudinaryUpload.js";
import getWeather from "../utils/getWeather.js";
import { generateOutfitTips, generateQuickOutfitTips, generateOutfitFeedback } from "../utils/generateOutfitTips.js";
import { awardPoints } from "./progress.controller.js";
import User from "../models/user.model.js";
import BodyProfile from "../models/profile.model.js";
import ClothingItem from "../models/clothingItem.model.js";
import OutfitRating from "../models/outfitRating.model.js";
import {
  calculateOutfitScore,
  estimateWeatherSuitability,
  estimateSkinToneFit,
  estimateFormalityMatch,
  deriveOutfitFormality
} from "../utils/outfitScorer.js";
import { rateOutfitHarmony } from "../utils/colorHarmony.js";
import { getRecommendedColors } from "../utils/skinTonePalatte.js";
import crypto from "crypto";
import {
  emitRatingStart,
  emitRatingComplete,
  emitRatingError,
  emitScanProgress,
  emitRatingWeatherDone,
  emitRatingTipsComplete,
  emitRatingScoreDone,
} from "../services/socketService.js";

// Helper to wait for scan job completion
const waitForScanJob = async (jobId, timeout = 60000) => {
  const startTime = Date.now();
  const pollInterval = 1000;

  while (Date.now() - startTime < timeout) {
    const job = await scanQueuelite.getJob(jobId);
    
    if (!job) {
      throw new Error("Scan job not found");
    }

    const state = await job.getState();

    if (state === "completed") {
      return job.returnvalue;
    }

    if (state === "failed") {
      throw new Error(`Scan job failed: ${job.failedReason}`);
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error("Scan job timeout");
};

/**
 * POST /api/outfit/rate
 * Scan outfit image and get detailed feedback + improvement tips
 * Accepts either an uploaded image (multipart `image`) or a hosted `imageUrl`.
 */
export const rateOutfitController = asyncHandler(async (req, res) => {
  const { occasion = "casual", detailedFeedback = false } = req.body;
  const userId = req.user.id;
  const file = req.file;

  /* Multipart text fields arrive as strings, so the toggle ships "true"/"false". */
  const isDetailed =
    detailedFeedback === true || detailedFeedback === "true" || detailedFeedback === "1";

  let imageUrl = typeof req.body.imageUrl === "string" ? req.body.imageUrl.trim() : "";

  if (!file && !imageUrl) {
    throw new api_error(400, "Upload an image or provide an imageUrl");
  }

  try {
    // Emit rating start
    await emitRatingStart(userId);

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      throw new api_error(404, "User not found");
    }

    let imageBuffer;
    const uploadSeed = `${userId}-${Date.now()}`;
    /* Stays null for pasted links: only an upload we made has an asset to
       clean up later, and the rating history relies on that distinction. */
    let publicId = null;

    if (file) {
      /* The queue worker needs a URL it can hand to Gemini, so uploaded files
         go through the same Cloudinary path the scanner uses. */
      const uploadResult = await uploadImage(file, {
        folder: "fashion/ratings",
        publicId: `rate_${uploadSeed}`
      });
      imageUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
      imageBuffer = file.buffer;
    } else {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new api_error(400, "Could not download that image link");
      }
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    }

    // Hash image for duplicate detection
    const imageHash = crypto
      .createHash("sha256")
      .update(imageBuffer)
      .digest("hex");

    // ========== SCAN IMAGE (ASYNC) ==========
    /* Without these options the job is created with attempts: 0, so a single
       transient Gemini 503 killed the rating outright. */
    const job = await scanQueuelite.add("scan", {
      userId,
      imageUrl,
      publicId,
      imageHash,
      occasion,
      detailedFeedback: isDetailed,
      jobType: "rating"
    }, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false
    });

    console.log(`[Outfit Rating] Scan job queued: ${job.id}`);
    
    // Emit progress
    await emitScanProgress(userId, {
      status: "queued",
      message: "Scan job queued successfully. Processing in background...",
      progress: 10,
      jobId: job.id
    });

    return res.status(202).json({
      success: true,
      message: "Scan job queued successfully. Processing in background...",
      jobId: job.id,
      note: "You will be notified via WebSocket when processing is complete."
    });

    // ========== GET WEATHER ==========
    let weatherData;
    try {
      // Emit progress
      await emitScanProgress(userId, {
        status: "fetching_weather",
        message: "Checking local weather...",
        progress: 60
      });

      weatherData = await getWeather();

      // Emit weather fetched
      await emitRatingWeatherDone(userId, 0, {
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        isDay: weatherData.isDay
      });

    } catch (weatherError) {
      console.warn("[Outfit Rating] Weather fetch failed");
      weatherData = {
        temperature: 25,
        condition: "clear",
        isDay: true
      };
    }

    // ========== ESTIMATE COMPONENT SCORES ==========
    let weatherScore = 0;
    let skinToneScore = 0;

    try {
      const categories = scanResult.items
        .map(item => item.type?.toLowerCase())
        .filter(Boolean);

      const tempCategory = 
        weatherData.temperature > 28 ? "hot" :
        weatherData.temperature < 15 ? "cold" :
        "mild";

      weatherScore = estimateWeatherSuitability(tempCategory, categories);

      // Get user's body profile for skin tone
      const bodyProfile = await BodyProfile.findOne({ user: userId });
      if (bodyProfile?.skinTone && bodyProfile.skinTone !== 'unknown') {
        const colors = scanResult.items.map(item => item.color);
        const palette = await getRecommendedColors(bodyProfile.skinTone);
        skinToneScore = estimateSkinToneFit(bodyProfile.skinTone, colors, palette);
      }
    } catch (scoreError) {
      console.warn("[Outfit Rating] Score estimation failed:", scoreError.message);
    }

    // ========== CALCULATE OUTFIT SCORE ==========
    let outfitScore;
    try {
      const colorHarmonyEstimate = Math.min(
        100,
        50 + (scanResult.items.length * 15)
      );

      const formalityMap = {
        casual: 12,
        smart_casual: 18,
        formal: 22,
        party: 20,
        traditional: 18
      };
      const formalityMatch = formalityMap[scanResult.items[0]?.formalityLevel] || 15;

      outfitScore = calculateOutfitScore({
        colorHarmonyScore: colorHarmonyEstimate,
        skinToneFit: skinToneScore,
        weatherSuitability: weatherScore,
        formalityMatch,
        isScanned: true,
        scanConfidence: 0.85
      });

      // Emit outfit score
      await emitRatingScoreDone(userId, outfitScore.score, outfitScore.message, outfitScore.breakdown);

    } catch (calcError) {
      console.error("[Outfit Rating] Score calculation failed:", calcError.message);
      throw new api_error(500, "Failed to calculate outfit score");
    }

    // ========== GET IMPROVEMENT TIPS ==========
    let improvementTips = null;
    try {
      // Emit progress
      await emitScanProgress(userId, {
        status: "generating_tips",
        message: "Creating personalized suggestions...",
        progress: 75
      });

      const bodyProfile = await BodyProfile.findOne({ user: userId });
      const tipsResponse = detailedFeedback
        ? await generateOutfitTips({
            outfitScore,
            detectedItems: scanResult.items,
            weather: weatherData,
            userProfile: bodyProfile || {},
            occasion
          })
        : await generateQuickOutfitTips({
            outfitScore,
            detectedItems: scanResult.items,
            weather: weatherData,
            userProfile: bodyProfile || {},
            occasion
          });

      improvementTips = {
        tips: tipsResponse.tips,
        mode: detailedFeedback ? "detailed" : "quick",
        model: tipsResponse.model
      };

      // Emit tips generated
      await emitRatingTipsComplete(userId, [improvementTips.tips]);

    } catch (tipsError) {
      console.warn("[Outfit Rating] Tips generation failed:", tipsError.message);
      // Tips are optional - don't fail the whole request
    }

    // ========== AWARD POINTS ==========
    try {
      const pointsAwarded = outfitScore.score > 70 ? 10 : 5;
      await awardPoints(userId, pointsAwarded, "outfit_scan");
    } catch (pointsError) {
      console.warn("[Outfit Rating] Points award failed:", pointsError.message);
    }

    // ========== BUILD RESPONSE ==========
    const response = {
      score: outfitScore.score,
      message: outfitScore.message,
      breakdown: outfitScore.breakdown,
      scannedOutfit: {
        items: scanResult.items,
        itemCount: scanResult.items.length,
        colors: scanResult.items.map(i => i.color),
        formalityLevel: scanResult.items[0]?.formalityLevel,
        overallStyle: scanResult.items[0]?.overallStyle
      },
      weather: {
        temperature: weatherData.temperature,
        condition: weatherData.weatherCode,
        isDay: weatherData.isDay
      },
      improvementTips: improvementTips || null,
      metadata: {
        userId,
        scanConfidence: 0.85,
        scannedAt: new Date().toISOString(),
        imageHash: imageHash.substring(0, 8)
      }
    };

    console.log(`[Outfit Rating] Complete - Score: ${outfitScore.score}`);

    // Emit rating complete
    await emitRatingComplete(userId, {
      success: true,
      message: "Outfit rating complete",
      rating: response
    });

    return res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error("[Outfit Rating] Error:", error.message);
    await emitRatingError(userId, error.message);
    throw error;
  }
});

/**
 * POST /api/outfit/rate-saved
 * Rate saved wardrobe items and get tips for improvement
 */
export const rateSavedOutfitController = asyncHandler(async (req, res) => {
  const { clothingItemIds, occasion = "casual", detailedFeedback = false } = req.body;
  const userId = req.user.id;

  if (!clothingItemIds || clothingItemIds.length === 0) {
    throw new api_error(400, "At least one clothing item is required");
  }

  // Get user and items
  const user = await User.findById(userId);
  const items = await ClothingItem.find({
    _id: { $in: clothingItemIds },
    userId
  });

  if (items.length === 0) {
    throw new api_error(404, "No items found");
  }

  // Get weather
  let weatherData;
  try {
    weatherData = await getWeather();
  } catch {
    weatherData = {
      temperature: 25,
      condition: "clear",
      isDay: true
    };
  }

  // Calculate scores
  const tempCategory =
    weatherData.temperature > 28 ? "hot" :
    weatherData.temperature < 15 ? "cold" :
    "mild";

  const categories = items.map(i => i.category?.toLowerCase()).filter(Boolean);
  const weatherScore = estimateWeatherSuitability(tempCategory, categories);

  let skinToneScore = 0;
  const bodyProfile = await BodyProfile.findOne({ user: userId });
  if (bodyProfile?.skinTone && bodyProfile.skinTone !== 'unknown') {
    const colors = items.map(i => i.color);
    const palette = await getRecommendedColors(bodyProfile.skinTone);
    skinToneScore = estimateSkinToneFit(bodyProfile.skinTone, colors, palette);
  }

  // Score the outfit
  /* Saved pieces carry their own colour and formality, so both dimensions are
     judged from the combination rather than estimated from how many items the
     user picked. */
  const harmony = rateOutfitHarmony(items.map(i => i.color));
  const formality = estimateFormalityMatch({
    occasion,
    formalityLevel: deriveOutfitFormality(items)
  });

  const colorHarmonyForUi = {
    colors: harmony.colors,
    pairs: harmony.pairs,
    note: harmony.note
  };

  const formalityForUi = {
    occasion,
    detected: formality.detected,
    wanted: formality.wanted,
    note: formality.note
  };

  const outfitScore = calculateOutfitScore({
    colorHarmonyScore: harmony.score,
    skinToneFit: skinToneScore,
    weatherSuitability: weatherScore,
    formalityMatch: formality.score,
    isScanned: false,
    scanConfidence: 0.8
  });

  // Get improvement tips
  let improvementTips = null;
  try {
    const detectedItemsFormat = items.map(item => ({
      type: item.category || "item",
      color: item.color,
      confidence: 0.95
    }));

    const feedback = await generateOutfitFeedback({
      outfitScore,
      detectedItems: detectedItemsFormat,
      weather: { ...weatherData, band: tempCategory },
      colorHarmony: colorHarmonyForUi,
      formality: formalityForUi,
      userProfile: bodyProfile || {},
      occasion,
      detailed: detailedFeedback
    });

    improvementTips = {
      tips: feedback.paragraph ?? feedback.quickWins ?? [],
      feedback: {
        headline: feedback.headline,
        sections: feedback.sections,
        quickWins: feedback.quickWins
      },
      mode: feedback.mode,
      model: feedback.model
    };
  } catch (tipsError) {
    console.warn("[Outfit Rating] Tips generation failed:", tipsError.message);
  }

  // Award points
  try {
    const pointsAwarded = outfitScore.score > 70 ? 8 : 3;
    await awardPoints(userId, pointsAwarded, "outfit_rate");
  } catch (err) {
    console.warn("[Outfit Rating] Points award failed");
  }

  const response = {
    score: outfitScore.score,
    message: outfitScore.message,
    breakdown: outfitScore.breakdown,
    outfit: {
      itemCount: items.length,
      items: items.map(i => ({
        id: i._id,
        name: i.name,
        color: i.color,
        category: i.category,
        imageUrl: i.imageUrl
      })),
      colors: items.map(i => i.color)
    },
    weather: { ...weatherData, band: tempCategory },
    colorHarmony: colorHarmonyForUi,
    formality: formalityForUi,
    improvementTips: improvementTips || null,
    metadata: {
      ratedAt: new Date().toISOString()
    }
  };

  /* Best-effort: a combination the user just scored should still come back
     even if remembering it fails. */
  try {
    const stored = await OutfitRating.record({
      userId,
      mode: 'closet',
      occasion,
      result: response
    });
    response.metadata.ratingId = stored._id;
  } catch (historyError) {
    console.warn("[Outfit Rating] History save failed:", historyError.message);
  }

  return res.status(200).json({
    success: true,
    data: response
  });
});

export default rateOutfitController;