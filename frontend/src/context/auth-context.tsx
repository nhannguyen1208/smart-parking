"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (payload: { studentId?: string; email?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const { user: currentUser } = await api.me();
      setUser(currentUser);
      setError(null);
    } catch (err) {
      setUser(null);
      if (err instanceof ApiError && err.code !== "UNAUTHORIZED" && err.code !== "EXPIRED_TOKEN") {
        setError(err.message);
      }
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(
    async (payload: { studentId?: string; email?: string; password: string }) => {
      setError(null);
      try {
        const { user: loggedInUser } = await api.login(payload);
        setUser(loggedInUser);
        if (loggedInUser.role === "GUARD") router.replace("/guard");
        else if (loggedInUser.role === "ADMIN") router.replace("/admin");
        else router.replace("/dashboard");
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Unable to sign in. Please try again.";
        setError(message);
        throw err;
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      router.replace("/");
    }
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      logout,
      refreshUser,
      clearError: () => setError(null),
    }),
    [user, loading, error, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
