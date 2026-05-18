import asyncHandler from "../utils/asyncHandler.js";
import { api_error } from "../utils/errorHandler.js";
import { scanQueuelite } from "../configs/queue.js";
import getWeather from "../utils/getWeather.js";
import { generateOutfitTips, generateQuickOutfitTips } from "../utils/generateOutfitTips.js";
import { awardPoints } from "./progress.controller.js";
import User from "../models/user.model.js";
import BodyProfile from "../models/profile.model.js";
import ClothingItem from "../models/clothingItem.model.js";
import {
  calculateOutfitScore,
  estimateWeatherSuitability,
  estimateSkinToneFit
} from "../utils/outfitScorer.js";
import crypto from "crypto";

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
 */
export const rateOutfitController = asyncHandler(async (req, res) => {
  const { imageUrl, occasion = "casual", detailedFeedback = false } = req.body;
  const userId = req.user._id;

  if (!imageUrl) {
    throw new api_error(400, "imageUrl is required");
  }

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    throw new api_error(404, "User not found");
  }

  // Hash image for duplicate detection
  const imageBuffer = await fetch(imageUrl).then(r => r.arrayBuffer());
  const imageHash = crypto
    .createHash("sha256")
    .update(Buffer.from(imageBuffer))
    .digest("hex");

  const publicId = `${userId}-${Date.now()}`;

  // ========== SCAN IMAGE ==========
  let scanResult;
  try {
    const job = await scanQueuelite.add("scan", {
      userId,
      imageUrl,
      publicId,
      imageHash
    });

    console.log(`[Outfit Rating] Scan job queued: ${job.id}`);
    scanResult = await waitForScanJob(job.id);

    if (!scanResult?.items || scanResult.items.length === 0) {
      throw new api_error(400, "No clothing items detected in image");
    }
  } catch (scanError) {
    console.error("[Outfit Rating] Scan failed:", scanError.message);
    throw new api_error(400, `Scan failed: ${scanError.message}`);
  }

  // ========== GET WEATHER ==========
  let weatherData;
  try {
    weatherData = await getWeather();
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
      skinToneScore = estimateSkinToneFit(bodyProfile.skinTone, colors);
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
  } catch (calcError) {
    console.error("[Outfit Rating] Score calculation failed:", calcError.message);
    throw new api_error(500, "Failed to calculate outfit score");
  }

  // ========== GET IMPROVEMENT TIPS ==========
  let improvementTips = null;
  try {
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
  return res.status(200).json({
    success: true,
    data: response
  });
});

/**
 * POST /api/outfit/rate-saved
 * Rate saved wardrobe items and get tips for improvement
 */
export const rateSavedOutfitController = asyncHandler(async (req, res) => {
  const { clothingItemIds, occasion = "casual", detailedFeedback = false } = req.body;
  const userId = req.user._id;

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
    skinToneScore = estimateSkinToneFit(bodyProfile.skinTone, colors);
  }

  // Score the outfit
  const colorHarmonyEstimate = Math.min(100, 50 + (items.length * 15));
  const formalityMap = {
    casual: 12,
    smart_casual: 18,
    formal: 22,
    party: 20,
    traditional: 18
  };
  const formalityMatch = formalityMap[occasion] || 15;

  const outfitScore = calculateOutfitScore({
    colorHarmonyScore: colorHarmonyEstimate,
    skinToneFit: skinToneScore,
    weatherSuitability: weatherScore,
    formalityMatch,
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

    const tipsResponse = detailedFeedback
      ? await generateOutfitTips({
          outfitScore,
          detectedItems: detectedItemsFormat,
          weather: weatherData,
          userProfile: bodyProfile || {},
          occasion
        })
      : await generateQuickOutfitTips({
          outfitScore,
          detectedItems: detectedItemsFormat,
          weather: weatherData,
          userProfile: bodyProfile || {},
          occasion
        });

    improvementTips = {
      tips: tipsResponse.tips,
      mode: detailedFeedback ? "detailed" : "quick"
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
        category: i.category
      })),
      colors: items.map(i => i.color)
    },
    weather: weatherData,
    improvementTips: improvementTips || null,
    metadata: {
      ratedAt: new Date().toISOString()
    }
  };

  return res.status(200).json({
    success: true,
    data: response
  });
});

export default rateOutfitController;