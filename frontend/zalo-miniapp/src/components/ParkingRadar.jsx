import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../lib/api";

function statusVi(status) {
  if (status === "AVAILABLE") return "Còn chỗ";
  if (status === "NEARLY_FULL") return "Sắp đầy";
  if (status === "FULL") return "Hết chỗ";
  return status || "—";
}

function shortLotLabel(name) {
  return String(name || "").replace(/^Bãi\s+/i, "").trim() || name;
}

function lotDivIcon(lot, selected) {
  const color = lot.radarColor || "#64748b";
  const label = shortLotLabel(lot.name);
  return L.divIcon({
    className: "radar-lot-marker",
    iconSize: [88, 58],
    iconAnchor: [44, 58],
    html: `
      <div class="radar-lot-pin ${selected ? "is-selected" : ""}" style="--lot-color:${color}">
        <div class="radar-lot-badge" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 4.5h6.2c2.9 0 5.1 1.9 5.1 4.6 0 2.8-2.2 4.7-5.3 4.7H9.2V19.5H6V4.5Zm3.2 6.4h2.7c1.35 0 2.2-.75 2.2-1.85 0-1.1-.85-1.8-2.2-1.8H9.2v3.65Z" fill="#fff"/>
          </svg>
        </div>
        <div class="radar-lot-label">
          <span class="radar-lot-title">${label}</span>
          <span class="radar-lot-meta">${lot.availableEstimate} chỗ</span>
        </div>
      </div>
    `,
  });
}

export default function ParkingRadar() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const fittedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const radar = await api.parkingRadar();
      setData(radar);
      setError("");
      setSelectedId((prev) => {
        if (prev && radar.lots?.some((l) => l.id === prev)) return prev;
        const best = [...(radar.lots || [])]
          .filter((l) => l.status === "AVAILABLE")
          .sort((a, b) => b.availableEstimate - a.availableEstimate)[0];
        return best?.id ?? radar.lots?.[0]?.id ?? null;
      });
    } catch (err) {
      setError(err.message || "Không tải radar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load().catch(() => undefined), 8000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!mapEl.current || !data?.lots?.length) return undefined;

    if (!mapRef.current) {
      const c = data.campus || { latitude: 16.0695, longitude: 108.196, zoom: 13 };
      const map = L.map(mapEl.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 11,
      }).setView([c.latitude, c.longitude], c.zoom || 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      fittedRef.current = false;
    }

    const layer = layerRef.current;
    const map = mapRef.current;
    layer.clearLayers();

    const pinLots = data.lots.filter(
      (l) => l.latitude != null && l.longitude != null,
    );

    for (const lot of pinLots) {
      const selected = lot.id === selectedId;
      const color = lot.radarColor || "#64748b";
      const tip = `${lot.name}<br/>${lot.availableEstimate}/${lot.totalCapacity} trống`;

      if (lot.footprint?.length >= 3) {
        const poly = L.polygon(lot.footprint, {
          color,
          weight: selected ? 3 : 2,
          fillColor: color,
          fillOpacity: selected ? 0.42 : 0.28,
        });
        poly.bindTooltip(tip, { sticky: true });
        poly.on("click", () => setSelectedId(lot.id));
        poly.addTo(layer);
      }

      const marker = L.marker([lot.latitude, lot.longitude], {
        icon: lotDivIcon(lot, selected),
        zIndexOffset: selected ? 800 : 400,
      });
      marker.bindTooltip(tip, { direction: "top", offset: [0, -34] });
      marker.on("click", () => setSelectedId(lot.id));
      marker.addTo(layer);
    }

    if (!fittedRef.current && pinLots.length >= 1) {
      const pts = [];
      for (const lot of pinLots) {
        if (lot.footprint?.length) pts.push(...lot.footprint);
        else pts.push([lot.latitude, lot.longitude]);
      }
      if (pts.length >= 2) map.fitBounds(L.latLngBounds(pts).pad(0.25));
      else map.setView([pinLots[0].latitude, pinLots[0].longitude], 17);
      fittedRef.current = true;
    }

    setTimeout(() => map.invalidateSize(), 80);
  }, [data, selectedId]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
        fittedRef.current = false;
      }
    };
  }, []);

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted">Đang tải radar…</p>;
  }

  if (error || !data) {
    return (
      <div className="rounded-[14px] border border-red-200 bg-red-50 px-3 py-4 text-center text-sm text-brand-red">
        {error || "Không có dữ liệu"}
      </div>
    );
  }

  const selected = data.lots.find((l) => l.id === selectedId);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-[11px]">
        {(data.legend || []).map((item) => (
          <span
            key={item.status}
            className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>

      <div
        ref={mapEl}
        className="nightowl-leaflet h-[280px] w-full overflow-hidden rounded-[16px] border border-border bg-[#e8eef5]"
      />

      {selected ? (
        <div className="rounded-[16px] border border-border bg-card p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-navy">{selected.name}</p>
              <p className="mt-0.5 text-[11px] text-muted">
                {selected.locationDescription}
              </p>
            </div>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
              style={{ background: selected.radarColor }}
            >
              {statusVi(selected.status)}
            </span>
          </div>
          <p className="mt-2 text-sm text-navy">
            <span className="text-lg font-semibold">{selected.availableEstimate}</span>
            <span className="text-muted"> / {selected.totalCapacity} chỗ trống</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full"
              style={{
                width: `${selected.fillPct}%`,
                background: selected.radarColor,
              }}
            />
          </div>
        </div>
      ) : null}

      <ul className="space-y-2">
        {data.lots.map((lot) => (
          <li key={lot.id}>
            <button
              type="button"
              onClick={() => setSelectedId(lot.id)}
              className={`flex w-full items-center justify-between rounded-[14px] px-3 py-2.5 text-left text-sm ${
                lot.id === selectedId
                  ? "bg-brand-light/60 ring-1 ring-brand-blue/30"
                  : "bg-surface"
              }`}
            >
              <span className="font-medium text-navy">{lot.name}</span>
              <span className="flex items-center gap-2 text-xs text-muted">
                {lot.availableEstimate} trống
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: lot.radarColor }}
                />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
