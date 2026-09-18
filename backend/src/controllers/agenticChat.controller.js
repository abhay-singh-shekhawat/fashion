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
const CHAT_TOTAL_TIMEOUT_MS = 45000;       // hard cap for the whole chat request
const MODEL_CALL_TIMEOUT_MS = 20000;       // per Gemini call, clamped to what is left
const TOOL_CALL_TIMEOUT_MS = 12000;        // per tool executor call, clamped too
const MIN_STEP_BUDGET_MS = 2000;           // below this a call cannot finish, so it is not started

const timeoutError = (label, ms) => {
  const err = new Error(`${label} timed out after ${ms}ms`);
  err.status = 504;
  err.code = 'TIMEOUT';
  return err;
};

// Helper: race a promise against a timeout. Resolves with the original result or rejects with a Timeout error.
const withTimeout = (promise, ms, label) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(timeoutError(label, ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const buildModel = (alias) => genAI.getGenerativeModel({
  model: alias,
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

/* Free-tier keys are capped per model (~20 requests/day), so the alias that just
   refused us is usually the only one out of budget while the next still has room. */
const MODEL_CHAIN = ["gemini-flash-latest", "gemini-flash-lite-latest"];

/* Built on first use, so the fallback carries exactly the same tools and persona
   as the primary and an alias nobody needs is never constructed. */
const modelCache = new Map();
const modelFor = (alias) => {
  if (!modelCache.has(alias)) modelCache.set(alias, buildModel(alias));
  return modelCache.get(alias);
};

/* Every refused call carries the parsed response body, which is where the quota
   verdict lives. A per-day cap never clears inside one request, so waiting it out
   would only stall the reply — the next alias is the only useful move. */
const isDailyQuotaError = (error) =>
  Boolean(
    error?.errorDetails?.some((detail) =>
      (detail?.violations ?? []).some((violation) =>
        /PerDay/i.test(violation?.quotaId ?? violation?.quotaMetric ?? "")
      )
    )
  );

/**
 * Ask each alias until one answers, and report which one did — the completion
 * event used to credit the primary model no matter who actually replied.
 *
 * Each attempt is clamped to what is left of the request budget: a slow first
 * alias cannot push the reply past the total cap, and the next alias is not
 * started once there is no time left for it to answer.
 */
const generateWithFallback = async (contents, remaining) => {
  let lastError;

  for (const alias of MODEL_CHAIN) {
    const budget = Math.min(MODEL_CALL_TIMEOUT_MS, remaining());
    if (budget < MIN_STEP_BUDGET_MS) break;

    try {
      const result = await withTimeout(
        modelFor(alias).generateContent({ contents }),
        budget,
        'Gemini model call'
      );
      return { result, model: alias };
    } catch (error) {
      lastError = error;
      console.warn(
        `[Gemini] ${alias} failed${isDailyQuotaError(error) ? ' (daily quota)' : ''}: ${error?.message || error}`
      );
    }
  }

  throw lastError ?? timeoutError('Gemini model call', CHAT_TOTAL_TIMEOUT_MS);
};

/**
 * Gemini's FunctionResponse.response must be a Struct, i.e. an object. A tool
 * that hands back a bare array — shopping suggestions come back as a list —
 * serialises as a JSON array and the follow-up turn is rejected with "Proto
 * field is not repeating, cannot start list", which kills the whole reply.
 * Anything that isn't a plain object gets wrapped, so a list survives as the
 * value inside the wrapper.
 */
const asFunctionResponse = (result) => {
  if (result && typeof result === 'object' && !Array.isArray(result)) return result;
  return { result: result ?? null };
};

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

export const agenticChat = asyncHandeler(async(req,res,next) => {
    /* Identity comes from the verified token (authMiddleware), never from the
       body: the app posts multipart/form-data with only `message` (+ `image`),
       so a body-based userId made every stylist message a 400. */
    const userId = req.user?.id;
    const { message } = req.body;
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
      /* One deadline for the whole reply: the model calls, the tool calls and
         the reply streaming all draw from the same budget, so a slow turn can
         eat the time without a later step running past the cap. */
      const deadline = startTime + CHAT_TOTAL_TIMEOUT_MS;
      const remaining = () => deadline - Date.now();

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
      let answeredModel = null;

      /* Loop: call model, handle function calls, repeat. This used to be wrapped
         in `if (!shortCircuit)`, which put the reply — and the res.json() below —
         inside the same block: a message that short-circuited before the loop
         (missing profile) never got a response at all. Guarding the loop lets
         every path fall through to the reply. */
      const MAX_TOOL_ITERATIONS = 6;
      for (let iter = 0; !shortCircuit && iter < MAX_TOOL_ITERATIONS; iter++) {
        // Hard cap on the whole chat request
        if (remaining() < MIN_STEP_BUDGET_MS) {
          console.warn(`[Chat] Total timeout exceeded for user ${userId}`);
          shortCircuit = {
            message: "I'm taking a bit too long to respond. Please try again in a moment.",
            reason: 'total_timeout'
          };
          break;
        }

        try {
          const answered = await generateWithFallback(contents, remaining);
          result = answered.result;
          answeredModel = answered.model;
        } catch (modelErr) {
          console.error(`[Chat] Model call failed:`, modelErr?.message || modelErr);
          /* An exhausted daily quota is the one failure the user cannot retry
             their way out of, so it gets its own honest message. */
          const quotaExhausted = isDailyQuotaError(modelErr);
          shortCircuit = {
            message: quotaExhausted
              ? "I've used up today's AI request quota. It resets when the day rolls over — try me again then."
              : modelErr?.code === 'TIMEOUT'
                ? "The AI service is taking too long. Please try again."
                : "I'm having trouble reaching my AI brain right now. Please try again shortly.",
            reason: quotaExhausted ? 'quota_exceeded' : 'model_error'
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
          /* The typing delay is simulated, so it is paced against whatever is
             left of the budget instead of a flat 30ms per word — a long answer
             used to spend seconds past the total cap on its own. */
          const wordDelay = Math.min(30, Math.max(0, Math.floor(remaining() / Math.max(words.length, 1))));
          for (const word of words) {
            await emitChatResponseChunk(userId, word + ' ', chunkIndex);
            chunkIndex++;
            if (wordDelay) await new Promise(resolve => setTimeout(resolve, wordDelay));
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
        } else if (remaining() < MIN_STEP_BUDGET_MS) {
          /* Starting a tool this late only guarantees a timeout it can never
             recover from, so the request ends here with an honest message. */
          console.warn(`[Chat] Total timeout reached before tool ${name} for user ${userId}`);
          shortCircuit = {
            message: "I'm taking a bit too long to respond. Please try again in a moment.",
            reason: 'total_timeout'
          };
          break;
        } else {
          try {
            const execPromise = (parsedArgs && (parsedArgs.imageUrl || imageUrl))
              ? executor({ userId, imageUrl: parsedArgs.imageUrl || imageUrl, ...parsedArgs })
              : executor({ userId, ...(parsedArgs || {}) });
            toolResult = await withTimeout(
              execPromise,
              Math.min(TOOL_CALL_TIMEOUT_MS, remaining()),
              `Tool ${name}`
            );
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
          parts: [{ functionResponse: { name, response: asFunctionResponse(toolResult) } }],
        });
      }

      // If we short-circuited (timeout, model error, or missing setup), build a friendly reply.
      if (shortCircuit) {
        finalReply = shortCircuit.message;
      }

      /* Every tool-loop exit that produced no prose — the iteration cap, say —
         would otherwise answer with an empty bubble. */
      if (!String(finalReply).trim()) {
        finalReply = "I couldn't put an answer together just now — could you rephrase that?";
      }

      /* The stylist is prompted for a conversational reply, so it is returned
         as prose. Sniffing the text for JSON only ever mangled answers that
         happened to contain braces. */
      const parsedReply = { message: String(finalReply).trim() };

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
        model: answeredModel ?? MODEL_CHAIN[0],
        duration: Date.now() - startTime
      });

      res.status(200).json({
        userId,
        reply: parsedReply,
        success: true
      });
    } catch (error) {
      console.error("[Chat] Error:", error?.message || error);
      try { await emitChatError(userId, error?.message || error); } catch(e){}
      throw error;
    }

})