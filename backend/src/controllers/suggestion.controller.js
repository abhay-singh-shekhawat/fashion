import BodyProfile from "../models/profile.model.js"
import getWeather from "../utils/getWeather.js"
import asyncHandeler from "../utils/asyncHandler.js"
import {api_error} from "../utils/errorHandler.js"
import ClothingItem from "../models/clothingItem.model.js"
import { getRecommendedColors } from "../utils/skinTonePalatte.js"
import { awardPoints } from "./progress.controller.js"
import { getOfflineOutfitSuggestion } from "../utils/offlineSuggestion.js"
import { generateShoppingSuggestions } from '../utils/shoppingSuggestion.js';
import { setCache , getCache , generateCacheKey } from "../utils/cache.js"
import { generateAIOutfit } from "../utils/aiOutfitEngine.js"

export const getOccasionSuggestion = asyncHandeler(async(req,res,next)=>{
  const userId = req.user.id;
  const { occasion } = req.body

  const cacheKey = generateCacheKey("occasion_sug", userId);
  const cached = await getCache(cacheKey);
  if (cached) return res.status(200).json(cached);

  const profile = await BodyProfile.findOne({ userId });
  if (!profile) throw new api_error(404, "create a profile");

  const weather = await getWeather();

  const aiResult = await generateAIOutfit({
    profile,
    weather,
    wardrobe: [],
    occasion: occasion || "casual daily",
  });

  let weatherNote = `It's currently ~${weather.temperature}°C in Jaipur`;
  if (!weather.isDay) weatherNote += " (night time — consider layers)";

  const responseData = {
    userId,
    temperature: weather.temperature,
    weatherNote,
    occasion: occasion || "casual daily",
    suggestions: aiResult.outfits,
    basedOn: aiResult.source || "ai"
  };

  await awardPoints(userId, 5, 'occasion_sug');

  await setCache(cacheKey, responseData, 1800);

  res.status(200).json({
    responseData,
    note: "AI-powered occasion suggestion"
  });
})

export const getDailyRecommendations = asyncHandeler(async(req,res,next)=>{
   const userId = req.user.id;

  const cacheKey = generateCacheKey("daily_rec", userId);
  const cached = await getCache(cacheKey);
  if (cached) return res.status(200).json(cached);

  const profile = await BodyProfile.findOne({ userId });
  if (!profile) throw new api_error(404, "Create profile");

  const weather = await getWeather();
  const items = await ClothingItem.find({ userId });

  const aiResult = await generateAIOutfit({
    profile,
    weather,
    wardrobe: items,
    occasion: "daily wear",
  });

  const responseData = {
    userId,
    date: new Date().toLocaleDateString('en-IN'),
    temperature: weather.temperature,
    weatherFeel: weather.temperature < 18 ? 'cold' : weather.temperature > 32 ? 'hot' : 'mild',
    recommendation: {
      outfit: aiResult.outfits[0],   // pick best one
      source: aiResult.source,
      message: `For ${weather.temperature}°C, try: ${aiResult.outfits[0]}`,
      weatherSource: "ai"
    }
  };

  await awardPoints(userId, 5, 'daily_recommendation');

  await setCache(cacheKey, responseData, 1800);

  res.status(200).json({
    responseData,
    note: "AI-powered recommendation"
  });
})

export const getShoppingSuggestions = asyncHandeler(async (req, res) => {
    const userId  = req.user.id;

    if (!userId) {
        throw new api_error(400,"userId is required")
    }

    const profile = await BodyProfile.findOne({ userId });
    if (!profile) {
        throw new api_error(404,"Create your body profile first")
    }

    const wardrobeItems = await ClothingItem.find({ userId }).sort({ addedAt: -1 });

    const shopping = generateShoppingSuggestions(profile, wardrobeItems);

    res.status(200).json({
        userId,
        wardrobeSize: wardrobeItems.length,
        ...shopping
    });
  })