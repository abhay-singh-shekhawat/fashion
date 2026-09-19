import { CATEGORIES, CATEGORY_LABELS, FORMALITY_LABELS } from '../config/theme';
import { PlusIcon } from './Icons';

/* How many categories the makeup block lists before the tail is summarised. */
const TOP_CATEGORIES = 4;
const MAX_GAPS = 3;

/**
 * What the closet is actually made of, and what it is missing. Both halves are
 * counted from the items on screen — the gaps are honest absences, which is
 * exactly what a wardrobe app should be pointing at.
 */
export default function ClosetInsights({ items = [], onAdd, className = '' }) {
  const total = items.length;
  if (!total) return null;

  const tally = new Map();
  const formalityTally = new Map();
  for (const item of items) {
    if (item?.category) tally.set(item.category, (tally.get(item.category) ?? 0) + 1);
    if (item?.formality && item.formality !== 'unknown') {
      formalityTally.set(item.formality, (formalityTally.get(item.formality) ?? 0) + 1);
    }
  }

  const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_CATEGORIES);
  const gaps = CATEGORIES.filter((category) => !tally.has(category)).slice(0, MAX_GAPS);

  const [formality, formalityCount] = [...formalityTally.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0] ?? [null, 0];
  const formalityPct = formality ? Math.round((formalityCount / total) * 100) : 0;

  return (
    <div className={`glass space-y-4 p-4 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
          Closet makeup
        </span>
        <span className="text-[11px] text-white/40 tabular-nums">
          {total} piece{total === 1 ? '' : 's'}
        </span>
      </div>

      <div className="space-y-2.5">
        {top.map(([category, count]) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={category}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[13px] text-white/75">
                  {CATEGORY_LABELS[category] ?? category}
                </span>
                <span className="shrink-0 text-[12px] text-white/45 tabular-nums">
                  {count} · {pct}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-lime to-brand-primary"
                  style={{ width: `${Math.max(4, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {formality ? (
        <p className="border-t border-white/[0.07] pt-3 text-[11px] leading-relaxed text-white/40">
          Leans{' '}
          <strong className="font-semibold text-white/75">
            {FORMALITY_LABELS[formality] ?? formality}
          </strong>{' '}
          — {formalityPct}% of the closet. Suggestions are built around that, so a formal week
          needs pieces to match.
        </p>
      ) : null}

      {gaps.length ? (
        <div className="space-y-2 border-t border-white/[0.07] pt-3">
          <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
            Nothing here yet
          </span>
          <div className="flex flex-wrap gap-1.5">
            {gaps.map((category) => (
              <button
                key={category}
                type="button"
                onClick={onAdd}
                className="press inline-flex items-center gap-1.5 rounded-full border border-dashed border-white/15 px-3 py-1.5 text-[11px] font-semibold text-white/55 hover:border-brand-primary/40 hover:text-brand-primary"
              >
                <PlusIcon className="h-3 w-3" strokeWidth={2.6} />
                {CATEGORY_LABELS[category] ?? category}
              </button>
            ))}
          </div>
          <p className="text-[11px] leading-relaxed text-white/30">
            Fits can only be built from what is in here — a missing category narrows every
            suggestion.
          </p>
        </div>
      ) : null}
    </div>
  );
}
