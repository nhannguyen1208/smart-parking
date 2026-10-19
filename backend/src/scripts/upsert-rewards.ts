import mongoose from "mongoose";
import { env } from "../config/env.js";
import { ParkingReward } from "../models/ParkingReward.js";

const blinds = [
  {
    name: "Common Blind Box",
    description: "Cute campus gifts — stickers, water bottle, or a free day.",
    pointsCost: 30,
    benefitDays: 1,
    validityDays: 7,
    isBlindBox: true,
    sortOrder: 1,
    blindPrizes: [
      {
        key: "stickers",
        name: "Campus Sticker Pack",
        rarity: "common",
        benefitDays: 0,
        weight: 3,
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
        key: "day1",
        name: "1 Free Parking Day",
        rarity: "lucky",
        benefitDays: 1,
        weight: 2,
        image: "/gifts/gift-parking-pass.jpg",
      },
    ],
  },
  {
    name: "Lucky Blind Box",
    description: "Lucky pulls — snack, teddy, coffee, or free parking.",
    pointsCost: 50,
    benefitDays: 1,
    validityDays: 10,
    isBlindBox: true,
    sortOrder: 2,
    blindPrizes: [
      {
        key: "snack",
        name: "Campus Snack Pack",
        rarity: "common",
        benefitDays: 0,
        weight: 3,
        image: "/gifts/gift-snack.jpg",
      },
      {
        key: "teddy",
        name: "Mini Teddy Bear",
        rarity: "lucky",
        benefitDays: 0,
        weight: 3,
        image: "/gifts/gift-teddy-bear.jpg",
      },
      {
        key: "coffee",
        name: "Campus Coffee Voucher",
        rarity: "rare",
        benefitDays: 0,
        weight: 2,
        image: "/gifts/gift-coffee.jpg",
      },
      {
        key: "day1",
        name: "1 Free Parking Day",
        rarity: "lucky",
        benefitDays: 1,
        weight: 2,
        image: "/gifts/gift-parking-pass.jpg",
      },
    ],
  },
  {
    name: "Rare Blind Box",
    description: "Rarer loot — coffee, teddy, hoodie coupon, or free days.",
    pointsCost: 80,
    benefitDays: 2,
    validityDays: 12,
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
        weight: 2,
        image: "/gifts/gift-teddy-bear.jpg",
      },
      {
        key: "water",
        name: "Campus Water Bottle",
        rarity: "lucky",
        benefitDays: 0,
        weight: 2,
        image: "/gifts/gift-water-bottle.jpg",
      },
      {
        key: "day2",
        name: "2 Free Parking Days",
        rarity: "rare",
        benefitDays: 2,
        weight: 2,
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
    description: "Top-tier mystery — hoodie, teddy, or up to 3 free days.",
    pointsCost: 120,
    benefitDays: 3,
    validityDays: 14,
    isBlindBox: true,
    sortOrder: 4,
    blindPrizes: [
      {
        key: "hoodie",
        name: "ParkWise Hoodie",
        rarity: "epic",
        benefitDays: 0,
        weight: 2,
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

await ParkingReward.updateMany(
  { name: { $nin: blinds.map((b) => b.name) } },
  { $set: { isActive: false } },
);

for (const box of blinds) {
  await ParkingReward.findOneAndUpdate(
    { name: box.name },
    { ...box, isActive: true, blindPool: undefined },
    { upsert: true, new: true },
  );
}

const all = await ParkingReward.find({ isActive: true }).sort({ sortOrder: 1 });
console.log(
  all.map((row) => ({
    name: row.name,
    prizes: (row.blindPrizes ?? []).map((p) => `${p.name} (${p.image})`),
  })),
);
await mongoose.disconnect();
