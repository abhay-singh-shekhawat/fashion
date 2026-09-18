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
import { getScreenMeta } from '../config/screens';
import { MOBILE_TABS, SCAN_ACTION, SCAN_SLOT, isTabPath } from '../config/nav';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { SparkleIcon } from '../components/Icons';
import SideRail from '../components/SideRail';

export default function MobileShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const meta = getScreenMeta(pathname);
  const tabbed = isTabPath(pathname);
  const { Icon: ScanIcon } = SCAN_ACTION;

  useNotifications();

  const initial = user?.name?.trim().charAt(0).toUpperCase() || 'S';

  /* The user's mark in the corner of every tab, where a back arrow would be on
     a detail screen. The desktop rail carries the same affordance, so this one
     steps aside at lg. */
  const avatar = (
    <button
      type="button"
      onClick={() => navigate('/profile')}
      aria-label="Your profile"
      className="press grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-primary/30 to-brand-cyan/20 ring-1 ring-white/15 lg:hidden"
    >
      <span className="font-display text-sm font-bold">{initial}</span>
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
        className={tabbed ? 'pb-safe-24 lg:pb-10' : 'pb-safe-10 lg:pb-10'}
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
                 pinning the avatar and title over the content. */
              className="navbar-inline"
              bgClassName="bg-ink-950/75 backdrop-blur-xl border-b border-white/10"
              titleClassName="font-display font-bold tracking-tight"
              left={
                tabbed ? avatar : <NavbarBackLink text="Back" onClick={() => navigate(-1)} />
              }
              /* Stylist is not one of the four phone tabs, so the header carries
                 it on every tab. The desktop rail has it directly, so it hides.
                 On home it is the featured treatment — filled, with a highlight
                 that sweeps across — because it is the app's signature action;
                 elsewhere it steps back to an outline. */
              right={
                tabbed ? (
                  <StylistAction
                    featured={pathname === '/'}
                    onClick={() => navigate('/stylist')}
                  />
                ) : undefined
              }
            />

            <Outlet />
          </div>
        </div>

        {tabbed ? (
          <Tabbar
            labels
            icons
            className="left-0 right-0 bottom-0 fixed z-30 lg:hidden"
            bgClassName="bg-ink-950/85 backdrop-blur-xl border-t border-white/10"
          >
            <ToolbarPane>
              {MOBILE_TABS.slice(0, SCAN_SLOT).map(renderTab)}

              {/* Not a tab: nothing to be "active" on, it just opens the scanner. */}
              <TabbarLink
                onClick={() => navigate(SCAN_ACTION.path)}
                label={SCAN_ACTION.label}
                icon={
                  <span className="-mt-3 grid h-11 w-11 place-items-center rounded-full bg-brand-primary text-white shadow-[0_10px_30px_-10px_rgba(168,85,247,0.9)] ring-1 ring-white/20">
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
      className={`press relative inline-flex items-center gap-1.5 overflow-hidden rounded-full px-3.5 py-1.5 text-xs font-bold lg:hidden ${
        featured
          ? 'bg-brand-primary text-white ring-1 ring-white/20'
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
      <span className="relative">Stylist</span>
    </button>
  );
}
