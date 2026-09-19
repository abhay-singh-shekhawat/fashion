import { OCCASIONS } from '../config/theme';
import { CheckIcon } from './Icons';

/* Full class strings per tone — Tailwind only sees names that appear whole in
   the source. The tint stays on the chip and the active tile so the shelf
   never turns into a rainbow of competing fills. */
const TONES = {
  lime: {
    chip: 'bg-brand-lime/15 text-brand-lime ring-brand-lime/25',
    tile: 'bg-brand-lime/10 ring-brand-lime/45',
    check: 'bg-brand-lime',
  },
  amber: {
    chip: 'bg-brand-amber/15 text-brand-amber ring-brand-amber/25',
    tile: 'bg-brand-amber/10 ring-brand-amber/45',
    check: 'bg-brand-amber',
  },
  cyan: {
    chip: 'bg-brand-cyan/15 text-brand-cyan ring-brand-cyan/25',
    tile: 'bg-brand-cyan/10 ring-brand-cyan/45',
    check: 'bg-brand-cyan',
  },
  violet: {
    chip: 'bg-brand-primary/15 text-brand-primary ring-brand-primary/25',
    tile: 'bg-brand-primary/10 ring-brand-primary/45',
    check: 'bg-brand-primary',
  },
  pink: {
    chip: 'bg-brand-pink/15 text-brand-pink ring-brand-pink/25',
    tile: 'bg-brand-pink/10 ring-brand-pink/45',
    check: 'bg-brand-pink',
  },
};

/**
 * The occasion shelf. Each tile is one tappable answer ("style me for this"),
 * not a filter: it opens the fit sheet for that occasion and shows a spinner
 * in place while that fit is being built.
 *
 * `bleed` lets the rail scroll to the screen edge on its own (the page-level
 * use); pass false when it sits inside a card, where its padding is the bound.
 */
export default function OccasionRail({
  onSelect,
  active,
  loadingKey = null,
  className = '',
  bleed = true,
}) {
  return (
    <div
      role="group"
      aria-label="Style me for"
      className={`no-scrollbar flex gap-2.5 overflow-x-auto pt-1 pb-2 ${
        bleed ? '-mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8' : ''
      } ${className}`}
    >
      {OCCASIONS.map((occasion) => {
        const isActive = active === occasion.key;
        const isLoading = loadingKey === occasion.key;
        const tone = TONES[occasion.tone] ?? TONES.violet;

        return (
          <button
            key={occasion.key}
            type="button"
            aria-pressed={isActive}
            aria-busy={isLoading || undefined}
            onClick={() => onSelect?.(occasion.key)}
            className={`press relative flex w-[84px] shrink-0 flex-col items-center gap-2 overflow-hidden rounded-3xl px-2 pt-3 pb-2.5 ring-1 outline-none focus-visible:ring-2 focus-visible:ring-brand-primary md:w-[96px] ${
              isActive ? tone.tile : 'hover-lift glass-tile ring-white/10'
            }`}
          >
            <span
              className={`relative grid h-11 w-11 place-items-center rounded-2xl text-xl ring-1 ${tone.chip}`}
            >
              {isLoading ? (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white"
                />
              ) : (
                <span aria-hidden="true">{occasion.emoji}</span>
              )}
            </span>

            <span
              className={`relative max-w-full truncate text-[11px] font-bold tracking-tight ${
                isActive ? 'text-white' : 'text-white/70'
              }`}
            >
              {occasion.label}
            </span>

            {isActive ? (
              <span
                aria-hidden="true"
                className={`absolute top-1.5 right-1.5 grid h-4 w-4 place-items-center rounded-full text-black ${tone.check}`}
              >
                <CheckIcon className="h-3 w-3" strokeWidth={3} />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
