import { Card } from "@/components/ui/card";
import { giftImageFor } from "@/lib/gift-images";
import type { RedemptionRow } from "@/lib/rewards-types";

type GiftInventoryProps = {
  redemptions: RedemptionRow[];
};

function isGiftItem(row: RedemptionRow) {
  const total = row.benefitDaysTotal ?? row.benefitDaysRemaining;
  return total <= 0;
}

export function GiftInventory({ redemptions }: GiftInventoryProps) {
  const gifts = redemptions.filter(isGiftItem);

  return (
    <section aria-labelledby="gift-inventory-heading">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <h2
            id="gift-inventory-heading"
            className="text-lg font-semibold tracking-tight text-navy"
          >
            My gifts
          </h2>
          <p className="mt-1 text-sm text-muted">
            Water bottles, teddy bears, coffee, merch from blind boxes
          </p>
        </div>
        <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-navy">
          {gifts.length}
        </span>
      </div>

      {gifts.length === 0 ? (
        <Card className="px-4 py-6 text-center">
          <p className="text-sm font-semibold text-navy">No gifts yet</p>
          <p className="mt-1 text-sm text-muted">
            Open a blind box above — prizes land here.
          </p>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {gifts.map((g) => {
            const src = giftImageFor(g.rewardName, g.prizeImage);
            return (
              <li key={g.id}>
                <Card className="overflow-hidden p-0">
                  <div className="flex items-stretch gap-0">
                    <div className="relative h-[96px] w-[96px] shrink-0 bg-surface">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={g.rewardName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-3">
                      <p className="truncate text-sm font-semibold text-navy">
                        {g.rewardName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        Got{" "}
                        {g.createdAt
                          ? new Date(g.createdAt).toLocaleDateString()
                          : "—"}
                      </p>
                      <span className="mt-2 w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
                        In bag
                      </span>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
