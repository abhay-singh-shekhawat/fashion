import { CATEGORY_EMOJI, CATEGORY_LABELS, FORMALITY_LABELS } from '../config/theme';
import Pill from './Pill';

/* The tile language from the reference: a full-bleed portrait crop carrying a
   badge, then a meta block led by a serif title, a quiet material line, and the
   tags. The photo is placed absolutely and the box clips it — a grid-centred
   image whose percentage size doesn't resolve falls back to its intrinsic size
   and paints straight over the next tile. */
export default function ItemCard({ item, onClick, selected = false, selectable = false }) {
  const Tag = onClick ? 'button' : 'div';

  const color = item.color && item.color !== 'unknown' ? item.color : null;
  /* Only AI-read pieces wear a badge: on a hand-added item it would be the
     default state and therefore noise. */
  const provenance =
    item.detectedBy === 'scanner' ? 'Scanned' : item.detectedBy === 'ai' ? 'AI detected' : null;

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`glass press group w-full overflow-hidden p-0 text-left ${
        selected ? 'ring-2 ring-brand-primary' : 'hover-lift'
      }`}
    >
      <div className="relative isolate grid aspect-[4/5] w-full place-items-center overflow-hidden bg-gradient-to-br from-white/[0.06] to-transparent">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="text-4xl opacity-60">{CATEGORY_EMOJI[item.category] ?? '🧺'}</span>
        )}

        {/* Legibility scrim for the badge on a bright photo. */}
        {provenance ? (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-950/80 to-transparent"
          />
        ) : null}

        {provenance ? (
          <span className="absolute bottom-2.5 left-2.5 rounded-full border border-white/[0.08] bg-ink-950/80 px-2.5 py-0.5 text-[10px] font-medium tracking-wider text-brand-primary uppercase backdrop-blur-md">
            {provenance}
          </span>
        ) : null}

        {selectable ? (
          <span
            className={`absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full ring-1 backdrop-blur-md transition-colors ${
              selected
                ? 'bg-brand-primary text-ink-950 ring-brand-primary'
                : 'bg-black/40 ring-white/20'
            }`}
          >
            {selected ? '✓' : ''}
          </span>
        ) : null}
      </div>

      <div className="space-y-1.5 p-3.5">
        <p className="font-display truncate text-[15px] leading-snug font-medium tracking-tight">
          {item.name}
        </p>
        {color ? <p className="truncate text-[11px] text-white/40 capitalize">{color}</p> : null}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Pill tone="violet">{CATEGORY_LABELS[item.category] ?? item.category}</Pill>
          {item.formality && item.formality !== 'unknown' ? (
            <Pill>{FORMALITY_LABELS[item.formality] ?? item.formality}</Pill>
          ) : null}
        </div>
      </div>
    </Tag>
  );
}
