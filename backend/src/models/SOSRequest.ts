import { Schema, model, type HydratedDocument, Types } from "mongoose";
import { SosStatus } from "../types/enums.js";

const sosSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle" },
    type: { type: String, required: true },
    description: { type: String, default: "" },
    coarseLocation: { type: String, default: "" },
    status: {
      type: String,
      enum: Object.values(SosStatus),
      default: SosStatus.OPEN,
      index: true,
    },
    assignedOperatorId: { type: Schema.Types.ObjectId, ref: "User" },
    statusHistory: [
      {
        status: String,
        at: { type: Date, default: Date.now },
        by: { type: Schema.Types.ObjectId, ref: "User" },
        note: String,
      },
    ],
  },
  { timestamps: true },
);

export type SOSRequestDocument = HydratedDocument<{
  userId: Types.ObjectId;
  vehicleId?: Types.ObjectId;
  type: string;
  description: string;
  coarseLocation: string;
  status: SosStatus;
  assignedOperatorId?: Types.ObjectId;
  statusHistory: Array<{
    status: string;
    at: Date;
    by?: Types.ObjectId;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}>;

export const SOSRequest = model("SOSRequest", sosSchema);
