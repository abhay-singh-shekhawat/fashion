import { generateJson } from "./gemini.js";

/* Rule tables are keyed on base colour names, but the vision model returns free
   text ("navy blue", "off-white", "denim"), so every colour is normalised
   before it is compared. Order matters: "navy blue" has to hit navy before it
   hits blue. */
const COLOR_KEYWORDS = [
  ["navy", "navy"],
  ["denim", "blue"],
  ["jean", "blue"],
  ["off-white", "white"],
  ["offwhite", "white"],
  ["ivory", "white"],
  ["cream", "white"],
  ["charcoal", "black"],
  ["maroon", "red"],
  ["burgundy", "red"],
  ["crimson", "red"],
  ["wine", "red"],
  ["magenta", "pink"],
  ["fuchsia", "pink"],
  ["rose", "pink"],
  ["olive", "green"],
  ["emerald", "green"],
  ["mint", "green"],
  ["sage", "green"],
  ["teal", "green"],
  ["khaki", "beige"],
  ["nude", "beige"],
  ["camel", "beige"],
  ["sand", "beige"],
  ["tan", "brown"],
  ["chocolate", "brown"],
  ["coffee", "brown"],
  ["rust", "brown"],
  ["mustard", "yellow"],
  ["lavender", "purple"],
  ["lilac", "purple"],
  ["violet", "purple"],
  ["grey", "gray"],
  ["silver", "gray"],
  ["gold", "gold"],
  ["black", "black"],
  ["white", "white"],
  ["blue", "blue"],
  ["red", "red"],
  ["pink", "pink"],
  ["green", "green"],
  ["brown", "brown"],
  ["beige", "beige"],
  ["orange", "orange"],
  ["yellow", "yellow"],
  ["purple", "purple"],
  ["gray", "gray"],
];

export const normalizeColor = (value) => {
  const text = String(value ?? "").toLowerCase().trim();
  if (!text) return null;
  const match = COLOR_KEYWORDS.find(([keyword]) => text.includes(keyword));
  return match ? match[1] : null;
};

const HARMONIOUS_PAIRS = {
  red: ["black", "white", "gray", "navy", "gold"],
  blue: ["white", "gray", "black", "beige", "brown", "red"],
  black: ["anything"],
  white: ["anything"],
  gray: ["black", "white", "blue", "red", "pink"],
  navy: ["white", "gray", "red", "pink"],
  green: ["white", "beige", "brown", "black", "gray"],
  pink: ["gray", "white", "navy", "black", "green"],
  brown: ["beige", "white", "green", "blue"],
  beige: ["brown", "white", "black", "navy"],
  orange: ["black", "white", "navy", "brown", "beige", "blue"],
  yellow: ["black", "white", "navy", "gray", "brown", "green"],
  purple: ["white", "black", "gray", "pink", "yellow", "beige"],
  gold: ["black", "white", "navy", "red", "green", "brown"],
};

const CLASHING_PAIRS = [
  ["red", "pink"],
  ["green", "red"],
  ["orange", "pink"],
];

const asBaseColor = (value) => normalizeColor(value) ?? String(value ?? "").toLowerCase().trim();

/**
 * Score two colours against the rule tables. Synchronous and deterministic, so
 * the rating path can judge a whole outfit without paying for a model call.
 * Returns { score: 0-100, message, verdict: monochrome|harmonious|neutral|clash }
 */
export const rateColorPair = (color1, color2) => {
  const a = asBaseColor(color1);
  const b = asBaseColor(color2);

  if (!a || !b) return { score: 50, message: "Unknown colors", verdict: "neutral" };

  if (a === b) {
    return { score: 85, message: "Monochrome / same color — safe and elegant", verdict: "monochrome" };
  }

  const rules = HARMONIOUS_PAIRS;
  if (
    rules[a]?.includes("anything") ||
    rules[b]?.includes("anything") ||
    rules[a]?.includes(b) ||
    rules[b]?.includes(a)
  ) {
    return { score: 80, message: "Good match — harmonious", verdict: "harmonious" };
  }

  if (CLASHING_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) {
    return { score: 30, message: "Potential clash — consider alternatives", verdict: "clash" };
  }

  return {
    score: 60,
    message: "Neutral combination — can work depending on shades",
    verdict: "neutral",
  };
};

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * Judge an outfit's colours as a whole: every unique colour pair is scored and
 * averaged, so a clash anywhere drags the harmony down the way it reads in the
 * mirror. Returns the facts the rating panel shows next to the dimension.
 */
export const rateOutfitHarmony = (rawColors = []) => {
  const colors = [];
  (Array.isArray(rawColors) ? rawColors : [rawColors]).forEach((raw) => {
    const base = normalizeColor(raw);
    if (base && !colors.includes(base)) colors.push(base);
  });

  if (colors.length < 2) {
    /* A single known colour is monochrome by definition; nothing recognised
       means there was nothing to judge, so stay neutral rather than guess. */
    return colors.length === 1
      ? { score: 85, colors, pairs: [], note: `${capitalize(colors[0])} on its own — monochrome, safe and elegant` }
      : { score: 60, colors, pairs: [], note: "The colours were too vague to judge" };
  }

  const pairs = [];
  for (let i = 0; i < colors.length; i += 1) {
    for (let j = i + 1; j < colors.length; j += 1) {
      const { score, verdict } = rateColorPair(colors[i], colors[j]);
      pairs.push({ a: colors[i], b: colors[j], score, verdict });
    }
  }

  const score = Math.round(pairs.reduce((sum, pair) => sum + pair.score, 0) / pairs.length);
  const clashes = pairs.filter((pair) => pair.verdict === "clash");

  let note;
  if (clashes.length) {
    const [first] = clashes;
    note = `${capitalize(first.a)} and ${capitalize(first.b)} fight each other${
      clashes.length > 1 ? ` (${clashes.length} pairs clash)` : ""
    }`;
  } else if (score >= 75) {
    note = `${capitalize(colors[0])} with ${colors.slice(1).join(" and ")} sit well together`;
  } else {
    note = "Neutral pairing — it works, but better shades would sharpen it";
  }

  return { score, colors, pairs, note };
};

/**
 * Async pair comparison with a Gemini enhancement layer for combinations the
 * rules can't call. Unused by the rating path (which stays offline and fast),
 * kept for callers that want a written suggestion.
 */
export const getColorCompatibility = async (color1, color2) => {
  if (!color1 || !color2) return { score: 50, message: "Unknown colors" };

  const baseResult = rateColorPair(color1, color2);

  /* Rules already have an answer (identical, harmonious or clashing) — only
     the neutral middle ground is worth a model call. */
  if (baseResult.verdict !== "neutral") {
    return { score: baseResult.score, message: baseResult.message };
  }

  try {
    const prompt = `You are a professional fashion color expert.
    Analyze the color combination: ${color1} and ${color2}.

    Return ONLY a valid JSON object with this exact structure:
    {
      "score": number between 0 and 100,
      "message": "short, stylish, and helpful explanation (max 15 words)",
      "suggestion": "optional one-line styling tip"
    }

    Base your analysis on real color theory, skin tone compatibility, and current fashion trends.`;

    const { text } = await generateJson(prompt);

    let aiResult;
    try {
      aiResult = JSON.parse(text.trim());
    } catch (parseError) {
      console.warn("Failed to parse Gemini JSON:", parseError.message);
      return baseResult;
    }

    // Merge AI intelligence with rule-based safety
    return {
      score: aiResult.score ?? baseResult.score,
      message: aiResult.message || baseResult.message,
      suggestion: aiResult.suggestion || "",
    };
  } catch (error) {
    console.warn("Gemini color analysis failed, falling back to rules:", error.message);
    return baseResult;
  }
};
