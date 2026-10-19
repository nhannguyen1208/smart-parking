import { afterAll, beforeAll, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { GateDevice } from "../models/GateDevice.js";
import { GateEvent } from "../models/GateEvent.js";
import { ParkingLot, computeLotStatus } from "../models/ParkingLot.js";
import { ParkingSession } from "../models/ParkingSession.js";
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

dotenv.config();

const uri = process.env.MONGODB_URI;
const run = uri ? describe : describe.skip;

run("ParkingService integration", () => {
  let gateCode = "GATE_TEST_IN";
  let rawTag = "RFID-TEST-001";

  beforeAll(async () => {
    await mongoose.connect(uri!);
    await Promise.all([
      User.deleteMany({ studentId: "STU-TEST" }),
      Vehicle.deleteMany({ plateNormalized: "43B199999" }),
      RfidCredential.deleteMany({ displaySuffix: "T001" }),
      ParkingLot.deleteMany({ code: "LOT_TEST" }),
      GateDevice.deleteMany({ code: gateCode }),
      GateEvent.deleteMany({ eventId: { $regex: /^test_/ } }),
      ParkingSession.deleteMany({}),
    ]);

    const user = await User.create({
      studentId: "STU-TEST",
      name: "Test Student",
      email: "test.parkwise@vnuk.local",
      passwordHash: "x",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    });
    const vehicle = await Vehicle.create({
      ownerId: user._id,
      plateNumber: "43B1-99999",
      plateNormalized: normalizePlate("43B1-99999"),
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
      name: "Test Lot",
      code: "LOT_TEST",
      totalCapacity: 10,
      currentOccupancyEstimate: 0,
      status: computeLotStatus(10, 0),
    });
    await GateDevice.create({
      code: gateCode,
      name: "Test Gate",
      lotId: lot._id,
      mode: GateDeviceMode.MOCK,
      enabled: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("accepts entry and increments occupancy once", async () => {
    const eventId = `test_entry_${Date.now()}`;
    const r1 = await processGateEvent({
      eventId,
      gateCode,
      eventType: "ENTRY",
      credentialRaw: rawTag,
    });
    expect(r1.ok).toBe(true);
    expect(r1.result).toBe("ALLOWED");

    const r2 = await processGateEvent({
      eventId,
      gateCode,
      eventType: "ENTRY",
      credentialRaw: rawTag,
    });
    expect(r2.duplicate).toBe(true);

    const lot = await ParkingLot.findOne({ code: "LOT_TEST" });
    expect(lot?.currentOccupancyEstimate).toBe(1);
  });

  it("denies suspended credential without changing occupancy", async () => {
    await RfidCredential.updateOne(
      { tokenHash: hashCredentialToken(rawTag) },
      { status: "SUSPENDED" },
    );
    const before = await ParkingLot.findOne({ code: "LOT_TEST" });
    const occ = before?.currentOccupancyEstimate ?? 0;
    const r = await processGateEvent({
      eventId: `test_deny_${Date.now()}`,
      gateCode,
      eventType: "ENTRY",
      credentialRaw: rawTag,
    });
    expect(r.denied).toBe(true);
    const after = await ParkingLot.findOne({ code: "LOT_TEST" });
    expect(after?.currentOccupancyEstimate).toBe(occ);
    await RfidCredential.updateOne(
      { tokenHash: hashCredentialToken(rawTag) },
      { status: "ACTIVE" },
    );
  });
});
