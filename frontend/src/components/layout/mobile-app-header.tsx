"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { VNUKWordmark } from "@/components/layout/vnuk-wordmark";
import { useAuth } from "@/context/auth-context";
import { firstName } from "@/lib/rewards-format";

type MobileAppHeaderProps = {
  title?: string;
  subtitle?: string;
  showGreeting?: boolean;
};

export function MobileAppHeader({
  title,
  subtitle,
  showGreeting = false,
}: MobileAppHeaderProps) {
  const { user } = useAuth();
  const name = user?.name ? firstName(user.name) : "there";

  return (
    <header className="mb-4 flex items-center justify-between gap-3 md:hidden">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <VNUKWordmark size="sm" />
          <span className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            ParkWise
          </span>
        </div>
        {showGreeting ? (
          <p className="mt-2 truncate text-lg font-semibold tracking-tight text-navy">
            Hi, {name}
          </p>
        ) : null}
        {title ? (
          <h1 className="mt-2 truncate text-xl font-semibold tracking-tight text-navy">
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>
        ) : null}
      </div>
      <Link
        href="/profile"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-navy shadow-[var(--shadow-card)] ring-1 ring-border active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        aria-label="Open profile"
      >
        <UserRound className="h-5 w-5" aria-hidden />
      </Link>
    </header>
  );
}
