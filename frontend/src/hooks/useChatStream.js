import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ENDPOINTS, apiError } from '../services/api';
import { useSocketEvent } from './useSocketEvent';

function readReply(reply) {
  if (!reply) return '';
  if (typeof reply === 'string') return reply;
  if (typeof reply.message === 'string') return reply.message;
  if (typeof reply.text === 'string') return reply.text;
  return JSON.stringify(reply, null, 2);
}

let messageId = 0;
const nextId = () => {
  messageId += 1;
  return `m${messageId}`;
};

/**
 * Chat is HTTP-out / socket-in: the POST carries the message and returns the
 * authoritative reply, while `chat:response:chunk` events stream the same
 * answer token by token.
 */
export function useChatStream() {
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const pendingId = useRef(null);

  const appendChunk = useCallback((chunk) => {
    if (typeof chunk !== 'string' || !chunk) return;
    setMessages((prev) =>
      prev.map((message) =>
        message.id === pendingId.current
          ? { ...message, content: message.content + chunk, streaming: true }
          : message,
      ),
    );
  }, []);

  useSocketEvent('chat:start', () => {
    setIsTyping(true);
  });

  useSocketEvent('chat:typing', ({ isTyping: typing } = {}) => {
    setIsTyping(Boolean(typing));
  });

  useSocketEvent('chat:response:chunk', ({ chunk }) => {
    appendChunk(chunk);
  });

  useSocketEvent('chat:response:complete', ({ fullMessage } = {}) => {
    setIsTyping(false);
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id !== pendingId.current) return message;
        const content = typeof fullMessage === 'string' && fullMessage ? fullMessage : message.content;
        return { ...message, content, streaming: false };
      }),
    );
    pendingId.current = null;
  });

  useSocketEvent('chat:error', ({ error } = {}) => {
    setIsTyping(false);
    setMessages((prev) =>
      prev.map((message) =>
        message.id === pendingId.current
          ? { ...message, content: error ?? 'The stylist hit a snag.', error: true, streaming: false }
          : message,
      ),
    );
    pendingId.current = null;
  });

  const send = useCallback(async (text, file) => {
    const trimmed = text?.trim();
    if (!trimmed && !file) return;

    const assistantId = nextId();
    pendingId.current = assistantId;

    setMessages((prev) => [
      ...prev,
      {
        id: nextId(),
        role: 'user',
        content: trimmed,
        image: file ? URL.createObjectURL(file) : null,
      },
      { id: assistantId, role: 'assistant', content: '', streaming: true },
    ]);
    setIsSending(true);

    try {
      const form = new FormData();
      form.append('message', trimmed || 'What do you think of this?');
      if (file) form.append('image', file);

      const { data } = await api.post(ENDPOINTS.chat, form);
      const content = readReply(data?.reply);

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? { ...message, content: content || message.content, streaming: false }
            : message,
        ),
      );
    } catch (error) {
      const message = apiError(error, 'The stylist is unavailable right now.');
      setMessages((prev) =>
        prev.map((entry) =>
          entry.id === assistantId
            ? { ...entry, content: message, error: true, streaming: false }
            : entry,
        ),
      );
    } finally {
      setIsSending(false);
      setIsTyping(false);
      pendingId.current = null;
    }
  }, []);

  const clear = useCallback(() => setMessages([]), []);

  useEffect(() => () => setIsTyping(false), []);

  return { messages, isSending, isTyping, send, clear };
}
