import type { ApiErrorBody } from "./types";

export class ApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ApiError";
  }
}

export function getApiUrl() {
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.VITE_API_URL ??
    "http://localhost:4000"
  );
}

type ApiResponse<T> = { data: T } | ApiErrorBody;

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || ("error" in body && !("data" in body))) {
    const errorBody = body as ApiErrorBody;
    throw new ApiError(
      errorBody.error ?? "REQUEST_FAILED",
      errorBody.message ?? "Request failed",
    );
  }

  if (!("data" in body)) {
    throw new ApiError("REQUEST_FAILED", "Unexpected API response");
  }

  return (body as { data: T }).data;
}

export const api = {
  login: (payload: { studentId?: string; email?: string; password: string }) =>
    apiRequest<{ user: import("./types").User; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => apiRequest<{ user: import("./types").User }>("/api/auth/me"),
  logout: () => apiRequest<{ success: boolean }>("/api/auth/logout", { method: "POST" }),
  dashboard: () => apiRequest<import("./types").DashboardData>("/api/dashboard"),
  profile: () => apiRequest<import("./types").ProfileData>("/api/profile"),
  updateProfile: (payload: {
    name?: string;
    vehicleNumber?: string;
    vehicleType?: string;
  }) =>
    apiRequest<{ user: import("./types").User }>("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  parkingZones: () =>
    apiRequest<{ zones: import("./types").ParkingZone[] }>("/api/parking/zones"),
  membership: () => apiRequest<import("./types").MembershipData>("/api/membership"),
  membershipPlans: () =>
    apiRequest<{ plans: import("./types").MembershipPlan[] }>(
      "/api/membership/plans",
    ),
  subscribeMembership: (planId: string) =>
    apiRequest<{
      membership: import("./types").ActiveMembership;
      message: string;
    }>("/api/membership/subscribe", {
      method: "POST",
      body: JSON.stringify({ planId }),
    }),
  cancelMembership: () =>
    apiRequest<{
      membership: import("./types").ActiveMembership;
      message: string;
    }>("/api/membership/cancel", { method: "POST" }),

  // VNUK ParkWise /api/v1
  v1: {
    studentDashboard: () => apiRequest<Record<string, unknown>>("/api/v1/student/dashboard"),
    studentSessions: () => apiRequest<unknown[]>("/api/v1/student/sessions"),
    studentFees: () =>
      apiRequest<{ fees: unknown[]; labelledSample: boolean }>("/api/v1/student/fees"),
    studentVehicles: () => apiRequest<unknown[]>("/api/v1/student/vehicles"),
    studentRfid: () => apiRequest<unknown[]>("/api/v1/student/rfid-credentials"),
    killSwitch: (payload: { vehicleId?: string; disable?: boolean }) =>
      apiRequest<{ vehicle: unknown; message: string }>("/api/v1/student/kill-switch", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    createGuestPass: (payload?: { validMinutes?: number; lotId?: string }) =>
      apiRequest<{
        id: string;
        token: string;
        expiresAt: string;
        qrPayload: string;
        maxUses: number;
        status: string;
      }>("/api/v1/student/guest-passes", {
        method: "POST",
        body: JSON.stringify(payload ?? {}),
      }),
    listGuestPasses: () => apiRequest<unknown[]>("/api/v1/student/guest-passes"),
    revokeGuestPass: (id: string) =>
      apiRequest<{ id: string; status: string }>(
        `/api/v1/student/guest-passes/${id}/revoke`,
        { method: "POST" },
      ),
    createSos: (payload: {
      type: string;
      description?: string;
      coarseLocation?: string;
    }) =>
      apiRequest<{ id: string; status: string; note: string }>("/api/v1/student/sos", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    listSos: () => apiRequest<unknown[]>("/api/v1/student/sos"),
    rewards: () => apiRequest<Record<string, unknown>>("/api/v1/student/rewards"),
    redeemReward: (rewardId: string) =>
      apiRequest<{
        redemption: unknown;
        points: number;
        message: string;
      }>("/api/v1/student/rewards/redeem", {
        method: "POST",
        body: JSON.stringify({ rewardId }),
      }),
    simulateRewardCheckIn: (forceWindow = true) =>
      apiRequest<{
        gate: Record<string, unknown>;
        overview: Record<string, unknown>;
        rewards: {
          awarded: boolean;
          points: number;
          missionName?: string;
          skipReason?: string;
        } | null;
        simulated: boolean;
        note: string;
        occurredAt: string;
      }>("/api/v1/student/rewards/simulate-checkin", {
        method: "POST",
        body: JSON.stringify({ forceWindow }),
      }),
    guardDashboard: () => apiRequest<Record<string, unknown>>("/api/v1/guard/dashboard"),
    guardScan: (payload: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/api/v1/guard/scan", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    guardSessions: () =>
      apiRequest<unknown[]>("/api/v1/guard/sessions?status=ACTIVE"),
    closeSession: (id: string, reason: string) =>
      apiRequest<unknown>(`/api/v1/guard/sessions/${id}/close-manually`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    reconcileOccupancy: (payload: {
      lotId: string;
      observedCount: number;
      reason: string;
    }) =>
      apiRequest<unknown>("/api/v1/guard/occupancy/reconcile", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    guardExceptions: () => apiRequest<unknown[]>("/api/v1/guard/exceptions"),
    updateSos: (id: string, status: string, note?: string) =>
      apiRequest<unknown>(`/api/v1/guard/sos/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, note }),
      }),
    adminOverview: () => apiRequest<Record<string, unknown>>("/api/v1/admin/overview"),
    adminUsers: (q?: string) =>
      apiRequest<unknown[]>(
        `/api/v1/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`,
      ),
    adminEvents: () => apiRequest<unknown[]>("/api/v1/admin/events"),
    adminIntegrations: () =>
      apiRequest<unknown[]>("/api/v1/admin/integrations/status"),
    adminFlags: () => apiRequest<Record<string, unknown>>("/api/v1/admin/settings/flags"),
    adminReports: () =>
      apiRequest<Record<string, unknown>>("/api/v1/admin/reports/summary"),
    adminRewardStats: () =>
      apiRequest<Record<string, number>>("/api/v1/admin/rewards/stats"),
    adminRewardMissions: () =>
      apiRequest<{ missions: unknown[] }>("/api/v1/admin/rewards/missions"),
    patchRewardMission: (id: string, body: Record<string, unknown>) =>
      apiRequest<{ mission: unknown }>(`/api/v1/admin/rewards/missions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    adminRewardCatalog: () =>
      apiRequest<{ rewards: unknown[] }>("/api/v1/admin/rewards/catalog"),
    patchRewardCatalog: (id: string, body: Record<string, unknown>) =>
      apiRequest<{ reward: unknown }>(`/api/v1/admin/rewards/catalog/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
  },
};
