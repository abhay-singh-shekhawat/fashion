import { fetchProducts } from '../configs/serp.js'; 
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Build smarter search queries
const buildSearchQuery = (suggestion, profile) => {
  const gender = profile.gender || "men";
  gender === `prefer_not_to_say` ? gender : gender = "";
  const region = "India fashion";

  return `${suggestion.item} for ${gender} ${region}`;
};

export const generateShoppingSuggestions = async (profile, wardrobeItems = []) => {
  const aiPrompt = `
You are a fashion stylist AI. Based on the user's profile and wardrobe items, suggest 3 shopping items that complement their style. 
User Profile:
- Gender: ${profile.gender}
- Skin tone: ${profile.skinTone}
- Height: ${profile.heightCm} cm
- Weight: ${profile.weightKg} kg
- Age: ${profile.age}

Wardrobe Items:
${wardrobeItems.map(item => `- ${item.name} (${item.color}, ${item.category})`).join("\n")}

TASK:
1. Suggest 3 shopping items that complement the user's style but not in the wardrobe.
2. For each item, provide a brief reason for the suggestion.
3. Keep it realistic for India.
4. Return STRICT JSON:
{
  "suggestions": [
    {"item": "...", "reason": "..."},
    {"item": "...", "reason": "..."},
    {"item": "...", "reason": "..."}
  ]
}
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: aiPrompt }],
    temperature: 0.7,
  });

  const text = response.choices[0].message.content;

  try {
    const suggestions = JSON.parse(text);
    const searchQuery = buildSearchQuery(suggestions.suggestions[0], profile);
    const products = await fetchProducts(searchQuery);
    return { suggestions, products };
  } catch {
    throw new Error("AI response parsing failed");
  }
};