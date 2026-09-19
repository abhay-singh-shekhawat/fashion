import { useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import { persistQueryCache } from './config/persistCache';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import RequireAuth from './components/RequireAuth';
import AndroidBackButton from './components/AndroidBackButton';
import PanelFrame from './components/PanelFrame';
import { isPanelPath } from './config/screens';
import AuthShell from './layouts/AuthShell';
import MobileShell from './layouts/MobileShell';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Onboarding from './pages/auth/Onboarding';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Today from './pages/Today';
import Wardrobe from './pages/Wardrobe';
import Stylist from './pages/Stylist';
import Rate from './pages/Rate';
import Profile from './pages/Profile';
import AddItem from './pages/detail/AddItem';
import ScanOutfit from './pages/detail/ScanOutfit';
import RatePhoto from './pages/detail/RatePhoto';
import RateSaved from './pages/detail/RateSaved';
import RatingHistory from './pages/detail/RatingHistory';
import RatingDetail from './pages/detail/RatingDetail';
import SkinToneScan from './pages/detail/SkinToneScan';
import EditProfile from './pages/detail/EditProfile';
import ProgressPage from './pages/detail/ProgressPage';

/* The signed-in screens, declared once and rendered into both trees: inside the
   shell as the page the user is on, and bare as the panel that floats over the
   page they came from. Which screens arrive as panels is decided by
   `isPanelPath` (config/screens.js) rather than by a flag here — one list, so
   the route table and its presentation cannot disagree. */
const screenRoutes = [
  <Route key="/" path="/" element={<Today />} />,
  <Route key="/wardrobe" path="/wardrobe" element={<Wardrobe />} />,
  <Route key="/wardrobe/add" path="/wardrobe/add" element={<AddItem />} />,
  <Route key="/scan" path="/scan" element={<ScanOutfit />} />,
  <Route key="/stylist" path="/stylist" element={<Stylist />} />,
  <Route key="/rate" path="/rate" element={<Rate />} />,
  <Route key="/rate/photo" path="/rate/photo" element={<RatePhoto />} />,
  <Route key="/rate/saved" path="/rate/saved" element={<RateSaved />} />,
  <Route key="/rate/history" path="/rate/history" element={<RatingHistory />} />,
  <Route key="/rate/history/:id" path="/rate/history/:id" element={<RatingDetail />} />,
  <Route key="/profile" path="/profile" element={<Profile />} />,
  <Route key="/profile/edit" path="/profile/edit" element={<EditProfile />} />,
  <Route key="/profile/skin" path="/profile/skin" element={<SkinToneScan />} />,
  <Route key="/profile/progress" path="/profile/progress" element={<ProgressPage />} />,
];

/**
 * Renders the shell over the page the user was last *on*, then layers the panel
 * for whatever drill-down they opened on top of it.
 *
 * The page behind is a real render, not a screenshot: it is the same route tree
 * pinned to the previous location, which is why the blurred background is the
 * screen they actually came from. The previous location is remembered in a ref
 * rather than in navigation state, so a panel opened directly — a refresh, a
 * shared link — simply renders as a plain full page.
 */
function Routed() {
  const location = useLocation();
  const panel = isPanelPath(location.pathname);

  const backgroundRef = useRef(null);
  useEffect(() => {
    if (!panel) backgroundRef.current = location;
  }, [location, panel]);

  const background = panel ? backgroundRef.current : null;

  return (
    <>
      <Routes location={background ?? location}>
        <Route path="/auth" element={<AuthShell />}>
          <Route index element={<Navigate to="/auth/login" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot" element={<ForgotPassword />} />
          <Route path="reset" element={<ResetPassword />} />
          <Route path="onboarding" element={<Onboarding />} />
        </Route>

        <Route
          element={
            <RequireAuth>
              <MobileShell />
            </RequireAuth>
          }
        >
          {screenRoutes}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {background ? (
        <PanelFrame pathname={location.pathname}>
          {/* Bare: the panel is the screen itself, without a second shell. */}
          <Routes location={location}>{screenRoutes}</Routes>
        </PanelFrame>
      ) : null}
    </>
  );
}

export default function App() {
  /* Keeps localStorage in sync so the next reload paints instantly. */
  useEffect(() => persistQueryCache(queryClient), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AndroidBackButton />
            <Routed />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
