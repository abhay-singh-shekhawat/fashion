import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    const tips = response.choices[0]?.message?.content || "";

    return {
      success: true,
      tips,
      model: "gpt-4o-mini",
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

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 150
    });

    const tips = response.choices[0]?.message?.content || "";

    return {
      success: true,
      tips,
      model: "gpt-4o-mini",
      quick: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error generating quick outfit tips:", error.message);
    throw new Error(`Failed to generate quick outfit tips: ${error.message}`);
  }
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

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 800
    });

    const tips = response.choices[0]?.message?.content || "";

    return {
      success: true,
      tips,
      model: "gpt-4o-mini",
      detailed: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error generating detailed outfit tips:", error.message);
    throw new Error(`Failed to generate detailed outfit tips: ${error.message}`);
  }
};
