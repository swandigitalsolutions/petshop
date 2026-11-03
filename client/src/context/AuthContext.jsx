import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, getToken, setToken } from '../lib/api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const qc = useQueryClient();

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: u } = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false });
    setToken(token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const { token, user: u } = await api('/auth/register', { method: 'POST', body: payload, auth: false });
    setToken(token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    qc.removeQueries({ queryKey: ['me'] });
  }, [qc]);

  const refresh = useCallback(async () => setUser(await api('/auth/me')), []);

  const value = useMemo(() => ({ user, setUser, loading, login, register, logout, refresh }), [user, loading, login, register, logout, refresh]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
