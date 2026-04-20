import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const harmoniousPairs = {
  'red': ['black', 'white', 'gray', 'navy', 'gold'],
  'blue': ['white', 'gray', 'black', 'beige', 'brown', 'red'],
  'black': ['anything'],
  'white': ['anything'],
  'gray': ['black', 'white', 'blue', 'red', 'pink'],
  'navy': ['white', 'gray', 'red', 'pink'],
  'green': ['white', 'beige', 'brown', 'black', 'gray'],
  'pink': ['gray', 'white', 'navy', 'black', 'green'],
  'brown': ['beige', 'white', 'green', 'blue'],
  'beige': ['brown', 'white', 'black', 'navy'],
};

const clashingPairs = [
  ['red', 'pink'],
  ['green', 'red'],
  ['orange', 'pink'],
];

export const getColorCompatibility = async (color1, color2) => {
  if (!color1 || !color2) return { score: 50, message: 'Unknown colors' };
  color1 = color1.toLowerCase().trim();
  color2 = color2.toLowerCase().trim();

  // Basic rule-based fallback (fast path)
  if (color1 === color2) {
    return { score: 85, message: 'Monochrome / same color — safe and elegant' };
  }

  if (harmoniousPairs[color1]?.includes(color2) || 
      harmoniousPairs[color2]?.includes(color1) ||
      harmoniousPairs[color1]?.includes('anything') ||
      harmoniousPairs[color2]?.includes('anything')) {
    return { score: 80, message: 'Good match — harmonious' };
  }

  const pair = [color1, color2].sort().join('-');
  const clashPair = [color2, color1].sort().join('-');
  if (clashingPairs.some(p => 
    (p[0] === color1 && p[1] === color2) || 
    (p[0] === color2 && p[1] === color1)
  )) {
    return { score: 30, message: 'Potential clash — consider alternatives' };
  }

  // Default neutral from rules
  let baseResult = { score: 60, message: 'Neutral combination — can work depending on shades' };

  // AI Enhancement Layer (Gemini) for smarter, context-aware output
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a professional fashion color expert.
    Analyze the color combination: ${color1} and ${color2}.

    Return ONLY a valid JSON object with this exact structure:
    {
      "score": number between 0 and 100,
      "message": "short, stylish, and helpful explanation (max 15 words)",
      "suggestion": "optional one-line styling tip"
    }

    Base your analysis on real color theory, skin tone compatibility, and current fashion trends.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    let aiResult;
    try {
      aiResult = JSON.parse(text);
    } catch (parseError) {
      console.warn("Failed to parse Gemini JSON:", parseError.message);
      return baseResult;
    }

    // Merge AI intelligence with rule-based safety
    return {
      score: aiResult.score ?? baseResult.score,
      message: aiResult.message || baseResult.message,
      suggestion: aiResult.suggestion || ""
    };

  } catch (error) {
    console.warn("Gemini color analysis failed, falling back to rules:", error.message);
    return baseResult;
  }
};