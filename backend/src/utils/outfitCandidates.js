import { rateOutfitHarmony } from "./colorHarmony.js";
import { outfitKey } from "./recommendationHistory.js";
import {
  calculateOutfitScore,
  deriveOutfitFormality,
  estimateFormalityMatch,
  estimateWeatherSuitability,
  estimateSkinToneFit,
} from "./outfitScorer.js";

/* Kurta/kurti land in `traditional` from the scanner, and they pair with a
   bottom like any top — only one-piece garments can stand on their own. */
const UPPER_CATEGORIES = ["top", "traditional"];
const LOWER_CATEGORIES = ["bottom"];
const LAYER_CATEGORIES = ["outerwear"];
const STANDALONE_CATEGORIES = ["one_piece"];

export const temperatureFeel = (temperature) =>
  temperature < 18 ? "cold" : temperature > 32 ? "hot" : "mild";

const inCategories = (items, categories) =>
  items.filter((item) => categories.includes(item.category));

const piecesOf = (composition) =>
  [composition.top, composition.bottom, composition.layer, composition.piece].filter(Boolean);

/* Scanned pieces are already named "light blue shirt", so echoing the colour
   in brackets read as noise ("light blue shirt (light blue)"). Only add it
   when the name doesn't already say it. */
export const describePiece = (piece) => {
  const name = String(piece?.name ?? '').trim();
  const color = String(piece?.color ?? '').trim();
  const colorIsKnown = color && color.toLowerCase() !== 'unknown';

  if (!colorIsKnown || name.toLowerCase().includes(color.toLowerCase())) return name;

  return `${name} (${color})`;
};

const scoreComposition = (composition, { feel, occasion, skinTone }) => {
  const pieces = piecesOf(composition);

  return calculateOutfitScore({
    colorHarmonyScore: rateOutfitHarmony(pieces.map((piece) => piece.color)).score,
    skinToneFit: estimateSkinToneFit(skinTone, pieces.map((piece) => piece.color)),
    weatherSuitability: estimateWeatherSuitability(feel, pieces.map((piece) => piece.name)),
    formalityMatch: estimateFormalityMatch({
      occasion,
      formalityLevel: deriveOutfitFormality(pieces),
    }).score,
  });
};

/**
 * Every outfit the wardrobe can actually form, best first. The AI ranks this
 * list instead of naming item ids — models happily hallucinate a 24-char
 * ObjectId, and one bad id used to collapse the whole suggestion.
 *
 * Layers are offered as variants rather than merged in: the weather term in
 * the scorer then decides whether a jacket is a good idea today.
 *
 * `previousSuggestions` maps an outfit key to the record that already used it,
 * which is how a candidate knows it would be a repeat.
 */
export const buildOutfitCandidates = ({
  items = [],
  temperature,
  occasion = "daily",
  skinTone,
  previousSuggestions,
} = {}) => {
  const wardrobe = Array.isArray(items) ? items : [];
  const feel = temperatureFeel(temperature);

  const uppers = inCategories(wardrobe, UPPER_CATEGORIES);
  const lowers = inCategories(wardrobe, LOWER_CATEGORIES);
  const layers = inCategories(wardrobe, LAYER_CATEGORIES);

  const compositions = [];

  uppers.forEach((upper) => {
    lowers.forEach((lower) => {
      compositions.push({ top: upper, bottom: lower });
      layers.forEach((layer) => compositions.push({ top: upper, bottom: lower, layer }));
    });
  });

  if (!lowers.length) {
    uppers.forEach((upper) => {
      layers.forEach((layer) => compositions.push({ top: upper, layer }));
    });
  }

  const standalones = inCategories(wardrobe, STANDALONE_CATEGORIES);
  if (!lowers.length) {
    standalones.push(...inCategories(wardrobe, ["traditional"]));
  }
  standalones.forEach((piece) => compositions.push({ piece }));

  return compositions
    .map((composition) => {
      const pieces = piecesOf(composition);
      const { score, message } = scoreComposition(composition, { feel, occasion, skinTone });
      const key = outfitKey(pieces);

      return {
        pieces,
        composition,
        score,
        message,
        feel,
        key,
        label: pieces.map(describePiece).join(" + "),
        previous: previousSuggestions?.get(key) ?? null,
      };
    })
    .sort((a, b) => b.score - a.score);
};
