import { Types } from "mongoose";
import { env } from "../config/env.js";
import { writeAudit } from "../models/AuditLog.js";
import { FeeRecord } from "../models/FeeRecord.js";
import { GateDevice } from "../models/GateDevice.js";
import { GateEvent } from "../models/GateEvent.js";
import { Notification } from "../models/Notification.js";
import {
  computeLotStatus,
  ParkingLot,
  toPublicLot,
} from "../models/ParkingLot.js";
import {
  ParkingSession,
  toPublicSession,
} from "../models/ParkingSession.js";
import {
  hashCredentialToken,
  RfidCredential,
} from "../models/RfidCredential.js";
import { User } from "../models/User.js";
import { Vehicle } from "../models/Vehicle.js";
import { evaluateMissionOnEntry } from "./rewards.service.js";
import {
  FeeRecordStatus,
  GateEventSource,
  GateEventType,
  NotificationStatus,
  ParkingLotStatus,
  ParkingSessionStatus,
  RfidCredentialStatus,
  UserStatus,
  VehicleStatus,
} from "../types/enums.js";
import { calculateSessionFee } from "./fee.calculator.js";

export type ProcessGateInput = {
  eventId: string;
  gateCode: string;
  eventType: "ENTRY" | "EXIT";
  credentialRaw?: string;
  plateNumber?: string;
  occurredAt?: Date | string;
  source?: GateEventSource;
  actorId?: string;
};

export type ProcessGateResult = {
  ok: boolean;
  result: string;
  reason: string;
  session?: ReturnType<typeof toPublicSession>;
  lot?: ReturnType<typeof toPublicLot>;
  duplicate?: boolean;
  denied?: boolean;
  review?: boolean;
  rewards?: {
    awarded: boolean;
    points: number;
    missionName?: string;
    skipReason?: string;
  };
};

type SocketEmitter = {
  emitToGuards?: (event: string, payload: unknown) => void;
  emitToAdmins?: (event: string, payload: unknown) => void;
  emitToUser?: (userId: string, event: string, payload: unknown) => void;
  emitCapacity?: (payload: unknown) => void;
};

let socketBus: SocketEmitter = {};

export function setParkingSocketBus(bus: SocketEmitter) {
  socketBus = bus;
}

async function adjustOccupancy(lotId: Types.ObjectId, delta: number) {
  const lot = await ParkingLot.findById(lotId);
  if (!lot) return null;

  let next = lot.currentOccupancyEstimate + delta;
  let anomaly = false;
  let note = "";

  if (next < 0) {
    anomaly = true;
    note = "Occupancy would go negative; clamped for display";
    next = 0;
  }
  if (next > lot.totalCapacity) {
    anomaly = true;
    note = "Occupancy exceeds capacity; clamped for display";
    next = lot.totalCapacity;
  }

  lot.currentOccupancyEstimate = next;
  lot.status = computeLotStatus(
    lot.totalCapacity,
    next,
    lot.nearlyFullThresholdPct,
  );
  if (anomaly) {
    lot.anomalyFlag = true;
    lot.anomalyNote = note;
  }
  await lot.save();

  const publicLot = toPublicLot(lot);
  socketBus.emitCapacity?.({ lot: publicLot });
  socketBus.emitToGuards?.("parking:capacity-updated", { lot: publicLot });
  socketBus.emitToAdmins?.("parking:capacity-updated", { lot: publicLot });
  return lot;
}

export async function processGateEvent(
  input: ProcessGateInput,
): Promise<ProcessGateResult> {
  const occurredAt = input.occurredAt
    ? new Date(input.occurredAt)
    : new Date();
  const source = input.source ?? GateEventSource.DEMO;

  const existing = await GateEvent.findOne({ eventId: input.eventId });
  if (existing) {
    return {
      ok: true,
      result: existing.result || "DUPLICATE",
      reason: "Duplicate eventId — idempotent no-op",
      duplicate: true,
    };
  }

  const gate = await GateDevice.findOne({ code: input.gateCode.toUpperCase() });
  if (!gate || !gate.enabled) {
    return {
      ok: false,
      result: "DENIED",
      reason: "Gate disabled or unknown",
      denied: true,
    };
  }

  const lot = await ParkingLot.findById(gate.lotId);
  if (!lot || lot.status === ParkingLotStatus.CLOSED) {
    return {
      ok: false,
      result: "DENIED",
      reason: "Lot closed or unknown",
      denied: true,
    };
  }

  let credential = null;
  let vehicle = null;
  let user = null;

  if (input.credentialRaw) {
    const tokenHash = hashCredentialToken(input.credentialRaw);
    credential = await RfidCredential.findOne({ tokenHash });
  }

  if (!credential && input.plateNumber) {
    const plateNormalized = input.plateNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    vehicle = await Vehicle.findOne({ plateNormalized });
    if (vehicle) {
      credential = await RfidCredential.findOne({ vehicleId: vehicle._id });
    }
  }

  if (credential && !vehicle && credential.vehicleId) {
    vehicle = await Vehicle.findById(credential.vehicleId);
  }

  if (credential) {
    user = await User.findById(credential.ownerId);
  } else if (vehicle) {
    user = await User.findById(vehicle.ownerId);
  }

  const baseEvent = {
    eventId: input.eventId,
    gateId: gate._id,
    lotId: lot._id,
    occurredAt,
    credentialHash: credential?.tokenHash ?? "",
    vehicleId: vehicle?._id,
    userId: user?._id,
    source,
    processedAt: new Date(),
  };

  // Resolve credential / kill-switch
  if (!credential || !vehicle || !user) {
    await GateEvent.create({
      ...baseEvent,
      eventType:
        input.eventType === "ENTRY" ? GateEventType.DENIED : GateEventType.MANUAL_REVIEW,
      result: "REVIEW",
      reason: "Unregistered credential or vehicle",
    });
    socketBus.emitToGuards?.("gate:exception-created", {
      reason: "Unregistered credential or vehicle",
      eventId: input.eventId,
    });
    return {
      ok: false,
      result: "REVIEW",
      reason: "Unregistered credential or vehicle",
      review: true,
    };
  }

  if (
    credential.status !== RfidCredentialStatus.ACTIVE ||
    vehicle.status !== VehicleStatus.ACTIVE ||
    (user as { status?: string }).status === UserStatus.SUSPENDED
  ) {
    await GateEvent.create({
      ...baseEvent,
      eventType: GateEventType.DENIED,
      result: "DENIED",
      reason: "Credential or vehicle access disabled (Kill-Switch / suspended)",
    });
    socketBus.emitToGuards?.("gate:exception-created", {
      reason: "ParkWise access disabled",
      eventId: input.eventId,
      userId: user._id.toString(),
    });
    socketBus.emitToAdmins?.("gate:exception-created", {
      reason: "ParkWise access disabled",
      eventId: input.eventId,
    });
    return {
      ok: false,
      result: "DENIED",
      reason: "ParkWise access disabled",
      denied: true,
    };
  }

  if (input.eventType === "ENTRY") {
    if (lot.status === ParkingLotStatus.FULL) {
      await GateEvent.create({
        ...baseEvent,
        eventType: GateEventType.DENIED,
        result: "DENIED",
        reason: "Lot full (estimated)",
      });
      return {
        ok: false,
        result: "DENIED",
        reason: "Lot full (estimated)",
        denied: true,
        lot: toPublicLot(lot),
      };
    }

    const active = await ParkingSession.findOne({
      vehicleId: vehicle._id,
      status: ParkingSessionStatus.ACTIVE,
    });
    if (active) {
      await GateEvent.create({
        ...baseEvent,
        eventType: GateEventType.MANUAL_REVIEW,
        result: "REVIEW",
        reason: "Vehicle already has an active session",
      });
      return {
        ok: false,
        result: "REVIEW",
        reason: "Vehicle already has an active session",
        review: true,
        session: toPublicSession(active),
      };
    }

    const session = await ParkingSession.create({
      vehicleId: vehicle._id,
      userId: user._id,
      lotId: lot._id,
      entryGateId: gate._id,
      entryAt: occurredAt,
      status: ParkingSessionStatus.ACTIVE,
      credentialType: credential.credentialType,
      entryEventId: input.eventId,
    });

    await GateEvent.create({
      ...baseEvent,
      eventType: GateEventType.ENTRY,
      result: "ALLOWED",
      reason: "Entry accepted",
    });

    const updatedLot = await adjustOccupancy(lot._id, 1);

    // Zero-lost nudge (DEMO notification — reminder only)
    setTimeout(async () => {
      try {
        await Notification.create({
          userId: user!._id,
          channel: "IN_APP",
          type: "ZERO_LOST_NUDGE",
          contentKey: "remember_remove_key",
          status: NotificationStatus.DEMO,
          sentAt: new Date(),
        });
        socketBus.emitToUser?.(user!._id.toString(), "notification:demo", {
          type: "ZERO_LOST_NUDGE",
          message:
            "Please remember to remove your key and secure your vehicle. (Reminder only — not sensor detection.)",
        });
      } catch {
        // ignore
      }
    }, env.ZERO_LOST_NUDGE_MINUTES * 60 * 1000);

    // Rewards: any successful ENTRY inside the mission window earns points
    // (RFID, plate/LPR, DEMO sim, …) — once per student/mission/day.
    let rewards: ProcessGateResult["rewards"];
    try {
      const award = await evaluateMissionOnEntry({
        userId: user._id.toString(),
        occurredAt,
        eventId: input.eventId,
      });
      rewards = award;
      if (award.awarded) {
        socketBus.emitToUser?.(user._id.toString(), "rewards:earned", {
          points: award.points,
          missionName: award.missionName,
          message: `Nice work! You earned ${award.points} points.`,
        });
      }
    } catch {
      // rewards must never block parking
    }

    const publicSession = toPublicSession(session);
    socketBus.emitToUser?.(user._id.toString(), "parking:session-updated", {
      session: publicSession,
    });
    socketBus.emitToGuards?.("parking:session-updated", { session: publicSession });

    return {
      ok: true,
      result: "ALLOWED",
      reason: "Entry accepted",
      session: publicSession,
      lot: updatedLot ? toPublicLot(updatedLot) : toPublicLot(lot),
      rewards,
    };
  }

  // EXIT
  const active = await ParkingSession.findOne({
    vehicleId: vehicle._id,
    status: ParkingSessionStatus.ACTIVE,
  });

  if (!active) {
    await GateEvent.create({
      ...baseEvent,
      eventType: GateEventType.MANUAL_REVIEW,
      result: "REVIEW",
      reason: "Exit with no active session",
    });
    socketBus.emitToGuards?.("gate:exception-created", {
      reason: "Exit with no active session",
      eventId: input.eventId,
    });
    return {
      ok: false,
      result: "REVIEW",
      reason: "Exit with no active session — no occupancy decrement",
      review: true,
    };
  }

  const fee = calculateSessionFee({
    entryAt: active.entryAt,
    exitAt: occurredAt,
  });

  active.exitAt = occurredAt;
  active.exitGateId = gate._id;
  active.exitEventId = input.eventId;
  active.status = ParkingSessionStatus.CLOSED;
  active.feeAmount = fee.amount;
  await active.save();

  await FeeRecord.create({
    userId: user._id,
    sessionId: active._id,
    amount: fee.amount,
    currency: "VND",
    feeType: fee.feeType,
    status: FeeRecordStatus.DEMO,
    paymentMethod: "mock",
    labelledSample: true,
    settledAt: fee.amount === 0 ? occurredAt : undefined,
  });

  await GateEvent.create({
    ...baseEvent,
    eventType: GateEventType.EXIT,
    result: "ALLOWED",
    reason: "Exit accepted",
  });

  const updatedLot = await adjustOccupancy(active.lotId, -1);
  const publicSession = toPublicSession(active);
  socketBus.emitToUser?.(user._id.toString(), "parking:session-updated", {
    session: publicSession,
  });

  return {
    ok: true,
    result: "ALLOWED",
    reason: "Exit accepted",
    session: publicSession,
    lot: updatedLot ? toPublicLot(updatedLot) : undefined,
  };
}

export async function reconcileOccupancy(input: {
  lotId: string;
  observedCount: number;
  reason: string;
  actorId: string;
}) {
  if (!input.reason?.trim()) {
    throw Object.assign(new Error("Reason is required"), { status: 400, code: "VALIDATION_ERROR" });
  }
  const lot = await ParkingLot.findById(input.lotId);
  if (!lot) {
    throw Object.assign(new Error("Lot not found"), { status: 404, code: "NOT_FOUND" });
  }

  const previous = lot.currentOccupancyEstimate;
  lot.currentOccupancyEstimate = Math.max(
    0,
    Math.min(input.observedCount, lot.totalCapacity),
  );
  lot.status = computeLotStatus(
    lot.totalCapacity,
    lot.currentOccupancyEstimate,
    lot.nearlyFullThresholdPct,
  );
  lot.lastReconciledAt = new Date();
  lot.anomalyFlag = false;
  lot.anomalyNote = "";
  await lot.save();

  await writeAudit({
    actorId: input.actorId,
    action: "OCCUPANCY_RECONCILE",
    targetType: "ParkingLot",
    targetId: lot._id.toString(),
    reason: input.reason,
    metadata: { previous, observed: input.observedCount },
  });

  const publicLot = toPublicLot(lot);
  socketBus.emitCapacity?.({ lot: publicLot });
  return publicLot;
}

export async function closeSessionManually(input: {
  sessionId: string;
  reason: string;
  actorId: string;
}) {
  if (!input.reason?.trim()) {
    throw Object.assign(new Error("Reason is required"), { status: 400, code: "VALIDATION_ERROR" });
  }
  const session = await ParkingSession.findById(input.sessionId);
  if (!session || session.status !== ParkingSessionStatus.ACTIVE) {
    throw Object.assign(new Error("Active session not found"), {
      status: 404,
      code: "NOT_FOUND",
    });
  }

  const exitAt = new Date();
  const fee = calculateSessionFee({ entryAt: session.entryAt, exitAt });
  session.exitAt = exitAt;
  session.status = ParkingSessionStatus.CLOSED;
  session.closeReason = input.reason;
  session.feeAmount = fee.amount;
  await session.save();

  await FeeRecord.create({
    userId: session.userId,
    sessionId: session._id,
    amount: fee.amount,
    currency: "VND",
    feeType: fee.feeType,
    status: FeeRecordStatus.DEMO,
    paymentMethod: "manual_close",
    labelledSample: true,
  });

  await adjustOccupancy(session.lotId, -1);
  await writeAudit({
    actorId: input.actorId,
    action: "SESSION_MANUAL_CLOSE",
    targetType: "ParkingSession",
    targetId: session._id.toString(),
    reason: input.reason,
  });

  return toPublicSession(session);
}
