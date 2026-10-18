import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/rewards/EmptyState";
import { formatActivityDate } from "@/lib/rewards-format";
import type { HistoryRow } from "@/lib/rewards-types";

type PointsActivityListProps = {
  rows: HistoryRow[];
  limit?: number;
  showFullHistoryLink?: boolean;
  historyHref?: string;
};

export function PointsActivityList({
  rows,
  limit = 8,
  showFullHistoryLink = true,
  historyHref = "/history",
}: PointsActivityListProps) {
  const visible = rows.slice(0, limit);

  return (
    <section aria-labelledby="rewards-activity-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          id="rewards-activity-heading"
          className="text-lg font-semibold tracking-tight text-navy"
        >
          Recent activity
        </h2>
        {showFullHistoryLink ? (
          <Link
            href={historyHref}
            className="text-xs font-semibold text-brand-blue hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            View reward history
          </Link>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Complete today’s Early Arrival Challenge to earn your first points."
        />
      ) : (
        <ul className="space-y-2">
          {visible.map((row) => {
            const earned = row.points >= 0;
            return (
              <li key={row.id}>
                <Card className="flex items-start justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        earned
                          ? "bg-brand-light/80 text-brand-blue"
                          : "bg-brand-red/10 text-brand-red"
                      }`}
                      aria-hidden
                    >
                      {earned ? "+" : "−"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy">
                        {row.description}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatActivityDate(row.createdAt)}
                        <span className="sr-only">
                          {earned ? ", points earned" : ", points spent"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      earned ? "text-brand-blue" : "text-brand-red"
                    }`}
                  >
                    <span aria-hidden>
                      {earned ? `+${row.points}` : row.points}
                    </span>
                    <span className="sr-only">
                      {earned
                        ? `Earned ${row.points} points`
                        : `Spent ${Math.abs(row.points)} points`}
                    </span>
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
