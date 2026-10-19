import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatWindowHm } from "@/lib/rewards-format";
import type { Mission } from "@/lib/rewards-types";

type MissionCardProps = {
  mission: Mission | null;
  busy?: boolean;
  onSimulate?: () => void;
  showDemoSimulate?: boolean;
};

type QuestPhase = "lobby" | "active" | "cleared" | "failed" | "idle";

function phaseOf(status: string): QuestPhase {
  if (status === "COMPLETED") return "cleared";
  if (status === "IN_PROGRESS") return "active";
  if (status === "MISSED") return "failed";
  if (status === "UPCOMING") return "lobby";
  return "idle";
}

const phaseMeta: Record<
  QuestPhase,
  { label: string; tone: string; bar: string }
> = {
  lobby: {
    label: "Upcoming",
    tone: "bg-white/95 text-[#9a6700] ring-[#f5d78e]/80",
    bar: "bg-gradient-to-r from-[#fbbf24] to-[#f59e0b]",
  },
  active: {
    label: "In progress",
    tone: "bg-emerald-50 text-emerald-800 ring-emerald-200/90",
    bar: "bg-gradient-to-r from-emerald-400 to-teal-400",
  },
  cleared: {
    label: "Cleared",
    tone: "bg-white text-brand-blue ring-white/50",
    bar: "mission-xp-fill",
  },
  failed: {
    label: "Missed",
    tone: "bg-white/90 text-navy/65 ring-white/30",
    bar: "bg-white/35",
  },
  idle: {
    label: "Idle",
    tone: "bg-white/90 text-navy/70 ring-white/35",
    bar: "bg-white/35",
  },
};

function MissionMascot({ phase }: { phase: QuestPhase }) {
  const anim =
    phase === "active"
      ? "mission-bounce"
      : phase === "cleared"
        ? "mission-pop"
        : phase === "failed"
          ? ""
          : "mission-wiggle";

  return (
    <div
      className={`relative flex h-[88px] w-[88px] shrink-0 items-center justify-center ${anim}`}
      aria-hidden
    >
      <div
        className={`absolute inset-0 rounded-[28px] ${
          phase === "active"
            ? "mission-live-ring bg-emerald-400/20"
            : phase === "cleared"
              ? "bg-sky-300/20"
              : "bg-white/15"
        }`}
      />
      <div className="absolute inset-[6px] rounded-[22px] bg-gradient-to-b from-white/25 to-white/5 ring-1 ring-white/30 backdrop-blur-[2px]" />
      <svg
        width="72"
        height="72"
        viewBox="0 0 68 68"
        fill="none"
        className="relative drop-shadow-[0_8px_16px_rgba(0,0,0,0.2)]"
      >
        <rect
          x="8"
          y="28"
          width="52"
          height="24"
          rx="12"
          fill={phase === "failed" ? "#cbd5e1" : "#ffffff"}
        />
        <path
          d="M16 30c2-10 10-14 18-14s16 4 18 14"
          fill={
            phase === "cleared"
              ? "#93c5fd"
              : phase === "active"
                ? "#6ee7b7"
                : "#fcd34d"
          }
        />
        <rect x="20" y="20" width="12" height="10" rx="3" fill="#0b2e59" opacity="0.88" />
        <rect x="36" y="20" width="12" height="10" rx="3" fill="#0b2e59" opacity="0.62" />
        <circle cx="22" cy="52" r="6" fill="#0b2e59" />
        <circle cx="46" cy="52" r="6" fill="#0b2e59" />
        <circle cx="22" cy="52" r="2.4" fill="#dbe5ff" />
        <circle cx="46" cy="52" r="2.4" fill="#dbe5ff" />
        {phase === "failed" ? (
          <>
            <circle cx="26" cy="36" r="1.5" fill="#0b2e59" />
            <circle cx="38" cy="36" r="1.5" fill="#0b2e59" />
            <path
              d="M27 42c2-2 8-2 10 0"
              stroke="#0b2e59"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </>
        ) : phase === "cleared" ? (
          <>
            <path
              d="M23 36c1.2-2 3-2 4 0"
              stroke="#0b2e59"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M35 36c1.2-2 3-2 4 0"
              stroke="#0b2e59"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M27 41c2.2 2.4 7.8 2.4 10 0"
              stroke="#891635"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <circle cx="26" cy="36" r="2" fill="#0b2e59" />
            <circle cx="38" cy="36" r="2" fill="#0b2e59" />
            <circle cx="26.7" cy="35.3" r="0.65" fill="#fff" />
            <circle cx="38.7" cy="35.3" r="0.65" fill="#fff" />
            <path
              d="M27 41c2 2.2 8 2.2 10 0"
              stroke="#891635"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </>
        )}
        <path d="M48 18v-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <circle
          cx="48"
          cy="9.5"
          r="3.4"
          fill={
            phase === "active"
              ? "#34d399"
              : phase === "cleared"
                ? "#60a5fa"
                : "#f43f5e"
          }
        />
      </svg>
    </div>
  );
}

function ObjectiveRow({
  done,
  label,
  index,
}: {
  done: boolean;
  label: string;
  index: number;
}) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
          done
            ? "bg-emerald-500 text-white shadow-[0_6px_14px_rgba(16,185,129,0.35)]"
            : "bg-white text-brand-blue ring-1 ring-brand-blue/20"
        }`}
        aria-hidden
      >
        {done ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 7.2 5.8 10 11 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          index
        )}
      </span>
      <span
        className={`text-[14px] font-medium leading-snug ${
          done ? "text-muted line-through decoration-muted/50" : "text-navy"
        }`}
      >
        {label}
      </span>
    </li>
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
      <Card className="overflow-hidden border-brand-blue/15 p-0 shadow-[0_12px_36px_rgba(11,46,89,0.1)]">
        <div className="flex items-center gap-4 bg-gradient-to-br from-[#0b2e59] to-[#005daa] px-5 py-6">
          <MissionMascot phase="idle" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
              Daily quest
            </p>
            <p className="mt-1 text-base font-semibold text-white">No quest today</p>
            <p className="mt-1 text-sm text-white/70">Come back tomorrow for a new run.</p>
          </div>
        </div>
      </Card>
    );
  }

  const phase = phaseOf(mission.status);
  const meta = phaseMeta[phase];
  const windowLabel = `${formatWindowHm(mission.windowStart)} – ${formatWindowHm(mission.windowEnd)}`;
  const cleared = phase === "cleared" || mission.completedToday;
  const progressPct = cleared ? 100 : phase === "active" ? 58 : phase === "lobby" ? 18 : 8;

  return (
    <Card className="relative overflow-hidden border-0 p-0 shadow-[0_18px_48px_rgba(11,46,89,0.14)] ring-1 ring-brand-blue/15">
      {/* Hero stage */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#071a33] via-[#0b2e59] to-[#005daa] px-5 pb-6 pt-5 sm:px-7 sm:pt-6">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="mission-float absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[#7eb6e8]/20 blur-2xl" />
          <div className="mission-float-delay absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[#891635]/20 blur-2xl" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        <div className="relative flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            Daily quest
          </p>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${meta.tone} ${
              phase === "active" ? "mission-pop" : ""
            }`}
          >
            {meta.label}
          </span>
        </div>

        <div className="relative mt-4 flex items-center gap-4">
          <MissionMascot phase={phase} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[1.55rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.75rem]">
              {mission.name}
            </h2>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/75">
              {mission.description}
            </p>
          </div>
        </div>

        {/* Reward + progress */}
        <div className="relative mt-5 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-end">
          <div className="inline-flex w-fit items-center gap-2.5 rounded-2xl bg-white/12 px-3.5 py-2.5 ring-1 ring-white/20 backdrop-blur-sm">
            <span className="mission-coin flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#fde68a] to-[#f59e0b] text-sm font-bold text-[#7c2d12] shadow-[0_6px_14px_rgba(245,158,11,0.35)]">
              XP
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                Reward
              </p>
              <p className="text-lg font-semibold tabular-nums text-white">
                +{mission.pointsAwarded}
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px]">
              <span className="font-medium text-white/60">Progress to gate</span>
              <span className="font-semibold tabular-nums text-white/90">
                {cleared ? "Complete" : windowLabel}
              </span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-white/15 ring-1 ring-white/10"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Quest progress"
            >
              <div
                className={`h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none ${meta.bar}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Objectives panel */}
      <div className="space-y-4 bg-gradient-to-b from-[#f5f8fc] to-white px-5 py-5 sm:px-7">
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Objectives
          </p>
          <ul className="space-y-3">
            <ObjectiveRow
              index={1}
              done={cleared}
              label={`Arrive between ${windowLabel}`}
            />
            <ObjectiveRow
              index={2}
              done={cleared}
              label="Check in with RFID or Backup Pass"
            />
          </ul>
        </div>

        <p
          className="rounded-2xl bg-white px-4 py-3.5 text-[14px] font-medium leading-relaxed text-navy shadow-[0_4px_16px_rgba(11,46,89,0.05)] ring-1 ring-border/70"
          role="status"
        >
          {mission.message}
        </p>

        {showDemoSimulate && onSimulate ? (
          <Button
            type="button"
            disabled={busy || cleared}
            onClick={onSimulate}
            className="h-12 w-full"
          >
            {busy
              ? "Entering gate…"
              : cleared
                ? "Quest cleared"
                : "Demo · Simulate check-in"}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
