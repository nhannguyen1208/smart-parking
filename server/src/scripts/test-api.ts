import dotenv from "dotenv";

dotenv.config();

const API_URL = `http://localhost:${process.env.PORT ?? 4000}`;

type ApiResult<T> = { data: T } | { error: string; message: string };

async function request<T>(
  path: string,
  options: RequestInit = {},
  cookie?: string,
): Promise<{ status: number; body: ApiResult<T>; cookie?: string }> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (cookie) {
    headers.set("Cookie", cookie);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const setCookie = response.headers.get("set-cookie") ?? undefined;
  const body = (await response.json()) as ApiResult<T>;

  return {
    status: response.status,
    body,
    cookie: setCookie ?? cookie,
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTests() {
  console.log("Running API tests against", API_URL);

  const health = await request<{ status: string }>("/health");
  assert(health.status === 200, "Health check failed");

  const invalidLogin = await request<{ user: unknown }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "student001@example.com",
      password: "wrong-password",
    }),
  });
  assert(invalidLogin.status === 401, "Invalid login should fail");
  assert(
    "error" in invalidLogin.body && invalidLogin.body.error === "INVALID_CREDENTIALS",
    "Invalid login should return INVALID_CREDENTIALS",
  );

  const login = await request<{ user: { email: string }; token: string }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email: "student001@example.com",
        password: "password123",
      }),
    },
  );
  assert(login.status === 200, "Login should succeed");
  assert("data" in login.body, "Login should return data");
  assert(Boolean(login.cookie), "Login should set auth cookie");

  const cookie = login.cookie!;

  const me = await request<{ user: { email: string } }>(
    "/api/auth/me",
    { method: "GET" },
    cookie,
  );
  assert(me.status === 200, "/api/auth/me should work");
  assert(
    "data" in me.body && me.body.data.user.email === "student001@example.com",
    "/api/auth/me should return current user",
  );

  const dashboard = await request<{
    user: { name: string };
    parkingSummary: { totalCapacity: number; zones: unknown[] };
    quickActions: unknown[];
  }>("/api/dashboard", { method: "GET" }, cookie);
  assert(dashboard.status === 200, "Dashboard should load");
  assert(
    "data" in dashboard.body && dashboard.body.data.parkingSummary.totalCapacity > 0,
    "Dashboard parking summary should come from database",
  );

  const zones = await request<{ zones: unknown[] }>(
    "/api/parking/zones",
    { method: "GET" },
    cookie,
  );
  assert(zones.status === 200, "Parking zones should load");
  assert(
    "data" in zones.body && zones.body.data.zones.length === 3,
    "Parking zones should return seeded zones",
  );

  const profile = await request<{ user: { studentId: string } }>(
    "/api/profile",
    { method: "GET" },
    cookie,
  );
  assert(profile.status === 200, "Profile should load");

  const membership = await request<{ activeMembership: { status: string } | null }>(
    "/api/membership",
    { method: "GET" },
    cookie,
  );
  assert(membership.status === 200, "Membership should load");

  const plans = await request<{ plans: unknown[] }>(
    "/api/membership/plans",
    { method: "GET" },
    cookie,
  );
  assert(plans.status === 200, "Membership plans should load");
  assert(
    "data" in plans.body && plans.body.data.plans.length >= 3,
    "Membership plans should return seeded plans",
  );

  const unauthorized = await request<{ user: unknown }>("/api/dashboard", {
    method: "GET",
  });
  assert(unauthorized.status === 401, "Protected route should reject unauthenticated access");

  const logout = await request<{ success: boolean }>(
    "/api/auth/logout",
    { method: "POST" },
    cookie,
  );
  assert(logout.status === 200, "Logout should succeed");
  assert(
    Boolean(logout.cookie && /token=;|Max-Age=0|Expires=/i.test(logout.cookie)),
    "Logout should clear auth cookie",
  );

  const meWithoutCookie = await request<{ user: unknown }>("/api/auth/me", {
    method: "GET",
  });
  assert(meWithoutCookie.status === 401, "Unauthenticated /me should fail after logout");

  console.log("All API tests passed");
}

runTests().catch((error) => {
  console.error("API tests failed:", error);
  process.exit(1);
});
