import { useEffect, useMemo, useState } from "react";
import { Button } from "./zmp/Button";
import { api } from "../lib/api";

function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function GuestPass() {
  const [loading, setLoading] = useState(false);
  const [pass, setPass] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");

  useEffect(() => {
    if (!pass?.expiresAt) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [pass?.expiresAt]);

  const remaining = useMemo(() => {
    if (!pass?.expiresAt) return 0;
    return new Date(pass.expiresAt).getTime() - now;
  }, [pass?.expiresAt, now]);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const data = await api.generateGuestPass({
        guestName: "Backup Pass",
        validMinutes: 120,
      });
      setPass(data.pass);
      setQrDataUrl(data.qrDataUrl || "");
    } catch (err) {
      setError(err.message || "Could not generate Backup Pass");
      setPass(null);
      setQrDataUrl("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="mb-4 text-xs leading-relaxed text-muted">
        Your backup QR when you lose or forget your RFID card. Counts for Rewards.
      </p>
      <Button type="button" onClick={generate} disabled={loading} className="w-full">
        {loading ? "Generating…" : pass ? "Generate new pass" : "Generate Backup Pass"}
      </Button>

      {error ? (
        <p className="mt-3 rounded-[12px] border border-red-200 bg-[#fef2f2] px-3 py-2 text-xs text-[#b91c1c]">
          {error}
        </p>
      ) : null}

      {pass && qrDataUrl ? (
        <div className="mt-5">
          <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-[16px] border border-border/80 bg-white p-3 shadow-[var(--shadow-card)]">
            <img
              src={qrDataUrl}
              alt="Backup Pass QR"
              className="h-full w-full rounded-xl object-contain"
            />
          </div>
          <div className="mt-4 text-center">
            <p className="font-mono text-sm font-semibold tracking-wider text-navy">
              {pass.code}
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted">
              Valid for
            </p>
            <p
              className={`mt-1 font-mono text-2xl font-bold tabular-nums ${
                remaining < 5 * 60 * 1000 ? "text-brand-red" : "text-brand-blue"
              }`}
            >
              {formatCountdown(remaining)}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
