export default function Fab({ onClick, icon, label, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      /* The one floating action, in the same champagne metal as every other
         primary: dark text on a light fill, and a shadow warm enough to read as
         a lift rather than a smudge. */
      className={`press fixed right-4 bottom-safe-24 z-20 flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-primary to-brand-lime px-5 py-4 font-semibold text-ink-950 shadow-[0_14px_34px_-14px_rgba(223,195,169,0.55)] lg:right-8 lg:bottom-8 ${className}`}
    >
      {icon}
      {label ? <span className="text-sm tracking-tight">{label}</span> : null}
    </button>
  );
}
