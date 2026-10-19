import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/rewards/ProgressBar";
import { giftImageFor } from "@/lib/gift-images";
import type { CatalogItem } from "@/lib/rewards-types";

type RewardCardProps = {
  item: CatalogItem;
  busy?: boolean;
  onRedeem: (item: CatalogItem) => void;
};

function BlindGlyph({ tier }: { tier: "common" | "lucky" | "rare" | "epic" }) {
  const tone =
    tier === "epic"
      ? "from-[#891635] to-[#c43b5c] text-white"
      : tier === "rare"
        ? "from-[#005daa] to-[#3b82f6] text-white"
        : tier === "lucky"
          ? "from-[#f59e0b] to-[#fbbf24] text-[#7c2d12]"
          : "from-[#64748b] to-[#94a3b8] text-white";

  return (
    <div
      className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br shadow-[0_8px_16px_rgba(11,46,89,0.12)] ${tone}`}
      aria-hidden
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 11h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9Z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path d="M3 7.5h18v3.5H3V7.5Z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 7.5V22" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M12 7.5c-1.8-3.2-4.8-3.4-6-1.6-1 1.5.2 3.4 2.6 3.4H12"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M12 7.5c1.8-3.2 4.8-3.4 6-1.6 1 1.5-.2 3.4-2.6 3.4H12"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-black text-navy shadow ring-1 ring-border">
        ?
      </span>
    </div>
  );
}

function tierOf(name: string): "common" | "lucky" | "rare" | "epic" {
  const n = name.toLowerCase();
  if (n.includes("epic")) return "epic";
  if (n.includes("rare")) return "rare";
  if (n.includes("lucky")) return "lucky";
  return "common";
}

export function RewardCard({ item, busy = false, onRedeem }: RewardCardProps) {
  const blind = Boolean(item.isBlindBox);

  return (
    <Card className="flex h-full flex-col p-5 ring-1 ring-brand-blue/10">
      <div className="flex gap-3">
        <BlindGlyph tier={tierOf(item.name)} />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            {blind ? "Blind box" : "Gift"}
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-navy">{item.name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{item.description}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-red/8 px-3 py-1 text-xs font-semibold text-brand-red ring-1 ring-brand-red/15">
          {item.pointsCost} pts
        </span>
        <span className="rounded-full bg-[#fff4d6] px-3 py-1 text-xs font-semibold text-[#9a6700] ring-1 ring-[#f5d78e]/80">
          {blind
            ? `${item.prizePreview?.length ?? "?"} prizes inside`
            : `${item.benefitDays} free days`}
        </span>
      </div>

      {blind && item.prizePreview && item.prizePreview.length > 0 ? (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {item.prizePreview.slice(0, 4).map((p) => (
            <div key={p.key} className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={giftImageFor(p.name, p.image)}
                alt={p.name}
                className="mx-auto h-12 w-12 rounded-[10px] object-cover ring-1 ring-border"
              />
              <p className="mt-1 truncate text-[10px] font-medium text-muted">
                {p.name}
              </p>
            </div>
          ))}
        </div>
      ) : null}

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
              ? "Opening…"
              : blind
                ? "Open blind box"
                : "Claim gift"
            : "Earn more points"}
        </Button>
      </div>
    </Card>
  );
}
