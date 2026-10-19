import { appPath } from "./routing";

const STORAGE_KEY = "parkwise_nightowl_demo";

/** @typedef {{
 *  token: string;
 *  plate: string;
 *  status: string;
 *  expiresAt: string;
 *  startedAt: string;
 *  lastLocation: { latitude: number; longitude: number; at: string } | null;
 *  path: Array<{ latitude: number; longitude: number; at: string }>;
 * }} DemoSession */

/** Campus-ish Da Nang coords for a short static ride path */
const DEMO_PATH = [
  { latitude: 16.047079, longitude: 108.20623 },
  { latitude: 16.04812, longitude: 108.20841 },
  { latitude: 16.04955, longitude: 108.21088 },
  { latitude: 16.05102, longitude: 108.21315 },
  { latitude: 16.0524, longitude: 108.2156 },
];

export function isDemoToken(token) {
  return typeof token === "string" && token.startsWith("demo-");
}

function nowIso() {
  return new Date().toISOString();
}

/** @returns {DemoSession} */
export function createDemoSession(plate = "43B1-11111") {
  const startedAt = nowIso();
  const start = DEMO_PATH[0];
  const session = {
    token: `demo-${Math.random().toString(36).slice(2, 10)}`,
    plate,
    status: "ACTIVE",
    startedAt,
    expiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    lastLocation: {
      latitude: start.latitude,
      longitude: start.longitude,
      at: startedAt,
    },
    path: [
      {
        latitude: start.latitude,
        longitude: start.longitude,
        at: startedAt,
      },
    ],
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
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
    return session;
  } catch {
    return null;
  }
}

/** Advance along the static path for demo “live” feel. */
export function tickDemoSession(token) {
  const session = loadDemoSession(token);
  if (!session || session.status !== "ACTIVE") return session;

  const nextIndex = Math.min(session.path.length, DEMO_PATH.length - 1);
  const point = DEMO_PATH[nextIndex];
  const at = nowIso();
  const next = {
    ...session,
    lastLocation: { ...point, at },
    path:
      session.path.length < DEMO_PATH.length
        ? [...session.path, { ...point, at }]
        : session.path,
    status:
      session.path.length >= DEMO_PATH.length - 1 ? "ARRIVING" : "ACTIVE",
  };
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
