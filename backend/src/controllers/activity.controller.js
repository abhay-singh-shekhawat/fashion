import asyncHandler from "../utils/asyncHandler.js";
import ClothingItem from "../models/clothingItem.model.js";
import OutfitRating from "../models/outfitRating.model.js";
import OutfitSuggestion from "../models/outfitSuggestion.model.js";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 40;

const asLimit = (raw) => {
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, parsed));
};

const describeMode = (mode) => (mode === "closet" ? "from closet" : "from photo");

/* Every feed entry carries the same fields, so the app renders one timeline
   without knowing which collection a row came from. */
const toSuggestionEvent = (record) => ({
  id: `suggestion:${record._id}`,
  type: "outfit_suggested",
  title: "Outfit suggested",
  detail: record.label,
  meta: {
    occasion: record.occasion,
    temperature: record.temperature,
    source: record.source,
  },
  createdAt: record.createdAt,
});

const toRatingEvent = (record) => ({
  id: `rating:${record._id}`,
  type: "outfit_rated",
  title: `Fit rated ${record.score}/100`,
  detail: `${record.occasion} · ${describeMode(record.mode)}`,
  meta: {
    score: record.score,
    occasion: record.occasion,
    mode: record.mode,
  },
  createdAt: record.createdAt,
});

const toItemEvent = (record) => ({
  id: `item:${record._id}`,
  type: "item_added",
  title: `Added ${record.name}`,
  detail: [record.color, record.category].filter(Boolean).join(" · "),
  meta: {
    category: record.category,
    detectedBy: record.detectedBy,
  },
  createdAt: record.createdAt,
});

/**
 * GET /activity/log
 * Everything the app has done for this user, newest first: the fits it
 * suggested, the fits they rated and the pieces they added.
 */
export const getActivityLog = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = asLimit(req.query.limit);

  /* Each source is capped at `limit` before the merge — the newest `limit`
     entries overall can only come from the newest `limit` of any one source. */
  const [suggestions, ratings, pieces] = await Promise.all([
    OutfitSuggestion.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("label occasion temperature source createdAt"),
    OutfitRating.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("score occasion mode createdAt"),
    ClothingItem.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("name color category detectedBy createdAt"),
  ]);

  const items = [
    ...suggestions.map(toSuggestionEvent),
    ...ratings.map(toRatingEvent),
    ...pieces.map(toItemEvent),
  ]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);

  res.status(200).json({ items, limit });
});
