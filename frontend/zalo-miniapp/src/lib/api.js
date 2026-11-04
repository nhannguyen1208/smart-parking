import { clearSession, getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  const body = await res.json().catch(() => ({}));

  if (res.status === 401) {
    clearSession();
  }

  if (!res.ok) {
    const err = new Error(body.message ?? body.error ?? "Request failed");
    err.code = body.error;
    err.status = res.status;
    throw err;
  }
  return body.data ?? body;
}

export const api = {
  baseUrl: API_URL,
  demoLogin: (zaloUserId = "zalo_demo_001") =>
    request("/api/auth/demo-login", {
      method: "POST",
      body: JSON.stringify({ zaloUserId }),
    }),
  phoneLogin: (payload) =>
    request("/api/auth/phone-login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => request("/api/me"),
  parkingRadar: () => request("/api/v1/student/parking-lots"),
  lockVehicle: (locked) =>
    request("/api/lock-vehicle", {
      method: "POST",
      body: JSON.stringify({ locked: Boolean(locked) }),
    }),
  generateGuestPass: (payload) =>
    request("/api/generate-guest-pass", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  startSafeRide: (payload) =>
    request("/api/safe-ride/start", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getSafeRide: (token) => request(`/api/safe-ride/${token}`),
  updateSafeRideLocation: (token, payload) =>
    request(`/api/safe-ride/${token}/location`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
