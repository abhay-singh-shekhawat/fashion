import { getRecommendedColors } from './skinTonePalatte.js';
import { fetchProducts } from '../configs/serp.js'; 

// Build smarter search queries
const buildSearchQuery = (suggestion, profile) => {
  const gender = profile.gender || "men";
  gender === `prefer_not_to_say` ? gender : gender = "";
  const region = "India fashion";

  return `${suggestion.item} for ${gender} ${region}`;
};

export const generateShoppingSuggestions = async (profile, wardrobeItems = []) => {

  const {gender} = profile;
  gender === `prefer_not_to_say` ? gender : gender = "";


// If wardrobe is empty, suggest essentials
  if (wardrobeItems.length === 0) {
    const baseSuggestions = [
      "Add 2-3 tops (t-shirts, kurtis, shirts)",
      "Add 2 bottoms (jeans, trousers, palazzo)",
      "Add at least one outerwear for weather changes"
    ];

    const enriched = await Promise.all(
      baseSuggestions.map(async (item) => {
        const string = `${item} suitable for ${gender} in Indian fashion`;
        const products = await fetchProducts(string);
        return {
          item,
          reason: "Essential wardrobe starter",
          products
        };
      })
    );

    return {
      message: "Your wardrobe is empty! Start by adding some essentials.",
      suggestions: enriched,
      priority: "high"
    };
  }

  const suggestions = [];

  const categories = wardrobeItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const colors = [...new Set(
    wardrobeItems.map(i => i.color?.toLowerCase?.() || "")
  )];

  const topsCount = categories.top || 0;
  const bottomsCount = categories.bottom || 0;
  const outerCount = categories.outerwear || 0;


  // CATEGORY BALANCE
  if (topsCount > bottomsCount + 2) {
    suggestions.push({
      item: "Jeans, chinos, palazzo or trousers",
      reason: "You have many tops but fewer bottoms"
    });
  }

  if (bottomsCount > topsCount + 1) {
    suggestions.push({
      item: "Shirts, kurtis or t-shirts",
      reason: "You need more tops for better combinations"
    });
  }

  if (outerCount === 0) {
    suggestions.push({
      item: "Light jacket, shawl or cardigan",
      reason: "Useful for layering and weather changes"
    });
  }


  // COLOR GAP (SKIN TONE)
  if (profile.skinTone !== 'unknown') {
    const palette = getRecommendedColors(profile.skinTone);

    const missingColors = palette.best.filter(c =>
      !colors.some(existing => existing.includes(c.toLowerCase()))
    );

    if (missingColors.length > 0) {
      suggestions.push({
        item: `${missingColors[0]} outfit or top`,
        reason: `Enhances your ${profile.skinTone} skin tone`
      });
    }
  }

  if (!wardrobeItems.some(i => 
    i.formality === 'smart_casual' || i.formality === 'business'
  )) {
    suggestions.push({
      item: "Smart casual shirt or kurti",
      reason: "Perfect for office or semi-formal events"
    });
  }

  if (!wardrobeItems.some(i => i.formality === 'sporty')) {
    suggestions.push({
      item: "Track pants or sporty t-shirt",
      reason: "Great for gym and active days"
    });
  }

  const enrichedSuggestions = await Promise.all(
    suggestions.slice(0, 3).map(async (suggestion) => {
      const query = buildSearchQuery(suggestion, profile);
      const products = await fetchProducts(query);

      return {
        ...suggestion,
        products
      };
    })
  );

  return {
    message: enrichedSuggestions.length > 0
      ? "Here’s what would improve your wardrobe the most:"
      : "Your wardrobe looks well-balanced! Great job.",
    suggestions: enrichedSuggestions,
    wardrobeBalance: {
      tops: topsCount,
      bottoms: bottomsCount,
      outerwear: outerCount
    },
    priority: enrichedSuggestions.length > 2 ? "high" : "medium"
  };
};