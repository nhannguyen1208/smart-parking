import { useState } from "react";
import { api } from "../lib/api";

/**
 * Kill-Switch — REST is source of truth; socket syncs peers.
 */
export default function KillSwitch({
  isLocked = false,
  onChanged,
  disabled = false,
  compact = false,
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleToggle() {
    if (disabled || pending) return;
    setPending(true);
    setError("");
    const next = !isLocked;
    onChanged?.(next);

    try {
      const data = await api.lockVehicle(next);
      onChanged?.(Boolean(data.vehicle?.locked), data.vehicle);
    } catch (err) {
      onChanged?.(!next);
      setError(err.message || "Could not update lock");
    } finally {
      setPending(false);
    }
  }

  const btnClass = isLocked
    ? "bg-gradient-to-br from-brand-red via-[#9b1c40] to-[#70102b]"
    : "bg-gradient-to-br from-brand-blue via-[#0b4f8c] to-[#0b2e59]";

  if (compact) {
    return (
      <div className="flex flex-col items-center">
        <button
          type="button"
          disabled={disabled || pending}
          onClick={handleToggle}
          aria-pressed={isLocked}
          aria-label={isLocked ? "Unlock vehicle" : "Lock vehicle"}
          className={`relative flex h-36 w-36 flex-col items-center justify-center rounded-full text-white shadow-[0_12px_40px_rgba(11,46,89,0.35)] transition-all duration-500 active:scale-95 disabled:opacity-70 ${btnClass}`}
        >
          <span
            className={`absolute inset-0 rounded-full ${
              isLocked ? "bg-brand-red/30" : "bg-brand-blue/25"
            } animate-pulse-ring`}
          />
          <LockIcon locked={isLocked} />
          <span className="relative z-10 mt-2 text-[11px] font-bold uppercase tracking-[0.14em]">
            {pending ? "Syncing…" : isLocked ? "Inactive" : "Active"}
          </span>
        </button>
        {error ? <p className="mt-3 text-center text-xs text-[#b91c1c]">{error}</p> : null}
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[16px] border border-border/80 bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            Kill-Switch
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-navy">
            Gate lock
          </h2>
          <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-muted">
            Lock to ignore RFID at the silent gate — even if your tag is scanned.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            isLocked
              ? "bg-red-50 text-brand-red ring-1 ring-red-200"
              : "bg-brand-light/70 text-brand-blue ring-1 ring-brand-blue/20"
          }`}
        >
          {isLocked ? "Secured" : "Ready"}
        </span>
      </div>

      <div className="flex flex-col items-center py-2">
        <button
          type="button"
          disabled={disabled || pending}
          onClick={handleToggle}
          aria-pressed={isLocked}
          className={`relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-full text-white shadow-[0_12px_40px_rgba(11,46,89,0.35)] transition-all duration-500 active:scale-95 disabled:opacity-70 ${btnClass}`}
        >
          <LockIcon locked={isLocked} />
          <span className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em]">
            {pending ? "Syncing…" : isLocked ? "Inactive" : "Active"}
          </span>
        </button>
        {error ? <p className="mt-3 text-xs text-[#b91c1c]">{error}</p> : null}
      </div>
    </section>
  );
}

function LockIcon({ locked }) {
  if (locked) {
    return (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden className="relative z-10">
        <path
          d="M7 10V8a5 5 0 0 1 10 0v2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="15" r="1.4" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden className="relative z-10">
      <path
        d="M7 10V8a5 5 0 0 1 9.5-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" />
    </svg>
  );
}
