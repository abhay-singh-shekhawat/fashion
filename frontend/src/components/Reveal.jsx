import { useEffect, useRef, useState } from 'react';

/* One IntersectionObserver for the whole app rather than one per element — a
   wardrobe grid can mount dozens of these at once. */
let observer = null;
const callbacks = new WeakMap();

function getObserver() {
  /* Absent during server rendering (the smoke test renders every route that
     way), which is why this is only ever reached from an effect. */
  if (typeof IntersectionObserver === 'undefined') return null;
  if (observer) return observer;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const fire = callbacks.get(entry.target);
        callbacks.delete(entry.target);
        observer.unobserve(entry.target);
        fire?.();
      }
    },
    /* Trigger once the element is inside the top 90% of the viewport, with no
       threshold: a threshold would never be met by elements taller than the
       screen, which would leave them permanently hidden. */
    { threshold: 0, rootMargin: '0px 0px -10% 0px' },
  );
  return observer;
}

/**
 * Reveals its children as they enter the viewport.
 *
 * This covers both halves of the brief with one mechanism: something already on
 * screen when it mounts reveals immediately (the load animation), and something
 * below the fold reveals as it is scrolled to. Pass `delay` to cascade a list.
 *
 * The hidden state lives in CSS (`.reveal`, see main.css) rather than inline
 * styles, so the reduced-motion override can neutralise it.
 */
export default function Reveal({
  as: Tag = 'div',
  delay = 0,
  className = '',
  children,
  ...rest
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const io = getObserver();
    if (!io) {
      /* No observer available — never leave content invisible. */
      setShown(true);
      return undefined;
    }

    callbacks.set(el, () => setShown(true));
    io.observe(el);

    return () => {
      callbacks.delete(el);
      io.unobserve(el);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`reveal${shown ? ' reveal-in' : ''}${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
