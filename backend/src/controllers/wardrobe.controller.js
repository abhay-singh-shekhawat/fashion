import BodyProfile from "../models/profile.model.js"
import ClothingItem from "../models/clothingItem.model.js"
import getWeather from "../utils/getWeather.js"
import asyncHandeler from "../utils/asyncHandler.js"
import {api_error} from "../utils/errorHandler.js"
import { awardPoints } from "./progress.controller.js"
import OpenAI from "openai";
import { setCache , getCache , generateCacheKey } from "../utils/cache.js"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateWardrobeAI = async ({
  profile,
  weather,
  wardrobe,
  occasion,
  allowedFormalities = []
}) => {
  const prompt = `
You are a fashion stylist AI.

USER PROFILE:
- Gender: ${profile.gender}
- Skin tone: ${profile.skinTone}
- Height: ${profile.heightCm}
- Weight: ${profile.weightKg} kg
- Age: ${profile.age}

WEATHER:
- Temp: ${weather.temperature}°C
- Daytime: ${weather.isDay}

OCCASION: ${occasion}

ALLOWED FORMALITIES:
${allowedFormalities.join(", ") || "any"}

WARDROBE:
${wardrobe.map(i => `
- id: ${i._id}
  name: ${i.name}
  color: ${i.color}
  category: ${i.category}
  formality: ${i.formality}
`).join("\n")}

TASK:
1. Select ONE top and ONE bottom using ONLY the given IDs
2. Respect category (top vs bottom)
3. Respect occasion if provided

Return STRICT JSON:
{
  "topId": "id_here",
  "bottomId": "id_here",
  "reason": "...",
  "confidence": 0-1
}
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
  });

  try {
    return JSON.parse(response.choices[0].message.content);
  } catch {
    return null; // fallback trigger
  }
};

const formatClothingItemFull = (item) => ({
  id: item._id,
  name: item.name,
  category: item.category,
  color: item.color,
  formality: item.formality,
  image: item.imageUrl
});

const occasionToFormalities = {
    casual: ['casual', 'smart_casual', 'sporty'],
    daily: ['casual', 'smart_casual'],
    office: ['smart_casual', 'business', 'formal'],
    interview: ['business', 'formal'],
    party: ['party', 'formal', 'traditional'],
    gym: ['sporty'],
    traditional: ['traditional'],
    date: ['smart_casual', 'party']
};

export const addClothingItem = asyncHandeler(async(req,res,next)=>{
    const userId = req.user.id
    const { name, category, color, formality} = req.body;

    if (!userId || !name || !category) {
      throw new api_error(400,"userId, name, and category are required")
    }

    const item = new ClothingItem({
      userId,
      name,
      category,
      color: color || 'unknown',
      formality: formality || `unknown`
    });

    await item.save();

    await awardPoints(userId, 10, 'wardrobe_item_added');

    res.status(201).json({
      message: 'Item added to wardrobe',
      item
    });
})

export const getWardrobe = asyncHandeler(async(req,res,next)=>{
    const userId = req.user.id;

    const cacheKey = generateCacheKey("wardrobe", userId);
    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    if (!userId) {
      throw new api_error(400,"userId required")
    }

    const items = await ClothingItem.find({ userId }).sort({ createdAt: -1 });

    await setCache(cacheKey, items, 300);

    res.status(200).json({ items });
})

export const getWardrobeSuggestions = asyncHandeler(async(req,res,next)=>{
  const userId = req.user.id;

  const cacheKey = generateCacheKey("wardrobe-suggestions", userId);
  const cached = await getCache(cacheKey);
  if (cached) return res.status(200).json(cached);

  const profile = await BodyProfile.findOne({ userId });
  const items = await ClothingItem.find({ userId });

  if (!profile || items.length === 0) {
    return res.status(200).json({
      message: 'Wardrobe is empty or profile missing',
      suggestion: null
    });
  }

  const weather = await getWeather();
  const temp = weather.temperature;
  const feel = temp < 18 ? 'cold' : temp > 32 ? 'hot' : 'mild';

  // AI CALL
  const ai = await generateWardrobeAI({
    profile,
    weather,
    wardrobe: items,
    occasion: "daily"
  });

  let suggestion;

  if (ai) {
    const top = items.find(i => i._id.toString() === ai.topId);
    const bottom = items.find(i => i._id.toString() === ai.bottomId);

    const fullOutfit = {
      top: formatClothingItemFull(top),
      bottom: formatClothingItemFull(bottom)
    }

    if (top && bottom) {

      suggestion = {
        outfit: `${top.name} (${top.color}) + ${bottom.name} (${bottom.color})`,
        weatherFit: `Good for ${feel} (~${temp}°C)`,
        note: ai.reason || 'AI-selected outfit'
      };
    }
  }

  // FALLBACK if AI fails
  if (!suggestion) {
    return res.status(200).json({
      message: "AI failed, fallback needed",
      suggestion: null
    });
  }

  const responseData = {
    userId,
    fullOutfit,
    wardrobeCount: items.length,
    temperature: temp,
    suggestion,
    profileSkinTone: profile.skinTone
  }

  await setCache(cacheKey, responseData, 300);

  await awardPoints(userId, 5, 'wardrobe_suggestion');

  res.status(200).json({
    ...responseData
  });
})

export const getOccasionSuggestion = asyncHandeler(async(req,res,next)=>{
  const userId = req.user.id;

  const cacheKey = generateCacheKey("W-occasion-suggestions", userId);
  const cached = await getCache(cacheKey);
  if (cached) return res.status(200).json(cached);

  const { occasion } = req.body;

  if (!occasionToFormalities[occasion]) {
    throw new api_error(400, "Invalid occasion");
  }

  const profile = await BodyProfile.findOne({ userId });
  const items = await ClothingItem.find({ userId });

  const weather = await getWeather();
  const temp = weather.temperature;
  const feel = temp < 18 ? 'cold' : temp > 32 ? 'hot' : 'mild';

  const allowedFormalities = occasionToFormalities[occasion];

  // 🧠 AI CALL
  const ai = await generateWardrobeAI({
    profile,
    weather,
    wardrobe: items,
    occasion,
    allowedFormalities
  });

  if (!ai) {
    return res.status(200).json({
      occasion,
      message: "AI failed to generate suggestion",
      suggestion: null
    });
  }

    const top = items.find(i => i._id.toString() === ai.topId);
    const bottom = items.find(i => i._id.toString() === ai.bottomId);

    const fullOutfit = {
      top: formatClothingItemFull(top),
      bottom: formatClothingItemFull(bottom)
    }

  if (!top || !bottom) {
    return res.status(200).json({
      occasion,
      message: "AI picked invalid items",
      suggestion: null
    });
  }

  const formalityMatch =
    allowedFormalities.includes(top.formality) &&
    allowedFormalities.includes(bottom.formality)
      ? 25
      : 15;

  const responseData = {
    occasion,
    suggestion: `${top.name} (${top.color}, ${top.formality}) + ${bottom.name} (${bottom.color}, ${bottom.formality})`,
    fullOutfit,
    formalityMatch: formalityMatch === 25
      ? 'Perfect formality match'
      : 'Acceptable but not ideal',
    weatherNote: `~${temp}°C – ${feel}`,
    aiReason: ai.reason
  };

  await setCache(cacheKey, responseData, 300);

  await awardPoints(userId, 5, 'occasion_suggestion');

  res.status(200).json({
    ...responseData,
  });
})