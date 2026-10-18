"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VNUKWordmark } from "@/components/layout/vnuk-wordmark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/membership", label: "Membership", icon: MembershipIcon },
  { href: "/qr-pass", label: "QR Pass", icon: QrIcon },
  { href: "/parking", label: "Parking Status", icon: ParkingIcon },
  { href: "/history", label: "History", icon: HistoryIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
  { href: "/help", label: "Help", icon: HelpIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-[248px] flex-col rounded-[18px] border border-border/80 bg-white/90 p-5 shadow-[var(--shadow-soft)] backdrop-blur-sm">
      <div>
        <VNUKWordmark />
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Smart Campus Parking
        </p>
      </div>

      <nav className="mt-7 flex flex-col gap-1.5">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

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
              <Icon active={active} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 pt-6">
        {user && (
          <div className="rounded-[12px] bg-surface px-3 py-3">
            <p className="truncate text-sm font-semibold text-navy">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.studentId}</p>
          </div>
        )}
        <Button variant="secondary" className="w-full" onClick={() => logout()}>
          Sign out
        </Button>
      </div>
    </aside>
  );
}

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 13h7V4H4v9Zm0 7h7v-5H4v5Zm9 0h7V11h-7v9Zm0-16v5h7V4h-7Z"
        fill={active ? "currentColor" : "#005daa"}
        opacity={active ? 1 : 0.75}
      />
    </svg>
  );
}

function MembershipIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16v12H4V6Zm2 2v2h12V8H6Zm0 4v2h7v-2H6Z"
        fill={active ? "currentColor" : "#005daa"}
        opacity={active ? 1 : 0.75}
      />
    </svg>
  );
}

function QrIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 4h7v7H4V4Zm2 2v3h3V6H6Zm7-2h7v7h-7V4Zm2 2v3h3V6h-3ZM4 13h7v7H4v-7Zm2 2v3h3v-3H6Zm11-2h2v2h-2v-2Zm-2 2h2v2h-2v-2Zm2 2h2v2h-2v-2Zm2-2h2v2h-2v-2Zm-4 4h2v2h-2v-2Zm2 2h2v2h-2v-2Zm2-2h2v2h-2v-2Z"
        fill={active ? "currentColor" : "#005daa"}
        opacity={active ? 1 : 0.75}
      />
    </svg>
  );
}

function ParkingIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 4h7.5a4.5 4.5 0 0 1 0 9H10v7H6V4Zm4 3v3h3.5a1.5 1.5 0 0 0 0-3H10Z"
        fill={active ? "currentColor" : "#005daa"}
        opacity={active ? 1 : 0.75}
      />
    </svg>
  );
}

function HistoryIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5a7 7 0 1 1-6.32 4H8l-3 3.5L2 9h2.1A9 9 0 1 0 12 3v2Zm1 3v4.2l3.2 1.9-.9 1.5L11 13V8h2Z"
        fill={active ? "currentColor" : "#005daa"}
        opacity={active ? 1 : 0.75}
      />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4 0-7 2-7 4.5V20h14v-1.5C19 16 16 14 12 14Z"
        fill={active ? "currentColor" : "#005daa"}
        opacity={active ? 1 : 0.75}
      />
    </svg>
  );
}

function HelpIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm0 14.2a1.1 1.1 0 1 1 1.1-1.1A1.1 1.1 0 0 1 12 17.2Zm1.6-5.1-.5.4a1.8 1.8 0 0 0-.7 1.5h-1.6v-.3a2.9 2.9 0 0 1 1.1-2.2l.7-.6a1.4 1.4 0 1 0-2.4-1h-1.7a3.1 3.1 0 1 1 5.1 2.2Z"
        fill={active ? "currentColor" : "#005daa"}
        opacity={active ? 1 : 0.75}
      />
    </svg>
  );
}
