import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type JwtPayload = {
  sub: string;
  role: string;
};

const TOKEN_COOKIE = "token";
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

/** Cross-site (Vercel FE → separate API host) needs SameSite=None; Secure. */
function cookieOptions() {
  const crossSite =
    process.env.COOKIE_SAMESITE === "none" ||
    process.env.CROSS_SITE_COOKIES === "true";
  return {
    httpOnly: true,
    secure: crossSite || process.env.NODE_ENV === "production",
    sameSite: (crossSite ? "none" : "lax") as "none" | "lax",
    maxAge: TOKEN_MAX_AGE_MS,
  };
}

export function setAuthCookie(res: import("express").Response, token: string) {
  res.cookie(TOKEN_COOKIE, token, cookieOptions());
}

export function clearAuthCookie(res: import("express").Response) {
  const { maxAge: _maxAge, ...opts } = cookieOptions();
  res.clearCookie(TOKEN_COOKIE, opts);
}

export { TOKEN_COOKIE };
