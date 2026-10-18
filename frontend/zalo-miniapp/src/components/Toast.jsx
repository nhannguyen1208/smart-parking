import { useEffect } from "react";

export default function Toast({ message, onDismiss, duration = 3200 }) {
  useEffect(() => {
    if (!message) return undefined;
    const id = window.setTimeout(() => onDismiss?.(), duration);
    return () => window.clearTimeout(id);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[80] flex justify-center px-4">
      <div className="pointer-events-auto max-w-md animate-fade-up rounded-[14px] border border-border/80 bg-white px-4 py-3 text-sm text-navy shadow-[var(--shadow-card)]">
        {message}
      </div>
    </div>
  );
}
