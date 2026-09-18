import { z } from "zod";
import { generateStructured } from "./groqJson.js";

/* The shape used to be a JSON example in the prompt and a JSON.parse that threw
   "AI response parsing failed" at the caller — the schema now carries it. */
const OUTFIT_SCHEMA = z.object({
  outfits: z.array(z.string()),
  reason: z.string(),
  source: z.enum(["wardrobe", "ai_generated"])
});

export const generateAIOutfit = async ({ profile, weather, occasion }) => {
  const prompt = `
You are a fashion stylist AI.

User Profile:
- Gender: ${profile.gender}
- Skin tone: ${profile.skinTone}
- Height: ${profile.heightCm}
- Weight: ${profile.weightKg} kg
- Age: ${profile.age}

Weather:
- Temperature: ${weather.temperature}°C
- Condition: ${weather.condition || "normal"}
- Daytime: ${weather.isDay}

Occasion: ${occasion}

TASK:
1. Suggest 2 outfits for the user based on the above information. Each outfit should consist of 2-4 items.
2. Keep it realistic for India
3. Keep it concise
4. Explain the choice in "reason", and say in "source" whether the outfits come from the user's wardrobe or were generated
`;

  return generateStructured({
    name: "ai_outfit",
    schema: OUTFIT_SCHEMA,
    prompt,
    temperature: 0.7
  });
};
