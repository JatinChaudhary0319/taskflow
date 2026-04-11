import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { type AuthPayload, clearAuth, readAuth, writeAuth } from "@/lib/auth-storage";
import { ApiError, apiFetch } from "@/lib/api";
import type { User } from "@/types/taskflow";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthResponse = { token: string; user: User };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readAuth();
    if (stored) {
      setUser(stored.user);
      setToken(stored.token);
    }
    setReady(true);
  }, []);

  const persist = useCallback((payload: AuthPayload) => {
    writeAuth(payload);
    setUser(payload.user);
    setToken(payload.token);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ email, password }),
      });
      persist(data);
    },
    [persist],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ name, email, password }),
      });
      persist(data);
    },
    [persist],
  );

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, ready, login, register, logout }),
    [user, token, ready, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function formatApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.body.fields) {
      return Object.entries(err.body.fields)
        .map(([k, v]) => `${k}: ${v}`)
        .join("; ");
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
