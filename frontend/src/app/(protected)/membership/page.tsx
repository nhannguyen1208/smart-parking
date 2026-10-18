"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
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
        <p className="rounded-[10px] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
          {error}
        </p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-[30px] font-semibold text-navy">Membership</h1>
          <p className="mt-2 text-sm text-muted">
            Manage your campus parking membership and renewal options.
          </p>
        </header>

        {justActivated ? (
          <Card className="border-emerald-200/80 bg-[#e8f7ee]/60 p-4">
            <p className="text-sm font-semibold text-[#15803d]">
              Membership activated
            </p>
            <p className="mt-1 text-sm text-navy">
              {activatedPlan && activatedUntil
                ? `${decodeURIComponent(activatedPlan)} is active until ${decodeURIComponent(activatedUntil)}.`
                : activeMembership
                  ? `${activeMembership.planName ?? "Parking plan"} is active until ${activeMembership.endDateFormatted}.`
                  : "Your campus parking plan is now active."}
            </p>
          </Card>
        ) : null}

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Current status</p>
              <p className="mt-2 text-2xl font-semibold text-navy">
                {activeMembership?.status ?? "NONE"}
              </p>
              <p className="mt-1 text-sm text-muted">
                {activeMembership
                  ? `${activeMembership.planName ?? "Parking plan"} · until ${activeMembership.endDateFormatted} · ${activeMembership.daysLeft} days left`
                  : "No active membership"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {activeMembership ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelPlan}
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelling..." : "Cancel plan"}
                </Button>
              ) : null}
              <Button href="/membership/plans">
                {activeMembership ? "Change plan" : "Register plan"}
              </Button>
            </div>
          </div>
          {actionError ? (
            <p className="mt-4 rounded-[10px] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
              {actionError}
            </p>
          ) : null}
        </Card>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-navy">
            Choose a membership period
          </h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`p-6 ${plan.featured ? "border-brand-blue ring-1 ring-brand-blue" : ""}`}
              >
                {plan.featured && (
                  <span className="mb-3 inline-block rounded-full bg-brand-light px-2.5 py-1 text-xs font-semibold text-brand-blue">
                    Most popular
                  </span>
                )}
                <h3 className="text-2xl font-semibold text-navy">{plan.name}</h3>
                <p className="mt-3 text-xl font-semibold text-brand-red">
                  {plan.priceFormatted}
                </p>
                <p className="mt-3 text-sm text-muted">{plan.description}</p>
                <Button
                  href={`/membership/plans?plan=${plan.id}`}
                  variant={plan.featured ? "primary" : "secondary"}
                  className="mt-6 w-full"
                >
                  Select plan
                </Button>
              </Card>
            ))}
          </div>
        </div>
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
