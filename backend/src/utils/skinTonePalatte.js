export const getRecommendedColors = (skinTone) => {
  const palettes = {
    warm: {
      best: ['gold', 'orange', 'terracotta', 'mustard', 'olive green', 'camel', 'chocolate brown', 'marigold'],
      avoid: ['icy blue', 'harsh black', 'pure white'],
      message: 'Warm undertones glow in earthy, golden, and spicy tones — common for many Indian complexions'
    },
    cool: {
      best: ['emerald', 'royal blue', 'burgundy', 'sapphire', 'ruby red', 'soft pink', 'charcoal gray', 'icy silver'],
      avoid: ['mustard', 'orange', 'bright yellow'],
      message: 'Cool undertones shine in jewel tones and crisp shades'
    },
    neutral: {
      best: ['taupe', 'soft gray', 'beige', 'muted navy', 'rose gold', 'lavender', 'teal'],
      avoid: ['neon anything'],
      message: 'Neutral undertones are versatile — most colors work with balance'
    },
    olive: {
      best: ['olive green', 'deep teal', 'rust', 'saffron', 'antique gold', 'moss green', 'warm plum', 'khaki'],
      avoid: ['pastel pink', 'harsh white'],
      message: 'Olive tones (very common in India) love muted earth tones + rich accents'
    },
    unknown: {
      best: ['black', 'white', 'gray', 'navy', 'beige'],
      message: 'Add your skin tone in profile for personalized color advice'
    }
  };

  return palettes[skinTone] || palettes.unknown;
};