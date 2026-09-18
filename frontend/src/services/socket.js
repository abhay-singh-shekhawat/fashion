import { io } from 'socket.io-client';

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'https://fashion.sytes.net';

let socket = null;
let socketToken = null;

/**
 * The server verifies handshake.auth.token with ACCESS_TOKEN_SECRET at
 * connection time, so this must be called with a live access token.
 *
 * The existing instance is reused even while it is still connecting: React
 * StrictMode mounts the effect in AuthContext twice, and creating a second
 * socket left one of them orphaned. Whenever that orphan disconnected the
 * server marked the whole user offline and dropped every following event
 * (scan:complete, chat chunks, ...), which froze the UI mid-flow.
 */
export function connectSocket() {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  if (socket && socketToken === token) return socket;

  /* Token changed (re-login) — the old socket is authenticated as someone else. */
  socket?.disconnect();
  socketToken = token;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnectionAttempts: 5,
  });

  return socket;
}

export const getSocket = () => socket;

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}
