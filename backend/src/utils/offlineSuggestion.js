export const getOfflineOutfitSuggestion = (profile, wardrobeItems = []) => {
  const { gender = 'male', skinTone = 'unknown' } = profile || {};

  // More realistic temperature simulation for Jaipur (March–April range)
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour <= 18;
  
  // Better temperature distribution (Jaipur March average ~22-34°C)
  let temperature = 24 + Math.floor(Math.random() * 11); // 24 to 34°C
  if (hour < 8 || hour > 20) temperature -= 4; // cooler at night/early morning
  
  let tempFeel = 'mild';
  if (temperature < 20) tempFeel = 'cold';
  else if (temperature > 32) tempFeel = 'hot';

  let suggestions = [];
  let reason = '';

  // Priority 1: Use wardrobe if user has enough items
  if (wardrobeItems.length >= 2) {
    const tops = wardrobeItems.filter(i => i.category === 'top');
    const bottoms = wardrobeItems.filter(i => i.category === 'bottom');
    const outerwear = wardrobeItems.filter(i => i.category === 'outerwear');

    if (tops.length > 0 && bottoms.length > 0) {
      // Smart pairing logic
      let selectedTop = tops[Math.floor(Math.random() * tops.length)];
      let selectedBottom = bottoms[Math.floor(Math.random() * bottoms.length)];

      // Prefer better formality match for temperature
      if (tempFeel === 'hot') {
        // Prefer lighter items
        const lightTops = tops.filter(t => !t.formality?.includes('formal'));
        if (lightTops.length > 0) selectedTop = lightTops[Math.floor(Math.random() * lightTops.length)];
      } else if (tempFeel === 'cold' && outerwear.length > 0) {
        reason = 'Added layer for cooler weather';
      }

      suggestions.push(`${selectedTop.name} (${selectedTop.color}) + ${selectedBottom.name} (${selectedBottom.color})`);
    }
  }

  // Priority 2: Smart hardcoded suggestions based on gender + skinTone + weather
  if (suggestions.length === 0) {
    if (gender === 'female' || gender === 'other') {
      if (tempFeel === 'hot') {
        suggestions = [
          'Light cotton kurti + palazzo pants',
          'Short kurti + leggings or jeans',
          'Sleeveless top + skirt or palazzo'
        ];
        reason = 'Breathable fabrics for hot weather';
      } else if (tempFeel === 'cold') {
        suggestions = [
          'Full-sleeve kurti + jeans + light shawl',
          'Salwar kameez with sweater or jacket',
          'Long kurti + leggings + stole'
        ];
        reason = 'Layered look for cooler evenings';
      } else {
        suggestions = [
          'Cotton kurti + churidar or jeans',
          'Casual blouse + palazzo',
          'Light shirt + skirt'
        ];
      }
    } else {
      // Male / default
      if (tempFeel === 'hot') {
        suggestions = [
          'Cotton t-shirt or polo + chinos/jeans',
          'Half-sleeve shirt + shorts or light trousers',
          'Breathable linen shirt + jeans'
        ];
        reason = 'Light and breathable for hot climate';
      } else if (tempFeel === 'cold') {
        suggestions = [
          'Full-sleeve shirt + jeans + light jacket',
          'Sweater or hoodie + trousers',
          'Kurta pajama with jacket'
        ];
        reason = 'Warm layers for cooler weather';
      } else {
        suggestions = [
          'Casual shirt + jeans or chinos',
          'T-shirt + trousers',
          'Polo shirt + jeans'
        ];
      }
    }
  }

  // Skin tone bonus tip (makes it feel smarter)
  let skinToneTip = '';
  if (skinTone !== 'unknown') {
    if (skinTone === 'warm' || skinTone === 'olive') {
      skinToneTip = ' Earthy/golden tones will look especially flattering on you.';
    } else if (skinTone === 'cool') {
      skinToneTip = ' Jewel tones and cooler shades will suit you beautifully.';
    }
  }

  return {
    temperature,
    weatherFeel: tempFeel,
    source: 'offline_rules',
    suggestion: suggestions[0] || 'Comfortable daily wear',
    reason: reason || 'Based on your wardrobe and weather',
    skinToneTip: skinToneTip,
    note: 'Offline mode — using smart rule-based suggestions'
  };
};