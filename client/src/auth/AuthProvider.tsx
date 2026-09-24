import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { apiGet, ApiError } from '../lib/api';
import type { SessionUser } from '../types';

type Ctx = {
  user: SessionUser | null;
  loading: boolean;
  setUser: (u: SessionUser | null) => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function useAuth(): Ctx {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      loading: false,
      setUser: () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { user: u } = await apiGet<{ user: SessionUser }>('/api/auth/me');
      setUser(u);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setUser(null);
      else setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
