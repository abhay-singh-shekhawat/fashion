import { GoogleGenerativeAI } from "@google/generative-ai";
import { tools, toolExecutors } from "../tools/tools.js";
import asyncHandeler from "../utils/asyncHandler.js";
import { api_error } from "../utils/errorHandler.js";
import BodyProfile from "../models/profile.model.js";
import {
  emitChatStart,
  emitChatResponseChunk,
  emitChatResponseComplete,
  emitChatError,
  emitChatTyping,
} from "../services/socketService.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Timeout configuration (in ms)
const CHAT_TOTAL_TIMEOUT_MS = 25000;       // hard cap for the whole chat request
const MODEL_CALL_TIMEOUT_MS = 15000;       // per Gemini call
const TOOL_CALL_TIMEOUT_MS = 10000;         // per tool executor call

// Helper: race a promise against a timeout. Resolves with the original result or rejects with a Timeout error.
const withTimeout = (promise, ms, label) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`${label} timed out after ${ms}ms`);
      err.status = 504;
      err.code = 'TIMEOUT';
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const model = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
  tools: [{ functionDeclarations: Object.values(tools).map(({ name, description, parameters }) => ({ name, description, parameters })) }],
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

Tool error handling:
- Tools may return a structured error object with fields: { error: true, status, message, userGuidance }.
- If a tool returns status 404, the user has not completed a required setup step (e.g. body profile, wardrobe items). Read the message and tell the user clearly what they need to do (e.g. "Please create your body profile first so I can give personalized recommendations.").
- If a tool returns any other error, apologize briefly and ask the user to try again.
- Do NOT invent data when a tool fails. Always rely on the tool's message.

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
      throw new api_error(400, "userId and message are required")
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

      // Add current message to history store (store compact object with timestamp)
      historyMsgs.push({ role: 'user', content: message, ts: Date.now() });
      // Trim history to configured max
      if (historyMsgs.length > HISTORY_MAX_MESSAGES) {
        meta.messages = historyMsgs.slice(-HISTORY_MAX_MESSAGES);
      }
      conversationHistory.set(userId, meta);

      const startTime = Date.now();

      // Build the conversation contents array for generateContent.
      // The newer Gemini API expects function responses to use role 'user'
      // (not 'function'), so we manage the conversation manually.
      const contents = [];

      // Add history (user/model turns) - exclude the just-pushed current message
      for (const m of (Array.isArray(historyMsgs) ? historyMsgs.slice(0, -1) : [])) {
        if (m.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: String(m.content || '') }] });
        } else if (m.role === 'assistant') {
          contents.push({ role: 'model', parts: [{ text: String(m.content || '') }] });
        }
      }

      // Add current user message (with optional image)
      const userParts = [{ text: message }];
      if (imageUrl) {
        const m = /^data:([^;]+);base64,(.*)$/.exec(imageUrl);
        if (m) {
          userParts.push({ inlineData: { mimeType: m[1], data: m[2] } });
        }
      }
      contents.push({ role: 'user', parts: userParts });

      // Early profile check: if the request likely needs a profile and none exists, short‑circuit.
      const lowerMsg = message?.toLowerCase() || "";
      const likelyNeedsProfile = lowerMsg.includes("today") || lowerMsg.includes("now") ||
                                lowerMsg.includes("daily") || lowerMsg.includes("weather");
      let shortCircuit = null;

      if (likelyNeedsProfile) {
        try {
          const profile = await BodyProfile.findOne({ user: userId });
          if (!profile) {
            shortCircuit = {
              message: "Please create your body profile first so I can give personalized recommendations.",
              reason: "missing_profile"
            };
          }
        } catch (e) {
          console.error("[Chat] Profile check failed:", e?.message || e);
        }
      }

      let finalReply = "";
      let chunkIndex = 0;
      let result;

      // Loop: call model, handle function calls, repeat
      const MAX_TOOL_ITERATIONS = 6;
      if (!shortCircuit) {
        for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
        // Hard cap on the whole chat request
        if (Date.now() - startTime > CHAT_TOTAL_TIMEOUT_MS) {
          console.warn(`[Chat] Total timeout exceeded for user ${userId}`);
          shortCircuit = {
            message: "I'm taking a bit too long to respond. Please try again in a moment.",
            reason: 'total_timeout'
          };
          break;
        }

        try {
          result = await withTimeout(
            model.generateContent({ contents }),
            MODEL_CALL_TIMEOUT_MS,
            'Gemini model call'
          );
        } catch (modelErr) {
          console.error(`[Chat] Model call failed:`, modelErr?.message || modelErr);
          shortCircuit = {
            message: modelErr?.code === 'TIMEOUT'
              ? "The AI service is taking too long. Please try again."
              : "I'm having trouble reaching my AI brain right now. Please try again shortly.",
            reason: 'model_error'
          };
          break;
        }

        const parts = result.response?.candidates?.[0]?.content?.parts || [];
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
            parsedArgs = { raw: parsedArgs };
          }
        }

        let toolResult;
        const executor = toolExecutors[name];
        if (!executor) {
          console.warn(`[Chat] Requested unknown tool: ${name}`);
          toolResult = { error: true, status: 400, message: `Unknown tool: ${name}`, tool: name };
        } else {
          try {
            const execPromise = (parsedArgs && (parsedArgs.imageUrl || imageUrl))
              ? executor({ userId, imageUrl: parsedArgs.imageUrl || imageUrl, ...parsedArgs })
              : executor({ userId, ...(parsedArgs || {}) });
            toolResult = await withTimeout(execPromise, TOOL_CALL_TIMEOUT_MS, `Tool ${name}`);
          } catch (toolErr) {
            console.error(`[Chat] Tool ${name} execution failed:`, toolErr?.message || toolErr);
            toolResult = {
              error: true,
              status: toolErr?.status || 500,
              message: toolErr?.message || String(toolErr),
              tool: name
            };
          }
        }

        // Detect structured errors from tools. If a tool reports a 404 (missing profile/wardrobe)
        // or a 504 (timeout), short-circuit with a clear, user-facing message instead of looping
        // back to the model with a generic apology.
        if (toolResult && typeof toolResult === 'object' && toolResult.error === true) {
          if (toolResult.status === 404) {
            console.log(`[Chat] Tool ${name} reported 404:`, toolResult.message);
            shortCircuit = {
              message: toolResult.message || 'A required setup step is missing.',
              reason: 'missing_setup',
              tool: name
            };
            break;
          }
          if (toolResult.status === 504) {
            console.log(`[Chat] Tool ${name} timed out:`, toolResult.message);
            shortCircuit = {
              message: "I'm having trouble reaching one of my services right now. Please try again in a moment.",
              reason: 'tool_timeout',
              tool: name
            };
            break;
          }
          // For other errors, still let the model see the structured error so it can apologize.
        }

        // Append the model's function-call turn (preserving thoughtSignature if present)
        // and the function response (role 'user').
        // The newer Gemini API requires thought_signature to be echoed back.
        const modelParts = parts.map((p) => ({ ...p }));
        contents.push({ role: 'model', parts: modelParts });
        contents.push({
          role: 'user',
          parts: [{ functionResponse: { name, response: typeof toolResult === "object" && toolResult ? toolResult : { result: String(toolResult) } } }],
        });
      }

      // If we short-circuited (timeout, model error, or missing setup), build a friendly reply.
      if (shortCircuit) {
        finalReply = shortCircuit.message;
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
        model: "gemini-flash-latest",
        duration: Date.now() - startTime
      });

      res.status(200).json({
        userId,
        reply: parsedReply,
        success: true
      });
    }
  } catch (error) {
      console.error("[Chat] Error:", error?.message || error);
      try { await emitChatError(req.body?.userId || req.body?.userId, error?.message || error); } catch(e){}
      throw error;
    }

})