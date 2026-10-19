import { Router } from "express";
import { customAlphabet } from "nanoid";
import QRCode from "qrcode";
import { requireAuth, signToken } from "../auth.js";
import {
  addGuestPass,
  createSafeRideSession,
  ensureUserByPhone,
  findGuestPass,
  findSafeRideSession,
  findUserByZaloId,
  findVehicleByOwnerId,
  listEvents,
  markGuestPassUsed,
  pushEvent,
  toPublicUser,
  updateSafeRideLocation,
} from "../db.js";
import { normalizePhone, resolvePhoneFromZaloTokens } from "../phone.js";
import {
  getVehicleForAuth,
  toggleVehicleLock,
  updateZone,
} from "../services/vehicleService.js";

const nano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function createApiRouter({ mqtt, io }) {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "parkwise-backend",
      db: "prisma+sqlite",
      auth: "jwt",
      mqttMock: String(process.env.MOCK_MQTT ?? "true") === "true",
    });
  });

  async function issueSession(res, user) {
    const vehicle = await findVehicleByOwnerId(user.id);
    if (!vehicle) {
      return res.status(404).json({
        error: "VEHICLE_NOT_FOUND",
        message: "No vehicle linked to this user",
      });
    }

    const token = signToken({
      sub: user.id,
      zaloUserId: user.zaloUserId,
      vehicleId: vehicle.id,
      phone: user.phone ?? undefined,
    });

    return res.json({
      data: {
        token,
        user: toPublicUser(user),
        vehicle,
      },
    });
  }

  router.post(
    "/auth/demo-login",
    asyncHandler(async (req, res) => {
      const zaloUserId = String(req.body?.zaloUserId || "zalo_demo_001");
      const user = await findUserByZaloId(zaloUserId);
      if (!user) {
        return res.status(404).json({
          error: "USER_NOT_FOUND",
          message: "Unknown Zalo user — run npm run db:seed",
        });
      }
      return issueSession(res, user);
    }),
  );

  /**
   * Identify account by phone.
   * - Zalo Mini App: { accessToken, phoneToken, zaloUserId?, displayName? }
   * - Browser demo:   { phone: "090..." }
   */
  router.post(
    "/auth/phone-login",
    asyncHandler(async (req, res) => {
      const {
        accessToken,
        phoneToken,
        phone: rawPhone,
        zaloUserId,
        displayName,
      } = req.body ?? {};

      let phone = normalizePhone(rawPhone);

      if (!phone && accessToken && phoneToken) {
        phone = await resolvePhoneFromZaloTokens({
          accessToken: String(accessToken),
          phoneToken: String(phoneToken),
          secretKey: process.env.ZALO_APP_SECRET,
        });
      }

      if (!phone) {
        return res.status(400).json({
          error: "PHONE_REQUIRED",
          message:
            "Provide Zalo phoneToken+accessToken, or a phone number for demo login.",
        });
      }

      const user = await ensureUserByPhone({
        phone,
        zaloUserId: zaloUserId ? String(zaloUserId) : undefined,
        displayName: displayName ? String(displayName) : undefined,
      });

      return issueSession(res, user);
    }),
  );

  router.get(
    "/me",
    requireAuth,
    asyncHandler(async (req, res) => {
      const vehicle = await getVehicleForAuth(req.auth);
      if (!vehicle) {
        return res.status(404).json({ error: "VEHICLE_NOT_FOUND" });
      }
      const user = await findUserByZaloId(req.auth.zaloUserId);
      res.json({
        data: {
          user: toPublicUser(user),
          vehicle,
        },
      });
    }),
  );

  router.get(
    "/events",
    requireAuth,
    asyncHandler(async (req, res) => {
      const vehicle = await getVehicleForAuth(req.auth);
      res.json({
        data: await listEvents(30, vehicle?.id),
      });
    }),
  );

  router.post(
    "/lock-vehicle",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { locked } = req.body ?? {};
      if (typeof locked !== "boolean") {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "`locked` boolean is required",
        });
      }

      const vehicle = await getVehicleForAuth(req.auth);
      if (!vehicle) {
        return res.status(404).json({ error: "VEHICLE_NOT_FOUND" });
      }

      const result = await toggleVehicleLock({
        vehicleId: vehicle.id,
        locked,
        io,
      });
      res.json({ data: { vehicle: result.vehicle, event: result.event } });
    }),
  );

  router.post(
    "/save-zone",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { zone, row, note = "" } = req.body ?? {};
      if (!zone || !row) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "`zone` and `row` are required",
        });
      }

      const vehicle = await getVehicleForAuth(req.auth);
      if (!vehicle) {
        return res.status(404).json({ error: "VEHICLE_NOT_FOUND" });
      }

      const updated = await updateZone({
        vehicleId: vehicle.id,
        zone,
        row,
        note,
        io,
      });
      res.json({ data: { vehicle: updated } });
    }),
  );

  router.post(
    "/generate-guest-pass",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { guestName = "Guest", validMinutes = 60 } = req.body ?? {};
      const vehicle = await getVehicleForAuth(req.auth);
      if (!vehicle) {
        return res.status(404).json({ error: "VEHICLE_NOT_FOUND" });
      }

      const minutes = Math.min(Math.max(Number(validMinutes) || 60, 15), 24 * 60);
      const code = `GP-${nano()}`;
      const expiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();

      const pass = await addGuestPass({
        code,
        vehicleId: vehicle.id,
        hostPlate: vehicle.plate,
        hostZaloUserId: vehicle.zaloUserId,
        guestName,
        status: "ACTIVE",
        expiresAt,
      });

      const qrPayload = JSON.stringify({
        type: "PARKWISE_GUEST_PASS",
        code,
        expiresAt,
      });
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        margin: 1,
        width: 280,
        color: { dark: "#0b2e59", light: "#ffffff" },
      });

      if (vehicle.zaloUserId) {
        io?.to(vehicle.zaloUserId).emit("guest-pass:created", { pass });
      }

      res.status(201).json({
        data: { pass, qrDataUrl, qrPayload },
      });
    }),
  );

  router.post(
    "/validate-guest-pass",
    asyncHandler(async (req, res) => {
      const { code } = req.body ?? {};
      if (!code) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "`code` is required",
        });
      }

      const pass = await findGuestPass(code);
      if (!pass) {
        return res.status(404).json({
          error: "PASS_NOT_FOUND",
          message: "Backup Pass not found",
          valid: false,
        });
      }

      if (pass.status === "USED") {
        return res.status(409).json({
          error: "PASS_ALREADY_USED",
          message: "Backup Pass already used",
          valid: false,
        });
      }

      if (new Date(pass.expiresAt).getTime() < Date.now()) {
        return res.status(410).json({
          error: "PASS_EXPIRED",
          message: "Backup Pass expired",
          valid: false,
        });
      }

      const used = await markGuestPassUsed(code);
      const event = await pushEvent({
        type: "GUEST_PASS_VALIDATED",
        code: pass.code,
        vehicleId: pass.vehicleId,
        guestName: pass.guestName,
        message: `Backup Pass validated for ${pass.guestName}`,
      });
      io?.emit("gate:event", event);
      io?.emit("gate-alert", event.message);
      mqtt?.publish(mqtt.topics.GATE_CMD_TOPIC, {
        action: "OPEN",
        gate: "entry",
        reason: "GUEST_PASS",
        code: pass.code,
      });

      res.json({ data: { valid: true, pass: used } });
    }),
  );

  router.post(
    "/safe-ride/start",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { latitude, longitude, force = false } = req.body ?? {};
      const hour = new Date().getHours();
      if (!force && hour < 21) {
        return res.status(400).json({
          error: "TOO_EARLY",
          message:
            "Night-Owl Safe Ride activates after 21:00. Pass force=true to demo anytime.",
        });
      }

      const vehicle = await getVehicleForAuth(req.auth);
      if (!vehicle) {
        return res.status(404).json({ error: "VEHICLE_NOT_FOUND" });
      }

      const token = nano() + nano();
      const expiresAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();
      const session = await createSafeRideSession({
        token,
        vehicleId: vehicle.id,
        expiresAt,
        latitude: latitude != null ? Number(latitude) : undefined,
        longitude: longitude != null ? Number(longitude) : undefined,
      });

      const trackingPath = `/track/${token}`;
      const feOrigin = process.env.CORS_ORIGIN?.split(",")[0]?.trim() || "http://localhost:5173";
      const trackingUrl = `${feOrigin}${trackingPath}`;

      await pushEvent({
        type: "SAFE_RIDE_STARTED",
        vehicleId: vehicle.id,
        token,
        message: "Night-Owl Safe Ride tracking link created",
      });

      res.status(201).json({
        data: {
          trackingUrl,
          trackingPath,
          session,
        },
      });
    }),
  );

  router.post(
    "/safe-ride/:token/location",
    asyncHandler(async (req, res) => {
      const session = await findSafeRideSession(req.params.token);
      if (!session) {
        return res.status(404).json({ error: "SESSION_NOT_FOUND" });
      }
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        return res.status(410).json({ error: "SESSION_EXPIRED" });
      }

      const { latitude, longitude } = req.body ?? {};
      if (latitude == null || longitude == null) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "latitude and longitude required",
        });
      }

      const updated = await updateSafeRideLocation(req.params.token, {
        latitude,
        longitude,
      });
      io?.emit("safe-ride:location", {
        token: req.params.token,
        location: updated.lastLocation,
        plate: updated.plate,
      });

      res.json({ data: { session: updated } });
    }),
  );

  router.get(
    "/safe-ride/:token",
    asyncHandler(async (req, res) => {
      const session = await findSafeRideSession(req.params.token);
      if (!session) {
        return res.status(404).json({ error: "SESSION_NOT_FOUND" });
      }
      res.json({ data: { session } });
    }),
  );

  router.post("/simulate/rfid", (req, res) => {
    const { rfidTag = "RFID-A1B2C3", direction = "ENTRY" } = req.body ?? {};
    mqtt.injectRfid({ rfidTag, direction });
    res.json({
      data: { injected: true, rfidTag, direction },
    });
  });

  router.use((error, _req, res, _next) => {
    console.error("[api]", error);
    const status = error.status || 500;
    res.status(status).json({
      error: error.code || "INTERNAL_ERROR",
      message: error?.message ?? "Unexpected error",
    });
  });

  return router;
}
