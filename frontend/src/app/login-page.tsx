"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AccentBar } from "@/components/layout/accent-bar";
import { VNUKWordmark } from "@/components/layout/vnuk-wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, error, login, clearError } = useAuth();
  const [identifier, setIdentifier] = useState("STU-NHI");
  const [password, setPassword] = useState("password123");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const redirect =
        searchParams.get("redirect") ??
        (user.role === "GUARD"
          ? "/guard"
          : user.role === "ADMIN"
            ? "/admin"
            : "/dashboard");
      router.replace(redirect);
    }
  }, [loading, user, router, searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    setSubmitting(true);

    try {
      const looksLikeEmail = identifier.includes("@");
      await login(
        looksLikeEmail
          ? { email: identifier, password }
          : { studentId: identifier, password },
      );
    } catch {
      // Error state handled in auth context.
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page-atmosphere flex min-h-screen items-center justify-center text-sm text-muted">
        Loading session...
      </div>
    );
  }

  return (
    <div className="page-atmosphere min-h-screen overflow-hidden">
      <AccentBar />
      <div className="relative mx-auto flex min-h-[calc(100vh-5px)] max-w-[1440px] items-center px-5 py-8 md:px-10 md:py-10">
        <div className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-brand-blue/15 blur-3xl brand-glow" />
        <div className="pointer-events-none absolute right-0 bottom-10 h-80 w-80 rounded-full bg-brand-red/10 blur-3xl" />

        <div className="relative z-10 grid w-full items-stretch gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="animate-fade-up relative flex min-h-[520px] flex-col justify-between overflow-hidden rounded-[24px] bg-gradient-to-br from-[#005daa] via-[#0b4f8a] to-[#0b2e59] p-10 text-brand-light shadow-[0_24px_60px_rgba(11,46,89,0.28)] md:min-h-[720px] md:p-14">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute left-10 top-40 h-40 w-40 rounded-full border border-white/20" />
              <div className="absolute right-16 top-24 h-24 w-24 rounded-full border border-white/15" />
              <div className="absolute bottom-28 left-1/3 h-56 w-56 rounded-full bg-white/5 blur-2xl" />
            </div>

            <div className="relative">
              <VNUKWordmark size="lg" onDark />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                VNUK ParkWise · The Silent Gate
              </p>
            </div>

            <div className="relative max-w-[480px]">
              <h1 className="text-[34px] font-semibold leading-[1.15] tracking-tight text-white md:text-[42px]">
                Campus parking for students, guards, and admins.
              </h1>
              <p className="mt-5 max-w-[420px] text-base leading-relaxed text-white/80">
                RFID sessions · lot capacity estimates · Backup Pass · DEMO adapters
              </p>
            </div>

            <div className="relative grid gap-3 sm:grid-cols-3">
              {[
                { label: "Live zones", value: "A · B · C" },
                { label: "Access", value: "RFID + QR" },
                { label: "Students", value: "Always on" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[14px] border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
                >
                  <p className="text-[11px] uppercase tracking-wide text-white/65">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="animate-fade-up-delay-1 relative z-20 flex items-center">
            <div className="relative z-20 w-full rounded-[24px] border border-border/80 bg-white p-7 shadow-[var(--shadow-soft)] md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
                Welcome back
              </p>
              <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-navy md:text-[34px]">
                Sign in
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Local demo accounts only — not production credentials.
              </p>

              <form
                className="relative z-20 mt-8 flex flex-col gap-4"
                onSubmit={handleSubmit}
                autoComplete="on"
              >
                <Input
                  label="Student ID or email"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  name="identifier"
                  autoComplete="username"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  name="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter password"
                />
                {error && (
                  <p className="rounded-[12px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-sm text-[#b91c1c]">
                    {error}
                  </p>
                )}
                <Button type="submit" className="mt-1 w-full" disabled={submitting}>
                  {submitting ? "Signing in..." : "Sign in"}
                </Button>
                <p className="text-center text-[11px] leading-relaxed text-muted">
                  Demo: STU-NHI / G-1001 / A-9001 · password123
                </p>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
