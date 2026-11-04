import { useEffect, useState } from "react";
import AccentBar from "../components/AccentBar";
import NightOwlMap from "../components/NightOwlMap";
import { api } from "../lib/api";
import {
  isDemoToken,
  loadDemoSession,
  sessionRiderName,
  setDemoProgress,
} from "../lib/night-owl-demo";

/** Full campus→home run duration for legacy local demo tokens */
const DEMO_RIDE_MS = 28_000;

export default function Track({ token, onBack }) {
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const demo = isDemoToken(token);
  const hasRoute = Array.isArray(session?.route) && session.route.length >= 2;

  useEffect(() => {
    let alive = true;
    let raf = 0;

    if (!demo) {
      async function load() {
        try {
          const data = await api.getSafeRide(token);
          if (!alive) return;
          const s = data.session;
          setSession(s);
          setProgress(typeof s.progress === "number" ? s.progress : 0);
          setError("");
        } catch (err) {
          if (!alive) return;
          setError(err.message || "Không tìm thấy chuyến");
        } finally {
          if (alive) setLoading(false);
        }
      }
      load();
      const id = window.setInterval(load, 3000);
      return () => {
        alive = false;
        window.clearInterval(id);
      };
    }

    const existing = loadDemoSession(token);
    if (!existing) {
      setError("Phiên demo không còn — mở Night-Owl và gửi link mới.");
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    const startProgress = existing.progress || 0;
    setSession(existing);
    setProgress(startProgress);
    setLoading(false);

    if (startProgress >= 1 || existing.status === "EXPIRED") {
      return () => {
        alive = false;
      };
    }

    const t0 = performance.now();
    const remain = (1 - startProgress) * DEMO_RIDE_MS;

    function frame(now) {
      if (!alive) return;
      const elapsed = now - t0;
      const next = Math.min(
        1,
        startProgress + (elapsed / remain) * (1 - startProgress),
      );
      setProgress(next);
      const updated = setDemoProgress(token, next);
      if (updated) setSession(updated);
      if (next < 1) raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [token, demo]);

  const titleFrom = session?.startLabel || session?.start?.label;
  const titleTo = session?.destLabel || session?.destination?.label;

  return (
    <div className="page-atmosphere min-h-screen text-ink">
      <AccentBar />
      <div className="mx-auto max-w-md px-5 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mb-5 text-[13px] font-medium text-muted"
          >
            ← Quay lại
          </button>
        ) : null}

        <h1 className="text-[22px] font-semibold tracking-tight text-ink">
          Theo dõi Night-Owl
        </h1>
        {titleFrom || titleTo ? (
          <p className="mt-1 text-[13px] text-muted">
            {titleFrom || "Xuất phát"} → {titleTo || "điểm đến"}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-8 text-[13px] text-muted">Đang tải bản đồ…</p>
        ) : error ? (
          <p className="mt-8 border border-brand-red/30 bg-[#fdf2f4] px-3 py-2 text-[13px] text-brand-red">
            {error}
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {hasRoute ? (
              <NightOwlMap
                progress={progress}
                riderName={sessionRiderName(session)}
                route={session.route}
              />
            ) : null}

            <div className="flex items-start justify-between gap-3 border border-line bg-ink px-4 py-4 text-white">
              <div>
                <p className="text-[12px] text-white/65">Người đi</p>
                <p className="mt-1 text-[18px] font-semibold">
                  {sessionRiderName(session)}
                </p>
              </div>
              <span className="border border-white/25 px-2 py-1 text-[11px] font-medium text-white/90">
                {session.status}
              </span>
            </div>

            <div className="border border-line bg-card p-4">
              <p className="text-[12px] text-muted">Tiến độ</p>
              <p className="mt-2 text-[20px] font-semibold tabular-nums text-ink">
                {Math.round((progress || 0) * 100)}%
              </p>
              <p className="mt-2 text-[12px] text-muted">
                Hết hạn {new Date(session.expiresAt).toLocaleString()}
              </p>
            </div>

            <div className="border border-line bg-wash p-4">
              <p className="text-[12px] text-muted">Vị trí gần nhất</p>
              {session.lastLocation ? (
                <>
                  <p className="mt-2 font-mono text-[13px] text-ink">
                    {Number(session.lastLocation.latitude).toFixed(5)},{" "}
                    {Number(session.lastLocation.longitude).toFixed(5)}
                  </p>
                  <p className="mt-1 text-[12px] text-muted">
                    {session.lastLocation.at
                      ? new Date(session.lastLocation.at).toLocaleString()
                      : ""}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-[13px] text-muted">Chưa có ping…</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
