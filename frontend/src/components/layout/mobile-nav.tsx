"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VNUKWordmark } from "@/components/layout/vnuk-wordmark";
import { useAuth } from "@/context/auth-context";

const items = [
  { href: "/dashboard", label: "Home" },
  { href: "/parking", label: "Parking" },
  { href: "/rewards", label: "Rewards" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="mb-4 space-y-3 md:hidden">
      <div className="flex items-center justify-between rounded-[16px] border border-border/80 bg-white/90 px-4 py-3 shadow-[var(--shadow-card)] backdrop-blur-sm">
        <VNUKWordmark />
        <button
          type="button"
          onClick={() => logout()}
          className="min-h-11 min-w-11 rounded-[10px] px-2 text-xs font-semibold text-brand-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          Sign out
        </button>
      </div>
      <nav
        className="flex gap-2 overflow-x-auto pb-1"
        aria-label="Student primary"
      >
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`min-h-11 shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
                active
                  ? "bg-brand-blue text-white"
                  : "bg-white text-navy ring-1 ring-border"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
