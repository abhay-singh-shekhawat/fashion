import { CATEGORY_EMOJI, CATEGORY_LABELS, FORMALITY_LABELS } from '../config/theme';
import Pill from './Pill';

export default function ItemCard({ item, onClick, selected = false, selectable = false }) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`glass press group w-full overflow-hidden p-0 text-left ${
        selected ? 'ring-2 ring-brand-primary' : 'hover-lift'
      }`}
    >
      {/* Portrait crop: clothing reads better tall, and the ratio keeps every
          tile the same shape across the 2-to-5 column range. The photo is
          placed absolutely and the box clips it — a grid-centred image whose
          percentage size doesn't resolve falls back to its intrinsic size and
          paints straight over the next tile. */}
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
        {selectable ? (
          <span
            className={`absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full ring-1 backdrop-blur-md transition-colors ${
              selected
                ? 'bg-brand-primary text-white ring-brand-primary'
                : 'bg-black/40 ring-white/20'
            }`}
          >
            {selected ? '✓' : ''}
          </span>
        ) : null}
      </div>

      <div className="space-y-2 p-3">
        <p className="truncate text-sm font-semibold text-white/90">{item.name}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone="violet">{CATEGORY_LABELS[item.category] ?? item.category}</Pill>
          {item.formality && item.formality !== 'unknown' ? (
            <Pill>{FORMALITY_LABELS[item.formality] ?? item.formality}</Pill>
          ) : null}
        </div>
      </div>
    </Tag>
  );
}
