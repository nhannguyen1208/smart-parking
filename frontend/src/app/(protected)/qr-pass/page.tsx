"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ThemedQrCard } from "@/components/qr/themed-qr-card";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MobileAppHeader } from "@/components/layout/mobile-app-header";
import { useAppTheme } from "@/context/app-theme-context";
import { useMembership } from "@/context/membership-context";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getQrTheme, renderQrDataUrl, type QrThemeId } from "@/lib/qr-themes";

const REFRESH_SECONDS = 10;
const PASS_VALID_MINUTES = 5;

type LivePass = {
  id: string;
  token: string;
  expiresAt: string;
  qrPayload: string;
  qrDataUrl: string;
};

export default function QrPassPage() {
  const { themeId, theme, ready: themeReady } = useAppTheme();
  const {
    activeMembership: membership,
    loading: membershipLoading,
  } = useMembership();
  const [pass, setPass] = useState<LivePass | null>(null);
  const [error, setError] = useState("");
  const [booting, setBooting] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(REFRESH_SECONDS);

  const passIdRef = useRef<string | null>(null);
  const aliveRef = useRef(true);
  const themeIdRef = useRef<QrThemeId>(themeId);
  const startedRef = useRef(false);

  const membershipLoaded = !membershipLoading;
  const hasActivePlan = Boolean(membership);

  useEffect(() => {
    themeIdRef.current = themeId;
  }, [themeId]);

  const mintPass = useCallback(async () => {
    const previousId = passIdRef.current;
    const data = await api.v1.createGuestPass({ validMinutes: PASS_VALID_MINUTES });
    const activeTheme = getQrTheme(themeIdRef.current);
    const qrDataUrl = await renderQrDataUrl(data.qrPayload, activeTheme);

    if (previousId && previousId !== data.id) {
      try {
        await api.v1.revokeGuestPass(previousId);
      } catch {
        // ignore
      }
    }

    if (!aliveRef.current) {
      try {
        await api.v1.revokeGuestPass(data.id);
      } catch {
        // ignore
      }
      return;
    }

    passIdRef.current = data.id;
    setPass({
      id: data.id,
      token: data.token,
      expiresAt: data.expiresAt,
      qrPayload: data.qrPayload,
      qrDataUrl,
    });
    setSecondsLeft(REFRESH_SECONDS);
  }, []);

  // Revoke live pass only when leaving the page
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      const id = passIdRef.current;
      passIdRef.current = null;
      if (id) {
        api.v1.revokeGuestPass(id).catch(() => undefined);
      }
    };
  }, []);

  // Auto-start live QR once theme + membership are known
  useEffect(() => {
    if (!themeReady || !membershipLoaded) return;
    if (!membership) {
      setBooting(false);
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        await mintPass();
      } catch (e) {
        startedRef.current = false;
        if (e instanceof ApiError) setError(e.message);
        else setError(e instanceof Error ? e.message : "Could not open QR");
      } finally {
        if (aliveRef.current) setBooting(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start once ready
  }, [themeReady, membershipLoaded, membership?.id]);

  // Countdown + rotate every 10s
  useEffect(() => {
    if (!hasActivePlan || !pass) return undefined;

    const tick = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    const rotate = window.setInterval(() => {
      mintPass().catch((e) => {
        if (e instanceof ApiError) setError(e.message);
        else setError(e instanceof Error ? e.message : "Could not refresh QR");
      });
    }, REFRESH_SECONDS * 1000);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(rotate);
    };
  }, [hasActivePlan, pass?.id, mintPass]);

  // Re-render existing QR when theme changes (same payload)
  useEffect(() => {
    if (!pass?.qrPayload) return;
    let cancelled = false;
    (async () => {
      const url = await renderQrDataUrl(pass.qrPayload, getQrTheme(themeId));
      if (!cancelled) {
        setPass((prev) => (prev ? { ...prev, qrDataUrl: url } : prev));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeId]);

  return (
    <DashboardShell>
      <div className="app-page mx-auto max-w-lg space-y-4 pb-4">
        <MobileAppHeader title="Backup Pass" />
        <div className="hidden md:block">
          <h1 className="text-2xl font-semibold text-navy">Backup Pass</h1>
        </div>

        {membershipLoaded && !hasActivePlan ? (
          <Card className="space-y-3 border border-[#fecaca] bg-[#fef2f2] p-4">
            <p className="text-sm font-semibold text-[#b91c1c]">Membership required</p>
            <p className="text-sm text-[#7f1d1d]">
              Cần gói membership đang active.
            </p>
            <Link href="/membership/plans">
              <Button className="w-full">View parking plans</Button>
            </Link>
          </Card>
        ) : null}

        {hasActivePlan ? (
          <Card className="p-4 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted">Active plan</p>
            <p className="mt-1 font-semibold text-navy">
              {membership?.planName ?? "Parking plan"} · until{" "}
              {membership?.endDateFormatted ?? "—"}
            </p>
          </Card>
        ) : null}

        {error ? <p className="text-sm text-brand-red">{error}</p> : null}

        {booting && hasActivePlan ? (
          <Card className="flex min-h-[320px] items-center justify-center p-5">
            <p className="text-sm text-muted">Opening live QR…</p>
          </Card>
        ) : null}

        {pass ? (
          <ThemedQrCard
            theme={theme}
            qrDataUrl={pass.qrDataUrl}
            token={pass.token}
            secondsLeft={secondsLeft}
            refreshSeconds={REFRESH_SECONDS}
          />
        ) : null}
      </div>
    </DashboardShell>
  );
}
