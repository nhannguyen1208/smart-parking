import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatWindowHm,
  MISSION_STATUS_LABEL,
} from "@/lib/rewards-format";
import type { Mission } from "@/lib/rewards-types";

type MissionCardProps = {
  mission: Mission | null;
  busy?: boolean;
  onSimulate?: () => void;
  showDemoSimulate?: boolean;
};

const statusStyles: Record<string, string> = {
  UPCOMING: "bg-white/95 text-brand-blue ring-white/40",
  IN_PROGRESS: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
  COMPLETED: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
  MISSED: "bg-white/90 text-navy/70 ring-white/35",
  INACTIVE: "bg-white/90 text-navy/70 ring-white/35",
};

function MissionIcon({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M8 12.5 10.5 15 16 9.5"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 7.5V12l3 1.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MissionCard({
  mission,
  busy = false,
  onSimulate,
  showDemoSimulate = true,
}: MissionCardProps) {
  if (!mission) {
    return (
      <Card className="border-brand-blue/20 p-5 sm:p-6">
        <p className="text-sm font-semibold text-navy">Today&apos;s challenge</p>
        <p className="mt-2 text-sm text-muted">
          No active challenge right now. Check back soon for the next Early Arrival
          window.
        </p>
      </Card>
    );
  }

  const status = mission.status;
  const windowLabel = `${formatWindowHm(mission.windowStart)} – ${formatWindowHm(mission.windowEnd)}`;
  const isLive = status === "IN_PROGRESS";
  const isDone = status === "COMPLETED";

  return (
    <Card
      className={`relative overflow-hidden border-0 p-0 shadow-[0_12px_36px_rgba(11,46,89,0.12)] ring-1 ${
        isLive
          ? "ring-emerald-300/70"
          : isDone
            ? "ring-brand-blue/25"
            : "ring-brand-blue/35"
      }`}
    >
      {/* Accent rail */}
      <div
        className={`absolute inset-y-0 left-0 w-1.5 ${
          isLive
            ? "bg-emerald-500"
            : isDone
              ? "bg-brand-blue"
              : "bg-gradient-to-b from-brand-blue to-brand-red"
        }`}
        aria-hidden
      />

      <div className="bg-gradient-to-br from-[#0b2e59] via-[#0d3a6e] to-[#005daa] px-5 py-6 pl-6 sm:px-7 sm:py-7 sm:pl-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-3.5">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-white/15 text-white shadow-inner ring-1 ring-white/25"
              aria-hidden
            >
              <MissionIcon status={status} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
                Today&apos;s mission
              </p>
              <h2 className="mt-1.5 text-[22px] font-semibold tracking-tight text-white sm:text-2xl">
                {mission.name}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
                {mission.description}
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
              statusStyles[status] ?? statusStyles.INACTIVE
            }`}
          >
            {MISSION_STATUS_LABEL[status] ?? status}
          </span>
        </div>

        <dl className="mt-6 grid gap-2.5 sm:grid-cols-3">
          <div className="rounded-[14px] bg-white/12 px-3.5 py-3 ring-1 ring-white/15 backdrop-blur-[2px]">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-white/65">
              Reward window
            </dt>
            <dd className="mt-1 text-sm font-semibold text-white">{windowLabel}</dd>
          </div>
          <div className="rounded-[14px] bg-white/12 px-3.5 py-3 ring-1 ring-white/15 backdrop-blur-[2px]">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-white/65">
              Points available
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-white">
              +{mission.pointsAwarded}
              <span className="ml-1 text-sm font-medium text-white/80">points</span>
            </dd>
          </div>
          <div className="rounded-[14px] bg-white/12 px-3.5 py-3 ring-1 ring-white/15 backdrop-blur-[2px]">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-white/65">
              How to earn
            </dt>
            <dd className="mt-1 text-sm font-semibold text-white">
              RFID or Backup Pass
            </dd>
          </div>
        </dl>
      </div>

      <div className="space-y-4 bg-white px-5 py-5 pl-6 sm:px-7 sm:pl-8">
        <p
          className="text-[15px] font-semibold leading-relaxed text-navy"
          role="status"
        >
          {mission.message}
        </p>

        {showDemoSimulate && onSimulate ? (
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={onSimulate}
            className="h-11 w-full border-brand-blue/25 sm:w-auto"
          >
            {busy ? "Simulating…" : "DEMO: Simulate early check-in"}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
