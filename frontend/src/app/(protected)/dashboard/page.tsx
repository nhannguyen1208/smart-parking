"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, QrCode, Ticket } from "lucide-react";
import { RewardsSnapshot } from "@/components/dashboard/rewards-snapshot";
import { WeatherForecastBar } from "@/components/dashboard/weather-forecast-bar";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MobileAppHeader } from "@/components/layout/mobile-app-header";
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
      <div className="app-page space-y-4 md:space-y-6">
        {/* Mobile app header */}
        <MobileAppHeader showGreeting />

        {/* Desktop header */}
        <header className="hidden animate-fade-up md:block">
          <h1 className="text-[30px] font-semibold tracking-tight text-navy md:text-[34px]">
            {timeOfDayGreeting(user.name)}
          </h1>
        </header>

        {/* Primary: parking status */}
        <Card className="animate-fade-up overflow-hidden border-brand-blue/15 p-0">
          <div className="bg-gradient-to-br from-[#0b2e59] to-[#005daa] px-4 py-4 text-white sm:px-5 sm:py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                  Campus parking
                </p>
                <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
                  {parkingSummary.occupancy}%
                  <span className="ml-2 text-sm font-medium text-white/80">
                    occupied
                  </span>
                </p>
                <p className="mt-1 text-sm text-white/80">
                  {parkingSummary.occupancyLabel} · {parkingSummary.totalAvailable}{" "}
                  spaces free
                </p>
              </div>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold ring-1 ring-white/20">
                Live
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white"
                style={{
                  width: `${Math.min(100, Math.max(0, parkingSummary.occupancy))}%`,
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 px-4 py-4 sm:px-5">
            <Button href="/qr-pass" className="h-11 w-full gap-2 px-3 text-sm">
              <QrCode className="h-4 w-4" aria-hidden />
              Backup Pass
            </Button>
            <Button
              href="/parking"
              variant="secondary"
              className="h-11 w-full px-3 text-sm"
            >
              Lot details
            </Button>
          </div>
        </Card>

        {activeMembership && activeMembership.daysLeft <= 7 ? (
          <Card className="flex flex-wrap items-center gap-3 border-amber-200/70 bg-[#fff8ef] p-4">
            <span className="rounded-full bg-[#fff4e5] px-2.5 py-1 text-xs font-semibold text-[#b45309] ring-1 ring-[#f6d7a8]">
              {activeMembership.daysLeft} days left
            </span>
            <p className="min-w-0 flex-1 text-sm text-navy">
              Your pass expires soon.
            </p>
            <Button href="/membership" variant="secondary" className="h-10 px-4">
              Renew
            </Button>
          </Card>
        ) : null}

        {/* Rewards */}
        <section className="animate-fade-up-delay-1 space-y-2">
          <div className="flex items-center justify-between px-0.5 md:hidden">
            <h2 className="text-sm font-semibold text-navy">Rewards</h2>
            <Link
              href="/rewards"
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-blue"
            >
              Open
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <RewardsSnapshot />
        </section>

        {/* Weather — secondary on mobile */}
        <div className="animate-fade-up-delay-2">
          <WeatherForecastBar />
        </div>

        {/* Desktop stats grid */}
        <div className="hidden gap-4 md:grid md:grid-cols-3">
          <StatCard
            label="Parking occupancy"
            value={`${parkingSummary.occupancy}%`}
            hint={parkingSummary.occupancyLabel}
            progress={parkingSummary.occupancy}
          />
          <StatCard
            label="Available capacity"
            value={String(parkingSummary.totalAvailable)}
            hint={`of ${parkingSummary.totalCapacity} spaces`}
          />
          <StatCard
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

        {/* Shortcuts */}
        <section className="animate-fade-up-delay-2">
          <h2 className="mb-2 px-0.5 text-sm font-semibold text-navy md:mb-3 md:text-base">
            Shortcuts
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.href + action.title}
                href={action.href}
                className="flex min-h-[96px] flex-col justify-between rounded-[14px] border border-border/80 bg-white p-3.5 shadow-[var(--shadow-card)] transition active:scale-[0.98] md:min-h-[140px] md:p-5"
              >
                <p className="text-sm font-semibold text-navy">{action.title}</p>
                <span className="mt-3 text-xs font-semibold text-brand-blue">
                  {action.actionLabel}
                </span>
              </Link>
            ))}
            <Link
              href="/membership"
              className="flex min-h-[96px] flex-col justify-between rounded-[14px] border border-border/80 bg-white p-3.5 shadow-[var(--shadow-card)] transition active:scale-[0.98] md:hidden"
            >
              <div>
                <Ticket className="mb-1 h-4 w-4 text-brand-blue" aria-hidden />
                <p className="text-sm font-semibold text-navy">Membership</p>
              </div>
              <span className="mt-3 text-xs font-semibold text-brand-blue">
                Manage
              </span>
            </Link>
          </div>
        </section>

        {/* Recent activity */}
        <Card className="animate-fade-up-delay-3 p-4 md:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-navy md:text-base">
              Recent activity
            </h2>
            <Button href="/history" variant="ghost" className="h-9 px-3 text-xs">
              View all
            </Button>
          </div>
          <ul className="space-y-2">
            {parkingHistory.slice(0, 3).map((item) => (
              <li
                key={`${item.date}-${item.time}`}
                className="flex items-center justify-between gap-3 rounded-[12px] bg-surface px-3.5 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium capitalize text-navy">{item.event}</p>
                  <p className="text-xs text-muted">
                    {item.date} · {item.time}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted">Gate</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </DashboardShell>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="space-y-4">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-surface md:w-56" />
      <div className="h-44 animate-pulse rounded-[16px] bg-surface" />
      <div className="h-36 animate-pulse rounded-[16px] bg-surface" />
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
            className="h-full rounded-full bg-brand-blue"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </Card>
  );
}
