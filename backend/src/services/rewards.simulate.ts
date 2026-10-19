import { isDemoMode } from "../config/env.js";
import { GateDevice } from "../models/GateDevice.js";
import {
  hashCredentialToken,
  RfidCredential,
} from "../models/RfidCredential.js";
import { ParkingSession } from "../models/ParkingSession.js";
import type { RewardMissionDocument } from "../models/RewardMission.js";
import { User } from "../models/User.js";
import { GateEventSource, ParkingSessionStatus } from "../types/enums.js";
import { parseHm, vnDateTodayAt, vnWeekday } from "../utils/vnTime.js";
import { processGateEvent } from "./parking.service.js";
import {
  getActiveMission,
  getStudentRewardsOverview,
} from "./rewards.service.js";

/**
 * DEMO: land inside the active mission window, including an allowed weekday.
 * (Seed mission is Mon–Fri — weekends would otherwise never award.)
 */
function demoOccurredAtForMission(
  mission: Pick<
    RewardMissionDocument,
    "windowStart" | "windowEnd" | "daysOfWeek"
  >,
  base = new Date(),
) {
  const days = mission.daysOfWeek?.length
    ? mission.daysOfWeek
    : [0, 1, 2, 3, 4, 5, 6];
  const start = parseHm(mission.windowStart);
  const end = parseHm(mission.windowEnd);
  const mid = Math.floor((start + end) / 2);
  const hh = String(Math.floor(mid / 60)).padStart(2, "0");
  const mm = String(mid % 60).padStart(2, "0");
  const hm = `${hh}:${mm}`;

  for (let offset = 0; offset < 7; offset++) {
    const dayBase = new Date(base.getTime() - offset * 24 * 60 * 60 * 1000);
    const at = vnDateTodayAt(hm, dayBase);
    if (days.includes(vnWeekday(at))) return at;
  }
  return vnDateTodayAt(hm, base);
}

/** DEMO-only: RFID check-in through the same gate pipeline. */
export async function simulateStudentCheckIn(
  userId: string,
  options: { forceWindow?: boolean } = {},
) {
  if (!isDemoMode()) {
    const err = new Error("Simulator is only available in DEMO mode.");
    (err as Error & { code: string; status: number }).code = "DEMO_ONLY";
    (err as Error & { status: number }).status = 403;
    throw err;
  }

  const gate = await GateDevice.findOne({ enabled: true }).sort({ code: 1 });
  if (!gate) {
    const err = new Error("No gate device configured.");
    (err as Error & { code: string; status: number }).code = "NO_GATE";
    (err as Error & { status: number }).status = 500;
    throw err;
  }

  const user = await User.findById(userId);
  let credentialRaw = "";
  if (user?.studentId === "STU-NHI") credentialRaw = "RFID-NHI-001";
  else if (user?.studentId === "STU-TAN") credentialRaw = "RFID-TAN-001";
  else if (user?.studentId === "STU-NGHIA") credentialRaw = "RFID-NGHIA-001";

  if (!credentialRaw) {
    const err = new Error(
      "Simulator needs a known demo RFID tag. Use STU-NHI / STU-TAN / STU-NGHIA seed accounts.",
    );
    (err as Error & { code: string; status: number }).code = "SIM_TAG_UNKNOWN";
    (err as Error & { status: number }).status = 400;
    throw err;
  }

  const tokenHash = hashCredentialToken(credentialRaw);
  let cred = await RfidCredential.findOne({ ownerId: userId }).sort({
    createdAt: 1,
  });
  // Recover from stale seed (tag exists but ownerId drifted)
  if (!cred || cred.tokenHash !== tokenHash) {
    const byTag = await RfidCredential.findOne({ tokenHash });
    if (byTag) {
      if (byTag.ownerId.toString() !== userId) {
        byTag.ownerId = user!._id;
        await byTag.save();
      }
      cred = byTag;
    }
  }
  if (!cred) {
    const err = new Error(
      "No registered RFID card for this student. Run backend seed (npm run seed).",
    );
    (err as Error & { code: string; status: number }).code = "NO_RFID";
    (err as Error & { status: number }).status = 400;
    throw err;
  }

  let occurredAt = new Date();
  if (options.forceWindow) {
    const mission = await getActiveMission();
    if (mission) {
      occurredAt = demoOccurredAtForMission(mission);
    }
  }

  const active = await ParkingSession.findOne({
    userId,
    status: ParkingSessionStatus.ACTIVE,
  });
  if (active) {
    await processGateEvent({
      eventId: `sim_exit_${Date.now()}`,
      gateCode: gate.code,
      eventType: "EXIT",
      credentialRaw,
      occurredAt: new Date(occurredAt.getTime() - 60_000),
      source: GateEventSource.DEMO,
    });
  }

  const result = await processGateEvent({
    eventId: `sim_entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    gateCode: gate.code,
    eventType: "ENTRY",
    credentialRaw,
    occurredAt,
    source: GateEventSource.DEMO,
  });

  // Overview as-of simulated check-in so "completed today" matches the earn day
  const overview = await getStudentRewardsOverview(userId, occurredAt);
  return {
    gate: result,
    overview,
    rewards: result.rewards ?? null,
    simulated: true,
    note: "DEMO simulator — not a physical RFID scan",
    occurredAt: occurredAt.toISOString(),
  };
}
