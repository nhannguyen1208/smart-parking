import { useState } from "react";
import { api } from "../lib/api";

export default function NightOwl({ vehicleId = "veh_001" }) {
  const [loading, setLoading] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState("");

  async function enableTracking() {
    setLoading(true);
    setError("");
    setCopied(false);

    try {
      let coords = {};
      if (navigator.geolocation) {
        coords = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              }),
            () => resolve({}),
            { enableHighAccuracy: true, timeout: 4000 },
          );
        });
      }

      const data = await api.startSafeRide({
        vehicleId,
        force: true,
        ...coords,
      });
      setTrackingUrl(data.trackingUrl);
      setSheetOpen(true);
    } catch {
      // Premium UX still works offline with a dummy link
      const dummy = `https://parkwise.campus/track/demo-${Math.random().toString(36).slice(2, 8)}`;
      setTrackingUrl(dummy);
      setSheetOpen(true);
      setError("Demo link (backend unreachable)");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!trackingUrl) return;
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy — long-press the link instead");
    }
  }

  function shareZalo() {
    const text = encodeURIComponent(
      `I'm heading home — track my Safe Ride: ${trackingUrl}`,
    );
    // Zalo share deep-link pattern (falls back to open URL)
    const zaloShare = `https://zalo.me/share?u=${encodeURIComponent(trackingUrl)}&t=${text}`;
    window.open(zaloShare, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-[24px] border border-violet-400/20 bg-gradient-to-br from-[#1a1030] via-[#12081f] to-[#07040f] p-4 shadow-[0_16px_50px_rgba(76,29,149,0.35)]">
        <div className="pointer-events-none absolute -right-8 top-0 h-28 w-28 rounded-full bg-violet-500/20 blur-2xl" />
        <div className="pointer-events-none absolute -left-6 bottom-0 h-20 w-20 rounded-full bg-fuchsia-500/15 blur-2xl" />

        <div className="relative">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg">🦉</span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/70">
              Night-Owl Security
            </p>
          </div>
          <h2 className="text-base font-semibold text-white">Safe Ride Tracking</h2>
          <p className="mt-1 text-xs leading-relaxed text-violet-100/55">
            After 21:00, share a live link with a trusted contact while you ride home.
          </p>

          <button
            type="button"
            onClick={enableTracking}
            disabled={loading}
            className="mt-4 h-11 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(168,85,247,0.35)] transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Enabling tracking…
              </span>
            ) : (
              "Enable Safe Ride Tracking"
            )}
          </button>
        </div>
      </section>

      {/* Bottom sheet */}
      {sheetOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close sheet"
            onClick={() => setSheetOpen(false)}
          />
          <div className="relative w-full rounded-t-[28px] border border-white/10 bg-[#12081f] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/60">
              Live tracking link
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">Share with care</h3>

            <div className="mt-4 break-all rounded-2xl bg-black/35 px-3 py-3 text-xs text-violet-100 ring-1 ring-violet-400/20">
              {trackingUrl}
            </div>
            {error ? <p className="mt-2 text-[11px] text-amber-200/80">{error}</p> : null}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="h-11 rounded-xl bg-white/10 text-sm font-semibold text-white ring-1 ring-white/10"
              >
                {copied ? "Copied ✓" : "Copy Link"}
              </button>
              <button
                type="button"
                onClick={shareZalo}
                className="h-11 rounded-xl bg-[#0068ff] text-sm font-semibold text-white"
              >
                Share via Zalo
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
