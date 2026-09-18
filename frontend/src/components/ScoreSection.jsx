import { useState } from 'react';
import { ChevronRightIcon } from './Icons';
import Pill from './Pill';
import {
  COLOR_SWATCH,
  SCORE_BREAKDOWN_LABELS,
  SCORE_DIMENSIONS,
  VERDICTS,
  verdictFor,
} from '../config/theme';

/**
 * One scored dimension of the fit. Collapsed it reads as a labelled bar with
 * the points earned; tapping it opens the model's "why" and a concrete fix.
 * `facts` (and `swatches`) carry what the dimension was judged on — the same
 * way the weather card shows the conditions behind its score.
 */
export default function ScoreSection({
  dimension,
  value,
  verdict,
  why,
  fix,
  facts = [],
  swatches = [],
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = SCORE_DIMENSIONS[dimension] ?? { max: 25, emoji: '•' };
  const tone = VERDICTS[verdict] ?? VERDICTS[verdictFor(value, meta.max)];
  const pct = Math.max(4, Math.round((value / meta.max) * 100));
  const expandable = Boolean(why || fix);

  return (
    <div className="overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.07]">
      <button
        type="button"
        onClick={() => expandable && setOpen((current) => !current)}
        aria-expanded={expandable ? open : undefined}
        className={`flex w-full items-center gap-3 px-3.5 py-3 text-left ${expandable ? 'press' : 'cursor-default'}`}
      >
        <span className="text-base">{meta.emoji}</span>

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-xs font-bold tracking-wide text-white/70">
              {SCORE_BREAKDOWN_LABELS[dimension] ?? dimension}
            </span>
            <span className="font-display shrink-0 text-sm font-bold tabular-nums text-white/80">
              {value}
              <span className="text-white/30">/{meta.max}</span>
            </span>
          </span>
          <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <span className={`block h-full rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
          </span>

          {facts.length || swatches.length ? (
            <span className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] leading-snug text-white/40">
              {swatches.map((color) => (
                <span
                  key={color}
                  title={color}
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-white/25"
                  style={{ background: COLOR_SWATCH[color] ?? '#6B6B76' }}
                />
              ))}
              {facts.length ? <span>{facts.join(' · ')}</span> : null}
            </span>
          ) : null}
        </span>

        <Pill tone={tone.tone} className="shrink-0">
          {tone.label}
        </Pill>

        {expandable ? (
          <ChevronRightIcon
            className={`h-4 w-4 shrink-0 text-white/30 transition-transform duration-200 ${
              open ? 'rotate-90' : ''
            }`}
          />
        ) : null}
      </button>

      {open && expandable ? (
        <div className="space-y-2 border-t border-white/10 px-3.5 py-3">
          {why ? <p className="text-sm leading-relaxed text-white/70">{why}</p> : null}
          {fix ? (
            <p className="flex gap-2 text-xs leading-relaxed">
              <span className="font-bold tracking-wide text-brand-lime uppercase">Try</span>
              <span className="text-white/70">{fix}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
