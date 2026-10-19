"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/rewards/ProgressBar";
import { api, ApiError } from "@/lib/api-client";
import { formatWindowHm } from "@/lib/rewards-format";
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
        <p className="text-sm font-semibold text-navy">Rewards</p>
        <p className="mt-1 text-sm text-muted">{error}</p>
        <Button href="/rewards" variant="secondary" className="mt-4 h-11 w-fit">
          Open Rewards
        </Button>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="h-[168px] animate-pulse bg-surface p-5" aria-busy="true">
        <p className="text-sm text-muted">Loading rewards…</p>
      </Card>
    );
  }

  const next = data.nextReward;
  const mission = data.mission;
  const missionDone =
    mission?.status === "COMPLETED" || Boolean(mission?.completedToday);

  return (
    <Card className="overflow-hidden border-brand-blue/15 p-0 shadow-[0_10px_28px_rgba(11,46,89,0.08)]">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-blue">
            Points
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-navy">
            {data.points}
          </p>
          {next ? (
            <p className="mt-1 text-sm text-muted">
              {next.pointsToNext === 0
                ? "Ready to redeem"
                : `${next.pointsToNext} pts to next`}
            </p>
          ) : null}
        </div>
        <Link
          href="/rewards"
          className="text-xs font-semibold text-brand-blue hover:underline"
        >
          Open
        </Link>
      </div>

      {next ? (
        <div className="px-5 pt-3 sm:px-6">
          <ProgressBar
            value={next.progressPct}
            label={`Progress toward ${next.name}`}
          />
        </div>
      ) : null}

      {/* Mission — claim amount in corner */}
      <div className="relative mt-4 overflow-hidden border-t border-border/70 bg-gradient-to-br from-[#071a33] via-[#0b2e59] to-[#005daa] px-5 py-4 sm:px-6">
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#7eb6e8]/20 blur-2xl"
          aria-hidden
        />

        {mission ? (
          <>
            {/* Corner claim chip */}
            <Link
              href="/rewards"
              className={`absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-[0_6px_14px_rgba(0,0,0,0.2)] ring-1 sm:right-4 sm:top-4 ${
                missionDone
                  ? "bg-emerald-400 text-[#064e3b] ring-emerald-200/80"
                  : "bg-gradient-to-br from-[#fde68a] to-[#f59e0b] text-[#7c2d12] ring-[#fde68a]/70"
              }`}
              aria-label={
                missionDone
                  ? `Claimed ${mission.pointsAwarded} XP`
                  : `Claim ${mission.pointsAwarded} XP from mission`
              }
            >
              <span className="opacity-80">
                {missionDone ? "Got" : "Claim"}
              </span>
              <span className="tabular-nums">+{mission.pointsAwarded}</span>
            </Link>

            <div className="relative min-w-0 pr-24">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
                Today&apos;s mission
              </p>
              <p className="mt-1.5 text-base font-semibold text-white">
                {mission.name}
              </p>
              <p className="mt-1 text-xs text-white/75">
                {formatWindowHm(mission.windowStart)} –{" "}
                {formatWindowHm(mission.windowEnd)}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-white/85">
                {mission.message}
              </p>
              <Button
                href="/rewards"
                variant="secondary"
                className="mt-3 h-10 border-0 bg-white px-4 text-xs text-navy hover:bg-white/95"
              >
                Open mission
              </Button>
            </div>
          </>
        ) : (
          <div className="relative flex items-center justify-between gap-3">
            <p className="text-sm text-white/85">No mission right now</p>
            <Button
              href="/rewards"
              variant="secondary"
              className="h-10 border-0 bg-white px-3 text-xs text-navy"
            >
              Rewards
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
