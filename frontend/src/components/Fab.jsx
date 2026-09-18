export default function Fab({ onClick, icon, label, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press fixed right-4 bottom-safe-24 z-20 flex items-center gap-2 rounded-full bg-brand-primary px-5 py-4 font-bold text-white ring-1 ring-white/20 lg:right-8 lg:bottom-8 ${className}`}
    >
      {icon}
      {label ? <span className="text-sm tracking-tight">{label}</span> : null}
    </button>
  );
}
