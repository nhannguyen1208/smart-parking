import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { FeeRecord } from "../models/FeeRecord.js";
import { GateDevice } from "../models/GateDevice.js";
import { GateEvent } from "../models/GateEvent.js";
import { GuestPass } from "../models/GuestPass.js";
import { Membership } from "../models/Membership.js";
import { MembershipPlan } from "../models/MembershipPlan.js";
import {
  computeLotStatus,
  ParkingLot,
} from "../models/ParkingLot.js";
import { ParkingSession } from "../models/ParkingSession.js";
import {
  displaySuffixFromRaw,
  hashCredentialToken,
  RfidCredential,
} from "../models/RfidCredential.js";
import { ParkingReward } from "../models/ParkingReward.js";
import { RewardMission } from "../models/RewardMission.js";
import { RewardRedemption } from "../models/RewardRedemption.js";
import { RewardTransaction } from "../models/RewardTransaction.js";
import { SOSRequest } from "../models/SOSRequest.js";
import { SystemSetting } from "../models/SystemSetting.js";
import { User } from "../models/User.js";
import { normalizePlate, Vehicle } from "../models/Vehicle.js";
import {
  FeeRecordStatus,
  GateDeviceMode,
  MembershipStatus,
  RfidCredentialType,
  UserRole,
  UserStatus,
} from "../types/enums.js";

dotenv.config();

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required");

  await mongoose.connect(uri);
  console.log("Connected to MongoDB for ParkWise seed");

  await Promise.all([
    User.deleteMany({}),
    MembershipPlan.deleteMany({}),
    Membership.deleteMany({}),
    Vehicle.deleteMany({}),
    RfidCredential.deleteMany({}),
    ParkingLot.deleteMany({}),
    GateDevice.deleteMany({}),
    GateEvent.deleteMany({}),
    ParkingSession.deleteMany({}),
    FeeRecord.deleteMany({}),
    GuestPass.deleteMany({}),
    RewardTransaction.deleteMany({}),
    RewardMission.deleteMany({}),
    ParkingReward.deleteMany({}),
    RewardRedemption.deleteMany({}),
    SOSRequest.deleteMany({}),
    SystemSetting.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash("password123", 10);

  const [nhi, tan, nghia, guard, admin] = await User.create([
    {
      studentId: "STU-NHI",
      name: "Phạm Trần Thảo Nhi",
      email: "nhi.demo@vnuk.local",
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      vehicleNumber: "43B1-11111",
      vehicleType: "Honda Vision",
    },
    {
      studentId: "STU-TAN",
      name: "Nguyễn Viết Tân",
      email: "tan.demo@vnuk.local",
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      vehicleNumber: "43B1-22222",
      vehicleType: "Yamaha Janus",
    },
    {
      studentId: "STU-NGHIA",
      name: "Nguyễn Đình Nghĩa",
      email: "nghia.demo@vnuk.local",
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      vehicleNumber: "43B1-33333",
      vehicleType: "Honda Air Blade",
    },
    {
      studentId: "G-1001",
      name: "Campus Guard",
      email: "guard001@vnuk.local",
      passwordHash,
      role: UserRole.GUARD,
      status: UserStatus.ACTIVE,
    },
    {
      studentId: "A-9001",
      name: "System Admin",
      email: "admin001@vnuk.local",
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  ]);

  const plans = await MembershipPlan.create([
    {
      name: "Daily pass",
      description: "1 day campus parking — includes Backup Pass while active",
      durationDays: 1,
      price: 10000,
      features: [
        "Campus parking access",
        "RFID entry",
        "Backup Pass (lost/forgot card — earns Rewards)",
      ],
      isActive: true,
    },
    {
      name: "Monthly pass",
      description: "30 days campus parking — includes Backup Pass while active",
      durationDays: 30,
      price: 30000,
      features: [
        "Campus parking access",
        "RFID entry",
        "Backup Pass (lost/forgot card — earns Rewards)",
      ],
      isActive: true,
    },
  ]);

  // Nhi has monthly plan so Backup Pass works in demo; Tân/Nghĩa have none
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  await Membership.create({
    userId: nhi._id,
    planId: plans[1]._id,
    status: MembershipStatus.ACTIVE,
    startDate: new Date(),
    endDate,
  });

  const vehicles = await Vehicle.create([
    {
      ownerId: nhi._id,
      plateNumber: "43B1-11111",
      plateNormalized: normalizePlate("43B1-11111"),
      make: "Honda Vision",
      color: "White",
      primary: true,
    },
    {
      ownerId: tan._id,
      plateNumber: "43B1-22222",
      plateNormalized: normalizePlate("43B1-22222"),
      make: "Yamaha Janus",
      color: "Blue",
      primary: true,
    },
    {
      ownerId: nghia._id,
      plateNumber: "43B1-33333",
      plateNormalized: normalizePlate("43B1-33333"),
      make: "Honda Air Blade",
      color: "Black",
      primary: true,
    },
  ]);

  const tags = [
    { user: nhi, vehicle: vehicles[0], raw: "RFID-NHI-001" },
    { user: tan, vehicle: vehicles[1], raw: "RFID-TAN-001" },
    { user: nghia, vehicle: vehicles[2], raw: "RFID-NGHIA-001" },
  ];

  for (const t of tags) {
    await RfidCredential.create({
      ownerId: t.user._id,
      vehicleId: t.vehicle._id,
      credentialType: RfidCredentialType.UHF_STICKER,
      tokenHash: hashCredentialToken(t.raw),
      displaySuffix: displaySuffixFromRaw(t.raw),
    });
  }

  const lots = await ParkingLot.create([
    {
      name: "Lot A · Main Gate",
      code: "LOT_A",
      locationDescription: "Near library / main entrance",
      totalCapacity: 40,
      currentOccupancyEstimate: 28,
      status: computeLotStatus(40, 28),
      nearlyFullThresholdPct: 85,
    },
    {
      name: "Lot B · Sports Hall",
      code: "LOT_B",
      locationDescription: "Behind sports complex",
      totalCapacity: 60,
      currentOccupancyEstimate: 52,
      status: computeLotStatus(60, 52),
      nearlyFullThresholdPct: 85,
    },
  ]);

  await GateDevice.create([
    {
      code: "GATE_A_IN",
      name: "Lot A Entry",
      lotId: lots[0]._id,
      type: "ENTRY",
      mode: GateDeviceMode.MOCK,
      enabled: true,
      lastHeartbeatAt: new Date(),
    },
    {
      code: "GATE_A_OUT",
      name: "Lot A Exit",
      lotId: lots[0]._id,
      type: "EXIT",
      mode: GateDeviceMode.MOCK,
      enabled: true,
      lastHeartbeatAt: new Date(),
    },
    {
      code: "GATE_B_IN",
      name: "Lot B Entry",
      lotId: lots[1]._id,
      type: "ENTRY",
      mode: GateDeviceMode.MOCK,
      enabled: true,
      lastHeartbeatAt: new Date(),
    },
  ]);

  await FeeRecord.create({
    userId: nhi._id,
    amount: 5000,
    currency: "VND",
    feeType: "DAILY_SAMPLE",
    status: FeeRecordStatus.DEMO,
    paymentMethod: "mock",
    labelledSample: true,
    period: "sample-seed",
  });

  await SystemSetting.create([
    { key: "FEATURE_GUEST_PASS", enabled: true, config: {} },
    { key: "FEATURE_KILL_SWITCH", enabled: true, config: {} },
    { key: "FEATURE_SOS", enabled: true, config: {} },
    { key: "FEATURE_REWARDS", enabled: true, config: { cutoff: "07:00", points: 10 } },
  ]);

  await RewardMission.create({
    name: "Early Arrival Challenge",
    description:
      "Arrive during today's selected time window and earn 10 points.",
    windowStart: "07:10",
    windowEnd: "07:20",
    daysOfWeek: [1, 2, 3, 4, 5],
    pointsAwarded: 10,
    dailyLimitPerStudent: 1,
    isActive: true,
    priority: 10,
  });

  await ParkingReward.create([
    {
      name: "Common Blind Box",
      description: "Mystery campus gifts — stickers, badges, or 1 free day.",
      pointsCost: 30,
      benefitDays: 1,
      validityDays: 7,
      isBlindBox: true,
      sortOrder: 1,
      isActive: true,
      blindPrizes: [
        { key: "sticker", name: "Campus Sticker Pack", rarity: "common", benefitDays: 0, weight: 4 },
        { key: "badge", name: "Gate Badge Pin", rarity: "common", benefitDays: 0, weight: 3 },
        { key: "day1", name: "1 Free Parking Day", rarity: "lucky", benefitDays: 1, weight: 2 },
      ],
    },
    {
      name: "Lucky Blind Box",
      description: "Lucky pulls — snacks, express tip, or free parking.",
      pointsCost: 50,
      benefitDays: 1,
      validityDays: 10,
      isBlindBox: true,
      sortOrder: 2,
      isActive: true,
      blindPrizes: [
        { key: "snack", name: "Mini Snack Voucher", rarity: "common", benefitDays: 0, weight: 3 },
        { key: "sticker_gold", name: "Gold Sticker Set", rarity: "lucky", benefitDays: 0, weight: 3 },
        { key: "day1", name: "1 Free Parking Day", rarity: "lucky", benefitDays: 1, weight: 3 },
        { key: "express", name: "Express Lane Tip Card", rarity: "rare", benefitDays: 0, weight: 1 },
      ],
    },
    {
      name: "Rare Blind Box",
      description: "Rarer campus loot — coffee or free parking day.",
      pointsCost: 80,
      benefitDays: 2,
      validityDays: 12,
      isBlindBox: true,
      sortOrder: 3,
      isActive: true,
      blindPrizes: [
        { key: "coffee", name: "Campus Coffee Voucher", rarity: "rare", benefitDays: 0, weight: 3 },
        { key: "day1", name: "1 Free Parking Day", rarity: "lucky", benefitDays: 1, weight: 3 },
        { key: "day2", name: "2 Free Parking Days", rarity: "rare", benefitDays: 2, weight: 2 },
        { key: "tee", name: "ParkWise Tee Coupon", rarity: "epic", benefitDays: 0, weight: 1 },
      ],
    },
    {
      name: "Epic Blind Box",
      description: "Top-tier mystery — merch or up to 3 free days.",
      pointsCost: 120,
      benefitDays: 3,
      validityDays: 14,
      isBlindBox: true,
      sortOrder: 4,
      isActive: true,
      blindPrizes: [
        { key: "hoodie", name: "ParkWise Hoodie Coupon", rarity: "epic", benefitDays: 0, weight: 2 },
        { key: "day1", name: "1 Free Parking Day", rarity: "lucky", benefitDays: 1, weight: 3 },
        { key: "day2", name: "2 Free Parking Days", rarity: "rare", benefitDays: 2, weight: 3 },
        { key: "day3", name: "3 Free Parking Days", rarity: "epic", benefitDays: 3, weight: 2 },
      ],
    },
  ]);

  await RewardTransaction.create({
    userId: nhi._id,
    points: 80,
    reason: "SEED_BONUS",
    description: "Welcome bonus (seed demo)",
    dayKey: "1970-01-01",
    kind: "EARN",
  });

  console.log("ParkWise seed complete (LOCAL DEMO ONLY)");
  console.log("Students: STU-NHI / STU-TAN / STU-NGHIA — password: password123");
  console.log("Guard: G-1001 or guard001@vnuk.local — password: password123");
  console.log("Admin: A-9001 or admin001@vnuk.local — password: password123");
  console.log("RFID demo tags: RFID-NHI-001, RFID-TAN-001, RFID-NGHIA-001");
  console.log("Rewards: Early Arrival 07:10–07:20 (+10) · Blind boxes · Nhi starts with 80 pts");

  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
