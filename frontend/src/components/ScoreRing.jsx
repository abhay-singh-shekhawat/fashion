import { useEffect, useState } from 'react';

/** Circular gauge with a cubic-eased count-up.
 *  Pass `value` to drive the ring independently of the displayed number. */
export default function ScoreRing({ score = 0, value, tone = '#DFC3A9', size = 176, stroke = 12, caption }) {
  const [display, setDisplay] = useState(0);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ringTarget = value ?? display;
  const clamped = Math.max(0, Math.min(100, ringTarget));
  const dashOffset = circumference * (1 - clamped / 100);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(score * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-white/[0.07]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={tone}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ filter: `drop-shadow(0 0 16px ${tone}33)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="font-display text-5xl font-bold tracking-tighter tabular-nums"
          style={{ color: tone }}
        >
          {display}
        </span>
        {caption ? (
          <span className="mt-1 text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
            {caption}
          </span>
        ) : null}
      </div>
    </div>
  );
}
