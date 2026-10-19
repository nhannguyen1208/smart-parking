"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MobileAppHeader } from "@/components/layout/mobile-app-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMembership } from "@/context/membership-context";
import { api, ApiError } from "@/lib/api-client";
import type { MembershipPlan, ProfileData } from "@/lib/types";

export default function MembershipPlansContent() {
  const searchParams = useSearchParams();
  const selectedPlanId = searchParams.get("plan");
  const { activeMembership, setActiveMembership } = useMembership();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([api.membershipPlans(), api.profile()])
      .then(([planData, profileData]) => {
        setPlans(planData.plans);
        setProfile(profileData);
        if (profileData.activeMembership) {
          setActiveMembership(profileData.activeMembership);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Failed to load plan details");
      })
      .finally(() => setLoading(false));
  }, [setActiveMembership]);

  if (loading) {
    return (
      <DashboardShell>
        <p className="text-sm text-muted">Loading plan details...</p>
      </DashboardShell>
    );
  }

  if (error && !plans.length) {
    return (
      <DashboardShell>
        <p className="rounded-[12px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
          {error}
        </p>
      </DashboardShell>
    );
  }

  const selectedPlan =
    plans.find((plan) => plan.id === selectedPlanId) ??
    plans.find((plan) => plan.featured) ??
    plans[0];

  if (!selectedPlan || !profile) {
    return (
      <DashboardShell>
        <p className="text-sm text-muted">No membership plans available.</p>
      </DashboardShell>
    );
  }

  async function handleConfirmPayment() {
    if (!selectedPlan || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.subscribeMembership(selectedPlan.id);
      const membership = result.membership;
      setActiveMembership(membership);
      setProfile((prev) =>
        prev ? { ...prev, activeMembership: membership } : prev,
      );
      const until = encodeURIComponent(membership.endDateFormatted);
      const plan = encodeURIComponent(membership.planName || selectedPlan.name);
      window.location.assign(
        `/membership?activated=1&plan=${plan}&until=${until}`,
      );
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Payment failed — try again");
      setSubmitting(false);
    }
  }

  const currentPlanName =
    activeMembership?.planName ?? profile.activeMembership?.planName ?? "None";
  const features =
    selectedPlan.features?.length > 0
      ? selectedPlan.features
      : [
          "Campus parking access",
          "RFID entry",
          "Backup Pass while active",
        ];

  return (
    <DashboardShell>
      <div className="app-page mx-auto max-w-lg space-y-4 md:space-y-5 pb-2">
        <MobileAppHeader title="Checkout" subtitle="Confirm your parking pass" />
        <header className="hidden md:block">
          <Button href="/membership" variant="ghost" className="mb-2 h-9 gap-1.5 px-2">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
          <h1 className="text-[28px] font-semibold tracking-tight text-navy">
            Confirm pass
          </h1>
        </header>

        <Card className="animate-fade-up relative overflow-hidden border-brand-blue/15 p-0">
          <div
            className="relative px-5 py-5 text-white"
            style={{
              background:
                "linear-gradient(145deg, #0b2e59 0%, #0a3d73 48%, #005daa 120%)",
            }}
          >
            <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
              Selected pass
            </p>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-tight">
              {selectedPlan.name}
            </h2>
            <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
              {selectedPlan.priceFormatted}
            </p>
            <p className="mt-1 text-sm text-white/75">
              {selectedPlan.durationDays}{" "}
              {selectedPlan.durationDays === 1 ? "day" : "days"} · campus lot
            </p>
          </div>

          <div className="space-y-4 px-5 py-5">
            <p className="text-sm text-muted">{selectedPlan.description}</p>

            <ul className="space-y-2">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-navy">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand-blue">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="space-y-2.5 rounded-[14px] border border-border/80 bg-surface/60 px-4 py-3.5 text-sm">
              <Row label="Student ID" value={profile.user.studentId} />
              <Row
                label="Payment"
                value="Campus e-wallet"
                icon={<Wallet className="h-3.5 w-3.5 text-brand-blue" aria-hidden />}
              />
              <Row label="Current plan" value={currentPlanName} />
            </div>

            {error ? (
              <p className="rounded-[12px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
                {error}
              </p>
            ) : null}

            <div className="flex gap-2.5 pt-1">
              <Button href="/membership" variant="secondary" className="h-11 px-4">
                Back
              </Button>
              <Button
                type="button"
                className="h-11 flex-1"
                disabled={submitting}
                onClick={handleConfirmPayment}
              >
                {submitting ? "Activating…" : "Confirm payment"}
              </Button>
            </div>
          </div>
        </Card>

        {plans.length > 1 ? (
          <section className="animate-fade-up-delay-1">
            <p className="mb-2 px-0.5 text-xs font-semibold text-muted">
              Switch plan
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {plans.map((plan) => {
                const selected = plan.id === selectedPlan.id;
                return (
                  <Button
                    key={plan.id}
                    href={`/membership/plans?plan=${plan.id}`}
                    variant={selected ? "primary" : "secondary"}
                    className="h-10 shrink-0 px-4 text-xs"
                  >
                    {plan.name}
                  </Button>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </DashboardShell>
  );
}

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="inline-flex items-center gap-1.5 font-medium text-navy">
        {icon}
        {value}
      </span>
    </div>
  );
}
