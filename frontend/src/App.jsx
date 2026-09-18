import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import { persistQueryCache } from './config/persistCache';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import RequireAuth from './components/RequireAuth';
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

export default function App() {
  /* Keeps localStorage in sync so the next reload paints instantly. */
  useEffect(() => persistQueryCache(queryClient), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
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
                <Route path="/" element={<Today />} />
                <Route path="/wardrobe" element={<Wardrobe />} />
                <Route path="/wardrobe/add" element={<AddItem />} />
                <Route path="/scan" element={<ScanOutfit />} />
                <Route path="/stylist" element={<Stylist />} />
                <Route path="/rate" element={<Rate />} />
                <Route path="/rate/photo" element={<RatePhoto />} />
                <Route path="/rate/saved" element={<RateSaved />} />
                <Route path="/rate/history" element={<RatingHistory />} />
                <Route path="/rate/history/:id" element={<RatingDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/edit" element={<EditProfile />} />
                <Route path="/profile/skin" element={<SkinToneScan />} />
                <Route path="/profile/progress" element={<ProgressPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
