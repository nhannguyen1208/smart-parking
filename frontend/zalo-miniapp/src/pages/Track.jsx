import { useEffect, useState } from "react";
import AccentBar from "../components/AccentBar";
import { api } from "../lib/api";

export default function Track({ token, onBack }) {
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const data = await api.getSafeRide(token);
        if (!alive) return;
        setSession(data.session);
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Session not found");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    const id = window.setInterval(load, 8000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [token]);

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
          Live track
        </h1>

        {loading ? (
          <p className="mt-8 text-sm text-muted">Loading session…</p>
        ) : error ? (
          <p className="mt-8 rounded-[12px] border border-red-200 bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
            {error}
          </p>
        ) : (
          <div className="mt-8 space-y-4">
            <div className="rounded-[16px] border border-border/80 bg-card p-4 shadow-[var(--shadow-card)]">
              <p className="text-[11px] uppercase tracking-wide text-muted">Plate</p>
              <p className="mt-1 text-xl font-semibold text-navy">{session.plate || "—"}</p>
            </div>
            <div className="rounded-[16px] border border-border/80 bg-card p-4 shadow-[var(--shadow-card)]">
              <p className="text-[11px] uppercase tracking-wide text-muted">Status</p>
              <p className="mt-1 text-sm text-navy">{session.status}</p>
              <p className="mt-2 text-xs text-muted">
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
                    {session.lastLocation.latitude.toFixed(5)},{" "}
                    {session.lastLocation.longitude.toFixed(5)}
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
          </div>
        )}
      </div>
    </div>
  );
}
