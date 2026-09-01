import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api";

export type UserRole = "OWNER" | "SUPER_ADMIN" | "USER" | "DELIVERY";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  balance: string;
  preferred_language: string | null;
  is_active: boolean;
};

export type RegisterInput = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: "consumer" | "courier";
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  /** True while the persisted session is being restored on first load. */
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => void;
  /** Replace the in-memory user after a profile update. */
  updateUser: (user: AuthUser) => void;
};

const TOKEN_KEY = "eb_token";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the persisted session once on mount.
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api<{ user: AuthUser }>("/api/auth/me", { token: stored })
      .then(({ user: me }) => {
        if (cancelled) return;
        setToken(stored);
        setUser(me);
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const applySession = useCallback((nextUser: AuthUser, nextToken: string) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api<{ user: AuthUser; token: string }>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      applySession(res.user, res.token);
      return res.user;
    },
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const res = await api<{ user: AuthUser; token: string }>("/api/auth/register", {
        method: "POST",
        body: input,
      });
      applySession(res.user, res.token);
      return res.user;
    },
    [applySession],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, updateUser }),
    [user, token, loading, login, register, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
