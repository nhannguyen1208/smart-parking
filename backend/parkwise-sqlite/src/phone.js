/** Normalize VN phones to 84xxxxxxxxx */
export function normalizePhone(raw) {
  if (raw == null) return null;
  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("840")) digits = `84${digits.slice(3)}`;
  else if (digits.startsWith("0")) digits = `84${digits.slice(1)}`;
  else if (!digits.startsWith("84")) digits = `84${digits}`;
  if (digits.length < 11 || digits.length > 13) return null;
  return digits;
}

export function maskPhone(phone) {
  const n = normalizePhone(phone);
  if (!n) return null;
  return `${n.slice(0, 4)}***${n.slice(-3)}`;
}

/**
 * Exchange Zalo phone token → E.164-ish number via Graph API.
 * @see https://docs.zaloplatforms.com/docs/MA/api/user/user-information/getPhoneNumber
 */
export async function resolvePhoneFromZaloTokens({
  accessToken,
  phoneToken,
  secretKey,
}) {
  if (!accessToken || !phoneToken) {
    throw Object.assign(new Error("accessToken and phoneToken are required"), {
      code: "VALIDATION_ERROR",
      status: 400,
    });
  }
  if (!secretKey) {
    throw Object.assign(
      new Error("ZALO_APP_SECRET is not configured on the API server"),
      { code: "ZALO_NOT_CONFIGURED", status: 503 },
    );
  }

  const res = await fetch("https://graph.zalo.me/v2.0/me/info", {
    method: "GET",
    headers: {
      access_token: accessToken,
      code: phoneToken,
      secret_key: secretKey,
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const message =
      body.message ||
      body.error_description ||
      `Zalo phone lookup failed (${res.status})`;
    throw Object.assign(new Error(message), {
      code: "ZALO_PHONE_EXCHANGE_FAILED",
      status: 401,
      detail: body,
    });
  }

  const number = body?.data?.number ?? body?.number;
  const phone = normalizePhone(number);
  if (!phone) {
    throw Object.assign(new Error("Zalo did not return a valid phone number"), {
      code: "ZALO_PHONE_MISSING",
      status: 401,
    });
  }
  return phone;
}
