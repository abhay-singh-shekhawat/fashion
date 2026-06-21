// Socket.IO Service Layer - Helper functions for controllers to emit events

import { SOCKET_EVENTS } from "../configs/socketEvents.js";
import { emitToUser, emitToAll, isUserOnline } from "../configs/socket.js";

// Helper: use a single timestamp format (ISO string) throughout this file
const nowIso = () => new Date().toISOString();

// Helper: ensure a value is an array - return empty array for null/undefined/non-array
const asArray = (v) => (Array.isArray(v) ? v : []);

// Helper: safely get a short id string for logs / payloads
const shortId = (id) => (typeof id === 'string' ? id.substring(0, 4) : 'unk');

// Safe wrapper for socket event emissions with error handling
const safeEmit = async (userId, eventName, data = {}) => {
  try {
    if (!isUserOnline(userId)) {
      console.warn(`[SocketService] User ${userId} is offline. Event: ${eventName}`);
      return false;
    }

    const enrichedData = {
      ...data,
      // standardized timestamp format (ISO string)
      timestamp: nowIso(),
    };

    const sent = emitToUser(userId, eventName, enrichedData);
    if (!sent) {
      console.error(`[SocketService] Failed to emit ${eventName} to ${userId}`);
      return false;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[SocketService] Event sent: ${eventName} → ${userId}`);
    }

    return true;
  } catch (error) {
    console.error(`[SocketService] Error emitting ${eventName}:`, error?.message || error);
    return false;
  }
};

/**
 * Emit when user starts chatting
 * 
 * WHEN: agenticChat.controller.js receives message
 * 
 * @param {string} userId - User sending message
 * @param {string} message - The message sent
 */
export const emitChatStart = async (userId, message) => {
  return await safeEmit(userId, SOCKET_EVENTS.CHAT.START, {
    message,
    // standardized timestamp instead of epoch number
    modelStartTime: nowIso(),
  });
};

/**
 * Emit when AI response chunk arrives
 * 
 * WHEN: agenticChat.controller.js generates response in chunks
 * WHY: Stream responses word-by-word (like ChatGPT)
 * 
 * EXAMPLE:
 * Chunk 1: "That's"
 * Chunk 2: " a great"
 * Chunk 3: " outfit!"
 * Client shows: "That's a great outfit!" (animated)
 * 
 * @param {string} userId - User to send to
 * @param {string} chunk - Text chunk from AI
 * @param {number} index - Which chunk number (0, 1, 2, ...)
 */
export const emitChatResponseChunk = async (userId, chunk, index) => {
  return await safeEmit(userId, SOCKET_EVENTS.CHAT.RESPONSE_CHUNK, {
    chunk,
    index,
    chunkLength: chunk ? chunk.length : 0,
  });
};

/**
 * Emit typing indicator for chat
 *
 * WHEN: user or agent is typing
 *
 * @param {string} userId
 * @param {boolean} isTyping
 */
export const emitChatTyping = async (userId, isTyping = true) => {
  // Use available event key or fallback to a safe string
  const eventKey = (SOCKET_EVENTS?.CHAT?.TYPING) || (SOCKET_EVENTS?.CHAT?.TYPING_START) || 'chat:typing';
  return await safeEmit(userId, eventKey, {
    isTyping: !!isTyping,
  });
};

/**
 * Emit when full chat response is complete
 * 
 * WHEN: agenticChat.controller.js finishes generating
 * 
 * @param {string} userId - User to send to
 * @param {string} fullMessage - Complete response text
 * @param {object} metadata - { model, tokensUsed, duration, etc }
 */
export const emitChatResponseComplete = async (userId, fullMessage, metadata = {}) => {
  return await safeEmit(userId, SOCKET_EVENTS.CHAT.RESPONSE_COMPLETE, {
    fullMessage,
    model: metadata.model || "gemini",
    tokensUsed: metadata.tokensUsed || 0,
    duration: metadata.duration || 0,
    ...metadata,
  });
};

/**
 * Emit chat error
 * 
 * WHEN: Chat generation fails
 * 
 * @param {string} userId - User to notify
 * @param {string} error - Error message
 */
export const emitChatError = async (userId, error) => {
  return await safeEmit(userId, SOCKET_EVENTS.CHAT.ERROR, {
    error: error?.message || error,
    code: error?.code || "CHAT_ERROR",
  });
};

/**
 * ============================================
 * OUTFIT SCANNING EVENTS
 * ============================================
 */

/**
 * Emit when scan starts
 * 
 * WHEN: scanner.controller.js receives image
 * 
 * @param {string} userId - User uploading image
 * @param {object} metadata - { imageSize, format, etc }
 */
export const emitScanStart = async (userId, metadata = {}) => {
  return await safeEmit(userId, SOCKET_EVENTS.SCAN.START, {
    ...metadata,
    // standardized ISO timestamp
    startTime: nowIso(),
  });
};

/**
 * Emit when scan job is queued
 * 
 * WHEN: Job added to Bull Queue
 * 
 * @param {string} userId - User's scan
 * @param {string} jobId - Queue job ID
 * @param {number} position - Position in queue (1, 2, 3...)
 */
export const emitScanQueued = async (userId, jobId, position = 1) => {
  return await safeEmit(userId, SOCKET_EVENTS.SCAN.QUEUED, {
    jobId,
    position,
    estimatedWait: position * 2, // ~2 seconds per job (kept as number)
  });
};

/**
 * Emit scan progress updates
 * 
 * WHEN: Worker processes scan (periodically)
 * WHY: User sees progress instead of blank loading screen
 * 
 * EXAMPLE:
 * 10% "Uploading image..."
 * 25% "Analyzing colors..."
 * 50% "Detecting patterns..."
 * 75% "Matching to wardrobe..."
 * 100% "Complete!"
 * 
 * @param {string} userId - User being scanned
 * @param {number} percent - 0-100 progress
 * @param {string} message - Human-readable status
 */
export const emitScanProgress = async (userId, percent, message) => {
  return await safeEmit(userId, SOCKET_EVENTS.SCAN.PROGRESS, {
    percent: Math.min(100, Math.max(0, percent)),
    message,
  });
};

/**
 * Defensive: ensure items is an array before using length/map
 * - itemCount always a number
 * - colors always an array
 * - never throws on invalid input
 */
export const emitScanItemsDetected = async (userId, items) => {
  const safeItems = asArray(items);
  const itemCount = safeItems.length;
  const colors = safeItems.map(i => (i && typeof i.color === 'string') ? i.color : 'unknown');

  return await safeEmit(userId, SOCKET_EVENTS.SCAN.ITEMS_DETECTED, {
    itemCount,
    items: safeItems,
    colors,
  });
};

/**
 * Emit when scan is complete
 * 
 * WHEN: Worker finishes processing
 * 
 * @param {string} userId - User's scan
 * @param {object} scanResult - Full scan data
 */
export const emitScanComplete = async (userId, scanResult) => {
  return await safeEmit(userId, SOCKET_EVENTS.SCAN.COMPLETE, {
    jobId: scanResult?.jobId,
    items: asArray(scanResult?.items),
    confidence: scanResult?.confidence,
    duration: scanResult?.duration,
  });
};

/**
 * Emit scan error
 * 
 * WHEN: Scan fails
 * 
 * @param {string} userId - User's failed scan
 * @param {string} error - Error message
 */
export const emitScanError = async (userId, error) => {
  return await safeEmit(userId, SOCKET_EVENTS.SCAN.ERROR, {
    error: error?.message || error,
    code: error?.code || "SCAN_ERROR",
  });
};

/**
 * ============================================
 * OUTFIT RATING EVENTS
 * ============================================
 */

/**
 * Emit when rating starts
 * 
 * WHEN: outiftRate.js receives rating request
 * 
 * @param {string} userId - User rating outfit
 * @param {object} metadata - { itemCount, occasion, etc }
 */
export const emitRatingStart = async (userId, metadata = {}) => {
  return await safeEmit(userId, SOCKET_EVENTS.RATING.CALCULATING, {
    ...metadata,
    startTime: nowIso(),
  });
};

/**
 * Emit weather score calculation done
 * 
 * WHEN: Weather suitability calculated
 * 
 * @param {string} userId - User rating
 * @param {number} score - Weather score (0-100)
 * @param {object} weatherData - { temperature, condition, etc }
 */
export const emitRatingWeatherDone = async (userId, score, weatherData = {}) => {
  return await safeEmit(userId, SOCKET_EVENTS.RATING.WEATHER_DONE, {
    score,
    temperature: weatherData?.temperature,
    condition: weatherData?.condition,
  });
};

/**
 * Emit skin tone match score done
 * 
 * WHEN: Skin tone fit calculated
 * 
 * @param {string} userId - User rating
 * @param {number} score - Skin tone fit score (0-100)
 * @param {object} skinToneData - { skinTone, matchedColors, etc }
 */
export const emitRatingSkinToneDone = async (userId, score, skinToneData = {}) => {
  return await safeEmit(userId, SOCKET_EVENTS.RATING.SKINTONE_DONE, {
    score,
    skinTone: skinToneData?.skinTone,
  });
};

/**
 * Emit color harmony score done
 * 
 * WHEN: Color harmony calculated
 * 
 * @param {string} userId - User rating
 * @param {number} score - Harmony score (0-100)
 * @param {object} harmonyData - { explanation, colors, etc }
 */
export const emitRatingHarmonyDone = async (userId, score, harmonyData = {}) => {
  return await safeEmit(userId, SOCKET_EVENTS.RATING.HARMONY_DONE, {
    score,
    explanation: harmonyData?.explanation || "Good color combination",
  });
};

/**
 * Emit final outfit score
 * 
 * WHEN: All subscores combined into final score
 * THIS IS THE MAIN SCORE USER SEES
 * 
 * @param {string} userId - User rating
 * @param {number} score - Final outfit score (0-100)
 * @param {string} message - Rating message ("Great outfit!", "Needs improvement", etc)
 * @param {object} breakdown - Score breakdown
 */
export const emitRatingScoreDone = async (userId, score, message, breakdown = {}) => {
  return await safeEmit(userId, SOCKET_EVENTS.RATING.SCORE_DONE, {
    score,
    message,
    breakdown,
  });
};

/**
 * Emit tips generation started
 * 
 * WHEN: About to start generating improvement tips
 * 
 * @param {string} userId - User rating
 * @param {boolean} isDetailed - Detailed or quick tips
 */
export const emitRatingTipsStart = async (userId, isDetailed = false) => {
  return await safeEmit(userId, SOCKET_EVENTS.RATING.TIPS_START, {
    mode: isDetailed ? "detailed" : "quick",
  });
};

/**
 * Emit tips chunk (streaming tips)
 * 
 * WHEN: Each tip is generated
 * WHY: Show tips as they're generated (like ChatGPT)
 * 
 * EXAMPLE:
 * Tip 1: "Consider adding a belt..."
 * Tip 2: "The jacket color works well but..."
 * Tip 3: "Try a different shade of..."
 * 
 * @param {string} userId - User rating
 * @param {string} tip - Single improvement tip
 * @param {number} index - Which tip (0, 1, 2...)
 */
export const emitRatingTipsChunk = async (userId, tip, index) => {
  return await safeEmit(userId, SOCKET_EVENTS.RATING.TIPS_CHUNK, {
    tip,
    index,
  });
};

/**
 * Emit when all tips are complete
 * 
 * WHEN: Finished generating all tips
 * 
 * @param {string} userId - User rating
 * @param {array} allTips - All improvement tips
 */
export const emitRatingTipsComplete = async (userId, allTips) => {
  const safeTips = asArray(allTips);
  return await safeEmit(userId, SOCKET_EVENTS.RATING.TIPS_COMPLETE, {
    allTips: safeTips,
    totalTips: safeTips.length,
  });
};

/**
 * Emit points awarded
 * 
 * WHEN: Points given to user for rating
 * 
 * @param {string} userId - User being rewarded
 * @param {number} points - Points awarded
 * @param {number} totalPoints - User's new total
 */
export const emitRatingPointsAwarded = async (userId, points, totalPoints = 0) => {
  return await safeEmit(userId, SOCKET_EVENTS.RATING.POINTS_AWARDED, {
    pointsAwarded: points,
    totalPoints,
  });
};

/**
 * Emit rating complete (final)
 * 
 * WHEN: Everything done - send final summary
 * 
 * @param {string} userId - User who rated
 * @param {object} finalResult - {score, tips, breakdown, points, etc}
 */
export const emitRatingComplete = async (userId, finalResult) => {
  return await safeEmit(userId, SOCKET_EVENTS.RATING.COMPLETE, finalResult);
};

/**
 * Emit rating error
 * 
 * WHEN: Rating calculation fails
 * 
 * @param {string} userId - User who tried to rate
 * @param {string} error - Error message
 */
export const emitRatingError = async (userId, error) => {
  return await safeEmit(userId, SOCKET_EVENTS.RATING.ERROR, {
    error: error?.message || error,
    code: error?.code || "RATING_ERROR",
  });
};

/**
 * ============================================
 * NOTIFICATION EVENTS
 * ============================================
 */

/**
 * Send notification to specific user
 * 
 * WHEN: Achievement unlocked, new suggestion, etc
 * 
 * @param {string} userId - User to notify
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 * @param {object} data - Additional data
 */
export const emitNotification = async (userId, type, message, data = {}) => {
  return await safeEmit(userId, SOCKET_EVENTS.NOTIFICATION.NEW, {
    id: `notif_${Date.now()}`,
    type,
    message,
    data,
  });
};

/**
 * Notify user of achievement
 * 
 * WHEN: User unlocks achievement
 * 
 * @param {string} userId - User who achieved
 * @param {string} achievement - Achievement name
 * @param {number} points - Points earned
 */
export const emitAchievement = async (userId, achievement, points = 0) => {
  return await safeEmit(userId, SOCKET_EVENTS.NOTIFICATION.ACHIEVEMENT, {
    achievement,
    points,
  });
};

/**
 * Notify user of new suggestion
 * 
 * WHEN: New outfit suggestion available
 * 
 * @param {string} userId - User to notify
 * @param {object} suggestion - Suggestion data
 * @param {string} reason - Why we recommend this
 */
export const emitSuggestion = async (userId, suggestion, reason) => {
  return await safeEmit(userId, SOCKET_EVENTS.NOTIFICATION.SUGGESTION, {
    suggestion,
    reason,
  });
};

/**
 * ============================================
 * BROADCAST FUNCTIONS (Send to Multiple Users)
 * ============================================
 */

/**
 * Broadcast to all online users
 * 
 * WHEN: Server announcement, maintenance notice, etc
 * 
 * @param {string} eventName - Event from SOCKET_EVENTS
 * @param {object} data - Data to broadcast
 */
export const broadcastToAll = async (eventName, data = {}) => {
  try {
    const enrichedData = {
      ...data,
      timestamp: nowIso(),
      broadcasted: true,
    };

    const sent = emitToAll(eventName, enrichedData);
    
    if (sent) {
      console.log(`[SocketService] Broadcast event: ${eventName}`);
    }

    return sent;
  } catch (error) {
    console.error(`[SocketService] Error broadcasting:`, error?.message || error);
    return false;
  }
};

/**
 * Emit user online status to everyone
 * 
 * WHEN: User connects
 * 
 * @param {string} userId - User who came online
 * @param {object} userData - User information
 */
export const broadcastUserOnline = async (userId, userData = {}) => {
  return await broadcastToAll(SOCKET_EVENTS.USER.ONLINE, {
    userId,
    username: userData.username || `User ${shortId(userId)}`,
    timestamp: nowIso(),
  });
};

/**
 * Emit user offline status to everyone
 * 
 * WHEN: User disconnects
 * 
 * @param {string} userId - User who went offline
 */
export const broadcastUserOffline = async (userId) => {
  return await broadcastToAll(SOCKET_EVENTS.USER.OFFLINE, {
    userId,
    timestamp: nowIso(),
  });
};

/**
 * ============================================
 * EXPORT ALL FUNCTIONS
 * ============================================
 */

export default {
  // Chat
  emitChatStart,
  emitChatTyping,
  emitChatResponseChunk,
  emitChatResponseComplete,
  emitChatError,

  // Scan
  emitScanStart,
  emitScanQueued,
  emitScanProgress,
  emitScanItemsDetected,
  emitScanComplete,
  emitScanError,

  // Rating
  emitRatingStart,
  emitRatingWeatherDone,
  emitRatingSkinToneDone,
  emitRatingHarmonyDone,
  emitRatingScoreDone,
  emitRatingTipsStart,
  emitRatingTipsChunk,
  emitRatingTipsComplete,
  emitRatingPointsAwarded,
  emitRatingComplete,
  emitRatingError,

  // Notifications
  emitNotification,
  emitAchievement,
  emitSuggestion,

  // Broadcast
  broadcastToAll,
  broadcastUserOnline,
  broadcastUserOffline,
};
