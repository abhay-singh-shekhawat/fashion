import { GoogleGenerativeAI } from "@google/generative-ai";
import { tools, toolExecutors } from "../tools/tools.js";
import asyncHandeler from "../utils/asyncHandler.js";
import { api_error } from "../utils/errorHandler.js";
import {
  emitChatStart,
  emitChatResponseChunk,
  emitChatResponseComplete,
  emitChatError,
  emitChatTyping,
} from "../services/socketService.js";

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

// Conversation history store. We keep a bounded message list per user and timestamps to enable TTL cleanup.
const conversationHistory = new Map();
const HISTORY_MAX_MESSAGES = 50;        // max messages to keep per user
const HISTORY_MODEL_WINDOW = 10;        // messages to pass to model for context
const HISTORY_TTL_MS = 1000 * 60 * 60;  // 1 hour TTL for inactive conversations
const CLEANUP_INTERVAL_MS = 1000 * 60 * 10; // cleanup every 10 minutes

// Periodic cleanup to prevent memory leak
setInterval(() => {
  try {
    const now = Date.now();
    for (const [userId, meta] of conversationHistory.entries()) {
      // remove whole conversation if last access is older than TTL
      if (meta.lastAccess && (now - meta.lastAccess) > HISTORY_TTL_MS) {
        conversationHistory.delete(userId);
        continue;
      }
      // otherwise trim message list to max allowed
      if (Array.isArray(meta.messages) && meta.messages.length > HISTORY_MAX_MESSAGES) {
        meta.messages = meta.messages.slice(-HISTORY_MAX_MESSAGES);
        meta.lastAccess = now;
        conversationHistory.set(userId, meta);
      }
    }
  } catch (e) {
    console.error('[Chat] conversationHistory cleanup error', e?.message || e);
  }
}, CLEANUP_INTERVAL_MS);

// Helper: ensure we have a conversation record for user
const ensureConversation = (userId) => {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, { messages: [], lastAccess: Date.now() });
  }
  const meta = conversationHistory.get(userId);
  meta.lastAccess = Date.now();
  return meta;
};

// Robust JSON extraction from a text block. Tries code fences first, then balanced-brace scanning.
const extractJsonFromText = (text) => {
  if (!text || typeof text !== 'string') return null;

  // 1) Try to extract JSON from ```json or ``` fenced code blocks
  try {
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/i;
    const cb = codeBlockRegex.exec(text);
    if (cb && cb[1]) {
      const candidate = cb[1].trim();
      try { return JSON.parse(candidate); } catch (e) { /* continue */ }
    }
  } catch (e) {
    // ignore
  }

  // 2) Try to find first balanced JSON object or array in the text
  const startIdx = text.search(/[\{\[]/);
  if (startIdx === -1) return null;
  const startChar = text[startIdx];
  const endChar = startChar === '{' ? '}' : ']';

  let depth = 0;
  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (ch === startChar) depth++;
    else if (ch === endChar) depth--;

    if (depth === 0) {
      const substr = text.slice(startIdx, i + 1);
      try {
        return JSON.parse(substr);
      } catch (e) {
        // if parse fails, continue scanning in case there are later JSON blobs
        continue;
      }
    }
  }

  return null;
};

export const agenticChat = asyncHandeler(async(req,res,next) => {
    const { userId, message } = req.body;
    const mimetype = req.file?.mimetype;
    const buffer = req.file?.buffer?.toString('base64');
    const imageUrl = buffer ? `data:${mimetype};base64,${buffer}` : null;

    if (!userId || !message) {
      throw new api_error(400,"userId and message are required")
    }

    try {
      // Emit chat start
      await emitChatStart(userId, message);
      await emitChatTyping(userId, true);

      // Ensure conversation meta exists and get messages array
      const meta = ensureConversation(userId);
      const historyMsgs = meta.messages;

      // Build model-compatible history from stored messages (convert to Gemini expected shape)
      const modelHistory = (Array.isArray(historyMsgs) ? historyMsgs.slice(-HISTORY_MODEL_WINDOW) : []).map(m => ({
        author: m.role === 'user' ? 'user' : 'assistant',
        content: [{ type: 'text', text: String(m.content || '') }]
      }));

      const chat = model.startChat({
        history: modelHistory,
        generationConfig: { temperature: 0.75 }
      });

      // Add current message to history store (store compact object with timestamp)
      historyMsgs.push({ role: 'user', content: message, ts: Date.now() });
      // Trim history to configured max
      if (historyMsgs.length > HISTORY_MAX_MESSAGES) {
        meta.messages = historyMsgs.slice(-HISTORY_MAX_MESSAGES);
      }
      conversationHistory.set(userId, meta);

      const startTime = Date.now();
      let result = await chat.sendMessage(message);

      let finalReply = "";
      let chunkIndex = 0;
      
      while(true){
        const parts = result.response?.candidates?.[0]?.content?.parts || [];

        // Find functionCall in parts if any
        const functionPart = parts.find(p => p.functionCall);
        const functionCall = functionPart?.functionCall;

        if (!functionCall) {
          finalReply = result.response?.text?.() || result.response?.candidates?.[0]?.content?.text || '';

          // Emit response chunks - stream words safely
          const words = typeof finalReply === 'string' ? finalReply.split(' ') : [];
          for (const word of words) {
            await emitChatResponseChunk(userId, word + ' ', chunkIndex);
            chunkIndex++;
            // Simulate streaming delay
            await new Promise(resolve => setTimeout(resolve, 30));
          }
          
          break;
        }

        const { name, args } = functionCall;

        // functionCall.args can be a JSON string or an object - normalize it
        let parsedArgs = args;
        if (typeof parsedArgs === 'string') {
          try {
            parsedArgs = JSON.parse(parsedArgs);
          } catch (e) {
            // leave as string if not JSON
            parsedArgs = { raw: parsedArgs };
          }
        }

        let toolResult;
        // Ensure tool executor exists before calling
        const executor = toolExecutors[name];
        if (!executor) {
          console.warn(`[Chat] Requested unknown tool: ${name}`);
          toolResult = { error: `Unknown tool: ${name}`, tool: name };
        } else {
          try {
            // if imageUrl provided in parsed args or from uploaded image, prefer that
            if (parsedArgs && (parsedArgs.imageUrl || imageUrl)) {
              const iu = parsedArgs.imageUrl || imageUrl;
              toolResult = await executor({ userId, imageUrl: iu, ...parsedArgs });
            } else {
              toolResult = await executor({ userId, ...(parsedArgs || {}) });
            }
          } catch (toolErr) {
            console.error(`[Chat] Tool ${name} execution failed:`, toolErr?.message || toolErr);
            // return safe error payload to the model instead of throwing
            toolResult = { error: `Tool ${name} failed`, message: toolErr?.message || String(toolErr) };
          }
        }

        // Send function response back into the chat
        result = await chat.sendMessage([
          {
            functionResponse: {
              name,
              response: toolResult
            }
          }
        ]);
      }

      // Robust parsing of finalReply: try to extract JSON, else wrap as message
      let parsedReply;
      const extracted = extractJsonFromText(finalReply);
      if (extracted !== null) {
        parsedReply = extracted;
      } else {
        // Fallback: return as { message: text }
        parsedReply = { message: String(finalReply).trim() };
      }

      // Store assistant reply in conversation history
      meta.messages.push({ role: 'assistant', content: finalReply, ts: Date.now() });
      if (meta.messages.length > HISTORY_MAX_MESSAGES) {
        meta.messages = meta.messages.slice(-HISTORY_MAX_MESSAGES);
      }
      meta.lastAccess = Date.now();
      conversationHistory.set(userId, meta);

      // Emit typing stop and completion
      await emitChatTyping(userId, false);
      await emitChatResponseComplete(userId, finalReply, {
        model: "gemini-3.1-flash-lite",
        duration: Date.now() - startTime
      });

      res.status(200).json({
        userId,
        reply: parsedReply,
        success: true
      });
    } catch (error) {
      console.error("[Chat] Error:", error?.message || error);
      try { await emitChatError(req.body?.userId || req.body?.userId, error?.message || error); } catch(e){}
      throw error;
    }

})