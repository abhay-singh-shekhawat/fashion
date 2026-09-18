import { useRef, useState } from 'react';
import { Preloader } from 'konsta/react';

const TRIGGER = 64;
const MAX_PULL = 96;

/** Lightweight touch pull-to-refresh — the page scrolls on window. */
export default function PullToRefresh({ onRefresh, children, className = '' }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);

  const handleTouchStart = (event) => {
    if (window.scrollY <= 0 && !refreshing) {
      startY.current = event.touches[0].clientY;
    }
  };

  const handleTouchMove = (event) => {
    if (startY.current == null) return;
    const delta = event.touches[0].clientY - startY.current;
    if (delta <= 0) {
      setPull(0);
      return;
    }
    setPull(Math.min(MAX_PULL, delta * 0.5));
  };

  const handleTouchEnd = async () => {
    if (startY.current == null) return;
    const shouldRefresh = pull >= TRIGGER;
    startY.current = null;
    setPull(0);

    if (!shouldRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
  };

  const offset = refreshing ? TRIGGER : pull;

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="grid place-items-center overflow-hidden"
        style={{ height: offset, opacity: offset / TRIGGER }}
      >
        <Preloader className="h-5 w-5" />
      </div>
      {children}
    </div>
  );
}
