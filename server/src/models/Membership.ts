import {
  Schema,
  model,
  type HydratedDocument,
  type Types,
} from "mongoose";
import { MembershipStatus } from "../types/enums.js";

const membershipSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(MembershipStatus),
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true },
);

export type MembershipDocument = HydratedDocument<{
  userId: Types.ObjectId;
  planId: Types.ObjectId;
  status: MembershipStatus;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}>;

export const Membership = model("Membership", membershipSchema);

export function toPublicMembership(
  membership: MembershipDocument,
  plan?: { name: string; durationDays: number },
) {
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (membership.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    ),
  );

  return {
    id: membership._id.toString(),
    userId: membership.userId.toString(),
    planId: membership.planId.toString(),
    planName: plan?.name,
    status: membership.status,
    startDate: membership.startDate.toISOString(),
    endDate: membership.endDate.toISOString(),
    endDateFormatted: membership.endDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    daysLeft,
    createdAt: membership.createdAt,
    updatedAt: membership.updatedAt,
  };
}
