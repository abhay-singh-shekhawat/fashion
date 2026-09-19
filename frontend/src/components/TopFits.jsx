import { useMemo } from 'react';
import { bandFor, timeAgo } from '../config/theme';

const DEFAULT_COUNT = 5;
/* Below this many rated fits there is no "best of" worth showing — one score
   is not a ranking. */
const MIN_ENTRIES = 3;

/**
 * The fits that scored highest, as a photo rail with the score stamped on each
 * tile. Image-led on purpose: the proof that the scoring means something is the
 * photograph, and the only text is the number and when it happened.
 */
export default function TopFits({ entries = [], onOpen, count = DEFAULT_COUNT, className = '' }) {
  const best = useMemo(() => {
    const scored = entries.filter((entry) => typeof entry?.score === 'number');
    if (scored.length < MIN_ENTRIES) return [];
    return [...scored].sort((a, b) => b.score - a.score).slice(0, count);
  }, [entries, count]);

  if (!best.length) return null;

  return (
    <section className={`space-y-2.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-3 px-0.5">
        <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
          Best scores
        </span>
        <button
          type="button"
          onClick={() => onOpen?.()}
          className="press text-[11px] font-semibold text-brand-lime"
        >
          View all
        </button>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        {best.map((entry) => {
          const band = bandFor(entry.score);
          return (
            <button
              key={entry._id ?? entry.createdAt}
              type="button"
              onClick={() => onOpen?.(entry)}
              className="press hover-lift relative w-[124px] shrink-0 overflow-hidden rounded-2xl glass-tile text-left"
            >
              <span className="grid aspect-[4/5] w-full place-items-center overflow-hidden bg-gradient-to-br from-white/[0.06] to-transparent">
                {entry.imageUrl ? (
                  <img
                    src={entry.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl opacity-60">🧺</span>
                )}
              </span>

              {/* The score rides on the photo, in the band's own colour. */}
              <span
                className="absolute top-2 left-2 grid h-9 w-9 place-items-center rounded-full border font-display text-[13px] font-medium tabular-nums backdrop-blur-md"
                style={{
                  color: band.tone,
                  borderColor: `${band.tone}59`,
                  background: `${band.tone}26`,
                }}
              >
                {Math.round(entry.score)}
              </span>

              <span className="block truncate px-2 py-1.5 text-[10px] text-white/45">
                {timeAgo(entry.createdAt)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
