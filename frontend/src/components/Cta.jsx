import { Button, Preloader } from 'konsta/react';

/* Glow is opt-in. The reference uses flat, high-contrast capsules with no
   bloom, so violet-on-black reads as the primary action through colour alone. */
const TONES = {
  primary: {
    color: 'k-color-brand-primary',
    glow: 'shadow-[0_10px_34px_-12px_rgba(168,85,247,0.85)]',
  },
  lime: {
    color: 'k-color-brand-lime',
    glow: 'shadow-[0_10px_34px_-12px_rgba(198,255,61,0.75)]',
  },
  cyan: {
    color: 'k-color-brand-cyan',
    glow: 'shadow-[0_10px_34px_-12px_rgba(34,211,238,0.75)]',
  },
  error: {
    color: 'k-color-brand-error',
    glow: 'shadow-[0_10px_34px_-12px_rgba(255,59,92,0.75)]',
  },
};

export default function Cta({
  tone = 'primary',
  glow = false,
  loading = false,
  children,
  className = '',
  ...rest
}) {
  const theme = TONES[tone] ?? TONES.primary;
  const classes = [theme.color, glow && theme.glow, 'font-bold tracking-tight', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Button rounded large className={classes} {...rest}>
      {loading ? <Preloader className="h-5 w-5" /> : children}
    </Button>
  );
}
