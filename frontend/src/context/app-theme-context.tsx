"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";
import { useMembership } from "@/context/membership-context";
import {
  DEFAULT_QR_THEME_ID,
  applyAppTheme,
  getQrTheme,
  isQrThemeId,
  readStoredQrThemeId,
  writeStoredQrThemeId,
  type QrTheme,
  type QrThemeId,
} from "@/lib/qr-themes";

type AppThemeContextValue = {
  themeId: QrThemeId;
  theme: QrTheme;
  ready: boolean;
  /** Custom themes + QR styling require active membership */
  themesUnlocked: boolean;
  setThemeId: (id: QrThemeId) => Promise<{ ok: boolean; reason?: string }>;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { activeMembership, loading: membershipLoading } = useMembership();
  const [themeId, setThemeIdState] = useState<QrThemeId>(DEFAULT_QR_THEME_ID);
  const selectingRef = useRef(false);
  const lastUserRef = useRef<string | null>(null);

  const themesUnlocked = Boolean(activeMembership);
  const membershipKnown = !authLoading && !membershipLoading;

  // Avoid SSR mismatch — restore local theme after mount
  useEffect(() => {
    const stored = readStoredQrThemeId();
    if (stored) {
      setThemeIdState(stored);
      applyAppTheme(stored);
    } else {
      applyAppTheme(DEFAULT_QR_THEME_ID);
    }
  }, []);

  // Paint CSS as soon as we know unlock state
  useEffect(() => {
    if (!membershipKnown) {
      applyAppTheme(DEFAULT_QR_THEME_ID);
      return;
    }
    if (!themesUnlocked) {
      applyAppTheme(DEFAULT_QR_THEME_ID);
      return;
    }
    applyAppTheme(themeId);
  }, [themeId, themesUnlocked, membershipKnown]);

  // Soft-load saved preference when user + membership unlock
  useEffect(() => {
    if (!membershipKnown) return;

    if (!user || !themesUnlocked) {
      lastUserRef.current = null;
      return;
    }

    if (lastUserRef.current === user.id) return;
    lastUserRef.current = user.id;

    let cancelled = false;

    (async () => {
      let next: QrThemeId =
        readStoredQrThemeId() ??
        (isQrThemeId(user.preferences?.qrTheme)
          ? user.preferences.qrTheme
          : DEFAULT_QR_THEME_ID);

      if (!isQrThemeId(user.preferences?.qrTheme)) {
        try {
          const profile = await api.profile();
          const fromProfile = profile.user.preferences?.qrTheme;
          if (isQrThemeId(fromProfile)) next = fromProfile;
        } catch {
          // keep local
        }
      } else {
        next = user.preferences.qrTheme;
      }

      if (cancelled || selectingRef.current) return;
      setThemeIdState(next);
      writeStoredQrThemeId(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [membershipKnown, user?.id, user?.preferences?.qrTheme, themesUnlocked]);

  const setThemeId = useCallback(
    async (id: QrThemeId) => {
      if (!themesUnlocked && id !== DEFAULT_QR_THEME_ID) {
        return {
          ok: false,
          reason: "Cần gói membership để đổi theme.",
        };
      }

      selectingRef.current = true;
      setThemeIdState(id);
      writeStoredQrThemeId(id);
      applyAppTheme(id);
      try {
        await api.updateProfile({ preferences: { qrTheme: id } });
      } catch {
        // local + CSS still applied
      } finally {
        selectingRef.current = false;
      }
      return { ok: true };
    },
    [themesUnlocked],
  );

  const effectiveId =
    membershipKnown && themesUnlocked ? themeId : DEFAULT_QR_THEME_ID;

  const value = useMemo(
    () => ({
      themeId: effectiveId,
      theme: getQrTheme(effectiveId),
      ready: membershipKnown,
      themesUnlocked: membershipKnown ? themesUnlocked : false,
      setThemeId,
    }),
    [effectiveId, membershipKnown, themesUnlocked, setThemeId],
  );

  return (
    <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return ctx;
}
