import { fetchProducts } from '../configs/serp.js';
import Groq from "groq-sdk";

/* Built on first use, not at import: this module is loaded while the server
   boots, which is before dotenv has put the key into process.env. */
let groqClient = null;
const getGroq = () => {
  if (!groqClient) groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groqClient;
};

export const MAX_SHOPPING_SUGGESTIONS = 3;

/* "prefer_not_to_say" is an answer to our form, not a word to search for, so it
   is dropped from the query instead of being sent to Google Shopping. The
   buy-intent words matter too: the product carousel only comes back for them. */
const buildSearchQuery = (item, profile) => {
  const gender = profile?.gender && profile.gender !== "prefer_not_to_say"
    ? profile.gender
    : "";

  return [item, gender, "buy online India price"].filter(Boolean).join(" ");
};

const asSuggestionList = (parsed) => {
  const list = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];

  return list
    .filter((entry) => entry && typeof entry.item === "string" && entry.item.trim())
    .slice(0, MAX_SHOPPING_SUGGESTIONS)
    .map((entry) => ({
      item: entry.item.trim(),
      reason: String(entry.reason ?? "").trim()
    }));
};

/**
 * What to buy next: the model picks pieces the wardrobe is missing, and each
 * one is turned into a real product search. Ideas are a nice-to-have, so both
 * the model and the search degrade to "nothing found" instead of throwing —
 * this runs behind a button the user just pressed, not a background job.
 */
export const generateShoppingSuggestions = async ({ profile, wardrobeItems = [] } = {}) => {
  if (!profile) return { suggestions: [] };

  const aiPrompt = `
You are a fashion stylist AI. Based on the user's profile and wardrobe items, suggest ${MAX_SHOPPING_SUGGESTIONS} shopping items that complement their style.
User Profile:
- Gender: ${profile.gender}
- Skin tone: ${profile.skinTone}
- Height: ${profile.heightCm} cm
- Weight: ${profile.weightKg} kg
- Age: ${profile.age}

Wardrobe Items:
${wardrobeItems.map(item => `- ${item.name} (${item.color}, ${item.category})`).join("\n")}

TASK:
1. Suggest ${MAX_SHOPPING_SUGGESTIONS} shopping items that complement the user's style but are missing from the wardrobe.
2. For each item, provide a brief reason for the suggestion.
3. Keep it realistic for India.
4. Return STRICT JSON:
{
  "suggestions": [
    {"item": "...", "reason": "..."}
  ]
}
`;

  let parsed;
  try {
    const response = await getGroq().chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: aiPrompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    parsed = JSON.parse(response.choices[0]?.message?.content ?? "{}");
  } catch (error) {
    console.warn("Shopping suggestion AI failed:", error?.message || error);
    return { suggestions: [] };
  }

  const ideas = asSuggestionList(parsed);
  if (!ideas.length) return { suggestions: [] };

  /* One search per idea, in parallel — each `fetchProducts` already swallows
     its own failure and answers with an empty list. */
  const productLists = await Promise.all(
    ideas.map((idea) => fetchProducts(buildSearchQuery(idea.item, profile)))
  );

  return {
    suggestions: ideas.map((idea, index) => ({ ...idea, products: productLists[index] })),
  };
};
