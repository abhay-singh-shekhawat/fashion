// Very basic Phase 2 outfit scoring — expand later with real rules/ML
export const calculateOutfitScore = ({
  colorHarmonyScore = 60,
  skinToneFit = 10,
  weatherSuitability = 15,
  formalityMatch = 15,
  scanConfidence = 0.8,
  isScanned = false
}) => {
  let total = 0;

  total += (colorHarmonyScore / 100) * 30;   // max 30
  total += skinToneFit;                      // max 25
  total += weatherSuitability;               // max 20
  total += formalityMatch;                   // max 25

  if (isScanned) {
    total += scanConfidence * 15;            // max 15 bonus
  }

  const score = Math.min(100, Math.max(0, Math.round(total)));

  let message = 'Decent everyday look';
  if (score >= 85) message = 'Excellent match — highly recommended!';
  else if (score >= 75) message = 'Strong choice — looks coordinated';
  else if (score >= 60) message = 'Good but can be improved';
  else message = 'Basic match — consider alternatives';

  return {
    score,
    message,
    breakdown: {
      colorHarmony: Math.round((colorHarmonyScore / 100) * 30),
      skinToneFit,
      weatherSuitability,
      formalityMatch,
      scanBonus: isScanned ? Math.round(scanConfidence * 15) : 0
    }
  };
};

export const estimateWeatherSuitability = (tempFeel, outfitCategories = []) => {
  let score = 15;
  if (tempFeel === 'hot' && outfitCategories.includes('outerwear')) score -= 8;
  if (tempFeel === 'cold' && !outfitCategories.includes('outerwear')) score -= 10;
  if (tempFeel === 'cold' && outfitCategories.includes('outerwear')) score += 10;
  return Math.max(0, Math.min(25, score));
};

export const estimateSkinToneFit = (skinTone, colors = []) => {
  if (skinTone === 'unknown') return 12; 

  const palette = require('./skinTonePalettes').getRecommendedColors(skinTone);
  const bestColors = palette.best.map(c => c.toLowerCase());

  let matches = 0;
  colors.forEach(color => {
    if (bestColors.some(best => color.toLowerCase().includes(best))) matches++;
  });

  return matches >= 2 ? 25 : matches === 1 ? 15 : 5;
};