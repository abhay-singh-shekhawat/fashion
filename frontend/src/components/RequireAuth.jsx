import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';

/**
 * Gates the authenticated shell.
 *
 * This deliberately does NOT wait for GET /profile/get/profile to resolve.
 * Blocking the first paint on a remote round-trip is what made reloads feel
 * slow, so the shell renders immediately and we only redirect once a 404
 * positively confirms the profile has never been created. Network failures
 * fall through rather than trapping the user on a spinner.
 */
export default function RequireAuth({ children }) {
  const { token } = useAuth();
  const location = useLocation();
  const { isError, error } = useProfile();

  if (!token) {
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  }

  if (isError && error?.response?.status === 404) {
    return <Navigate to="/auth/onboarding" replace />;
  }

  return children;
}
