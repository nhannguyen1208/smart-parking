import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/rewards/ProgressBar";
import type { CatalogItem } from "@/lib/rewards-types";

type RewardProgressProps = {
  points: number;
  nextReward: CatalogItem | null;
};

export function RewardProgress({ points, nextReward }: RewardProgressProps) {
  if (!nextReward) {
    return (
      <Card className="flex h-full flex-col justify-center p-5 sm:p-6">
        <p className="text-sm font-medium text-muted">Your next reward</p>
        <p className="mt-2 text-sm text-muted">No rewards available</p>
      </Card>
    );
  }

  const ready = nextReward.pointsToNext === 0;

  return (
    <Card className="flex h-full flex-col p-5 sm:p-6">
      <p className="text-sm font-medium text-muted">Your next reward</p>
      <h3 className="mt-1 text-lg font-semibold tracking-tight text-navy">
        {nextReward.benefitDays} free parking days
      </h3>
      <p className="mt-1 text-sm text-muted">{nextReward.name}</p>

      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold tabular-nums text-navy">
            {points}{" "}
            <span className="font-medium text-muted">/ {nextReward.pointsCost} points</span>
          </p>
          <p className="text-xs font-medium text-brand-blue">
            {ready ? "Ready!" : `${nextReward.progressPct}%`}
          </p>
        </div>
        <ProgressBar
          value={nextReward.progressPct}
          label={`Progress toward ${nextReward.name}`}
          barClassName={ready ? "bg-brand-red" : "bg-brand-blue"}
        />
        {ready ? (
          <p className="mt-3 text-sm text-muted">Ready to redeem below.</p>
        ) : null}
      </div>
    </Card>
  );
}
