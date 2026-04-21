import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROK_API_KEY
});

export const getRecommendedColors = async (skinTone) => {
  // Default fallback (if AI fails or no key)
  const fallbackPalettes = {
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

  const normalizedTone = skinTone?.toLowerCase() || 'unknown';
  const defaultPalette = fallbackPalettes[normalizedTone] || fallbackPalettes.unknown;

  // If no Groq key or unknown skin tone, return fallback immediately
  if (!process.env.GROQ_API_KEY || normalizedTone === 'unknown') {
    return defaultPalette;
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert Indian fashion color analyst. 
          Provide culturally relevant, practical color recommendations for Indian skin tones and clothing styles (kurti, saree, sherwani, etc.).
          Always respond with valid JSON only.`
        },
        {
          role: "user",
          content: `For skin tone "${normalizedTone}", recommend the best colors for Indian fashion.

          Return ONLY this exact JSON structure (no extra text):
          {
            "best": ["color1", "color2", "color3", ...],
            "avoid": ["color1", "color2", ...],
            "message": "short stylish message (max 20 words)"
          }`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.65,
      max_tokens: 300,
      response_format: { type: "json_object" }
    });

    let aiOutput;
    try {
      aiOutput = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      console.warn("Failed to parse Groq JSON response:", parseError.message);
      return defaultPalette;
    }

    // Merge AI result with fallback for safety (never return empty arrays)
    return {
      best: Array.isArray(aiOutput.best) && aiOutput.best.length > 0 
        ? aiOutput.best.slice(0, 8) 
        : defaultPalette.best,
      avoid: Array.isArray(aiOutput.avoid) ? aiOutput.avoid : defaultPalette.avoid,
      message: aiOutput.message || defaultPalette.message
    };

  } catch (error) {
    console.warn(`Groq AI failed for skinTone "${normalizedTone}":`, error.message);
    return defaultPalette;
  }
};