const TONES = {
  neutral: 'bg-white/[0.06] text-white/60 ring-1 ring-white/10',
  violet: 'bg-brand-primary/15 text-brand-primary ring-1 ring-brand-primary/25',
  lime: 'bg-brand-lime/15 text-brand-lime ring-1 ring-brand-lime/25',
  cyan: 'bg-brand-cyan/15 text-brand-cyan ring-1 ring-brand-cyan/25',
  amber: 'bg-brand-amber/15 text-brand-amber ring-1 ring-brand-amber/25',
  pink: 'bg-brand-pink/15 text-brand-pink ring-1 ring-brand-pink/25',
  error: 'bg-brand-error/15 text-brand-error ring-1 ring-brand-error/25',
};

export default function Pill({ children, tone = 'neutral', className = '' }) {
  return <span className={`pill ${TONES[tone] ?? TONES.neutral} ${className}`}>{children}</span>;
}
