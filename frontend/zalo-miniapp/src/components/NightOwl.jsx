import { useMemo, useState } from "react";
import { Button } from "./zmp/Button";
import { getStoredUser } from "../lib/auth";
import {
  createDemoSession,
  demoTrackingPath,
  demoTrackingUrl,
} from "../lib/night-owl-demo";

const STEPS = [
  {
    n: "1",
    title: "Start after 21:00",
    body: "Night-Owl unlocks for late rides home from campus.",
  },
  {
    n: "2",
    title: "Share one link",
    body: "Send a live track link to a trusted friend on Zalo.",
  },
  {
    n: "3",
    title: "Auto-ends in 45 min",
    body: "Location is only used while the session is active.",
  },
];

export default function NightOwl({ onOpenTrack }) {
  const [session, setSession] = useState(null);
  const [copied, setCopied] = useState(false);

  const plate = useMemo(() => {
    const user = getStoredUser();
    return user?.plate || user?.vehiclePlate || "43B1-11111";
  }, []);

  const trackingUrl = session ? demoTrackingUrl(session.token) : "";
  const trackingPath = session ? demoTrackingPath(session.token) : "";

  function startDemo() {
    const next = createDemoSession(plate);
    setSession(next);
    setCopied(false);
  }

  async function copyLink() {
    if (!trackingUrl) return;
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore — link is visible to long-press */
    }
  }

  function shareZalo() {
    if (!trackingUrl) return;
    const text = encodeURIComponent(
      `I'm heading home — track my Safe Ride: ${trackingUrl}`,
    );
    const zaloShare = `https://zalo.me/share?u=${encodeURIComponent(trackingUrl)}&t=${text}`;
    window.open(zaloShare, "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      {/* Static night hero */}
      <div
        className="relative overflow-hidden rounded-[18px] px-4 py-5 text-white"
        style={{
          background:
            "linear-gradient(160deg, #0b2e59 0%, #0a3d73 42%, #102a44 100%)",
        }}
      >
        <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-16 w-40 rounded-full bg-[#891635]/25 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
              After 21:00
            </p>
            <p className="mt-1.5 text-lg font-semibold tracking-tight">
              Safe Ride home
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/75">
              Share a live track link so someone you trust can follow your trip.
            </p>
          </div>
          <span
            className="relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20"
            aria-hidden
          >
            <span className="absolute h-5 w-5 rounded-full bg-[#f0e6c8]" />
            <span className="absolute -right-0.5 h-4 w-4 rounded-full bg-[#0a3d73]" />
          </span>
        </div>
      </div>

      <ol className="mt-4 space-y-2.5">
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="flex gap-3 rounded-[14px] border border-border/80 bg-surface/70 px-3 py-2.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-light text-[11px] font-bold text-brand-blue">
              {step.n}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy">{step.title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-[11px] text-muted">
        Demo mode — no GPS or server required. Session lasts 45 minutes.
      </p>

      <Button type="button" onClick={startDemo} className="mt-3 w-full">
        {session ? "Start new demo ride" : "Enable Safe Ride (demo)"}
      </Button>

      {session ? (
        <div className="mt-5 space-y-3">
          <div className="rounded-[14px] border border-emerald-200/80 bg-[#e8f7ee]/60 px-3 py-2.5">
            <p className="text-xs font-semibold text-[#15803d]">Tracking active</p>
            <p className="mt-0.5 text-[11px] text-navy">
              {session.plate} · expires{" "}
              {new Date(session.expiresAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="break-all rounded-[14px] border border-border bg-surface px-3 py-3 text-[11px] text-navy">
            {trackingUrl}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" onClick={copyLink}>
              {copied ? "Copied" : "Copy link"}
            </Button>
            <button
              type="button"
              onClick={shareZalo}
              className="inline-flex h-12 items-center justify-center rounded-[12px] bg-brand-blue px-4 text-sm font-semibold text-white"
            >
              Share via Zalo
            </button>
          </div>

          {trackingPath && onOpenTrack ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => onOpenTrack(session.token)}
            >
              Open track page
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
