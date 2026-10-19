import { Schema, model, type HydratedDocument } from "mongoose";

export type BlindPrize = {
  key: string;
  name: string;
  rarity: "common" | "lucky" | "rare" | "epic";
  /** Free parking days granted with this prize (0 = physical / voucher gift) */
  benefitDays: number;
  weight: number;
  /** Public path under frontend /gifts/... */
  image?: string;
};

const blindPrizeSchema = new Schema(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    rarity: {
      type: String,
      enum: ["common", "lucky", "rare", "epic"],
      default: "common",
    },
    benefitDays: { type: Number, required: true, min: 0 },
    weight: { type: Number, required: true, min: 1, default: 1 },
    image: { type: String, default: "" },
  },
  { _id: false },
);

const parkingRewardSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    pointsCost: { type: Number, required: true, min: 1 },
    benefitDays: { type: Number, required: true, min: 0 },
    validityDays: { type: Number, required: true, min: 1 },
    isBlindBox: { type: Boolean, default: false },
    blindPool: { type: [Number], default: undefined },
    blindPrizes: { type: [blindPrizeSchema], default: undefined },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type ParkingRewardDocument = HydratedDocument<{
  name: string;
  description: string;
  pointsCost: number;
  benefitDays: number;
  validityDays: number;
  isBlindBox: boolean;
  blindPool?: number[];
  blindPrizes?: BlindPrize[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}>;

export const ParkingReward = model("ParkingReward", parkingRewardSchema);

export function rollBlindPrize(reward: ParkingRewardDocument): BlindPrize {
  const prizes = (reward.blindPrizes ?? []).filter((p) => p && p.weight > 0);
  if (reward.isBlindBox && prizes.length > 0) {
    const total = prizes.reduce((sum, p) => sum + p.weight, 0);
    let tick = Math.random() * total;
    for (const prize of prizes) {
      tick -= prize.weight;
      if (tick <= 0) return prize;
    }
    return prizes[prizes.length - 1]!;
  }

  const pool = (reward.blindPool ?? []).filter((n) => Number.isFinite(n) && n >= 0);
  if (reward.isBlindBox && pool.length > 0) {
    const days = Math.max(0, Math.round(pool[Math.floor(Math.random() * pool.length)]!));
    return {
      key: `days_${days}`,
      name: days > 0 ? `${days} Free Parking Day${days === 1 ? "" : "s"}` : "Campus Stickers",
      rarity: days >= 3 ? "epic" : days >= 2 ? "rare" : "common",
      benefitDays: days,
      weight: 1,
      image: days > 0 ? "/gifts/gift-parking-pass.jpg" : "/gifts/gift-stickers.jpg",
    };
  }

  return {
    key: "fixed",
    name: reward.name,
    rarity: "common",
    benefitDays: reward.benefitDays,
    weight: 1,
    image: "/gifts/gift-parking-pass.jpg",
  };
}

export function toPublicParkingReward(reward: ParkingRewardDocument) {
  const prizes = reward.blindPrizes ?? [];
  const maxDays =
    reward.isBlindBox && prizes.length > 0
      ? Math.max(0, ...prizes.map((p) => p.benefitDays))
      : reward.benefitDays;

  return {
    id: reward._id.toString(),
    name: reward.name,
    description: reward.description,
    pointsCost: reward.pointsCost,
    benefitDays: maxDays,
    validityDays: reward.validityDays,
    isBlindBox: Boolean(reward.isBlindBox),
    prizePreview: reward.isBlindBox
      ? prizes.map((p) => ({
          key: p.key,
          name: p.name,
          rarity: p.rarity,
          benefitDays: p.benefitDays,
          image: p.image || "",
        }))
      : [],
    isActive: reward.isActive,
    sortOrder: reward.sortOrder,
  };
}
