import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Membership } from "../models/Membership.js";
import { MembershipPlan } from "../models/MembershipPlan.js";
import {
  ParkingZone,
  computeZoneStatus,
} from "../models/ParkingZone.js";
import { User } from "../models/User.js";
import { MembershipStatus, UserRole } from "../types/enums.js";

dotenv.config();

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB for seeding");

  await Promise.all([
    User.deleteMany({}),
    MembershipPlan.deleteMany({}),
    Membership.deleteMany({}),
    ParkingZone.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash("password123", 10);

  const [student, guard, admin] = await User.create([
    {
      studentId: "22040002",
      name: "Minh",
      email: "student001@example.com",
      passwordHash,
      role: UserRole.STUDENT,
      vehicleNumber: "59X1-12345",
      vehicleType: "Honda Vision",
    },
    {
      studentId: "G-1001",
      name: "Campus Guard",
      email: "guard001@example.com",
      passwordHash,
      role: UserRole.GUARD,
    },
    {
      studentId: "A-9001",
      name: "System Admin",
      email: "admin001@example.com",
      passwordHash,
      role: UserRole.ADMIN,
    },
  ]);

  const plans = await MembershipPlan.create([
    {
      name: "1 Month",
      description: "30 days of campus parking access",
      durationDays: 30,
      price: 100000,
      features: ["Campus parking access", "RFID entry", "QR backup pass"],
      isActive: true,
    },
    {
      name: "3 Months",
      description: "90 days of campus parking access",
      durationDays: 90,
      price: 270000,
      features: ["Campus parking access", "RFID entry", "QR backup pass", "Parking insights"],
      isActive: true,
    },
    {
      name: "Semester",
      description: "Full semester campus parking access",
      durationDays: 120,
      price: 450000,
      features: ["Campus parking access", "RFID entry", "QR backup pass", "Priority support"],
      isActive: true,
    },
  ]);

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 3);

  await Membership.create({
    userId: student._id,
    planId: plans[0]._id,
    status: MembershipStatus.ACTIVE,
    startDate,
    endDate,
  });

  const zones = [
    { name: "Zone A", capacity: 40, occupied: 30 },
    { name: "Zone B", capacity: 60, occupied: 45 },
    { name: "Zone C", capacity: 40, occupied: 33 },
  ];

  await ParkingZone.insertMany(
    zones.map((zone) => ({
      ...zone,
      isActive: true,
      status: computeZoneStatus(zone.capacity, zone.occupied),
    })),
  );

  console.log("Seed completed");
  console.log("Demo accounts:");
  console.log("  student001@example.com / password123 (studentId: 22040002)");
  console.log("  guard001@example.com / password123");
  console.log("  admin001@example.com / password123");
  console.log(`Created ${plans.length} plans, ${zones.length} zones`);

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
