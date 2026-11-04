"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type TrackPoint = {
  latitude: number;
  longitude: number;
  label?: string;
};

type PublicTrackMapProps = {
  route: TrackPoint[];
  progress?: number;
  riderName?: string;
  lastLocation?: { latitude: number; longitude: number } | null;
};

function pointAtProgress(route: TrackPoint[], t: number): TrackPoint {
  const p = Math.min(1, Math.max(0, t));
  if (!route.length) return { latitude: 0, longitude: 0 };
  if (route.length === 1 || p <= 0) return route[0];
  if (p >= 1) return route[route.length - 1];

  let total = 0;
  const segs: number[] = [];
  for (let i = 0; i < route.length - 1; i++) {
    const d = Math.hypot(
      route[i + 1].latitude - route[i].latitude,
      route[i + 1].longitude - route[i].longitude,
    );
    segs.push(d);
    total += d;
  }
  let remain = p * (total || 1);
  for (let i = 0; i < segs.length; i++) {
    const len = segs[i];
    if (remain <= len) {
      const u = len === 0 ? 0 : remain / len;
      const a = route[i];
      const b = route[i + 1];
      return {
        latitude: a.latitude + (b.latitude - a.latitude) * u,
        longitude: a.longitude + (b.longitude - a.longitude) * u,
      };
    }
    remain -= len;
  }
  return route[route.length - 1];
}

export function PublicTrackMap({
  route,
  progress = 0,
  riderName = "Rider",
  lastLocation,
}: PublicTrackMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const riderRef = useRef<L.Marker | null>(null);
  const traveledRef = useRef<L.Polyline | null>(null);

  const line = route.length >= 2 ? route : null;

  useEffect(() => {
    if (!containerRef.current || !line) return undefined;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const latlngs = line.map((p) => [p.latitude, p.longitude] as L.LatLngExpression);
    const map = L.map(containerRef.current, {
      zoomControl: false,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    L.polyline(latlngs, {
      color: "#0b2e59",
      weight: 4,
      opacity: 0.25,
    }).addTo(map);

    const start = line[0];
    const end = line[line.length - 1];
    L.circleMarker([start.latitude, start.longitude], {
      radius: 6,
      color: "#fff",
      weight: 2,
      fillColor: "#0b2e59",
      fillOpacity: 1,
    }).addTo(map);
    L.circleMarker([end.latitude, end.longitude], {
      radius: 6,
      color: "#fff",
      weight: 2,
      fillColor: "#891635",
      fillOpacity: 1,
    }).addTo(map);

    traveledRef.current = L.polyline([], {
      color: "#005daa",
      weight: 5,
      opacity: 0.9,
    }).addTo(map);

    const label = (riderName || "Rider").replace(/[<>&"]/g, "").slice(0, 20);
    riderRef.current = L.marker([start.latitude, start.longitude], {
      icon: L.divIcon({
        className: "pw-track-rider",
        html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
          <div style="width:16px;height:16px;border-radius:999px;background:#005daa;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,93,170,.4)"></div>
          <span style="font:600 10px/1.1 system-ui;color:#0b2e59;background:rgba(255,255,255,.92);padding:2px 6px;border-radius:6px;white-space:nowrap">${label}</span>
        </div>`,
        iconSize: [120, 36],
        iconAnchor: [60, 12],
      }),
    }).addTo(map);

    map.fitBounds(L.latLngBounds(latlngs as L.LatLngTuple[]), {
      padding: [28, 28],
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line?.map((p) => `${p.latitude},${p.longitude}`).join("|"), riderName]);

  useEffect(() => {
    if (!line || !riderRef.current || !traveledRef.current) return;
    const pos =
      lastLocation && Number.isFinite(lastLocation.latitude)
        ? lastLocation
        : pointAtProgress(line, progress);
    const traveled: L.LatLngExpression[] = [];
    const idx = Math.min(
      line.length - 1,
      Math.floor(progress * (line.length - 1) + 1e-9),
    );
    for (let i = 0; i <= idx; i++) {
      traveled.push([line[i].latitude, line[i].longitude]);
    }
    traveled.push([pos.latitude, pos.longitude]);
    traveledRef.current.setLatLngs(traveled);
    riderRef.current.setLatLng([pos.latitude, pos.longitude]);
  }, [line, progress, lastLocation]);

  if (!line) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-[18px] bg-surface text-sm text-muted">
        Chưa có tuyến đường
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[320px] w-full overflow-hidden rounded-[18px] ring-1 ring-border"
    />
  );
}
