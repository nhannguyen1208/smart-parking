"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { TrackPoint } from "@/components/night-owl/public-track-map";
import { AccentBar } from "@/components/layout/accent-bar";
import { VNUKWordmark } from "@/components/layout/vnuk-wordmark";
import { getApiUrl } from "@/lib/api-client";

const PublicTrackMap = dynamic(
  () =>
    import("@/components/night-owl/public-track-map").then(
      (m) => m.PublicTrackMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center rounded-[18px] bg-surface text-sm text-muted">
        Đang tải bản đồ…
      </div>
    ),
  },
);

type LiveSession = {
  token: string;
  plate?: string;
  name?: string;
  riderName?: string;
  startLabel?: string;
  destLabel?: string;
  route?: TrackPoint[];
  progress?: number;
  status: string;
  expiresAt: string;
  startedAt?: string;
  lastLocation?: {
    latitude: number;
    longitude: number;
    at?: string | null;
  } | null;
};

export default function PublicTrackPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const [session, setSession] = useState<LiveSession | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Thiếu mã chuyến");
      return undefined;
    }
    let alive = true;

    async function load() {
      try {
        const res = await fetch(`${getApiUrl()}/api/safe-ride/${token}`, {
          cache: "no-store",
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            body.message || body.error || `Không tải được (${res.status})`,
          );
        }
        if (!alive) return;
        setSession((body.data?.session || body.session) as LiveSession);
        setError("");
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Không tải được chuyến");
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
  }, [token]);

  const rider =
    session?.riderName || session?.name || session?.plate || "Sinh viên";
  const progress = typeof session?.progress === "number" ? session.progress : 0;
  const route = Array.isArray(session?.route) ? session.route : [];

  return (
    <div className="page-atmosphere min-h-dvh">
      <AccentBar />
      <div className="mx-auto max-w-md px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
        <header className="mb-5">
          <VNUKWordmark size="sm" />
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-navy">
            Night-Owl
          </h1>
          <p className="mt-1 text-sm text-muted">
            Theo dõi hành trình về nhà — không cần đăng nhập
          </p>
        </header>

        {loading ? (
          <p className="text-sm text-muted">Đang tải bản đồ…</p>
        ) : error ? (
          <div className="space-y-2 rounded-[14px] border border-[#fecaca] bg-[#fef2f2] px-3 py-3 text-sm text-[#b91c1c]">
            <p className="font-semibold">Không mở được chuyến</p>
            <p>{error}</p>
            <p className="text-[12px] text-[#7f1d1d]">
              API: {getApiUrl()} · token: {token.slice(0, 8)}…
            </p>
          </div>
        ) : session ? (
          <div className="space-y-4">
            <PublicTrackMap
              route={route}
              progress={progress}
              riderName={rider}
              lastLocation={session.lastLocation}
            />

            <div className="rounded-[18px] bg-navy px-4 py-4 text-white">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/60">
                Người đi
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-lg font-semibold">{rider}</p>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium">
                  {session.status}
                </span>
              </div>
              {(session.startLabel || session.destLabel) && (
                <p className="mt-2 text-sm text-white/75">
                  {session.startLabel || "Xuất phát"} →{" "}
                  {session.destLabel || "điểm đến"}
                </p>
              )}
            </div>

            <div className="rounded-[18px] border border-border bg-card p-4">
              <p className="text-xs text-muted">Tiến độ</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-navy">
                {Math.round(progress * 100)}%
              </p>
              <p className="mt-2 text-xs text-muted">
                Hết hạn {new Date(session.expiresAt).toLocaleString()}
              </p>
            </div>

            {session.lastLocation ? (
              <div className="rounded-[18px] border border-border bg-surface p-4">
                <p className="text-xs text-muted">Vị trí gần nhất</p>
                <p className="mt-2 font-mono text-sm text-navy">
                  {session.lastLocation.latitude.toFixed(5)},{" "}
                  {session.lastLocation.longitude.toFixed(5)}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
