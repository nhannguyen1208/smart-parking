import { Router } from "express";
import { randomBytes, createHash } from "node:crypto";
import { getIntegrationStatuses, mockPayment } from "../../adapters/integrations.js";
import { env, isDemoMode } from "../../config/env.js";
import { authenticate, requireRoles, type AuthenticatedRequest } from "../../middleware/auth.js";
import { writeAudit } from "../../models/AuditLog.js";
import { FeeRecord } from "../../models/FeeRecord.js";
import { GateDevice, toPublicGate } from "../../models/GateDevice.js";
import { GateEvent } from "../../models/GateEvent.js";
import { GuestPass } from "../../models/GuestPass.js";
import {
  hashCredentialToken,
  RfidCredential,
  toPublicRfid,
} from "../../models/RfidCredential.js";
import { ParkingLot, toPublicLot } from "../../models/ParkingLot.js";
import { ParkingSession, toPublicSession } from "../../models/ParkingSession.js";
import { SOSRequest } from "../../models/SOSRequest.js";
import { toPublicUser, User } from "../../models/User.js";
import {
  normalizePlate,
  toPublicVehicle,
  Vehicle,
} from "../../models/Vehicle.js";
import { getActiveMembership } from "../../services/dashboard.service.js";
import {
  closeSessionManually,
  processGateEvent,
  reconcileOccupancy,
} from "../../services/parking.service.js";
import {
  adminRewardsStats,
  evaluateMissionOnEntry,
  getPointsBalance,
  getStudentRewardsOverview,
  listCatalogAdmin,
  listMissionsAdmin,
  redeemParkingReward,
  upsertCatalogReward,
  upsertMission,
} from "../../services/rewards.service.js";
import { simulateStudentCheckIn } from "../../services/rewards.simulate.js";
import {
  GateEventSource,
  GuestPassStatus,
  RfidCredentialStatus,
  SosStatus,
  UserRole,
  VehicleStatus,
} from "../../types/enums.js";
import { sendError, sendSuccess } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

function guestCode() {
  return `GP-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export function createV1Router() {
  const router = Router();

  router.get("/ready", (_req, res) => {
    sendSuccess(res, { ready: true, demoMode: isDemoMode() });
  });

  // ── Auth extras ──────────────────────────────────────────
  router.post(
    "/auth/demo-login",
    asyncHandler(async (req, res) => {
      if (!isDemoMode()) {
        return sendError(res, "FORBIDDEN", "demo-login disabled outside DEMO_MODE", 403);
      }
      const studentId = String(req.body?.studentId || "STU-NHI");
      const user = await User.findOne({ studentId }).select("+passwordHash");
      if (!user) return sendError(res, "NOT_FOUND", "Demo user not found — run seed", 404);
      const { signToken, setAuthCookie } = await import("../../utils/jwt.js");
      const token = signToken({ sub: user._id.toString(), role: user.role });
      setAuthCookie(res, token);
      sendSuccess(res, { user: toPublicUser(user), demo: true });
    }),
  );

  // ── Student ──────────────────────────────────────────────
  router.get(
    "/student/dashboard",
    authenticate,
    requireRoles(UserRole.STUDENT, UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const userId = req.user!._id;
      const [lots, activeSession, fees, vehicles, rewards] = await Promise.all([
        ParkingLot.find().sort({ code: 1 }),
        ParkingSession.findOne({ userId, status: "ACTIVE" }),
        FeeRecord.find({ userId }).sort({ createdAt: -1 }).limit(5),
        Vehicle.find({ ownerId: userId }),
        getPointsBalance(userId.toString()),
      ]);
      sendSuccess(res, {
        lots: lots.map(toPublicLot),
        activeSession: activeSession ? toPublicSession(activeSession) : null,
        recentFees: fees,
        vehicles: vehicles.map(toPublicVehicle),
        greenPoints: rewards,
        labelledSampleFees: true,
      });
    }),
  );

  router.get(
    "/student/parking-lots",
    authenticate,
    asyncHandler(async (_req, res) => {
      const lots = await ParkingLot.find().sort({ code: 1 });
      sendSuccess(res, lots.map(toPublicLot));
    }),
  );

  router.get(
    "/student/sessions",
    authenticate,
    requireRoles(UserRole.STUDENT, UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const sessions = await ParkingSession.find({ userId: req.user!._id })
        .sort({ entryAt: -1 })
        .limit(50);
      sendSuccess(res, sessions.map(toPublicSession));
    }),
  );

  router.get(
    "/student/fees",
    authenticate,
    requireRoles(UserRole.STUDENT, UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const fees = await FeeRecord.find({ userId: req.user!._id }).sort({ createdAt: -1 });
      sendSuccess(res, { fees, labelledSample: true });
    }),
  );

  router.get(
    "/student/vehicles",
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const vehicles = await Vehicle.find({ ownerId: req.user!._id });
      sendSuccess(res, vehicles.map(toPublicVehicle));
    }),
  );

  router.post(
    "/student/vehicles",
    authenticate,
    requireRoles(UserRole.STUDENT, UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const plateNumber = String(req.body?.plateNumber || "").trim();
      if (!plateNumber) return sendError(res, "VALIDATION_ERROR", "plateNumber required", 400);
      const vehicle = await Vehicle.create({
        ownerId: req.user!._id,
        plateNumber,
        plateNormalized: normalizePlate(plateNumber),
        make: req.body?.make || "",
        color: req.body?.color || "",
        vehicleType: "motorcycle",
        primary: true,
      });
      sendSuccess(res, toPublicVehicle(vehicle), 201);
    }),
  );

  router.get(
    "/student/rfid-credentials",
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const creds = await RfidCredential.find({ ownerId: req.user!._id });
      sendSuccess(res, creds.map(toPublicRfid));
    }),
  );

  router.post(
    "/student/kill-switch",
    authenticate,
    requireRoles(UserRole.STUDENT, UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (env.FEATURE_KILL_SWITCH === "false") {
        return sendError(res, "DISABLED", "Kill-Switch feature flag off", 403);
      }
      const vehicleId = req.body?.vehicleId as string | undefined;
      const disable = req.body?.disable !== false;
      const vehicle = vehicleId
        ? await Vehicle.findOne({ _id: vehicleId, ownerId: req.user!._id })
        : await Vehicle.findOne({ ownerId: req.user!._id, primary: true });
      if (!vehicle) return sendError(res, "NOT_FOUND", "Vehicle not found", 404);

      vehicle.status = disable ? VehicleStatus.DISABLED : VehicleStatus.ACTIVE;
      await vehicle.save();

      await RfidCredential.updateMany(
        { ownerId: req.user!._id, vehicleId: vehicle._id },
        {
          status: disable
            ? RfidCredentialStatus.SUSPENDED
            : RfidCredentialStatus.ACTIVE,
          revokeReason: disable ? "Kill-Switch: ParkWise access disabled by student" : "",
        },
      );

      await writeAudit({
        actorId: req.user!._id,
        action: disable ? "KILL_SWITCH_ON" : "KILL_SWITCH_OFF",
        targetType: "Vehicle",
        targetId: vehicle._id.toString(),
        reason: "Student toggle — disables ParkWise gate access only",
      });

      sendSuccess(res, {
        vehicle: toPublicVehicle(vehicle),
        message: disable
          ? "ParkWise access disabled (does not immobilize the motorcycle)"
          : "ParkWise access restored",
      });
    }),
  );

  router.post(
    "/student/guest-passes",
    authenticate,
    requireRoles(UserRole.STUDENT, UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (env.FEATURE_GUEST_PASS === "false") {
        return sendError(res, "DISABLED", "Backup Pass feature flag off", 403);
      }

      // Backup Pass (lost/forgot RFID) requires an active membership
      if (req.user!.role === UserRole.STUDENT) {
        const membership = await getActiveMembership(req.user!._id.toString());
        if (!membership) {
          return sendError(
            res,
            "MEMBERSHIP_REQUIRED",
            "Backup Pass requires an active parking plan (10,000 VND/day or 30,000 VND/month). Register a plan first.",
            403,
          );
        }
      }

      const minutes = Math.min(Math.max(Number(req.body?.validMinutes) || 60, 15), 24 * 60);
      const raw = guestCode();
      const tokenHash = createHash("sha256").update(raw).digest("hex");
      const pass = await GuestPass.create({
        creatorId: req.user!._id,
        tokenHash,
        displayCode: raw.slice(0, 12),
        validFrom: new Date(),
        expiresAt: new Date(Date.now() + minutes * 60 * 1000),
        maxUses: 1,
        status: GuestPassStatus.ACTIVE,
        lotId: req.body?.lotId || undefined,
      });
      sendSuccess(
        res,
        {
          id: pass._id.toString(),
          // plaintext token returned once for QR — not stored
          token: raw,
          expiresAt: pass.expiresAt,
          maxUses: 1,
          status: pass.status,
          qrPayload: JSON.stringify({
            v: 1,
            type: "PARKWISE_BACKUP",
            token: raw,
            exp: pass.expiresAt.toISOString(),
          }),
        },
        201,
      );
    }),
  );

  router.get(
    "/student/guest-passes",
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const passes = await GuestPass.find({ creatorId: req.user!._id }).sort({
        createdAt: -1,
      });
      sendSuccess(
        res,
        passes.map((p) => ({
          id: p._id.toString(),
          displayCode: p.displayCode,
          status: p.status,
          expiresAt: p.expiresAt,
          usedCount: p.usedCount,
          maxUses: p.maxUses,
        })),
      );
    }),
  );

  router.post(
    "/student/guest-passes/:id/revoke",
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const pass = await GuestPass.findOne({
        _id: req.params.id,
        creatorId: req.user!._id,
      });
      if (!pass) return sendError(res, "NOT_FOUND", "Pass not found", 404);
      pass.status = GuestPassStatus.REVOKED;
      pass.revokedAt = new Date();
      await pass.save();
      await writeAudit({
        actorId: req.user!._id,
        action: "GUEST_PASS_REVOKE",
        targetType: "GuestPass",
        targetId: pass._id.toString(),
      });
      sendSuccess(res, { id: pass._id.toString(), status: pass.status });
    }),
  );

  router.post(
    "/student/sos",
    authenticate,
    requireRoles(UserRole.STUDENT, UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (env.FEATURE_SOS === "false") {
        return sendError(res, "DISABLED", "SOS feature flag off", 403);
      }
      const type = String(req.body?.type || "ASSISTANCE");
      const sos = await SOSRequest.create({
        userId: req.user!._id,
        type,
        description: String(req.body?.description || ""),
        coarseLocation: String(req.body?.coarseLocation || ""),
        status: SosStatus.OPEN,
        statusHistory: [{ status: SosStatus.OPEN, at: new Date(), by: req.user!._id }],
      });
      sendSuccess(
        res,
        {
          id: sos._id.toString(),
          status: sos.status,
          note: "Request opened — not dispatched until an operator accepts",
        },
        201,
      );
    }),
  );

  router.get(
    "/student/sos",
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const list = await SOSRequest.find({ userId: req.user!._id }).sort({
        createdAt: -1,
      });
      sendSuccess(res, list);
    }),
  );

  router.get(
    "/student/rewards",
    authenticate,
    requireRoles(UserRole.STUDENT, UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const overview = await getStudentRewardsOverview(req.user!._id.toString());
      sendSuccess(res, overview);
    }),
  );

  router.post(
    "/student/rewards/redeem",
    authenticate,
    requireRoles(UserRole.STUDENT, UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      try {
        const result = await redeemParkingReward(
          req.user!._id.toString(),
          String(req.body?.rewardId || ""),
        );
        sendSuccess(res, result);
      } catch (e) {
        const err = e as Error & { code?: string; status?: number };
        return sendError(
          res,
          err.code || "REDEEM_FAILED",
          err.message || "Redemption failed",
          err.status || 400,
        );
      }
    }),
  );

  router.post(
    "/student/rewards/simulate-checkin",
    authenticate,
    requireRoles(UserRole.STUDENT, UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      try {
        const result = await simulateStudentCheckIn(req.user!._id.toString(), {
          forceWindow: Boolean(req.body?.forceWindow ?? true),
        });
        sendSuccess(res, result);
      } catch (e) {
        const err = e as Error & { code?: string; status?: number };
        return sendError(
          res,
          err.code || "SIM_FAILED",
          err.message || "Simulator failed",
          err.status || 400,
        );
      }
    }),
  );

  router.post(
    "/student/payments/demo-checkout",
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const result = await mockPayment.charge();
      sendSuccess(res, {
        ...result,
        feeId: req.body?.feeId,
        warning: "DEMO only — not a real charge",
      });
    }),
  );

  // ── Guard ────────────────────────────────────────────────
  router.get(
    "/guard/dashboard",
    authenticate,
    requireRoles(UserRole.GUARD, UserRole.ADMIN),
    asyncHandler(async (_req, res) => {
      const [lots, gates, recent, exceptions] = await Promise.all([
        ParkingLot.find(),
        GateDevice.find(),
        GateEvent.find().sort({ occurredAt: -1 }).limit(20),
        GateEvent.find({
          result: { $in: ["DENIED", "REVIEW"] },
        })
          .sort({ occurredAt: -1 })
          .limit(20),
      ]);
      sendSuccess(res, {
        lots: lots.map(toPublicLot),
        gates: gates.map(toPublicGate),
        recentEvents: recent,
        exceptions,
        demoMode: isDemoMode(),
      });
    }),
  );

  router.post(
    "/guard/scan",
    authenticate,
    requireRoles(UserRole.GUARD, UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const eventType = req.body?.eventType === "EXIT" ? "EXIT" : "ENTRY";
      const gateCode = String(req.body?.gateCode || "GATE_A_IN");
      const credentialRaw = req.body?.credentialRaw
        ? String(req.body.credentialRaw)
        : undefined;
      const guestToken = req.body?.guestToken
        ? String(req.body.guestToken)
        : undefined;
      const plateNumber = req.body?.plateNumber
        ? String(req.body.plateNumber)
        : undefined;

      if (guestToken) {
        const tokenHash = createHash("sha256").update(guestToken.trim()).digest("hex");
        const pass = await GuestPass.findOneAndUpdate(
          {
            tokenHash,
            status: GuestPassStatus.ACTIVE,
            expiresAt: { $gt: new Date() },
            usedCount: { $lt: 1 },
          },
          {
            $inc: { usedCount: 1 },
            $set: { status: GuestPassStatus.USED },
          },
          { new: true },
        );
        if (!pass) {
          return sendError(
            res,
            "BACKUP_PASS_INVALID",
            "Backup Pass expired, revoked, or already used",
            409,
          );
        }
        await writeAudit({
          actorId: req.user!._id,
          action: "BACKUP_PASS_REDEEM",
          targetType: "GuestPass",
          targetId: pass._id.toString(),
          reason: "Guard scan — student backup QR (lost/forgot RFID)",
        });

        // Backup Pass is the student's own check-in → counts for rewards
        let rewards: { awarded: boolean; points: number; missionName?: string } | null =
          null;
        if (eventType === "ENTRY") {
          try {
            rewards = await evaluateMissionOnEntry({
              userId: pass.creatorId.toString(),
              occurredAt: new Date(),
              eventId: `backup_${pass._id.toString()}`,
            });
          } catch {
            rewards = null;
          }
        }

        return sendSuccess(res, {
          ok: true,
          result: "ALLOWED",
          reason: "Backup Pass redeemed (single use) — student entry without RFID card",
          backupPassId: pass._id.toString(),
          guestPassId: pass._id.toString(),
          rewards,
          source: "DEMO",
        });
      }

      const result = await processGateEvent({
        eventId: `demo_${randomBytes(12).toString("hex")}`,
        gateCode,
        eventType,
        credentialRaw,
        plateNumber,
        source: GateEventSource.DEMO,
        actorId: req.user!._id.toString(),
      });
      sendSuccess(res, { ...result, source: "DEMO", labelledDemo: true });
    }),
  );

  router.get(
    "/guard/sessions",
    authenticate,
    requireRoles(UserRole.GUARD, UserRole.ADMIN),
    asyncHandler(async (req, res) => {
      const status = String(req.query.status || "ACTIVE");
      const sessions = await ParkingSession.find({ status })
        .sort({ entryAt: -1 })
        .limit(100);
      sendSuccess(res, sessions.map(toPublicSession));
    }),
  );

  router.post(
    "/guard/sessions/:id/close-manually",
    authenticate,
    requireRoles(UserRole.GUARD, UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const session = await closeSessionManually({
        sessionId: req.params.id,
        reason: String(req.body?.reason || ""),
        actorId: req.user!._id.toString(),
      });
      sendSuccess(res, session);
    }),
  );

  router.post(
    "/guard/occupancy/reconcile",
    authenticate,
    requireRoles(UserRole.GUARD, UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const lot = await reconcileOccupancy({
        lotId: String(req.body?.lotId),
        observedCount: Number(req.body?.observedCount),
        reason: String(req.body?.reason || ""),
        actorId: req.user!._id.toString(),
      });
      sendSuccess(res, lot);
    }),
  );

  router.get(
    "/guard/exceptions",
    authenticate,
    requireRoles(UserRole.GUARD, UserRole.ADMIN),
    asyncHandler(async (_req, res) => {
      const exceptions = await GateEvent.find({
        result: { $in: ["DENIED", "REVIEW"] },
      })
        .sort({ occurredAt: -1 })
        .limit(50);
      sendSuccess(res, exceptions);
    }),
  );

  router.patch(
    "/guard/sos/:id/status",
    authenticate,
    requireRoles(UserRole.GUARD, UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const status = String(req.body?.status || "") as SosStatus;
      if (!Object.values(SosStatus).includes(status)) {
        return sendError(res, "VALIDATION_ERROR", "Invalid status", 400);
      }
      const sos = await SOSRequest.findById(req.params.id);
      if (!sos) return sendError(res, "NOT_FOUND", "SOS not found", 404);
      sos.status = status;
      if (status === SosStatus.ACCEPTED) {
        sos.assignedOperatorId = req.user!._id;
      }
      sos.statusHistory.push({
        status,
        at: new Date(),
        by: req.user!._id,
        note: String(req.body?.note || ""),
      });
      await sos.save();
      sendSuccess(res, {
        id: sos._id.toString(),
        status: sos.status,
        demoLabel:
          status === SosStatus.ACCEPTED
            ? "Accepted by operator (demo staff if DEMO_MODE)"
            : undefined,
      });
    }),
  );

  // ── Admin ────────────────────────────────────────────────
  router.get(
    "/admin/overview",
    authenticate,
    requireRoles(UserRole.ADMIN),
    asyncHandler(async (_req, res) => {
      const [users, lots, activeSessions, eventsToday] = await Promise.all([
        User.countDocuments(),
        ParkingLot.find(),
        ParkingSession.countDocuments({ status: "ACTIVE" }),
        GateEvent.countDocuments({
          occurredAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        }),
      ]);
      sendSuccess(res, {
        users,
        lots: lots.map(toPublicLot),
        activeSessions,
        eventsToday,
        integrations: getIntegrationStatuses(),
      });
    }),
  );

  router.get(
    "/admin/users",
    authenticate,
    requireRoles(UserRole.ADMIN),
    asyncHandler(async (req, res) => {
      const q = String(req.query.q || "").trim();
      const filter = q
        ? {
            $or: [
              { name: new RegExp(q, "i") },
              { email: new RegExp(q, "i") },
              { studentId: new RegExp(q, "i") },
            ],
          }
        : {};
      const users = await User.find(filter).limit(100);
      sendSuccess(res, users.map(toPublicUser));
    }),
  );

  router.get(
    "/admin/lots",
    authenticate,
    requireRoles(UserRole.ADMIN, UserRole.GUARD),
    asyncHandler(async (_req, res) => {
      const lots = await ParkingLot.find();
      sendSuccess(res, lots.map(toPublicLot));
    }),
  );

  router.patch(
    "/admin/lots/:id",
    authenticate,
    requireRoles(UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const lot = await ParkingLot.findById(req.params.id);
      if (!lot) return sendError(res, "NOT_FOUND", "Lot not found", 404);
      if (req.body?.totalCapacity != null) {
        lot.totalCapacity = Number(req.body.totalCapacity);
      }
      if (req.body?.nearlyFullThresholdPct != null) {
        lot.nearlyFullThresholdPct = Number(req.body.nearlyFullThresholdPct);
      }
      if (req.body?.status) lot.status = req.body.status;
      await lot.save();
      await writeAudit({
        actorId: req.user!._id,
        action: "LOT_UPDATE",
        targetType: "ParkingLot",
        targetId: lot._id.toString(),
        reason: String(req.body?.reason || "Admin update"),
      });
      sendSuccess(res, toPublicLot(lot));
    }),
  );

  router.get(
    "/admin/gates",
    authenticate,
    requireRoles(UserRole.ADMIN, UserRole.GUARD),
    asyncHandler(async (_req, res) => {
      const gates = await GateDevice.find();
      sendSuccess(res, gates.map(toPublicGate));
    }),
  );

  router.get(
    "/admin/events",
    authenticate,
    requireRoles(UserRole.ADMIN, UserRole.GUARD),
    asyncHandler(async (req, res) => {
      const filter: Record<string, unknown> = {};
      if (req.query.result) filter.result = String(req.query.result);
      const events = await GateEvent.find(filter).sort({ occurredAt: -1 }).limit(100);
      sendSuccess(res, events);
    }),
  );

  router.get(
    "/admin/audit-logs",
    authenticate,
    requireRoles(UserRole.ADMIN),
    asyncHandler(async (_req, res) => {
      const { AuditLog } = await import("../../models/AuditLog.js");
      const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
      sendSuccess(res, logs);
    }),
  );

  router.get(
    "/admin/reports/summary",
    authenticate,
    requireRoles(UserRole.ADMIN),
    asyncHandler(async (req, res) => {
      const from = req.query.from
        ? new Date(String(req.query.from))
        : new Date(Date.now() - 7 * 864e5);
      const to = req.query.to ? new Date(String(req.query.to)) : new Date();
      const [entries, exits, fees] = await Promise.all([
        GateEvent.countDocuments({
          eventType: "ENTRY",
          result: "ALLOWED",
          occurredAt: { $gte: from, $lte: to },
        }),
        GateEvent.countDocuments({
          eventType: "EXIT",
          result: "ALLOWED",
          occurredAt: { $gte: from, $lte: to },
        }),
        FeeRecord.aggregate([
          { $match: { createdAt: { $gte: from, $lte: to } } },
          { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]),
      ]);
      sendSuccess(res, {
        from,
        to,
        entries,
        exits,
        feeTotalSampleVnd: fees[0]?.total ?? 0,
        feeCount: fees[0]?.count ?? 0,
        labelledSample: true,
      });
    }),
  );

  router.get(
    "/admin/integrations/status",
    authenticate,
    requireRoles(UserRole.ADMIN),
    asyncHandler(async (_req, res) => {
      sendSuccess(res, getIntegrationStatuses());
    }),
  );

  router.get(
    "/admin/settings/flags",
    authenticate,
    requireRoles(UserRole.ADMIN),
    asyncHandler(async (_req, res) => {
      sendSuccess(res, {
        FEATURE_GUEST_PASS: env.FEATURE_GUEST_PASS !== "false",
        FEATURE_KILL_SWITCH: env.FEATURE_KILL_SWITCH !== "false",
        FEATURE_SOS: env.FEATURE_SOS !== "false",
        FEATURE_REWARDS: env.FEATURE_REWARDS !== "false",
        FEATURE_CARPOOL: env.FEATURE_CARPOOL !== "false",
        FEATURE_SCHEDULE_PRIORITY: env.FEATURE_SCHEDULE_PRIORITY !== "false",
        DEMO_MODE: isDemoMode(),
        ZERO_LOST_NUDGE_MINUTES: env.ZERO_LOST_NUDGE_MINUTES,
        EARLY_BIRD_CUTOFF: env.EARLY_BIRD_CUTOFF,
        SAMPLE_DAILY_FEE_VND: env.SAMPLE_DAILY_FEE_VND,
      });
    }),
  );

  // helper for tests / RFID hash lookup (admin)
  router.post(
    "/admin/rfid",
    authenticate,
    requireRoles(UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const raw = String(req.body?.rawToken || "");
      const ownerId = String(req.body?.ownerId || "");
      const vehicleId = String(req.body?.vehicleId || "");
      if (!raw || !ownerId) {
        return sendError(res, "VALIDATION_ERROR", "rawToken and ownerId required", 400);
      }
      const cred = await RfidCredential.create({
        ownerId,
        vehicleId: vehicleId || undefined,
        tokenHash: hashCredentialToken(raw),
        displaySuffix: raw.slice(-4).toUpperCase(),
        status: RfidCredentialStatus.ACTIVE,
      });
      sendSuccess(res, toPublicRfid(cred), 201);
    }),
  );

  router.get(
    "/admin/rewards/stats",
    authenticate,
    requireRoles(UserRole.ADMIN),
    asyncHandler(async (_req, res) => {
      sendSuccess(res, await adminRewardsStats());
    }),
  );

  router.get(
    "/admin/rewards/missions",
    authenticate,
    requireRoles(UserRole.ADMIN),
    asyncHandler(async (_req, res) => {
      sendSuccess(res, { missions: await listMissionsAdmin() });
    }),
  );

  router.post(
    "/admin/rewards/missions",
    authenticate,
    requireRoles(UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const mission = await upsertMission(null, req.body || {});
      sendSuccess(res, { mission }, 201);
    }),
  );

  router.patch(
    "/admin/rewards/missions/:id",
    authenticate,
    requireRoles(UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      try {
        const mission = await upsertMission(req.params.id, req.body || {});
        sendSuccess(res, { mission });
      } catch (e) {
        const err = e as Error & { status?: number };
        return sendError(res, "NOT_FOUND", err.message, err.status || 404);
      }
    }),
  );

  router.get(
    "/admin/rewards/catalog",
    authenticate,
    requireRoles(UserRole.ADMIN),
    asyncHandler(async (_req, res) => {
      sendSuccess(res, { rewards: await listCatalogAdmin() });
    }),
  );

  router.post(
    "/admin/rewards/catalog",
    authenticate,
    requireRoles(UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const reward = await upsertCatalogReward(null, req.body || {});
      sendSuccess(res, { reward }, 201);
    }),
  );

  router.patch(
    "/admin/rewards/catalog/:id",
    authenticate,
    requireRoles(UserRole.ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      try {
        const reward = await upsertCatalogReward(req.params.id, req.body || {});
        sendSuccess(res, { reward });
      } catch (e) {
        const err = e as Error & { status?: number };
        return sendError(res, "NOT_FOUND", err.message, err.status || 404);
      }
    }),
  );

  return router;
}
