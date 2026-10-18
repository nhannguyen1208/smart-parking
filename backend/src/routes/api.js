import { Router } from "express";
import { customAlphabet } from "nanoid";
import QRCode from "qrcode";
import {
  addGuestPass,
  findGuestPass,
  findVehicleById,
  listEvents,
  markGuestPassUsed,
  pushEvent,
  saveZoneMemory,
  setVehicleLocked,
} from "../db.js";

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
      mqttMock: String(process.env.MOCK_MQTT ?? "true") === "true",
    });
  });

  router.get(
    "/me",
    asyncHandler(async (req, res) => {
      const vehicleId = req.query.vehicleId ?? "veh_001";
      const vehicle = await findVehicleById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "VEHICLE_NOT_FOUND" });
      }
      res.json({ data: { vehicle } });
    }),
  );

  router.get(
    "/events",
    asyncHandler(async (_req, res) => {
      res.json({ data: await listEvents(30) });
    }),
  );

  router.post(
    "/lock-vehicle",
    asyncHandler(async (req, res) => {
      const { vehicleId = "veh_001", locked } = req.body ?? {};
      if (typeof locked !== "boolean") {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "`locked` boolean is required",
        });
      }

      const vehicle = await findVehicleById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "VEHICLE_NOT_FOUND" });
      }

      const updated = await setVehicleLocked(vehicleId, locked);

      const event = {
        type: locked ? "VEHICLE_LOCKED" : "VEHICLE_UNLOCKED",
        vehicleId,
        plate: updated.plate,
        message: locked
          ? "Kill-Switch ON — gate RFID ignored"
          : "Kill-Switch OFF — gate RFID active",
      };
      await pushEvent(event);
      io?.emit("vehicle:lock-changed", { vehicle: updated, event });
      if (updated.zaloUserId) {
        io?.to(updated.zaloUserId).emit("vehicle:lock-changed", {
          vehicle: updated,
          event,
        });
      }

      res.json({ data: { vehicle: updated } });
    }),
  );

  router.post(
    "/save-zone",
    asyncHandler(async (req, res) => {
      const {
        vehicleId = "veh_001",
        zone,
        row,
        note = "",
      } = req.body ?? {};

      if (!zone || !row) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "`zone` and `row` are required",
        });
      }

      const vehicle = await findVehicleById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "VEHICLE_NOT_FOUND" });
      }

      const updated = await saveZoneMemory(vehicleId, { zone, row, note });
      io?.to(updated.zaloUserId).emit("zone:updated", {
        vehicleId,
        zoneMemory: updated.zoneMemory,
      });

      res.json({ data: { vehicle: updated } });
    }),
  );

  router.post(
    "/generate-guest-pass",
    asyncHandler(async (req, res) => {
      const {
        vehicleId = "veh_001",
        guestName = "Guest",
        validMinutes = 60,
      } = req.body ?? {};

      const vehicle = await findVehicleById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "VEHICLE_NOT_FOUND" });
      }

      const minutes = Math.min(Math.max(Number(validMinutes) || 60, 15), 24 * 60);
      const code = `GP-${nano()}`;
      const expiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();

      const pass = await addGuestPass({
        code,
        vehicleId,
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

      io?.to(vehicle.zaloUserId).emit("guest-pass:created", { pass });

      res.status(201).json({
        data: {
          pass,
          qrDataUrl,
          qrPayload,
        },
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
          message: "Guest pass not found",
          valid: false,
        });
      }

      if (pass.status === "USED") {
        return res.status(409).json({
          error: "PASS_ALREADY_USED",
          message: "Guest pass already used",
          valid: false,
        });
      }

      if (new Date(pass.expiresAt).getTime() < Date.now()) {
        return res.status(410).json({
          error: "PASS_EXPIRED",
          message: "Guest pass expired",
          valid: false,
        });
      }

      const used = await markGuestPassUsed(code);
      const event = {
        type: "GUEST_PASS_VALIDATED",
        code: pass.code,
        vehicleId: pass.vehicleId,
        guestName: pass.guestName,
        message: `Guest pass validated for ${pass.guestName}`,
      };
      await pushEvent(event);
      io?.emit("gate:event", event);
      mqtt?.publish(mqtt.topics.GATE_CMD_TOPIC, {
        action: "OPEN",
        gate: "entry",
        reason: "GUEST_PASS",
        code: pass.code,
      });

      res.json({
        data: {
          valid: true,
          pass: used,
        },
      });
    }),
  );

  router.post(
    "/safe-ride/start",
    asyncHandler(async (req, res) => {
      const {
        vehicleId = "veh_001",
        latitude,
        longitude,
        force = false,
      } = req.body ?? {};

      const hour = new Date().getHours();
      if (!force && hour < 21) {
        return res.status(400).json({
          error: "TOO_EARLY",
          message:
            "Night-Owl Safe Ride activates after 21:00. Pass force=true to demo anytime.",
        });
      }

      const vehicle = await findVehicleById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "VEHICLE_NOT_FOUND" });
      }

      const token = nano() + nano();
      const expiresAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();
      const trackingPath = `/track/${token}`;
      const trackingUrl = `${req.protocol}://${req.get("host")}${trackingPath}`;

      const session = {
        token,
        vehicleId,
        plate: vehicle.plate,
        startedAt: new Date().toISOString(),
        expiresAt,
        lastLocation:
          latitude != null && longitude != null
            ? { latitude, longitude, at: new Date().toISOString() }
            : null,
      };

      globalThis.__parkwiseSafeRides ??= new Map();
      globalThis.__parkwiseSafeRides.set(token, session);

      await pushEvent({
        type: "SAFE_RIDE_STARTED",
        vehicleId,
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

  router.post("/safe-ride/:token/location", (req, res) => {
    const session = globalThis.__parkwiseSafeRides?.get(req.params.token);
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

    session.lastLocation = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      at: new Date().toISOString(),
    };
    globalThis.__parkwiseSafeRides.set(req.params.token, session);
    io?.emit("safe-ride:location", {
      token: req.params.token,
      location: session.lastLocation,
      plate: session.plate,
    });

    res.json({ data: { session } });
  });

  router.get("/safe-ride/:token", (req, res) => {
    const session = globalThis.__parkwiseSafeRides?.get(req.params.token);
    if (!session) {
      return res.status(404).json({ error: "SESSION_NOT_FOUND" });
    }
    res.json({ data: { session } });
  });

  router.post("/simulate/rfid", (req, res) => {
    const { rfidTag = "RFID-A1B2C3", direction = "ENTRY" } = req.body ?? {};
    mqtt.injectRfid({ rfidTag, direction });
    res.json({
      data: {
        injected: true,
        rfidTag,
        direction,
      },
    });
  });

  router.use((error, _req, res, _next) => {
    console.error("[api]", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: error?.message ?? "Unexpected error",
    });
  });

  return router;
}
