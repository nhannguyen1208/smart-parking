"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ActivePasses,
  EmptyState,
  LoadingState,
  MissionCard,
  PointsActivityList,
  PointsBalance,
  RedeemConfirmationDialog,
  RewardCard,
  RewardProgress,
  RewardsToast,
} from "@/components/rewards";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MobileAppHeader } from "@/components/layout/mobile-app-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { api, ApiError } from "@/lib/api-client";
import { timeOfDayGreeting } from "@/lib/rewards-format";
import type { CatalogItem, RewardsOverview } from "@/lib/rewards-types";

export default function RewardsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<RewardsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error" | "info";
  } | null>(null);
  const [redeemTarget, setRedeemTarget] = useState<CatalogItem | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const overview = (await api.v1.rewards()) as RewardsOverview;
      setData(overview);
      return overview;
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "We couldn’t load your rewards. Please try again.",
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const overview = (await api.v1.rewards()) as RewardsOverview;
        if (cancelled) return;
        setData(overview);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "We couldn’t load your rewards. Please try again.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function confirmRedeem() {
    if (!redeemTarget) return;
    setBusy(true);
    setToast(null);
    try {
      const result = await api.v1.redeemReward(redeemTarget.id);
      setToast({ message: result.message, tone: "success" });
      setRedeemTarget(null);
      await load();
    } catch (err) {
      setToast({
        message:
          err instanceof ApiError
            ? err.message
            : "Redemption didn’t go through. Please try again.",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSimulate() {
    setBusy(true);
    setToast(null);
    try {
      const result = await api.v1.simulateRewardCheckIn(true);
      const overview = result.overview as RewardsOverview;
      const rewards = result.rewards;
      const earned = Number(rewards?.points ?? 0);
      const gateResult = String(result.gate?.result ?? "done");

      if (earned > 0) {
        setToast({
          message: `Nice work! You earned ${earned} points. (DEMO scan)`,
          tone: "success",
        });
      } else if (gateResult === "ALLOWED") {
        setToast({
          message:
            rewards?.skipReason === "OUTSIDE_WINDOW"
              ? "DEMO check-in OK, but outside the challenge window."
              : rewards?.skipReason === "ALREADY_EARNED"
                ? "DEMO check-in OK — you already earned points for that challenge day."
                : "DEMO check-in OK — no points awarded (no active mission or feature off).",
          tone: "info",
        });
      } else {
        setToast({
          message: `Gate: ${gateResult}${
            result.gate?.reason ? ` — ${String(result.gate.reason)}` : ""
          }`,
          tone: "error",
        });
      }
      setData(overview);
    } catch (err) {
      setToast({
        message:
          err instanceof ApiError ? err.message : "Simulator failed. Try again.",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        <LoadingState />
      </DashboardShell>
    );
  }

  if (error || !data) {
    return (
      <DashboardShell>
        <EmptyState
          title="Rewards unavailable"
          description={error ?? "Please refresh the page or try again later."}
          action={
            <Button type="button" variant="secondary" onClick={() => void load()}>
              Try again
            </Button>
          }
        />
      </DashboardShell>
    );
  }

  const greeting = user?.name
    ? timeOfDayGreeting(user.name)
    : "Ready for a smoother parking day?";

  return (
    <DashboardShell>
      <div className="app-page mx-auto max-w-5xl space-y-4 md:space-y-6 pb-2">
        <MobileAppHeader title="Rewards" subtitle="Earn & redeem free parking" />

        <header className="hidden animate-fade-up md:block">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            Rewards
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-navy sm:text-[32px]">
            {greeting}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Earn points with today’s Early Arrival Challenge, then redeem free
            parking days. Check in as usual — RFID, plate, or Backup Pass.
          </p>
        </header>

        {toast ? (
          <div className="animate-fade-up">
            <RewardsToast
              message={toast.message}
              tone={toast.tone}
              onDismiss={() => setToast(null)}
            />
          </div>
        ) : null}

        {/* Today's mission first — primary action */}
        <section className="animate-fade-up-delay-1" aria-label="Today's mission">
          <MissionCard
            mission={data.mission}
            busy={busy}
            onSimulate={handleSimulate}
            showDemoSimulate
          />
        </section>

        {/* Points + next reward */}
        <section
          className="grid gap-4 animate-fade-up-delay-2 lg:grid-cols-2"
          aria-label="Points and next reward"
        >
          <PointsBalance
            points={data.points}
            pointsEarnedToday={data.pointsEarnedToday}
            nextRewardName={data.nextReward?.name}
            pointsToNext={data.nextReward?.pointsToNext}
            progressPct={data.nextReward?.progressPct}
            nextPointsCost={data.nextReward?.pointsCost}
          />
          <RewardProgress points={data.points} nextReward={data.nextReward} />
        </section>

        {/* Catalog */}
        <section aria-labelledby="rewards-catalog-heading" className="animate-fade-up-delay-3">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2
                id="rewards-catalog-heading"
                className="text-lg font-semibold tracking-tight text-navy"
              >
                Available rewards
              </h2>
              <p className="mt-1 text-sm text-muted">
                Spend points on free parking days when you’re ready.
              </p>
            </div>
          </div>

          {data.catalog.length === 0 ? (
            <EmptyState
              title="No rewards in the catalog"
              description="Check back soon — new free parking rewards will show up here."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.catalog.map((item) => (
                <RewardCard
                  key={item.id}
                  item={item}
                  busy={busy}
                  onRedeem={(target) => {
                    if (!target.canRedeem) return;
                    setRedeemTarget(target);
                  }}
                />
              ))}
            </div>
          )}
        </section>

        <ActivePasses redemptions={data.redemptions} />

        <PointsActivityList
          rows={data.history}
          limit={12}
          showFullHistoryLink={false}
        />
      </div>

      <RedeemConfirmationDialog
        open={Boolean(redeemTarget)}
        item={redeemTarget}
        busy={busy}
        onCancel={() => {
          if (!busy) setRedeemTarget(null);
        }}
        onConfirm={() => void confirmRedeem()}
      />
    </DashboardShell>
  );
}
