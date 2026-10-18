import { useState } from "react";
import { getSocket } from "../lib/socket";

/**
 * Kill-Switch — premium circular lock control.
 * RED = locked/safe · GREEN = unlocked/ready
 */
export default function KillSwitch({
  vehicleId = "veh_001",
  isLocked = false,
  onChanged,
  disabled = false,
}) {
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    if (disabled || pending) return;
    setPending(true);
    const next = !isLocked;

    try {
      const socket = getSocket();
      if (!socket.connected) socket.connect();

      // Spec: emit toggle-lock to backend over Socket.io
      socket.emit("toggle-lock", { vehicleId, locked: next });

      // Optimistic UI; Dashboard also syncs via vehicle:lock-changed
      onChanged?.(next);

      // Brief haptic-like delay for premium feel
      await new Promise((r) => setTimeout(r, 280));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="glass-card relative overflow-hidden rounded-[28px] p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/5 blur-2xl" />
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
            Kill-Switch
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
            Total Mind-Ease
          </h2>
          <p className="mt-1 max-w-[200px] text-xs leading-relaxed text-white/50">
            Lock to ignore RFID at the silent gate — even if your tag is scanned.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            isLocked
              ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/30"
              : "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30"
          }`}
        >
          {isLocked ? "Secured" : "Ready"}
        </span>
      </div>

      <div className="flex flex-col items-center py-2">
        <div className="relative flex h-44 w-44 items-center justify-center">
          {/* Glow rings */}
          <span
            className={`absolute inset-3 rounded-full blur-xl transition-all duration-500 ${
              isLocked ? "bg-rose-500/45" : "bg-emerald-400/40"
            } ${pending ? "scale-110" : "scale-100"}`}
          />
          <span
            className={`absolute inset-0 rounded-full ${
              isLocked ? "bg-rose-500/25" : "bg-emerald-400/20"
            } animate-pulse-ring`}
          />
          <span
            className={`absolute inset-4 rounded-full border ${
              isLocked ? "border-rose-300/40" : "border-emerald-300/40"
            }`}
          />

          <button
            type="button"
            disabled={disabled || pending}
            onClick={handleToggle}
            aria-pressed={isLocked}
            aria-label={isLocked ? "Unlock vehicle" : "Lock vehicle"}
            className={`relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-full text-white shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all duration-500 active:scale-95 disabled:opacity-70 ${
              isLocked
                ? "bg-gradient-to-br from-rose-500 via-rose-600 to-rose-800"
                : "bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-700"
            }`}
          >
            <LockIcon locked={isLocked} />
            <span className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em]">
              {pending ? "Syncing…" : isLocked ? "Locked" : "Unlocked"}
            </span>
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-white/45">
          Tap to {isLocked ? "unlock for campus exit/entry" : "immobilize at the gate"}
        </p>
      </div>
    </section>
  );
}

function LockIcon({ locked }) {
  if (locked) {
    return (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 10V8a5 5 0 0 1 10 0v2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect
          x="5"
          y="10"
          width="14"
          height="10"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="12" cy="15" r="1.4" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 10V8a5 5 0 0 1 9.5-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" />
    </svg>
  );
}
