import { Sheet } from 'konsta/react';

/* Konsta's Sheet is a phone bottom sheet. At `lg` and up the `.sheet-desktop`
   rule in main.css repositions the very same element into a centred modal, so
   the interaction adapts to the viewport without any JS media query — this app
   is server-rendered by the smoke test, where `window.matchMedia` does not
   exist. Same props as Konsta's Sheet. */
export default function ResponsiveSheet({ opened, className = '', children, ...rest }) {
  return (
    <Sheet
      opened={opened}
      data-state={opened ? 'open' : 'closed'}
      className={`sheet-desktop ${className}`}
      {...rest}
    >
      {children}
    </Sheet>
  );
}
