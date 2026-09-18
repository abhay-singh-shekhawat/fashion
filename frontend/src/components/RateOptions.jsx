import { Toggle } from 'konsta/react';
import { OCCASIONS } from '../config/theme';
import GlassCard from './GlassCard';

/* Occasion picker + detailed-feedback toggle. Rate a photo and Rate from the
   closet showed byte-identical copies of this that differed only in accent, so
   it lives here once. */
export default function RateOptions({
  occasion,
  onOccasion,
  detailed,
  onDetailed,
  tone = 'primary',
  hint = 'Deeper tips, takes a little longer',
  className = '',
}) {
  const activeTone =
    tone === 'lime'
      ? 'bg-brand-lime/15 text-brand-lime ring-brand-lime/40'
      : 'bg-brand-primary/15 text-brand-primary ring-brand-primary/40';

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <span className="text-[10px] font-bold tracking-[0.16em] text-white/40 uppercase">
          Occasion
        </span>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((entry) => {
            const active = occasion === entry.key;
            return (
              <button
                key={entry.key}
                type="button"
                onClick={() => onOccasion(entry.key)}
                aria-pressed={active}
                className={`press flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold ring-1 transition-colors ${
                  active ? activeTone : 'bg-white/[0.04] text-white/55 ring-white/10 hover:text-white/80'
                }`}
              >
                <span aria-hidden="true">{entry.emoji}</span>
                {entry.label}
              </button>
            );
          })}
        </div>
      </div>

      <GlassCard className="flex items-center justify-between">
        <div className="pr-4">
          <p className="text-sm font-bold">Detailed feedback</p>
          <p className="mt-0.5 text-xs text-white/40 text-pretty">{hint}</p>
        </div>
        <Toggle checked={detailed} onChange={() => onDetailed(!detailed)} />
      </GlassCard>
    </div>
  );
}
