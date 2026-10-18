"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
      <div className="flex min-h-dvh items-center justify-center bg-[#0b2e59] text-sm text-white/70">
        Loading…
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#0b2e59] text-white md:grid md:grid-cols-2">
      {/* Full-bleed atmosphere */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(90% 55% at 50% -10%, rgba(0,93,170,0.95), transparent 60%), radial-gradient(70% 45% at 100% 30%, rgba(137,22,53,0.35), transparent 55%), linear-gradient(165deg, #005daa 0%, #0b2e59 48%, #081f3d 100%)",
        }}
      />
      <div
        className="brand-glow pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-0 top-1/3 h-64 w-64 rounded-full bg-[#891635]/20 blur-3xl md:left-1/4 md:top-auto md:bottom-10"
        aria-hidden
      />

      {/* Brand — mobile top / desktop left */}
      <header className="animate-fade-up relative z-10 flex flex-1 flex-col justify-end px-6 pb-8 pt-[max(2.75rem,env(safe-area-inset-top))] sm:px-8 md:flex-none md:justify-center md:px-12 md:pb-0 lg:px-16">
        <div className="w-full max-w-sm md:max-w-md">
          <VNUKWordmark size="lg" onDark />
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">
            ParkWise
          </p>
          <h1 className="mt-3 text-[2.4rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl">
            Campus parking
          </h1>
        </div>
      </header>

      {/* Form sheet — mobile bottom / desktop right */}
      <section className="animate-fade-up-delay-1 relative z-20 flex w-full items-end md:items-center md:justify-center md:px-8 lg:px-12">
        <div className="w-full rounded-t-[28px] bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7 text-navy shadow-[0_-16px_48px_rgba(0,0,0,0.22)] sm:px-8 md:max-w-[420px] md:rounded-[28px] md:px-9 md:py-9 md:shadow-[0_28px_64px_rgba(8,31,61,0.35)]">
          <h2 className="text-2xl font-semibold tracking-tight text-navy">
            Sign in
          </h2>

          <form
            className="mt-6 flex flex-col gap-3.5"
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
              inputMode="email"
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
            {error ? (
              <p className="rounded-[12px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-sm text-[#b91c1c]">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              className="mt-1 h-12 w-full text-[15px]"
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
            <p className="pt-1 text-center text-[11px] text-muted">
              Demo · STU-NHI · password123
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
