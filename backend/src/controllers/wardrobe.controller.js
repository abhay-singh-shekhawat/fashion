import BodyProfile from "../models/profile.model.js"
import ClothingItem from "../models/clothingItem.model.js"
import OutfitSuggestion from "../models/outfitSuggestion.model.js"
import getWeather from "../utils/getWeather.js"
import asyncHandeler from "../utils/asyncHandler.js"
import {api_error} from "../utils/errorHandler.js"
import { awardPoints } from "./progress.controller.js"
import { z } from "zod";
import { generateStructured } from "../utils/groqJson.js";
import { setCache , getCache , deleteCache , generateCacheKey } from "../utils/cache.js"
import { buildOutfitCandidates, describePiece, temperatureFeel } from "../utils/outfitCandidates.js"
import { formatSuggestedDay, lookbackCutoff } from "../utils/recommendationHistory.js"

/* The model only ranks outfits the wardrobe can actually build, so a short
   list is plenty — and keeps the prompt small. */
const AI_CANDIDATE_LIMIT = 8;

/** The AI picks a candidate by position, never by id: it used to answer with
 *  the item ids it saw in the prompt, and a single invented id killed the
 *  whole suggestion even though the wardrobe was fine. */
export const generateWardrobeAI = async ({
  profile,
  weather,
  occasion,
  candidates = []
}) => {
  if (!candidates.length) return null;

  const options = candidates
    .map((candidate, index) =>
      `${index}) ${candidate.pieces
        .map(piece => `${piece.name} (${piece.color}, ${piece.category}, ${piece.formality})`)
        .join(" + ")}`
    )
    .join("\n");

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

CANDIDATE OUTFITS (already built from this user's wardrobe):
${options}

TASK:
1. Choose the single best outfit for this person, this weather and this occasion
2. Return its index in "candidateIndex"
3. Explain the choice in "reason" (one or two sentences)
`;

  /* The valid index range is part of the schema, so the model can no longer
     answer with a position that doesn't exist. */
  const rankingSchema = z.object({
    candidateIndex: z.number().int().min(0).max(candidates.length - 1),
    reason: z.string(),
    confidence: z.number().min(0).max(1)
  });

  try {
    return await generateStructured({
      name: "wardrobe_ranking",
      schema: rankingSchema,
      prompt,
      temperature: 0.6
    });
  } catch (error) {
    /* Groq being down or rate limited must not take the daily fit down with
       it — the caller falls back to the best-scored candidate. */
    console.warn("Wardrobe AI ranking failed:", error.message);
    return null;
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

/* Slots the app renders. A wardrobe without a bottom still yields a look
   (top + layer, or a one-piece), so absent slots are simply null. */
const formatOutfit = (composition = {}) => ({
  top: composition.top ? formatClothingItemFull(composition.top) : null,
  bottom: composition.bottom ? formatClothingItemFull(composition.bottom) : null,
  layer: composition.layer ? formatClothingItemFull(composition.layer) : null,
  piece: composition.piece ? formatClothingItemFull(composition.piece) : null
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

/** Wardrobe reads are Redis-cached for 300s, so every write must bust them —
 *  otherwise a freshly added or scanned item stays invisible for 5 minutes. */
export const invalidateWardrobeCaches = async (userId) => {
  await deleteCache(generateCacheKey("wardrobe", userId));
  await deleteCache(generateCacheKey("wardrobe-suggestions", userId));
  await Promise.all(
    Object.keys(occasionToFormalities).map((occasion) =>
      deleteCache(generateCacheKey(`W-occasion-suggestions:${occasion}`, userId))
    )
  );
};

export const addClothingItem = asyncHandeler(async(req,res,next)=>{
    const userId = req.user.id
    const { name, category, color, formality} = req.body;

    if (!userId || !name || !category) {
      throw new api_error(400, "userId, name, and category are required")
    }

    const item = new ClothingItem({
      userId,
      name,
      category,
      color: color || 'unknown',
      formality: formality || `unknown`,
      publicId: `manual_${userId}_${Date.now()}`
    });

    await item.save();

    await awardPoints(userId, 10, 'wardrobe_item_added');

    await invalidateWardrobeCaches(userId);

    res.status(201).json({
      message: 'Item added to wardrobe',
      item
    });
})

export const getWardrobe = asyncHandeler(async(req,res,next)=>{
    const userId = req.user.id;

    const cacheKey = generateCacheKey("wardrobe", userId);
    const cached = await getCache(cacheKey);
    /* Older entries hold the bare array this route used to cache. */
    if (cached) return res.status(200).json(Array.isArray(cached) ? { items: cached } : cached);

    if (!userId) {
      throw new api_error(400, "userId required")
    }

    const items = await ClothingItem.find({ userId }).sort({ createdAt: -1 });
    /* Cache the same { items } envelope the route answers with. Caching the
       bare array made every cached read serve a different shape, and the app
       read `.items` off it as undefined — an empty closet. */
    const payload = { items };

    await setCache(cacheKey, payload, 300);

    res.status(200).json(payload);
})

export const getWardrobeSuggestions = asyncHandeler(async(req,res,next)=>{
  const userId = req.user.id;

  const cacheKey = generateCacheKey("wardrobe-suggestions", userId);
  const cached = await getCache(cacheKey);
  if (cached) return res.status(200).json(cached);

  const profile = await BodyProfile.findOne({ user: userId });
  if (!profile) {
    return res.status(200).json({
      message: 'Add your body profile so the stylist can personalise your fits',
      suggestion: null
    });
  }

  const items = await ClothingItem.find({ userId });
  if (items.length === 0) {
    return res.status(200).json({
      message: 'Wardrobe is empty',
      suggestion: null
    });
  }

  const weather = await getWeather();
  const temp = weather.temperature;
  const feel = temperatureFeel(temp);

  /* Newest first, so the first record seen for an outfit key is the day it was
     last suggested — the one the note should quote. */
  const previous = await OutfitSuggestion.find({
    userId,
    createdAt: { $gte: lookbackCutoff() }
  })
    .sort({ createdAt: -1 })
    .select("itemKey label createdAt");

  const previousByKey = new Map();
  previous.forEach((record) => {
    if (!previousByKey.has(record.itemKey)) {
      previousByKey.set(record.itemKey, {
        createdAt: record.createdAt,
        label: record.label
      });
    }
  });

  const candidates = await buildOutfitCandidates({
    items,
    temperature: temp,
    occasion: "daily",
    skinTone: profile.skinTone,
    previousSuggestions: previousByKey
  });

  /* No pair in the wardrobe at all (only shoes, say) — name what to add
     instead of reporting an AI failure for a limit of the wardrobe. */
  if (!candidates.length) {
    return res.status(200).json({
      message: 'Add a top and a bottom to build a full fit',
      suggestion: null,
      wardrobeCount: items.length
    });
  }

  const fresh = candidates.filter((candidate) => !candidate.previous);
  const skipped = candidates.find((candidate) => candidate.previous) ?? null;

  /* Only a closet that can't build anything new repeats itself — and then the
     look suggested longest ago comes first. */
  const pool = fresh.length
    ? fresh
    : [...candidates].sort((a, b) => a.previous.createdAt - b.previous.createdAt);

  const shortlist = pool.slice(0, AI_CANDIDATE_LIMIT);
  const ai = await generateWardrobeAI({
    profile,
    weather,
    occasion: "daily",
    candidates: shortlist
  });

  /* Anything the model gets wrong — no answer, an index out of range — costs
     it its pick, not the user their outfit. */
  const chosen = shortlist[ai?.candidateIndex] ?? shortlist[0];

  const freshnessNote = chosen.previous
    ? `Repeat of your ${formatSuggestedDay(chosen.previous.createdAt)} pick — this closet can't build anything newer right now`
    : skipped
      ? `Fresh pick — set aside "${skipped.label}" from ${formatSuggestedDay(skipped.previous.createdAt)}`
      : null;

  const responseData = {
    userId,
    fullOutfit: formatOutfit(chosen.composition),
    wardrobeCount: items.length,
    temperature: temp,
    suggestion: {
      outfit: chosen.label,
      weatherFit: `Good for ${feel} (~${temp}°C)`,
      note: ai?.reason || chosen.message,
      isRepeat: Boolean(chosen.previous),
      freshnessNote
    },
    profileSkinTone: profile.skinTone
  }

  await setCache(cacheKey, responseData, 300);

  /* Recording is what makes the next pick different; a failed write costs the
     user nothing today, so it must not take the response down. */
  try {
    await OutfitSuggestion.create({
      userId,
      itemIds: chosen.pieces.map((piece) => piece._id),
      itemKey: chosen.key,
      label: chosen.label,
      occasion: 'daily',
      temperature: temp,
      source: ai ? 'ai' : 'wardrobe'
    });
  } catch (error) {
    console.warn('Could not record outfit suggestion:', error.message);
  }

  await awardPoints(userId, 5, 'wardrobe_suggestion');

  res.status(200).json({
    ...responseData
  });
})

export const getOccasionSuggestion = asyncHandeler(async(req,res,next)=>{
  const userId = req.user.id;

  /* The occasion is part of the cache key — without it the first occasion
     queried gets served for every other occasion. */
  const occasion = req.query.occasion || req.body.occasion;
  const cacheKey = generateCacheKey(`W-occasion-suggestions:${occasion}`, userId);
  const cached = await getCache(cacheKey);
  if (cached) return res.status(200).json(cached);

  if (!occasionToFormalities[occasion]) {
    throw new api_error(400, "Invalid occasion");
  }

  const profile = await BodyProfile.findOne({ user: userId });
  if (!profile) {
    return res.status(200).json({
      occasion,
      message: 'Add your body profile so the stylist can personalise your fits',
      suggestion: null
    });
  }

  const items = await ClothingItem.find({ userId });
  if (items.length === 0) {
    return res.status(200).json({
      occasion,
      message: 'Wardrobe is empty',
      suggestion: null
    });
  }

  const weather = await getWeather();
  const temp = weather.temperature;
  const feel = temperatureFeel(temp);

  const candidates = await buildOutfitCandidates({
    items,
    temperature: temp,
    occasion,
    skinTone: profile.skinTone
  });

  if (!candidates.length) {
    return res.status(200).json({
      occasion,
      message: `Add a top and a bottom that work for ${occasion}`,
      suggestion: null
    });
  }

  const shortlist = candidates.slice(0, AI_CANDIDATE_LIMIT);
  const ai = await generateWardrobeAI({ profile, weather, occasion, candidates: shortlist });
  const chosen = shortlist[ai?.candidateIndex] ?? shortlist[0];

  const allowedFormalities = occasionToFormalities[occasion];
  const formalityMatch = chosen.pieces.every((piece) =>
    allowedFormalities.includes(piece.formality)
  );

  /* The sheet explains the formality pill with this string, so the level is
     worth keeping — but not when the piece never declared one. */
  const describeWithFormality = (piece) => {
    const formality = String(piece.formality ?? '');
    const level = formality && formality !== 'unknown'
      ? ` (${formality.replace(/_/g, ' ')})`
      : '';
    return `${describePiece(piece)}${level}`;
  };

  const responseData = {
    occasion,
    suggestion: chosen.pieces.map(describeWithFormality).join(" + "),
    fullOutfit: formatOutfit(chosen.composition),
    formalityMatch: formalityMatch
      ? 'Perfect formality match'
      : 'Acceptable but not ideal',
    weatherNote: `~${temp}°C – ${feel}`,
    aiReason: ai?.reason || chosen.message
  };

  await setCache(cacheKey, responseData, 300);

  await awardPoints(userId, 5, 'occasion_suggestion');

  res.status(200).json({
    ...responseData,
  });
})