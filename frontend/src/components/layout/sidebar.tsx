"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VNUKWordmark } from "@/components/layout/vnuk-wordmark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import type { UserRole } from "@/lib/types";

type NavItem = { href: string; label: string; roles: UserRole[] };

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["STUDENT"] },
  { href: "/rewards", label: "Rewards", roles: ["STUDENT"] },
  { href: "/membership", label: "Membership", roles: ["STUDENT"] },
  { href: "/qr-pass", label: "Backup Pass", roles: ["STUDENT"] },
  { href: "/parking", label: "Parking Status", roles: ["STUDENT"] },
  { href: "/history", label: "History", roles: ["STUDENT"] },
  { href: "/profile", label: "Profile", roles: ["STUDENT"] },
  { href: "/help", label: "Help / SOS", roles: ["STUDENT"] },
  { href: "/guard", label: "Guard home", roles: ["GUARD", "ADMIN"] },
  { href: "/guard/verify", label: "Verify / Scan", roles: ["GUARD", "ADMIN"] },
  { href: "/guard/sessions", label: "Active sessions", roles: ["GUARD", "ADMIN"] },
  { href: "/guard/occupancy", label: "Occupancy", roles: ["GUARD", "ADMIN"] },
  { href: "/guard/exceptions", label: "Exceptions", roles: ["GUARD", "ADMIN"] },
  { href: "/admin", label: "Admin overview", roles: ["ADMIN"] },
  { href: "/admin/rewards", label: "Rewards config", roles: ["ADMIN"] },
  { href: "/admin/users", label: "Users", roles: ["ADMIN"] },
  { href: "/admin/events", label: "Events", roles: ["ADMIN"] },
  { href: "/admin/integrations", label: "Integrations", roles: ["ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role ?? "STUDENT";
  const items = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="flex h-full w-[248px] flex-col rounded-[18px] border border-border/80 bg-white/90 p-5 shadow-[var(--shadow-soft)] backdrop-blur-sm">
      <div>
        <VNUKWordmark />
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          ParkWise
        </p>
      </div>

      <nav className="mt-7 flex flex-col gap-1.5">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              item.href !== "/guard" &&
              item.href !== "/admin" &&
              pathname.startsWith(item.href)) ||
            pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-brand-blue text-white shadow-[0_8px_18px_rgba(0,93,170,0.28)]"
                  : "text-navy hover:bg-surface"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 pt-6">
        {user && (
          <div className="rounded-[12px] bg-surface px-3 py-3">
            <p className="truncate text-sm font-semibold text-navy">{user.name}</p>
            <p className="truncate text-xs text-muted">
              {user.role} · {user.studentId}
            </p>
          </div>
        )}
        <Button variant="secondary" className="w-full" onClick={() => logout()}>
          Sign out
        </Button>
      </div>
    </aside>
  );
}
