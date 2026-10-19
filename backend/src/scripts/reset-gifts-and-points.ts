import mongoose from "mongoose";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { RewardTransaction } from "../models/RewardTransaction.js";
import { RewardRedemption } from "../models/RewardRedemption.js";
import { ParkingReward } from "../models/ParkingReward.js";
import { getPointsBalance } from "../services/rewards.service.js";

const studentId = process.argv[2] || "STU-NHI";
const amount = Number(process.argv[3] || 800);

/** Clearer prize ladder — physical gifts + parking, each box distinct */
const blinds = [
  {
    name: "Common Blind Box",
    description: "Everyday campus gifts — stickers or a water bottle.",
    pointsCost: 30,
    benefitDays: 0,
    validityDays: 14,
    isBlindBox: true,
    sortOrder: 1,
    blindPrizes: [
      {
        key: "stickers",
        name: "Campus Sticker Pack",
        rarity: "common",
        benefitDays: 0,
        weight: 5,
        image: "/gifts/gift-stickers.jpg",
      },
      {
        key: "water",
        name: "Campus Water Bottle",
        rarity: "lucky",
        benefitDays: 0,
        weight: 3,
        image: "/gifts/gift-water-bottle.jpg",
      },
      {
        key: "snack",
        name: "Campus Snack Pack",
        rarity: "common",
        benefitDays: 0,
        weight: 3,
        image: "/gifts/gift-snack.jpg",
      },
    ],
  },
  {
    name: "Lucky Blind Box",
    description: "Cute pulls — teddy, coffee, or snack.",
    pointsCost: 50,
    benefitDays: 0,
    validityDays: 14,
    isBlindBox: true,
    sortOrder: 2,
    blindPrizes: [
      {
        key: "teddy",
        name: "Mini Teddy Bear",
        rarity: "lucky",
        benefitDays: 0,
        weight: 4,
        image: "/gifts/gift-teddy-bear.jpg",
      },
      {
        key: "coffee",
        name: "Campus Coffee Voucher",
        rarity: "rare",
        benefitDays: 0,
        weight: 3,
        image: "/gifts/gift-coffee.jpg",
      },
      {
        key: "water",
        name: "Campus Water Bottle",
        rarity: "lucky",
        benefitDays: 0,
        weight: 3,
        image: "/gifts/gift-water-bottle.jpg",
      },
      {
        key: "snack",
        name: "Campus Snack Pack",
        rarity: "common",
        benefitDays: 0,
        weight: 2,
        image: "/gifts/gift-snack.jpg",
      },
    ],
  },
  {
    name: "Rare Blind Box",
    description: "Better loot — coffee, teddy, or 1 free parking day.",
    pointsCost: 80,
    benefitDays: 1,
    validityDays: 14,
    isBlindBox: true,
    sortOrder: 3,
    blindPrizes: [
      {
        key: "coffee",
        name: "Campus Coffee Voucher",
        rarity: "rare",
        benefitDays: 0,
        weight: 3,
        image: "/gifts/gift-coffee.jpg",
      },
      {
        key: "teddy",
        name: "Plush Teddy Bear",
        rarity: "rare",
        benefitDays: 0,
        weight: 3,
        image: "/gifts/gift-teddy-bear.jpg",
      },
      {
        key: "day1",
        name: "1 Free Parking Day",
        rarity: "lucky",
        benefitDays: 1,
        weight: 3,
        image: "/gifts/gift-parking-pass.jpg",
      },
      {
        key: "hoodie",
        name: "ParkWise Hoodie Coupon",
        rarity: "epic",
        benefitDays: 0,
        weight: 1,
        image: "/gifts/gift-hoodie.jpg",
      },
    ],
  },
  {
    name: "Epic Blind Box",
    description: "Top prizes — hoodie, giant teddy, or free parking days.",
    pointsCost: 120,
    benefitDays: 3,
    validityDays: 21,
    isBlindBox: true,
    sortOrder: 4,
    blindPrizes: [
      {
        key: "hoodie",
        name: "ParkWise Hoodie",
        rarity: "epic",
        benefitDays: 0,
        weight: 3,
        image: "/gifts/gift-hoodie.jpg",
      },
      {
        key: "teddy_xl",
        name: "Giant Teddy Bear",
        rarity: "epic",
        benefitDays: 0,
        weight: 2,
        image: "/gifts/gift-teddy-bear.jpg",
      },
      {
        key: "day2",
        name: "2 Free Parking Days",
        rarity: "rare",
        benefitDays: 2,
        weight: 3,
        image: "/gifts/gift-parking-pass.jpg",
      },
      {
        key: "day3",
        name: "3 Free Parking Days",
        rarity: "epic",
        benefitDays: 3,
        weight: 2,
        image: "/gifts/gift-parking-pass.jpg",
      },
    ],
  },
];

await mongoose.connect(env.MONGODB_URI);

const user = await User.findOne({ studentId });
if (!user) {
  console.error(`User ${studentId} not found`);
  process.exit(1);
}

const clearedGifts = await RewardRedemption.deleteMany({ userId: user._id });

await ParkingReward.updateMany({}, { $set: { isActive: false } });
for (const box of blinds) {
  await ParkingReward.findOneAndUpdate(
    { name: box.name },
    { ...box, isActive: true, blindPool: undefined },
    { upsert: true, new: true },
  );
}

await RewardTransaction.create({
  userId: user._id,
  points: amount,
  reason: `TEST_GRANT_${Date.now()}`,
  description: `Test points top-up (+${amount})`,
  dayKey: `test-${Date.now()}`,
  kind: "EARN",
});

const points = await getPointsBalance(user._id.toString());
const boxes = await ParkingReward.find({ isActive: true })
  .sort({ sortOrder: 1 })
  .select("name pointsCost blindPrizes");

console.log({
  studentId,
  clearedGifts: clearedGifts.deletedCount,
  addedPoints: amount,
  points,
  boxes: boxes.map((b) => ({
    name: b.name,
    pts: b.pointsCost,
    prizes: (b.blindPrizes ?? []).map((p) => p.name),
  })),
});

await mongoose.disconnect();
