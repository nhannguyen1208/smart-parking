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
  });

  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || "error" in body) {
    const errorBody = body as ApiErrorBody;
    throw new ApiError(
      errorBody.error ?? "REQUEST_FAILED",
      errorBody.message ?? "Request failed",
    );
  }

  return body.data;
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
};
