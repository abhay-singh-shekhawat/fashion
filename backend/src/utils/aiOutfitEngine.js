import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateAIOutfit = async ({ profile, weather, wardrobe, occasion }) => {
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

Wardrobe:
${wardrobe.map(item => `- ${item.name} (${item.color}, ${item.category})`).join("\n")}

Occasion: ${occasion}

TASK:
1. Suggest 2 outfits
2. Prefer wardrobe items if available
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