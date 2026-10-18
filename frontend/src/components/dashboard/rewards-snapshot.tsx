"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/rewards/ProgressBar";
import { api, ApiError } from "@/lib/api-client";
import { formatWindowHm, MISSION_STATUS_LABEL } from "@/lib/rewards-format";
import type { RewardsOverview } from "@/lib/rewards-types";

export function RewardsSnapshot() {
  const [data, setData] = useState<RewardsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api.v1
      .rewards()
      .then((overview) => {
        if (alive) setData(overview as RewardsOverview);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(
          err instanceof ApiError ? err.message : "Could not load rewards",
        );
      });
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <Card className="p-5">
        <p className="text-sm font-semibold text-navy">Parking rewards</p>
        <p className="mt-1 text-sm text-muted">{error}</p>
        <Button href="/rewards" variant="secondary" className="mt-4 h-11 w-fit">
          Open Rewards
        </Button>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="h-[200px] animate-pulse bg-surface p-5" aria-busy="true">
        <p className="text-sm text-muted">Loading rewards…</p>
      </Card>
    );
  }

  const next = data.nextReward;
  const mission = data.mission;

  return (
    <Card className="overflow-hidden border-brand-blue/20 p-0 shadow-[0_10px_28px_rgba(11,46,89,0.08)]">
      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.15fr]">
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue">
                Your points
              </p>
              <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-navy">
                {data.points}
              </p>
              {next ? (
                <p className="mt-1 text-sm text-muted">
                  {next.pointsToNext === 0
                    ? "Ready to redeem"
                    : `${next.pointsToNext} pts to ${next.benefitDays} free days`}
                </p>
              ) : null}
            </div>
            <Link
              href="/rewards"
              className="shrink-0 text-xs font-semibold text-brand-blue hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              View rewards
            </Link>
          </div>
          {next ? (
            <ProgressBar
              value={next.progressPct}
              label={`Progress toward ${next.name}`}
            />
          ) : null}
        </div>

        <div className="relative border-t border-white/10 bg-gradient-to-br from-[#0b2e59] via-[#0d3a6e] to-[#005daa] p-5 sm:border-l sm:border-t-0 sm:p-6">
          <div
            className="absolute inset-y-0 left-0 hidden w-1 bg-gradient-to-b from-[#7eb6e8] to-brand-red sm:block"
            aria-hidden
          />
          {mission ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                  Today&apos;s mission
                </p>
                <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-navy ring-1 ring-white/40">
                  {MISSION_STATUS_LABEL[mission.status] ?? mission.status}
                </span>
              </div>
              <p className="mt-2 text-base font-semibold text-white">{mission.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                {formatWindowHm(mission.windowStart)} –{" "}
                {formatWindowHm(mission.windowEnd)} ·{" "}
                <span className="font-semibold text-white">
                  +{mission.pointsAwarded} points
                </span>
              </p>
              <p className="mt-2 text-sm font-medium text-white">{mission.message}</p>
              <Button
                href="/rewards"
                variant="secondary"
                className="mt-4 h-11 w-full border-0 bg-white text-navy hover:bg-white/95 sm:w-auto"
              >
                See today&apos;s mission
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-white">Today&apos;s mission</p>
              <p className="mt-2 text-sm text-white/80">No active challenge</p>
              <Button
                href="/rewards"
                variant="secondary"
                className="mt-4 h-11 w-full border-0 bg-white text-navy hover:bg-white/95 sm:w-auto"
              >
                Open Rewards
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
