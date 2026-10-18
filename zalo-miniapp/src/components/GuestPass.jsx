import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

function buildMockQr() {
  const cells = [];
  for (let y = 0; y < 14; y += 1) {
    for (let x = 0; x < 14; x += 1) {
      const on =
        (x + y) % 3 === 0 ||
        (x * y) % 5 === 0 ||
        x < 2 ||
        y < 2 ||
        x > 11 ||
        y > 11;
      if (on) {
        cells.push(
          `<rect x="${20 + x * 17}" y="${20 + y * 17}" width="14" height="14" rx="2"/>`,
        );
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280"><rect width="280" height="280" fill="#fff"/><g fill="#0b1f3a">${cells.join("")}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const MOCK_QR = buildMockQr();

function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function GuestPass({ vehicleId = "veh_001" }) {
  const [open, setOpen] = useState(false);
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
        vehicleId,
        guestName: "Campus Guest",
        validMinutes: 120,
      });
      setPass(data.pass);
      setQrDataUrl(data.qrDataUrl || MOCK_QR);
      setOpen(true);
    } catch (err) {
      // Fallback mock for offline demo
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      setPass({
        code: "GP-DEMO88",
        expiresAt,
        guestName: "Campus Guest",
      });
      setQrDataUrl(MOCK_QR);
      setOpen(true);
      setError(err.message ? `Offline demo QR (${err.message})` : "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="glass-card rounded-[24px] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Guest Pass
            </p>
            <h2 className="mt-1 text-base font-semibold text-white">Dynamic QR</h2>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/15 text-lg">
            ▦
          </div>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-white/50">
          Share a time-limited QR so friends can enter without your RFID card.
        </p>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="h-11 w-full rounded-xl bg-gradient-to-r from-[#0068ff] to-violet-500 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,104,255,0.35)] transition active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "Generating…" : "Generate Guest Pass"}
        </button>
      </section>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 sm:items-center">
          <div className="glass-card w-full max-w-md animate-soft-float rounded-[28px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  Guest access
                </p>
                <h3 className="text-lg font-semibold text-white">Scan to enter</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80"
              >
                Close
              </button>
            </div>

            <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-3xl bg-white p-3 shadow-xl">
              <img
                src={qrDataUrl || MOCK_QR}
                alt="Guest pass QR"
                className="h-full w-full rounded-xl object-contain"
              />
            </div>

            <div className="mt-4 text-center">
              <p className="font-mono text-sm font-semibold tracking-wider text-white">
                {pass?.code}
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/40">
                Valid for
              </p>
              <p
                className={`mt-1 font-mono text-2xl font-bold tabular-nums ${
                  remaining < 5 * 60 * 1000 ? "text-rose-300" : "text-emerald-300"
                }`}
              >
                {formatCountdown(remaining)}
              </p>
              {error ? <p className="mt-2 text-[11px] text-amber-200/80">{error}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
