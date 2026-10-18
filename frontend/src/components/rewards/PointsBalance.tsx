import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/rewards/ProgressBar";

type PointsBalanceProps = {
  points: number;
  pointsEarnedToday: number;
  nextRewardName?: string | null;
  pointsToNext?: number | null;
  progressPct?: number | null;
  nextPointsCost?: number | null;
  showViewRewardsLink?: boolean;
};

export function PointsBalance({
  points,
  pointsEarnedToday,
  nextRewardName,
  pointsToNext,
  progressPct,
  nextPointsCost,
  showViewRewardsLink = false,
}: PointsBalanceProps) {
  const hasNext = Boolean(nextRewardName && typeof nextPointsCost === "number");

  return (
    <Card className="relative overflow-hidden p-5 sm:p-6">
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-brand-light/50"
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted">Your points</p>
            <p className="mt-1 text-[40px] font-semibold leading-none tracking-tight tabular-nums text-navy sm:text-5xl">
              {points}
              <span className="ml-2 text-base font-medium text-muted"> points</span>
            </p>
          </div>
          {showViewRewardsLink ? (
            <Link
              href="/rewards"
              className="shrink-0 rounded-[10px] px-3 py-2 text-xs font-semibold text-brand-blue ring-1 ring-brand-blue/20 transition-colors hover:bg-brand-light/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              View rewards
            </Link>
          ) : null}
        </div>

        <p className="mt-3 text-sm text-muted">
          {pointsEarnedToday > 0 ? (
            <>
              Earned today:{" "}
              <span className="font-semibold text-navy">+{pointsEarnedToday}</span>
            </>
          ) : (
            "No points earned yet today — try today’s challenge."
          )}
        </p>

        {hasNext ? (
          <div className="mt-5">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <p className="font-medium text-navy">
                {pointsToNext === 0
                  ? "Ready to redeem your next reward"
                  : `${pointsToNext} points to your next reward`}
              </p>
              <p className="tabular-nums text-xs text-muted">
                {points} / {nextPointsCost}
              </p>
            </div>
            <ProgressBar
              value={progressPct ?? 0}
              label={`Progress toward ${nextRewardName}: ${progressPct ?? 0}%`}
            />
            <p className="mt-2 text-xs text-muted">Next up: {nextRewardName}</p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
