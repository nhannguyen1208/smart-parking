import { Schema, model, type HydratedDocument, Types } from "mongoose";
import { FeeRecordStatus } from "../types/enums.js";

const feeRecordSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "ParkingSession", index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "VND" },
    feeType: { type: String, default: "DAILY_SAMPLE" },
    period: { type: String, default: "" },
    status: {
      type: String,
      enum: Object.values(FeeRecordStatus),
      default: FeeRecordStatus.DEMO,
    },
    paymentMethod: { type: String, default: "mock" },
    providerReference: { type: String, default: "" },
    settledAt: { type: Date },
    labelledSample: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type FeeRecordDocument = HydratedDocument<{
  userId: Types.ObjectId;
  sessionId?: Types.ObjectId;
  amount: number;
  currency: string;
  feeType: string;
  period: string;
  status: FeeRecordStatus;
  paymentMethod: string;
  providerReference: string;
  settledAt?: Date;
  labelledSample: boolean;
  createdAt: Date;
  updatedAt: Date;
}>;

export const FeeRecord = model("FeeRecord", feeRecordSchema);
