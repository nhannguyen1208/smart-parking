import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./zmp/Button";
import DestinationPicker from "./DestinationPicker";
import { api } from "../lib/api";
import { getStoredUser } from "../lib/auth";
import {
  START_POINT,
  fetchDrivingRoute,
  pointAtProgress,
} from "../lib/night-owl-demo";
import { shareTrackToZalo } from "../lib/zalo";

const RIDE_MS = 28_000;
const PING_EVERY_MS = 2500;

export default function NightOwl({ onOpenTrack }) {
  const [session, setSession] = useState(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [destination, setDestination] = useState(null);
  const [picking, setPicking] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const aliveRef = useRef(true);

  const riderName = useMemo(() => {
    const user = getStoredUser();
    return user?.displayName || user?.name || user?.fullName || "Bạn";
  }, []);

  const trackingPath = session?.trackingPath || "";
  const trackingUrl = session?.trackingUrl || "";

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Animate along route + push live location so family map updates
  useEffect(() => {
    if (!session?.token || !session?.route?.length) return undefined;

    const token = session.token;
    const route = session.route;
    const t0 = performance.now();
    let raf = 0;
    let lastPing = 0;

    async function ping(p, status) {
      const point = pointAtProgress(p, route);
      try {
        await api.updateSafeRideLocation(token, {
          latitude: point.latitude,
          longitude: point.longitude,
          progress: p,
          status,
        });
      } catch {
        // keep animating even if ping fails
      }
    }

    function frame(now) {
      if (!aliveRef.current) return;
      const p = Math.min(1, (now - t0) / RIDE_MS);
      setProgress(p);
      if (now - lastPing >= PING_EVERY_MS || p >= 1) {
        lastPing = now;
        void ping(p, p >= 0.98 ? "ARRIVING" : "ACTIVE");
      }
      if (p < 1) raf = requestAnimationFrame(frame);
    }

    void ping(0, "ACTIVE");
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [session?.token, session?.route]);

  async function startRide() {
    if (!destination) {
      setPicking(true);
      return;
    }
    setStarting(true);
    setError("");
    try {
      const route = await fetchDrivingRoute(START_POINT, destination);
      const data = await api.startSafeRide({
        force: true,
        latitude: START_POINT.latitude,
        longitude: START_POINT.longitude,
        riderName,
        startLabel: START_POINT.label,
        destLabel: destination.label || "Nhà",
        route,
      });
      const next = {
        token: data.session.token,
        trackingPath: data.trackingPath,
        trackingUrl: data.trackingUrl,
        route,
        start: START_POINT,
        destination,
        name: riderName,
        status: data.session.status,
        expiresAt: data.session.expiresAt,
      };
      setSession(next);
      setProgress(0);
      setCopied(false);
    } catch (err) {
      setError(err.message || "Không tạo được chuyến Night-Owl");
    } finally {
      setStarting(false);
    }
  }

  async function copyLink() {
    if (!trackingUrl) return;
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  async function shareZalo() {
    if (!trackingUrl) return;
    setSharing(true);
    setError("");
    try {
      // Prefer web link so family opens browser map (no Mini App install)
      const result = await shareTrackToZalo({
        link: trackingUrl,
        path: trackingPath || `/track/${session.token}`,
        title: `${riderName} đang về — Night-Owl`,
        description: `${START_POINT.label} → ${destination?.label || "nhà"}. Mở link để xem bản đồ live.`,
      });
      if (!result.ok) {
        setError("Không mở được share Zalo — hãy chép link gửi tay.");
      }
    } finally {
      setSharing(false);
    }
  }

  if (picking) {
    return (
      <DestinationPicker
        initial={destination}
        onCancel={() => setPicking(false)}
        onConfirm={(dest) => {
          setDestination(dest);
          setPicking(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] leading-relaxed text-muted">
        Chọn điểm đến, bật Night-Owl rồi nhấn <strong>Gửi Zalo</strong> — người
        thân mở link trong Zalo để xem bản đồ theo dõi.
      </p>

      <div className="border border-line bg-wash px-3 py-3 text-[13px]">
        <div className="flex justify-between gap-3">
          <span className="text-muted">Đi</span>
          <span className="text-right font-medium text-ink">
            {START_POINT.label}
          </span>
        </div>
        <div className="mt-2 flex justify-between gap-3 border-t border-line pt-2">
          <span className="text-muted">Đến</span>
          <span className="text-right font-medium text-ink">
            {destination?.label || "Chưa chọn"}
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        className="h-11 w-full text-[13px]"
        onClick={() => setPicking(true)}
      >
        {destination ? "Đổi địa chỉ / số nhà" : "Chọn địa chỉ + số nhà"}
      </Button>

      {error ? (
        <p className="border border-brand-red/30 bg-[#fdf2f4] px-3 py-2 text-[12px] text-brand-red">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={startRide}
        disabled={starting}
        className="w-full"
      >
        {starting
          ? "Đang tạo chuyến…"
          : !destination
            ? "Chọn điểm đến trước"
            : session
              ? "Bắt đầu chuyến mới"
              : "Bật Night-Owl"}
      </Button>

      {session ? (
        <div className="space-y-3 border-t border-line pt-4">
          <p className="text-[13px] font-medium text-ink">
            Đang theo dõi · {session.name || riderName}
          </p>
          <p className="text-[12px] text-muted">
            {session.start?.label} → {session.destination?.label} ·{" "}
            {Math.round(progress * 100)}%
          </p>
          <div className="break-all border border-line bg-card px-3 py-2.5 font-mono text-[11px] text-ink">
            {trackingUrl || trackingPath}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" onClick={copyLink}>
              {copied ? "Đã chép" : "Chép link"}
            </Button>
            <Button type="button" onClick={shareZalo} disabled={sharing}>
              {sharing ? "Đang mở…" : "Gửi Zalo"}
            </Button>
          </div>
          {session.token && onOpenTrack ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => onOpenTrack(session.token)}
            >
              Xem bản đồ
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
