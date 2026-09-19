/* Route → navbar metadata, and which routes are *panels*.

   The tab destinations (today, closet, rate, you) are the app; everything
   reached by tapping a card, a row or a button inside them is a panel: it opens
   centred over a blurred shell instead of taking the whole screen. `panel` is
   the single place that decision lives, so a route cannot be half-presented. */
const SCREENS = [
  { pattern: /^\/$/, title: 'Today', large: true },
  { pattern: /^\/wardrobe$/, title: 'Closet', large: true },
  { pattern: /^\/wardrobe\/add$/, title: 'Add item', panel: true },
  { pattern: /^\/scan$/, title: 'Scan fit', panel: true },
  { pattern: /^\/stylist$/, title: 'Stylist' },
  { pattern: /^\/rate$/, title: 'Rate', large: true },
  { pattern: /^\/rate\/photo$/, title: 'Rate a fit', panel: true },
  { pattern: /^\/rate\/saved$/, title: 'Rate from closet', panel: true },
  { pattern: /^\/rate\/history$/, title: 'Saved ratings', panel: true },
  { pattern: /^\/rate\/history\/[^/]+$/, title: 'Saved fit', panel: true },
  { pattern: /^\/profile$/, title: 'You', large: true },
  { pattern: /^\/profile\/edit$/, title: 'Edit profile', panel: true },
  { pattern: /^\/profile\/skin$/, title: 'Skin tone', panel: true },
  { pattern: /^\/profile\/progress$/, title: 'Progress', panel: true },
  { pattern: /^\/onboarding$/, title: 'Set up' },
  { pattern: /^\/auth\/login$/, title: 'Log in' },
  { pattern: /^\/auth\/register$/, title: 'Create account' },
  { pattern: /^\/auth\/forgot$/, title: 'Forgot password' },
  { pattern: /^\/auth\/reset$/, title: 'New password' },
];

export function getScreenMeta(pathname) {
  return SCREENS.find((screen) => screen.pattern.test(pathname)) ?? { title: 'StyleSense' };
}

/** True for the drill-down screens that should float over the shell. */
export const isPanelPath = (pathname) =>
  Boolean(SCREENS.find((screen) => screen.panel && screen.pattern.test(pathname)));
