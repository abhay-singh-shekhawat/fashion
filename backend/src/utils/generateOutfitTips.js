import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generate 3-4 detailed, actionable outfit improvement tips
 * @param {Object} params - Configuration object
 * @param {Object} params.outfitScore - Outfit score with breakdown
 * @param {number} params.outfitScore.score - Score 0-100
 * @param {string} params.outfitScore.message - Score message
 * @param {Object} params.outfitScore.breakdown - Score breakdown
 * @param {Array} params.detectedItems - Array of detected clothing items
 * @param {Object} params.weather - Weather conditions
 * @param {Object} params.userProfile - User profile (optional fields)
 * @param {string} params.occasion - Occasion type
 * @returns {Promise<Object>} Tips response with success, tips, model, timestamp
 * @throws {Error} If API call fails
 */
export const generateOutfitTips = async ({
  outfitScore,
  detectedItems,
  weather,
  userProfile,
  occasion
}) => {
  try {
    const itemsDescription = detectedItems
      .map(
        (item) =>
          `${item.type} (${item.color}, confidence: ${(item.confidence * 100).toFixed(0)}%)`
      )
      .join(", ");

    const genderInfo = userProfile?.gender || "not specified";
    const skinToneInfo = userProfile?.skinTone || "not specified";
    const heightInfo = userProfile?.heightCm || "not specified";
    const weightInfo = userProfile?.weightKg || "not specified";
    const ageInfo = userProfile?.age || "not specified";

    const prompt = `You are an expert fashion stylist. Analyze this outfit and provide 3-4 specific, actionable tips to improve it.

OUTFIT ANALYSIS:
- Overall Score: ${outfitScore.score}/100
- Score Message: ${outfitScore.message}
- Score Breakdown: 
  - Color Harmony: ${outfitScore.breakdown.colorHarmony || 0}/100
  - Weather Suitability: ${outfitScore.breakdown.weatherSuitability || 0}/100
  - Formality Match: ${outfitScore.breakdown.formalityMatch || 0}/100
  ${outfitScore.breakdown.scanBonus ? `- Scan Bonus: ${outfitScore.breakdown.scanBonus}` : ""}
  ${outfitScore.breakdown.skinToneFit ? `- Skin Tone Fit: ${outfitScore.breakdown.skinToneFit}/100` : ""}

DETECTED ITEMS: ${itemsDescription}

WEATHER CONDITIONS:
- Temperature: ${weather.temperature}°C
- Condition: ${weather.condition || "clear"}
- Time of Day: ${weather.isDay ? "Day" : "Night"}

USER PROFILE:
- Gender: ${genderInfo}
- Skin Tone: ${skinToneInfo}
- Height: ${heightInfo} cm
- Weight: ${weightInfo} kg
- Age: ${ageInfo} years

OCCASION: ${occasion}

Please provide 3-4 specific, actionable tips to improve this outfit. Be friendly, encouraging, and professional. Format your response as plain text with each tip as a paragraph (no bullet points). Focus on practical changes that can be made immediately.`;

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    const tips = response.choices[0]?.message?.content || "";

    return {
      success: true,
      tips,
      model: "openai/gpt-oss-120b",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error generating outfit tips:", error.message);
    throw new Error(`Failed to generate outfit tips: ${error.message}`);
  }
};

/**
 * Generate 1-2 quick outfit improvement suggestions
 * @param {Object} params - Configuration object
 * @param {Object} params.outfitScore - Outfit score with breakdown
 * @param {Array} params.detectedItems - Array of detected clothing items
 * @param {Object} params.weather - Weather conditions
 * @param {Object} params.userProfile - User profile (optional fields)
 * @param {string} params.occasion - Occasion type
 * @returns {Promise<Object>} Quick tips response with success, tips, model, quick, timestamp
 * @throws {Error} If API call fails
 */
export const generateQuickOutfitTips = async ({
  outfitScore,
  detectedItems,
  weather,
  userProfile,
  occasion
}) => {
  try {
    const itemsDescription = detectedItems
      .map((item) => `${item.type} (${item.color})`)
      .join(", ");

    const genderInfo = userProfile?.gender || "not specified";
    const skinToneInfo = userProfile?.skinTone || "not specified";

    const prompt = `You are a quick fashion advisor. Give 1-2 quick, concise suggestions to improve this outfit.

OUTFIT: ${itemsDescription}
SCORE: ${outfitScore.score}/100
WEATHER: ${weather.temperature}°C, ${weather.condition || "clear"}
GENDER: ${genderInfo}
SKIN TONE: ${skinToneInfo}
OCCASION: ${occasion}

Provide only 1-2 quick, practical suggestions. Keep it brief and actionable.`;

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 150
    });

    const tips = response.choices[0]?.message?.content || "";

    return {
      success: true,
      tips,
      model: "openai/gpt-oss-120b",
      quick: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error generating quick outfit tips:", error.message);
    throw new Error(`Failed to generate quick outfit tips: ${error.message}`);
  }
};

/**
 * Generate structured, per-dimension outfit feedback for the rating panel.
 * Each scored dimension gets a verdict plus a grounded "why" and a concrete
 * "fix", so the app can render expandable rows instead of one wall of text.
 *
 * Falls back to the plain-text generators if the model ignores JSON mode, so
 * callers always get something to show.
 *
 * @returns {Promise<Object>} { success, headline, sections, quickWins, mode, model, paragraph? }
 */
export const generateOutfitFeedback = async ({
  outfitScore,
  detectedItems = [],
  weather = {},
  colorHarmony = {},
  formality = {},
  userProfile = {},
  occasion = "casual",
  detailed = false
}) => {
  const DIMENSIONS = {
    colorHarmony: { label: "Colour harmony", max: 30 },
    weatherSuitability: { label: "Weather fit", max: 20 },
    formalityMatch: { label: "Formality match", max: 25 },
    skinToneFit: { label: "Skin tone fit", max: 25 }
  };

  const wanted = Object.keys(DIMENSIONS).filter(
    (key) => typeof outfitScore?.breakdown?.[key] === "number"
  );

  const dimensionLines = wanted
    .map((key) => {
      const value = outfitScore.breakdown[key];
      const { label, max } = DIMENSIONS[key];
      const pct = Math.round((value / max) * 100);
      return `- ${key} (${label}): ${value}/${max} points (${pct}% — ${
        pct >= 70 ? "great" : pct >= 40 ? "good" : "off"
      })`;
    })
    .join("\n");

  const itemsDescription = detectedItems.length
    ? detectedItems.map((item) => `${item.type} in ${item.color}`).join(", ")
    : "nothing detected";

  /* The scorer already judged the colours and the formality; handing those
     findings over stops the model inventing its own reasons for the numbers. */
  const clashes = (colorHarmony?.pairs ?? []).filter((pair) => pair.verdict === "clash");
  const colorFacts = colorHarmony?.colors?.length
    ? `${colorHarmony.colors.join(", ")} — ${colorHarmony.note}${
        clashes.length
          ? ` (clashing pairs: ${clashes.map((pair) => `${pair.a} + ${pair.b}`).join(", ")})`
          : ""
      }`
    : null;

  const formalityFacts = formality?.detected
    ? `the pieces read as ${String(formality.detected).replace(/_/g, " ")}, and ${occasion} asks for ${
        (formality.wanted ?? []).join(" or ")
      }`
    : null;

  const prompt = `You are an expert personal stylist writing in-app feedback for a mobile outfit-rating screen.

OUTFIT: ${itemsDescription}
OVERALL SCORE: ${outfitScore?.score}/100 ("${outfitScore?.message}")
OCCASION: ${occasion}
WEATHER: ${weather.temperature}°C (feels like ${weather.feelsLike ?? weather.temperature}°C), ${weather.condition || "clear"}, ${weather.isDay ? "daytime" : "nighttime"} in ${weather.location || "the city"}${weather.band ? `, so it counts as ${weather.band} weather` : ""}
${colorFacts ? `COLOUR ANALYSIS: ${colorFacts}\n` : ""}${formalityFacts ? `FORMALITY: ${formalityFacts}\n` : ""}USER: skin tone ${userProfile?.skinTone || "unknown"}, gender ${userProfile?.gender || "not specified"}

SCORED DIMENSIONS (explain exactly these, no others):
${dimensionLines}

Reply with JSON only, in this exact shape:
{
  "headline": "one short sentence (max 70 chars) summarising the fit",
  "sections": [
    {
      "key": "<one of: ${wanted.join(", ")}>",
      "verdict": "great | good | off",
      "why": "1-2 sentences (max 240 chars) explaining the verdict using the real numbers, pieces, colours and weather above",
      "fix": "one concrete change to make (max 140 chars)"
    }
  ],
  "quickWins": ["2-3 short actions (max 90 chars each)"]
}

Rules:
- Include exactly one section per key listed above, in that order.
- The verdict must match the points shown (70%+ = great, 40-69% = good, under 40% = off).
- Always name the actual garment or colour that caused the score; never invent pieces that are not in OUTFIT.
- Mention the real temperature/condition when explaining the weather fit.
- Build the colour harmony section on COLOUR ANALYSIS and the formality section on FORMALITY — never contradict what they found.
- Plain sentences only — no markdown, no emoji, no bullet characters inside the strings.${detailed ? "" : "\n- Keep it tight: one short sentence per field."}`;

  try {
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: detailed ? 900 : 550,
      response_format: { type: "json_object" }
    });

    const raw = response.choices[0]?.message?.content || "";
    const parsed = JSON.parse(raw);
    const sections = Array.isArray(parsed?.sections) ? parsed.sections : [];
    const allowed = new Set(wanted);
    const text = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

    /* The model drifts between "weather", "weatherFit" and "weatherSuitability"
       for the same dimension — an unknown key used to drop the whole section. */
    const KEY_ALIASES = {
      color: "colorHarmony",
      colors: "colorHarmony",
      colours: "colorHarmony",
      colour: "colorHarmony",
      colourharmony: "colorHarmony",
      colorharmony: "colorHarmony",
      weather: "weatherSuitability",
      weatherfit: "weatherSuitability",
      weathersuitability: "weatherSuitability",
      formality: "formalityMatch",
      formalitymatch: "formalityMatch",
      skintone: "skinToneFit",
      skintonefit: "skinToneFit",
    };

    const resolveKey = (value) => {
      if (allowed.has(value)) return value;
      return KEY_ALIASES[String(value ?? "").toLowerCase().replace(/[^a-z]/g, "")] ?? null;
    };

    const seen = new Set();
    const mapped = sections
      .map((section) => ({ ...section, key: resolveKey(section?.key) }))
      .filter((section) => {
        if (!section.key || seen.has(section.key)) return false;
        seen.add(section.key);
        return true;
      })
      .map((section) => ({
        key: section.key,
        verdict: ["great", "good", "off"].includes(section?.verdict) ? section.verdict : "good",
        why: text(section?.why, 320),
        fix: text(section?.fix, 200)
      }))
      .filter((section) => section.why || section.fix);

    /* Anything the model skipped still gets a row in the panel — with the
       numbers, just no prose. */
    const missing = wanted.filter((key) => !seen.has(key));
    const feedback = {
      headline: text(parsed?.headline, 120),
      sections: [
        ...wanted.map((key) => mapped.find((section) => section.key === key)).filter(Boolean),
      ],
      quickWins: (Array.isArray(parsed?.quickWins) ? parsed.quickWins : [])
        .map((win) => text(win, 160))
        .filter(Boolean)
        .slice(0, 4)
    };

    if (missing.length) {
      console.warn(`[Feedback] Model omitted sections: ${missing.join(", ")}`);
    }

    if (feedback.sections.length) {
      return {
        success: true,
        ...feedback,
        mode: detailed ? "detailed" : "quick",
        model: "openai/gpt-oss-120b",
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.warn("Structured feedback failed, falling back to plain tips:", error.message);
  }

  const fallback = detailed
    ? await generateOutfitTips({ outfitScore, detectedItems, weather, userProfile, occasion })
    : await generateQuickOutfitTips({ outfitScore, detectedItems, weather, userProfile, occasion });

  return {
    success: true,
    headline: "",
    sections: [],
    quickWins: [],
    paragraph: fallback.tips,
    mode: detailed ? "detailed" : "quick",
    model: fallback.model,
    timestamp: new Date().toISOString()
  };
};

/**
 * Generate detailed structured outfit analysis and improvement recommendations
 * @param {Object} params - Configuration object
 * @param {Object} params.outfitScore - Outfit score with breakdown
 * @param {Array} params.detectedItems - Array of detected clothing items
 * @param {Object} params.weather - Weather conditions
 * @param {Object} params.userProfile - User profile (optional fields)
 * @param {string} params.occasion - Occasion type
 * @returns {Promise<Object>} Detailed tips response with success, tips, model, detailed, timestamp
 * @throws {Error} If API call fails
 */
export const generateDetailedOutfitTips = async ({
  outfitScore,
  detectedItems,
  weather,
  userProfile,
  occasion
}) => {
  try {
    const itemsDescription = detectedItems
      .map(
        (item) =>
          `${item.type} (${item.color}, confidence: ${(item.confidence * 100).toFixed(0)}%)`
      )
      .join(", ");

    const genderInfo = userProfile?.gender || "not specified";
    const skinToneInfo = userProfile?.skinTone || "not specified";
    const heightInfo = userProfile?.heightCm || "not specified";
    const weightInfo = userProfile?.weightKg || "not specified";
    const ageInfo = userProfile?.age || "not specified";

    const prompt = `You are a professional fashion consultant. Provide a comprehensive structured analysis of this outfit.

OUTFIT ANALYSIS:
- Overall Score: ${outfitScore.score}/100
- Score Message: ${outfitScore.message}
- Detailed Breakdown:
  - Color Harmony: ${outfitScore.breakdown.colorHarmony || 0}/100
  - Weather Suitability: ${outfitScore.breakdown.weatherSuitability || 0}/100
  - Formality Match: ${outfitScore.breakdown.formalityMatch || 0}/100
  ${outfitScore.breakdown.scanBonus ? `- Scan Bonus: ${outfitScore.breakdown.scanBonus}` : ""}
  ${outfitScore.breakdown.skinToneFit ? `- Skin Tone Fit: ${outfitScore.breakdown.skinToneFit}/100` : ""}

DETECTED ITEMS: ${itemsDescription}

WEATHER CONDITIONS:
- Temperature: ${weather.temperature}°C
- Condition: ${weather.condition || "clear"}
- Time of Day: ${weather.isDay ? "Day" : "Night"}

USER PROFILE:
- Gender: ${genderInfo}
- Skin Tone: ${skinToneInfo}
- Height: ${heightInfo} cm
- Weight: ${weightInfo} kg
- Age: ${ageInfo} years

OCCASION: ${occasion}

Please provide a detailed analysis with the following sections:

1. STRENGTHS: What works well in this outfit? What are the positive aspects?
2. AREAS FOR IMPROVEMENT: What's not working well? What could be better?
3. SPECIFIC SUGGESTIONS: What specific changes should be made? What to add, remove, or replace?
4. STYLE TIPS: General fashion advice for this person and occasion.

Be professional, encouraging, and provide actionable advice.`;

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 800
    });

    const tips = response.choices[0]?.message?.content || "";

    return {
      success: true,
      tips,
      model: "openai/gpt-oss-120b",
      detailed: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error generating detailed outfit tips:", error.message);
    throw new Error(`Failed to generate detailed outfit tips: ${error.message}`);
  }
};
