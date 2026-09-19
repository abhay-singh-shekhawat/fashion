import { Button, Preloader } from 'konsta/react';

/* The action language: a champagne fill carrying dark warm text, the way the
   reference caps every screen.
   
   Konsta's own fill pair paints white text on the brand colour, which dies the
   moment the brand becomes a light metal — hence the `colors` override, which
   replaces its fill background and fill text wholesale.

   `primary` and `lime` are the same treatment on purpose: callers picked
   between them when one was violet and one was lime, but in this palette both
   mean "the single main action on this screen". */
const CHAMPAGNE = {
  fillBgIos: 'bg-gradient-to-r from-brand-primary to-brand-lime active:opacity-90',
  fillTextIos: 'text-ink-950',
};

const TONES = {
  primary: {
    colors: CHAMPAGNE,
    glow: 'shadow-[0_16px_36px_-16px_rgba(223,195,169,0.5)]',
  },
  lime: {
    colors: CHAMPAGNE,
    glow: 'shadow-[0_16px_36px_-16px_rgba(223,195,169,0.5)]',
  },
  /* Secondary action: a raised warm surface rather than a second bright fill,
     so a screen never shows two competing accents. */
  cyan: {
    colors: {
      fillBgIos: 'bg-ink-800 active:bg-ink-700',
      fillTextIos: 'text-white',
    },
    glow: 'shadow-[0_16px_36px_-18px_rgba(0,0,0,0.9)]',
  },
  error: {
    colors: {
      fillBgIos: 'bg-brand-error active:opacity-90',
      fillTextIos: 'text-ink-950',
    },
    glow: 'shadow-[0_16px_36px_-16px_rgba(255,180,171,0.4)]',
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
  const classes = [glow && theme.glow, 'font-semibold tracking-tight', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Button rounded large colors={theme.colors} className={classes} {...rest}>
      {loading ? <Preloader className="h-5 w-5" /> : children}
    </Button>
  );
}
