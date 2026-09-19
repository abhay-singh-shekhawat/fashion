import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getScreenMeta } from '../config/screens';

/* Where a panel goes when it was opened directly and has nothing behind it. */
const FALLBACK = { wardrobe: '/wardrobe', rate: '/rate', profile: '/profile' };

/**
 * Presents a drill-down screen as a component in the middle of the screen.
 *
 * The scrim is ours rather than Konsta's: theirs is a flat 50% black with no
 * styling hook, and this needs the blur. What sits behind the blur is the real
 * thing — App.jsx keeps the route the user came from mounted underneath, so the
 * screen they were on is still there, soft, exactly as they left it.
 */
export default function PanelFrame({ pathname, children }) {
  const navigate = useNavigate();
  const closeRef = useRef(null);
  const meta = getScreenMeta(pathname);

  const close = useCallback(() => {
    /* Back leaves the panel the way it was entered. A panel opened directly (a
       refresh, a shared link) has no entry behind it, so it goes to its section
       instead of stepping out of the app. */
    const historyIndex = window.history.state?.idx ?? 0;
    if (historyIndex > 0) {
      navigate(-1);
      return;
    }
    navigate(FALLBACK[pathname.split('/')[1]] ?? '/');
  }, [navigate, pathname]);

  /* A tap that opened the panel can still land on the scrim as it mounts — the
     browser dispatches that click to whatever is under the finger by then,
     which is now the scrim. Ignoring the first fraction of a second keeps the
     panel from being dismissed by the gesture that opened it. */
  const mountedAt = useRef(Date.now());
  const dismissFromScrim = () => {
    if (Date.now() - mountedAt.current < 350) return;
    close();
  };

  useEffect(() => {
    /* Focus enters the panel so the keyboard path starts inside it, and the
       page behind is frozen so a stray scroll cannot move the blurred layer. */
    closeRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [close]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={meta.title}
      className="fixed inset-0 z-40 flex items-center justify-center p-3"
    >
      <div
        aria-hidden="true"
        onClick={dismissFromScrim}
        className="animate-fade-in absolute inset-0 bg-ink-950/40 backdrop-blur-lg"
      />

      <div className="glass-strong animate-scale-in relative flex max-h-[88vh] w-full max-w-[32rem] flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
          <span className="font-display truncate text-base font-medium tracking-tight">
            {meta.title}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close"
            className="press glass-tile grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg leading-none text-white/60"
          >
            ×
          </button>
        </div>

        {/* The only scrollable region on the screen while a panel is open. */}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
