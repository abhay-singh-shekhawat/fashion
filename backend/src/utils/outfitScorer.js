import { getRecommendedColors } from "./skinTonePalette.js";

// Scoring weights
const WEIGHTS = {
  color: 30,
  skinTone: 25,
  weather: 20,
  formality: 25
};

// Thresholds for flagging issues
const ISSUE_THRESHOLD = 0.6;
const SCORE_EXCELLENT = 85;
const SCORE_STRONG = 75;
const SCORE_GOOD = 60;

// Color match quality tiers
const SKIN_TONE_EXCELLENT = 0.7;
const SKIN_TONE_GOOD = 0.4;

const validateRange = (value, min, max, field) => {
  if (typeof value !== "number" || isNaN(value)) {
    throw new Error(`${field} must be a number`);
  }
  if (value < min || value > max) {
    throw new Error(`${field} must be ${min}–${max}, got ${value}`);
  }
};

const normalize = (value, max) => Math.min(1, Math.max(0, value / max));

const colorMatchesAny = (color, palette) => {
  const c = color.toLowerCase().trim();
  return palette.some(p => {
    const pc = p.toLowerCase().trim();
    return c === pc || c.split(/[-\s,]+/).includes(pc);
  });
};

/**
 * Calculate outfit score based on color, weather, skin tone, and formality
 */
export const calculateOutfitScore = ({
  colorHarmonyScore = 60,
  skinToneFit = 10,
  weatherSuitability = 15,
  formalityMatch = 15,
  scanConfidence = 0.8,
  isScanned = false
}) => {
  // Validate inputs
  validateRange(colorHarmonyScore, 0, 100, "colorHarmonyScore");
  validateRange(skinToneFit, 0, 25, "skinToneFit");
  validateRange(weatherSuitability, 0, 25, "weatherSuitability");
  validateRange(formalityMatch, 0, 25, "formalityMatch");
  validateRange(scanConfidence, 0, 1, "scanConfidence");

  // Normalize to 0-1
  const norm = {
    color: normalize(colorHarmonyScore, 100),
    skin: normalize(skinToneFit, 25),
    weather: normalize(weatherSuitability, 25),
    formality: normalize(formalityMatch, 25)
  };

  // Check for issues
  const issues = [];
  if (norm.color < ISSUE_THRESHOLD) issues.push("color combo could be better");
  if (norm.skin < ISSUE_THRESHOLD) issues.push("not ideal for your skin tone");
  if (norm.weather < ISSUE_THRESHOLD) issues.push("not suitable for this weather");
  if (norm.formality < ISSUE_THRESHOLD) issues.push("formality mismatch");

  // Base score
  let score =
    norm.color * WEIGHTS.color +
    norm.skin * WEIGHTS.skinTone +
    norm.weather * WEIGHTS.weather +
    norm.formality * WEIGHTS.formality;

  // Apply scan bonus (0-20% boost)
  const multiplier = isScanned ? 1 + scanConfidence * 0.2 : 1;
  score = Math.round(Math.min(100, Math.max(0, score * multiplier)));

  // Build breakdown (apply multiplier so it sums to final score)
  const breakdown = {
    colorHarmony: Math.round(norm.color * WEIGHTS.color * multiplier),
    weatherSuitability: Math.round(norm.weather * WEIGHTS.weather * multiplier),
    formalityMatch: Math.round(norm.formality * WEIGHTS.formality * multiplier),
    scanBonus: isScanned ? Math.round(scanConfidence * 15) : 0
  };

  // Only include skin tone if it was actually evaluated
  if (skinToneFit > 0) {
    breakdown.skinToneFit = Math.round(norm.skin * WEIGHTS.skinTone * multiplier);
  }

  // Generate message
  let message = "Decent everyday look";
  if (score >= SCORE_EXCELLENT) {
    message = "Excellent match — highly recommended!";
  } else if (score >= SCORE_STRONG) {
    message = "Strong choice — looks well coordinated";
  } else if (score >= SCORE_GOOD) {
    message = issues.length
      ? `Good look but ${issues.join(", ")}`
      : "Good but can be improved";
  } else {
    message = issues.length > 0
      ? `Needs improvement — ${issues.join(", ")}`
      : "Basic match — consider alternatives";
  }

  return { score, message, breakdown };
};

/**
 * Estimate how suitable the outfit is for current weather
 */
export const estimateWeatherSuitability = (tempFeel, outfitCategories = []) => {
  const temps = ["hot", "cold", "mild"];
  const temp = tempFeel?.toLowerCase();

  if (!temps.includes(temp)) {
    throw new Error(`tempFeel must be hot, cold, or mild`);
  }

  let score = 15;
  const cats = outfitCategories.map(c => c.toLowerCase());

  if (temp === "hot") {
    if (cats.includes("outerwear")) score -= 10;
    if (cats.includes("cotton") || cats.includes("linen")) score += 5;
  } else if (temp === "cold") {
    if (cats.includes("outerwear")) score += 10;
    else score -= 10;
  } else if (temp === "mild") {
    score += 2;
  }

  return Math.max(0, Math.min(25, score));
};

/**
 * Estimate how well outfit colors match the user's skin tone
 */
export const estimateSkinToneFit = (skinTone, colors = []) => {
  // Return 0 if skin tone wasn't provided or is unknown
  if (!skinTone || skinTone === "unknown") {
    return 0;
  }

  const palette = getRecommendedColors(skinTone);
  if (!palette?.best?.length) {
    return 12; // Neutral score if lookup fails
  }

  const bestColors = palette.best;
  let matches = 0;

  colors.forEach(color => {
    if (colorMatchesAny(color, bestColors)) {
      matches++;
    }
  });

  const ratio = colors.length ? matches / colors.length : 0;

  if (ratio >= SKIN_TONE_EXCELLENT) return 25;
  if (ratio >= SKIN_TONE_GOOD) return 18;
  if (ratio >= 0.2) return 10;
  return 5;
};