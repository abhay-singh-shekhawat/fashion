import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const TONES = {
  default: 'bg-white/10 text-white ring-white/15',
  success: 'bg-brand-lime/15 text-brand-lime ring-brand-lime/30',
  info: 'bg-brand-cyan/15 text-brand-cyan ring-brand-cyan/30',
  error: 'bg-brand-error/15 text-brand-error ring-brand-error/30',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, tone = 'default') => {
      if (!message) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [...current.slice(-2), { id, message, tone }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 2800),
      );
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 pt-safe-14 px-4">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismiss(toast.id)}
            className={`pointer-events-auto animate-[toast-in_240ms_cubic-bezier(0.34,1.56,0.64,1)] rounded-2xl px-4 py-2.5 text-sm font-semibold ring-1 backdrop-blur-xl ${TONES[toast.tone] ?? TONES.default}`}
          >
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
