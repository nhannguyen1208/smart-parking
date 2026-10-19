import crypto from "node:crypto";

const DEFAULT_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

function secret() {
  return process.env.JWT_SECRET || "parkwise-dev-secret-change-me";
}

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlJson(obj) {
  return b64url(JSON.stringify(obj));
}

function sign(data) {
  return crypto
    .createHmac("sha256", secret())
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function signToken(payload, ttlSec = DEFAULT_TTL_SEC) {
  const header = { alg: "HS256", typ: "JWT" };
  const body = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlSec,
  };
  const unsigned = `${b64urlJson(header)}.${b64urlJson(body)}`;
  return `${unsigned}.${sign(unsigned)}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const unsigned = `${h}.${p}`;
  const expected = sign(unsigned);
  const a = Buffer.from(s);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const json = Buffer.from(p.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
      "utf8",
    );
    const payload = JSON.parse(json);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function extractBearer(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== "string") return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export function requireAuth(req, res, next) {
  const token = extractBearer(req);
  const payload = verifyToken(token);
  if (!payload?.sub) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Valid Bearer token required",
    });
  }
  req.auth = {
    userId: payload.sub,
    zaloUserId: payload.zaloUserId,
    vehicleId: payload.vehicleId,
  };
  return next();
}
