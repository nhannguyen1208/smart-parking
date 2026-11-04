"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type RadarLot = {
  id: string;
  name: string;
  code: string;
  locationDescription?: string;
  latitude: number | null;
  longitude: number | null;
  totalCapacity: number;
  availableEstimate: number;
  fillPct: number;
  status: string;
  radarColor: string;
  /** Polygon [[lat,lng], ...] — vùng bãi trên bản đồ */
  footprint?: [number, number][] | null;
};

type LiveParkingRadarProps = {
  lots: RadarLot[];
  center: { latitude: number; longitude: number; zoom?: number };
  selectedId?: string | null;
  onSelect?: (lotId: string) => void;
  className?: string;
};

function statusLabel(status: string) {
  if (status === "AVAILABLE") return "Còn chỗ";
  if (status === "NEARLY_FULL") return "Sắp đầy";
  if (status === "FULL") return "Hết chỗ";
  return status;
}

function shortLotLabel(name: string) {
  return name.replace(/^Bãi\s+/i, "").trim() || name;
}

function lotDivIcon(lot: RadarLot, selected: boolean) {
  const color = lot.radarColor || "#64748b";
  const label = shortLotLabel(lot.name);
  const free = lot.availableEstimate;
  // iconAnchor đáy giữa = mũi pin đúng tọa độ (tránh lệch CSS)
  return L.divIcon({
    className: "radar-lot-marker",
    iconSize: [96, 64],
    iconAnchor: [48, 64],
    html: `
      <div class="radar-lot-pin ${selected ? "is-selected" : ""}" style="--lot-color:${color}">
        <div class="radar-lot-badge" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M6 4.5h6.2c2.9 0 5.1 1.9 5.1 4.6 0 2.8-2.2 4.7-5.3 4.7H9.2V19.5H6V4.5Zm3.2 6.4h2.7c1.35 0 2.2-.75 2.2-1.85 0-1.1-.85-1.8-2.2-1.8H9.2v3.65Z" fill="#fff"/>
          </svg>
        </div>
        <div class="radar-lot-label">
          <span class="radar-lot-title">${label}</span>
          <span class="radar-lot-meta">${free} chỗ</span>
        </div>
      </div>
    `,
  });
}

export function LiveParkingRadar({
  lots,
  center,
  selectedId,
  onSelect,
  className = "",
}: LiveParkingRadarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const fittedKeyRef = useRef("");

  const pinLots = useMemo(
    () =>
      lots.filter(
        (l) =>
          l.latitude != null &&
          l.longitude != null &&
          Number.isFinite(l.latitude) &&
          Number.isFinite(l.longitude),
      ),
    [lots],
  );

  useEffect(() => {
    if (!containerRef.current) return undefined;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: true,
        minZoom: 11,
      }).setView([center.latitude, center.longitude], center.zoom ?? 13);

      // OpenStreetMap — không cần Map API key
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      fittedKeyRef.current = "";

      // Invalidate size after layout (rounded card)
      requestAnimationFrame(() => map.invalidateSize());
    }

    return undefined;
  }, [center.latitude, center.longitude, center.zoom]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    for (const lot of pinLots) {
      const selected = lot.id === selectedId;
      const color = lot.radarColor || "#64748b";
      const tip = `<strong>${lot.name}</strong><br/>${lot.availableEstimate}/${lot.totalCapacity} chỗ trống · ${statusLabel(lot.status)}`;

      if (lot.footprint && lot.footprint.length >= 3) {
        const poly = L.polygon(lot.footprint as L.LatLngExpression[], {
          color,
          weight: selected ? 3 : 2,
          opacity: 0.95,
          fillColor: color,
          fillOpacity: selected ? 0.42 : 0.28,
          className: "radar-lot-area",
        });
        poly.bindTooltip(tip, { sticky: true, opacity: 0.95 });
        poly.on("click", () => onSelect?.(lot.id));
        poly.addTo(layer);
      }

      const marker = L.marker([lot.latitude!, lot.longitude!], {
        icon: lotDivIcon(lot, selected),
        zIndexOffset: selected ? 900 : 500,
        riseOnHover: true,
      });
      marker.bindTooltip(tip, {
        direction: "top",
        opacity: 0.95,
        offset: [0, -40],
      });
      marker.on("click", () => onSelect?.(lot.id));
      marker.addTo(layer);
    }

    const fitKey = pinLots
      .map((l) => `${l.code}:${l.latitude},${l.longitude}`)
      .join("|");
    if (fitKey && fitKey !== fittedKeyRef.current && pinLots.length >= 1) {
      const pts: [number, number][] = [];
      for (const lot of pinLots) {
        if (lot.footprint?.length) {
          for (const p of lot.footprint) pts.push([p[0], p[1]]);
        } else {
          pts.push([lot.latitude!, lot.longitude!]);
        }
      }
      if (pts.length >= 2) {
        map.fitBounds(L.latLngBounds(pts).pad(0.35));
      } else {
        map.setView([pinLots[0].latitude!, pinLots[0].longitude!], 18);
      }
      fittedKeyRef.current = fitKey;
      requestAnimationFrame(() => map.invalidateSize());
    }
  }, [pinLots, selectedId, onSelect]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
        fittedKeyRef.current = "";
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`parking-radar-map h-[360px] w-full overflow-hidden rounded-[18px] border border-border/80 bg-[#e8eef5] md:h-[480px] ${className}`}
    />
  );
}
