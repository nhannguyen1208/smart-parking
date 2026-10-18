"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CarFront,
  Gift,
  History,
  Home,
  UserRound,
  type LucideIcon,
} from "lucide-react";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
};

const tabs: Tab[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: Home,
    match: (p) => p === "/dashboard" || p === "/",
  },
  {
    href: "/parking",
    label: "Parking",
    icon: CarFront,
  },
  {
    href: "/rewards",
    label: "Rewards",
    icon: Gift,
  },
  {
    href: "/history",
    label: "History",
    icon: History,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserRound,
    match: (p) =>
      p.startsWith("/profile") ||
      p.startsWith("/membership") ||
      p.startsWith("/qr-pass") ||
      p.startsWith("/help"),
  },
];

function isActive(pathname: string, tab: Tab) {
  if (tab.match) return tab.match(pathname);
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/90 bg-white/95 shadow-[0_-8px_30px_rgba(11,46,89,0.08)] backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Primary"
    >
      <ul className="mx-auto grid h-[64px] max-w-lg grid-cols-5 px-1">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="min-w-0">
              <Link
                href={tab.href}
                className={`flex h-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 transition-colors active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-blue ${
                  active ? "text-brand-blue" : "text-muted"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    active ? "bg-brand-light/80" : "bg-transparent"
                  }`}
                >
                  <Icon
                    className="h-[22px] w-[22px]"
                    strokeWidth={active ? 2.4 : 1.9}
                    aria-hidden
                  />
                </span>
                <span
                  className={`max-w-full truncate text-[10px] font-semibold tracking-wide ${
                    active ? "text-brand-blue" : "text-muted"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
