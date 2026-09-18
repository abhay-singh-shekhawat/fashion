const TONES = {
  default: 'text-white',
  lime: 'text-brand-lime',
  violet: 'text-brand-primary',
  cyan: 'text-brand-cyan',
  amber: 'text-brand-amber',
};

/** Compact figure + caption, used for the stat rows that replace dense grids. */
export default function StatTile({ value, label, tone = 'default', className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p
        className={`font-display text-xl leading-none font-bold tracking-tight tabular-nums ${
          TONES[tone] ?? TONES.default
        }`}
      >
        {value}
      </p>
      <p className="mt-1 truncate text-[10px] font-bold tracking-[0.14em] text-white/35 uppercase">
        {label}
      </p>
    </div>
  );
}
