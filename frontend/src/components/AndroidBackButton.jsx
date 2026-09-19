import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App as NativeApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/* Home is the end of the visit chain: back retraces the pages the user actually
   walked through, and only home closes the app. */
const EXIT_PATH = '/';

/**
 * Routes Android's hardware/gesture back button through the app's own history.
 *
 * Capacitor's Android shell has no back handling of its own — the core bridge
 * never touches `onBackPressed` — so without a `backButton` listener the press
 * falls straight through to the Activity and closes the app from whatever
 * screen the user happens to be on. Registering the listener also takes over
 * from Capacitor's own behaviour, which is why the exit has to be requested
 * explicitly with `exitApp()`.
 *
 * Renders nothing; it exists so the wiring can live inside the router.
 */
export default function AndroidBackButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  /* The listener is registered once and reads the route through a ref, so a
     navigation never has to tear the native subscription down and re-add it. */
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    /* The browser already has a back button; only the packaged app needs this. */
    if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('App')) return undefined;

    let cancelled = false;
    let handle = null;

    NativeApp.addListener('backButton', ({ canGoBack }) => {
      /* `canGoBack` is the WebView's history — the same stack the router walks,
         so an exhausted stack means this is the first screen of the session. */
      if (pathnameRef.current === EXIT_PATH || !canGoBack) {
        NativeApp.exitApp();
        return;
      }
      navigate(-1);
    }).then((registered) => {
      if (cancelled) registered.remove();
      else handle = registered;
    });

    return () => {
      cancelled = true;
      handle?.remove();
    };
  }, [navigate]);

  return null;
}
