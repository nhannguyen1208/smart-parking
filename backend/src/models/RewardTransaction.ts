import { Schema, model, type HydratedDocument, type Types } from "mongoose";

const rewardSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    points: { type: Number, required: true },
    reason: { type: String, required: true },
    description: { type: String, default: "" },
    relatedEventId: { type: String, default: "" },
    dayKey: { type: String, index: true },
    missionId: { type: Schema.Types.ObjectId, ref: "RewardMission" },
    redemptionId: { type: Schema.Types.ObjectId, ref: "RewardRedemption" },
    kind: {
      type: String,
      enum: ["EARN", "SPEND"],
      default: "EARN",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

/** One earn per student/day/reason (mission) — blocks duplicate awards */
rewardSchema.index(
  { userId: 1, dayKey: 1, reason: 1 },
  { unique: true, sparse: true },
);

export type RewardTransactionDocument = HydratedDocument<{
  userId: Types.ObjectId;
  points: number;
  reason: string;
  description: string;
  relatedEventId: string;
  dayKey?: string;
  missionId?: Types.ObjectId;
  redemptionId?: Types.ObjectId;
  kind: "EARN" | "SPEND";
  createdAt: Date;
}>;

export const RewardTransaction = model("RewardTransaction", rewardSchema);

export function toPublicRewardTx(tx: {
  _id: { toString(): string };
  points: number;
  reason: string;
  description?: string | null;
  kind?: "EARN" | "SPEND" | null;
  dayKey?: string | null;
  missionId?: { toString(): string } | null;
  redemptionId?: { toString(): string } | null;
  relatedEventId?: string | null;
  createdAt: Date;
}) {
  return {
    id: tx._id.toString(),
    points: tx.points,
    reason: tx.reason,
    description: tx.description || tx.reason,
    kind: tx.kind || (tx.points >= 0 ? "EARN" : "SPEND"),
    dayKey: tx.dayKey ?? null,
    missionId: tx.missionId?.toString() ?? null,
    redemptionId: tx.redemptionId?.toString() ?? null,
    relatedEventId: tx.relatedEventId || null,
    createdAt: tx.createdAt.toISOString(),
  };
}
