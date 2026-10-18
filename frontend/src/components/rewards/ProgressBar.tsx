type ProgressBarProps = {
  value: number;
  label: string;
  className?: string;
  barClassName?: string;
};

export function ProgressBar({
  value,
  label,
  className = "",
  barClassName = "bg-brand-blue",
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      className={`h-2.5 overflow-hidden rounded-full bg-surface ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none ${barClassName}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
