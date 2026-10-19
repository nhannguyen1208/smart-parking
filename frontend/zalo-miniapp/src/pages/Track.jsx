import { useEffect, useState } from "react";
import AccentBar from "../components/AccentBar";
import { api } from "../lib/api";
import {
  isDemoToken,
  loadDemoSession,
  tickDemoSession,
} from "../lib/night-owl-demo";

export default function Track({ token, onBack }) {
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const demo = isDemoToken(token);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (demo) {
        const next = tickDemoSession(token) || loadDemoSession(token);
        if (!alive) return;
        if (!next) {
          setError("Demo session not found — start Night-Owl again from Home.");
          setSession(null);
        } else {
          setSession(next);
          setError("");
        }
        setLoading(false);
        return;
      }

      try {
        const data = await api.getSafeRide(token);
        if (!alive) return;
        setSession(data.session);
        setError("");
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Session not found");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    const id = window.setInterval(load, demo ? 3500 : 8000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [token, demo]);

  const path = session?.path || [];
  const progress =
    path.length > 1 ? Math.min(100, ((path.length - 1) / 4) * 100) : 8;

  return (
    <div className="page-atmosphere min-h-screen text-navy">
      <AccentBar />
      <div className="mx-auto max-w-md px-5 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 text-sm font-medium text-muted"
        >
          ← Back
        </button>

        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue">
          Night-Owl Safe Ride
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy">
          {demo ? "Demo track" : "Live track"}
        </h1>
        {demo ? (
          <p className="mt-1 text-xs text-muted">
            Static preview — location advances along a campus path.
          </p>
        ) : null}

        {loading ? (
          <p className="mt-8 text-sm text-muted">Loading session…</p>
        ) : error ? (
          <p className="mt-8 rounded-[12px] border border-red-200 bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
            {error}
          </p>
        ) : (
          <div className="mt-8 space-y-4">
            <div
              className="relative overflow-hidden rounded-[18px] px-4 py-5 text-white"
              style={{
                background:
                  "linear-gradient(160deg, #0b2e59 0%, #0a3d73 48%, #102a44 100%)",
              }}
            >
              <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
                    Rider
                  </p>
                  <p className="mt-1.5 font-mono text-xl tracking-[0.12em]">
                    {session.plate || "—"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                    session.status === "ACTIVE" || session.status === "ARRIVING"
                      ? "bg-emerald-400/20 text-emerald-100 ring-emerald-300/30"
                      : "bg-white/10 text-white/80 ring-white/20"
                  }`}
                >
                  {session.status}
                </span>
              </div>
              <div className="relative mt-5">
                <div className="mb-2 flex justify-between text-[11px] text-white/70">
                  <span>Campus</span>
                  <span>Home</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-[width] duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[16px] border border-border/80 bg-card p-4 shadow-[var(--shadow-card)]">
              <p className="text-[11px] uppercase tracking-wide text-muted">
                Session
              </p>
              <p className="mt-2 text-xs text-muted">
                Started{" "}
                {session.startedAt
                  ? new Date(session.startedAt).toLocaleTimeString()
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-muted">
                Expires {new Date(session.expiresAt).toLocaleString()}
              </p>
            </div>

            <div className="rounded-[16px] border border-brand-blue/20 bg-brand-light/40 p-4">
              <p className="text-[11px] uppercase tracking-wide text-brand-blue">
                Last location
              </p>
              {session.lastLocation ? (
                <>
                  <p className="mt-2 font-mono text-sm text-navy">
                    {Number(session.lastLocation.latitude).toFixed(5)},{" "}
                    {Number(session.lastLocation.longitude).toFixed(5)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {session.lastLocation.at
                      ? new Date(session.lastLocation.at).toLocaleString()
                      : ""}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted">Waiting for first ping…</p>
              )}
            </div>

            {demo && path.length > 0 ? (
              <div className="rounded-[16px] border border-border/80 bg-card p-4 shadow-[var(--shadow-card)]">
                <p className="text-[11px] uppercase tracking-wide text-muted">
                  Path pings
                </p>
                <ul className="mt-2 space-y-1.5">
                  {path.map((p, i) => (
                    <li
                      key={`${p.at}-${i}`}
                      className="flex justify-between gap-2 font-mono text-[11px] text-navy"
                    >
                      <span>
                        {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                      </span>
                      <span className="text-muted">
                        {new Date(p.at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
