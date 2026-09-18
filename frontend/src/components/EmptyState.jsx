export default function EmptyState({ icon, title, body, children, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center gap-3 px-6 py-12 text-center md:px-8 ${className}`}
    >
      {icon ? (
        <div className="grid h-16 w-16 place-items-center rounded-card bg-white/[0.05] text-white/40 ring-1 ring-white/10">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-lg font-bold tracking-tight text-white/90">{title}</h3>
      {body ? <p className="max-w-xs text-sm leading-relaxed text-white/45 text-pretty">{body}</p> : null}
      {children ? <div className="mt-2 flex flex-col items-center gap-2">{children}</div> : null}
    </div>
  );
}
