import { useState } from "react";
import { Button } from "./zmp/Button";
import { api } from "../lib/api";

export default function NightOwl({ onOpenTrack }) {
  const [loading, setLoading] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState("");
  const [trackingPath, setTrackingPath] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [forceDemo, setForceDemo] = useState(true);

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
        force: forceDemo,
        ...coords,
      });
      setTrackingUrl(data.trackingUrl);
      setTrackingPath(data.trackingPath);
    } catch (err) {
      setError(err.message || "Could not start Safe Ride");
      setTrackingUrl("");
      setTrackingPath("");
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
    const zaloShare = `https://zalo.me/share?u=${encodeURIComponent(trackingUrl)}&t=${text}`;
    window.open(zaloShare, "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <p className="text-xs leading-relaxed text-muted">
        After 21:00, share a live link with a trusted contact while you ride home.
      </p>

      <label className="mt-4 flex items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={forceDemo}
          onChange={(e) => setForceDemo(e.target.checked)}
          className="rounded border-border"
        />
        Demo anytime (force=true)
      </label>

      <Button
        type="button"
        onClick={enableTracking}
        disabled={loading}
        className="mt-4 w-full"
      >
        {loading ? "Enabling tracking…" : "Enable Safe Ride Tracking"}
      </Button>

      {error ? (
        <p className="mt-3 rounded-[12px] border border-red-200 bg-[#fef2f2] px-3 py-2 text-xs text-[#b91c1c]">
          {error}
        </p>
      ) : null}

      {trackingUrl ? (
        <div className="mt-5 space-y-3">
          <div className="break-all rounded-[14px] border border-border bg-surface px-3 py-3 text-xs text-navy">
            {trackingUrl}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" onClick={copyLink}>
              {copied ? "Copied" : "Copy Link"}
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
              onClick={() => onOpenTrack(trackingPath.replace("/track/", ""))}
            >
              Open track page
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
