import { CATEGORIES, CATEGORY_EMOJI, CATEGORY_LABELS } from '../config/theme';

/* Geometry for the progress ring. Kept here rather than inline so the
   arithmetic reads once: circumference, then the dash offset that leaves
   exactly the filled share drawn. */
const RADIUS = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/* How much of the closet the icon row accounts for before it stops. */
const ICON_LIMIT = 6;

/**
 * How much of a full wardrobe the closet actually covers.
 *
 * Fits are assembled from category slots, so a missing slot narrows every
 * suggestion the stylist can build — this is the one number on the home screen
 * that says whether the closet can do its job, and it is counted, not scored.
 * The icon row underneath carries the same fact as shape: what is in there,
 * and how much of it.
 */
export default function ClosetCoverage({ items = [], className = '' }) {
  /* Nothing to measure on an empty closet — the fit card already says so, in
     more useful words. */
  if (!items.length) return null;

  const tally = new Map();
  for (const item of items) {
    if (!item?.category) continue;
    tally.set(item.category, (tally.get(item.category) ?? 0) + 1);
  }

  const filled = CATEGORIES.filter((category) => tally.has(category));
  const missing = CATEGORIES.filter((category) => !tally.has(category));
  const pct = Math.round((filled.length / CATEGORIES.length) * 100);
  const dashOffset = CIRCUMFERENCE * (1 - filled.length / CATEGORIES.length);
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, ICON_LIMIT);

  return (
    <div className={`glass space-y-3 p-4 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
            Closet coverage
          </span>
          <p className="font-display mt-1 text-lg leading-tight font-medium tracking-tight">
            {filled.length} of {CATEGORIES.length} slots filled
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/40 text-pretty">
            {missing.length
              ? `Missing ${missing
                  .slice(0, 3)
                  .map((category) => CATEGORY_LABELS[category]?.toLowerCase() ?? category)
                  .join(', ')}${missing.length > 3 ? ` and ${missing.length - 3} more` : ''}. Every suggestion is built from these slots.`
              : 'Every slot is covered — the stylist has a free hand.'}
          </p>
        </div>

        <div className="relative grid h-14 w-14 shrink-0 place-items-center">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle
              cx="18"
              cy="18"
              r={RADIUS}
              fill="none"
              strokeWidth="2.5"
              className="stroke-white/[0.09]"
            />
            <circle
              cx="18"
              cy="18"
              r={RADIUS}
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="stroke-brand-primary"
            />
          </svg>
          <span className="absolute font-display text-[13px] font-medium text-brand-primary tabular-nums">
            {pct}%
          </span>
        </div>
      </div>

      {/* Composition as icons and counts — no words, just what is in there. */}
      {top.length ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.07] pt-3">
          {top.map(([category, count]) => (
            <span
              key={category}
              title={CATEGORY_LABELS[category] ?? category}
              className="inline-flex items-center gap-1 rounded-full border border-white/[0.07] bg-ink-950/50 py-1 pr-2.5 pl-2"
            >
              <span aria-hidden="true" className="text-[13px]">
                {CATEGORY_EMOJI[category] ?? '🧺'}
              </span>
              <span className="text-[11px] font-semibold text-white/60 tabular-nums">
                {count}
              </span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
