export default function Field({ label, hint, error, className = '', as = 'input', children, ...rest }) {
  const Tag = as;

  /* Inputs keep a mutable border colour (focus, error) rather than the gradient
     rim the cards wear — a transparent border with a gradient behind it cannot
     also turn red. They get the glass reading from the translucent fill, the
     inner highlight and the same low bloom instead. */
  const baseClass = `w-full rounded-2xl border bg-ink-900/70 px-5 py-3.5 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_20px_-12px_rgba(223,195,169,0.35)] outline-none backdrop-blur-md transition-colors duration-200 placeholder:text-white/25 focus:border-brand-primary/60 focus:ring-1 focus:ring-brand-primary/40 ${
    error ? 'border-brand-error/60' : 'border-white/[0.08]'
  }`;

  return (
    <label className={`block ${className}`}>
      {label ? (
        <span className="mb-1.5 block text-[10px] font-bold tracking-[0.16em] text-white/40 uppercase">
          {label}
        </span>
      ) : null}

      {children ?? <Tag className={baseClass} {...rest} />}

      {error ? <span className="mt-1.5 block text-xs text-brand-error">{error}</span> : null}
      {hint && !error ? (
        <span className="mt-1.5 block text-xs text-white/35">{hint}</span>
      ) : null}
    </label>
  );
}
