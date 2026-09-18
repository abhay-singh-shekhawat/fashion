import {
  ClosetIcon,
  HomeIcon,
  PlusIcon,
  SparkleIcon,
  StarIcon,
  UserIcon,
} from '../components/Icons';

/* Single source of truth for navigation. The phone tab bar and the desktop
   side rail both read from here, so they cannot drift apart.

   `desktopOnly` exists because the phone bar has room for four destinations
   plus the raised scan action — a fifth tab would crowd it. Stylist is reached
   on phones from the header button instead. */
export const NAV_ITEMS = [
  { path: '/', label: 'Today', Icon: HomeIcon },
  { path: '/rate', label: 'Rate', Icon: StarIcon },
  { path: '/stylist', label: 'Stylist', Icon: SparkleIcon, desktopOnly: true },
  { path: '/wardrobe', label: 'Closet', Icon: ClosetIcon },
  { path: '/profile', label: 'You', Icon: UserIcon },
];

export const SCAN_ACTION = { path: '/scan', label: 'Scan', Icon: PlusIcon };

export const MOBILE_TABS = NAV_ITEMS.filter((item) => !item.desktopOnly);

/* The scan action takes the middle slot, so the phone bar reads
   [Today, Rate, +, Closet, You]. */
export const SCAN_SLOT = Math.floor(MOBILE_TABS.length / 2);

export const isTabPath = (pathname) => MOBILE_TABS.some((tab) => tab.path === pathname);

/** True on any destination the side rail highlights, tabs included. */
export const isNavPath = (pathname) => NAV_ITEMS.some((item) => item.path === pathname);
