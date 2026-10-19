"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, ChevronRight, QrCode, Ticket } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MobileAppHeader } from "@/components/layout/mobile-app-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMembership } from "@/context/membership-context";
import { api, ApiError } from "@/lib/api-client";
import type { MembershipPlan } from "@/lib/types";

function MembershipPageBody() {
  const searchParams = useSearchParams();
  const justActivated = searchParams.get("activated") === "1";
  const activatedPlan = searchParams.get("plan");
  const activatedUntil = searchParams.get("until");

  const {
    activeMembership,
    setActiveMembership,
    refreshMembership,
  } = useMembership();

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [membership, planData] = await Promise.all([
        refreshMembership(),
        api.membershipPlans(),
      ]);
      if (membership) setActiveMembership(membership);
      setPlans(planData.plans);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Failed to load membership");
    } finally {
      setLoading(false);
    }
  }, [refreshMembership, setActiveMembership]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load, justActivated]);

  async function handleCancelPlan() {
    if (
      !window.confirm(
        "Cancel this parking plan? Backup Pass will stop working immediately.",
      )
    ) {
      return;
    }

    setCancelling(true);
    setActionError(null);
    try {
      await api.cancelMembership();
      setActiveMembership(null);
      await load();
      window.location.assign("/membership");
    } catch (err: unknown) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to cancel parking plan",
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading && !activeMembership && !justActivated) {
    return (
      <DashboardShell>
        <p className="text-sm text-muted">Loading membership...</p>
      </DashboardShell>
    );
  }

  if (error && !activeMembership) {
    return (
      <DashboardShell>
        <p className="rounded-[12px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
          {error}
        </p>
      </DashboardShell>
    );
  }

  const isActive = Boolean(activeMembership && activeMembership.status === "ACTIVE");
  const daysLeft = activeMembership?.daysLeft ?? 0;
  const planDuration =
    plans.find((p) => p.id === activeMembership?.planId)?.durationDays ??
    (daysLeft > 1 ? Math.max(daysLeft, 30) : 1);
  const progressPct = isActive
    ? Math.min(100, Math.max(4, (daysLeft / Math.max(planDuration, 1)) * 100))
    : 0;
  const urgency =
    isActive && daysLeft <= 3
      ? "critical"
      : isActive && daysLeft <= 7
        ? "soon"
        : "ok";

  return (
    <DashboardShell>
      <div className="app-page mx-auto max-w-3xl space-y-4 md:space-y-6 pb-2">
        <MobileAppHeader
          title="Membership"
          subtitle={isActive ? "Campus parking pass" : "Choose a parking pass"}
        />
        <header className="hidden md:block">
          <h1 className="text-[30px] font-semibold tracking-tight text-navy">
            Membership
          </h1>
          <p className="mt-1 text-sm text-muted">
            Campus parking access, RFID entry, and Backup Pass
          </p>
        </header>

        {justActivated ? (
          <div className="animate-fade-up flex items-start gap-3 rounded-[16px] border border-emerald-200/80 bg-[#e8f7ee]/70 px-4 py-3.5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#15803d]">Pass activated</p>
              <p className="mt-0.5 text-sm text-navy">
                {activatedPlan && activatedUntil
                  ? `${decodeURIComponent(activatedPlan)} · until ${decodeURIComponent(activatedUntil)}`
                  : activeMembership
                    ? `${activeMembership.planName ?? "Parking plan"} · until ${activeMembership.endDateFormatted}`
                    : "Your campus parking plan is now active."}
              </p>
            </div>
          </div>
        ) : null}

        {/* Pass status hero */}
        <Card className="animate-fade-up relative overflow-hidden border-brand-blue/15 p-0">
          <div
            className="relative px-4 py-5 text-white sm:px-6 sm:py-6"
            style={{
              background: isActive
                ? "linear-gradient(145deg, #0b2e59 0%, #0a3d73 48%, #005daa 120%)"
                : "linear-gradient(145deg, #2a3548 0%, #3a4558 55%, #4a5568 120%)",
            }}
          >
            <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 left-1/3 h-28 w-28 rounded-full bg-[#891635]/25 blur-2xl" />

            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
                  Campus pass
                </p>
                <h2 className="mt-1.5 truncate text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                  {isActive
                    ? (activeMembership?.planName ?? "Parking plan")
                    : "No active pass"}
                </h2>
                <p className="mt-1.5 text-sm text-white/75">
                  {isActive
                    ? `Until ${activeMembership!.endDateFormatted}`
                    : "Register a plan to unlock gate entry & Backup Pass"}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                  isActive
                    ? "bg-emerald-400/20 text-emerald-100 ring-emerald-300/30"
                    : "bg-white/10 text-white/80 ring-white/20"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>

            {isActive ? (
              <div className="relative mt-5">
                <div className="mb-2 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[2.35rem] font-semibold leading-none tabular-nums tracking-tight">
                      {daysLeft}
                      <span className="ml-1.5 text-base font-medium text-white/70">
                        {daysLeft === 1 ? "day left" : "days left"}
                      </span>
                    </p>
                  </div>
                  {urgency !== "ok" ? (
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        urgency === "critical"
                          ? "bg-[#891635]/80 text-white"
                          : "bg-amber-400/25 text-amber-100"
                      }`}
                    >
                      {urgency === "critical" ? "Expires soon" : "Renew soon"}
                    </span>
                  ) : null}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/20">
                  <div
                    className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                      urgency === "critical"
                        ? "bg-[#fca5a5]"
                        : urgency === "soon"
                          ? "bg-amber-200"
                          : "bg-white"
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="relative mt-5 flex items-center gap-3 rounded-[14px] bg-white/10 px-3.5 py-3 ring-1 ring-white/15">
                <Ticket className="h-5 w-5 shrink-0 text-white/80" aria-hidden />
                <p className="text-sm text-white/85">
                  Pick a Daily or Monthly pass below to get started.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 px-4 py-3.5 sm:px-5">
            {isActive ? (
              <>
                <Button href="/qr-pass" className="h-11 w-full gap-2 px-3 text-sm">
                  <QrCode className="h-4 w-4" aria-hidden />
                  Backup Pass
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 w-full px-3 text-sm"
                  onClick={handleCancelPlan}
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelling…" : "Cancel plan"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  href={
                    plans.find((p) => p.featured)?.id
                      ? `/membership/plans?plan=${plans.find((p) => p.featured)!.id}`
                      : "/membership/plans"
                  }
                  className="h-11 w-full px-3 text-sm col-span-2"
                >
                  Register a pass
                </Button>
              </>
            )}
          </div>
        </Card>

        {actionError ? (
          <p className="rounded-[12px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
            {actionError}
          </p>
        ) : null}

        {/* Plan picker */}
        <section className="animate-fade-up-delay-1 space-y-3">
          <div className="flex items-end justify-between gap-3 px-0.5">
            <div>
              <h2 className="text-sm font-semibold text-navy">
                {isActive ? "Change plan" : "Choose a pass"}
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Demo checkout via campus e-wallet
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {plans.map((plan) => {
              const isCurrent =
                isActive && activeMembership?.planId === plan.id;
              return (
                <Link
                  key={plan.id}
                  href={`/membership/plans?plan=${plan.id}`}
                  className={`group relative flex items-stretch overflow-hidden rounded-[16px] border bg-white shadow-[var(--shadow-card)] transition active:scale-[0.99] ${
                    plan.featured
                      ? "border-brand-blue/40 ring-1 ring-brand-blue/25"
                      : "border-border/80 hover:border-brand-blue/25"
                  }`}
                >
                  <div
                    className={`w-1 shrink-0 ${
                      plan.featured ? "bg-brand-blue" : "bg-transparent"
                    }`}
                  />
                  <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-4 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-navy">
                          {plan.name}
                        </h3>
                        {plan.featured ? (
                          <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-blue">
                            Popular
                          </span>
                        ) : null}
                        {isCurrent ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                            Current
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted line-clamp-2">
                        {plan.description}
                      </p>
                      <p className="mt-2 text-[11px] font-medium text-muted">
                        {plan.durationDays}{" "}
                        {plan.durationDays === 1 ? "day" : "days"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-semibold tabular-nums text-brand-red">
                        {plan.priceFormatted}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-0.5 text-xs font-semibold text-brand-blue group-hover:gap-1 transition-all">
                        {isCurrent ? "Renew" : "Select"}
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

export default function MembershipPage() {
  return (
    <Suspense
      fallback={
        <DashboardShell>
          <p className="text-sm text-muted">Loading membership...</p>
        </DashboardShell>
      }
    >
      <MembershipPageBody />
    </Suspense>
  );
}
