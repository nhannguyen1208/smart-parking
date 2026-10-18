"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, CreditCard, HelpCircle, QrCode } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MobileAppHeader } from "@/components/layout/mobile-app-header";
import { VNUKWordmark } from "@/components/layout/vnuk-wordmark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { api, ApiError } from "@/lib/api-client";
import type { ProfileData } from "@/lib/types";

export default function ProfilePage() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [rfid, setRfid] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    setLoading(true);
    api
      .profile()
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Failed to load profile");
      })
      .finally(() => setLoading(false));
    api.v1
      .studentRfid()
      .then((rows) => setRfid(rows as Array<Record<string, unknown>>))
      .catch(() => undefined);
  }, [pathname]);

  async function setAccessActive(active: boolean) {
    if (pending) return;
    const disable = !active;
    if (
      !window.confirm(
        disable
          ? "Set access to Inactive? ParkWise gate entry will be denied."
          : "Set access to Active? ParkWise gate entry will be allowed.",
      )
    ) {
      return;
    }
    setPending(true);
    try {
      await api.v1.killSwitch({ disable });
      const rows = (await api.v1.studentRfid()) as Array<Record<string, unknown>>;
      setRfid(rows);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to update access");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        <p className="text-sm text-muted">Loading student card…</p>
      </DashboardShell>
    );
  }

  if (error || !data) {
    return (
      <DashboardShell>
        <p className="rounded-[10px] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
          {error ?? "Profile unavailable"}
        </p>
      </DashboardShell>
    );
  }

  const { user, activeMembership } = data;
  const rfidSuffix = rfid[0] ? String(rfid[0].displaySuffix) : "————";
  const rfidStatus = rfid[0] ? String(rfid[0].status) : "UNLINKED";
  const isActive = rfidStatus === "ACTIVE";
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <DashboardShell>
      <div className="app-page mx-auto max-w-2xl space-y-5 md:space-y-8 pb-4">
        <MobileAppHeader title="Profile" subtitle="ID, membership & access" />

        <header className="hidden md:block">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-red">
            Digital ID
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-navy">
            Thẻ sinh viên VNUK
          </h1>
          <p className="mt-1 text-sm text-muted">
            University of Danang — VN-UK Institute for Research and Executive Education
          </p>
        </header>

        <Card className="divide-y divide-border overflow-hidden p-0 md:hidden">
          {[
            { href: "/membership", label: "Membership", hint: "Plans & renew", icon: CreditCard },
            { href: "/qr-pass", label: "Backup Pass", hint: "QR when you forget your card", icon: QrCode },
            { href: "/help", label: "Help / SOS", hint: "Campus assistance", icon: HelpCircle },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3.5 active:bg-surface"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light/70 text-brand-blue">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-navy">
                    {item.label}
                  </span>
                  <span className="block text-xs text-muted">{item.hint}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted" aria-hidden />
              </Link>
            );
          })}
        </Card>

        <div className="relative mx-auto w-full max-w-[520px]">
          <div
            className="pointer-events-none absolute -inset-3 rounded-[28px] opacity-60 blur-2xl"
            style={{
              background:
                "radial-gradient(circle at 20% 20%, rgba(0,93,170,0.35), transparent 55%), radial-gradient(circle at 80% 80%, rgba(137,22,53,0.28), transparent 50%)",
            }}
          />

          <article
            className="relative flex flex-col overflow-hidden rounded-[22px] text-white shadow-[0_24px_60px_rgba(11,46,89,0.28)] ring-1 ring-white/10"
            style={{
              background:
                "linear-gradient(145deg, #0b2e59 0%, #0a3d73 42%, #891635 160%)",
              aspectRatio: "1.586 / 1",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-18deg, transparent, transparent 12px, rgba(255,255,255,0.55) 12px, rgba(255,255,255,0.55) 13px)",
              }}
            />
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-[#891635]/40 blur-2xl" />

            <div className="relative border-b border-white/15 px-5 pb-3 pt-4 sm:px-6 sm:pt-5">
              <VNUKWordmark onDark size="sm" />
            </div>

            <div className="relative grid flex-1 grid-cols-[0.9fr_1.35fr] gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
              <div className="flex flex-col items-center justify-between">
                <div className="relative flex aspect-[3/4] w-full max-w-[118px] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#dbe5ff] to-[#b8c9ef] text-[#0b2e59] shadow-inner ring-2 ring-white/35">
                  <span className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {initials || user.name.charAt(0)}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 bg-[#891635]/90 py-0.5 text-center text-[8px] font-semibold uppercase tracking-wider text-white">
                    Photo
                  </div>
                </div>
                <div className="mt-2 hidden w-full rounded-md bg-black/25 px-2 py-1.5 sm:block">
                  <p className="text-[8px] uppercase tracking-wide text-white/50">RFID</p>
                  <p className="font-mono text-[11px] font-semibold tracking-[0.2em]">
                    ••••{rfidSuffix}
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 flex-col justify-between py-0.5">
                <div>
                  <Field label="Họ và tên / Full name" value={user.name} large />
                  <div className="mt-2.5 grid grid-cols-2 gap-2 sm:mt-3 sm:gap-3">
                    <Field label="Mã SV / Student ID" value={user.studentId} mono />
                    <Field
                      label="Hạng / Role"
                      value={user.role === "STUDENT" ? "Sinh viên" : user.role}
                    />
                  </div>
                  <div className="mt-2.5 sm:mt-3">
                    <Field label="Email" value={user.email} compact />
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2 sm:mt-3">
                    <Field
                      label="Gói gửi xe"
                      value={
                        activeMembership
                          ? activeMembership.planName || activeMembership.status
                          : "Chưa đăng ký"
                      }
                    />
                    <Field
                      label="Hiệu lực đến"
                      value={activeMembership?.endDateFormatted ?? "—"}
                    />
                  </div>
                </div>

                {/* Active / Inactive toggle (Kill-Switch) */}
                <div className="mt-2 border-t border-white/15 pt-2.5">
                  <p className="mb-1.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    Gate access
                  </p>
                  <div
                    className="inline-flex rounded-full bg-black/30 p-0.5 ring-1 ring-white/15"
                    role="group"
                    aria-label="Gate access status"
                  >
                    <button
                      type="button"
                      disabled={pending || !rfid[0]}
                      onClick={() => setAccessActive(true)}
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition disabled:opacity-50 ${
                        isActive
                          ? "bg-emerald-400 text-[#04322a] shadow-sm"
                          : "text-white/55 hover:text-white/85"
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      disabled={pending || !rfid[0]}
                      onClick={() => setAccessActive(false)}
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition disabled:opacity-50 ${
                        !isActive
                          ? "bg-[#ffb3c4] text-[#5c1024] shadow-sm"
                          : "text-white/55 hover:text-white/85"
                      }`}
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full md:hidden"
          onClick={() => void logout()}
        >
          Sign out
        </Button>
      </div>
    </DashboardShell>
  );
}

function Field({
  label,
  value,
  large,
  mono,
  compact,
}: {
  label: string;
  value: string;
  large?: boolean;
  mono?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/45 sm:text-[9px]">
        {label}
      </p>
      <p
        className={`mt-0.5 truncate font-semibold text-white ${
          large
            ? "text-sm leading-snug sm:text-base"
            : compact
              ? "text-[11px]"
              : "text-xs sm:text-[13px]"
        } ${mono ? "font-mono tracking-wide" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
