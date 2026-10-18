import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <Card className={`px-5 py-8 text-center ${className}`}>
      <div
        className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-brand-blue"
        aria-hidden
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M12 8v4l2.5 1.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="text-sm font-semibold text-navy">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
        {description}
      </p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </Card>
  );
}
