import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  DEMO_ROUTE,
  pointAtProgress,
  trailForProgress,
} from "../lib/night-owl-demo";

const startIcon = L.divIcon({
  className: "nightowl-div-icon",
  html: `<div style="width:14px;height:14px;border-radius:999px;background:#0b2e59;border:2px solid #fff;box-shadow:0 1px 4px rgba(11,46,89,.35)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const endIcon = L.divIcon({
  className: "nightowl-div-icon",
  html: `<div style="width:14px;height:14px;border-radius:999px;background:#891635;border:2px solid #fff;box-shadow:0 1px 4px rgba(137,22,53,.35)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function riderIcon(name) {
  const label = (name || "Bạn").replace(/[<>&"]/g, "");
  const short =
    label.length > 18 ? `${label.slice(0, 16)}…` : label;
  return L.divIcon({
    className: "nightowl-div-icon",
    html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
      <div style="width:18px;height:18px;border-radius:999px;background:#005daa;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,93,170,.45)"></div>
      <span style="font:600 10px/1.1 system-ui,sans-serif;color:#0b2e59;background:rgba(255,255,255,.92);padding:2px 6px;border-radius:6px;white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis">${short}</span>
    </div>`,
    iconSize: [120, 36],
    iconAnchor: [60, 12],
  });
}

/**
 * Leaflet map: full route drawn first, rider runs along it.
 * @param {Array<{latitude:number,longitude:number,label?:string}>} route
 */
export default function NightOwlMap({
  progress = 0,
  riderName = "",
  route = DEMO_ROUTE,
}) {
  const displayName = riderName || "Bạn";
  const line = route?.length >= 2 ? route : DEMO_ROUTE;
  const routeKey = line
    .map((p) => `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`)
    .join("|");

  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({
    planned: null,
    routeSoft: null,
    traveled: null,
    rider: null,
    startM: null,
    endM: null,
  });

  useEffect(() => {
    if (!containerRef.current) return undefined;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const latlngs = line.map((p) => [p.latitude, p.longitude]);
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
      dragging: true,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    map.fitBounds(L.latLngBounds(latlngs).pad(0.35));

    const planned = L.polyline(latlngs, {
      color: "#0b2e59",
      weight: 3,
      opacity: 0.25,
      dashArray: "6 10",
      lineCap: "round",
    }).addTo(map);

    const routeSoft = L.polyline(latlngs, {
      color: "#005daa",
      weight: 5,
      opacity: 0.35,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    const start = line[0];
    const end = line[line.length - 1];
    const startM = L.marker([start.latitude, start.longitude], {
      icon: startIcon,
    })
      .addTo(map)
      .bindTooltip(start.label || "Start", {
        permanent: true,
        direction: "top",
        offset: [0, -8],
      });
    const endM = L.marker([end.latitude, end.longitude], { icon: endIcon })
      .addTo(map)
      .bindTooltip(end.label || "Điểm đến", {
        permanent: true,
        direction: "top",
        offset: [0, -8],
      });

    const traveled = L.polyline([], {
      color: "#005daa",
      weight: 6,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    const rider = L.marker(latlngs[0], {
      icon: riderIcon(displayName),
      zIndexOffset: 500,
    }).addTo(map);

    mapRef.current = map;
    layersRef.current = {
      planned,
      routeSoft,
      traveled,
      rider,
      startM,
      endM,
    };

    const onResize = () => map.invalidateSize();
    window.setTimeout(onResize, 80);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      map.remove();
      mapRef.current = null;
    };
    // Recreate map when route changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  useEffect(() => {
    const { traveled, rider } = layersRef.current;
    if (!traveled || !rider) return;

    const p = Math.min(1, Math.max(0, progress));
    const trail = trailForProgress(p, line).map((pt) => [
      pt.latitude,
      pt.longitude,
    ]);
    const cur = pointAtProgress(p, line);

    traveled.setLatLngs(trail.length ? trail : [[line[0].latitude, line[0].longitude]]);
    rider.setLatLng([cur.latitude, cur.longitude]);
    rider.setIcon(riderIcon(displayName));
  }, [progress, displayName, line, routeKey]);

  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const destLabel = line[line.length - 1]?.label || "Điểm đến";

  return (
    <div className="overflow-hidden border border-line bg-card">
      <div className="flex items-center justify-between px-3 py-2.5">
        <p className="text-[12px] font-medium text-ink">Bản đồ</p>
        <p className="max-w-[60%] truncate text-right text-[11px] text-muted">
          {pct}% · {destLabel}
        </p>
      </div>
      <div ref={containerRef} className="nightowl-leaflet h-[280px] w-full" />
      <div className="flex items-center justify-between gap-2 border-t border-line bg-wash px-3 py-2 text-[11px] text-muted">
        <span>OSM</span>
        <span className="font-medium text-ink">
          {pct >= 98 ? "Sắp tới" : "Đang đi"}
        </span>
      </div>
    </div>
  );
}
