import { z } from "zod";
import { generateStructured } from "./groqJson.js";
import { getCache, setCache } from "./cache.js";

const PALETTE_SCHEMA = z.object({
  best: z.array(z.string()),
  avoid: z.array(z.string()),
  message: z.string()
});

/* A palette depends only on the skin tone, and every scored outfit asks for
   one — building a day of outfit candidates used to fire a Groq call per
   candidate. The colours for a tone don't move, so a day of cache is plenty. */
const PALETTE_TTL_SECONDS = 24 * 60 * 60;
const paletteCacheKey = (tone) => `skin-tone-palette:${tone}`;

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

  const cached = await getCache(paletteCacheKey(normalizedTone));
  if (cached) return cached;

  try {
    /* Structured outputs pin the model to this exact shape, so the reply is
       never parsed by hand and can't arrive with a missing field. `max_tokens`
       still needs headroom for the hidden reasoning tokens — at 300
       gpt-oss-120b spent the whole allowance thinking, and Groq rejected the
       empty document with json_validate_failed. reasoning_effort: "low" keeps
       that thinking short for what is really just a lookup. */
    const aiOutput = await generateStructured({
      name: "skin_tone_palette",
      schema: PALETTE_SCHEMA,
      system: `You are an expert Indian fashion color analyst.
      Provide culturally relevant, practical color recommendations for Indian skin tones and clothing styles (kurti, saree, sherwani, etc.).`,
      prompt: `For skin tone "${normalizedTone}", recommend colors for Indian fashion.
      - best: 5 to 8 colors that flatter this tone
      - avoid: colors that wash it out
      - message: one short stylish sentence (max 20 words) about the palette`,
      temperature: 0.65,
      maxTokens: 1000,
      reasoningEffort: "low"
    });

    // Merge AI result with fallback for safety (never return empty arrays)
    const palette = {
      best: aiOutput.best.length
        ? aiOutput.best.slice(0, 8)
        : defaultPalette.best,
      avoid: aiOutput.avoid.length
        ? aiOutput.avoid
        : defaultPalette.avoid,
      message: aiOutput.message || defaultPalette.message
    };

    await setCache(paletteCacheKey(normalizedTone), palette, PALETTE_TTL_SECONDS);

    return palette;

  } catch (error) {
    console.warn(`Groq AI failed for skinTone "${normalizedTone}":`, error.message);
    return defaultPalette;
  }
};
