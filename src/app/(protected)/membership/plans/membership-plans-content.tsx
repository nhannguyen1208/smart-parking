"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api-client";
import type { MembershipPlan, ProfileData } from "@/lib/types";

export default function MembershipPlansContent() {
  const searchParams = useSearchParams();
  const selectedPlanId = searchParams.get("plan");
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.membershipPlans(), api.profile()])
      .then(([planData, profileData]) => {
        setPlans(planData.plans);
        setProfile(profileData);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Failed to load plan details");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardShell>
        <p className="text-sm text-muted">Loading plan details...</p>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <p className="rounded-[10px] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
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

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-[30px] font-semibold text-navy">Plan details</h1>
          <p className="mt-2 text-sm text-muted">
            Review your selected membership before payment.
          </p>
        </header>

        <Card className="p-6">
          <p className="text-sm text-muted">Selected plan</p>
          <h2 className="mt-2 text-3xl font-semibold text-navy">
            {selectedPlan.name}
          </h2>
          <p className="mt-3 text-2xl font-semibold text-brand-red">
            {selectedPlan.priceFormatted}
          </p>
          <p className="mt-3 text-sm text-muted">{selectedPlan.description}</p>

          <div className="mt-6 space-y-3 rounded-[10px] bg-background p-4 text-sm">
            <Row label="Student ID" value={profile.user.studentId} />
            <Row label="Payment method" value="Campus e-wallet" />
            <Row
              label="Renewal date"
              value={profile.activeMembership?.endDateFormatted ?? "N/A"}
            />
          </div>

          <div className="mt-6 flex gap-3">
            <Button href="/membership" variant="secondary">
              Back
            </Button>
            <Button href="/membership/success" className="flex-1">
              Confirm payment
            </Button>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-navy">{value}</span>
    </div>
  );
}
