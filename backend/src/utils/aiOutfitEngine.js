import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
3. Keep it realistic for India
4. Keep it concise

Return STRICT JSON:
{
  "outfits": ["...", "..."],
  "reason": "...",
  "source": "wardrobe | ai_generated"
}
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const text = response.choices[0].message.content;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("AI response parsing failed");
  }
};