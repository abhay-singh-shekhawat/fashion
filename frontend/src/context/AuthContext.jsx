import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ENDPOINTS } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { clearPersistedQueryCache } from '../config/persistCache';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('authUser') ?? 'null');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));
  const [user, setUser] = useState(readStoredUser);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      setSocket(null);
      return;
    }
    setSocket(connectSocket());
  }, [token]);

  const persist = useCallback((accessToken, nextUser) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('authUser', JSON.stringify(nextUser));
    setToken(accessToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post(ENDPOINTS.login, { email, password });
      persist(data.accessToken, data.user);
      return data.user;
    },
    [persist],
  );

  const register = useCallback(
    async (name, email, password) => {
      const { data } = await api.post(ENDPOINTS.register, { name, email, password });
      persist(data.accessToken, data.user);
      return data.user;
    },
    [persist],
  );

  /* The name lives on the user, so renaming yourself has to update this
     context too — the greeting, the avatar initial and the profile card all
     read from here. */
  const updateName = useCallback(async (name) => {
    const { data } = await api.put(ENDPOINTS.me, { name });
    const nextUser = { ...(readStoredUser() ?? {}), ...data.user };
    localStorage.setItem('authUser', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }, []);

  /* The backend has no /logout route, so this is a pure client-side purge. */
  const logout = useCallback(() => {
    disconnectSocket();
    clearPersistedQueryCache();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
    setSocket(null);
  }, []);

  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const value = useMemo(
    () => ({ token, user, socket, isAuthenticated: Boolean(token), login, register, updateName, logout }),
    [token, user, socket, login, register, updateName, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
