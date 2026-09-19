import { useMemo } from 'react';
import { bandFor } from '../config/theme';

const DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The last two weeks as a strip of cells — one per day, tinted by the band of
 * the best fit scored that day, empty outline for a day with nothing on it.
 *
 * Deliberately wordless: the shape of the strip is the content, the same way a
 * contribution graph tells you more at a glance than a sentence would. Each
 * cell carries its date and score as a title for anyone who wants the detail.
 */
export default function FitCalendar({ entries = [], className = '' }) {
  const { cells, rated } = useMemo(() => {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);

    /* Best score per day: a second rating on the same day should not dim the
       first one. */
    const best = new Map();
    for (const entry of entries) {
      const at = new Date(entry?.createdAt);
      if (Number.isNaN(at.getTime())) continue;
      const day = new Date(at);
      day.setHours(0, 0, 0, 0);
      const key = day.getTime();
      const score = typeof entry?.score === 'number' ? entry.score : null;
      if (score === null) continue;
      best.set(key, Math.max(best.get(key) ?? 0, score));
    }

    const list = Array.from({ length: DAYS }, (_, index) => {
      const day = new Date(midnight.getTime() - (DAYS - 1 - index) * DAY_MS);
      const score = best.get(day.getTime()) ?? null;
      return {
        key: day.getTime(),
        date: day,
        score,
        isToday: index === DAYS - 1,
        isWeekend: day.getDay() === 0 || day.getDay() === 6,
      };
    });

    return { cells: list, rated: list.filter((cell) => cell.score !== null).length };
  }, [entries]);

  return (
    <div className={`glass space-y-2.5 p-4 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
          Last {DAYS} days
        </span>
        <span className="font-display text-[13px] font-medium text-brand-primary tabular-nums">
          {rated}
          <span className="ml-1 text-[11px] text-white/35">rated</span>
        </span>
      </div>

      <div className="flex items-end gap-1.5">
        {cells.map((cell) => {
          const band = cell.score !== null ? bandFor(cell.score) : null;
          return (
            <span
              key={cell.key}
              title={
                cell.score !== null
                  ? `${cell.date.toLocaleDateString()} · ${Math.round(cell.score)}`
                  : `${cell.date.toLocaleDateString()} · nothing rated`
              }
              aria-label={
                cell.score !== null
                  ? `${cell.date.toDateString()}: scored ${Math.round(cell.score)}`
                  : `${cell.date.toDateString()}: nothing rated`
              }
              className={`flex h-9 flex-1 items-end overflow-hidden rounded-lg border transition-colors ${
                cell.score === null
                  ? 'border-white/[0.07] bg-white/[0.02]'
                  : 'border-transparent'
              } ${cell.isToday ? 'ring-1 ring-brand-primary/60' : ''}`}
              style={
                band
                  ? { background: `${band.tone}26`, borderColor: `${band.tone}59` }
                  : undefined
              }
            >
              {/* The fill height carries the score, so the strip reads as a
                  chart rather than fourteen identical swatches. */}
              <span
                aria-hidden="true"
                className="block w-full rounded-b-lg"
                style={
                  band
                    ? {
                        height: `${Math.max(12, Math.round(cell.score))}%`,
                        background: band.tone,
                        opacity: cell.isToday ? 0.95 : 0.75,
                      }
                    : undefined
                }
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
