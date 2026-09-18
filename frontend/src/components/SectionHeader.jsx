/**
 * Section heading with an optional accent action, mirroring the reference's
 * "title + View more" pattern. The action uses the lime accent on purpose —
 * it is an emphasis affordance, not a primary CTA.
 */
export default function SectionHeader({ eyebrow, title, action, onAction, className = '' }) {
  return (
    <div className={`flex items-end justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display truncate text-lg font-bold tracking-tight text-white">
          {title}
        </h2>
      </div>

      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="press shrink-0 pb-0.5 text-xs font-bold tracking-wide text-brand-lime uppercase"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}
