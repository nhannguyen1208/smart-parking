"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { RewardsSnapshot } from "@/components/dashboard/rewards-snapshot";
import { WeatherForecastBar } from "@/components/dashboard/weather-forecast-bar";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMembership } from "@/context/membership-context";
import { api, ApiError } from "@/lib/api-client";
import { parkingHistory } from "@/lib/mock-data";
import { timeOfDayGreeting } from "@/lib/rewards-format";
import type { DashboardData } from "@/lib/types";

export default function DashboardPage() {
  const pathname = usePathname();
  const { activeMembership: liveMembership, setActiveMembership, refreshMembership } =
    useMembership();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    Promise.all([api.dashboard(), refreshMembership()])
      .then(([dashboard, membership]) => {
        setData({
          ...dashboard,
          activeMembership: membership ?? dashboard.activeMembership,
        });
        if (membership) setActiveMembership(membership);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard");
      })
      .finally(() => setLoading(false));
  }, [refreshMembership, setActiveMembership]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, pathname]);

  if (loading) {
    return (
      <DashboardShell>
        <LoadingBlock label="Loading dashboard..." />
      </DashboardShell>
    );
  }

  if (error || !data) {
    return (
      <DashboardShell>
        <p className="rounded-[12px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
          {error ?? "Dashboard unavailable"}
        </p>
      </DashboardShell>
    );
  }

  const { user, parkingSummary, quickActions } = data;
  const activeMembership = liveMembership ?? data.activeMembership;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <header className="animate-fade-up">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            Dashboard
          </p>
          <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-navy md:text-[34px]">
            {timeOfDayGreeting(user.name)}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Ready for a smoother parking day? Here’s your membership, lot status,
            and today’s rewards.
          </p>
        </header>

        <WeatherForecastBar />

        <div className="animate-fade-up-delay-1">
          <RewardsSnapshot />
        </div>

        {activeMembership && activeMembership.daysLeft <= 7 && (
          <Card className="animate-fade-up-delay-1 flex flex-wrap items-center gap-4 border-amber-200/70 bg-gradient-to-r from-[#fff8ef] to-white p-5">
            <span className="rounded-full bg-[#fff4e5] px-3 py-1.5 text-xs font-semibold text-[#b45309] ring-1 ring-[#f6d7a8]">
              {activeMembership.daysLeft} days left
            </span>
            <p className="flex-1 text-sm text-navy">
              Your {activeMembership.planName ?? "parking"} pass expires soon.
            </p>
            <Button href="/membership" variant="secondary" className="h-11 px-7">
              Renew now
            </Button>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            className="animate-fade-up-delay-1"
            label="Parking occupancy"
            value={`${parkingSummary.occupancy}%`}
            hint={parkingSummary.occupancyLabel}
            progress={parkingSummary.occupancy}
          />
          <StatCard
            className="animate-fade-up-delay-2"
            label="Available capacity"
            value={String(parkingSummary.totalAvailable)}
            hint={`of ${parkingSummary.totalCapacity} spaces`}
          />
          <StatCard
            className="animate-fade-up-delay-3"
            label="Membership"
            value={activeMembership?.status ?? "NONE"}
            hint={
              activeMembership
                ? `until ${activeMembership.endDateFormatted}`
                : "No active membership"
            }
            accent
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {quickActions.map((action, index) => (
            <QuickAction
              key={action.href + action.title}
              className={
                index === 0
                  ? "animate-fade-up-delay-1"
                  : index === 1
                    ? "animate-fade-up-delay-2"
                    : "animate-fade-up-delay-3"
              }
              title={action.title}
              description={action.description}
              href={action.href}
              action={action.actionLabel}
            />
          ))}
        </div>

        <Card className="animate-fade-up-delay-2 p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-navy">
              Automatic parking activity
            </h2>
            <Button href="/history" variant="ghost" className="h-9 px-3 text-xs">
              View all
            </Button>
          </div>
          <div className="space-y-2.5">
            {parkingHistory.slice(0, 3).map((item) => (
              <div
                key={`${item.date}-${item.time}`}
                className="flex flex-wrap gap-4 rounded-[12px] bg-surface px-3.5 py-3 text-sm text-navy"
              >
                <span className="w-24 font-medium">{item.date}</span>
                <span className="w-20 text-muted">{item.time}</span>
                <span className="capitalize text-muted">{item.event}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-surface" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-32 animate-pulse rounded-[16px] bg-surface" />
        ))}
      </div>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  progress,
  accent,
  className = "",
}: {
  label: string;
  value: string;
  hint: string;
  progress?: number;
  accent?: boolean;
  className?: string;
}) {
  return (
    <Card
      className={`relative overflow-hidden p-5 ${accent ? "bg-gradient-to-br from-white to-brand-light/40" : ""} ${className}`}
    >
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-[32px] font-semibold tracking-tight text-navy">{value}</p>
      <p className="mt-2 text-sm text-muted">{hint}</p>
      {typeof progress === "number" && (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-blue to-[#3b82c4]"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </Card>
  );
}

function QuickAction({
  title,
  description,
  href,
  action,
  className = "",
}: {
  title: string;
  description: string;
  href: string;
  action: string;
  className?: string;
}) {
  return (
    <Card className={`flex min-h-[168px] flex-col justify-between p-5 ${className}`}>
      <div>
        <h3 className="text-base font-semibold text-navy">{title}</h3>
        <p className="mt-2 max-w-[300px] text-sm leading-relaxed text-muted">
          {description}
        </p>
      </div>
      <Button href={href} variant="secondary" className="mt-5 w-fit px-5">
        {action}
      </Button>
    </Card>
  );
}
