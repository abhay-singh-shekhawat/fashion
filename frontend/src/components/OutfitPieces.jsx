import { CATEGORY_EMOJI } from '../config/theme';

/* Slot order matches what the suggestion endpoints return; a slot the wardrobe
   can't fill comes back null and is skipped. */
const SLOTS = ['top', 'bottom', 'layer', 'piece'];

export default function OutfitPieces({ outfit }) {
  const pieces = SLOTS.map((slot) => ({ slot, item: outfit?.[slot] })).filter(
    ({ item }) => item?.name || item?.category,
  );

  if (!pieces.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {pieces.map(({ slot, item }) => (
        <div
          key={slot}
          className="flex items-center gap-2 rounded-2xl bg-white/[0.04] p-2 ring-1 ring-white/10"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/[0.05] ring-1 ring-white/10">
            {item.image ? (
              <img src={item.image} alt={item.name ?? ''} className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg">{CATEGORY_EMOJI[item.category] ?? '👕'}</span>
            )}
          </span>
          <span className="truncate text-xs font-semibold text-white/75">
            {item.name ?? item.category}
          </span>
        </div>
      ))}
    </div>
  );
}
