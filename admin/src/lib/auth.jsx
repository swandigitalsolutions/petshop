import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, getToken, setToken } from './api.js';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const qc = useQueryClient();

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then((u) => (['admin', 'staff'].includes(u.role) ? setUser(u) : setToken(null)))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: u } = await api('/auth/login', { method: 'POST', body: { email, password, admin: true }, auth: false });
    setToken(token);
    setUser(u);
  }, []);
  const logout = useCallback(() => { setToken(null); setUser(null); qc.clear(); }, [qc]);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
