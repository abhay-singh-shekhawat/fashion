import { getRecommendedColors } from './skinTonePalatte.js';

export const generateShoppingSuggestions = (profile, wardrobeItems = []) => {
  if (wardrobeItems.length === 0) {
    return {
      message: "Your wardrobe is empty! Start by adding or scanning some items.",
      suggestions: [
        "Add 2-3 tops (t-shirts, kurtis, shirts)",
        "Add 2 bottoms (jeans, trousers, palazzo)",
        "Add at least one outerwear for weather changes"
      ],
      priority: "high"
    };
  }

  const suggestions = [];
  const categories = wardrobeItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const colors = [...new Set(wardrobeItems.map(i => i.color.toLowerCase()))];

  // Basic balance check
  const topsCount = categories.top || 0;
  const bottomsCount = categories.bottom || 0;
  const outerCount = categories.outerwear || 0;

  if (topsCount > bottomsCount + 2) {
    suggestions.push({
      item: "More bottoms (jeans, chinos, palazzo or trousers)",
      reason: "You have many tops but fewer bottoms to pair with them"
    });
  }

  if (bottomsCount > topsCount + 1) {
    suggestions.push({
      item: "More tops (shirts, kurtis, t-shirts)",
      reason: "You have plenty of bottoms but need more variety in tops"
    });
  }

  if (outerCount === 0) {
    suggestions.push({
      item: "Light jacket, shawl or cardigan",
      reason: "Useful for cooler evenings or AC rooms in Jaipur"
    });
  }

  // Color gap suggestion based on skin tone
  if (profile.skinTone !== 'unknown') {
    const palette = getRecommendedColors(profile.skinTone);
    const missingColors = palette.best.filter(c => 
      !colors.some(existing => existing.includes(c.toLowerCase()))
    );

    if (missingColors.length > 0) {
      suggestions.push({
        item: `${missingColors[0]} colored item (${missingColors.slice(1,3).join(' or ')})`,
        reason: `Complements your ${profile.skinTone} skin tone better`
      });
    }
  }

  // Occasion coverage
  if (!wardrobeItems.some(i => i.formality === 'smart_casual' || i.formality === 'business')) {
    suggestions.push({
      item: "Smart casual shirt or kurti",
      reason: "Good for office or interviews"
    });
  }

  if (!wardrobeItems.some(i => i.formality === 'sporty')) {
    suggestions.push({
      item: "Sporty/track pants or t-shirt",
      reason: "For gym or casual active days"
    });
  }

  return {
    message: suggestions.length > 0 
      ? "Here’s what would improve your wardrobe the most:" 
      : "Your wardrobe looks well-balanced! Great job.",
    suggestions: suggestions.slice(0, 3), // max 3
    wardrobeBalance: {
      tops: topsCount,
      bottoms: bottomsCount,
      outerwear: outerCount
    },
    priority: suggestions.length > 2 ? "high" : "medium"
  };
};