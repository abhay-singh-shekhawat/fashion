import { GoogleGenerativeAI } from "@google/generative-ai";
import { tools, toolExecutors } from "../tools/tools.js";
import asyncHandeler from "../utils/asyncHandler.js";
import { api_error } from "../utils/errorHandler.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3.1-flash-lite",
  tools: tools,
  systemInstruction: `You are StyleSense, a friendly, expert, and highly fashionable AI personal stylist.
You help users with outfit suggestions, wardrobe management, color matching, occasion-based styling, shopping advice, and style progress tracking.

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

let conversationHistory = new Map();

export const agenticChat = asyncHandeler(async(req,res,next) => {
    const { userId, message } = req.body;
    const mimetype = req.file?.mimetype;
    const buffer = req.file?.buffer.toString('base64');
    const imageUrl = buffer ? `data:${mimetype};base64,${buffer}` : null;

    if (!userId || !message) {
      throw new api_error(400,"userId and message are required")
    }

    if (!conversationHistory.has(userId)) {
      conversationHistory.set(userId, []);
    }
    const history = conversationHistory.get(userId);

    const chat = model.startChat({
      history: history.slice(-10), // keep last 10 messages for context
      generationConfig: { temperature: 0.75 }
    });

    // Add current message to history
    history.push({ role: "user", content: message });

    let result = await chat.sendMessage(message);

    let finalReply = "";
    
    while(true){
      const parts = result.response.candidates[0].content.parts;

      const functionCall = parts.find(f => f.functionCall)?.functionCall

      if (!functionCall) {
        finalReply = result.response.text();
        break;
      }

      const { name, args } = functionCall;

      let toolResult;
      if(args.imageUrl){
        toolResult = await toolExecutors[name]({ userId, imageUrl })
      } else{
        toolResult = await toolExecutors[name]({ userId, ...args })
      }
      result = await chat.sendMessage([
        {
          functionResponse: {
            name,
            response: toolResult
          }
        }
      ]);
    }

    // Parse finalReply as JSON
    let parsedReply;
    try {
      parsedReply = JSON.parse(finalReply);
    } catch (parseError) {
      // If not JSON, wrap it as object
      parsedReply = { message: finalReply.trim() };
    }

    history.push({ role: "assistant", content: finalReply });

    res.status(200).json({
      userId,
      reply: parsedReply,
      success: true
    });

})