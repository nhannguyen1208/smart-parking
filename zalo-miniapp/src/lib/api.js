const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5050";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
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
  me: (vehicleId = "veh_001") =>
    request(`/api/me?vehicleId=${encodeURIComponent(vehicleId)}`),
  lockVehicle: (vehicleId, locked) =>
    request("/api/lock-vehicle", {
      method: "POST",
      body: JSON.stringify({ vehicleId, locked }),
    }),
  saveZone: (payload) =>
    request("/api/save-zone", {
      method: "POST",
      body: JSON.stringify(payload),
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
  updateSafeRideLocation: (token, coords) =>
    request(`/api/safe-ride/${token}/location`, {
      method: "POST",
      body: JSON.stringify(coords),
    }),
};
