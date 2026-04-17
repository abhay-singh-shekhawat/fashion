import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const getColorCompatibility = async (color1, color2) => {
  try {
    if (!color1 || !color2) {
        return { score: 50, message: "Unknown colors" };
    }

    color1 = color1.toLowerCase().trim();
    color2 = color2.toLowerCase().trim();

    if (color1 === color2) {
        return {
            score: 85,
            message: "Monochrome / same color — safe and elegant",
        };
    }

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini", // fast + cheap + good
      messages: [
        {
            role: "system",
            content: "You are a fashion color expert.",
        },
        {
            role: "user",
            content: `
            Evaluate compatibility between:
            - ${color1}
            - ${color2}

            Return JSON:
            {
              "score": number (0-100),
              "message": "short stylish explanation"
            }
                      `,
        },
      ],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(response.choices[0].message.content);

    return {
        score: Math.max(0, Math.min(100, data.score || 60)),
        message: data.message || "Neutral combination",
    };

  } catch (error) {
    console.log("OpenAI error:", error);

    return {
        score: 60,
        message: "Neutral combination — can work depending on shades",
    };
  }
};