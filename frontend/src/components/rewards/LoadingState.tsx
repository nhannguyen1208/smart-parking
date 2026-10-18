export function LoadingState({ label = "Loading your rewards…" }: { label?: string }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-surface" />
        <div className="h-8 w-56 animate-pulse rounded-lg bg-surface" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-surface" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-36 animate-pulse rounded-[16px] bg-surface" />
        <div className="h-36 animate-pulse rounded-[16px] bg-surface" />
      </div>
      <div className="h-48 animate-pulse rounded-[16px] bg-surface" />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
