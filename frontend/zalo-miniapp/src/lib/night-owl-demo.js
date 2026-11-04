import { appPath } from "./routing";

const STORAGE_KEY = "parkwise_nightowl_demo";

/** Fixed demo start — 183A Lê Lợi, Hải Châu, Đà Nẵng */
export const START_POINT = {
  latitude: 16.07095,
  longitude: 108.22046,
  label: "183A Lê Lợi",
};

/** Default destination if user skips picking (nearby residential) */
export const DEFAULT_DESTINATION = {
  latitude: 16.07485,
  longitude: 108.2112,
  label: "Nhà",
};

/** Fallback polyline when OSRM is unavailable */
export const DEMO_ROUTE = [
  { ...START_POINT },
  { latitude: 16.07155, longitude: 108.22035 },
  { latitude: 16.07235, longitude: 108.22022 },
  { latitude: 16.0732, longitude: 108.22015 },
  { latitude: 16.07345, longitude: 108.2186 },
  { latitude: 16.0737, longitude: 108.2169 },
  { latitude: 16.07405, longitude: 108.2149 },
  { latitude: 16.0744, longitude: 108.2131 },
  { ...DEFAULT_DESTINATION },
];

export const DEMO_PATH = DEMO_ROUTE;

/** @typedef {{ latitude: number; longitude: number; label?: string }} LatLng */
/** @typedef {{
 *  token: string;
 *  name: string;
 *  plate?: string;
 *  status: string;
 *  expiresAt: string;
 *  startedAt: string;
 *  lastLocation: { latitude: number; longitude: number; at: string } | null;
 *  path: Array<{ latitude: number; longitude: number; at: string }>;
 *  progress: number;
 *  route: LatLng[];
 *  start: LatLng;
 *  destination: LatLng;
 * }} DemoSession */

export function isDemoToken(token) {
  return typeof token === "string" && token.startsWith("demo-");
}

function nowIso() {
  return new Date().toISOString();
}

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

function getRoute(session) {
  return session?.route?.length >= 2 ? session.route : DEMO_ROUTE;
}

function routeMeta(route) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    const d = Math.hypot(b.latitude - a.latitude, b.longitude - a.longitude);
    segs.push(d);
    total += d;
  }
  return { segs, total: total || 1 };
}

export function pointAtProgress(t, route = DEMO_ROUTE) {
  const line = route?.length >= 2 ? route : DEMO_ROUTE;
  const p = clamp01(t);
  if (p <= 0) return { ...line[0] };
  if (p >= 1) return { ...line[line.length - 1] };

  const { segs, total } = routeMeta(line);
  let remain = p * total;
  for (let i = 0; i < segs.length; i++) {
    const len = segs[i];
    if (remain <= len) {
      const u = len === 0 ? 0 : remain / len;
      const a = line[i];
      const b = line[i + 1];
      return {
        latitude: a.latitude + (b.latitude - a.latitude) * u,
        longitude: a.longitude + (b.longitude - a.longitude) * u,
      };
    }
    remain -= len;
  }
  return { ...line[line.length - 1] };
}

export function trailForProgress(t, route = DEMO_ROUTE) {
  const line = route?.length >= 2 ? route : DEMO_ROUTE;
  const p = clamp01(t);
  const pts = [];
  const n = line.length;
  const idx = Math.min(n - 1, Math.floor(p * (n - 1) + 1e-9));
  for (let i = 0; i <= idx; i++) {
    pts.push({ latitude: line[i].latitude, longitude: line[i].longitude });
  }
  const cur = pointAtProgress(p, line);
  const last = pts[pts.length - 1];
  if (
    !last ||
    Math.hypot(cur.latitude - last.latitude, cur.longitude - last.longitude) >
      1e-7
  ) {
    pts.push(cur);
  }
  return pts;
}

/** Straight-line samples between start and end (fallback) */
export function buildStraightRoute(start, end, steps = 12) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    pts.push({
      latitude: start.latitude + (end.latitude - start.latitude) * u,
      longitude: start.longitude + (end.longitude - start.longitude) * u,
    });
  }
  pts[0] = { ...pts[0], label: start.label || START_POINT.label };
  pts[pts.length - 1] = {
    ...pts[pts.length - 1],
    label: end.label || "Điểm đến",
  };
  return pts;
}

/**
 * Driving route via public OSRM (no API key). Falls back to straight line.
 * @param {LatLng} start
 * @param {LatLng} end
 */
export async function fetchDrivingRoute(start, end) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${start.longitude},${start.latitude};${end.longitude},${end.latitude}` +
    `?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const body = await res.json();
    const coords = body?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) {
      throw new Error("Empty route");
    }
    const route = coords.map(([lng, lat], i) => ({
      latitude: lat,
      longitude: lng,
      ...(i === 0 ? { label: start.label || START_POINT.label } : {}),
      ...(i === coords.length - 1
        ? { label: end.label || "Điểm đến" }
        : {}),
    }));
    route[0] = { ...route[0], label: start.label || START_POINT.label };
    route[route.length - 1] = {
      ...route[route.length - 1],
      label: end.label || "Điểm đến",
    };
    return route;
  } catch {
    return buildStraightRoute(start, end);
  }
}

/**
 * Reverse-geocode a lat/lng for a short label (Nominatim).
 */
export async function reverseGeocodeLabel(latitude, longitude) {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}` +
      `&zoom=17&addressdetails=0`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("geocode failed");
    const body = await res.json();
    const name = body?.name || body?.display_name?.split(",")[0];
    return name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } catch {
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}

const NOMINATIM_HEADERS = {
  Accept: "application/json",
};

function formatPlaceLabel(item) {
  const addr = item?.address || {};
  const house =
    addr.house_number ||
    addr.housenumber ||
    "";
  const road =
    addr.road ||
    addr.pedestrian ||
    addr.residential ||
    addr.suburb ||
    "";
  if (house && road) return `${house} ${road}`;
  if (road) return road;
  const detail = item?.display_name || "";
  return (
    item?.name ||
    detail.split(",")[0] ||
    `${Number(item?.lat).toFixed(4)}, ${Number(item?.lon).toFixed(4)}`
  );
}

async function nominatimSearch(params) {
  const qs = new URLSearchParams({
    format: "json",
    addressdetails: "1",
    countrycodes: "vn",
    limit: "8",
    ...params,
  });
  // Bias around Hải Châu / Đà Nẵng
  qs.set("viewbox", "108.15,16.12,108.28,16.03");
  qs.set("bounded", "0");

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${qs.toString()}`,
    { headers: NOMINATIM_HEADERS },
  );
  if (!res.ok) throw new Error("search failed");
  const body = await res.json();
  return Array.isArray(body) ? body : [];
}

function mapNominatimResults(body) {
  const seen = new Set();
  const out = [];
  for (const item of body) {
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      latitude: lat,
      longitude: lon,
      label: formatPlaceLabel(item),
      detail: item.display_name || "",
      houseNumber: item.address?.house_number || item.address?.housenumber || "",
    });
  }
  return out;
}

/**
 * Forward-geocode near Đà Nẵng. Supports house numbers / street addresses.
 * @param {string} query
 * @param {{ houseNumber?: string }} [opts]
 * @returns {Promise<Array<{ latitude: number; longitude: number; label: string; detail: string; houseNumber?: string }>>}
 */
export async function searchPlaces(query, opts = {}) {
  const raw = String(query || "").trim();
  const house = String(opts.houseNumber || "").trim();
  if (raw.length < 2 && !house) return [];

  const streetPart = raw
    .replace(/,?\s*(đà nẵng|da nang|vietnam|việt nam)\s*$/i, "")
    .trim();
  const withCity = /đà nẵng|da nang/i.test(raw)
    ? raw
    : `${streetPart || raw}, Đà Nẵng`;

  const streetQuery = house
    ? `${house} ${streetPart || raw}`.trim()
    : streetPart || raw;
  const freeQuery = house
    ? `${house} ${withCity}`.replace(/\s+/g, " ").trim()
    : withCity;

  const batches = await Promise.allSettled([
    // Free-text (best for "12 Nguyễn Văn Linh, Đà Nẵng")
    nominatimSearch({ q: freeQuery }),
    // Structured street search
    nominatimSearch({
      street: streetQuery,
      city: "Đà Nẵng",
      county: "Hải Châu",
    }),
  ]);

  const merged = [];
  for (const batch of batches) {
    if (batch.status === "fulfilled") merged.push(...batch.value);
  }
  if (!merged.length) throw new Error("search failed");

  let results = mapNominatimResults(merged);
  // Prefer results that include the typed house number in label/detail
  if (house) {
    const lower = house.toLowerCase();
    const ranked = [...results].sort((a, b) => {
      const ah =
        (a.houseNumber || "").toLowerCase() === lower ||
        a.label.toLowerCase().includes(lower) ||
        a.detail.toLowerCase().includes(lower)
          ? 0
          : 1;
      const bh =
        (b.houseNumber || "").toLowerCase() === lower ||
        b.label.toLowerCase().includes(lower) ||
        b.detail.toLowerCase().includes(lower)
          ? 0
          : 1;
      return ah - bh;
    });
    results = ranked.map((r) => {
      if (r.label.toLowerCase().includes(lower)) return r;
      return {
        ...r,
        label: `${house} ${r.label}`.replace(/\s+/g, " ").trim(),
      };
    });
  }
  return results.slice(0, 8);
}

/** Build a display address from street + optional house number. */
export function composeAddressLabel(streetOrPlace, houseNumber) {
  const place = String(streetOrPlace || "").trim();
  const house = String(houseNumber || "").trim();
  if (!place && !house) return "Điểm đến";
  if (!house) return place;
  if (!place) return `Số ${house}`;
  if (place.toLowerCase().startsWith(house.toLowerCase())) return place;
  return `${house} ${place}`.replace(/\s+/g, " ").trim();
}

/**
 * @param {string} name
 * @param {{ destination?: LatLng; route?: LatLng[] }} [opts]
 * @returns {DemoSession}
 */
export function createDemoSession(name = "Bạn", opts = {}) {
  const destination = opts.destination || DEFAULT_DESTINATION;
  const route =
    opts.route?.length >= 2
      ? opts.route
      : buildStraightRoute(START_POINT, destination);
  const startedAt = nowIso();
  const start = pointAtProgress(0, route);
  const session = {
    token: `demo-${Math.random().toString(36).slice(2, 10)}`,
    name: String(name || "Bạn").trim() || "Bạn",
    status: "ACTIVE",
    startedAt,
    expiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    progress: 0,
    route,
    start: { ...START_POINT },
    destination: { ...destination },
    lastLocation: { ...start, at: startedAt },
    path: [{ ...start, at: startedAt }],
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

/** Display name for a demo / track session (name preferred over legacy plate). */
export function sessionRiderName(session) {
  if (!session) return "Bạn";
  const n =
    session.riderName ||
    session.name ||
    session.displayName ||
    session.plate;
  return String(n || "Bạn").trim() || "Bạn";
}

/** @returns {DemoSession | null} */
export function loadDemoSession(token) {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || session.token !== token) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      session.status = "EXPIRED";
    }
    if (typeof session.progress !== "number") session.progress = 0;
    if (!session.route?.length) session.route = DEMO_ROUTE;
    if (!session.start) session.start = { ...START_POINT };
    if (!session.destination) {
      session.destination = { ...session.route[session.route.length - 1] };
    }
    if (!session.name) session.name = session.plate || "Bạn";
    return session;
  } catch {
    return null;
  }
}

export function tickDemoSession(token) {
  const session = loadDemoSession(token);
  if (!session || session.status === "EXPIRED") return session;
  if (session.status === "ARRIVING" || session.progress >= 1) {
    return setDemoProgress(token, 1);
  }
  return setDemoProgress(token, clamp01((session.progress || 0) + 0.12));
}

export function setDemoProgress(token, progress) {
  const session = loadDemoSession(token);
  if (!session) return null;

  const route = getRoute(session);
  const p = clamp01(progress);
  const at = nowIso();
  const point = pointAtProgress(p, route);
  const trail = trailForProgress(p, route).map((pt, i, arr) => ({
    ...pt,
    at: i === arr.length - 1 ? at : session.path?.[i]?.at || at,
  }));

  const next = {
    ...session,
    progress: p,
    lastLocation: { ...point, at },
    path: trail,
    status: p >= 0.98 ? "ARRIVING" : "ACTIVE",
  };
  if (p >= 1) next.status = "ARRIVING";
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function demoTrackingPath(token) {
  return appPath(`/track/${token}`);
}

export function demoTrackingUrl(token) {
  if (typeof window === "undefined") return demoTrackingPath(token);
  return `${window.location.origin}${demoTrackingPath(token)}`;
}
