import { Schema, model, type HydratedDocument, type Types } from "mongoose";

export enum RedemptionStatus {
  ACTIVE = "ACTIVE",
  EXHAUSTED = "EXHAUSTED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

const rewardRedemptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rewardId: {
      type: Schema.Types.ObjectId,
      ref: "ParkingReward",
      required: true,
    },
    pointsSpent: { type: Number, required: true },
    benefitDaysTotal: { type: Number, required: true },
    benefitDaysRemaining: { type: Number, required: true },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(RedemptionStatus),
      default: RedemptionStatus.ACTIVE,
    },
    rewardName: { type: String, required: true },
    prizeImage: { type: String, default: "" },
    prizeKey: { type: String, default: "" },
  },
  { timestamps: true },
);

export type RewardRedemptionDocument = HydratedDocument<{
  userId: Types.ObjectId;
  rewardId: Types.ObjectId;
  pointsSpent: number;
  benefitDaysTotal: number;
  benefitDaysRemaining: number;
  validFrom: Date;
  validUntil: Date;
  status: RedemptionStatus;
  rewardName: string;
  prizeImage?: string;
  prizeKey?: string;
  createdAt: Date;
  updatedAt: Date;
}>;

export const RewardRedemption = model("RewardRedemption", rewardRedemptionSchema);

export function toPublicRedemption(row: RewardRedemptionDocument) {
  return {
    id: row._id.toString(),
    rewardId: row.rewardId.toString(),
    rewardName: row.rewardName,
    prizeImage: row.prizeImage || "",
    prizeKey: row.prizeKey || "",
    pointsSpent: row.pointsSpent,
    benefitDaysTotal: row.benefitDaysTotal,
    benefitDaysRemaining: row.benefitDaysRemaining,
    validFrom: row.validFrom.toISOString(),
    validUntil: row.validUntil.toISOString(),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}
