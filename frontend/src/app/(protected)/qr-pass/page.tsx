"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MobileAppHeader } from "@/components/layout/mobile-app-header";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ActiveMembership } from "@/lib/types";

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
  const [pass, setPass] = useState<LivePass | null>(null);
  const [list, setList] = useState<Array<Record<string, unknown>>>([]);
  const [membership, setMembership] = useState<ActiveMembership | null>(null);
  const [membershipLoaded, setMembershipLoaded] = useState(false);
  const [error, setError] = useState("");
  const [booting, setBooting] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(REFRESH_SECONDS);

  const passIdRef = useRef<string | null>(null);
  const aliveRef = useRef(true);

  const hasActivePlan = Boolean(membership);

  const refreshList = useCallback(async () => {
    const rows = (await api.v1.listGuestPasses()) as Array<Record<string, unknown>>;
    setList(rows);
  }, []);

  const mintPass = useCallback(async () => {
    const previousId = passIdRef.current;
    const data = await api.v1.createGuestPass({ validMinutes: PASS_VALID_MINUTES });
    const qrDataUrl = await QRCode.toDataURL(data.qrPayload, {
      margin: 1,
      width: 280,
      color: { dark: "#0b2e59", light: "#ffffff" },
    });

    if (previousId && previousId !== data.id) {
      try {
        await api.v1.revokeGuestPass(previousId);
      } catch {
        // ignore
      }
    }

    if (!aliveRef.current) {
      // Page unmounted — revoke the pass we just created
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
    await refreshList();
  }, [refreshList]);

  // Load membership, then auto-start live QR (no button)
  useEffect(() => {
    aliveRef.current = true;

    (async () => {
      try {
        const data = await api.membership();
        setMembership(data.activeMembership);
        setMembershipLoaded(true);

        if (data.activeMembership) {
          await mintPass();
        }
      } catch {
        setMembership(null);
        setMembershipLoaded(true);
      } finally {
        if (aliveRef.current) setBooting(false);
      }

      refreshList().catch(() => undefined);
    })();

    return () => {
      aliveRef.current = false;
      const id = passIdRef.current;
      passIdRef.current = null;
      if (id) {
        api.v1.revokeGuestPass(id).catch(() => undefined);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start once on mount
  }, []);

  // Countdown + rotate every 10s while we have a live pass + active plan
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

  async function revoke(id: string) {
    if (!window.confirm("Revoke this Backup Pass?")) return;
    await api.v1.revokeGuestPass(id);
    if (passIdRef.current === id) {
      passIdRef.current = null;
      setPass(null);
      if (hasActivePlan) {
        await mintPass().catch(() => undefined);
      }
    }
    await refreshList();
  }

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
              Register a Daily (10k) or Monthly (30k) plan to use Backup Pass.
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
          <Card className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Scan at gate
              </p>
              <p
                className={`font-mono text-sm font-bold tabular-nums ${
                  secondsLeft <= 3 ? "text-brand-red" : "text-brand-blue"
                }`}
              >
                Refresh in {secondsLeft}s
              </p>
            </div>

            <div className="mx-auto flex aspect-square w-full max-w-[280px] items-center justify-center rounded-2xl bg-white p-3 shadow-sm ring-1 ring-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pass.qrDataUrl}
                alt="Backup Pass QR code"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="text-center">
              <p className="font-mono text-xs font-semibold tracking-wider text-navy">
                {pass.token}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Single use · auto-rotates every {REFRESH_SECONDS}s
              </p>
            </div>
          </Card>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">History</p>
          {list.map((p) => (
            <Card
              key={String(p.id)}
              className="flex items-center justify-between p-3 text-sm"
            >
              <div>
                <p className="font-medium text-navy">{String(p.displayCode)}</p>
                <p className="text-xs text-muted">
                  {String(p.status)} · uses {String(p.usedCount)}/{String(p.maxUses)}
                </p>
              </div>
              {p.status === "ACTIVE" && p.id !== pass?.id ? (
                <Button variant="secondary" onClick={() => revoke(String(p.id))}>
                  Revoke
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
