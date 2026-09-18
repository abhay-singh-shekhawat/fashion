export default function Field({ label, hint, error, className = '', as = 'input', children, ...rest }) {
  const Tag = as;

  /* Capsule input, matching the reference's ~48px pill search field. */
  const baseClass = `w-full rounded-full border bg-white/[0.04] px-5 py-3.5 text-[15px] text-white outline-none backdrop-blur-md transition-colors duration-200 placeholder:text-white/25 focus:border-brand-primary/60 focus:ring-1 focus:ring-brand-primary/40 ${
    error ? 'border-brand-error/60' : 'border-white/10'
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
