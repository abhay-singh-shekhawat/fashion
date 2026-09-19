import asyncHandler from "../utils/asyncHandler.js";
import { api_error } from "../utils/errorHandler.js";
import BodyProfile from "../models/profile.model.js";
import ClothingItem from "../models/clothingItem.model.js";
import { generateShoppingSuggestions } from "../utils/shoppingSuggestion.js";
import { generateCacheKey, getCache, setCache } from "../utils/cache.js";
import { z } from "zod";
import { generateStructured } from "../utils/groqJson.js";
import getWeather from "../utils/getWeather.js";
import { temperatureFeel } from "../utils/outfitCandidates.js";
import { getOfflineOutfitSuggestion } from "../utils/offlineSuggestion.js";
import { occasionToFormalities } from "./wardrobe.controller.js";

/* SerpAPI's free tier is 100 searches a month and one uncached tap spends up
   to three of them, so a day of cached ideas per user buys more than hourly
   variety would. */
const SHOPPING_CACHE_SECONDS = 24 * 60 * 60;

/* Ideas are remembered per user and occasion for five minutes; `refresh=1` is
   the app's "another one" and skips the read. */
const IDEAS_CACHE_SECONDS = 5 * 60;

const ideasSchema = z.object({
  ideas: z
    .array(
      z.object({
        title: z.string(),
        pieces: z.array(z.string()).min(2).max(6),
        why: z.string(),
      })
    )
    .min(1)
    .max(3),
});

const buildIdeasPrompt = ({ profile, occasion, formality, temperature, feel, condition }) => {
  const facts = [
    profile?.gender ? `- Gender: ${profile.gender}` : null,
    profile?.skinTone && profile.skinTone !== "unknown" ? `- Skin tone: ${profile.skinTone}` : null,
    profile?.heightCm ? `- Height: ${profile.heightCm} cm` : null,
    profile?.weightKg ? `- Weight: ${profile.weightKg} kg` : null,
    profile?.age ? `- Age: ${profile.age}` : null,
  ].filter(Boolean);

  return `
You are a fashion stylist writing outfit ideas for a wardrobe app.

PERSON
${facts.length ? facts.join("\n") : "- No profile details saved yet"}

OCCASION: ${occasion} (formality that reads right: ${formality.join(", ")})
WEATHER: ${Math.round(temperature)}°C, ${feel}${condition ? `, ${condition}` : ""}

TASK
Propose exactly 3 complete outfit ideas for this person and this occasion from
general fashion knowledge. These are ideas to shop for or adapt, so say nothing
about what the person already owns and never mention a wardrobe.

Each idea needs:
- "title": two to four words
- "pieces": the garments, most important first, two to six short strings
- "why": one sentence on why it works for this person, this occasion and this weather

Rules
- Respect the formality the occasion implies.
- Use the skin tone when a colour is worth choosing.
- Keep every string under 90 characters, sentence case, no exclamation marks.
`;
};

/**
 * GET /suggestion/get/occasion/suggestions?occasion=party
 * Outfit ideas for an occasion that are NOT limited to the closet: written from
 * the body profile, the occasion and today's weather. `refresh=1` asks for a
 * different set instead of the remembered one.
 */
export const getOccasionSuggestion = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const occasion = req.query.occasion || req.body?.occasion || "casual";
  const refresh = req.query.refresh === "1" || req.query.refresh === "true";

  if (!occasionToFormalities[occasion]) {
    throw new api_error(400, "Invalid occasion");
  }

  const cacheKey = generateCacheKey(`occasion-ideas:${occasion}`, userId);
  if (!refresh) {
    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json(cached);
  }

  const profile = await BodyProfile.findOne({ user: userId });

  const weather = await getWeather().catch(() => ({
    temperature: 25,
    condition: "clear",
    isDay: true,
  }));
  const temperature = weather.temperature ?? 25;
  const feel = temperatureFeel(temperature);

  let ideas = [];
  let source = "rules";

  try {
    const result = await generateStructured({
      name: "occasion_ideas",
      schema: ideasSchema,
      prompt: buildIdeasPrompt({
        profile,
        occasion,
        formality: occasionToFormalities[occasion],
        temperature,
        feel,
        condition: weather.condition,
      }),
      temperature: 0.8,
    });
    ideas = result?.ideas ?? [];
    if (ideas.length) source = "ai";
  } catch (error) {
    /* A model outage must not cost the user their ideas. */
    console.warn("Occasion ideas failed:", error.message);
  }

  /* The rule-based generator that was written for offline use is the fallback:
     general advice from gender, skin tone and weather, and no wardrobe. */
  if (!ideas.length) {
    const fallback = getOfflineOutfitSuggestion(profile || {}, []);
    ideas = [
      {
        title: `${occasion} idea`,
        pieces: String(fallback.suggestion)
          .split("+")
          .map((piece) => piece.trim())
          .filter(Boolean),
        why: [fallback.reason, fallback.skinToneTip].filter(Boolean).join(" ").trim(),
      },
    ];
  }

  const responseData = {
    occasion,
    ideas,
    weatherNote: `~${Math.round(temperature)}°C – ${feel}`,
    source,
  };

  await setCache(cacheKey, responseData, IDEAS_CACHE_SECONDS);

  res.status(200).json(responseData);
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