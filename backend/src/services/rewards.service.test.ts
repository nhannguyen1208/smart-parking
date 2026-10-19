import { afterAll, beforeAll, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { GateDevice } from "../models/GateDevice.js";
import { GateEvent } from "../models/GateEvent.js";
import { ParkingLot, computeLotStatus } from "../models/ParkingLot.js";
import { ParkingReward } from "../models/ParkingReward.js";
import { ParkingSession } from "../models/ParkingSession.js";
import { RewardMission } from "../models/RewardMission.js";
import { RewardRedemption } from "../models/RewardRedemption.js";
import { RewardTransaction } from "../models/RewardTransaction.js";
import {
  displaySuffixFromRaw,
  hashCredentialToken,
  RfidCredential,
} from "../models/RfidCredential.js";
import { User } from "../models/User.js";
import { normalizePlate, Vehicle } from "../models/Vehicle.js";
import {
  GateDeviceMode,
  RfidCredentialType,
  UserRole,
  UserStatus,
} from "../types/enums.js";
import { processGateEvent } from "./parking.service.js";
import {
  evaluateMissionOnEntry,
  getPointsBalance,
  isWithinMissionWindow,
  redeemParkingReward,
} from "./rewards.service.js";
import { vnDateTodayAt } from "../utils/vnTime.js";

dotenv.config();

const uri = process.env.MONGODB_URI;
const run = uri ? describe : describe.skip;

run("Rewards service", () => {
  const gateCode = "GATE_REWARD_IN";
  const rawTag = "RFID-REWARD-001";
  let userId = "";
  let missionId = "";
  let rewardId = "";

  beforeAll(async () => {
    await mongoose.connect(uri!);
    await Promise.all([
      User.deleteMany({ studentId: "STU-REWARD" }),
      Vehicle.deleteMany({ plateNormalized: "43B188888" }),
      RfidCredential.deleteMany({ displaySuffix: displaySuffixFromRaw(rawTag) }),
      ParkingLot.deleteMany({ code: "LOT_REWARD" }),
      GateDevice.deleteMany({ code: gateCode }),
      GateEvent.deleteMany({ eventId: { $regex: /^reward_/ } }),
      ParkingSession.deleteMany({}),
      RewardMission.deleteMany({ name: "Test Early Arrival" }),
      ParkingReward.deleteMany({ name: "Test Weekly Pass" }),
      RewardTransaction.deleteMany({}),
      RewardRedemption.deleteMany({}),
    ]);

    const user = await User.create({
      studentId: "STU-REWARD",
      name: "Reward Student",
      email: "reward.test@vnuk.local",
      passwordHash: "x",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    });
    userId = user._id.toString();

    const vehicle = await Vehicle.create({
      ownerId: user._id,
      plateNumber: "43B1-88888",
      plateNormalized: normalizePlate("43B1-88888"),
      primary: true,
    });
    await RfidCredential.create({
      ownerId: user._id,
      vehicleId: vehicle._id,
      credentialType: RfidCredentialType.UHF_STICKER,
      tokenHash: hashCredentialToken(rawTag),
      displaySuffix: displaySuffixFromRaw(rawTag),
    });
    const lot = await ParkingLot.create({
      name: "Reward Lot",
      code: "LOT_REWARD",
      totalCapacity: 20,
      currentOccupancyEstimate: 0,
      status: computeLotStatus(20, 0),
    });
    await GateDevice.create({
      code: gateCode,
      name: "Reward Gate",
      lotId: lot._id,
      mode: GateDeviceMode.MOCK,
      enabled: true,
    });

    const mission = await RewardMission.create({
      name: "Test Early Arrival",
      description: "Test window",
      windowStart: "07:10",
      windowEnd: "07:20",
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      pointsAwarded: 10,
      dailyLimitPerStudent: 1,
      isActive: true,
      priority: 99,
    });
    missionId = mission._id.toString();

    const reward = await ParkingReward.create({
      name: "Test Weekly Pass",
      description: "5 days",
      pointsCost: 25,
      benefitDays: 5,
      validityDays: 14,
      isActive: true,
      sortOrder: 1,
    });
    rewardId = reward._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("detects inside vs outside mission window", async () => {
    const mission = await RewardMission.findById(missionId);
    expect(mission).toBeTruthy();
    const inside = vnDateTodayAt("07:15");
    const outside = vnDateTodayAt("09:00");
    expect(isWithinMissionWindow(mission!, inside)).toBe(true);
    expect(isWithinMissionWindow(mission!, outside)).toBe(false);
  });

  it("awards points for check-in inside the window", async () => {
    await RewardTransaction.deleteMany({ userId });
    const at = vnDateTodayAt("07:15");
    const r1 = await evaluateMissionOnEntry({
      userId,
      occurredAt: at,
      eventId: `reward_e1_${Date.now()}`,
    });
    expect(r1.awarded).toBe(true);
    expect(r1.points).toBe(10);
    expect(await getPointsBalance(userId)).toBe(10);
  });

  it("does not award outside the window", async () => {
    await RewardTransaction.deleteMany({ userId });
    const r = await evaluateMissionOnEntry({
      userId,
      occurredAt: vnDateTodayAt("12:00"),
      eventId: `reward_out_${Date.now()}`,
    });
    expect(r.awarded).toBe(false);
    expect(await getPointsBalance(userId)).toBe(0);
  });

  it("blocks duplicate awards the same day", async () => {
    await RewardTransaction.deleteMany({ userId });
    const at = vnDateTodayAt("07:12");
    const a = await evaluateMissionOnEntry({
      userId,
      occurredAt: at,
      eventId: `reward_d1_${Date.now()}`,
    });
    const b = await evaluateMissionOnEntry({
      userId,
      occurredAt: at,
      eventId: `reward_d2_${Date.now()}`,
    });
    expect(a.awarded).toBe(true);
    expect(b.awarded).toBe(false);
    expect(await getPointsBalance(userId)).toBe(10);
  });

  it("rejects redemption with insufficient points", async () => {
    await RewardTransaction.deleteMany({ userId });
    await expect(redeemParkingReward(userId, rewardId)).rejects.toMatchObject({
      code: "INSUFFICIENT_POINTS",
    });
  });

  it("redeems exactly once and records spend", async () => {
    await RewardTransaction.deleteMany({ userId });
    await RewardRedemption.deleteMany({ userId });
    await RewardTransaction.create({
      userId,
      points: 40,
      reason: "TEST_GRANT",
      description: "test",
      dayKey: "1970-01-02",
      kind: "EARN",
    });
    const result = await redeemParkingReward(userId, rewardId);
    expect(result.points).toBe(15);
    expect(result.redemption.rewardName).toBe("Test Weekly Pass");
    expect(await getPointsBalance(userId)).toBe(15);
  });

  it("rejects disabled rewards", async () => {
    await ParkingReward.findByIdAndUpdate(rewardId, { isActive: false });
    await RewardTransaction.create({
      userId,
      points: 100,
      reason: `TEST_GRANT_${Date.now()}`,
      dayKey: `1970-01-03`,
      kind: "EARN",
    });
    await expect(redeemParkingReward(userId, rewardId)).rejects.toMatchObject({
      code: "REWARD_UNAVAILABLE",
    });
    await ParkingReward.findByIdAndUpdate(rewardId, { isActive: true });
  });

  it("gate entry path awards through processGateEvent", async () => {
    await RewardTransaction.deleteMany({ userId });
    await ParkingSession.deleteMany({ userId });
    const at = vnDateTodayAt("07:18");
    const r = await processGateEvent({
      eventId: `reward_gate_${Date.now()}`,
      gateCode,
      eventType: "ENTRY",
      credentialRaw: rawTag,
      occurredAt: at,
    });
    expect(r.ok).toBe(true);
    expect(await getPointsBalance(userId)).toBe(10);
  });
});
