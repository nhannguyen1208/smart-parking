"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api-client";
import type { MembershipData, MembershipPlan } from "@/lib/types";

export default function MembershipPage() {
  const [membershipData, setMembershipData] = useState<MembershipData | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.membership(), api.membershipPlans()])
      .then(([membership, planData]) => {
        setMembershipData(membership);
        setPlans(planData.plans);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Failed to load membership");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardShell>
        <p className="text-sm text-muted">Loading membership...</p>
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

  const activeMembership = membershipData?.activeMembership;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-[30px] font-semibold text-navy">Membership</h1>
          <p className="mt-2 text-sm text-muted">
            Manage your campus parking membership and renewal options.
          </p>
        </header>

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Current status</p>
              <p className="mt-2 text-2xl font-semibold text-navy">
                {activeMembership?.status ?? "NONE"}
              </p>
              <p className="mt-1 text-sm text-muted">
                {activeMembership
                  ? `Valid until ${activeMembership.endDateFormatted} • ${activeMembership.daysLeft} days left`
                  : "No active membership"}
              </p>
            </div>
            <Button href="/membership/plans">Renew membership</Button>
          </div>
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
