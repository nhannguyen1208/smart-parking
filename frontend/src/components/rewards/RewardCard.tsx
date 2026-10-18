import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/rewards/ProgressBar";
import type { CatalogItem } from "@/lib/rewards-types";

type RewardCardProps = {
  item: CatalogItem;
  busy?: boolean;
  onRedeem: (item: CatalogItem) => void;
};

function RewardGlyph({ benefitDays }: { benefitDays: number }) {
  const isMonthly = benefitDays >= 15;
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-brand-light/60 text-brand-blue"
      aria-hidden
    >
      {isMonthly ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect
            x="4"
            y="5"
            width="16"
            height="15"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M4 10h16M9 3.5v3M15 3.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 11.5 12 5l7 6.5V19a1.5 1.5 0 0 1-1.5 1.5H6.5A1.5 1.5 0 0 1 5 19v-7.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M10 20.5v-6h4v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}

export function RewardCard({ item, busy = false, onRedeem }: RewardCardProps) {
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex gap-3">
        <RewardGlyph benefitDays={item.benefitDays} />
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-navy">{item.name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{item.description}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-red/8 px-3 py-1 text-xs font-semibold text-brand-red ring-1 ring-brand-red/15">
          {item.pointsCost} points
        </span>
        <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-navy">
          {item.benefitDays} free parking days
        </span>
      </div>

      <div className="mt-4">
        <ProgressBar
          value={item.progressPct}
          label={`Progress toward ${item.name}`}
        />
        {!item.canRedeem ? (
          <p className="mt-2 text-xs text-muted">{item.pointsToNext} pts left</p>
        ) : null}
      </div>

      <div className="mt-auto pt-4">
        <Button
          type="button"
          className="h-11 w-full"
          disabled={!item.canRedeem || busy}
          onClick={() => onRedeem(item)}
          aria-disabled={!item.canRedeem || busy}
        >
          {item.canRedeem
            ? busy
              ? "Redeeming…"
              : "Redeem reward"
            : "Earn more points"}
        </Button>
      </div>
    </Card>
  );
}
