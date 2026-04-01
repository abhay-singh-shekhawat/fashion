export const getOfflineOutfitSuggestion = (profile, wardrobeItems = []) => {
  const { gender = 'male', skinTone = 'unknown' } = profile || {};

  let tempFeel = 'mild';
  const randomTemp = 24 + Math.floor(Math.random() * 9); // 24-32°C typical
  if (randomTemp < 20) tempFeel = 'cold';
  else if (randomTemp > 32) tempFeel = 'hot';

  let suggestions = [];

  if (wardrobeItems.length > 0) {
    const tops = wardrobeItems.filter(i => i.category === 'top');
    const bottoms = wardrobeItems.filter(i => i.category === 'bottom');

    if (tops.length > 0 && bottoms.length > 0) {
      const top = tops[Math.floor(Math.random() * tops.length)];
      const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
      suggestions.push(`${top.name} + ${bottom.name} (from your wardrobe)`);
    }
  }

  // Fallback hardcoded suggestions
  if (suggestions.length === 0) {
    if (gender === 'female') {
      if (tempFeel === 'hot') {
        suggestions = ['Light cotton kurti + palazzo', 'Short kurti + leggings'];
      } else if (tempFeel === 'cold') {
        suggestions = ['Full sleeve kurti + jeans + shawl', 'Salwar kameez with sweater'];
      } else {
        suggestions = ['Cotton kurti + jeans', 'Casual top + churidar'];
      }
    } else {
      if (tempFeel === 'hot') {
        suggestions = ['Cotton t-shirt + jeans', 'Polo shirt + chinos'];
      } else if (tempFeel === 'cold') {
        suggestions = ['Full sleeve shirt + jeans + jacket', 'Sweater + trousers'];
      } else {
        suggestions = ['Casual shirt + jeans', 'T-shirt + chinos'];
      }
    }
  }

  return {
    temperature: randomTemp,
    weatherFeel: tempFeel,
    source: 'offline_rules',
    suggestion: suggestions[0] || 'Comfortable daily wear',
    note: 'Offline mode — no weather API available'
  };
};