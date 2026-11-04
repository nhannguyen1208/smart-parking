/** Normalize VN phones to 84xxxxxxxxx */
export function normalizePhone(raw: unknown): string | null {
  if (raw == null) return null;
  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("840")) digits = `84${digits.slice(3)}`;
  else if (digits.startsWith("0")) digits = `84${digits.slice(1)}`;
  else if (!digits.startsWith("84")) digits = `84${digits}`;
  if (digits.length < 11 || digits.length > 13) return null;
  return digits;
}

export function maskPhone(phone: string | null | undefined): string | null {
  const n = normalizePhone(phone);
  if (!n) return null;
  return `${n.slice(0, 4)}***${n.slice(-3)}`;
}

/**
 * Exchange Zalo phone token → number via Graph API.
 * @see https://docs.zaloplatforms.com/docs/MA/api/user/user-information/getPhoneNumber
 */
export async function resolvePhoneFromZaloTokens(input: {
  accessToken: string;
  phoneToken: string;
  secretKey?: string;
}): Promise<string> {
  const { accessToken, phoneToken, secretKey } = input;
  if (!accessToken || !phoneToken) {
    const err = new Error("accessToken and phoneToken are required") as Error & {
      code: string;
      status: number;
    };
    err.code = "VALIDATION_ERROR";
    err.status = 400;
    throw err;
  }
  if (!secretKey) {
    const err = new Error(
      "ZALO_APP_SECRET is not configured on the API server",
    ) as Error & { code: string; status: number };
    err.code = "ZALO_NOT_CONFIGURED";
    err.status = 503;
    throw err;
  }

  const res = await fetch("https://graph.zalo.me/v2.0/me/info", {
    method: "GET",
    headers: {
      access_token: accessToken,
      code: phoneToken,
      secret_key: secretKey,
    },
  });

  const body = (await res.json().catch(() => ({}))) as {
    error?: unknown;
    message?: string;
    error_description?: string;
    data?: { number?: string };
    number?: string;
  };

  if (!res.ok || body.error) {
    const message =
      body.message ||
      body.error_description ||
      `Zalo phone lookup failed (${res.status})`;
    const err = new Error(message) as Error & {
      code: string;
      status: number;
      detail: unknown;
    };
    err.code = "ZALO_PHONE_EXCHANGE_FAILED";
    err.status = 401;
    err.detail = body;
    throw err;
  }

  const number = body?.data?.number ?? body?.number;
  const phone = normalizePhone(number);
  if (!phone) {
    const err = new Error("Zalo did not return a valid phone number") as Error & {
      code: string;
      status: number;
    };
    err.code = "ZALO_PHONE_MISSING";
    err.status = 401;
    throw err;
  }
  return phone;
}
