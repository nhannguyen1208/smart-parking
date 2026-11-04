import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "./zmp/Button";
import {
  START_POINT,
  composeAddressLabel,
  reverseGeocodeLabel,
  searchPlaces,
} from "../lib/night-owl-demo";

const startIcon = L.divIcon({
  className: "nightowl-div-icon",
  html: `<div style="width:12px;height:12px;border-radius:2px;background:#1a2332;border:2px solid #fff"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const destIcon = L.divIcon({
  className: "nightowl-div-icon",
  html: `<div style="width:14px;height:14px;border-radius:2px;background:#891635;border:2px solid #fff"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

/**
 * Search (street + house no.) or tap the map to choose destination.
 */
export default function DestinationPicker({
  initial,
  onConfirm,
  onCancel,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const houseRef = useRef(initial?.houseNumber || "");
  const [picked, setPicked] = useState(initial || null);
  const [label, setLabel] = useState(initial?.label || "");
  const [houseNumber, setHouseNumber] = useState(initial?.houseNumber || "");
  const [loadingLabel, setLoadingLabel] = useState(false);

  useEffect(() => {
    houseRef.current = houseNumber;
  }, [houseNumber]);

  const [query, setQuery] = useState(initial?.street || "");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  function placeOnMap(lat, lng, name) {
    const map = mapRef.current;
    if (!map) return;
    setPicked({ latitude: lat, longitude: lng });
    if (name) setLabel(name);
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon: destIcon }).addTo(map);
    }
    map.setView([lat, lng], Math.max(map.getZoom(), 17));
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OSM",
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.marker([START_POINT.latitude, START_POINT.longitude], {
      icon: startIcon,
    })
      .addTo(map)
      .bindTooltip(START_POINT.label, {
        permanent: true,
        direction: "top",
        offset: [0, -8],
      });

    const center = initial
      ? [initial.latitude, initial.longitude]
      : [START_POINT.latitude, START_POINT.longitude];
    map.setView(center, 15);

    if (initial) {
      markerRef.current = L.marker(
        [initial.latitude, initial.longitude],
        { icon: destIcon },
      ).addTo(map);
    }

    map.on("click", async (e) => {
      const { lat, lng } = e.latlng;
      placeOnMap(lat, lng, "");
      setLoadingLabel(true);
      setResults([]);
      const name = await reverseGeocodeLabel(lat, lng);
      setLabel(composeAddressLabel(name, houseRef.current));
      setLoadingLabel(false);
    });

    mapRef.current = map;
    const t = window.setTimeout(() => map.invalidateSize(), 100);
    return () => {
      window.clearTimeout(t);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  async function runSearch(e) {
    e?.preventDefault?.();
    const q = query.trim();
    if (q.length < 2) {
      setSearchError("Nhập tên đường hoặc địa chỉ");
      return;
    }
    setSearching(true);
    setSearchError("");
    try {
      const list = await searchPlaces(q, { houseNumber });
      setResults(list);
      if (!list.length) {
        setSearchError(
          "Không khớp OSM — chỉnh số nhà / ghim map, rồi ghi địa chỉ bên dưới.",
        );
      }
    } catch {
      setResults([]);
      setSearchError("Không tìm được — thử lại hoặc ghim trên map");
    } finally {
      setSearching(false);
    }
  }

  function selectResult(item) {
    const nextHouse = houseNumber || item.houseNumber || "";
    if (nextHouse && !houseNumber) setHouseNumber(nextHouse);
    let base = item.label;
    if (
      nextHouse &&
      base.toLowerCase().startsWith(nextHouse.toLowerCase())
    ) {
      base = base.slice(nextHouse.length).trim();
    }
    const nextLabel = composeAddressLabel(base || item.label, nextHouse);
    placeOnMap(item.latitude, item.longitude, nextLabel || item.label);
    setResults([]);
    setQuery(item.label);
    setSearchError("");
  }

  function finalLabel() {
    return composeAddressLabel(label || query, houseNumber) || "Điểm đến";
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[15px] font-semibold text-ink">Điểm đến</p>
        <p className="mt-0.5 text-[12px] text-muted">
          Điểm đi cố định: {START_POINT.label}. Nhập đường + số nhà, hoặc ghim map.
        </p>
      </div>

      <form onSubmit={runSearch} className="space-y-2">
        <div className="grid grid-cols-[1fr_5.5rem] gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchError("");
            }}
            placeholder="Đường / khu vực (vd: Lê Đình Dương)"
            className="field-input"
            autoComplete="street-address"
          />
          <input
            type="text"
            value={houseNumber}
            onChange={(e) => {
              setHouseNumber(e.target.value);
              if (label) setLabel(composeAddressLabel(label, e.target.value));
            }}
            placeholder="Số nhà"
            className="field-input text-center"
            autoComplete="off"
            inputMode="text"
          />
        </div>
        <Button
          type="submit"
          disabled={searching}
          className="h-10 w-full text-[13px]"
        >
          {searching ? "Đang tìm…" : "Tìm địa chỉ"}
        </Button>
      </form>

      {searchError ? (
        <p className="text-[12px] text-brand-red">{searchError}</p>
      ) : null}

      {results.length > 0 ? (
        <ul className="max-h-36 overflow-y-auto border border-line bg-card">
          {results.map((item) => (
            <li key={`${item.latitude}-${item.longitude}-${item.detail}`}>
              <button
                type="button"
                onClick={() => selectResult(item)}
                className="w-full border-b border-line px-3 py-2.5 text-left last:border-b-0 active:bg-wash"
              >
                <p className="text-[13px] font-medium text-ink">{item.label}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">
                  {item.detail}
                </p>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        ref={containerRef}
        className="nightowl-leaflet h-[220px] w-full overflow-hidden border border-line"
      />

      <label className="block">
        <span className="mb-1 block text-[12px] text-muted">
          Địa chỉ hiển thị (sửa số nhà nếu cần)
        </span>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="vd: 48/12 Lê Đình Dương"
          className="field-input"
          disabled={loadingLabel}
        />
      </label>

      {picked ? (
        <p className="font-mono text-[11px] text-muted">
          {picked.latitude.toFixed(5)}, {picked.longitude.toFixed(5)}
        </p>
      ) : (
        <p className="text-[12px] text-muted">Chưa ghim — tìm hoặc chạm map.</p>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Huỷ
        </Button>
        <Button
          type="button"
          disabled={!picked || loadingLabel}
          onClick={() =>
            onConfirm({
              latitude: picked.latitude,
              longitude: picked.longitude,
              label: finalLabel(),
              houseNumber: houseNumber.trim() || undefined,
              street: query.trim() || undefined,
            })
          }
        >
          Xác nhận
        </Button>
      </div>
    </div>
  );
}
