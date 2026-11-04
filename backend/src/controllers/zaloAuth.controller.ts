import { createHash } from "node:crypto";
import bcrypt from "bcrypt";
import type { Response } from "express";
import QRCode from "qrcode";
import { env, isDemoMode } from "../config/env.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { GuestPass } from "../models/GuestPass.js";
import {
  SafeRideSession,
  toPublicSafeRideSession,
} from "../models/SafeRideSession.js";
import { writeAudit } from "../models/AuditLog.js";
import { RfidCredential } from "../models/RfidCredential.js";
import { User, toPublicUser, type UserDocument } from "../models/User.js";
import { getActiveMembership } from "../services/dashboard.service.js";
import {
  GuestPassStatus,
  RfidCredentialStatus,
  UserRole,
  UserStatus,
} from "../types/enums.js";
import { sendData, sendError } from "../utils/apiResponse.js";
import { signToken } from "../utils/jwt.js";
import { qrColorsForTheme } from "../utils/qr-theme-colors.js";
import { customAlphabet } from "../utils/nano.js";
import {
  normalizePhone,
  resolvePhoneFromZaloTokens,
} from "../utils/phone.js";

const guestCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);
const rideToken = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

async function rfidLockedFor(userId: string): Promise<boolean> {
  const active = await RfidCredential.countDocuments({
    ownerId: userId,
    status: RfidCredentialStatus.ACTIVE,
  });
  if (active > 0) return false;
  const suspended = await RfidCredential.countDocuments({
    ownerId: userId,
    status: RfidCredentialStatus.SUSPENDED,
  });
  return suspended > 0;
}

async function issueZaloSession(res: Response, user: UserDocument) {
  const token = signToken({ sub: user._id.toString(), role: user.role });
  const locked = await rfidLockedFor(user._id.toString());

  return sendData(res, {
    token,
    user: toPublicUser(user),
    locked,
  });
}

async function linkZaloFields(
  user: UserDocument,
  input: { phone?: string | null; zaloUserId?: string; displayName?: string },
) {
  let dirty = false;
  if (input.phone && user.phone !== input.phone) {
    user.phone = input.phone;
    dirty = true;
  }
  if (input.zaloUserId && user.zaloUserId !== input.zaloUserId) {
    user.zaloUserId = input.zaloUserId;
    dirty = true;
  }
  if (input.displayName && !user.name) {
    user.name = input.displayName;
    dirty = true;
  }
  if (dirty) await user.save();
  return user;
}

/**
 * Find existing campus user by phone / zaloUserId.
 * In DEMO_MODE, unknown phones can attach to the seeded Nhân account when matching,
 * or create a lightweight student (not used for production).
 */
async function resolveUserForZaloLogin(input: {
  phone: string;
  zaloUserId?: string;
  displayName?: string;
}): Promise<UserDocument> {
  const { phone, zaloUserId, displayName } = input;

  let user =
    (await User.findOne({ phone })) ||
    (zaloUserId ? await User.findOne({ zaloUserId }) : null);

  if (user) {
    return linkZaloFields(user, { phone, zaloUserId, displayName });
  }

  // Prefer linking demo twin (Nhân) when phone matches seed
  const demoTwin = await User.findOne({ studentId: "22040002" });
  if (
    demoTwin &&
    (!demoTwin.phone || demoTwin.phone === phone) &&
    isDemoMode()
  ) {
    return linkZaloFields(demoTwin, { phone, zaloUserId, displayName });
  }

  if (!isDemoMode()) {
    const err = new Error(
      "No campus account linked to this phone. Register on the web app first.",
    ) as Error & { code: string; status: number };
    err.code = "ACCOUNT_NOT_LINKED";
    err.status = 404;
    throw err;
  }

  // Demo-only auto student
  const suffix = phone.slice(-6);
  const passwordHash = await bcrypt.hash("password123", 10);
  user = await User.create({
    studentId: `ZALO-${suffix}`,
    name: displayName || `Zalo ${suffix}`,
    email: `zalo.${suffix}@vnuk.local`,
    passwordHash,
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    phone,
    zaloUserId: zaloUserId || `zalo_${phone}`,
  });
  return user;
}

export async function zaloDemoLogin(req: AuthenticatedRequest, res: Response) {
  const zaloUserId = String(req.body?.zaloUserId || "zalo_demo_001");
  const user = await User.findOne({ zaloUserId });
  if (!user) {
    return sendError(
      res,
      "USER_NOT_FOUND",
      "Unknown Zalo user — run npm run seed (links zalo_demo_001 → 22040002)",
      404,
    );
  }
  return issueZaloSession(res, user);
}

export async function zaloPhoneLogin(req: AuthenticatedRequest, res: Response) {
  const {
    accessToken,
    phoneToken,
    phone: rawPhone,
    zaloUserId,
    displayName,
  } = req.body ?? {};

  let phone = normalizePhone(rawPhone);

  if (!phone && accessToken && phoneToken) {
    try {
      phone = await resolvePhoneFromZaloTokens({
        accessToken: String(accessToken),
        phoneToken: String(phoneToken),
        secretKey: process.env.ZALO_APP_SECRET,
      });
    } catch (error) {
      const err = error as Error & { code?: string; status?: number };
      return sendError(
        res,
        err.code || "ZALO_PHONE_EXCHANGE_FAILED",
        err.message,
        err.status || 401,
      );
    }
  }

  if (!phone) {
    return sendError(
      res,
      "PHONE_REQUIRED",
      "Provide Zalo phoneToken+accessToken, or a phone number for demo login.",
      400,
    );
  }

  try {
    const user = await resolveUserForZaloLogin({
      phone,
      zaloUserId: zaloUserId ? String(zaloUserId) : undefined,
      displayName: displayName ? String(displayName) : undefined,
    });
    return issueZaloSession(res, user);
  } catch (error) {
    const err = error as Error & { code?: string; status?: number };
    return sendError(
      res,
      err.code || "LOGIN_FAILED",
      err.message,
      err.status || 500,
    );
  }
}

export async function miniAppMe(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return sendError(res, "UNAUTHORIZED", "Authentication required", 401);
  }
  const activeMembership = await getActiveMembership(req.user._id.toString());
  const locked = await rfidLockedFor(req.user._id.toString());
  return sendData(res, {
    user: toPublicUser(req.user),
    locked,
    activeMembership,
  });
}

/**
 * Compat with Mini App Kill-Switch: `{ locked: boolean }` → suspend RFID cards
 * (disables ParkWise gate access — no vehicle / plate required).
 */
export async function lockVehicleCompat(
  req: AuthenticatedRequest,
  res: Response,
) {
  if (!req.user) {
    return sendError(res, "UNAUTHORIZED", "Authentication required", 401);
  }
  if (env.FEATURE_KILL_SWITCH === "false") {
    return sendError(res, "DISABLED", "Kill-Switch feature flag off", 403);
  }

  const { locked } = req.body ?? {};
  if (typeof locked !== "boolean") {
    return sendError(
      res,
      "VALIDATION_ERROR",
      "`locked` boolean is required",
      400,
    );
  }

  const disable = locked;

  await RfidCredential.updateMany(
    {
      ownerId: req.user._id,
      status: {
        $in: disable
          ? [RfidCredentialStatus.ACTIVE]
          : [RfidCredentialStatus.SUSPENDED],
      },
    },
    {
      status: disable
        ? RfidCredentialStatus.SUSPENDED
        : RfidCredentialStatus.ACTIVE,
      revokeReason: disable
        ? "Kill-Switch: ParkWise access disabled by student"
        : "",
    },
  );

  await writeAudit({
    actorId: req.user._id,
    action: disable ? "KILL_SWITCH_ON" : "KILL_SWITCH_OFF",
    targetType: "User",
    targetId: req.user._id.toString(),
    reason: "Mini App Kill-Switch — disables ParkWise gate access only",
  });

  return sendData(res, {
    locked: disable,
    event: {
      type: disable ? "RFID_LOCKED" : "RFID_UNLOCKED",
      message: disable
        ? "Khoá thẻ ON — RFID bị từ chối tại cổng"
        : "Khoá thẻ OFF — sẵn sàng quét cổng",
    },
  });
}

export async function generateGuestPassCompat(
  req: AuthenticatedRequest,
  res: Response,
) {
  if (!req.user) {
    return sendError(res, "UNAUTHORIZED", "Authentication required", 401);
  }
  if (env.FEATURE_GUEST_PASS === "false") {
    return sendError(res, "DISABLED", "Backup Pass feature flag off", 403);
  }

  if (req.user.role === UserRole.STUDENT) {
    const membership = await getActiveMembership(req.user._id.toString());
    if (!membership) {
      return sendError(
        res,
        "MEMBERSHIP_REQUIRED",
        "Backup Pass requires an active parking plan. Register a plan on the web app first.",
        403,
      );
    }
  }

  const guestName = String(req.body?.guestName || "Backup Pass");
  const minutes = Math.min(
    Math.max(Number(req.body?.validMinutes) || 60, 15),
    24 * 60,
  );
  const raw = `GP-${guestCode()}`;
  const tokenHash = createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  const pass = await GuestPass.create({
    creatorId: req.user._id,
    tokenHash,
    displayCode: raw.slice(0, 12),
    validFrom: new Date(),
    expiresAt,
    maxUses: 1,
    status: GuestPassStatus.ACTIVE,
  });

  const qrPayload = JSON.stringify({
    type: "PARKWISE_GUEST_PASS",
    code: raw,
    expiresAt: expiresAt.toISOString(),
  });
  const qrColors = qrColorsForTheme(req.user.preferences?.qrTheme);
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    margin: 1,
    width: 280,
    color: { dark: qrColors.dark, light: qrColors.light },
  });

  return sendData(
    res,
    {
      pass: {
        id: pass._id.toString(),
        code: raw,
        guestName,
        status: pass.status,
        expiresAt: expiresAt.toISOString(),
        hostZaloUserId: req.user.zaloUserId ?? null,
      },
      qrDataUrl,
      qrPayload,
    },
    201,
  );
}

export async function startSafeRide(
  req: AuthenticatedRequest,
  res: Response,
) {
  if (!req.user) {
    return sendError(res, "UNAUTHORIZED", "Authentication required", 401);
  }

  const {
    latitude,
    longitude,
    force = false,
    riderName,
    startLabel,
    destLabel,
    route,
  } = req.body ?? {};
  const hour = new Date().getHours();
  if (!force && hour < 21) {
    return sendError(
      res,
      "TOO_EARLY",
      "Night-Owl Safe Ride activates after 21:00. Pass force=true to demo anytime.",
      400,
    );
  }

  const cleanRoute = Array.isArray(route)
    ? route
        .map((p: { latitude?: unknown; longitude?: unknown; label?: unknown }) => ({
          latitude: Number(p.latitude),
          longitude: Number(p.longitude),
          ...(typeof p.label === "string" && p.label ? { label: p.label } : {}),
        }))
        .filter(
          (p: { latitude: number; longitude: number }) =>
            Number.isFinite(p.latitude) && Number.isFinite(p.longitude),
        )
    : [];

  const token = rideToken() + rideToken();
  const expiresAt = new Date(Date.now() + 45 * 60 * 1000);
  const startLat =
    latitude != null
      ? Number(latitude)
      : cleanRoute[0]?.latitude;
  const startLng =
    longitude != null
      ? Number(longitude)
      : cleanRoute[0]?.longitude;

  const session = await SafeRideSession.create({
    token,
    ownerId: req.user._id,
    plate: "",
    riderName: String(riderName || req.user.name || "").slice(0, 80),
    startLabel: String(startLabel || "").slice(0, 120),
    destLabel: String(destLabel || "").slice(0, 120),
    route: cleanRoute,
    progress: 0,
    status: "ACTIVE",
    expiresAt,
    lastLat: startLat,
    lastLng: startLng,
    lastAt: startLat != null ? new Date() : undefined,
  });

  const trackingPath = `/track/${token}`;
  // Prefer public web track page so family can open in any browser (no Mini App required)
  const webOrigin = (
    process.env.WEB_PUBLIC_ORIGIN ||
    process.env.MINIAPP_PUBLIC_ORIGIN ||
    env.CORS_ORIGIN.split(",")
      .map((s) => s.trim())
      .find((s) => s.startsWith("https://") && !s.includes("api.")) ||
    "https://smart-parking-phi-seven.vercel.app"
  ).replace(/\/$/, "");
  const trackingUrl = `${webOrigin}${trackingPath}`;

  return sendData(
    res,
    {
      trackingUrl,
      trackingPath,
      session: toPublicSafeRideSession(session),
    },
    201,
  );
}

export async function getSafeRide(req: AuthenticatedRequest, res: Response) {
  const session = await SafeRideSession.findOne({ token: req.params.token });
  if (!session) {
    return sendError(res, "SESSION_NOT_FOUND", "Session not found", 404);
  }
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    session.status = "EXPIRED";
    await session.save();
  }
  return sendData(res, { session: toPublicSafeRideSession(session) });
}

export async function updateSafeRideLocation(
  req: AuthenticatedRequest,
  res: Response,
) {
  const session = await SafeRideSession.findOne({ token: req.params.token });
  if (!session) {
    return sendError(res, "SESSION_NOT_FOUND", "Session not found", 404);
  }
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    return sendError(res, "SESSION_EXPIRED", "Session expired", 410);
  }

  const { latitude, longitude, progress, status } = req.body ?? {};
  if (latitude == null || longitude == null) {
    return sendError(
      res,
      "VALIDATION_ERROR",
      "latitude and longitude required",
      400,
    );
  }

  session.lastLat = Number(latitude);
  session.lastLng = Number(longitude);
  session.lastAt = new Date();
  if (progress != null && Number.isFinite(Number(progress))) {
    session.progress = Math.min(1, Math.max(0, Number(progress)));
  }
  if (typeof status === "string" && status) {
    session.status = status.slice(0, 32);
  } else if (session.progress >= 0.98) {
    session.status = "ARRIVING";
  }
  await session.save();

  return sendData(res, { session: toPublicSafeRideSession(session) });
}
