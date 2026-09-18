import asyncHandler from "../utils/asyncHandler.js";
import { api_error } from "../utils/errorHandler.js";
import BodyProfile from "../models/profile.model.js";
import ClothingItem from "../models/clothingItem.model.js";
import { generateShoppingSuggestions } from "../utils/shoppingSuggestion.js";
import { generateCacheKey, getCache, setCache } from "../utils/cache.js";

/* SerpAPI's free tier is 100 searches a month and one uncached tap spends up
   to three of them, so a day of cached ideas per user buys more than hourly
   variety would. */
const SHOPPING_CACHE_SECONDS = 24 * 60 * 60;

/**
 * GET /suggestion/get/occasion/suggestions
 * Returns empty suggestion list for any occasion.
 */
export const getOccasionSuggestion = asyncHandler(async (req, res) => {
  const { occasion = "casual" } = req.query;
  res.status(200).json({
    suggestion: {
      occasion,
      outfit: "No suggestions available",
      note: "Suggestion service placeholder",
    },
  });
});

/**
 * GET /suggestion/get/daily/recommendations
 * Returns a generic daily recommendation.
 */
export const getDailyRecommendations = asyncHandler(async (req, res) => {
  res.status(200).json({
    recommendation: {
      outfit: "Generic outfit suggestion",
      note: "Daily recommendation placeholder",
    },
  });
});

/**
 * GET /suggestion/get/shopping
 * What to buy next: AI-picked gaps in the wardrobe, each with real products.
 * Pass ?refresh=1 to spend fresh SerpAPI searches instead of the cached ideas.
 */
export const getShoppingSuggestions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const refresh = req.query.refresh === "1" || req.query.refresh === "true";
  const cacheKey = generateCacheKey("shopping-suggestions", userId);

  if (!refresh) {
    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json({ ...cached, cached: true });
  }

  const profile = await BodyProfile.findOne({ user: userId });
  if (!profile) {
    return res.status(200).json({
      message: "Add your body profile so the stylist knows what to shop for",
      suggestions: [],
    });
  }

  const items = await ClothingItem.find({ userId }).select("name color category");

  const { suggestions } = await generateShoppingSuggestions({
    profile,
    wardrobeItems: items,
  });

  /* Measurements sharpen the picks but are not required — say so rather than
     refusing to shop for someone who skipped that part. */
  const hasMeasurements = Boolean(profile.heightCm && profile.weightKg && profile.age);

  const message = suggestions.length
    ? hasMeasurements
      ? null
      : "Add your body profile for picks tuned to you"
    : "No shopping ideas right now — give it a moment and try again";

  const responseData = {
    suggestions,
    generatedAt: new Date().toISOString(),
    cached: false,
    ...(message ? { message } : {}),
  };

  /* An empty answer is worth retrying, so only a real result is remembered. */
  if (suggestions.length) {
    await setCache(cacheKey, responseData, SHOPPING_CACHE_SECONDS);
  }

  res.status(200).json(responseData);
});