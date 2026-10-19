import { Schema, model, type HydratedDocument } from "mongoose";

const membershipPlanSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    durationDays: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type MembershipPlanDocument = HydratedDocument<{
  name: string;
  description: string;
  durationDays: number;
  price: number;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}>;

export const MembershipPlan = model("MembershipPlan", membershipPlanSchema);

export function toPublicPlan(plan: MembershipPlanDocument) {
  return {
    id: plan._id.toString(),
    name: plan.name,
    description: plan.description,
    durationDays: plan.durationDays,
    price: plan.price,
    priceFormatted: `${plan.price.toLocaleString("vi-VN")} VND`,
    features: plan.features,
    isActive: plan.isActive,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}
