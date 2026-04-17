import { getRecommendedColors } from "./skinTonePalettes.js";

const WEIGHTS = {
  color: 30,
  skinTone: 25,
  weather: 20,
  formality: 25,
  scanBonus: 15
};

export const calculateOutfitScore = ({
  colorHarmonyScore = 60,
  skinToneFit = 10,
  weatherSuitability = 15,
  formalityMatch = 15,
  scanConfidence = 0.8,
  isScanned = false
}) => {
  // Normalize everything (0 → 1)
  const normalized = {
    color: colorHarmonyScore / 100,
    skin: skinToneFit / 25,
    weather: weatherSuitability / 25,
    formality: formalityMatch / 25
  };

  // Base score
  let total =
    normalized.color * WEIGHTS.color +
    normalized.skin * WEIGHTS.skinTone +
    normalized.weather * WEIGHTS.weather +
    normalized.formality * WEIGHTS.formality;

  const confidenceMultiplier = isScanned ? (1 + (scanConfidence * 0.2)) : 1;
  total = total * confidenceMultiplier;

  // Clamp score
  const score = Math.min(100, Math.max(0, Math.round(total)));

  let issues = [];

  if (normalized.color < 0.6) issues.push("color combination could be improved");
  if (normalized.skin < 0.6) issues.push("not ideal for your skin tone");
  if (normalized.weather < 0.6) issues.push("not suitable for current weather");
  if (normalized.formality < 0.6) issues.push("formality mismatch");

  let message = "Decent everyday look";

  if (score >= 85) {
    message = "Excellent match — highly recommended!";
  } else if (score >= 75) {
    message = "Strong choice — looks well coordinated";
  } else if (score >= 60) {
    message = issues.length
      ? `Good look but ${issues.join(", ")}`
      : "Good but can be improved";
  } else {
    message = issues.length > 0
      ? `Needs improvement — ${issues.join(", ")}`
      : "Basic match — consider alternatives";
  }

  return {
    score,
    message,
    breakdown: {
      colorHarmony: Math.round(normalized.color * WEIGHTS.color),
      skinToneFit: Math.round(normalized.skin * WEIGHTS.skinTone),
      weatherSuitability: Math.round(normalized.weather * WEIGHTS.weather),
      formalityMatch: Math.round(normalized.formality * WEIGHTS.formality),
      scanBonus: isScanned ? Math.round(scanConfidence * 15) : 0
    }
  };
};

export const estimateWeatherSuitability = (tempFeel, outfitCategories = []) => {
  let score = 15;

  const categories = outfitCategories.map(c => c.toLowerCase());

  if (tempFeel === "hot") {
    if (categories.includes("outerwear")) score -= 10;
    if (categories.includes("cotton") || categories.includes("linen")) score += 5;
  }

  if (tempFeel === "cold") {
    if (categories.includes("outerwear")) score += 10;
    else score -= 10;
  }

  if (tempFeel === "mild") {
    score += 2;
  }

  return Math.max(0, Math.min(25, score));
};

export const estimateSkinToneFit = (skinTone, colors = []) => {
  if (skinTone === "unknown") return 12;

  const palette = getRecommendedColors(skinTone);
  const bestColors = palette.best.map(c => c.toLowerCase());

  let matches = 0;

  colors.forEach(color => {
    const c = color.toLowerCase();
    if (bestColors.some(best => c.includes(best))) {
      matches++;
    }
  });

  const ratio = colors.length ? matches / colors.length : 0;

  if (ratio >= 0.7) return 25;
  if (ratio >= 0.4) return 18;
  if (ratio >= 0.2) return 10;
  return 5;
};