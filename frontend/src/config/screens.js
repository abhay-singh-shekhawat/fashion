/* Route → navbar metadata. The tab/rail destinations live in `nav.js` so that
   the phone bar and the desktop rail read from one list. */
const SCREENS = [
  { pattern: /^\/$/, title: 'Today', large: true },
  { pattern: /^\/wardrobe$/, title: 'Closet', large: true },
  { pattern: /^\/wardrobe\/add$/, title: 'Add item' },
  { pattern: /^\/scan$/, title: 'Scan fit' },
  { pattern: /^\/stylist$/, title: 'Stylist' },
  { pattern: /^\/rate$/, title: 'Rate', large: true },
  { pattern: /^\/rate\/photo$/, title: 'Rate a fit' },
  { pattern: /^\/rate\/saved$/, title: 'Rate from closet' },
  { pattern: /^\/rate\/history$/, title: 'Saved ratings', large: true },
  { pattern: /^\/rate\/history\/[^/]+$/, title: 'Saved fit' },
  { pattern: /^\/profile$/, title: 'You', large: true },
  { pattern: /^\/profile\/edit$/, title: 'Edit profile' },
  { pattern: /^\/profile\/skin$/, title: 'Skin tone' },
  { pattern: /^\/profile\/progress$/, title: 'Progress' },
  { pattern: /^\/onboarding$/, title: 'Set up' },
  { pattern: /^\/auth\/login$/, title: 'Log in' },
  { pattern: /^\/auth\/register$/, title: 'Create account' },
  { pattern: /^\/auth\/forgot$/, title: 'Forgot password' },
  { pattern: /^\/auth\/reset$/, title: 'New password' },
];

export function getScreenMeta(pathname) {
  return SCREENS.find((screen) => screen.pattern.test(pathname)) ?? { title: 'StyleSense' };
}
