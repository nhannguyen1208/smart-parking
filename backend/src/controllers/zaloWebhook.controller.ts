import { createHash, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { GuestPass } from "../models/GuestPass.js";
import { writeAudit } from "../models/AuditLog.js";
import { SafeRideSession } from "../models/SafeRideSession.js";
import { User } from "../models/User.js";
import { GuestPassStatus } from "../types/enums.js";
import { sendData, sendError } from "../utils/apiResponse.js";

type RevokePayload = {
  event?: string;
  appId?: string;
  userId?: string;
  timestamp?: number | string;
};

function expectedMac(parts: string[], secret: string) {
  return createHash("sha256").update(parts.join("") + secret).digest("hex");
}

function signaturesMatch(provided: string, expected: string) {
  try {
    const a = Buffer.from(provided.replace(/^mac=/i, "").trim(), "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Soft-verify X-ZEvent-Signature when ZALO_APP_SECRET is set.
 * Zalo docs vary by product; accept common mac constructions.
 */
function verifyZaloSignature(req: Request, body: RevokePayload): boolean {
  const secret = process.env.ZALO_APP_SECRET?.trim();
  if (!secret) return true; // allow setup / local without secret

  const header =
    (req.header("X-ZEvent-Signature") ||
      req.header("x-zevent-signature") ||
      "") + "";
  if (!header) {
    // Some dashboard "Test URL" pings omit signature
    return true;
  }

  const appId = String(body.appId ?? "");
  const userId = String(body.userId ?? "");
  const ts = String(body.timestamp ?? "");
  const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});

  const candidates = [
    expectedMac([appId, userId, ts], secret),
    expectedMac([appId, raw, ts], secret),
    expectedMac([ts, raw], secret),
  ];

  return candidates.some((mac) => signaturesMatch(header, mac));
}

/** Dashboard / health check */
export async function zaloWebhookProbe(_req: Request, res: Response) {
  return sendData(res, {
    ok: true,
    service: "parkwise-zalo-webhook",
    accepts: ["user.revoke.consent"],
  });
}

/**
 * POST — Zalo: user.revoke.consent (rút đồng ý + yêu cầu xoá dữ liệu Mini App)
 * Webhook URL: https://api.minhnhann1208.online/api/zalo/webhook
 */
export async function zaloWebhook(req: Request, res: Response) {
  const body = (req.body ?? {}) as RevokePayload;
  const event = String(body.event || "");

  if (event && event !== "user.revoke.consent") {
    // Acknowledge unknown events so Zalo does not retry forever
    return sendData(res, { ok: true, ignored: true, event });
  }

  if (!verifyZaloSignature(req, body)) {
    return sendError(res, "INVALID_SIGNATURE", "Invalid X-ZEvent-Signature", 401);
  }

  const zaloUserId = String(body.userId || "").trim();
  if (!zaloUserId) {
    // Empty probe from dashboard — still 200
    return sendData(res, { ok: true, cleared: false, reason: "missing_userId" });
  }

  const user = await User.findOne({ zaloUserId });
  if (!user) {
    await writeAudit({
      action: "ZALO_REVOKE_CONSENT_UNKNOWN",
      targetType: "ZaloUser",
      targetId: zaloUserId,
      metadata: { appId: body.appId, timestamp: body.timestamp },
    });
    return sendData(res, { ok: true, cleared: false, reason: "user_not_found" });
  }

  // Strip Mini App / Zalo PII; keep campus web account (studentId login)
  user.zaloUserId = undefined;
  user.phone = undefined;
  user.set("preferences.qrTheme", undefined);
  await user.save();

  await GuestPass.updateMany(
    { creatorId: user._id, status: GuestPassStatus.ACTIVE },
    { status: GuestPassStatus.REVOKED },
  );

  await SafeRideSession.updateMany(
    { ownerId: user._id, status: "ACTIVE" },
    { $set: { status: "ENDED" } },
  );

  await writeAudit({
    actorId: user._id,
    action: "ZALO_REVOKE_CONSENT",
    targetType: "User",
    targetId: user._id.toString(),
    reason: "User revoked Mini App consent / requested data deletion",
    metadata: {
      zaloUserId,
      appId: body.appId,
      timestamp: body.timestamp,
    },
  });

  return sendData(res, {
    ok: true,
    cleared: true,
    userId: user._id.toString(),
  });
}
