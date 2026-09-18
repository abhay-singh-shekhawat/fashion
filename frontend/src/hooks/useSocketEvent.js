import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Subscribes to a socket event with a stable listener so the handler can be
 * an inline closure without re-registering on every render.
 */
export function useSocketEvent(event, handler) {
  const { socket } = useAuth();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return undefined;
    const listener = (...args) => handlerRef.current?.(...args);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [socket, event]);
}
