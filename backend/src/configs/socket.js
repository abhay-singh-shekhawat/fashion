// Socket.IO Server Configuration - Handles real-time WebSocket connections
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

// Module-scoped socket instance and user tracking so helper functions can be exported
let io = null;
const connectedUsers = new Map();

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
      allowEIO3: true,
    },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 60000,
    maxHttpBufferSize: 1e6,
  });

  // JWT Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        const error = new Error("Unauthorized: No token provided");
        error.code = "UNAUTHORIZED";
        return next(error);
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = decoded.userId;
      socket.data.user = decoded;

      console.log(`[Socket] Auth successful for user: ${decoded.userId}`);
      next();
    } catch (error) {
      console.error("[Socket] Auth failed:", error.message);
      if (error.name === "JsonWebTokenError") {
        return next(new Error("Unauthorized: Invalid token"));
      }
      if (error.name === "TokenExpiredError") {
        return next(new Error("Unauthorized: Token expired"));
      }
      next(error);
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    const socketId = socket.id;

    console.log(`[Socket] User connected: ${userId} | Socket: ${socketId}`);

    connectedUsers.set(userId, {
      socketId: socketId,
      connectedAt: Date.now(),
      isProcessing: false,
    });

    socket.join(`user:${userId}`);
    socket.join("notifications");

    console.log(`[Socket] Connected users count: ${connectedUsers.size}`);

    // Disconnect handler
    socket.on("disconnect", (reason) => {
      console.log(`[Socket] User disconnected: ${userId} | Reason: ${reason}`);
      connectedUsers.delete(userId);
      console.log(`[Socket] Connected users count: ${connectedUsers.size}`);
    });

    // Error handler
    socket.on("error", (error) => {
      console.error(`[Socket] Error for user ${userId}:`, error);
    });

    // Processing status handler
    socket.on("user:set-processing", (data) => {
      const user = connectedUsers.get(userId);
      if (user) {
        user.isProcessing = data.isProcessing || false;
      }
    });
  });

  return {
    io,
    getConnectedUsers,
    getUserSocket,
    isUserOnline,
    getUsersCount,
    emitToUser,
    emitToAll,
    emitToAllExcept,
  };
};

// ============================================
// HELPER FUNCTIONS (exported at module scope)
// ============================================

const getConnectedUsers = () => connectedUsers;

const getUserSocket = (userId) => connectedUsers.get(userId) || null;

const isUserOnline = (userId) => connectedUsers.has(userId);

const getUsersCount = () => connectedUsers.size;

const emitToUser = (userId, eventName, data) => {
  try {
    const user = connectedUsers.get(userId);
    if (!user || !io) {
      console.warn(`[Socket] User ${userId} not online or io not initialized. Event: ${eventName}`);
      return false;
    }
    io.to(`user:${userId}`).emit(eventName, data);
    console.log(`[Socket] Event sent to ${userId}: ${eventName}`);
    return true;
  } catch (error) {
    console.error(`[Socket] Error emitting to ${userId}:`, error.message);
    return false;
  }
};

const emitToAll = (eventName, data) => {
  try {
    if (!io) {
      console.warn(`[Socket] io not initialized. Cannot broadcast: ${eventName}`);
      return false;
    }
    io.emit(eventName, data);
    console.log(`[Socket] Broadcasted to all users: ${eventName}`);
    return true;
  } catch (error) {
    console.error(`[Socket] Error broadcasting:`, error.message);
    return false;
  }
};

const emitToAllExcept = (userId, eventName, data) => {
  try {
    if (!io) {
      console.warn(`[Socket] io not initialized. Cannot emit to all except ${userId}: ${eventName}`);
      return false;
    }
    const user = connectedUsers.get(userId);
    if (!user) {
      io.emit(eventName, data);
    } else if (typeof io.except === 'function') {
      // Some socket.io versions support .except
      io.except(user.socketId).emit(eventName, data);
    } else {
      // Fallback: broadcast to room 'notifications' but exclude by not targeting the user's room
      io.to('notifications').emit(eventName, data);
    }
    console.log(`[Socket] Event sent to all except ${userId}: ${eventName}`);
    return true;
  } catch (error) {
    console.error(`[Socket] Error in emitToAllExcept:`, error.message);
    return false;
  }
};

export {
  emitToUser,
  emitToAll,
  emitToAllExcept,
  getConnectedUsers,
  getUserSocket,
  isUserOnline,
  getUsersCount,
};

export default initializeSocket;
