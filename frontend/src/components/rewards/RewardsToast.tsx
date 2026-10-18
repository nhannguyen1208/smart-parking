type RewardsToastProps = {
  message: string;
  tone?: "success" | "error" | "info";
  onDismiss: () => void;
};

const toneClass = {
  success: "border-emerald-200 bg-[#eefaf2] text-navy",
  error: "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]",
  info: "border-border bg-white text-navy",
};

export function RewardsToast({
  message,
  tone = "info",
  onDismiss,
}: RewardsToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start justify-between gap-3 rounded-[14px] border px-4 py-3 text-sm shadow-[var(--shadow-card)] ${toneClass[tone]}`}
    >
      <p className="leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-muted hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        aria-label="Dismiss message"
      >
        Dismiss
      </button>
    </div>
  );
}
