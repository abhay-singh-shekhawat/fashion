import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { App, Navbar, NavbarBackLink, Page } from 'konsta/react';
import { getScreenMeta } from '../config/screens';

export default function AuthShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const meta = getScreenMeta(pathname);

  return (
    <App theme="ios" dark safeAreas className="min-h-dvh bg-ink-950">
      <Page colors={{ bgIos: 'bg-ink-950', bgMaterial: 'bg-ink-950' }}>
        <Navbar
          title={meta.title}
          /* Matches the app shell: the header scrolls with the page rather than
             pinning over it (see `navbar-inline` in main.css). */
          className="navbar-inline"
          bgClassName="bg-ink-950/70 backdrop-blur-xl border-b border-white/10 shadow-[0_12px_34px_-26px_rgba(223,195,169,0.55)]"
          titleClassName="font-display font-bold tracking-tight"
          left={
            pathname !== '/auth/login' ? (
              <NavbarBackLink text="Back" onClick={() => navigate(-1)} />
            ) : undefined
          }
        />

        {/* Forms read better as a centred column than stretched across a wide
            viewport. Below md this is simply full width. */}
        <div className="mx-auto w-full max-w-[28rem]">
          <Outlet />
        </div>
      </Page>
    </App>
  );
}
