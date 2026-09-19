import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  App,
  Navbar,
  NavbarBackLink,
  Page,
  Tabbar,
  TabbarLink,
  ToolbarPane,
} from 'konsta/react';
import { getScreenMeta, isPanelPath } from '../config/screens';
import { MOBILE_TABS, SCAN_ACTION, SCAN_SLOT, isTabPath } from '../config/nav';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { useProgress } from '../hooks/useProgress';
import { useRatingHistory } from '../hooks/useRatingHistory';
import { SparkleIcon } from '../components/Icons';
import SideRail from '../components/SideRail';
import logo from '../assets/icon.png';

export default function MobileShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const meta = getScreenMeta(pathname);
  const isTab = isTabPath(pathname);
  /* The footer stays mounted for a panel route too. On a background render the
     path is the page behind it (a tab), and on a direct load of a panel route
     the tab bar is what keeps the screen's own controls reachable — it used to
     vanish the moment the scanner opened, taking the scan button with it. */
  const withChrome = isTab || isPanelPath(pathname);
  const { Icon: ScanIcon } = SCAN_ACTION;

  useNotifications();

  const initial = user?.name?.trim().charAt(0).toUpperCase() || 'S';

  /* The dot on the profile is a real nudge, not decoration: it appears only
     when there is a streak worth protecting and today has nothing rated yet. */
  const progress = useProgress();
  const ratings = useRatingHistory();
  const ratedToday = (ratings.data ?? []).some(
    (entry) => new Date(entry?.createdAt).toDateString() === new Date().toDateString(),
  );
  const nudge = (progress.data?.currentStreak ?? 0) > 0 && !ratedToday;

  /* The brand mark holds the left corner on every tab, and the person sits on
     the right beside the stylist — where the reference puts both. The desktop
     rail carries the same profile entry, so this one steps aside at lg. */
  const brand = (
    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl ring-1 ring-white/[0.12]">
      <img src={logo} alt="" className="h-full w-full object-cover" />
    </span>
  );

  const profileButton = (
    <button
      type="button"
      onClick={() => navigate('/profile')}
      aria-label={nudge ? 'Your profile — keep your streak alive' : 'Your profile'}
      title={nudge ? 'Nothing rated today — keep the streak alive' : undefined}
      className="press relative grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-primary/30 to-brand-lime/20 ring-1 ring-white/[0.15] lg:hidden"
    >
      <span className="font-display text-sm font-medium">{initial}</span>
      {nudge ? (
        <span className="absolute -top-0.5 -right-0.5 grid h-3 w-3 place-items-center">
          <span
            aria-hidden="true"
            className="absolute h-full w-full animate-ping rounded-full bg-brand-primary opacity-60"
          />
          <span className="relative h-2 w-2 rounded-full bg-brand-primary ring-2 ring-ink-950" />
        </span>
      ) : null}
    </button>
  );

  const renderTab = (tab) => {
    const { Icon, path, label } = tab;
    const active = pathname === path;

    return (
      <TabbarLink
        key={path}
        active={active}
        onClick={() => navigate(path)}
        label={label}
        icon={<Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.8} />}
      />
    );
  };

  return (
    <App theme="ios" dark safeAreas className="min-h-dvh bg-ink-950">
      {/* pb-safe-24 clears the fixed Tabbar including the home indicator; at lg
          the rail replaces the Tabbar so that reservation is dropped.
          colors override Konsta's default Page surface with our obsidian base. */}
      <Page
        className={withChrome ? 'pb-safe-24 lg:pb-10' : 'pb-safe-10 lg:pb-10'}
        colors={{ bgIos: 'bg-ink-950', bgMaterial: 'bg-ink-950' }}
      >
        <SideRail pathname={pathname} />

        {/* lg:pl-[88px] clears the fixed rail; the inner cap stops the phone
            column stretching edge-to-edge on a wide monitor. */}
        <div className="lg:pl-[88px]">
          <div className="mx-auto w-full max-w-[1240px]">
            <Navbar
              title={meta.title}
              large={meta.large}
              /* `navbar-inline` (see main.css) cancels Konsta's built-in
                 `sticky` so the header scrolls away with the page instead of
                 pinning the brand and title over the content. */
              className="navbar-inline"
              bgClassName="bg-ink-950/70 backdrop-blur-xl border-b border-white/10 shadow-[0_12px_34px_-26px_rgba(223,195,169,0.55)]"
              titleClassName="font-display font-bold tracking-tight"
              /* Keyed on the tab, not on the chrome: a panel route rendered on
                 its own (a refresh, a shared link) still needs a way back. */
              left={isTab ? brand : <NavbarBackLink text="Back" onClick={() => navigate(-1)} />}
              /* Stylist is not one of the four phone tabs, so the header carries
                 it on every tab. The desktop rail has it directly, so it hides.
                 On home it is the featured treatment — filled, with a highlight
                 that sweeps across — because it is the app's signature action;
                 elsewhere it steps back to an outline. */
              right={
                isTab ? (
                  <span className="flex items-center gap-2">
                    <StylistAction
                      featured={pathname === '/'}
                      onClick={() => navigate('/stylist')}
                    />
                    {profileButton}
                  </span>
                ) : undefined
              }
            />

            <Outlet />
          </div>
        </div>

        {withChrome ? (
          <Tabbar
            labels
            icons
            className="left-0 right-0 bottom-0 fixed z-30 lg:hidden"
            bgClassName="bg-ink-950/80 backdrop-blur-xl border-t border-white/10 shadow-[0_-12px_34px_-26px_rgba(223,195,169,0.5)]"
          >
            <ToolbarPane>
              {MOBILE_TABS.slice(0, SCAN_SLOT).map(renderTab)}

              {/* Not a tab: nothing to be "active" on, it just opens the scanner.
                  Wears the same treatment as the home screen's "Style me for…"
                  panel — champagne gradient over the glass, a brand hairline, a
                  bloom — with the icon padded inside it rather than filling it. */}
              <TabbarLink
                onClick={() => navigate(SCAN_ACTION.path)}
                label={SCAN_ACTION.label}
                icon={
                  <span className="-mt-4 grid h-14 w-14 place-items-center rounded-2xl border border-brand-primary/25 bg-gradient-to-br from-brand-primary/[0.22] via-ink-900/80 to-brand-indigo/[0.24] p-3.5 text-brand-primary shadow-[0_18px_40px_-18px_rgba(223,195,169,0.65)] backdrop-blur-xl">
                    <ScanIcon className="h-5 w-5" strokeWidth={2.4} />
                  </span>
                }
              />

              {MOBILE_TABS.slice(SCAN_SLOT).map(renderTab)}
            </ToolbarPane>
          </Tabbar>
        ) : null}
      </Page>
    </App>
  );
}

/* Two weights of the same action. `featured` is the home treatment: filled,
   with a highlight that sweeps across and then rests off-screen. The sparkle
   sits above the sweep so it stays crisp. */
function StylistAction({ featured, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press relative inline-flex items-center gap-1.5 overflow-hidden rounded-full px-3.5 py-1.5 text-[10px] font-bold tracking-[0.14em] uppercase lg:hidden ${
        featured
          ? 'bg-gradient-to-r from-brand-primary to-brand-lime text-ink-950 ring-1 ring-white/15'
          : 'bg-brand-primary/15 text-brand-primary ring-1 ring-brand-primary/30'
      }`}
    >
      {featured ? (
        <span
          aria-hidden="true"
          className="animate-sheen pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent"
        />
      ) : null}
      <SparkleIcon className="relative h-4 w-4" strokeWidth={featured ? 2.1 : 1.8} />
      <span className="relative whitespace-nowrap">Stylist AI</span>
    </button>
  );
}
