import { SCORE_BREAKDOWN_LABELS, SCORE_DIMENSIONS } from '../config/theme';

/* How many fits the trend shows, and how many it takes before a trend is
   worth drawing at all. */
const TREND_SIZE = 8;
const MIN_FOR_TREND = 2;

/**
 * Two reads on the rating history that the list itself cannot give: where the
 * scores have been heading, and which of the four scored dimensions is
 * dragging the average down.
 *
 * Everything is computed from stored ratings — nothing here is estimated or
 * projected, and a dimension nobody has been scored on is simply absent.
 */
export default function RatingInsights({ entries = [], className = '' }) {
  const scored = entries.filter((entry) => typeof entry?.score === 'number');

  /* Oldest → newest so the chart reads left to right. */
  const trend = scored.slice(0, TREND_SIZE).reverse();

  const average = trend.length
    ? Math.round(trend.reduce((sum, entry) => sum + entry.score, 0) / trend.length)
    : 0;

  /* Each dimension contributes a different maximum (30/25/20/25), so the
     meters show the share of what was available, not the raw points. */
  const dimensions = Object.entries(SCORE_DIMENSIONS)
    .map(([key, meta]) => {
      const values = scored
        .map((entry) => entry?.breakdown?.[key])
        .filter((value) => typeof value === 'number' && value > 0);
      if (!values.length) return null;
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      return {
        key,
        label: SCORE_BREAKDOWN_LABELS[key] ?? key,
        emoji: meta.emoji,
        pct: Math.round((mean / meta.max) * 100),
        samples: values.length,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.pct - a.pct);

  /* The occasion these fits score best in, read off the stored occasion of each
     rating. Stated as an average and a sample size so it can be judged. */
  const byOccasion = new Map();
  for (const entry of scored) {
    if (!entry?.occasion) continue;
    const bucket = byOccasion.get(entry.occasion) ?? { sum: 0, count: 0 };
    bucket.sum += entry.score;
    bucket.count += 1;
    byOccasion.set(entry.occasion, bucket);
  }
  const bestOccasion =
    [...byOccasion.entries()]
      .map(([occasion, bucket]) => ({
        occasion,
        avg: Math.round(bucket.sum / bucket.count),
        count: bucket.count,
      }))
      .sort((a, b) => b.avg - a.avg)[0] ?? null;

  if (!scored.length) {
    return (
      <div className={`glass p-4 ${className}`}>
        <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
          Score trend
        </span>
        <p className="mt-2 text-sm text-white/45">Rate a fit and your trend appears here.</p>
      </div>
    );
  }

  return (
    <div className={`glass space-y-4 p-4 ${className}`}>
      {/* ── Trend ─────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
            Score trend
          </span>
          <span className="text-[11px] text-white/40">
            last {trend.length} fit{trend.length === 1 ? '' : 's'} · avg{' '}
            <strong className="font-semibold text-brand-primary tabular-nums">{average}</strong>
          </span>
        </div>

        {trend.length >= MIN_FOR_TREND ? (
          <div className="mt-3">
            {/* The bar row is its own box so the average line's percentage
                resolves against the bars, not the bar row plus its labels. */}
            <div className="relative h-24">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 border-t border-dashed border-brand-primary/35"
                style={{ bottom: `${average}%` }}
              />
              <div className="flex h-full items-end gap-1.5">
                {trend.map((entry) => (
                  <div
                    key={entry._id ?? `${entry.score}-${entry.createdAt}`}
                    className="flex h-full flex-1 flex-col justify-end"
                    title={`${Math.round(entry.score)} · ${entry.occasion ?? 'casual'}`}
                  >
                    <span
                      className="w-full rounded-t-md bg-gradient-to-t from-brand-lime/35 to-brand-primary"
                      style={{ height: `${Math.max(6, Math.round(entry.score))}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-1.5 flex gap-1.5">
              {trend.map((entry) => (
                <span
                  key={`label-${entry._id ?? entry.createdAt}`}
                  className="flex-1 truncate text-center text-[9px] text-white/30 capitalize"
                >
                  {entry.occasion ?? ''}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-white/40">
            One fit in. Rate another and the trend line appears here.
          </p>
        )}
      </div>

      {/* ── Which pillar carries the score ────────────────────────────────── */}
      {dimensions.length ? (
        <div className="space-y-2.5 border-t border-white/[0.07] pt-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
              Pillar average
            </span>
          </div>

          {dimensions.map((dimension) => (
            <div key={dimension.key}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[13px] text-white/75">
                  <span aria-hidden="true" className="mr-1.5">
                    {dimension.emoji}
                  </span>
                  {dimension.label}
                </span>
                <span className="shrink-0 text-[13px] font-semibold text-brand-primary tabular-nums">
                  {dimension.pct}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-lime to-brand-primary"
                  style={{ width: `${Math.max(3, dimension.pct)}%` }}
                />
              </div>
            </div>
          ))}

        </div>
      ) : null}

      {bestOccasion ? (
        <p className="border-t border-white/[0.07] pt-3 text-[11px] text-white/40">
          Best:{' '}
          <strong className="font-semibold text-white/75 capitalize">
            {bestOccasion.occasion}
          </strong>{' '}
          · {bestOccasion.avg} avg · {bestOccasion.count} fit
          {bestOccasion.count === 1 ? '' : 's'}
        </p>
      ) : null}
    </div>
  );
}
