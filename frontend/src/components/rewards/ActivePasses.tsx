import { Card } from "@/components/ui/card";
import type { RedemptionRow } from "@/lib/rewards-types";

type ActivePassesProps = {
  redemptions: RedemptionRow[];
};

function isParkingPass(row: RedemptionRow) {
  const total = row.benefitDaysTotal ?? row.benefitDaysRemaining;
  return total > 0;
}

export function ActivePasses({ redemptions }: ActivePassesProps) {
  const passes = redemptions.filter(isParkingPass);
  if (passes.length === 0) return null;

  return (
    <section aria-labelledby="active-passes-heading">
      <h2
        id="active-passes-heading"
        className="mb-3 text-lg font-semibold tracking-tight text-navy"
      >
        Free parking passes
      </h2>
      <ul className="space-y-2">
        {passes.map((r) => (
          <li key={r.id}>
            <Card className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
              <div>
                <p className="text-sm font-semibold text-navy">{r.rewardName}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {r.benefitDaysRemaining} days left · valid until{" "}
                  {new Date(r.validUntil).toLocaleDateString()} · {r.status}
                </p>
              </div>
              <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-muted">
                −{r.pointsSpent} pts
              </span>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
