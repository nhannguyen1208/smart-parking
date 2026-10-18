"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError } from "@/lib/api-client";
import type { ActiveMembership } from "@/lib/types";

type MembershipContextValue = {
  activeMembership: ActiveMembership | null;
  loading: boolean;
  error: string | null;
  setActiveMembership: (membership: ActiveMembership | null) => void;
  refreshMembership: () => Promise<ActiveMembership | null>;
};

const MembershipContext = createContext<MembershipContextValue | null>(null);

const STORAGE_KEY = "parkwise.activeMembership";

function readStored(): ActiveMembership | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActiveMembership) : null;
  } catch {
    return null;
  }
}

function writeStored(membership: ActiveMembership | null) {
  if (typeof window === "undefined") return;
  try {
    if (membership) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(membership));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function MembershipProvider({ children }: { children: ReactNode }) {
  const [activeMembership, setActiveMembershipState] = useState<ActiveMembership | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  const setActiveMembership = useCallback((membership: ActiveMembership | null) => {
    setActiveMembershipState(membership);
    writeStored(membership);
  }, []);

  const refreshMembership = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!hydratedRef.current) {
        const stored = readStored();
        if (stored) setActiveMembershipState(stored);
        hydratedRef.current = true;
      }
      const data = await api.membership();
      setActiveMembership(data.activeMembership);
      return data.activeMembership;
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to load membership");
      return readStored();
    } finally {
      setLoading(false);
    }
  }, [setActiveMembership]);

  const value = useMemo(
    () => ({
      activeMembership,
      loading,
      error,
      setActiveMembership,
      refreshMembership,
    }),
    [activeMembership, loading, error, setActiveMembership, refreshMembership],
  );

  return (
    <MembershipContext.Provider value={value}>{children}</MembershipContext.Provider>
  );
}

export function useMembership() {
  const ctx = useContext(MembershipContext);
  if (!ctx) {
    throw new Error("useMembership must be used within MembershipProvider");
  }
  return ctx;
}
