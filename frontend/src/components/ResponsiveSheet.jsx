import { Sheet } from 'konsta/react';

/* Konsta's Sheet is a phone bottom sheet and its backdrop is a flat 50% black.
   Two deliberate changes:
   
   1. The scrim is ours, so it can blur the app behind it. Konsta renders its own
      backdrop with no hook to style it, and passing `backdrop={false}` is the
      only way to control it.
   2. `.glass-modal` (main.css) repositions the very same sheet element into the
      middle of the screen at every width, on the same glass as the cards, so a
      component the user taps pops out over a blurred page instead of sliding up
      from the bottom edge.
   
   Both are CSS rather than a JS media query on purpose: the smoke test renders
   these routes to string, where `window.matchMedia` does not exist.
   
   Same props as Konsta's Sheet. */
export default function ResponsiveSheet({
  opened,
  className = '',
  children,
  onBackdropClick,
  ...rest
}) {
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onBackdropClick}
        className={`fixed inset-0 z-40 bg-ink-950/55 backdrop-blur-xl transition-opacity duration-300 ${
          opened ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <Sheet
        opened={opened}
        backdrop={false}
        data-state={opened ? 'open' : 'closed'}
        className={`glass-modal ${className}`}
        {...rest}
      >
        {children}
      </Sheet>
    </>
  );
}
