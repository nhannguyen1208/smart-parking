/**
 * Notify student on successful gate check-in / check-out.
 *
 * Real Zalo delivery needs an Official Account:
 *   ZALO_OA_ACCESS_TOKEN  — OA access token
 *   user.zaloOaId         — idByOA after user follows the OA
 *
 * Without OA credentials, we still emit in-app socket + log a mock “Zalo” event
 * so demos work (toast in Mini App / gate feed).
 */

import { pushEvent } from "./db.js";

function formatTime(d = new Date()) {
  return d.toLocaleString("vi-VN", { hour12: false });
}

export function buildGateNotifyMessage({
  direction,
  displayName,
  studentId,
  plate,
  phone,
}) {
  const action =
    direction === "EXIT" || direction === "VEHICLE_EXITED"
      ? "check-out"
      : "check-in";
  const name = displayName || "Sinh viên";
  const mssv = studentId ? ` · MSSV ${studentId}` : "";
  return `ParkWise: ${name}${mssv} ${action} thành công — xe ${plate || "—"}. ${formatTime()}${
    phone ? ` · SĐT ${phone}` : ""
  }`;
}

/**
 * Send text to Zalo OA user inbox (CS message).
 * @see https://developers.zalo.me/docs/api/official-account-api
 */
async function sendOaTextMessage({ oaUserId, text }) {
  const token = process.env.ZALO_OA_ACCESS_TOKEN?.trim();
  if (!token) {
    return { ok: false, mode: "mock", reason: "ZALO_OA_ACCESS_TOKEN missing" };
  }
  if (!oaUserId) {
    return { ok: false, mode: "mock", reason: "user.zaloOaId missing (follow OA first)" };
  }

  const url = `https://openapi.zalo.me/v3.0/oa/message/cs?access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { user_id: String(oaUserId) },
      message: { text },
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error || body.error_code) {
    return {
      ok: false,
      mode: "oa",
      reason: body.message || body.error_name || `OA HTTP ${res.status}`,
      detail: body,
    };
  }
  return { ok: true, mode: "oa", detail: body };
}

/**
 * @param {object} opts
 * @param {import("socket.io").Server} [opts.io]
 */
export async function notifyGateSuccess({
  io,
  direction,
  vehicle,
  user,
}) {
  const displayName = user?.displayName || vehicle?.ownerName;
  const studentId = user?.studentId;
  const phone = user?.phone;
  const plate = vehicle?.plate;
  const zaloUserId = user?.zaloUserId || vehicle?.zaloUserId;
  const text = buildGateNotifyMessage({
    direction,
    displayName,
    studentId,
    plate,
    phone,
  });

  const oa = await sendOaTextMessage({
    oaUserId: user?.zaloOaId,
    text,
  });

  const event = await pushEvent({
    type: oa.ok ? "ZALO_NOTIFY_SENT" : "ZALO_NOTIFY_MOCK",
    direction,
    vehicleId: vehicle?.id,
    plate,
    phone,
    studentId,
    displayName,
    zaloUserId,
    channel: oa.mode,
    reason: oa.reason,
    message: text,
  });

  if (zaloUserId && io) {
    io.to(zaloUserId).emit("gate:notification", {
      ...event,
      zaloDelivery: oa.ok ? "oa" : "mock",
    });
    io.to(zaloUserId).emit("gate-alert", text);
    io.to(zaloUserId).emit("zalo:notify", {
      text,
      direction,
      delivery: oa.ok ? "oa" : "mock",
      reason: oa.reason,
    });
  }

  io?.emit("gate:event", event);

  if (oa.ok) {
    console.log(`[zalo-notify] OA sent → ${phone || zaloUserId}: ${text}`);
  } else {
    console.log(
      `[zalo-notify] MOCK (${oa.reason || "no OA"}) → ${phone || zaloUserId}: ${text}`,
    );
  }

  return { text, delivery: oa, event };
}
