import { GoogleGenerativeAI } from "@google/generative-ai";
import { tools, toolExecutors } from "../tools/tools.js";
import asyncHandeler from "../utils/asyncHandler.js";
import { api_error } from "../utils/errorHandler.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3.1-flash-lite",
  systemInstruction: `You are StyleSense, a friendly, expert, and highly fashionable AI personal stylist.
You help users with outfit suggestions, wardrobe management, color matching, occasion-based styling, shopping advice, and style progress tracking.

You have access to these tools:
- get_daily_recommendation → Get today's best outfit suggestion
- get_wardrobe → Show what clothes the user owns
- get_progress → Show style level, points, streak and motivational message
- scan_outfit → Queue an outfit scan for AI analysis
- get_shopping_suggestions → Suggest what items the user should buy to improve their wardrobe
- get_occasion_suggestion → Give outfit ideas for a specific occasion (office, party, gym, date, etc.)

Rules:
- Be warm, positive, practical and stylish.
- Use tools when you need accurate data from the user's profile or wardrobe.
- If the user mentions "today", "now", "daily" or "weather" → strongly consider get_daily_recommendation.
- If the user asks about their clothes or "what do I have" → use get_wardrobe.
- If the user asks about progress or "how am I doing" → use get_progress.
- If the user wants shopping advice or "what should I buy" → use get_shopping_suggestions.
- If the user mentions an occasion (office, party, gym, interview, date) → use get_occasion_suggestion.
- You can call multiple tools if needed.

Always respond in a natural, conversational way after using tools.`
});

export const agenticChat = asyncHandeler(async(req,res,next) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      throw new api_error(400,"userId and message are required")
    }

    const chat = model.startChat({ history: [] });

    const prompt = `
    User: "${message}"

    Analyze the message and decide which tool(s) to use. Respond with valid JSON only:

    {
      "needsTool": true/false,
      "tools": ["tool_name1", "tool_name2"] or [],
      "reasoning": "brief explanation why you chose these tools",
      "directResponse": "your stylish reply if no tool is needed"
    }
    `;

    const result = await chat.sendMessage(prompt);
    let decision;

    try {
      decision = JSON.parse(result.response.text());
    } catch (e) {
      decision = { 
        needsTool: false, 
        directResponse: "Hi! I'm StyleSense, your AI stylist. How can I help with your outfit today?" 
      };
    }

    let finalReply = decision.directResponse || "";

    if (decision.needsTool && decision.tools && decision.tools.length > 0) {
      const toolResults = [];

      for (const toolName of decision.tools) {
        if (toolExecutors[toolName]) {
          try {
            const result = await toolExecutors[toolName]({ userId });
            toolResults.push({ tool: toolName, result });
          } catch (err) {
            toolResults.push({ tool: toolName, error: "Tool failed" });
          }
        }
      }

      const secondPrompt = `
      User message: "${message}"

      You previously decided to use tools for this request.

      Tool results:
      ${JSON.stringify(toolResults, null, 2)}

      Now generate a final, natural, stylish response for the user.
      - Do NOT mention tools
      - Do NOT show raw JSON
      - Just give a clean, helpful answer
      `;

      const finalResult = await chat.sendMessage(secondPrompt);

      const finalReply = finalResult.response.text();
    }

    res.status(200).json({
      userId,
      reply: finalReply.trim(),
      toolsUsed: decision.tools || [],
      reasoning: decision.reasoning
    });

  } catch (error) {
    console.error("Agentic chat error:", error);
    res.status(500).json({ error: "Sorry, I couldn't process that request right now." });
  }
})