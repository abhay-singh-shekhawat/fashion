// Socket.IO Event Constants - Centralized event names to prevent typos

export const SOCKET_EVENTS = {
  AUTH: {
    AUTHENTICATE: "auth:authenticate",
    SUCCESS: "auth:success",
    FAILURE: "auth:failure",
  },

  USER: {
    ONLINE: "user:online",
    OFFLINE: "user:offline",
    SET_PROCESSING: "user:set-processing",
    PROCESSING_STATUS: "user:processing-status",
  },

  CHAT: {
    MESSAGE: "chat:message",
    START: "chat:start",
    RESPONSE_CHUNK: "chat:response:chunk",
    RESPONSE_COMPLETE: "chat:response:complete",
    ERROR: "chat:error",
    TYPING: "chat:typing",
  },

  SCAN: {
    START: "scan:start",
    QUEUED: "scan:queued",
    PROCESSING: "scan:processing",
    PROGRESS: "scan:progress",
    ITEMS_DETECTED: "scan:items:detected",
    COMPLETE: "scan:complete",
    ERROR: "scan:error",
  },

  RATING: {
    START: "rating:start",
    CALCULATING: "rating:calculating",
    WEATHER_DONE: "rating:weather:done",
    SKINTONE_DONE: "rating:skintone:done",
    HARMONY_DONE: "rating:harmony:done",
    SCORE_DONE: "rating:score:done",
    TIPS_START: "rating:tips:start",
    TIPS_CHUNK: "rating:tips:chunk",
    TIPS_COMPLETE: "rating:tips:complete",
    POINTS_AWARDED: "rating:points:awarded",
    COMPLETE: "rating:complete",
    ERROR: "rating:error",
  },

  NOTIFICATION: {
    NEW: "notification:new",
    ACHIEVEMENT: "notification:achievement",
    SUGGESTION: "notification:suggestion",
  },

  ERROR: {
    GENERAL: "error:general",
  },
};

export default SOCKET_EVENTS;
