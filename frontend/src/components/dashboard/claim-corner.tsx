"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import type { RewardsOverview } from "@/lib/rewards-types";

type ClaimState = {
  days: number;
  count: number;
  points: number;
};

export function ClaimCorner({ className = "" }: { className?: string }) {
  const [claim, setClaim] = useState<ClaimState | null>(null);

  useEffect(() => {
    let alive = true;
    api.v1
      .rewards()
      .then((overview) => {
        if (!alive) return;
        const data = overview as RewardsOverview;
        const ready = data.catalog.filter((item) => item.canRedeem);
        setClaim({
          days: ready.reduce((sum, item) => sum + item.benefitDays, 0),
          count: ready.length,
          points: data.points,
        });
      })
      .catch(() => {
        if (alive) setClaim(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!claim) {
    return (
      <div
        className={`h-11 min-w-[4.5rem] animate-pulse rounded-full bg-surface ${className}`}
        aria-hidden
      />
    );
  }

  const ready = claim.count > 0;

  return (
    <Link
      href="/rewards"
      className={`inline-flex h-11 items-center gap-1.5 rounded-full px-3 shadow-[var(--shadow-card)] ring-1 transition active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
        ready
          ? "bg-brand-red text-white ring-brand-red/30"
          : "bg-white text-navy ring-border"
      } ${className}`}
      aria-label={
        ready
          ? `${claim.count} blind boxes ready to open`
          : `${claim.points} points available`
      }
    >
      <span
        className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${
          ready ? "text-white/80" : "text-muted"
        }`}
      >
        {ready ? "Open" : "Pts"}
      </span>
      <span className="text-sm font-bold tabular-nums">
        {ready ? `${claim.count}` : claim.points}
      </span>
    </Link>
  );
}
